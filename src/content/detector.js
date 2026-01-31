import { eld } from 'eld/extrasmall';

eld.setLanguageSubset(['en', 'de', 'fr', 'nl', 'es', 'it', 'pt', 'pl', 'sv', 'da']);

export function detectLanguage(text) {
  if (!text || text.length < 50) {
    return { primary: null, languages: [] };
  }
  
  try {
    const result = eld.detect(text);
    return {
      primary: result.language,
      reliable: result.isReliable(),
      languages: [result.language]
    };
  } catch (error) {
    console.error('[Language Detector] Detection failed:', error);
    return { primary: null, languages: [], error: true };
  }
}
