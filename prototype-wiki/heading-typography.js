/* Keep Chinese words together in headings, including live simulation captions. */
(() => {
  'use strict';
  if (!globalThis.Intl?.Segmenter) return;
  const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
  const terms = /(就绪队列|虚拟地址|物理地址|地址空间|页内偏移|物理页框|多级页表|线性页表|两级页表|三级页表|优先级|时间片|工作集|先来先服务|缺页异常|执行现场|程序映像|返回值|重定向|写时复制)/g;
  const selector = 'main h1, main h2, main h3, main h4, main summary, dialog h2';
  const pending = new Set();
  let scheduled = false;

  function format(heading) {
    if (!heading.isConnected) return;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('.heading-word, .read-keep, .ai-keep, code, pre')) nodes.push(node);
    }
    for (const node of nodes) {
      const parts = node.data.split(terms).flatMap((text, index) => index % 2
        ? [{ segment: text, isWordLike: true }]
        : [...segmenter.segment(text)]);
      if (!parts.some(p => p.isWordLike && p.segment.length > 1 && /[\u3400-\u9fff]/.test(p.segment))) continue;
      const fragment = document.createDocumentFragment();
      for (const part of parts) {
        if (part.isWordLike && part.segment.length > 1 && /[\u3400-\u9fff]/.test(part.segment)) {
          const word = document.createElement('span');
          word.className = 'heading-word';
          // Existing heading span styles are for subtitles and status labels.
          word.style.cssText = 'all: unset; white-space: nowrap;';
          word.textContent = part.segment;
          fragment.append(word);
        } else fragment.append(document.createTextNode(part.segment));
      }
      // Preserve an anonymous flex/grid text item as one item. Otherwise each
      // word would become a separate item and inherit the container's gaps.
      const display = getComputedStyle(node.parentElement).display;
      if (display.includes('flex') || display.includes('grid')) {
        const phrase = document.createElement('span');
        phrase.className = 'heading-phrase';
        phrase.style.cssText = 'all: unset; min-width: 0;';
        phrase.append(fragment);
        node.replaceWith(phrase);
      } else node.replaceWith(fragment);
    }
  }
  function queue(element) {
    if (!(element instanceof Element) || element.closest('.heading-word')) return;
    const heading = element.closest(selector);
    if (heading) pending.add(heading);
    element.querySelectorAll(selector).forEach(h => pending.add(h));
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.target.nodeType === Node.TEXT_NODE) queue(record.target.parentElement);
      else queue(record.target);
    }
    if (scheduled || !pending.size) return;
    scheduled = true;
    queueMicrotask(() => {
      const headings = [...pending];
      pending.clear();
      scheduled = false;
      headings.forEach(format);
    });
  });
  document.querySelectorAll(selector).forEach(format);
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
})();
