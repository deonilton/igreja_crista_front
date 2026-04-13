import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type BibleReadingCtx = {
  version: string;
  setVersion: (v: string) => void;
};

const Ctx = createContext<BibleReadingCtx | null>(null);

/** Mantém a tradução (NVI, ACF, …) entre as telas de leitura sob `/sala-pastoral`. */
export function BibleReadingProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState('nvi');
  const value = useMemo(() => ({ version, setVersion }), [version]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBibleVersion() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error('useBibleVersion deve ser usado dentro de BibleReadingProvider');
  }
  return v;
}
