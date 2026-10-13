"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, MessageCircle, X } from "lucide-react";
import { socialStyle } from "./social-icons";

export interface ContactLink {
  platform: string;
  url: string;
}

/**
 * Floating "تواصل معنا" bubble that opens a list of every contact channel (WhatsApp,
 * phone, and the store's social pages managed in the admin), plus scroll-to-top.
 */
export function FloatingWidgets({
  whatsappNumber,
  showWhatsapp,
  phoneDisplay,
  phoneHref,
  mapsUrl,
  socialLinks,
}: {
  whatsappNumber: string;
  /** Admin "الزر العائم" WhatsApp option. */
  showWhatsapp: boolean;
  phoneDisplay: string;
  phoneHref: string;
  /** Store location link from the admin contact settings. */
  mapsUrl?: string;
  socialLinks: ContactLink[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links: ContactLink[] = [
    ...(whatsappNumber && showWhatsapp ? [{ platform: "WhatsApp", url: `https://wa.me/${whatsappNumber}` }] : []),
    ...socialLinks.filter((s) => !socialStyle(s.platform, s.url).label.startsWith("WhatsApp")),
    // Only add the settings map link when the social links don't already include a map.
    ...(mapsUrl && !socialLinks.some((s) => socialStyle(s.platform, s.url).Icon === socialStyle("map").Icon)
      ? [{ platform: "Google Maps", url: mapsUrl }]
      : []),
    ...(phoneHref ? [{ platform: phoneDisplay, url: phoneHref }] : []),
  ];

  return (
    <>
      <div ref={box} className="fixed start-5 bottom-5 z-[90]">
        <div
          role="dialog"
          aria-label="قنوات التواصل"
          inert={!open}
          className={`absolute start-0 bottom-[70px] w-[260px] origin-bottom-right overflow-hidden rounded-[10px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-300 ltr:origin-bottom-left ${
            open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
          }`}
        >
          <p className="bg-ay-primary px-4 py-3 text-[14px] font-semibold text-white">تواصل معنا عبر</p>
          <ul className="py-1">
            {links.map((l) => {
              const { label, color, Icon } = socialStyle(l.platform, l.url);
              const isPhone = l.url.startsWith("tel:");
              return (
                <li key={`${l.platform}-${l.url}`}>
                  <a
                    href={l.url}
                    target={isPhone ? undefined : "_blank"}
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-ay-title transition-colors hover:bg-ay-page"
                  >
                    <span className="grid size-9 flex-none place-items-center rounded-full text-white" style={{ background: color }}>
                      <Icon className="size-[18px]" />
                    </span>
                    <span dir={isPhone ? "ltr" : undefined}>{isPhone ? l.platform : label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="تواصل معنا"
          className="group flex items-center gap-2"
        >
          <span className="grid size-[56px] place-items-center rounded-full bg-ay-whatsapp text-white shadow-[0_0_0_0_rgba(30,190,87,0.62)] transition-transform duration-300 animate-[whatsapp-pulse_2s_ease-out_infinite] group-hover:scale-105">
            {open ? <X className="size-[24px]" /> : <MessageCircle className="size-[26px]" />}
          </span>
          <span className="hidden rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-ay-title shadow-[0_2px_8px_rgba(0,0,0,0.15)] sm:inline">
            تواصل معنا
          </span>
        </button>
      </div>

      <button
        type="button"
        aria-label="العودة للأعلى"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed end-5 bottom-5 z-[90] grid size-[50px] place-items-center rounded-full bg-white text-ay-title shadow-[0_0_5px_rgba(0,0,0,0.17)] transition-all duration-300 hover:text-ay-primary ${
          scrolled ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ChevronUp className="size-5" />
      </button>
    </>
  );
}
