import { useCallback, useState } from 'react';
import type { FavoriteVerse, SearchVerseItem } from './bibleTypes';
import { bookAbbrev, makeFavoriteId } from './bibleNormalize';

const LS_FAVORITES = 'igreja:estudosBiblicos:favorites';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Favoritos persistidos (mesma chave do módulo anterior de Estudos Bíblicos). */
export function useFavoriteVerses(version: string) {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => loadJson(LS_FAVORITES, []));

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

  const isFav = useCallback(
    (v: SearchVerseItem) => favorites.some((f) => f.id === makeFavoriteId(version, v)),
    [favorites, version]
  );

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((x) => x.id !== id);
      localStorage.setItem(LS_FAVORITES, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, toggleFavorite, isFav, removeFavorite };
}
