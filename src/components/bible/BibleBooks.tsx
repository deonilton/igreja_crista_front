import { useNavigate } from 'react-router-dom';
import type { BooksCatalog } from './bibleTypes';
import { bibleStyles as s } from './bible.styles';

type Props = {
  catalog: BooksCatalog | null;
  loading: boolean;
  error: string | null;
 /** Texto introdutório opcional acima da grade. */
  intro?: string;
};

/**
 * Grade de livros (AT / NT) com navegação para `/sala-pastoral/livro/:book`.
 * `book` na URL usa a abreviação do catálogo (ex.: `gn`, `jo`).
 */
export default function BibleBooks({ catalog, loading, error, intro }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={s.card}>
        <p style={s.loadingBox}>Carregando livros…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.card}>
        <div style={s.errorBox} role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!catalog) {
    return null;
  }

  return (
    <div style={s.card}>
      {intro ? <p style={{ ...s.muted, margin: '0 0 16px 0', lineHeight: 1.5 }}>{intro}</p> : null}
      <div style={s.booksTwoCols}>
        <div style={s.testamentBlock}>
          <h3 style={s.testamentTitle}>Antigo Testamento ({catalog.oldTestament.length} livros)</h3>
          <div style={s.booksGrid}>
            {catalog.oldTestament.map((b) => (
              <button
                key={`ot-${b.abbrev}`}
                type="button"
                style={s.bookCard}
                title={b.name}
                onClick={() => navigate(`/sala-pastoral/livro/${encodeURIComponent(b.abbrev)}`)}
              >
                <span style={s.bookOrder}>{b.order}.</span>
                {b.name}
              </button>
            ))}
          </div>
        </div>
        <div style={s.testamentBlock}>
          <h3 style={s.testamentTitle}>Novo Testamento ({catalog.newTestament.length} livros)</h3>
          <div style={s.booksGrid}>
            {catalog.newTestament.map((b) => (
              <button
                key={`nt-${b.abbrev}`}
                type="button"
                style={s.bookCard}
                title={b.name}
                onClick={() => navigate(`/sala-pastoral/livro/${encodeURIComponent(b.abbrev)}`)}
              >
                <span style={s.bookOrder}>{b.order}.</span>
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
