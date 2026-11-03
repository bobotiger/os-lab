(() => {
  'use strict';
  const lockIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  function markup() {
    return `<div id="bug-movie" class="bug-movie">
      <div class="bug-movie-heading"><span id="bug-movie-mode"></span><h3 id="bug-movie-title"></h3></div>
      <div class="bug-movie-stage" id="bug-movie-stage" role="img" aria-label="线程与共享数据的动画">
        <div class="bug-movie-gate"><span>${lockIcon} A 连续持锁</span></div>
        <svg class="bug-movie-routes" viewBox="0 0 1000 350" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id="bug-arrow-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#326bab"/></marker><marker id="bug-arrow-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#9b651c"/></marker><marker id="bug-arrow-error" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b43e32"/></marker></defs>
          <path class="bug-movie-scan bug-movie-scan-a" d="M470 191L205 144"/><path class="bug-movie-scan bug-movie-scan-b" d="M530 191L795 144"/>
          <path class="bug-movie-route bug-movie-route-take" d="M460 220H220" marker-end="url(#bug-arrow-a)"/>
          <path class="bug-movie-route bug-movie-route-write" d="M780 220H550" marker-end="url(#bug-arrow-b)"/>
          <path class="bug-movie-route bug-movie-route-error" d="M550 220H780" marker-end="url(#bug-arrow-error)"/><path class="bug-movie-route bug-movie-route-read-error" d="M450 220H220" marker-end="url(#bug-arrow-error)"/>
        </svg>
        ${['A','B'].map(who => `<div class="bug-movie-actor" data-actor="${who}"><div class="bug-movie-avatar">${who}</div><span id="bug-movie-role-${who}">线程 ${who}</span></div><div class="bug-movie-memory" id="bug-movie-memory-${who}" data-actor="${who}"><span></span><strong></strong><b></b></div><div class="bug-movie-receipt" id="bug-movie-receipt-${who}" data-actor="${who}"></div><div class="bug-movie-state" id="bug-movie-state-${who}" data-actor="${who}"></div>`).join('')}
        <div class="bug-movie-source-label" id="bug-movie-source-label">共享队列</div>
        <div class="bug-movie-source" id="bug-movie-source"><span id="bug-movie-empty"></span></div>
        <div class="bug-movie-token" id="bug-movie-token">任务 1</div>
        <div class="bug-movie-copy" id="bug-movie-copy" hidden>42</div>
        <div class="bug-movie-source-note" id="bug-movie-source-note"></div>
        <div class="bug-movie-barrier">${lockIcon}</div><div class="bug-movie-cross" aria-hidden="true">×</div>
        <div id="bug-movie-lock" class="bug-movie-lock">${lockIcon}<span></span></div>
      </div>
      <p id="bug-movie-note" class="bug-movie-note" role="status" aria-live="polite"></p>
      <div class="bug-movie-controls"><button type="button" id="bug-movie-play" class="cc-primary" aria-pressed="false">播放动画</button><label class="bug-movie-scrub"><span>回看</span><input id="bug-movie-seek" type="range" min="0" max="100" step="10" value="0" aria-label="回看动画"></label><button type="button" id="bug-movie-compare">看修正方案</button></div>
    </div>`;
  }
  function mount(getConfig, onCompare, onPlay) {
    const $ = id => document.getElementById('bug-movie-' + id), area = document.getElementById('bug-movie');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let story, elapsed = 0, playing = false, raf = null, lastTime = 0, renderKey = '', autoArmed = true;
    const ease = x => x * x * (3 - 2 * x);
    function controls() {
      $('play').textContent = playing ? '暂停' : elapsed >= story.duration ? '重播动画' : elapsed ? '继续播放' : '播放动画';
      $('play').setAttribute('aria-pressed', String(playing));
      area.dataset.playing = String(playing);
      const offerFix = elapsed >= story.duration && story.variant === 'unsafe';
      $('compare').classList.toggle('cc-primary', offerFix);
      $('play').classList.toggle('cc-primary', !offerFix);
    }
    function render(force = false) {
      const phase = story.scenes.findLast(s => elapsed >= s.start) || story.scenes[0];
      const atomic = story.kind === 'atomicity', safe = story.variant === 'safe';
      const local = elapsed - phase.start, progress = reduced.matches ? 1 : Math.min(1, local / 900);
      const moving = Boolean(phase.motion && progress < 1);
      const before = phase.motion === 'read' ? story.frames.findIndex(s => s.op === 'use') - 1 : phase.frame - 1;
      const frame = moving ? before : phase.frame, s = story.frames[frame];
      const key = phase.id + '/' + moving;
      area.dataset.phase = phase.id; area.dataset.frame = frame; area.dataset.targetFrame = phase.frame;
      area.dataset.moving = String(moving); area.dataset.ended = String(elapsed >= story.duration);
      let tokenX = atomic ? (s.queue.length ? 50 : 17) : 50;
      if (phase.motion === 'take') tokenX = 50 - 33 * ease(progress);
      if (phase.motion === 'write') tokenX = 83 - 33 * ease(progress);
      $('token').style.left = tokenX + '%';
      $('copy').style.left = (phase.motion === 'read' ? 50 - 33 * ease(progress) : 17) + '%';
      $('token').hidden = !atomic && !s.ready && phase.motion !== 'write';
      $('copy').hidden = atomic || (!s.used && phase.motion !== 'read');
      area.dataset.tokenOwner = moving && phase.motion !== 'read' ? 'in-transit' : atomic && !s.queue.length ? 'A' : 'shared';
      area.dataset.copyOwner = phase.motion === 'read' && moving ? 'in-transit' : !atomic && s.used ? 'A' : '';
      $('seek').value = elapsed;
      if (force || key !== renderKey) {
        renderKey = key;
        const title = moving ? phase.motion === 'take' ? 'A 正在取走唯一的任务' : phase.motion === 'write' ? 'B 正在写入配置 42' : 'A 已确认配置就绪，正在读取 42' : phase.title;
        $('title').textContent = title;
        $('note').textContent = moving ? phase.motion === 'take' ? '任务正从共享队列交给 A，仍然只有这一项任务。' : phase.motion === 'write' ? '先把数据写好，再把完成条件设为 true。' : '读取把值交给 A 使用，共享配置中仍保留 42。' : phase.note;
        area.dataset.focus = phase.focus; area.dataset.error = String(s.error);
        area.dataset.guarded = String(atomic && safe && s.lock === 'A');
        area.dataset.stale = String(atomic && s.checked.B === true && !s.queue.length && !s.taken.includes('B'));
        area.dataset.ready = String(!atomic && s.ready);
        $('source-label').textContent = atomic ? '共享队列' : '共享配置';
        $('empty').textContent = moving && phase.motion !== 'read' ? phase.motion === 'take' ? '取走中' : '写入中' : atomic ? s.queue.length ? '' : '空' : s.ready ? '' : '未初始化';
        $('source-note').textContent = atomic ? moving ? '同一项任务正在移交' : s.queue.length ? '只有 1 项任务' : '任务 1 已在 A 手中' : 'ready = ' + s.ready;
        $('token').textContent = atomic ? '任务 1' : '42';
        $('lock').querySelector('span').textContent = s.lock ? s.lock + ' 持有共同的锁' : '共同的锁：空闲';
        $('lock').dataset.owner = s.lock || '';
        $('lock').querySelector('path').setAttribute('d', s.lock ? 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3' : 'M17 10V7a5 5 0 0 0-9.4-2.4M5 10h14v11H5zM12 14v3');
        for (const who of ['A','B']) {
          const memory = $('memory-' + who), lastCheck = [...story.frames.slice(0,frame + 1)].reverse().find(f => f.actor === who && f.op === 'check');
          $('role-' + who).textContent = atomic ? '线程 ' + who : who === 'A' ? 'A · 使用配置' : 'B · 初始化';
          memory.querySelector('span').textContent = atomic ? s.checked[who] === null ? '检查结果' : '检查时看到' : who === 'A' ? '完成条件' : '初始化';
          memory.querySelector('strong').textContent = atomic ? s.checked[who] === null ? '尚未检查' : s.checked[who] ? '有任务' : '没有任务' : who === 'A' ? !safe ? '未检查' : !lastCheck ? '尚未检查' : lastCheck.ready ? '已完成' : '未完成' : s.ready ? '已写好' : moving && phase.motion === 'write' ? '写入中' : '尚未写入';
          const stale = atomic && s.checked[who] === true && !s.queue.length && !s.taken.includes(who);
          memory.classList.toggle('bug-movie-stale', stale);
          memory.querySelector('b').textContent = stale ? '已经过期' : '';
          let state = '';
          if (atomic) state = who === 'A' ? moving && phase.motion === 'take' ? '正在取走' : s.taken.includes('A') ? '已取走任务 1' : '准备取任务' : s.error ? '取走失败' : s.checked.B === false ? '队列为空，跳过' : safe && s.lock === 'A' ? '等 A 释放锁' : '准备取任务';
          else if (who === 'B') state = s.ready ? '初始化完成' : '准备配置';
          else state = s.error ? '使用失败' : s.used ? '已读取 42' : moving && phase.motion === 'read' ? '正在读取' : s.states.A === '已通知，等待重新获锁' ? '已通知，等待获锁' : s.waiting ? '已释放锁，等待' : s.lock === 'A' ? '持有锁' : '准备使用';
          $('state-' + who).textContent = state;
          $('receipt-' + who).textContent = atomic ? who === 'B' ? s.error ? '取不到任务' : s.checked.B === false ? '跳过' : '' : '' : who === 'B' && s.ready ? '已写入 42' : who === 'A' && s.error ? '读取失败' : '';
        }
        $('stage').setAttribute('aria-label', title + '。' + (atomic ? '队列' + (s.queue.length ? '有任务 1' : '为空，任务已由 A 取走') + '。B 的检查记录：' + (s.checked.B === null ? '尚未检查' : s.checked.B ? '有任务' : '没有任务') : '配置' + (s.ready ? '为 42' : '未初始化')));
        $('seek').setAttribute('aria-valuetext', title);
      }
      controls();
    }
    function tick(time) {
      if (!playing) return;
      if (lastTime) elapsed = Math.min(story.duration, elapsed + time - lastTime);
      lastTime = time; render();
      if (elapsed >= story.duration) { playing = false; raf = null; controls(); }
      else raf = requestAnimationFrame(tick);
    }
    function stop() { playing = false; cancelAnimationFrame(raf); raf = null; lastTime = 0; controls(); }
    function play() {
      onPlay?.(); autoArmed = false;
      if (elapsed >= story.duration) { elapsed = 0; renderKey = ''; }
      if (playing) return;
      playing = true; lastTime = 0; controls(); raf = requestAnimationFrame(tick);
    }
    function reload(autoplay = false) {
      if (story) stop();
      story = OSLabConcurrencyBugScenes.build(...getConfig()); elapsed = 0; renderKey = '';
      area.dataset.kind = story.kind; area.dataset.variant = story.variant;
      $('mode').textContent = story.kind === 'atomicity' ? story.variant === 'safe' ? '检查与取走 · 连续持锁' : '检查与取走 · 分别加锁' : story.variant === 'safe' ? '先确认完成，再使用配置' : '仅用互斥锁';
      $('compare').textContent = story.variant === 'unsafe' ? '看修正方案' : '对照错误方案';
      $('seek').max = story.duration; render(true);
      if (autoplay && !document.hidden) play();
    }
    $('play').onclick = () => { if (playing) { autoArmed = false; stop(); } else play(); };
    $('seek').oninput = event => { autoArmed = false; stop(); elapsed = Number(event.target.value); render(); };
    $('compare').onclick = () => { stop(); onCompare(story.variant === 'unsafe' ? 'safe' : 'unsafe'); };
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0].intersectionRatio;
      if (autoArmed && visible >= .85 && !reduced.matches && !document.hidden) play();
      else if (visible < .1 && playing) stop();
    }, {threshold: [0,.1,.85]});
    reload(); observer.observe($('stage'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    addEventListener('pagehide', stop);
    reduced.addEventListener('change', () => render(true));
    return {reload, stop, play, disarm() { autoArmed = false; stop(); }};
  }
  globalThis.OSLabConcurrencyBugMovie = Object.freeze({markup, mount});
})();
