'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "hi" | "es" | "ta";

type LanguageOption = {
  code: Language;
  label: string;
  nativeLabel: string;
  fallbacks?: Language[];
};

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  availableLanguages: LanguageOption[];
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", fallbacks: ["en"] },
  { code: "es", label: "Spanish", nativeLabel: "Español", fallbacks: ["en"] },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", fallbacks: ["hi", "en"] },
];

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.horoscope": "Horoscope",
    "nav.past": "Past lives",
    "nav.future": "Future",
    "nav.matchmaking": "Matchmaking",
    "nav.calendar": "Śaka calendar",
    "nav.cta": "Start a session",
    "nav.skip": "Skip to content",
    "nav.tagline": "Quiet guidance across every stage of life.",
    "nav.desc": "Readable predictions, Śaka-ready conversions, and heartfelt remedies in one space.",
    "hero.eyebrow": "Bhrigu Samhita Studio",
    "hero.title": "Bhrigu Jyotish that resonates across generations.",
    "hero.body": "Ancient Bhrigu wisdom rendered in plain English, refined Hindi, and new regional voices. Share narrative insights without JSON plumbing across web, mobile, or chat.",
    "hero.cta.horoscope": "View horoscope",
    "hero.cta.matchmaking": "Matchmaking",
    "hero.badge": "Śaka-aligned • Multilingual ready",
    "home.grid.navigation.title": "Pages for every practice",
    "home.grid.navigation.body": "Jump straight into horoscope, past, future, matchmaking, or calendar flows from navigation or cards.",
    "home.grid.deploy.title": "Ancient wisdom, modern hosting",
    "home.grid.deploy.body": "Set NEXT_PUBLIC_BACKEND_URL once and share the same narratives across mobile, web, and chat.",
    "home.grid.accessibility.title": "Access and languages",
    "home.grid.accessibility.body": "ARIA labels, focus management, and a persistent language switcher keep the experience screen-reader friendly.",
    "form.subtitle": "Bhrigu Samhita aligned",
    "form.helper": "Fill in every detail so remedies and rituals stay precise.",
    "form.name": "Full name",
    "form.birthDate": "Birth date (YYYY-MM-DD)",
    "form.birthTime": "Birth time (HH:MM)",
    "form.birthPlace": "Birth place",
    "form.lunarTithi": "Lunar tithi",
    "form.moonElement": "Moon element",
    "form.marsHouse": "Mars house",
    "form.saturnHouse": "Saturn house",
    "form.venusHouse": "Venus house",
    "form.rahu": "Does Rahu aspect the Ascendant?",
    "form.yes": "Yes",
    "form.no": "No",
    "form.submit": "Request insights",
    "form.loading": "Consulting Bhrigu...",
    "form.accessibility": "After submitting, read results below.",
    "form.error": "Request failed. Please check your inputs.",
    "matchmaking.partner": "Partner details",
    "matchmaking.primary": "Primary details",
    "matchmaking.preferences": "Modern preferences (comma separated)",
    "calendar.title": "Śaka calendar conversion",
    "calendar.helper": "Translate Gregorian birth details into a Śaka context.",
    "results.title": "Results",
    "results.helper": "Clear narratives appear here after submitting.",
    "results.helperRaw": "Share stories directly—no JSON reading required.",
    "pages.horoscope.title": "Horoscope",
    "pages.future.title": "Future direction",
    "pages.past.title": "Past life recall",
    "pages.matchmaking.title": "Modern matchmaking",
    "pages.calendar.title": "Śaka calendar",
  },
  hi: {
    "nav.home": "मुखपृष्ठ",
    "nav.horoscope": "कुंडली",
    "nav.past": "पूर्व जन्म",
    "nav.future": "भविष्य",
    "nav.matchmaking": "विवाह मिलान",
    "nav.calendar": "शक पंचांग",
    "nav.cta": "स्टूडियो आज़माएँ",
    "nav.skip": "सामग्री पर जाएँ",
    "nav.tagline": "हर उम्र के लिए आध्यात्मिक और आधुनिक स्पर्श।",
    "nav.desc": "गहन भृगु ज्ञान को आधुनिक वेब और मोबाइल अनुभव में सुलभ बनाएँ।",
    "hero.eyebrow": "भृगु संहिता स्टूडियो",
    "hero.title": "हर पीढ़ी के लिए गूंजता भृगु ज्योतिष।",
    "hero.body": "सरल अंग्रेज़ी, सुलझी हिंदी, और नए क्षेत्रीय स्वरों में प्रस्तुत प्राचीन भृगु ज्ञान। मोबाइल, वेब या चैट में बिना JSON के सीधे कथाएँ साझा करें।",
    "hero.cta.horoscope": "कुंडली देखें",
    "hero.cta.matchmaking": "संबंध मिलान",
    "hero.badge": "शक-संरेखित • हिंदी + अंग्रेज़ी तैयार",
    "home.grid.navigation.title": "हर साधना के लिए अलग पृष्ठ",
    "home.grid.navigation.body": "नेविगेशन या कार्ड्स से सीधे कुंडली, पूर्व जन्म, भविष्य, मिलान या कैलेंडर पर जाएँ।",
    "home.grid.deploy.title": "प्राचीन ज्ञान, आधुनिक तैनाती",
    "home.grid.deploy.body": "NEXT_PUBLIC_BACKEND_URL सेट करें और वही कथाएँ मोबाइल, वेब और चैट में साझा करें।",
    "home.grid.accessibility.title": "पहुँच और भाषा",
    "home.grid.accessibility.body": "ARIA लेबल, फोकस प्रबंधन, और बहुभाषी स्विचर स्क्रीनरीडर मित्रवत अनुभव देता है।",
    "form.subtitle": "भृगु संहिता अनुरूप",
    "form.helper": "सभी विवरण भरें ताकि सही संस्कार और उपाय मिल सकें।",
    "form.name": "पूरा नाम",
    "form.birthDate": "जन्म तिथि (YYYY-MM-DD)",
    "form.birthTime": "जन्म समय (HH:MM)",
    "form.birthPlace": "जन्म स्थान",
    "form.lunarTithi": "चंद्र तिथि",
    "form.moonElement": "चंद्र तत्व",
    "form.marsHouse": "मंगल भाव",
    "form.saturnHouse": "शनि भाव",
    "form.venusHouse": "शुक्र भाव",
    "form.rahu": "क्या राहु लग्न को देखता है?",
    "form.yes": "हाँ",
    "form.no": "नहीं",
    "form.submit": "सूझ-बूझ प्राप्त करें",
    "form.loading": "भृगु से परामर्श जारी...",
    "form.accessibility": "सबमिट करने के बाद परिणाम नीचे पढ़ें।",
    "form.error": "अनुरोध विफल हुआ। कृपा विवरण जांचें।",
    "matchmaking.partner": "साथी का विवरण",
    "matchmaking.primary": "प्राथमिक विवरण",
    "matchmaking.preferences": "आधुनिक प्राथमिकताएँ (कॉमा से अलग)",
    "calendar.title": "शक पंचांग रूपांतरण",
    "calendar.helper": "ग्रेगोरियन जन्म विवरण को शक संदर्भ में बदलें।",
    "results.title": "परिणाम",
    "results.helper": "फॉर्म जमा करने के बाद साफ़ कथाएँ यहाँ दिखाई देंगी।",
    "results.helperRaw": "कथाएँ सीधे साझा करें—JSON पढ़ने की ज़रूरत नहीं।",
    "pages.horoscope.title": "कुंडली",
    "pages.future.title": "भविष्य दिशा",
    "pages.past.title": "पूर्व जन्म स्मरण",
    "pages.matchmaking.title": "आधुनिक मिलान",
    "pages.calendar.title": "शक कैलेंडर",
  },
  es: {
    "nav.home": "Inicio",
    "nav.horoscope": "Horóscopo",
    "nav.past": "Vidas pasadas",
    "nav.future": "Futuro",
    "nav.matchmaking": "Afinidad",
    "nav.calendar": "Calendario Śaka",
    "nav.cta": "Iniciar sesión",
    "nav.skip": "Saltar al contenido",
    "nav.tagline": "Guía serena para cada etapa de la vida.",
    "nav.desc": "Relatos legibles, conversiones Śaka y remedios en un solo espacio.",
    "hero.eyebrow": "Estudio Bhrigu Samhita",
    "hero.title": "Astrología de Bhrigu que une generaciones.",
    "hero.body": "Sabiduría antigua explicada en inglés claro, hindi y nuevas voces regionales. Comparte narrativas sin JSON en web, móvil o chat.",
    "hero.cta.horoscope": "Ver horóscopo",
    "hero.cta.matchmaking": "Afinidad",
    "hero.badge": "Alineado a Śaka • Listo para varios idiomas",
    "home.grid.navigation.title": "Páginas para cada práctica",
    "home.grid.navigation.body": "Accede directo a horóscopo, pasado, futuro, afinidad o calendario desde la navegación o tarjetas.",
    "home.grid.deploy.title": "Sabiduría ancestral, hosting moderno",
    "home.grid.deploy.body": "Define NEXT_PUBLIC_BACKEND_URL y comparte las narrativas en móvil, web y chat.",
    "home.grid.accessibility.title": "Acceso y lenguas",
    "home.grid.accessibility.body": "Etiquetas ARIA y un selector de idioma persistente mantienen la experiencia accesible.",
    "form.subtitle": "Alineado a Bhrigu Samhita",
    "form.helper": "Completa cada dato para que los remedios sigan siendo precisos.",
    "form.name": "Nombre completo",
    "form.birthDate": "Fecha de nacimiento (AAAA-MM-DD)",
    "form.birthTime": "Hora de nacimiento (HH:MM)",
    "form.birthPlace": "Lugar de nacimiento",
    "form.lunarTithi": "Tithi lunar",
    "form.moonElement": "Elemento lunar",
    "form.marsHouse": "Casa de Marte",
    "form.saturnHouse": "Casa de Saturno",
    "form.venusHouse": "Casa de Venus",
    "form.rahu": "¿Rahu aspecta el Ascendente?",
    "form.yes": "Sí",
    "form.no": "No",
    "form.submit": "Solicitar guía",
    "form.loading": "Consultando a Bhrigu...",
    "form.accessibility": "Después de enviar, lee los resultados abajo.",
    "form.error": "La solicitud falló. Revisa los datos.",
    "matchmaking.partner": "Datos de la pareja",
    "matchmaking.primary": "Datos principales",
    "matchmaking.preferences": "Preferencias modernas (separadas por comas)",
    "calendar.title": "Conversión de calendario Śaka",
    "calendar.helper": "Convierte los datos de nacimiento gregorianos a un contexto Śaka.",
    "results.title": "Resultados",
    "results.helper": "Las narrativas aparecerán aquí después de enviar.",
    "results.helperRaw": "Comparte historias directamente—sin leer JSON.",
    "pages.horoscope.title": "Horóscopo",
    "pages.future.title": "Dirección futura",
    "pages.past.title": "Recuerdo de vidas",
    "pages.matchmaking.title": "Afinidad moderna",
    "pages.calendar.title": "Calendario Śaka",
  },
  ta: {
    "nav.home": "முகப்பு",
    "nav.horoscope": "ஜாதகம்",
    "nav.past": "முந்தைய பிறப்பு",
    "nav.future": "எதிர்காலம்",
    "nav.matchmaking": "இணைவகம்",
    "nav.calendar": "சாக காலண்டர்",
    "nav.cta": "அமர்வை தொடங்குங்கள்",
    "nav.skip": "உள்ளடக்கத்திற்கு தாவவும்",
    "nav.tagline": "வாழ்க்கையின் ஒவ்வொரு கட்டத்திற்கும் அமைதியான வழிகாட்டல்.",
    "nav.desc": "படிக்க எளிய தீர்க்கதரிசனங்கள், சாக மாற்றங்கள், மருந்துகள்—all in one.",
    "hero.eyebrow": "பிருகு சம்ஹிதா நிலையம்",
    "hero.title": "தலைமுறைகளைக் கவரும் பிருகு ஜோதிடம்.",
    "hero.body": "தெளிவான ஆங்கிலம், நுட்பமான हिंदी, மற்றும் பிராந்திய குரல்களில் பழம்பெரும் ஞானம். வலை, கைப்பேசி, உரையாடலில் JSON இல்லாமல் கதைகளைப் பகிரவும்.",
    "hero.cta.horoscope": "ஜாதகத்தைப் பார்க்க",
    "hero.cta.matchmaking": "இணைவகம்",
    "hero.badge": "சாக இணைப்பு • பல்மொழி தயார்",
    "home.grid.navigation.title": "ஒவ்வொரு பயிற்சிக்கும் தனிப் பக்கம்",
    "home.grid.navigation.body": "வழிசெலுத்தல் அல்லது அட்டைகளில் இருந்து ஜாதகம், கடந்த/எதிர்காலம், இணைவகம், காலண்டர் ஆகியவற்றில் குதிக்கவும்.",
    "home.grid.deploy.title": "பழமையான ஞானம், நவீன ஒழுங்கு",
    "home.grid.deploy.body": "NEXT_PUBLIC_BACKEND_URL அமைத்து அதே கதைகளை மொபைல், வலை, உரையாடலில் பகிரவும்.",
    "home.grid.accessibility.title": "அணுகல் மற்றும் மொழிகள்",
    "home.grid.accessibility.body": "ARIA குறிச்சொற்கள் மற்றும் நிரந்தர மொழி மாறி அனுபவத்தை எளிதாக்குகிறது.",
    "form.subtitle": "பிருகு சம்ஹிதா இணைப்பு",
    "form.helper": "சரியான பரிகாரம் கிடைக்க ஒவ்வொரு விவரமும் நிரப்பவும்.",
    "form.name": "முழுப் பெயர்",
    "form.birthDate": "பிறந்த தேதி (YYYY-MM-DD)",
    "form.birthTime": "பிறந்த நேரம் (HH:MM)",
    "form.birthPlace": "பிறந்த இடம்",
    "form.lunarTithi": "நிலா திதி",
    "form.moonElement": "நிலா தத்துவம்",
    "form.marsHouse": "செவ்வாய் வீடு",
    "form.saturnHouse": "சனி வீடு",
    "form.venusHouse": "சுக்கிரன் வீடு",
    "form.rahu": "ராகு லக்னத்தை நோக்குகிறதா?",
    "form.yes": "ஆமாம்",
    "form.no": "இல்லை",
    "form.submit": "வழிகாட்டல் கோரவும்",
    "form.loading": "பிருகுவிடம் ஆலோசனை...",
    "form.accessibility": "சமர்ப்பித்த பிறகு முடிவுகளை கீழே வாசிக்கவும்.",
    "form.error": "கோரிக்கை தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்.",
    "matchmaking.partner": "கூட்டாளர் விவரம்",
    "matchmaking.primary": "முதன்மை விவரம்",
    "matchmaking.preferences": "நவீன விருப்பங்கள் (கமாவால் பிரிக்கவும்)",
    "calendar.title": "சாக காலண்டர் மாற்றம்",
    "calendar.helper": "கிரிகோரியன் பிறப்பு விவரங்களை சாக சூழலில் மாற்றவும்.",
    "results.title": "விளைவுகள்",
    "results.helper": "சமர்ப்பித்த பிறகு தெளிவான கதைகள் இங்கே தோன்றும்.",
    "results.helperRaw": "கதைகளை நேரடியாகப் பகிரவும்—JSON படிப்பதில்லை.",
    "pages.horoscope.title": "ஜாதகம்",
    "pages.future.title": "எதிர்கால திசை",
    "pages.past.title": "முந்தைய பிறப்பு நினைவு",
    "pages.matchmaking.title": "நவீன இணைவகம்",
    "pages.calendar.title": "சாக காலண்டர்",
  },
};

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => undefined,
  t: (_key: string, fallback?: string) => fallback || "",
  availableLanguages: LANGUAGE_OPTIONS,
});

