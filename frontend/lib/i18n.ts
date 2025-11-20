export type Locale = "en" | "hi";

const messages = {
  en: {
    brand: "BhriguWelt",
    nav: {
      home: "Home",
      horoscope: "Horoscope",
      pastLife: "Past lives",
      future: "Future",
      matchmaking: "Matchmaking",
      calendar: "Śaka calendar",
    },
    hero: {
      title: "Bhrigu studio for every generation",
      subtitle:
        "Consult the Bhrigu Samhita engines for horoscope, past-life, future, matchmaking, and calendar guidance without leaving your browser.",
      primaryCta: "Open the studio",
      secondaryCta: "Explore compatibility",
    },
    footer: {
      tagline: "Designed for Gen Z, accessible for every generation.",
      description:
        "Crafted for responsive web, Vercel deployments, and the Android/iOS builds you want to ship next.",
    },
    accessibility: {
      formHelper: "All fields are required unless noted. Use arrow keys to change number inputs.",
      errorPrefix: "Error:",
      responseIntro: "Results will appear here after you submit the form.",
      responseReady: "Raw JSON you can paste into mobile, web, or chat UI layers.",
    },
  },
  hi: {
    brand: "भृगुवेल्ट",
    nav: {
      home: "मुखपृष्ठ",
      horoscope: "कुंडली",
      pastLife: "पूर्व जन्म",
      future: "भविष्य",
      matchmaking: "ज्योतिष संगतता",
      calendar: "शक पंचांग",
    },
    hero: {
      title: "हर पीढ़ी के लिए भृगु स्टूडियो",
      subtitle:
        "ब्राउज़र से ही भृगु संहिता के कुंडली, पूर्व जन्म, भविष्य, संगतता और पंचांग इंजन तक पहुँचें।",
      primaryCta: "स्टूडियो खोलें",
      secondaryCta: "संगतता देखें",
    },
    footer: {
      tagline: "Gen Z के लिए तैयार, सभी आयु के लिए सुलभ।",
      description:
        "उत्तरदायी वेब, Vercel परिनियोजन, और आपके Android/iOS ऐप्स के लिए तैयार।",
    },
    accessibility: {
      formHelper: "सभी फ़ील्ड अनिवार्य हैं। संख्या इनपुट के लिए तीर कुंजी प्रयोग करें।",
      errorPrefix: "त्रुटि:",
      responseIntro: "फॉर्म जमा करने के बाद परिणाम यहाँ दिखेंगे।",
      responseReady: "कच्चा JSON जिसे आप मोबाइल, वेब या चैट UI में उपयोग कर सकते हैं।",
    },
  },
};

export function getCopy(locale: Locale | undefined): (typeof messages)["en"] {
  if (!locale) return messages.en;
  return messages[locale] ?? messages.en;
}
