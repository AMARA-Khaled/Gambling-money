"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { joinWithCode } from "@/app/actions/games";

export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const autoTried = useRef(false);

  function submit(value: string) {
    setError(null);
    startTransition(async () => {
      const res = await joinWithCode(value);
      if (res?.error) setError(res.error);
    });
  }

  // Auto-join once when arriving via a QR/shared link with a code.
  useEffect(() => {
    if (initialCode && !autoTried.current) {
      autoTried.current = true;
      submit(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ENTER CODE"
        maxLength={8}
        autoCapitalize="characters"
        autoComplete="off"
        className="tabular w-full rounded-xl border border-border bg-surface/50 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.25em] outline-none transition focus:border-primary"
      />
      {error && <p className="text-center text-sm text-loss">{error}</p>}
      <button
        onClick={() => submit(code)}
        disabled={pending || code.length < 4}
        className="w-full rounded-full bg-primary py-3.5 font-semibold text-primary-fg transition hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join game"}
      </button>
    </div>
  );
}
