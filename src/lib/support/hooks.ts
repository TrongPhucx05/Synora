"use client";
import { useCallback, useEffect, useState } from "react";
import type { RateLimitStatusResponse } from "./types";

export function useSupportRateLimitStatus(email?: string) {
  const [status, setStatus] = useState<RateLimitStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (email) params.set("email", email);
      const res = await fetch(
        `/api/support/rate-limit-status?${params.toString()}`,
      );
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
