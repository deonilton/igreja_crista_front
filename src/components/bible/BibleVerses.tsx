import { FiCheckCircle, FiStar } from 'react-icons/fi';
import type { SearchVerseItem } from './bibleTypes';
import { makeFavoriteId } from './bibleNormalize';
import { bibleStyles as s } from './bible.styles';

type Props = {
  verses: SearchVerseItem[];
  loading: boolean;
  error: string | null;
  version: string;
  bookDisplayName: string;
  chapterNum: number;
  isFav: (v: SearchVerseItem) => boolean;
  onToggleFavorite: (v: SearchVerseItem) => void;
  /** Números dos versículos já marcados como lidos (API). */
  readVerseNumbers?: ReadonlySet<number>;
  onToggleRead?: (verseNumber: number) => void;
};

/**
 * Lista de versículos em cartões (número + texto), com ação de favoritar opcional.
 */
export default function BibleVerses({
  verses,
  loading,
  error,
  version,
  bookDisplayName,
  chapterNum,
  isFav,
  onToggleFavorite,
  readVerseNumbers,
  onToggleRead,
}: Props) {
  if (loading) {
    return (
      <div style={s.card}>
        <p style={s.loadingBox}>Carregando versículos…</p>
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

  if (verses.length === 0) {
    return (
      <div style={s.card}>
        <p style={s.muted}>Nenhum versículo retornado para este capítulo.</p>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <h2 style={s.sectionTitle} id="verses-heading">
        {bookDisplayName} — capítulo {chapterNum}{' '}
        <span style={{ ...s.muted, fontWeight: 600, fontSize: '0.9rem' }}>({version.toUpperCase()})</span>
      </h2>
      {onToggleRead ? (
        <p style={{ ...s.muted, margin: '0 0 12px 0', fontSize: '0.88rem' }}>
          Use o ícone de check para marcar ou desmarcar versículos já lidos (salvo na sua conta).
        </p>
      ) : null}
      <div style={s.versesList} role="list" aria-labelledby="verses-heading">
        {verses.map((v) => {
          const isRead = readVerseNumbers?.has(v.number) ?? false;
          return (
            <article
              key={makeFavoriteId(version, v)}
              style={{ ...s.verseCard, ...(isRead ? s.verseCardRead : {}) }}
              role="listitem"
            >
              {onToggleRead ? (
                <button
                  type="button"
                  style={{ ...s.readToggleBtn, ...(isRead ? s.readToggleBtnOn : {}) }}
                  onClick={() => onToggleRead(v.number)}
                  aria-label={isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                  title={isRead ? 'Lido — clique para desmarcar' : 'Marcar como lido'}
                >
                  <FiCheckCircle fill={isRead ? 'currentColor' : 'none'} size={22} />
                </button>
              ) : null}
              <button
                type="button"
                style={{ ...s.favBtn, ...(isFav(v) ? s.favBtnOn : {}) }}
                onClick={() => onToggleFavorite(v)}
                aria-label={isFav(v) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <FiStar fill={isFav(v) ? 'currentColor' : 'none'} size={20} />
              </button>
              <span style={s.verseNum} aria-hidden>
                {v.number}
              </span>
              <p style={s.verseText}>{v.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
