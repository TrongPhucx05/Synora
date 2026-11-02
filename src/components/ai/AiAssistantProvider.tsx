"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type AiSourceInfo = {
  type: "DOCUMENT" | "ATTACHMENT" | "UPLOAD";
  id: string;
  title: string;
};

interface AiContextValue {
  enabled: boolean;
  open: boolean;
  source: AiSourceInfo | null;
  openWith: (source?: AiSourceInfo) => void;
  close: () => void;
  clearSource: () => void;
}

const AiContext = createContext<AiContextValue>({
  enabled: false,
  open: false,
  source: null,
  openWith: () => {},
  close: () => {},
  clearSource: () => {},
});

export function AiAssistantProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<AiSourceInfo | null>(null);

  const openWith = useCallback((s?: AiSourceInfo) => {
    if (s) setSource(s);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const clearSource = useCallback(() => setSource(null), []);

  const value = useMemo(
    () => ({ enabled, open, source, openWith, close, clearSource }),
    [enabled, open, source, openWith, close, clearSource],
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export const useAiAssistant = () => useContext(AiContext);