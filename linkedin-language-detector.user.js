// ==UserScript==
// @name         LinkedIn Job Language Detector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  检测LinkedIn职位语言并显示徽章
// @author       You
// @match        https://*.linkedin.com/jobs/search*
// @match        https://*.linkedin.com/jobs/view*
// @match        https://*.linkedin.com/jobs/collections*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[LinkedIn Language Detector] 油猴脚本已加载');

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

            const sorted = Object.entries(scores).sort((a, b) =>> b[1] - a[1]);
            const best = sorted[0];

            return {
                language: best[0],
                isReliable: () => best[1] > 2
            };
        }
    };

    const JOB_CARD_SELECTORS = [
        '.job-card-container',
        '[data-job-id]'
    ];

    const DESCRIPTION_SELECTORS = [
        '.job-card-list__description',
        '.jobs-description__content',
        '[data-job-description]'
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
                console.log(`[LinkedIn Language Detector] 找到 ${cards.length} 个职位卡片`);
                return Array.from(cards);
            }
        }
        return [];
    }

    function getJobId(jobCard) {
        return jobCard.getAttribute('data-job-id');
    }

    function extractDescription(jobCard) {
        for (const selector of DESCRIPTION_SELECTORS) {
            const element = jobCard.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                if (text.length > 0) {
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
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 2px 6px !important;
            margin-left: 8px !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            background: ${isEnglish ? '#e8f5e9' : '#ffebee'} !important;
            color: ${isEnglish ? '#2e7d32' : '#c62828'} !important;
            border: 1px solid ${isEnglish ? '#a5d6a7' : '#ef9a9a'} !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            vertical-align: middle !important;
            line-height: 1 !important;
            min-width: 20px !important;
            pointer-events: none !important;
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
                    console.log(`[LinkedIn Language Detector] 徽章已注入: ${badge.textContent}`);
                    return true;
                }
                return false;
            }
        }
        return false;
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
        if (!jobId || processedCards.has(jobId)) return;

        const description = extractDescription(jobCard);
        if (description.length < 30) return;

        processedCards.add(jobId);

        const result = detectLanguage(description);

        if (result.primary && result.primary !== 'en') {
            const badge = createBadge(result.primary);
            injectBadge(jobCard, badge);
        }
    }

    function processAllCards() {
        const cards = findJobCards();
        console.log(`[LinkedIn Language Detector] 处理 ${cards.length} 个卡片`);

        cards.forEach((card, index) => {
            setTimeout(() => processJobCard(card), index * 100);
        });
    }

    const observer = new MutationObserver((mutations) => {
        let hasNewCards = false;
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.matches && (node.matches('.job-card-container') || node.matches('[data-job-id]'))) {
                        hasNewCards = true;
                    }
                }
            });
        });

        if (hasNewCards) {
            setTimeout(processAllCards, 500);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(processAllCards, 2000);

    console.log('[LinkedIn Language Detector] 脚本初始化完成');
})();
