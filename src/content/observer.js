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
    if (cards.length > 0) return Array.from(cards);
  }
  return [];
}

function extractDescription(jobCard) {
  for (const selector of DESCRIPTION_SELECTORS) {
    const element = jobCard.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }
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
  const processCards = () => {
    const cards = findJobCards();
    
    cards.forEach(card => {
      const jobId = getJobId(card);
      if (!jobId || processedCards.has(jobId)) return;
      
      const description = extractDescription(card);
      if (description.length >= 50) {
        processedCards.add(jobId);
        onJobCardDetected(card, description);
      }
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
