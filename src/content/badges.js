const BADGE_CLASS = 'li-lang-badge';

export function createBadge(languageCode) {
  const badge = document.createElement('span');
  badge.className = BADGE_CLASS;
  badge.textContent = languageCode.toUpperCase();
  
  const isEnglish = languageCode === 'en';
  badge.style.cssText = `
    display: inline-block;
    padding: 2px 6px;
    margin-left: 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    background: ${isEnglish ? '#e8f5e9' : '#ffebee'};
    color: ${isEnglish ? '#2e7d32' : '#c62828'};
    border: 1px solid ${isEnglish ? '#a5d6a7' : '#ef9a9a'};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    vertical-align: middle;
    line-height: 1;
  `;
  
  return badge;
}

export function injectBadge(jobCard, badge) {
  const titleSelectors = [
    '.job-card-list__title',
    '.artdeco-entity-lockup__title',
    'h3',
    '.job-card-container__link'
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = jobCard.querySelector(selector);
    if (titleElement) {
      const existingBadge = titleElement.querySelector('.' + BADGE_CLASS);
      if (!existingBadge) {
        titleElement.appendChild(badge);
      }
      return;
    }
  }
  
  jobCard.style.position = 'relative';
  badge.style.cssText += 'position: absolute; top: 8px; right: 8px;';
  jobCard.appendChild(badge);
}
