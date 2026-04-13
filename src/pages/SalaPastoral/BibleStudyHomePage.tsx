import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiLayers, FiSearch, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import BibleBooks from '../../components/bible/BibleBooks';
import { makeFavoriteId, normalizeVerse } from '../../components/bible/bibleNormalize';
import type { BooksCatalog, SearchVerseItem, VerseWithMeta } from '../../components/bible/bibleTypes';
import { useFavoriteVerses } from '../../components/bible/useFavoriteVerses';
import { useBibleVersion } from './BibleReadingContext';
import { styles } from './bibleStudy.styles';

const LS_SEARCHES = 'igreja:estudosBiblicos:searches';
const MAX_RECENT = 10;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatRef(version: string, item: SearchVerseItem) {
  return `${item.book.name} ${item.chapter}:${item.number} (${version.toUpperCase()})`;
}

/**
 * `/sala-pastoral` — versículo do dia, busca, favoritos e lista de livros (navegação por rotas).
 */
export default function BibleStudyHomePage() {
  const navigate = useNavigate();
  const { version, setVersion } = useBibleVersion();

  const [votd, setVotd] = useState<VerseWithMeta | null>(null);
  const [votdLoading, setVotdLoading] = useState(true);
  const [votdError, setVotdError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<SearchVerseItem[]>([]);
  const [occurrence, setOccurrence] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => loadJson(LS_SEARCHES, []));
  const { favorites, toggleFavorite, isFav, removeFavorite } = useFavoriteVerses(version);

  const [booksCatalog, setBooksCatalog] = useState<BooksCatalog | null>(null);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setVotdLoading(true);
      setVotdError(null);
      try {
        const { data } = await api.get('/bible/verse-of-the-day');
        if (!cancelled) setVotd(normalizeVerse(data));
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        if (!cancelled) setVotdError(msg || 'Não foi possível carregar o versículo do dia.');
      } finally {
        if (!cancelled) setVotdLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBooksLoading(true);
      setBooksError(null);
      try {
        const { data } = await api.get<BooksCatalog>('/bible/books');
        if (!cancelled) setBooksCatalog(data);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        if (!cancelled) setBooksError(msg || 'Não foi possível carregar a lista de livros.');
      } finally {
        if (!cancelled) setBooksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(
    async (term: string) => {
      const t = term.trim();
      if (!t) {
        setResults([]);
        setOccurrence(null);
        setSearchError(null);
        return;
      }
      setSearchLoading(true);
      setSearchError(null);
      try {
        const { data } = await api.get('/bible/search', { params: { term: t, version } });
        const raw = data?.verses;
        const verses: SearchVerseItem[] = Array.isArray(raw)
          ? (raw.map(normalizeVerse).filter(Boolean) as SearchVerseItem[])
          : [];
        setResults(verses);
        setOccurrence(typeof data?.occurrence === 'number' ? data.occurrence : null);

        setRecent((prev) => {
          const next = [t, ...prev.filter((x) => x !== t)].slice(0, MAX_RECENT);
          localStorage.setItem(LS_SEARCHES, JSON.stringify(next));
          return next;
        });
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        setSearchError(msg || 'Falha na busca.');
        setResults([]);
        setOccurrence(null);
      } finally {
        setSearchLoading(false);
      }
    },
    [version]
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <button type="button" style={styles.backBtn} onClick={() => navigate('/sala-pastoral/painel')}>
          <FiArrowLeft style={{ verticalAlign: 'middle' }} aria-hidden />
          Voltar
        </button>
        <div style={styles.titleBlock}>
          <h1 style={styles.h1}>Estudos Bíblicos</h1>
          <p style={styles.subtitle}>Consulta rápida à Palavra (Bible SuperSearch via API interna)</p>
        </div>
      </div>

      <section style={styles.card} aria-labelledby="votd-heading">
        <h2 id="votd-heading" style={styles.cardTitle}>
          <FiBookOpen aria-hidden />
          Versículo do dia
        </h2>
        {votdLoading && <p style={styles.loadingBox}>Carregando…</p>}
        {votdError && <div style={styles.errorBox}>{votdError}</div>}
        {!votdLoading && !votdError && votd && (
          <>
            <p style={styles.verseRef}>{formatRef(version, votd)}</p>
            <p style={styles.verseText}>{votd.text}</p>
            {votd._meta?.note ? (
              <div style={styles.infoBanner} role="status">
                {votd._meta.note}
                {votd._meta.translation_name ? ` — ${votd._meta.translation_name}` : ''}
              </div>
            ) : null}
          </>
        )}
        {!votdLoading && !votdError && !votd && <p style={styles.muted}>Nenhum dado retornado.</p>}
      </section>

      <section style={styles.card} aria-labelledby="search-heading">
        <h2 id="search-heading" style={styles.cardTitle}>
          <FiSearch aria-hidden />
          Buscar por tema ou palavra
        </h2>
        <div style={styles.searchRow}>
          <input
            style={styles.input}
            placeholder="Ex.: fé, amor, esperança…"
            value={searchInput}
            onChange={(e) => {
              const v = e.target.value;
              setSearchInput(v);
              if (v.trim() === '') {
                setResults([]);
                setOccurrence(null);
                setSearchError(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runSearch(searchInput);
            }}
          />
          <select style={styles.select} value={version} onChange={(e) => setVersion(e.target.value)} aria-label="Versão da Bíblia">
            <option value="nvi">NVI</option>
            <option value="acf">ACF</option>
            <option value="ra">RA</option>
            <option value="rvr">RVR</option>
            <option value="kjv">KJV</option>
          </select>
          <button type="button" style={styles.primaryBtn} onClick={() => void runSearch(searchInput)} disabled={searchLoading}>
            Buscar
          </button>
        </div>
        {recent.length > 0 && (
          <div style={styles.chipRow}>
            <span style={{ ...styles.muted, marginRight: 8 }}>Recentes:</span>
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                style={styles.chip}
                onClick={() => {
                  setSearchInput(r);
                  void runSearch(r);
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        {searchError && <div style={styles.errorBox}>{searchError}</div>}
        {searchLoading && <p style={styles.loadingBox}>Buscando…</p>}
        {occurrence !== null && results.length > 0 && (
          <p style={styles.occurrence}>
            Ocorrências na versão {version.toUpperCase()}: {occurrence.toLocaleString('pt-BR')}
          </p>
        )}
        <div style={styles.resultList}>
          {results.length === 0 && !searchLoading && <p style={styles.empty}>Faça uma busca para ver versículos aqui.</p>}
          {results.map((v) => (
            <div key={makeFavoriteId(version, v)} style={styles.resultItem}>
              <button
                type="button"
                style={{ ...styles.favBtn, ...(isFav(v) ? styles.favBtnOn : {}) }}
                onClick={() => toggleFavorite(v)}
                aria-label={isFav(v) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <FiStar fill={isFav(v) ? 'currentColor' : 'none'} size={22} />
              </button>
              <div>
                <p style={styles.verseRef}>{formatRef(version, v)}</p>
                <p style={styles.verseText}>{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="books-heading">
        <h2 id="books-heading" style={{ ...styles.cardTitle, marginBottom: 12 }}>
          <FiLayers aria-hidden />
          Livros da Bíblia
        </h2>
        <BibleBooks
          catalog={booksCatalog}
          loading={booksLoading}
          error={booksError}
          intro="Lista de referência dos 66 livros, na ordem tradicional protestante, separados por Antigo e Novo Testamento. Toque em um livro para escolher o capítulo."
        />
      </section>

      {favorites.length > 0 && (
        <section style={styles.card} aria-labelledby="fav-heading">
          <h2 id="fav-heading" style={styles.cardTitle}>
            <FiStar aria-hidden />
            Versículos favoritos
          </h2>
          <div style={styles.resultList}>
            {favorites.map((f) => (
              <div key={f.id} style={styles.resultItem}>
                <button
                  type="button"
                  style={{ ...styles.favBtn, ...styles.favBtnOn }}
                  onClick={() => removeFavorite(f.id)}
                  aria-label="Remover favorito"
                >
                  <FiStar fill="currentColor" size={22} />
                </button>
                <div>
                  <p style={styles.verseRef}>
                    {f.bookName} {f.chapter}:{f.verse} ({f.version.toUpperCase()})
                  </p>
                  <p style={styles.verseText}>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
