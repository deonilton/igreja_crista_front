import type { BibleBookRef, SearchVerseItem, VerseWithMeta } from './bibleTypes';

export function bookAbbrev(book: BibleBookRef): string {
  return (book.abbrev?.pt || book.abbrev?.en || '').toLowerCase();
}

export function makeFavoriteId(version: string, v: SearchVerseItem): string {
  return `${version}:${bookAbbrev(v.book)}:${v.chapter}:${v.number}`.toLowerCase();
}

/** Normaliza resposta da API (versículo único ou item de busca) para o formato da UI. */
export function normalizeVerse(data: unknown): VerseWithMeta | null {
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
