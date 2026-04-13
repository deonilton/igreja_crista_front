/** Tipos compartilhados entre telas de leitura bíblica e a API interna. */

export type BibleBookRef = {
  name: string;
  abbrev?: { pt?: string; en?: string };
};

export type SearchVerseItem = {
  book: BibleBookRef;
  chapter: number;
  number: number;
  text: string;
};

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

export type CatalogBook = { order: number; abbrev: string; name: string; chapters: number };

export type BooksCatalog = {
  oldTestament: CatalogBook[];
  newTestament: CatalogBook[];
};
