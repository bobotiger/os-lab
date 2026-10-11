(() => {
  const tracks = [
    {id:'solo', name:'单独运行 A', color:'#176754', offset:0, times:[0.000002,0.029335,0.059106,0.088523,0.117658,0.147089,0.176212,0.205538,0.235135,0.264347,0.293663,0.322903,0.351778,0.381040,0.409917,0.438915,0.469218,0.498599,0.529298,0.560517,0.589360,0.618263,0.647106,0.676118,0.705935]},
    {id:'a', name:'并发运行 A', color:'#315f7b', offset:0, times:[0.000001,0.061116,0.118009,0.174864,0.232945,0.290135,0.346943,0.403772,0.463869,0.525248,0.580893,0.638320,0.695308,0.757481,0.814053,0.871058,0.933319,0.990619,1.048226,1.108460,1.169411,1.226310,1.282924,1.345443,1.398351]},
    {id:'b', name:'并发运行 B', color:'#9d493b', offset:0.004564, times:[0.000001,0.053210,0.110125,0.167180,0.227320,0.288659,0.345622,0.402021,0.460713,0.517660,0.574563,0.637015,0.693443,0.750453,0.807339,0.868632,0.925293,0.988191,1.045626,1.102853,1.160592,1.217640,1.274649,1.335395,1.394377]},
  ];
  const slider = document.getElementById('time');
  const play = document.getElementById('play');
  const limit = Number(slider.max);
  const position = time => 58 + time / limit * 800;
  const height = batch => 250 - batch / 24 * 210;
  const countAt = (track, time) => Math.max(0, track.times.filter(value => value + track.offset <= time).length - 1);
  const chart = document.getElementById('chart');
  chart.innerHTML = [0,6,12,18,24].map(batch => `<line class="grid" x1="58" x2="858" y1="${height(batch)}" y2="${height(batch)}"/><text x="12" y="${height(batch)+5}">${batch}</text>`).join('') +
    [0,.351,.702,1.053,1.404].map(time => `<text text-anchor="middle" x="${position(time)}" y="278">${time.toFixed(2)} s</text>`).join('') + '<text x="58" y="22">已完成段数</text>' +
    tracks.map(track => {
      let path = `M ${position(track.offset)} ${height(0)}`;
      track.times.slice(1).forEach((time, index) => { path += ` H ${position(time + track.offset)} V ${height(index + 1)}`; });
      path += ` H ${position(limit)}`;
      return `<path class="curve" stroke="${track.color}" d="${path}"/><circle id="marker-${track.id}" r="5" fill="${track.color}"/>`;
    }).join('') + '<line id="cursor" y1="35" y2="250" stroke="#68786f" stroke-dasharray="4 4"/>';
  for (const track of tracks) {
    document.querySelector(`[data-track="${track.id}"] .tiles`).innerHTML = Array.from({length:24}, () => '<span class="tile"></span>').join('');
  }
  document.getElementById('reference').textContent = '各行：已完成段数 / 本次共同起点后的秒数。\n\n' + tracks.map(track => `${track.name}\n${track.times.map((time, batch) => `${String(batch).padStart(2)} / ${(time + track.offset).toFixed(6)}`).join('\n')}`).join('\n\n');
  let frame = null;
  const paint = () => {
    const time = Number(slider.value);
    document.getElementById('clock').textContent = `${time.toFixed(3)} s`;
    const counts = tracks.map(track => {
      const count = countAt(track, time);
      const lane = document.querySelector(`[data-track="${track.id}"]`);
      lane.querySelectorAll('.tile').forEach((tile, index) => tile.classList.toggle('done', index < count));
      lane.querySelector('.count').textContent = `${count}/24`;
      lane.setAttribute('aria-label', `${track.name}：已完成 ${count} 段，共 24 段`);
      const marker = document.getElementById(`marker-${track.id}`);
      marker.setAttribute('cx', position(time));
      marker.setAttribute('cy', height(count));
      marker.style.display = time < track.offset ? 'none' : '';
      return count;
    });
    document.getElementById('cursor').setAttribute('x1', position(time));
    document.getElementById('cursor').setAttribute('x2', position(time));
    document.getElementById('milestone').textContent = time === 0 ? '两种运行条件下，尚无完成第 1 段的记录。' : counts.every(count => count === 24) ? '单独运行的 A 与并发运行的 A、B 均已完成 24 段，最终校验值一致。' : counts[0] === 24 ? `单独运行的 A 已完成 24 段；并发运行的 A、B 分别完成 ${counts[1]}、${counts[2]} 段。` : `单独运行的 A 已完成 ${counts[0]} 段；并发运行的 A、B 分别完成 ${counts[1]}、${counts[2]} 段。`;
  };
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    play.textContent = '▶';
    play.setAttribute('aria-label', '播放实测记录');
    play.title = '播放实测记录';
  };
  play.addEventListener('click', () => {
    if (frame !== null) { stop(); return; }
    if (Number(slider.value) >= limit) slider.value = 0;
    const initial = Number(slider.value);
    const start = performance.now();
    play.textContent = 'Ⅱ';
    play.setAttribute('aria-label', '暂停实测记录');
    play.title = '暂停实测记录';
    const tick = now => {
      slider.value = Math.min(limit, initial + (now - start) / 4000);
      paint();
      if (Number(slider.value) >= limit) stop();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });
  slider.addEventListener('input', () => { stop(); paint(); });
  document.getElementById('reset').addEventListener('click', () => { stop(); slider.value = 0; paint(); });
  document.getElementById('half').addEventListener('click', () => { stop(); slider.value = .706; paint(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  document.querySelectorAll('.copy').forEach(button => button.addEventListener('click', async () => {
    const pre = button.parentElement.querySelector('pre');
    document.querySelectorAll('.command-feedback').forEach(item => item.remove());
    const feedback = document.createElement('p');
    feedback.className = 'command-feedback';
    feedback.setAttribute('role', 'status');
    button.parentElement.after(feedback);
    try {
      await navigator.clipboard.writeText(pre.textContent);
      feedback.textContent = '已复制到剪贴板，尚未在 Ubuntu 中运行。';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(pre);
      selection.removeAllRanges();
      selection.addRange(range);
      feedback.textContent = '无法访问剪贴板，已选中这段命令，可手动复制。';
    }
  }));
  paint();
})();