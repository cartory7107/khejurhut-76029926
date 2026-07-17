import { Facebook } from "lucide-react";

const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/amanabazar/",
  whatsapp: "https://api.whatsapp.com/send?phone=%2B8801930107419",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.88 12.7L4 20l3.42-1.08A7.93 7.93 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.68ZM12 18.5A6.46 6.46 0 0 1 6.5 13c0-3.03 2.47-5.5 5.5-5.5s5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5Zm3.1-4.35c-.15-.08-.9-.45-1.04-.5-.14-.05-.24-.08-.34.08-.1.16-.4.5-.5.6-.1.1-.2.12-.35.04a4.8 4.8 0 0 1-1.43-.88 5.3 5.3 0 0 1-.99-1.23c-.1-.17 0-.26.08-.35.08-.08.17-.2.26-.3.08-.1.1-.16.15-.27.05-.1.02-.2-.01-.28-.04-.08-.34-.82-.47-1.12-.12-.29-.24-.25-.34-.26l-.28-.01c-.1 0-.26.04-.4.19-.13.16-.5.48-.5 1.18 0 .7.5 1.37.57 1.46.07.1 1 1.52 2.42 2.13.34.14.6.23.81.29.34.1.65.09.9.05.27-.04.9-.37 1.03-.72.12-.36.12-.66.08-.72-.04-.07-.13-.1-.27-.17Z" />
    </svg>
  );
}

export function SocialTopBar() {
  return (
    <div className="relative z-30 w-full border-b border-gold/10 bg-gradient-to-r from-cocoa via-[#1a1209] to-cocoa">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2">
        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-gold/70 sm:inline">সরাসরি যোগাযোগ</span>
        <a
          href={SOCIAL_LINKS.facebook}
          target="_blank"
          rel="noreferrer"
          aria-label="Facebook page"
          className="group flex items-center gap-2 rounded-full border border-gold/10 bg-background/40 px-3 py-1.5 text-sm text-gold/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-gold/40 hover:bg-background/70 hover:text-gold hover:shadow-gold"
        >
          <Facebook className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          <span className="hidden sm:inline">Facebook</span>
        </a>
        <a
          href={SOCIAL_LINKS.whatsapp}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp chat"
          className="group flex items-center gap-2 rounded-full border border-gold/10 bg-background/40 px-3 py-1.5 text-sm text-gold/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-gold/40 hover:bg-background/70 hover:text-gold hover:shadow-gold"
        >
          <WhatsAppIcon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
