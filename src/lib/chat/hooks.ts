"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  cb: () => void,
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [ref, cb]);
}

export function useOutsideClickRefs(
  refs: React.RefObject<HTMLElement | null>[],
  cb: () => void,
) {
  const refsRef = useRef(refs);
  refsRef.current = refs;
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInside = refsRef.current.some(
        (r) => r.current && r.current.contains(target),
      );
      if (!isInside) cbRef.current();
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);
}

const CHAT_UNREAD_EVENT = "chat:unread-changed";

export function emitChatUnreadCount(count: number) {
  window.dispatchEvent(
    new CustomEvent(CHAT_UNREAD_EVENT, { detail: { count } }),
  );
}

async function fetchChatUnreadCount(): Promise<number> {
  try {
    const res = await fetch("/api/conversations");
    if (!res.ok) return 0;
    const data: { unreadCount: number; isArchived?: boolean }[] =
      await res.json();
    return data.reduce(
      (sum, c) => (c.isArchived ? sum : sum + c.unreadCount),
      0,
    );
  } catch {
    return 0;
  }
}

export function useUnreadChatCount(enabled: boolean, pollMs = 30000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setCount(await fetchChatUnreadCount());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    refresh();
    const interval = setInterval(refresh, pollMs);
    return () => clearInterval(interval);
  }, [enabled, refresh, pollMs]);

  useEffect(() => {
    const handler = (e: Event) => {
      setCount((e as CustomEvent<{ count: number }>).detail.count);
    };
    window.addEventListener(CHAT_UNREAD_EVENT, handler);
    return () => window.removeEventListener(CHAT_UNREAD_EVENT, handler);
  }, []);

  return { count, refresh };
}
