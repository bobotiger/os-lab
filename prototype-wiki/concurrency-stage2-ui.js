(() => {
  'use strict';
  function timeline(id, getFrames, render) {
    let frames = getFrames(), index = 0, control;
    const paint = () => {
      render(frames[index], index, frames);
      document.getElementById(`${id}-progress`).textContent = `${index} / ${frames.length - 1} 步`;
      document.getElementById(`${id}-demo`).dataset.step = index;
      control?.paint();
    };
    control = OSLabConcurrencyUI.player(id, {next: () => { index++; paint(); }, prev: () => { index--; paint(); }, reset: () => { index = 0; paint(); }, atEnd: () => index === frames.length - 1, atStart: () => index === 0});
    paint();
    return {reload() { control.stop(); frames = getFrames(); index = 0; paint(); }, stop: control.stop};
  }
  function choose(selector, onChange) {
    document.querySelectorAll(selector).forEach(button => button.onclick = () => {
      document.querySelectorAll(selector).forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      onChange(button);
    });
  }
  function slots(queue, capacity = 2, unpublished = 0) {
    return `<div class="c2-slots" aria-label="实际队列内容">${Array.from({length: capacity}, (_, i) => `<div class="c2-slot ${queue[i] ? (i >= queue.length - unpublished ? 'c2-unpublished' : 'c2-filled') : ''}"><span>位置 ${i + 1}</span><strong>${queue[i] || '空位'}</strong>${queue[i] && i >= queue.length - unpublished ? '<small>待发布许可</small>' : ''}</div>`).join('')}</div>`;
  }
  function actors(states, current) {
    return `<div class="c2-actors">${Object.entries(states).filter(([, state]) => state !== '未参与').map(([id, state]) => `<div class="c2-actor ${current === id ? 'c2-current' : ''}"><strong>${id === 'P' ? '生产者 P' : id.startsWith('C') ? `消费者 ${id}` : `线程 ${id}`}</strong><span>${state}</span></div>`).join('')}</div>`;
  }
  function shell(page, sections, content) {
    document.getElementById('root').innerHTML = `<div class="page cc-page c2-page" id="top">${wikiHeader(page, sections)}<main>${content}${wikiRelated(page)}</main><footer><span>OSLab · 并发</span><a href="#top">返回顶部 ↑</a></footer></div>`;
  }
  function focus(id, targets, keyStep = false) {
    const demo = document.getElementById(`${id}-demo`);
    demo.dataset.readingKey = String(keyStep);
    demo.querySelectorAll('[data-observe]').forEach(el => el.classList.toggle('c2-focus', targets.includes(el.dataset.observe)));
  }
  globalThis.OSLabConcurrencyStage2UI = Object.freeze({timeline, choose, slots, actors, shell, focus});
})();
