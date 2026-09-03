"use client";

type Listener<T> = (value: T) => void;

const cache = new Map<string, unknown>();
const listenersMap = new Map<string, Set<Listener<any>>>();

function getListeners<T>(key: string): Set<Listener<T>> {
  if (!listenersMap.has(key)) listenersMap.set(key, new Set());
  return listenersMap.get(key)!;
}

export function getCachedValue<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCachedValue<T>(key: string, value: T) {
  cache.set(key, value);
  getListeners<T>(key).forEach((l) => l(value));
}

export function subscribe<T>(key: string, listener: Listener<T>) {
  const set = getListeners<T>(key);
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}
