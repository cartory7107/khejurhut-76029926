import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "EN" | "BN";

const dict = {
  EN: {
    home: "Home",
    shop: "Shop",
    categories: "Categories",
    orders: "Orders",
    admin: "Admin",
    search: "Search premium dates...",
    cart: "Cart",
    wishlist: "Wishlist",
    account: "Account",
    signIn: "Sign in",
    addToCart: "Add to cart",
    buyNow: "Buy now",
    featured: "Signature Collection",
    viewAll: "View all",
    shopCollection: "Shop Collection",
    exploreCategories: "Explore Categories",
    subscribe: "Subscribe",
    joinMajlis: "Join the Majlis",
  },
  BN: {
    home: "হোম",
    shop: "শপ",
    categories: "ক্যাটাগরি",
    orders: "অর্ডার",
    admin: "অ্যাডমিন",
    search: "প্রিমিয়াম খেজুর খুঁজুন...",
    cart: "কার্ট",
    wishlist: "উইশলিস্ট",
    account: "অ্যাকাউন্ট",
    signIn: "সাইন ইন",
    addToCart: "কার্টে যোগ করুন",
    buyNow: "এখনই কিনুন",
    featured: "সিগনেচার কালেকশন",
    viewAll: "সব দেখুন",
    shopCollection: "কালেকশন দেখুন",
    exploreCategories: "ক্যাটাগরি দেখুন",
    subscribe: "সাবস্ক্রাইব",
    joinMajlis: "মজলিসে যোগ দিন",
  },
} as const;

type Key = keyof (typeof dict)["EN"];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("EN");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("kh_lang")) as Lang | null;
    if (saved === "EN" || saved === "BN") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("kh_lang", l);
      document.documentElement.lang = l === "BN" ? "bn" : "en";
    }
  };

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t: (k) => dict[lang][k] ?? dict.EN[k],
  }), [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const v = useContext(I18nCtx);
  if (!v) return { lang: "EN" as Lang, setLang: () => {}, t: (k: Key) => dict.EN[k] };
  return v;
}
