import { initObserver } from './observer.js';
import { detectLanguage } from './detector.js';
import { createBadge, injectBadge } from './badges.js';

console.log('[LinkedIn Language Detector] Content script loaded');

initObserver((jobCard, descriptionText) => {
  console.log('[LinkedIn Language Detector] 回调被调用，准备检测语言');
  const result = detectLanguage(descriptionText);
  
  console.log(`[LinkedIn Language Detector] 检测结果: primary=${result.primary}, reliable=${result.reliable}`);
  
  if (result.primary && result.primary !== 'en') {
    console.log(`[LinkedIn Language Detector] 非英语职位 (${result.primary})，准备创建徽章`);
    const badge = createBadge(result.primary);
    injectBadge(jobCard, badge);
  } else if (result.primary === 'en') {
    console.log('[LinkedIn Language Detector] 英语职位，跳过（不显示徽章）');
  } else {
    console.log('[LinkedIn Language Detector] 无法检测语言，跳过');
  }
});
