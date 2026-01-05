"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LocalizedText } from "@/types/localized";

type Language = "en" | "fr";

type LanguageContextValue = {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  getLocalizedText: (value: LocalizedText) => string;
};

const LANGUAGE_STORAGE_KEY = "gallery_language";

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.gallery": "Gallery",
    "nav.about": "About Me",
    "nav.contact": "Contact",
    "nav.language.english": "English",
    "nav.language.french": "Francais",
    "footer.admin": "Admin",
    "footer.brand": "Gallery",
    "footer.tagline": "Capturing moments, creating memories.",
    "footer.home": "Home",
    "footer.about": "About",
    "footer.contact": "Contact",
    "footer.rights": "© {year} Gallery. All rights reserved.",
    "home.title": "My Portfolio",
    "home.subtitle": "Explore my collection of works",
    "home.previous": "Previous",
    "home.next": "Next",
    "home.loading": "Loading...",
    "home.error": "Failed to load gallery items.",
    "home.empty": "No gallery items yet.",
    "gallery.back": "Back to Gallery",
    "gallery.imageAlt": "{title} - Image {index}",
    "about.title": "About Me",
    "about.subtitle": "Discover the story behind our gallery",
    "about.imageAlt": "Our studio",
    "about.story.title": "Our Story",
    "about.story.p1":
      "Founded with a passion for visual storytelling, our gallery has been curating exceptional photography from around the world. We believe that every image has a story to tell, and our mission is to share these stories with you.",
    "about.story.p2":
      "Our team of dedicated photographers and curators work tirelessly to bring you the most captivating and inspiring images. From breathtaking landscapes to intimate portraits, we showcase the full spectrum of photographic art.",
    "about.values.title": "Our Values",
    "about.values.quality.title": "Quality",
    "about.values.quality.desc":
      "We curate only the finest photographs that meet our high standards of excellence.",
    "about.values.authenticity.title": "Authenticity",
    "about.values.authenticity.desc":
      "Every image in our collection tells a genuine story and captures real moments.",
    "about.values.inspiration.title": "Inspiration",
    "about.values.inspiration.desc":
      "We aim to inspire creativity and appreciation for the art of photography.",
    "contact.title": "Contact Me",
    "contact.subtitle": "We'd love to hear from you",
    "contact.name": "Name",
    "contact.namePlaceholder": "Your name",
    "contact.email": "Email",
    "contact.emailPlaceholder": "your@email.com",
    "contact.message": "Message",
    "contact.messagePlaceholder": "Your message...",
    "contact.send": "Send Message",
    "contact.sending": "Sending...",
    "contact.success":
      "Thank you for your message! We will get back to you soon.",
    "contact.error": "Failed to send your message. Please try again.",
    "contact.otherWays": "Other Ways to Reach Me",
    "contact.emailLabel": "Email:",
    "contact.phoneLabel": "Phone:",
  },
  fr: {
    "nav.gallery": "Galerie",
    "nav.about": "A propos",
    "nav.contact": "Contact",
    "nav.language.english": "Anglais",
    "nav.language.french": "Francais",
    "footer.admin": "Admin",
    "footer.brand": "Galerie",
    "footer.tagline": "Capturer des moments, creer des souvenirs.",
    "footer.home": "Accueil",
    "footer.about": "A propos",
    "footer.contact": "Contact",
    "footer.rights": "© {year} Galerie. Tous droits reserves.",
    "home.title": "Mon Portfolio",
    "home.subtitle": "explorez ma collection d'œuvres",
    "home.previous": "Precedent",
    "home.next": "Suivant",
    "home.loading": "Chargement...",
    "home.error": "Impossible de charger la galerie.",
    "home.empty": "Aucun element pour le moment.",
    "gallery.back": "Retour a la galerie",
    "gallery.imageAlt": "{title} - Image {index}",
    "about.title": "A propos de moi",
    "about.subtitle": "Decouvrez l'histoire de notre galerie",
    "about.imageAlt": "Notre studio",
    "about.story.title": "Notre histoire",
    "about.story.p1":
      "Fondee avec une passion pour la narration visuelle, notre galerie selectionne des photographies exceptionnelles du monde entier. Nous croyons que chaque image a une histoire a raconter, et notre mission est de partager ces histoires avec vous.",
    "about.story.p2":
      "Notre equipe de photographes et de commissaires dedies travaille sans relache pour vous apporter les images les plus captivantes et inspirantes. Des paysages a couper le souffle aux portraits intimes, nous presentons tout le spectre de l'art photographique.",
    "about.values.title": "Nos valeurs",
    "about.values.quality.title": "Qualite",
    "about.values.quality.desc":
      "Nous selectionnons uniquement les meilleures photographies qui repondent a nos normes elevees d'excellence.",
    "about.values.authenticity.title": "Authenticite",
    "about.values.authenticity.desc":
      "Chaque image de notre collection raconte une histoire authentique et capture des moments reels.",
    "about.values.inspiration.title": "Inspiration",
    "about.values.inspiration.desc":
      "Nous visons a inspirer la creativite et l'appreciation de l'art de la photographie.",
    "contact.title": "Contactez-moi",
    "contact.subtitle": "Nous serions ravis de vous entendre",
    "contact.name": "Nom",
    "contact.namePlaceholder": "Votre nom",
    "contact.email": "Email",
    "contact.emailPlaceholder": "votre@email.com",
    "contact.message": "Message",
    "contact.messagePlaceholder": "Votre message...",
    "contact.send": "Envoyer le message",
    "contact.sending": "Envoi en cours...",
    "contact.success":
      "Merci pour votre message ! Nous vous repondrons bientot.",
    "contact.error": "Echec de l'envoi du message. Veuillez reessayer.",
    "contact.otherWays":
      "Autres moyens de nous joindreAutres moyens de me contacter",
    "contact.emailLabel": "Email:",
    "contact.phoneLabel": "Telephone:",
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "fr") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string) => translations[language][key] ?? key;
    const getLocalizedText = (value: LocalizedText) =>
      value[language] ?? value.en;

    return {
      language,
      toggleLanguage: () =>
        setLanguage((prev) => (prev === "en" ? "fr" : "en")),
      t,
      getLocalizedText,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
