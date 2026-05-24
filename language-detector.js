"use strict";

/**
 * Language detection module.
 * Progressively enhances with the browser's native LanguageDetector API (Chrome 138+)
 * and falls back to a custom heuristic-based detector using surrounding text context
 * and common word patterns.
 */
const LanguageDetector = (() => {
  // Native detector instance (Chrome 138+ only)
  let nativeDetector = null;
  let nativeDetectorReady = false;

  // Common words per language for contextual detection (fallback)
  const LANGUAGE_MARKERS = {
    de: {
      words: new Set([
        "der", "die", "das", "und", "ist", "ein", "eine", "nicht", "sich",
        "mit", "auf", "für", "auch", "aber", "von", "dem", "den", "des",
        "wie", "noch", "nach", "wird", "bei", "einer", "kann", "aus",
        "wenn", "hat", "sind", "werden", "haben", "über", "oder", "ihr",
        "dann", "sehr", "mehr", "schon", "wurde", "diese", "dieser",
        "dieses", "durch", "wir", "alle", "nur", "zum", "zur", "vor",
        "bis", "unter", "zwischen", "ohne", "gegen", "während", "immer",
        "wieder", "andere", "anderen", "viel", "weil", "dort", "hier",
        "heute", "gestern", "morgen", "jetzt", "ganz", "gerade",
      ]),
      patterns: [/sch\w/i, /\w{2,}ung$/i, /\w{2,}keit$/i, /\w{2,}heit$/i, /\w{2,}lich$/i, /ä|ö|ü|ß/i],
    },
    en: {
      words: new Set([
        "the", "and", "is", "are", "was", "were", "been", "being",
        "have", "has", "had", "having", "do", "does", "did", "doing",
        "will", "would", "could", "should", "may", "might", "shall",
        "can", "need", "dare", "ought", "used", "this", "that", "these",
        "those", "what", "which", "who", "whom", "whose", "where",
        "when", "why", "how", "not", "very", "really", "just", "also",
        "than", "then", "only", "about", "into", "through", "during",
        "before", "after", "above", "below", "between", "because",
        "while", "although", "though", "however", "therefore",
      ]),
      patterns: [/\w+tion$/i, /\w+ing$/i, /\w+ness$/i, /\w+ment$/i, /\w+ous$/i],
    },
    fr: {
      words: new Set([
        "le", "la", "les", "un", "une", "des", "est", "sont", "être",
        "avoir", "fait", "dans", "pour", "pas", "que", "sur", "avec",
        "tout", "mais", "aussi", "plus", "cette", "comme", "très",
        "bien", "nous", "vous", "leur", "leurs", "entre", "même",
        "autre", "après", "avant", "encore", "toujours", "jamais",
        "rien", "quelque", "chaque", "depuis", "pendant", "parce",
      ]),
      patterns: [/\w+eux$/i, /\w+euse$/i, /\w+ment$/i, /\w+tion$/i, /[àâéèêëîïôùûüç]/i],
    },
    es: {
      words: new Set([
        "el", "los", "las", "una", "unos", "unas", "del", "está",
        "son", "ser", "estar", "tiene", "para", "por", "con", "como",
        "pero", "más", "muy", "también", "entre", "cuando", "donde",
        "todo", "esta", "este", "estos", "estas", "otro", "otra",
        "otros", "otras", "puede", "desde", "hasta", "sobre", "después",
        "antes", "siempre", "nunca", "nada", "algo", "cada", "porque",
      ]),
      patterns: [/\w+ción$/i, /\w+mente$/i, /[áéíóúñ¿¡]/i],
    },
    it: {
      words: new Set([
        "il", "lo", "gli", "una", "dei", "delle", "degli", "della",
        "sono", "essere", "avere", "fatto", "nella", "nella", "per",
        "con", "come", "anche", "più", "questa", "questo", "molto",
        "bene", "sempre", "ancora", "dopo", "prima", "ogni", "tutto",
        "tutti", "altro", "altra", "altri", "altre", "perché", "quando",
        "dove", "quale", "quali", "senza", "tra", "fra", "durante",
      ]),
      patterns: [/\w+zione$/i, /\w+mente$/i, /\w+ità$/i, /[àèéìòù]/i],
    },
    pt: {
      words: new Set([
        "os", "as", "uma", "umas", "uns", "dos", "das", "está",
        "são", "ser", "estar", "tem", "para", "por", "com", "como",
        "mas", "mais", "muito", "também", "entre", "quando", "onde",
        "todo", "esta", "este", "estes", "estas", "outro", "outra",
        "outros", "outras", "pode", "desde", "até", "sobre", "depois",
        "antes", "sempre", "nunca", "nada", "algo", "cada", "porque",
      ]),
      patterns: [/\w+ção$/i, /\w+mente$/i, /[ãõáéíóúâêô]/i, /\w+nh\w/i],
    },
    tr: {
      words: new Set([
        "bir", "ve", "bu", "için", "ile", "olan", "gibi", "daha",
        "çok", "var", "ben", "sen", "biz", "siz", "onlar", "ama",
        "ancak", "hem", "ya", "veya", "kadar", "sonra", "önce",
        "şimdi", "zaman", "nasıl", "neden", "nerede", "kim", "hangi",
        "her", "hiç", "bazı", "tüm", "bütün", "değil", "ise", "olarak",
        "arasında", "üzerinde", "altında", "içinde", "dışında", "göre",
        "karşı", "bile", "sadece", "yalnız", "hala", "artık", "yine",
      ]),
      patterns: [/[çğıöşü]/i, /\w+lar$/i, /\w+ler$/i, /\w+lık$/i, /\w+lik$/i, /\w+mak$/i, /\w+mek$/i],
    },
    hu: {
      words: new Set([
        "egy", "az", "és", "hogy", "nem", "van", "volt", "meg",
        "már", "csak", "még", "mint", "igen", "vagy", "sem", "aki",
        "ami", "ahol", "amikor", "mert", "pedig", "tehát", "így",
        "úgy", "itt", "ott", "most", "akkor", "minden", "sok",
        "nagy", "kis", "jó", "új", "régi", "más", "első", "után",
        "között", "alatt", "felett", "mellett", "ellen", "által",
        "szerint", "miatt", "felé", "körül", "nélkül", "helyett",
      ]),
      patterns: [/[áéíóöőúüű]/i, /\w+ság$/i, /\w+ség$/i, /\w+nak$/i, /\w+nek$/i, /\w+ban$/i, /\w+ben$/i],
    },
    uk: {
      words: new Set([
        "і", "в", "на", "що", "не", "це", "як", "він", "вона",
        "вони", "ми", "ви", "але", "та", "або", "бо", "якщо",
        "коли", "де", "хто", "який", "яка", "яке", "які", "все",
        "так", "ні", "ще", "вже", "тут", "там", "тепер", "потім",
        "після", "перед", "між", "під", "над", "без", "для", "про",
        "від", "до", "із", "за", "через", "також", "дуже", "більше",
      ]),
      patterns: [/[іїєґ]/i, /\w+ння$/i, /\w+ість$/i, /\w+ти$/i, /\w+ють$/i],
    },
    ru: {
      words: new Set([
        "и", "в", "на", "что", "не", "это", "как", "он", "она",
        "они", "мы", "вы", "но", "или", "если", "когда", "где",
        "кто", "который", "которая", "которое", "которые", "все",
        "так", "нет", "ещё", "уже", "тут", "там", "теперь", "потом",
        "после", "перед", "между", "под", "над", "без", "для", "про",
        "от", "до", "из", "за", "через", "тоже", "очень", "больше",
        "только", "можно", "нужно", "было", "будет", "есть", "быть",
      ]),
      patterns: [/[ыэъ]/i, /\w+ние$/i, /\w+ость$/i, /\w+ть$/i, /\w+ют$/i, /\w+ция$/i],
    },
    el: {
      words: new Set([
        "και", "το", "τα", "της", "του", "των", "στο", "στη",
        "στα", "από", "για", "με", "σε", "ένα", "μια", "είναι",
        "αυτό", "αυτή", "αυτός", "που", "δεν", "θα", "να", "αλλά",
        "ή", "αν", "όταν", "πού", "πώς", "ποιος", "ποια", "ποιο",
        "όλα", "πολύ", "πιο", "μόνο", "ακόμα", "εδώ", "εκεί",
        "τώρα", "μετά", "πριν", "μεταξύ", "χωρίς", "κατά", "επίσης",
      ]),
      patterns: [/[αβγδεζηθικλμνξοπρστυφχψω]/i, /\w+ος$/i, /\w+ης$/i, /\w+ων$/i, /\w+ση$/i],
    },
    la: {
      words: new Set([
        "et", "in", "est", "non", "ad", "cum", "sed", "qui",
        "quae", "quod", "ut", "aut", "vel", "nec", "nam", "enim",
        "autem", "tamen", "igitur", "ergo", "quia", "quod", "sic",
        "ita", "tam", "hic", "haec", "hoc", "ille", "illa", "illud",
        "omnis", "omnes", "omnia", "magnus", "magna", "magnum",
        "bonus", "bona", "bonum", "inter", "ante", "post", "super",
        "sub", "per", "pro", "contra", "sine", "apud", "circa",
      ]),
      patterns: [/\w+us$/i, /\w+um$/i, /\w+orum$/i, /\w+arum$/i, /\w+ibus$/i, /\w+tion\w*/i],
    },
    he: {
      words: new Set([
        "של", "על", "את", "זה", "לא", "כי", "גם", "אם", "או",
        "אבל", "עם", "הוא", "היא", "הם", "הן", "אני", "אתה",
        "את", "אנחנו", "אתם", "מה", "איך", "למה", "מתי", "איפה",
        "מי", "כל", "רק", "עוד", "כבר", "פה", "שם", "עכשיו",
        "אחרי", "לפני", "בין", "בלי", "בשביל", "לפי", "נגד",
        "מאוד", "יותר", "פחות", "אולי", "תמיד", "אף", "שום",
      ]),
      patterns: [/[\u0590-\u05FF]/],
    },
  };

  /**
   * Initialize the native LanguageDetector API if available (Chrome 138+).
   * This is a progressive enhancement — the extension works without it.
   */
  async function initNativeDetector() {
    if (!("LanguageDetector" in globalThis)) {
      return;
    }

    try {
      const availability = await globalThis.LanguageDetector.availability();
      if (availability === "unavailable") {
        return;
      }

      // Only create if the model is readily available (don't trigger downloads)
      if (availability === "available") {
        nativeDetector = await globalThis.LanguageDetector.create();
        nativeDetectorReady = true;
      }
    } catch {
      // Silently fall back to heuristic detection
    }
  }

  // Attempt native detector initialization (non-blocking)
  initNativeDetector();

  /**
   * Extract surrounding text context from a selection.
   * @param {Selection} selection - The current text selection
   * @param {number} radius - Number of characters to capture around selection
   * @returns {string} The surrounding text
   */
  function getSurroundingText(selection, radius = 200) {
    if (!selection || selection.rangeCount === 0) {
      return "";
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Walk up to find a block-level element for better context
    let contextNode = container;
    const blockElements = new Set([
      "P", "DIV", "ARTICLE", "SECTION", "LI", "TD", "TH",
      "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6",
    ]);

    while (contextNode.parentNode && !blockElements.has(contextNode.nodeName)) {
      contextNode = contextNode.parentNode;
    }

    const fullText = contextNode.textContent || "";
    const selectedText = selection.toString().trim();
    const selectionIndex = fullText.indexOf(selectedText);

    if (selectionIndex === -1) {
      return fullText.slice(0, radius * 2);
    }

    const start = Math.max(0, selectionIndex - radius);
    const end = Math.min(fullText.length, selectionIndex + selectedText.length + radius);

    return fullText.slice(start, end);
  }

  /**
   * Score a language based on word matches and pattern matches in the text.
   * @param {string} text - Text to analyze
   * @param {string} langCode - Language code to score
   * @returns {number} Confidence score
   */
  function scoreLanguage(text, langCode) {
    const lang = LANGUAGE_MARKERS[langCode];
    if (!lang) return 0;

    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    let score = 0;

    // Score common words
    for (const word of words) {
      // Strip basic punctuation for matching
      const cleaned = word.replace(/[.,;:!?"""''()[\]{}]/g, "");
      if (lang.words.has(cleaned)) {
        score += 2;
      }
    }

    // Score character/morphology patterns
    for (const pattern of lang.patterns) {
      const matches = text.match(new RegExp(pattern.source, "gi"));
      if (matches) {
        score += matches.length;
      }
    }

    return score;
  }

  /**
   * Detect language using the heuristic (fallback) approach.
   * @param {string} surroundingText - Text context around the selection
   * @returns {string} Detected language code
   */
  function detectHeuristic(surroundingText) {
    const pageLang = getPageLanguage();

    if (!surroundingText || surroundingText.trim().length < 10) {
      return pageLang;
    }

    const scores = {};
    let maxScore = 0;
    let detectedLang = pageLang;

    for (const langCode of Object.keys(LANGUAGE_MARKERS)) {
      scores[langCode] = scoreLanguage(surroundingText, langCode);
      if (scores[langCode] > maxScore) {
        maxScore = scores[langCode];
        detectedLang = langCode;
      }
    }

    // Require a minimum confidence threshold
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    const confidence = sortedScores[0] - (sortedScores[1] || 0);

    if (maxScore < 3 || confidence < 2) {
      return pageLang;
    }

    return detectedLang;
  }

  /**
   * Detect the language of the selected text using surrounding context.
   * Uses native LanguageDetector API when available (Chrome 138+),
   * falls back to heuristic detection.
   * @param {Selection} selection - The current text selection
   * @returns {string} BCP 47 language tag (e.g., "de", "en", "fr")
   */
  function detect(selection) {
    const surroundingText = getSurroundingText(selection);
    return detectHeuristic(surroundingText);
  }

  /**
   * Async detection using native API when available.
   * Returns a Promise that resolves to the detected language.
   * @param {Selection} selection - The current text selection
   * @returns {Promise<string>} BCP 47 language tag
   */
  async function detectAsync(selection) {
    const surroundingText = getSurroundingText(selection);

    // Try native detector first (Chrome 138+)
    if (nativeDetectorReady && nativeDetector && surroundingText.trim().length >= 20) {
      try {
        const results = await nativeDetector.detect(surroundingText);
        if (results.length > 0 && results[0].confidence > 0.5) {
          return results[0].detectedLanguage;
        }
      } catch {
        // Fall through to heuristic
      }
    }

    return detectHeuristic(surroundingText);
  }

  /**
   * Get the language declared in the page's HTML element.
   * @returns {string} Language code or "de" as default
   */
  function getPageLanguage() {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      // Normalize: "de-DE" → "de"
      return htmlLang.split("-")[0].toLowerCase();
    }
    // Default to German since this is a German pronunciation helper
    return "de";
  }

  return { detect, detectAsync, getSurroundingText, getPageLanguage };
})();
