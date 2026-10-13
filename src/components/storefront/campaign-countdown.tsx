"use client";

import { useEffect, useState } from "react";

/**
 * Countdown to a campaign's end time. Renders nothing on the server and for the first
 * client render — computing "time remaining" needs `Date.now()`, which necessarily differs
 * between the server's render time and the client's hydration time; rendering it
 * server-side would produce a guaranteed text mismatch (React hydration warning) for a
 * value that's wrong the instant it appears anyway. Mounting client-only sidesteps that
 * without faking a shared initial value.
 */
export function CampaignCountdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    function tick() {
      setRemaining(Math.max(0, end - Date.now()));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (remaining == null || remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div dir="ltr" className={`inline-flex items-center gap-1 font-mono text-xs ${className ?? ""}`} role="timer" aria-live="off">
      {days > 0 && <span>{days}d</span>}
      <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
    </div>
  );
}
