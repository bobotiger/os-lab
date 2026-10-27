function createSmallTablesMotion(root) {
  const $ = selector => root.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function channel() {
    const active = new Set();
    let interval = 1400;
    function clear() { for (const entry of [...active]) entry.finish(); }
    return {
      clear,
      begin(ms) { clear(); interval = ms; },
      animate(node, frames, duration, delay = 0, cleanup = () => {
        for (const property of Object.keys(frames)) node.style.removeProperty(property);
      }) {
        if (reduced.matches || !window.Motion) { cleanup(); return; }
        const animation = Motion.animate(node, frames, {duration, delay, ease: [0.22, 1, 0.36, 1]});
        const entry = {animation, paused: false, finish() {
          if (!active.delete(entry)) return;
          animation.stop(); cleanup();
        }};
        active.add(entry); animation.then(entry.finish);
      },
      pause() { for (const entry of active) { entry.animation.pause(); entry.paused = true; } },
      resume(ms) { for (const entry of active) if (entry.paused) {
        entry.animation.speed = interval / ms; entry.animation.play(); entry.paused = false;
      } }
    };
  }
  const tracks = {walk: channel(), cost: channel()};
  let previousWalk = null, previousCost = null;
  function glow(track, node, tone, duration, delay = 0) {
    if (!node) return;
    const marker = document.createElement('i');
    marker.className = 'mt-motion-focus is-' + tone;
    marker.setAttribute('aria-hidden', 'true'); node.append(marker);
    track.animate(marker, {opacity: [0, 0.45, 0]}, duration, delay, () => marker.remove());
  }
  function pointer(track, from, to, text, tone, duration, delay) {
    const box = $('.mt-walk-diagram'), bounds = box.getBoundingClientRect();
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const label = document.createElement('span');
    label.className = 'mt-motion-pointer is-' + tone;
    label.textContent = text; label.setAttribute('aria-hidden', 'true'); box.append(label);
    const width = label.offsetWidth, height = label.offsetHeight;
    const at = r => `translate(${Math.max(0, Math.min(bounds.width - width, r.left + r.width / 2 - bounds.left - width / 2))}px,${r.top + r.height / 2 - bounds.top - height / 2}px)`;
    track.animate(label, {transform: [at(a), at(b)], opacity: [0, 1, 1, 0]}, duration, delay, () => label.remove());
  }
  function arrow(track, node, tone, duration, delay = 0) {
    const marker = document.createElement('i');
    marker.className = 'mt-motion-route is-' + tone;
    marker.setAttribute('aria-hidden', 'true'); node.append(marker);
    const vertical = node.getBoundingClientRect().height > node.getBoundingClientRect().width;
    track.animate(marker, {transform: [vertical ? 'scaleY(0)' : 'scaleX(0)', 'scale(1)'], opacity: [0, 1, 0]}, duration, delay, () => marker.remove());
  }
  function walk(s, index, story, interval) {
    const old = previousWalk;
    previousWalk = {index, story}; tracks.walk.begin(interval);
    const box = $('.mt-walk-diagram'); box.dataset.phase = s.phase;
    const phase = s.phase === 'stop' ? (s.tableReads === 1 ? 'directory' : 'leaf') : s.phase;
    const field = phase === 'directory' ? 0 : phase === 'leaf' ? 1 : phase === 'translated' ? 2 : -1;
    for (const [i, node] of [...$('#mt-address-bits').children].entries()) node.classList.toggle('is-current', i === field);
    const dir = $('[data-dir="' + s.directory + '"]'), leaf = $('[data-leaf="' + s.leaf + '"]');
    for (const [node, active] of [[dir, phase === 'directory'], [leaf, phase === 'leaf']]) {
      node?.classList.toggle('is-current', active);
      node?.classList.toggle('is-invalid', active && s.phase === 'stop');
    }
    if (old?.story !== story || index !== old.index + 1 || reduced.matches || !window.Motion) return;
    const track = tracks.walk, duration = Math.min(1.25, interval / 1000 * 0.85);
    const cue = duration * 0.32;
    if (phase === 'directory' || phase === 'leaf') {
      const entry = phase === 'directory' ? dir : leaf;
      const found = phase === 'directory' ? s.leafFrame !== null : s.frame !== null;
      glow(track, $('#mt-address-bits').children[field], 'blue', cue);
      glow(track, entry, found ? 'gold' : 'red', cue * 1.7, cue * 0.45);
      if (found && s.phase !== 'stop') {
        const target = phase === 'directory' ? $('#mt-leaf-frame') : $('#mt-data-frame');
        const tone = phase === 'directory' ? 'blue' : 'green';
        pointer(track, entry.querySelector('b'), target,
          phase === 'directory' ? '表页框 ' + s.leafFrame : '数据页框 ' + s.frame,
          tone, duration * 0.62, duration * 0.22);
        arrow(track, root.querySelectorAll('.mt-route-line')[field], tone, duration * 0.6, duration * 0.2);
        glow(track, target, tone, cue, duration * 0.66);
      }
    } else if (s.phase === 'translated') {
      glow(track, $('#mt-data-frame'), 'green', cue);
      glow(track, $('#mt-address-bits').lastElementChild, 'blue', cue, cue * 0.25);
      glow(track, $('#mt-pa'), 'green', duration * 0.58, cue);
    } else if (s.phase === 'access') {
      glow(track, $('#mt-data-target'), 'green', duration * 0.72);
      glow(track, $('#mt-walk-counts').lastElementChild, 'green', cue, duration * 0.5);
    }
  }
  function cost(current, index, pair, interval) {
    const old = previousCost;
    previousCost = {index, pair, current}; tracks.cost.begin(interval);
    if (old?.pair !== pair || index !== old.index + 1 || reduced.matches || !window.Motion) return;
    const track = tracks.cost, duration = Math.min(0.9, interval / 1000 * 0.8);
    for (const key of ['two', 'automatic']) {
      const s = current[key], before = old.current[key];
      if (s === before) continue;
      const host = $('[data-plan="' + key + '"]'), target = host.querySelector('.mt-cost-target');
      if (s.phase === 'read') {
        const entries = host.querySelectorAll('[data-level]');
        if (s.level > 0) arrow(track, host.querySelectorAll('.mt-cost-arrow')[s.level - 1], 'gold', duration * 0.5);
        glow(track, entries[s.level], 'gold', duration * 0.65, s.level ? duration * 0.25 : 0);
      } else if (s.phase === 'translated') {
        if (!s.hit) arrow(track, host.querySelector('.mt-cost-arrow:last-of-type'), 'green', duration * 0.5);
        glow(track, target, 'green', duration * 0.6, s.hit ? 0 : duration * 0.3);
      } else if (s.phase === 'access') glow(track, target, 'green', duration * 0.7);
    }
  }
  reduced.addEventListener('change', () => { if (reduced.matches) Object.values(tracks).forEach(t => t.clear()); });
  window.addEventListener('resize', () => Object.values(tracks).forEach(t => t.clear()));
  return {walk, cost, clear: id => tracks[id].clear(),
    pause: id => tracks[id].pause(), resume: (id, interval) => tracks[id].resume(interval)};
}
