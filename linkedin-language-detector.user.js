// ==UserScript==
// @name         LinkedIn Job Language Detector
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  检测LinkedIn职位语言并显示徽章（适配新版LinkedIn）
// @author       You
// @match        https://www.linkedin.com/jobs/search*
// @match        https://www.linkedin.com/jobs/view*
// @match        https://www.linkedin.com/jobs/collections*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[LinkedIn Language Detector] 脚本已加载 v1.1');

    const eld = {
        languages: {
            'en': { trigrams: ['the', 'and', 'ing', 'ion', 'tio', 'ent', 'for', 'her', 'tha', 'ate'] },
            'nl': { trigrams: ['van', 'het', 'een', 'ing', 'den', 'ten', 'ter', 'gen', 'der', 'de '] },
            'de': { trigrams: ['der', 'die', 'und', 'sch', 'ein', 'ich', 'ten', 'den', 'che', 'gen'] },
            'fr': { trigrams: ['ion', 'ent', 'les', 'que', 'our', 'ant', 'eur', 'tio', 'est', 'ont'] },
            'es': { trigrams: ['cio', 'ent', 'que', 'los', 'con', 'ado', 'ien', 'nte', 'est', 'per'] },
            'it': { trigrams: ['ion', 'ent', 'che', 'per', 'zio', 'del', 'are', 'con', 'lla', 'nti'] },
            'pt': { trigrams: ['ent', 'que', 'cio', 'ndo', 'con', 'ara', 'ado', 'par', 'est', 'por'] }
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

    function findJobCards() {
        const selectors = [
            'li[data-occludable-job-id]',
            'li[data-job-id]',
            '.scaffold-layout__list-container > li',
            '.jobs-search-results-list > li',
            'main ul li'
        ];
        
        for (const selector of selectors) {
            const cards = document.querySelectorAll(selector);
            if (cards.length > 0) {
                console.log(`[LinkedIn Language Detector] 找到 ${cards.length} 个职位卡片 (${selector})`);
                return Array.from(cards);
            }
        }
        
        const allLi = document.querySelectorAll('li');
        const jobCards = Array.from(allLi).filter(li => {
            const text = li.textContent.toLowerCase();
            return text.includes('linkedin') || 
                   text.includes('apply') || 
                   li.querySelector('a[href*="/jobs/view/"]');
        });
        
        if (jobCards.length > 0) {
            console.log(`[LinkedIn Language Detector] 通过文本筛选找到 ${jobCards.length} 个职位卡片`);
            return jobCards;
        }
        
        console.log('[LinkedIn Language Detector] 未找到职位卡片');
        return [];
    }

    function getJobId(jobCard) {
        return jobCard.getAttribute('data-occludable-job-id') || 
               jobCard.getAttribute('data-job-id');
    }

    function extractDescription(jobCard) {
        const text = jobCard.textContent;
        if (text.length > 50) {
            return text.substring(0, 500);
        }
        return '';
    }

    function createBadge(languageCode) {
        const badge = document.createElement('span');
        badge.textContent = languageCode.toUpperCase();
        badge.style.cssText = `
            display: inline-flex !important;
            padding: 2px 6px !important;
            margin-left: 8px !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            background: #ffebee !important;
            color: #c62828 !important;
            border: 1px solid #ef9a9a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        `;
        return badge;
    }

    function injectBadge(jobCard, badge) {
        const titleEl = jobCard.querySelector('strong, h3, [class*="title"]');
        if (titleEl) {
            titleEl.appendChild(badge);
            return true;
        }
        
        const firstLink = jobCard.querySelector('a');
        if (firstLink) {
            firstLink.appendChild(badge);
            return true;
        }
        
        jobCard.appendChild(badge);
        return true;
    }

    function detectLanguage(text) {
        if (!text || text.length < 30) {
            return { primary: null };
        }
        const result = eld.detect(text);
        return { primary: result.language };
    }

    const processedCards = new Set();

    function processJobCard(jobCard) {
        const jobId = getJobId(jobCard);
        if (!jobId || processedCards.has(jobId)) return;

        const description = extractDescription(jobCard);
        if (description.length < 30) return;

        processedCards.add(jobId);
        
        const result = detectLanguage(description);
        
        if (result.primary && result.primary !== 'en') {
            const badge = createBadge(result.primary);
            injectBadge(jobCard, badge);
            console.log(`[LinkedIn Language Detector] 添加徽章: ${result.primary}`);
        }
    }

    function processAllCards() {
        const cards = findJobCards();
        cards.forEach((card, i) => {
            setTimeout(() => processJobCard(card), i * 100);
        });
    }

    setTimeout(processAllCards, 3000);

    const observer = new MutationObserver(() => {
        setTimeout(processAllCards, 500);
    });
    
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('[LinkedIn Language Detector] 初始化完成，等待3秒后开始检测');
})();
