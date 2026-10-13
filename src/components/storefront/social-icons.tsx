import { Globe, MapPin, MessageCircle, Phone } from "lucide-react";

type IconProps = { className?: string };

function Facebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
    </svg>
  );
}

function Instagram({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTok({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z" />
    </svg>
  );
}

function YouTube({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  );
}

/** Icon + brand colour for a free-text social platform name entered in the admin. */
export function socialStyle(platform: string, url = ""): { label: string; color: string; Icon: React.ComponentType<IconProps> } {
  const key = `${platform} ${url}`.toLowerCase();
  if (key.includes("whatsapp") || key.includes("wa.me")) return { label: "WhatsApp", color: "#1ebe57", Icon: MessageCircle };
  if (key.includes("facebook") || key.includes("fb.")) return { label: "Facebook", color: "#1877f2", Icon: Facebook };
  if (key.includes("instagram")) return { label: "Instagram", color: "#d6249f", Icon: Instagram };
  if (key.includes("tiktok")) return { label: "TikTok", color: "#000000", Icon: TikTok };
  if (key.includes("youtube")) return { label: "YouTube", color: "#ff0000", Icon: YouTube };
  if (key.includes("map") || key.includes("goo.gl") || key.includes("google")) return { label: "الموقع على الخريطة", color: "#ea4335", Icon: MapPin };
  if (key.startsWith("tel") || key.includes("tel:")) return { label: "اتصال", color: "#0274b3", Icon: Phone };
  return { label: platform, color: "#555555", Icon: Globe };
}
