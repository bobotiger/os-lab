/* Shared playback controls for the concurrency lessons. */
(() => {
  'use strict';
  const players = new Set();
  function transport(id) {
    return `<div class="cc-transport" role="group" aria-label="播放控制">
      <button type="button" id="${id}-prev">上一步</button><button type="button" id="${id}-next">下一步</button>
      <button type="button" id="${id}-play" class="cc-primary" aria-pressed="false">播放</button><button type="button" id="${id}-reset">重置</button>
      <label class="cc-pace">节奏 <select id="${id}-pace"><option value="read">阅读</option><option value="slow">慢速</option><option value="quick">快速</option></select></label>
      <span id="${id}-progress" class="cc-progress"></span></div>`;
  }
  function player(id, {next, prev, reset, atEnd, atStart}) {
    let timer = null;
    const button = document.getElementById(`${id}-play`);
    const pace = document.getElementById(`${id}-pace`);
    const area = button.closest('section.cc-section') || button.closest('section');
    function delay() {
      if (pace.value === 'quick') return 1600;
      const demo = document.getElementById(`${id}-demo`);
      const scope = demo || area;
      const words = [...scope.querySelectorAll('.cc-log p, .cc-wait-log, .cc-step-explanation')].map(el => el.innerText).join('').length;
      const keyStep = demo?.dataset.readingKey === 'true';
      return Math.min(12000, Math.max(4000, words * 60 + 1200) + (keyStep ? 1800 : 0)) * (pace.value === 'slow' ? 1.5 : 1);
    }
    function schedule() {
      timer = setTimeout(() => {
        next();
        if (atEnd()) stop();
        else { schedule(); paint(); }
      }, delay());
    }
    function paint() {
      button.textContent = timer ? '暂停' : '播放'; button.setAttribute('aria-pressed', String(Boolean(timer)));
      button.disabled = atEnd(); document.getElementById(`${id}-next`).disabled = atEnd();
      document.getElementById(`${id}-prev`).disabled = atStart();
    }
    function stop() { clearTimeout(timer); timer = null; paint(); }
    document.getElementById(`${id}-next`).onclick = () => { stop(); next(); paint(); };
    document.getElementById(`${id}-prev`).onclick = () => { stop(); prev(); paint(); };
    document.getElementById(`${id}-reset`).onclick = () => { stop(); reset(); paint(); };
    button.onclick = () => {
      if (timer) { stop(); return; }
      players.forEach(p => p.stop());
      globalThis.OSLabConcurrencyMovies?.stopAll();
      next();
      if (!atEnd()) schedule();
      paint();
    };
    pace.onchange = () => { if (timer) { clearTimeout(timer); schedule(); } };
    const api = {stop, paint}; players.add(api); paint(); return api;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) players.forEach(p => p.stop()); });
  addEventListener('pagehide', () => players.forEach(p => p.stop()));
  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('wiki-menu');
    const current = panel?.querySelector('[aria-current="page"]');
    if (panel?.open && current) panel.scrollTop = Math.max(0, current.offsetTop - panel.clientHeight + 100);
  });
  function interleaver(mount, mode = 'none') {
    const M = OSLabConcurrency;
    let preset = 'interleaved', states, index, custom, route, controls;
    mount.innerHTML = `<div class="cc-preset" role="group" aria-label="预设执行次序"><span>执行次序</span>
      <button type="button" data-order="interleaved" aria-pressed="true">交替执行</button><button type="button" data-order="serial" aria-pressed="false">依次完成</button></div>
      <div class="cc-counter-board">
      <div class="cc-shared"><span>共享变量</span><code>count</code><strong id="counter-value">0</strong><span>两次加 1 的预期结果：2</span><div id="counter-lock"></div></div>
      ${['A', 'B'].map(id => `<section class="cc-thread cc-thread-${id.toLowerCase()}" aria-label="线程 ${id}"><div class="cc-thread-heading"><h3>线程 ${id}</h3><span id="counter-state-${id}"></span></div>
        <ol id="counter-code-${id}" class="cc-code-steps"></ol><div class="cc-register">寄存器 <code id="counter-register-${id}">—</code></div>
        <button type="button" id="counter-run-${id}">执行 ${id} 的下一步</button></section>`).join('')}
      </div>
      <div class="cc-log" role="status" aria-live="polite"><span id="counter-action">初始状态</span><p id="counter-log"></p></div>
      ${transport('counter')}<p class="cc-result" id="counter-result"></p>
      <details class="cc-details"><summary>已执行的步骤</summary><ol class="cc-trace" id="counter-history"></ol></details>`;
    function current() { return states[index]; }
    function done() { return current().threads.every(t => t.done); }
    function init() { route = M.schedule(mode, preset); states = [M.initial(mode)]; index = 0; custom = false; }
    function render() {
      const s = current(); mount.dataset.step = String(index); mount.dataset.mode = mode;
      document.getElementById('counter-value').textContent = s.count;
      document.getElementById('counter-lock').innerHTML = mode === 'none' ? '<span class="cc-badge">未使用锁</span>' : `<span class="cc-badge ${s.violation ? 'cc-danger' : ''}">锁标志：${s.flag ? '已占用' : '空闲'}</span><span>临界区内：${s.holders.join('、') || '无'}</span>`;
      for (const t of s.threads) {
        document.getElementById(`counter-state-${t.id}`).textContent = t.done ? '已完成' : `下一步 ${t.pc + 1}`;
        document.getElementById(`counter-register-${t.id}`).textContent = t.register ?? '尚未读取';
        const executed = s.actor === t.id ? states[index - 1]?.threads.find(previous => previous.id === t.id).pc : -1;
        document.getElementById(`counter-code-${t.id}`).innerHTML = M.programs[mode].map((op, i) => `<li${i === executed ? ' aria-current="step"' : ''} data-operation="${op}" class="${i < t.pc && i !== executed ? 'cc-executed' : ''}"><span>${i + 1}</span>${op}${i === executed ? '<small>本步</small>' : ''}</li>`).join('');
        document.getElementById(`counter-run-${t.id}`).disabled = t.done;
      }
      document.getElementById('counter-action').textContent = s.actor ? `${s.actor} · ${s.operation}` : '初始状态';
      document.getElementById('counter-log').textContent = s.log;
      document.getElementById('counter-progress').textContent = `已执行 ${index} 步${custom ? ' · 手动次序' : ''}`;
      const result = document.getElementById('counter-result');
      result.classList.toggle('cc-error-result', s.violation || (done() && s.count !== 2));
      result.textContent = s.violation ? `互斥已失效：曾有两个线程同时处于临界区。${done() ? `最终 count = ${s.count}。即使某次结果恰好正确，也不能说明锁正确。` : '继续执行可观察共享变量的结果。'}`
        : done() ? (s.count === 2 ? (mode === 'atomic' ? '两次更新都被保留。锁使一个线程完成整段更新后，另一个线程才能读取并修改 count。' : '本次两次更新都被保留。换成交替执行，检查结果是否仍然正确。') : '两次加 1，最终却只有 1：两个线程都从旧值 0 出发，后一次写回覆盖了前一次更新。')
        : '高亮行对应本步解说。可点击线程下方的按钮，自行安排执行次序。';
      document.getElementById('counter-history').innerHTML = index ? states.slice(1, index + 1).map(s => `<li><b>${s.actor}</b> ${s.operation}<span>count = ${s.count}</span></li>`).join('') : '<li>尚未执行操作。</li>';
      controls?.paint();
    }
    function next() {
      if (done()) return;
      if (index < states.length - 1) index++;
      else {
        let actor = custom ? (current().actor === 'A' ? 'B' : 'A') : route[index];
        if (!actor || current().threads.find(t => t.id === actor).done) actor = current().threads.find(t => !t.done).id;
        states.push(M.advance(current(), actor)); index++;
      }
      render();
    }
    init();
    controls = player('counter', {next, prev: () => { index = Math.max(0, index - 1); render(); }, reset: () => { init(); render(); }, atEnd: done, atStart: () => index === 0});
    for (const id of ['A', 'B']) document.getElementById(`counter-run-${id}`).onclick = () => {
      controls.stop(); if (current().threads.find(t => t.id === id).done) return;
      states = states.slice(0, index + 1); states.push(M.advance(current(), id)); index++; custom = true; render();
    };
    mount.querySelectorAll('[data-order]').forEach(button => button.onclick = () => {
      controls.stop(); preset = button.dataset.order;
      mount.querySelectorAll('[data-order]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      init(); render();
    });
    render();
    return {setMode(value) { controls.stop(); mode = value; init(); render(); }};
  }
  function references(page) {
    const base = 'https://pages.cs.wisc.edu/~remzi/OSTEP/';
    const chapters = {
      threads: [['threads-intro.pdf','第 26 章：线程、共享状态与执行交错'],['threads-api.pdf','第 27 章：创建线程与等待结束']],
      locks: [['threads-locks.pdf','第 28 章：临界区、原子获取与锁的等待']],
      concurrentStructures: [['threads-locks-usage.pdf','第 29 章：锁的粒度与近似计数']],
      conditionVariables: [['threads-cv.pdf','第 30 章：条件等待与有限缓冲区']],
      semaphores: [['threads-sema.pdf','第 31 章：许可计数与生产者—消费者']],
      concurrencyBugs: [['threads-bugs.pdf','第 32 章：违反原子性与执行顺序']],
      deadlock: [['threads-bugs.pdf','第 32 章 §32.3：死锁的条件与处理']],
      events: [['threads-events.pdf','第 33 章：事件循环、异步 I/O 与状态保存']],
      concurrencyExperiments: [['threads-intro.pdf','第 26 章：共享更新'],['threads-bugs.pdf','第 32 章：同步范围与死锁']]
    };
    const links = (chapters[page] || []).map(([file,title]) => `<li><a href="${base + file}">OSTEP · ${title}</a></li>`).join('');
    const posix = page === 'conditionVariables' ? '<li><a href="https://www.man7.org/linux/man-pages/man3/pthread_cond_broadcast.3p.html">POSIX · signal 与 broadcast 的语义（标准文本转载）</a></li>' : '';
    return `<details class="cc-details cc-references"><summary>参考资料</summary><ul>${links}${posix}</ul></details>`;
  }
  globalThis.OSLabConcurrencyUI = Object.freeze({transport, player, interleaver, references, pauseAll: () => players.forEach(p => p.stop())});
})();
