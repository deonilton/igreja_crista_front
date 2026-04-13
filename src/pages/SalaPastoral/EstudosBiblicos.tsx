import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiBookOpen, FiLayers, FiSearch, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import { styles } from './EstudosBiblicos.styles';

const LS_SEARCHES = 'igreja:estudosBiblicos:searches';
const LS_FAVORITES = 'igreja:estudosBiblicos:favorites';
const MAX_RECENT = 10;

type BibleBookRef = {
  name: string;
  abbrev?: { pt?: string; en?: string };
};

export type SearchVerseItem = {
  book: BibleBookRef;
  chapter: number;
  number: number;
  text: string;
};

/** Metadados opcionais quando o backend usa provedor alternativo (ex.: bible-api.com). */
export type VerseWithMeta = SearchVerseItem & {
  _meta?: { note?: string; provider?: string; translation_name?: string };
};

export type FavoriteVerse = {
  id: string;
  version: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

function bookAbbrev(book: BibleBookRef): string {
  return (book.abbrev?.pt || book.abbrev?.en || '').toLowerCase();
}

function makeFavoriteId(version: string, v: SearchVerseItem): string {
  return `${version}:${bookAbbrev(v.book)}:${v.chapter}:${v.number}`.toLowerCase();
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Normaliza resposta da API (versículo único ou item de busca) para o formato da UI. */
function normalizeVerse(data: unknown): VerseWithMeta | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const book = o.book as BibleBookRef | undefined;
  const text = o.text;
  if (!book || typeof text !== 'string') return null;
  const chapter = Number(o.chapter);
  const number = Number(o.number);
  if (Number.isNaN(chapter) || Number.isNaN(number)) return null;
  const base: VerseWithMeta = { book, chapter, number, text };
  const meta = o._meta;
  if (meta && typeof meta === 'object') {
    base._meta = meta as VerseWithMeta['_meta'];
  }
  return base;
}

type CatalogBook = { order: number; abbrev: string; name: string; chapters: number };

type BooksCatalog = {
  oldTestament: CatalogBook[];
  newTestament: CatalogBook[];
};

interface Props {
  onBack: () => void;
}

export default function EstudosBiblicos({ onBack }: Props) {
  const [version, setVersion] = useState('nvi');
  const [votd, setVotd] = useState<VerseWithMeta | null>(null);
  const [votdLoading, setVotdLoading] = useState(true);
  const [votdError, setVotdError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<SearchVerseItem[]>([]);
  const [occurrence, setOccurrence] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => loadJson(LS_SEARCHES, []));
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => loadJson(LS_FAVORITES, []));
  const [booksCatalog, setBooksCatalog] = useState<BooksCatalog | null>(null);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);

  /** Livro aberto na lista + capítulo exibido (clique no nome do livro). */
  const [openBook, setOpenBook] = useState<{ abbrev: string; name: string } | null>(null);
  const [chapterNum, setChapterNum] = useState(1);
  const [chapterVerses, setChapterVerses] = useState<SearchVerseItem[]>([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);

  // Versículo do dia: carrega ao montar (backend → Bible SuperSearch API).
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

  const toggleFavorite = useCallback(
    (v: SearchVerseItem) => {
      const id = makeFavoriteId(version, v);
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === id);
        const next = exists
          ? prev.filter((f) => f.id !== id)
          : [
              ...prev,
              {
                id,
                version,
                bookAbbrev: bookAbbrev(v.book),
                bookName: v.book.name,
                chapter: v.chapter,
                verse: v.number,
                text: v.text,
              },
            ];
        localStorage.setItem(LS_FAVORITES, JSON.stringify(next));
        return next;
      });
    },
    [version]
  );

  const isFav = (v: SearchVerseItem) => favorites.some((f) => f.id === makeFavoriteId(version, v));

  const formatRef = (item: SearchVerseItem) =>
    `${item.book.name} ${item.chapter}:${item.number} (${version.toUpperCase()})`;

  const maxChapterOpen = useMemo(() => {
    if (!openBook || !booksCatalog) return 150;
    const all = [...booksCatalog.oldTestament, ...booksCatalog.newTestament];
    const found = all.find((b) => b.abbrev === openBook.abbrev);
    return found?.chapters ?? 150;
  }, [openBook, booksCatalog]);

  const loadChapter = useCallback(
    async (abbrev: string, chapter: number) => {
      setChapterLoading(true);
      setChapterError(null);
      try {
        const { data } = await api.get<{ verses?: unknown[] }>('/bible/chapter', {
          params: { version, book: abbrev, chapter },
        });
        const raw = data?.verses;
        const verses: SearchVerseItem[] = Array.isArray(raw)
          ? (raw.map(normalizeVerse).filter(Boolean) as SearchVerseItem[])
          : [];
        setChapterVerses(verses);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        setChapterError(msg || 'Não foi possível carregar este capítulo.');
        setChapterVerses([]);
      } finally {
        setChapterLoading(false);
      }
    },
    [version]
  );

  const handleBookClick = useCallback(
    (b: CatalogBook) => {
      if (openBook?.abbrev === b.abbrev) {
        setOpenBook(null);
        setChapterVerses([]);
        setChapterError(null);
        return;
      }
      setOpenBook({ abbrev: b.abbrev, name: b.name });
      setChapterNum(1);
      void loadChapter(b.abbrev, 1);
    },
    [openBook?.abbrev, loadChapter]
  );

  const handleChapterGo = useCallback(() => {
    if (!openBook) return;
    const n = Math.max(1, Math.min(maxChapterOpen, Number(chapterNum) || 1));
    setChapterNum(n);
    void loadChapter(openBook.abbrev, n);
  }, [openBook, chapterNum, loadChapter, maxChapterOpen]);

  // Ao trocar a versão da Bíblia no seletor superior, recarrega o capítulo aberto na mesma numeração.
  useEffect(() => {
    if (!openBook) return;
    void loadChapter(openBook.abbrev, chapterNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apenas quando `version` muda (evita refetch a cada digitação no capítulo)
  }, [version]);

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <button type="button" style={styles.backBtn} onClick={onBack}>
          <FiArrowLeft style={{ verticalAlign: 'middle', marginRight: 6 }} />
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
            <p style={styles.verseRef}>{formatRef(votd)}</p>
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
              // Ao limpar o campo, remove resultados da última busca (evita lista “fantasma”).
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
              <button key={r} type="button" style={styles.chip} onClick={() => { setSearchInput(r); void runSearch(r); }}>
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
                <p style={styles.verseRef}>{formatRef(v)}</p>
                <p style={styles.verseText}>{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card} aria-labelledby="books-heading">
        <h2 id="books-heading" style={styles.cardTitle}>
          <FiLayers aria-hidden />
          Livros da Bíblia
        </h2>
        <p style={styles.booksSectionIntro}>
          Lista de referência dos 66 livros, na ordem tradicional protestante, separados por Antigo e Novo Testamento.
        </p>
        {booksLoading && <p style={styles.loadingBox}>Carregando livros…</p>}
        {booksError && <div style={styles.errorBox}>{booksError}</div>}
        {!booksLoading && !booksError && booksCatalog && (
          <div style={styles.booksTwoCols}>
            <div style={styles.testamentBlock}>
              <h3 style={styles.testamentTitle}>Antigo Testamento ({booksCatalog.oldTestament.length} livros)</h3>
              <div style={styles.booksGrid}>
                {booksCatalog.oldTestament.map((b) => (
                  <button
                    key={`ot-${b.abbrev}`}
                    type="button"
                    style={{
                      ...styles.bookCellButton,
                      ...(openBook?.abbrev === b.abbrev ? styles.bookCellSelected : {}),
                    }}
                    title={`Abrir ${b.name} — clique de novo para fechar`}
                    onClick={() => handleBookClick(b)}
                  >
                    <span style={styles.bookOrder}>{b.order}.</span>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.testamentBlock}>
              <h3 style={styles.testamentTitle}>Novo Testamento ({booksCatalog.newTestament.length} livros)</h3>
              <div style={styles.booksGrid}>
                {booksCatalog.newTestament.map((b) => (
                  <button
                    key={`nt-${b.abbrev}`}
                    type="button"
                    style={{
                      ...styles.bookCellButton,
                      ...(openBook?.abbrev === b.abbrev ? styles.bookCellSelected : {}),
                    }}
                    title={`Abrir ${b.name} — clique de novo para fechar`}
                    onClick={() => handleBookClick(b)}
                  >
                    <span style={styles.bookOrder}>{b.order}.</span>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {openBook && (
          <div style={styles.chapterPanel} role="region" aria-label={`Leitura: ${openBook.name}`}>
            <div style={styles.chapterPanelHeader}>
              <h3 style={styles.chapterPanelTitle}>
                {openBook.name}
                {' — '}
                capítulo {chapterNum}
              </h3>
              <div style={styles.chapterToolbar}>
                <label htmlFor="estudos-capitulo" style={{ ...styles.muted, margin: 0 }}>
                  Cap.
                </label>
                <input
                  id="estudos-capitulo"
                  type="number"
                  min={1}
                  max={maxChapterOpen}
                  style={styles.chapterInput}
                  value={chapterNum}
                  onChange={(e) => setChapterNum(Number(e.target.value) || 1)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleChapterGo();
                  }}
                />
                <span style={{ ...styles.muted, margin: 0, fontSize: '0.8rem' }}>
                  (1–{maxChapterOpen} neste livro)
                </span>
                <button type="button" style={styles.chapterGoBtn} onClick={handleChapterGo} disabled={chapterLoading}>
                  Ir
                </button>
                <button
                  type="button"
                  style={styles.chapterCloseBtn}
                  onClick={() => {
                    setOpenBook(null);
                    setChapterVerses([]);
                    setChapterError(null);
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
            {chapterLoading && <p style={styles.loadingBox}>Carregando capítulo…</p>}
            {chapterError && <div style={styles.errorBox}>{chapterError}</div>}
            {!chapterLoading && !chapterError && chapterVerses.length > 0 && (
              <div style={styles.chapterVersesScroll}>
                {chapterVerses.map((v) => (
                  <div key={makeFavoriteId(version, v)} style={{ ...styles.resultItem, marginBottom: 10 }}>
                    <button
                      type="button"
                      style={{ ...styles.favBtn, ...(isFav(v) ? styles.favBtnOn : {}) }}
                      onClick={() => toggleFavorite(v)}
                      aria-label={isFav(v) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <FiStar fill={isFav(v) ? 'currentColor' : 'none'} size={20} />
                    </button>
                    <div>
                      <p style={{ ...styles.verseRef, marginBottom: 4 }}>{formatRef(v)}</p>
                      <p style={styles.verseText}>{v.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!chapterLoading && !chapterError && chapterVerses.length === 0 && (
              <p style={styles.muted}>Nenhum versículo retornado para este capítulo.</p>
            )}
          </div>
        )}
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
                  onClick={() => {
                    setFavorites((prev) => {
                      const next = prev.filter((x) => x.id !== f.id);
                      localStorage.setItem(LS_FAVORITES, JSON.stringify(next));
                      return next;
                    });
                  }}
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