function resolveLanguage(preferred?: string): Language {
  const stored = preferred?.toLowerCase();
  const validCodes = new Set(LANGUAGE_OPTIONS.map((option) => option.code));
  if (stored && validCodes.has(stored as Language)) {
    return stored as Language;
  }

  const browserLanguage = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : undefined;
  if (browserLanguage && validCodes.has(browserLanguage as Language)) {
    return browserLanguage as Language;
  }

  const defaultEnv = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE?.toLowerCase();
  if (defaultEnv && validCodes.has(defaultEnv as Language)) {
    return defaultEnv as Language;
  }

  return "en";
}

function translate(lang: Language, key: string, fallback?: string): string {
  const config = LANGUAGE_OPTIONS.find((option) => option.code === lang);
  const fallbacks = config?.fallbacks || [];
  const lookupOrder: Language[] = [lang, ...fallbacks, "en"];

  for (const candidate of lookupOrder) {
    const translated = translations[candidate]?.[key];
    if (translated) return translated;
  }

  return fallback || key;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => resolveLanguage(undefined));

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("bhriguwelt.lang") : null;
    if (stored) {
      setLang(resolveLanguage(stored));
    }
  }, []);

  const setLanguage = (value: Language) => {
    setLang(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhriguwelt.lang", value);
    }
  };

  const value = useMemo(
    () => ({
      lang,
      setLang: setLanguage,
      t: (key: string, fallback?: string) => translate(lang, key, fallback),
      availableLanguages: LANGUAGE_OPTIONS,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
