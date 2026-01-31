import { eld } from 'eld/extrasmall';

eld.setLanguageSubset(['en', 'de', 'fr', 'nl', 'es', 'it', 'pt', 'pl', 'sv', 'da']);

export function detectLanguage(text) {
  console.log(`[LinkedIn Language Detector] detectLanguage 被调用, 文本长度: ${text ? text.length : 0}`);
  
  if (!text || text.length < 50) {
    console.log('[LinkedIn Language Detector] 返回 null: 文本太短或为空');
    return { primary: null, languages: [] };
  }
  
  try {
    console.log('[LinkedIn Language Detector] 调用 ELD 检测语言...');
    const result = eld.detect(text);
    console.log(`[LinkedIn Language Detector] ELD 结果: 语言=${result.language}, 可靠=${result.isReliable()}`);
    return {
      primary: result.language,
      reliable: result.isReliable(),
      languages: [result.language]
    };
  } catch (error) {
    console.error('[LinkedIn Language Detector] 检测失败:', error);
    return { primary: null, languages: [], error: true };
  }
}
