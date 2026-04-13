import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import BibleChapters from '../../components/bible/BibleChapters';
import type { BooksCatalog } from '../../components/bible/bibleTypes';
import { bibleStyles as s } from '../../components/bible/bible.styles';
import { useBibleVersion } from './BibleReadingContext';
import { styles as studyStyles } from './bibleStudy.styles';

/**
 * `/sala-pastoral/livro/:book` — capítulos do livro (grade numerada).
 */
export default function BibleBookPage() {
  const { book: bookParam } = useParams<{ book: string }>();
  const navigate = useNavigate();
  const { version, setVersion } = useBibleVersion();

  const [catalog, setCatalog] = useState<BooksCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterReadCounts, setChapterReadCounts] = useState<Record<number, number>>({});
  const [verseTotalsByChapter, setVerseTotalsByChapter] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<BooksCatalog>('/bible/books');
        if (!cancelled) setCatalog(data);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        if (!cancelled) setError(msg || 'Não foi possível carregar os dados do livro.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bookKey = bookParam ? decodeURIComponent(bookParam).toLowerCase() : '';

  const meta = useMemo(() => {
    if (!catalog || !bookKey) return null;
    const all = [...catalog.oldTestament, ...catalog.newTestament];
    return all.find((b) => b.abbrev.toLowerCase() === bookKey) ?? null;
  }, [catalog, bookKey]);

  useEffect(() => {
    if (!meta) return;
    setChapterReadCounts({});
    setVerseTotalsByChapter([]);
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{
          byChapter?: Record<string, number>;
          verseTotals?: number[];
        }>('/bible/read-progress/by-book', {
          params: { version, book: meta.abbrev },
        });
        const raw = data?.byChapter ?? {};
        const next: Record<number, number> = {};
        for (const [ch, cnt] of Object.entries(raw)) {
          const n = Number(ch);
          if (Number.isInteger(n) && n >= 1) next[n] = Number(cnt) || 0;
        }
        const totals = Array.isArray(data?.verseTotals) ? data.verseTotals.map((x) => Number(x) || 0) : [];
        if (!cancelled) {
          setChapterReadCounts(next);
          setVerseTotalsByChapter(totals);
        }
      } catch {
        if (!cancelled) {
          setChapterReadCounts({});
          setVerseTotalsByChapter([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meta, version]);

  if (loading) {
    return (
      <div style={s.pageWrap}>
        <div style={s.loadingBox}>
          <div className="spinner" />
          Carregando livro…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.pageWrap}>
        <header style={s.headerRow}>
          <button type="button" style={s.backBtn} onClick={() => navigate('/sala-pastoral')}>
            <FiArrowLeft aria-hidden />
            Voltar
          </button>
        </header>
        <div style={s.errorBox} role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div style={s.pageWrap}>
        <header style={s.headerRow}>
          <button type="button" style={s.backBtn} onClick={() => navigate('/sala-pastoral')}>
            <FiArrowLeft aria-hidden />
            Voltar
          </button>
        </header>
        <div style={s.errorBox} role="alert">
          Livro não encontrado. Verifique o endereço ou volte à lista de livros.
        </div>
      </div>
    );
  }

  return (
    <div style={s.pageWrap}>
      <header style={s.headerRow}>
        <button type="button" style={s.backBtn} onClick={() => navigate('/sala-pastoral')}>
          <FiArrowLeft aria-hidden />
          Voltar
        </button>
        <div style={s.titleBlock}>
          <h1 style={s.h1}>Capítulos</h1>
          <p style={s.subtitle}>
            {meta.name} — escolha o capítulo para leitura ({version.toUpperCase()})
          </p>
        </div>
        <select
          style={studyStyles.select}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          aria-label="Versão da Bíblia"
        >
          <option value="nvi">NVI</option>
          <option value="acf">ACF</option>
          <option value="ra">RA</option>
          <option value="rvr">RVR</option>
          <option value="kjv">KJV</option>
        </select>
      </header>

      <BibleChapters
        bookAbbrev={meta.abbrev}
        bookName={meta.name}
        chapterCount={meta.chapters}
        chapterReadCounts={chapterReadCounts}
        verseTotalsByChapter={verseTotalsByChapter}
      />
    </div>
  );
}
