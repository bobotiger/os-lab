function createPressureMotion(host) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  let previous = null, currentInterval = 500;

  function clear() {
    for (const entry of [...active]) entry.finish();
  }

  function animate(node, keyframes, duration, remove = false) {
    const animation = window.Motion.animate(node, keyframes, {duration, ease: [0.22, 1, 0.36, 1]});
    const entry = {animation, paused: false, finish() {
      if (!active.delete(entry)) return;
      animation.stop();
      if (remove) node.remove();
      else { node.style.removeProperty('transform'); node.style.removeProperty('opacity'); }
    }};
    active.add(entry);
    animation.then(entry.finish);
  }

  function update(snapshot, step, mode, interval) {
    const before = previous;
    previous = {snapshot, step, mode};
    clear();
    currentInterval = interval;
    if (reduced.matches || !window.Motion || !before || before.mode !== mode || step !== before.step + 1) return;
    const frame = host.querySelector('[data-thrash-frame="' + snapshot.selected + '"]');
    if (!frame) return;
    const duration = Math.min(0.55, interval / 1000 * 0.84);
    if (snapshot.phase === 'load') {
      const card = frame.querySelector('.thrash-page');
      const oldPage = before.snapshot.frames[snapshot.selected].page;
      if (oldPage !== null) {
        const ghost = card.cloneNode(true);
        ghost.className = 'thrash-page thrash-page-out';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.querySelector('b').textContent = 'P' + Math.floor(oldPage / 3);
        ghost.querySelector('span').textContent = '页 ' + oldPage % 3;
        card.parentElement.append(ghost);
        animate(ghost, {transform: ['translateY(0)', 'translateY(-100%)'], opacity: [0.75, 0]}, duration * 0.8, true);
      }
      animate(card, {transform: ['translateY(100%)', 'translateY(0)'], opacity: [0.3, 1]}, duration);
    } else if (snapshot.phase === 'select' || snapshot.phase === 'hit') {
      animate(frame.querySelector('.thrash-frame-signal'), {opacity: [0, 0.85, 0]}, duration);
    }
  }

  reduced.addEventListener('change', () => { if (reduced.matches) clear(); });
  return {
    update,
    pause() { for (const entry of active) { entry.animation.pause(); entry.paused = true; } },
    resume(interval) { for (const entry of active) if (entry.paused) { entry.animation.speed = currentInterval / interval; entry.animation.play(); entry.paused = false; } },
    clear
  };
}
