function createPageFaultMotion(root) {
  const $ = selector => root.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function channel() {
    const active = new Set();
    let interval = 1300;
    function clear() { for (const entry of [...active]) entry.finish(); }
    return {
      begin(ms) { clear(); interval = ms; },
      clear,
      animate(node, frames, duration, {delay = 0, cleanup = () => {
        for (const property of Object.keys(frames)) node.style.removeProperty(property);
      }, ease = [0.22, 1, 0.36, 1]} = {}) {
        if (reduced.matches || !window.Motion) { cleanup(); return; }
        const animation = Motion.animate(node, frames, {duration, delay, ease});
        const entry = {animation, paused: false, finish() {
          if (!active.delete(entry)) return;
          animation.stop(); cleanup();
        }};
        active.add(entry); animation.then(entry.finish);
      },
      pause() { for (const entry of active) { entry.animation.pause(); entry.paused = true; } },
      resume(ms) { for (const entry of active) if (entry.paused) {
        entry.animation.speed = interval / ms; entry.animation.play(); entry.paused = false;
      } },
      settle() { for (const entry of [...active]) { entry.animation.complete(); entry.finish(); } }
    };
  }
  const tracks = {access: channel(), pool: channel()};
  let lastAccess = null, lastPool = null, lastTransfer = null;
  function flash(track, node, tone, duration = 0.48, delay = 0) {
    const marker = document.createElement('i');
    marker.className = 'pf-motion-focus is-' + tone;
    marker.setAttribute('aria-hidden', 'true');
    node.append(marker);
    track.animate(marker, {opacity: [0, 0.85, 0]}, duration, {delay, cleanup: () => marker.remove()});
  }
  function access(snapshot, index, story, interval) {
    const previous = lastAccess;
    const forward = previous?.story === story && index === previous.index + 1;
    tracks.access.begin(interval);
    lastAccess = {snapshot, index, story, interval, forward};
    if (!forward || reduced.matches || !window.Motion) return;
    const track = tracks.access, duration = Math.min(0.6, interval / 1000 * 0.6);
    const frame = $('#pf-frame-1');
    if (snapshot.phase === 'reclaim') {
      const payload = frame.querySelector('.pf-page-content');
      const old = document.createElement('div');
      old.className = 'pf-page-content pf-page-leaving'; old.setAttribute('aria-hidden', 'true');
      const page = previous.snapshot.frames[1];
      const name = document.createElement('b'), value = document.createElement('small');
      name.textContent = page.page.replace(':', ' · 页 '); value.textContent = '内容标记 ' + page.value;
      old.append(name, value); payload.parentElement.append(old);
      track.animate(old, {opacity: [0.8, 0], transform: ['translateY(0)', 'translateY(-12px)']}, duration, {cleanup: () => old.remove()});
      track.animate(payload, {opacity: [0.25, 1]}, duration);
    } else if (['reserve', 'victim', 'invalidate'].includes(snapshot.phase)) {
      flash(track, frame, 'warm', duration);
    } else if (snapshot.phase === 'read-done') {
      flash(track, frame, 'green', duration);
    } else if (snapshot.phase === 'write-done') {
      flash(track, $('#pf-disk-2'), 'warm', duration);
    } else if (snapshot.phase === 'map') {
      flash(track, $('#pf-bits').lastElementChild, 'green', duration);
    } else if (snapshot.phase === 'resume') {
      flash(track, $('#pf-process-state'), 'blue', duration);
      flash(track, $('.pf-request'), 'blue', duration, duration * 0.3);
    } else if (snapshot.phase === 'translated') {
      flash(track, frame, 'blue', duration);
    } else if (snapshot.phase === 'access') {
      flash(track, frame, 'green', duration * 0.55);
      flash(track, $('.pf-result'), 'green', duration, duration * 0.25);
      track.animate($('#pf-register'), {opacity: [0.45, 1], transform: ['translateY(4px)', 'translateY(0)']}, duration);
    }
  }
  function transfer(snapshot, start, end) {
    const node = $('#pf-transfer-dot');
    if (!start) { lastTransfer = null; return; }
    const p = snapshot.io.progress / snapshot.io.total;
    const from = {x: start.x, y: start.y + (end.y > start.y ? 17 : -17)};
    const to = {x: end.x, y: end.y + (end.y > start.y ? -17 : 17)};
    const transform = `translate(${from.x + (to.x - from.x) * p}px,${from.y + (to.y - from.y) * p}px)`;
    const old = lastTransfer;
    if (old?.snapshot === snapshot && old.transform === transform) return;
    if (old?.snapshot === snapshot) tracks.access.clear();
    node.querySelector('text').textContent = snapshot.io.kind === 'read' ? 'A · 页 1' : 'B · 页 2';
    node.style.transform = transform;
    lastTransfer = {snapshot, transform};
    if (lastAccess.forward && old?.snapshot.io?.kind === snapshot.io.kind && old.snapshot !== snapshot && p > old.snapshot.io.progress / old.snapshot.io.total) {
      tracks.access.animate(node, {transform: [old.transform, transform]}, Math.min(1.2, lastAccess.interval / 1000 * 0.85), {ease: 'easeInOut', cleanup: () => { node.style.transform = transform; }});
    }
  }
  function pool(current, index, pair, interval) {
    const previous = lastPool;
    tracks.pool.begin(interval); lastPool = {current, index, pair};
    if (previous?.pair !== pair || index !== previous.index + 1 || reduced.matches || !window.Motion) return;
    const duration = Math.min(0.45, interval / 1000 * 0.36);
    for (const mode of ['ondemand', 'background']) {
      const s = current[mode], before = previous.current[mode];
      if (before.tick === s.tick) continue;
      const host = $('[data-mode="' + mode + '"]'), frames = host.querySelector('.pf-pool-frames').children;
      const granted = s.served.length - before.served.length;
      const mark = (node, kind, delay) => {
        const label = document.createElement('em');
        label.className = 'pf-pool-motion is-' + kind; label.setAttribute('aria-hidden', 'true');
        label.textContent = kind === 'allocate' ? '分配' : '回收'; node.append(label);
        tracks.pool.animate(label, {opacity: [0, 1, 1, 0]}, duration, {delay, cleanup: () => label.remove()});
      };
      for (let i = before.free - granted; i < before.free; i++) mark(frames[i], 'allocate', 0);
      if (s.reclaimed) mark(frames[s.free - 1], 'reclaim', granted ? duration : 0);
    }
  }
  reduced.addEventListener('change', () => { if (reduced.matches) Object.values(tracks).forEach(t => t.clear()); });
  return {access, transfer, pool,
    pause: id => tracks[id].pause(), resume: (id, interval) => tracks[id].resume(interval), settle: id => tracks[id].settle()
  };
}
