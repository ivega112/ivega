import Image from "next/image";
import Link from "next/link";

/** Photo tile with dark overlay, centred title and blue pill — the reference "promo banner". */
export function PromoBanner({
  href,
  title,
  imageUrl,
  cta = "تسوّق الآن",
  className = "",
}: {
  href: string;
  title: string;
  imageUrl: string | null;
  cta?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`group relative block overflow-hidden rounded-[8px] bg-[#1e1e1e] ${className}`}>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-cover opacity-60 transition-transform duration-[2s] ease-[cubic-bezier(0,0,0.44,1.18)] group-hover:scale-[1.09]"
        />
      )}
      <span className="relative z-[1] flex h-full flex-col items-center justify-center gap-2 p-5 text-center">
        <span className="text-[16px] font-semibold text-white drop-shadow">{title}</span>
        <span className="mt-3 inline-flex h-[38px] items-center rounded-[35px] bg-[#3a8bd8] px-[26px] text-[13px] font-semibold text-white transition-colors group-hover:bg-ay-primary">
          {cta}
        </span>
      </span>
    </Link>
  );
}
