import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiChevronUp } from 'react-icons/fi';
import api from '../../services/api';
import BibleVerses from '../../components/bible/BibleVerses';
import { normalizeVerse } from '../../components/bible/bibleNormalize';
import type { BooksCatalog, SearchVerseItem } from '../../components/bible/bibleTypes';
import { useFavoriteVerses } from '../../components/bible/useFavoriteVerses';
import { bibleStyles as s } from '../../components/bible/bible.styles';
import { useBibleVersion } from './BibleReadingContext';
import { styles as studyStyles } from './bibleStudy.styles';

/**
 * `/sala-pastoral/livro/:book/capitulo/:chapter` — versículos em cartões.
 */
export default function BibleChapterPage() {
  const { book: bookParam, chapter: chapterParam } = useParams<{ book: string; chapter: string }>();
  const navigate = useNavigate();
  const { version, setVersion } = useBibleVersion();
  const { toggleFavorite, isFav } = useFavoriteVerses(version);

  const [catalog, setCatalog] = useState<BooksCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [verses, setVerses] = useState<SearchVerseItem[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState<string | null>(null);
  const [readVerses, setReadVerses] = useState<Set<number>>(() => new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);

  const bookKey = bookParam ? decodeURIComponent(bookParam).toLowerCase() : '';
  const chapterNum = chapterParam ? Number(chapterParam) : NaN;
  const chapterValid = Number.isInteger(chapterNum) && chapterNum >= 1;

  const meta = useMemo(() => {
    if (!catalog || !bookKey) return null;
    const all = [...catalog.oldTestament, ...catalog.newTestament];
    return all.find((b) => b.abbrev.toLowerCase() === bookKey) ?? null;
  }, [catalog, bookKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const { data } = await api.get<BooksCatalog>('/bible/books');
        if (!cancelled) setCatalog(data);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        if (!cancelled) setCatalogError(msg || 'Não foi possível validar o livro.');
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadChapter = useCallback(
    async (abbrev: string, chapter: number) => {
      setVersesLoading(true);
      setVersesError(null);
      try {
        const { data } = await api.get<{ verses?: unknown[] }>('/bible/chapter', {
          params: { version, book: abbrev, chapter },
        });
        const raw = data?.verses;
        const list: SearchVerseItem[] = Array.isArray(raw)
          ? (raw.map(normalizeVerse).filter(Boolean) as SearchVerseItem[])
          : [];
        setVerses(list);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        setVersesError(msg || 'Não foi possível carregar este capítulo.');
        setVerses([]);
      } finally {
        setVersesLoading(false);
      }
    },
    [version]
  );

  useEffect(() => {
    if (!meta || !chapterValid || chapterNum > meta.chapters) return;
    void loadChapter(meta.abbrev, chapterNum);
  }, [meta, chapterNum, chapterValid, loadChapter]);

  useEffect(() => {
    if (!meta || !chapterValid || chapterNum > meta.chapters) return;
    setReadVerses(new Set());
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ verses?: number[] }>('/bible/read-progress', {
          params: { version, book: meta.abbrev, chapter: chapterNum },
        });
        const list = Array.isArray(data?.verses) ? data.verses : [];
        if (!cancelled) setReadVerses(new Set(list));
      } catch {
        if (!cancelled) setReadVerses(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meta, chapterNum, version, chapterValid]);

  const handleToggleRead = useCallback(
    async (verseNum: number) => {
      if (!meta) return;
      let wasRead = false;
      setReadVerses((prev) => {
        wasRead = prev.has(verseNum);
        const next = new Set(prev);
        if (wasRead) next.delete(verseNum);
        else next.add(verseNum);
        return next;
      });
      try {
        if (wasRead) {
          await api.delete('/bible/read-progress', {
            params: { version, book: meta.abbrev, chapter: chapterNum, verse: verseNum },
          });
        } else {
          await api.post('/bible/read-progress', {
            version,
            book: meta.abbrev,
            chapter: chapterNum,
            verse: verseNum,
          });
        }
      } catch {
        setReadVerses((prev) => {
          const next = new Set(prev);
          if (wasRead) next.add(verseNum);
          else next.delete(verseNum);
          return next;
        });
      }
    },
    [meta, version, chapterNum]
  );

  const backToChapters = () => {
    if (meta) navigate(`/sala-pastoral/livro/${encodeURIComponent(meta.abbrev)}`);
    else navigate('/sala-pastoral');
  };

  const scrollReadingToTop = useCallback(() => {
    const main = document.querySelector('.app-content');
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const SCROLL_SHOW_PX = 200;
    const main = document.querySelector('.app-content');

    const currentScrollTop = () => {
      let y = 0;
      if (main instanceof HTMLElement) y = Math.max(y, main.scrollTop);
      y = Math.max(y, window.scrollY || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0);
      return y;
    };

    const onScroll = () => setShowScrollTop(currentScrollTop() > SCROLL_SHOW_PX);
    onScroll();
    main?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      main?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [meta?.abbrev, chapterNum]);

  if (catalogLoading) {
    return (
      <div style={s.pageWrap}>
        <div style={s.loadingBox}>
          <div className="spinner" />
          Carregando…
        </div>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div style={s.pageWrap}>
        <header style={s.headerRow}>
          <button type="button" style={s.backBtn} onClick={backToChapters}>
            <FiArrowLeft aria-hidden />
            Voltar
          </button>
        </header>
        <div style={s.errorBox} role="alert">
          {catalogError}
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
          Livro não encontrado.
        </div>
      </div>
    );
  }

  if (!chapterValid) {
    return (
      <div style={s.pageWrap}>
        <header style={s.headerRow}>
          <button type="button" style={s.backBtn} onClick={backToChapters}>
            <FiArrowLeft aria-hidden />
            Voltar
          </button>
        </header>
        <div style={s.errorBox} role="alert">
          Número de capítulo inválido.
        </div>
      </div>
    );
  }

  if (chapterNum > meta.chapters) {
    return (
      <div style={s.pageWrap}>
        <header style={s.headerRow}>
          <button type="button" style={s.backBtn} onClick={backToChapters}>
            <FiArrowLeft aria-hidden />
            Voltar
          </button>
        </header>
        <div style={s.errorBox} role="alert">
          Este livro possui apenas {meta.chapters} capítulo(s).
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={s.pageWrap} id="sala-pastoral-capitulo-top">
        <header style={s.headerRow}>
          <button type="button" style={s.backBtn} onClick={backToChapters}>
            <FiArrowLeft aria-hidden />
            Voltar
          </button>
          <div style={s.titleBlock}>
            <h1 style={s.h1}>{meta.name}</h1>
            <p style={s.subtitle}>
              Capítulo {chapterNum} · {version.toUpperCase()}
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

        <BibleVerses
          verses={verses}
          loading={versesLoading}
          error={versesError}
          version={version}
          bookDisplayName={meta.name}
          chapterNum={chapterNum}
          isFav={isFav}
          onToggleFavorite={toggleFavorite}
          readVerseNumbers={readVerses}
          onToggleRead={handleToggleRead}
        />
      </div>

      {showScrollTop ? (
        <button
          type="button"
          style={s.scrollToTopFab}
          onClick={scrollReadingToTop}
          aria-label="Voltar ao topo da leitura"
          title="Voltar ao topo"
        >
          <FiChevronUp size={26} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </>
  );
}
