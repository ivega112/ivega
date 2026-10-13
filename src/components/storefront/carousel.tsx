"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Scroll-snap carousel with reference-style arrows above the track; touch swipe works natively. */
export function Carousel({
  children,
  title,
  itemClass = "w-1/2 lg:w-1/4",
  autoplayMs = 4000,
  bare = false,
}: {
  children: React.ReactNode[];
  title?: React.ReactNode;
  itemClass?: string;
  /** Advance one card every N ms (0 disables); loops back to the start. */
  autoplayMs?: number;
  /** No title/arrow bar — just the moving track (used for banner rows). */
  bare?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    // In RTL, scrollLeft is 0 at the start and negative going forward.
    const pos = Math.abs(el.scrollLeft);
    setCanPrev(pos > 4);
    setCanNext(pos + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  // Auto-advance one card at a time, pausing while hovered/touched or off-screen tab.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!autoplayMs || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const rtl = getComputedStyle(el).direction === "rtl";
      const pos = Math.abs(el.scrollLeft);
      if (pos + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
        el.scrollBy({ left: step * (rtl ? -1 : 1), behavior: "smooth" });
      }
    }, autoplayMs);
    return () => clearInterval(t);
  }, [autoplayMs, paused]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * el.clientWidth * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const arrow = "grid size-[30px] place-items-center text-ay-title transition-opacity hover:text-ay-primary disabled:cursor-default disabled:opacity-40";

  return (
    <div>
      <div className={`mb-[15px] flex min-h-[30px] items-center justify-between gap-4 ${bare ? "hidden" : ""}`}>
        <div className="min-w-0">{title}</div>
        <div className="flex flex-none items-center gap-1">
          <button type="button" aria-label="السابق" disabled={!canPrev} onClick={() => go(-1)} className={arrow}>
            <ChevronRight className="size-5 ltr:rotate-180" />
          </button>
          <button type="button" aria-label="التالي" disabled={!canNext} onClick={() => go(1)} className={arrow}>
            <ChevronLeft className="size-5 ltr:rotate-180" />
          </button>
        </div>
      </div>
      <div
        ref={track}
        onScroll={update}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
        className="ay-no-scrollbar -mx-[5px] flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain lg:-mx-[10px]">
        {children.map((child, i) => (
          <div key={i} className={`flex-none snap-start px-[5px] lg:px-[10px] ${itemClass}`}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
