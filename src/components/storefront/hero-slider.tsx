"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroSlideData {
  id: string;
  imageUrl: string | null;
  mediaType: "IMAGE" | "VIDEO";
  videoUrl: string | null;
}

/** Rounded banner slider with fade transition, side arrows and dots below (reference layout). */
export function HeroSlider({ slides }: { slides: HeroSlideData[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => go(index + 1), 5000);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  if (count === 0) return null;

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-[16/7] overflow-hidden bg-[#e9f3fa] sm:aspect-[21/8]">
        {slides.map((s, i) => {
          const active = i === index;
          const body = (
            <>
              {s.mediaType === "VIDEO" && s.videoUrl ? (
                <video src={s.videoUrl} poster={s.imageUrl ?? undefined} autoPlay muted loop playsInline preload={i === 0 ? "auto" : "metadata"} className="size-full object-cover" />
              ) : s.imageUrl ? (
                <Image src={s.imageUrl} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" />
              ) : null}
            </>
          );
          const cls = `absolute inset-0 flex items-center transition-[opacity,visibility] duration-700 ${active ? "visible opacity-100" : "invisible opacity-0"}`;
          return <div key={s.id} aria-hidden={!active} className={cls}>{body}</div>;
        })}
        {count > 1 && (
          <>
            <button type="button" aria-label="الشريحة السابقة" onClick={() => go(index - 1)} className="absolute start-2 top-1/2 z-[2] grid size-10 -translate-y-1/2 place-items-center text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] hover:text-white">
              <ChevronRight className="size-7 ltr:rotate-180" />
            </button>
            <button type="button" aria-label="الشريحة التالية" onClick={() => go(index + 1)} className="absolute end-2 top-1/2 z-[2] grid size-10 -translate-y-1/2 place-items-center text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] hover:text-white">
              <ChevronLeft className="size-7 ltr:rotate-180" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="mt-[10px] flex justify-center gap-[10px]">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`الشريحة ${i + 1}`}
              onClick={() => go(i)}
              className={`size-[6px] rounded-full transition-colors ${i === index ? "bg-[#333]" : "bg-[#ccc] hover:bg-[#999]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
