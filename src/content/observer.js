const JOB_CARD_SELECTORS = [
  '.jobs-search-results__list-item',
  '.jobs-job-board-list__item',
  '.job-card-container',
  '[data-job-id]'
];

const DESCRIPTION_SELECTORS = [
  '.jobs-description__content',
  '.job-card-list__description',
  '[data-job-description]',
  '.job-details-jobs-unified-top-card__description'
];

const processedCards = new Set();

function findJobCards() {
  for (const selector of JOB_CARD_SELECTORS) {
    const cards = document.querySelectorAll(selector);
    if (cards.length > 0) {
      console.log(`[LinkedIn Language Detector] 找到 ${cards.length} 个职位卡片 (使用选择器: ${selector})`);
      return Array.from(cards);
    }
  }
  console.log('[LinkedIn Language Detector] 未找到任何职位卡片');
  return [];
}

function extractDescription(jobCard) {
  for (const selector of DESCRIPTION_SELECTORS) {
    const element = jobCard.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      console.log(`[LinkedIn Language Detector] 提取到描述 (${text.length} 字符): ${text.substring(0, 100)}...`);
      return text;
    }
  }
  console.log('[LinkedIn Language Detector] 未找到职位描述');
  return '';
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

function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function initObserver(onJobCardDetected) {
  console.log('[LinkedIn Language Detector] 观察者已启动');
  
  const processCards = () => {
    const cards = findJobCards();
    console.log(`[LinkedIn Language Detector] 开始处理 ${cards.length} 个卡片`);
    
    cards.forEach((card, index) => {
      const jobId = getJobId(card);
      console.log(`[LinkedIn Language Detector] 处理卡片 ${index + 1}/${cards.length}, jobId: ${jobId}`);
      
      if (!jobId) {
        console.log('[LinkedIn Language Detector] 跳过: 没有 jobId');
        return;
      }
      
      if (processedCards.has(jobId)) {
        console.log(`[LinkedIn Language Detector] 跳过: 已处理过 ${jobId}`);
        return;
      }
      
      const description = extractDescription(card);
      if (description.length < 50) {
        console.log(`[LinkedIn Language Detector] 跳过: 描述太短 (${description.length} 字符)`);
        return;
      }
      
      console.log(`[LinkedIn Language Detector] 处理职位 ${jobId}, 准备检测语言`);
      processedCards.add(jobId);
      onJobCardDetected(card, description);
    });
  };
  
  const debouncedProcess = debounce(processCards, 300);
  
  const observer = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some(mutation => 
      Array.from(mutation.addedNodes).some(node => 
        node.nodeType === 1 && (
          node.matches?.('.jobs-search-results__list-item') ||
          node.matches?.('.job-card-container') ||
          node.querySelector?.('.jobs-search-results__list-item')
        )
      )
    );
    
    if (hasNewNodes) {
      console.log('[LinkedIn Language Detector] 检测到新节点，重新处理');
      debouncedProcess();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  processCards();
  
  return () => observer.disconnect();
}
