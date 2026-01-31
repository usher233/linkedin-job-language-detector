console.log('[LinkedIn Language Detector] === 扩展已加载 ===');

const eld = {
  languages: {
    'en': { name: 'English', trigrams: ['the', 'and', 'ing', 'ion', 'tio', 'ent', 'for', 'her', 'tha', 'ate'] },
    'nl': { name: 'Dutch', trigrams: ['van', 'het', 'een', 'ing', 'den', 'ten', 'ter', 'gen', 'der', 'de '] },
    'de': { name: 'German', trigrams: ['der', 'die', 'und', 'sch', 'ein', 'ich', 'ten', 'den', 'che', 'gen'] },
    'fr': { name: 'French', trigrams: ['ion', 'ent', 'les', 'que', 'our', 'ant', 'eur', 'tio', 'est', 'ont'] },
    'es': { name: 'Spanish', trigrams: ['cio', 'ent', 'que', 'los', 'con', 'ado', 'ien', 'nte', 'est', 'per'] },
    'it': { name: 'Italian', trigrams: ['ion', 'ent', 'che', 'per', 'zio', 'del', 'are', 'con', 'lla', 'nti'] },
    'pt': { name: 'Portuguese', trigrams: ['ent', 'que', 'cio', 'ndo', 'con', 'ara', 'ado', 'par', 'est', 'por'] }
  },
  
  detect: function(text) {
    const scores = {};
    const text_lower = text.toLowerCase().replace(/[^a-z\s]/g, '');
    
    for (const [lang, data] of Object.entries(this.languages)) {
      let score = 0;
      for (const trigram of data.trigrams) {
        const count = (text_lower.match(new RegExp(trigram, 'g')) || []).length;
        score += count;
      }
      scores[lang] = score;
    }
    
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const best = sorted[0];
    
    return {
      language: best[0],
      isReliable: () => best[1] > 2
    };
  }
};

const JOB_CARD_SELECTORS = [
  '.job-card-container',
  '[data-job-id]',
  '.jobs-search-results__list-item',
  '.jobs-job-board-list__item'
];

const DESCRIPTION_SELECTORS = [
  '.job-card-list__description',
  '.jobs-description__content',
  '[data-job-description]',
  '.job-details-jobs-unified-top-card__description'
];

const TITLE_SELECTORS = [
  '.job-card-list__title',
  '.artdeco-entity-lockup__title',
  'h3',
  '.job-card-container__link'
];

const processedCards = new Set();

function findJobCards() {
  for (const selector of JOB_CARD_SELECTORS) {
    const cards = document.querySelectorAll(selector);
    if (cards.length > 0) {
      console.log(`[LinkedIn Language Detector] 使用选择器 ${selector} 找到 ${cards.length} 个卡片`);
      return Array.from(cards);
    }
  }
  console.log('[LinkedIn Language Detector] 未找到任何职位卡片');
  return [];
}

function getJobId(jobCard) {
  const jobIdAttr = jobCard.getAttribute('data-job-id');
  if (jobIdAttr) return jobIdAttr;
  
  const link = jobCard.querySelector('a[href*="/jobs/view/"]');
  if (link) {
    const match = link.href.match(/\/jobs\/view\/(\d+)/);
    return match ? match[1] : null;
  }
  
  return null;
}

function extractDescription(jobCard) {
  for (const selector of DESCRIPTION_SELECTORS) {
    const element = jobCard.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 0) {
        console.log(`[LinkedIn Language Detector] 提取描述: ${text.substring(0, 80)}... (${text.length} 字符)`);
        return text;
      }
    }
  }
  return '';
}

function createBadge(languageCode) {
  const badge = document.createElement('span');
  badge.className = 'li-lang-badge';
  badge.textContent = languageCode.toUpperCase();
  
  const isEnglish = languageCode === 'en';
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    margin-left: 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    background: ${isEnglish ? '#e8f5e9' : '#ffebee'};
    color: ${isEnglish ? '#2e7d32' : '#c62828'};
    border: 1px solid ${isEnglish ? '#a5d6a7' : '#ef9a9a'};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    vertical-align: middle;
    line-height: 1;
    min-width: 20px;
  `;
  
  return badge;
}

function injectBadge(jobCard, badge) {
  for (const selector of TITLE_SELECTORS) {
    const titleElement = jobCard.querySelector(selector);
    if (titleElement) {
      const existing = titleElement.querySelector('.li-lang-badge');
      if (!existing) {
        titleElement.appendChild(badge);
        console.log(`[LinkedIn Language Detector] 徽章已注入到 ${selector}`);
        return true;
      }
      return false;
    }
  }
  
  jobCard.style.position = 'relative';
  badge.style.cssText += 'position: absolute; top: 8px; right: 8px; z-index: 1000;';
  jobCard.appendChild(badge);
  console.log('[LinkedIn Language Detector] 徽章已注入（绝对定位）');
  return true;
}

function detectLanguage(text) {
  if (!text || text.length < 30) {
    return { primary: null };
  }
  
  const result = eld.detect(text);
  return {
    primary: result.language,
    reliable: result.isReliable()
  };
}

function processJobCard(jobCard) {
  const jobId = getJobId(jobCard);
  if (!jobId) {
    console.log('[LinkedIn Language Detector] 跳过: 没有 jobId');
    return;
  }
  
  if (processedCards.has(jobId)) {
    return;
  }
  
  const description = extractDescription(jobCard);
  if (description.length < 30) {
    console.log(`[LinkedIn Language Detector] 跳过 ${jobId}: 描述太短 (${description.length} 字符)`);
    return;
  }
  
  processedCards.add(jobId);
  
  const result = detectLanguage(description);
  console.log(`[LinkedIn Language Detector] 职位 ${jobId} 检测结果: ${result.primary}, 可靠: ${result.reliable}`);
  
  if (result.primary && result.primary !== 'en') {
    const badge = createBadge(result.primary);
    injectBadge(jobCard, badge);
  } else if (result.primary === 'en') {
    console.log(`[LinkedIn Language Detector] 职位 ${jobId} 是英语，不显示徽章`);
  }
}

function processAllCards() {
  const cards = findJobCards();
  console.log(`[LinkedIn Language Detector] 开始处理 ${cards.length} 个职位卡片`);
  
  cards.forEach((card, index) => {
    setTimeout(() => processJobCard(card), index * 100);
  });
}

console.log('[LinkedIn Language Detector] 初始化观察者...');

const observer = new MutationObserver((mutations) => {
  let hasNewCards = false;
  
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (node.matches && (node.matches('.job-card-container') || node.matches('[data-job-id]'))) {
          hasNewCards = true;
        }
        if (node.querySelector && node.querySelector('.job-card-container, [data-job-id]')) {
          hasNewCards = true;
        }
      }
    });
  });
  
  if (hasNewCards) {
    console.log('[LinkedIn Language Detector] 检测到新卡片，重新处理');
    setTimeout(processAllCards, 500);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[LinkedIn Language Detector] 观察者已启动，等待页面加载...');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[LinkedIn Language Detector] DOM 已加载，开始处理');
    setTimeout(processAllCards, 1000);
  });
} else {
  console.log('[LinkedIn Language Detector] DOM 已就绪，立即处理');
  setTimeout(processAllCards, 1000);
}

console.log('[LinkedIn Language Detector] === 初始化完成 ===');
