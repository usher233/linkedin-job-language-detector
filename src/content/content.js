import { initObserver } from './observer.js';
import { detectLanguage } from './detector.js';
import { createBadge, injectBadge } from './badges.js';

console.log('[LinkedIn Language Detector] Content script loaded');

initObserver((jobCard, descriptionText) => {
  const result = detectLanguage(descriptionText);
  
  if (result.primary && result.primary !== 'en') {
    const badge = createBadge(result.primary);
    injectBadge(jobCard, badge);
  }
});
