import { useNavigate } from 'react-router-dom';
import { bibleStyles as s } from './bible.styles';

type Props = {
  /** Abreviação usada na API e na URL (ex.: `gn`). */
  bookAbbrev: string;
  bookName: string;
  chapterCount: number;
  /** Por capítulo: quantidade de versículos já marcados como lidos. */
  chapterReadCounts?: Readonly<Record<number, number>>;
  /** Índice 0 = capítulo 1: total de versículos naquele capítulo (numeração protestante usual). */
  verseTotalsByChapter?: readonly number[];
};

/**
 * Grade de capítulos (1..N) com barra de progresso (lidos / total) e navegação para o capítulo.
 */
export default function BibleChapters({
  bookAbbrev,
  bookName,
  chapterCount,
  chapterReadCounts,
  verseTotalsByChapter,
}: Props) {
  const navigate = useNavigate();
  const safe = Math.max(1, chapterCount);
  const chapters = Array.from({ length: safe }, (_, i) => i + 1);

  return (
    <div style={s.card}>
      <h2 style={s.sectionTitle}>{bookName}</h2>
      <p style={{ ...s.muted, margin: '0 0 16px 0', lineHeight: 1.5 }}>
        Selecione um capítulo ({safe} no total). A barra indica quantos versículos você já marcou como lidos
        em relação ao total do capítulo. Verde = capítulo completo; amarelo = leitura em andamento.
      </p>
      <div style={s.chaptersGrid}>
        {chapters.map((n) => {
          const readCount = chapterReadCounts?.[n] ?? 0;
          const totalVerses = verseTotalsByChapter?.[n - 1] ?? 0;
          const hasTotals = totalVerses > 0;
          const pct = hasTotals ? Math.min(100, Math.round((readCount / totalVerses) * 100)) : 0;
          const isComplete = hasTotals && readCount >= totalVerses;
          const isPartial = hasTotals && readCount > 0 && readCount < totalVerses;
          const legacyHasReads = !hasTotals && readCount > 0;

          const cellExtra =
            isComplete ? s.chapterCellHasReads : isPartial ? s.chapterCellPartial : legacyHasReads ? s.chapterCellPartial : {};

          const labelTitle = hasTotals
            ? `${bookName} ${n} — ${readCount}/${totalVerses} versículos lidos (${pct}%)`
            : legacyHasReads
              ? `${bookName} ${n} — ${readCount} versículo(s) marcado(s)`
              : `${bookName} ${n}`;

          return (
            <button
              key={n}
              type="button"
              style={{ ...s.chapterCell, ...cellExtra }}
              title={labelTitle}
              aria-label={hasTotals ? `Capítulo ${n}, ${readCount} de ${totalVerses} versículos lidos` : `Capítulo ${n}`}
              onClick={() =>
                navigate(`/sala-pastoral/livro/${encodeURIComponent(bookAbbrev)}/capitulo/${n}`)
              }
            >
              <span style={s.chapterCellNumber}>{n}</span>
              {hasTotals ? (
                <>
                  <div style={s.chapterProgressTrack} aria-hidden>
                    <div style={{ ...s.chapterProgressFill, width: `${pct}%` }} />
                  </div>
                  <span style={s.chapterFractionLabel} aria-hidden>
                    {readCount}/{totalVerses}
                  </span>
                </>
              ) : readCount > 0 ? (
                <span style={s.chapterFractionLabel} aria-hidden>
                  {readCount} lidos
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
