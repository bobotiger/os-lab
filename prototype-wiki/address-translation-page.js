function renderAddressTranslationPage(root) {
  const {buildAccess, buildRelocation} = OSLabAddressTranslation;
  const controls = id => `<div class="tx-controls" role="group" aria-label="${id === 'access' ? '地址转换' : '移动过程'}播放控制">
    <button type="button" data-control="prev" aria-label="上一步" title="上一步">←</button>
    <button type="button" data-control="play" class="tx-play" aria-pressed="false">播放</button>
    <button type="button" data-control="next" aria-label="下一步" title="下一步">→</button>
    <button type="button" data-control="reset">重置</button>
    <label><span>速度</span><select aria-label="播放速度"><option value="1800">慢速</option><option value="1100" selected>正常</option><option value="600">快速</option></select></label>
  </div>`;
  root.innerHTML = `<div class="page tx-page" id="top"><a class="tx-skip" href="#main-content">跳到主要内容</a>${wikiHeader('addressTranslation', [])}
    <main id="main-content" tabindex="-1"><header class="tx-intro"><p class="tx-kicker">内存虚拟化 / 基址与界限</p><h1>地址转换 <span>Address Translation</span></h1>
      <p class="tx-lead">程序给出<strong>虚拟地址</strong>，硬件找到<strong>物理位置</strong>。</p><p>先从整段连续存放的方案开始：程序的地址空间从 0 开始，可以装入不同物理位置。一对基址与界限负责整个地址空间的转换与保护。</p>
    </header>
    <section id="demo" class="tx-lab" aria-labelledby="tx-lab-title">
      <header class="tx-lab-head"><div><h2 id="tx-lab-title">先检查界限，再加上基址</h2><p>执行访存指令时，取指令与访问数据分别进行地址转换。</p></div><span class="tx-mode" id="tx-mode">用户态</span></header>
      <div class="tx-request"><div class="tx-presets" role="group" aria-label="选择访问情境">
        <button type="button" data-address="6">读数据 <b>6</b></button><button type="button" data-address="0">取指令 <b>0</b></button><button type="button" data-address="16" id="boundary">越界访问 <b>16</b></button>
      </div><label class="tx-custom">虚拟地址 <input id="tx-address" type="number" min="-1" max="63" step="1" value="6" aria-describedby="tx-input-error" inputmode="numeric"></label></div>
      <p id="tx-input-error" role="alert" hidden></p>
      <div id="tx-access-view">
        <div class="tx-circuit" id="tx-circuit" role="group" aria-label="一次访存的转换路径">
          <button type="button" class="tx-node tx-source" data-step="0"><span class="tx-node-owner">进程 A</span><span class="tx-node-title">发出虚拟地址</span><strong class="tx-number" id="tx-va">6</strong><span class="tx-node-note" id="tx-source-note">读取 buffer</span></button>
          <div class="tx-mmu"><span class="tx-mmu-title">MMU · 硬件地址转换单元</span>
            <button type="button" class="tx-node tx-check" data-step="1"><span class="tx-register">界限 bounds <b>16</b></span><span class="tx-node-title">检查范围</span><strong class="tx-formula" id="tx-check-formula">0 ≤ VA &lt; 16</strong><span class="tx-node-note" id="tx-check-note">16 是长度，最后有效地址为 15</span></button>
            <button type="button" class="tx-node tx-add" data-step="2"><span class="tx-register">基址 base <b id="tx-base">24</b></span><span class="tx-node-title">加上物理起点</span><strong class="tx-formula" id="tx-add-formula">24 + 6</strong><span class="tx-node-note" id="tx-add-note">检查通过后才计算</span></button>
          </div>
          <button type="button" class="tx-node tx-destination" data-step="3"><span class="tx-node-owner" id="tx-destination-owner">物理内存</span><span class="tx-node-title" id="tx-destination-title">访问目标位置</span><strong class="tx-number" id="tx-pa">—</strong><span class="tx-node-note" id="tx-value">等待物理地址</span></button>
        </div>
        <div class="tx-register-note">base 与 bounds 由 OS 特权设置，用户程序不能自行修改。<a href="#roles">进程切换时如何处理 →</a></div>
        <div class="tx-physical"><div class="tx-memory-head"><h3>物理内存 <span>0–63</span></h3><span>选择 A 的装入位置，比较转换结果</span></div>
          <div class="tx-memory-map" id="tx-memory-map"><span class="tx-os">OS</span><span class="tx-memory-other">空闲</span>
            <button type="button" data-base="24" aria-pressed="true"><b>24–39</b><span>进程 A</span></button><button type="button" data-base="40" aria-pressed="false"><b>40–55</b><span>可用区域</span></button>
            <span id="tx-target" class="tx-target" hidden></span>
          </div><div class="tx-scale" aria-hidden="true"><span style="left:0">0</span><span style="left:12.5%">8</span><span style="left:37.5%">24</span><span style="left:62.5%">40</span><span style="left:87.5%">56</span><span style="right:0">64</span></div>
        </div>
        <div class="tx-reading" id="tx-access-log" aria-live="polite"><span class="tx-progress" id="tx-progress"></span><div><h3 id="tx-status-title"></h3><p id="tx-status"></p></div></div>
      </div>
      <div class="tx-transport" id="tx-access-controls">${controls('access')}<button type="button" class="tx-boundary-link" data-address="15">比较最后有效地址 15</button></div>
    </section>
    <p class="tx-premise">本例的地址单位不对应真实字节，每次访问 1 单位；A 占连续的 16 单位物理空间，0–7 保留给 OS。</p>
    <div class="tx-next-mechanism"><p><strong>整段分配，也会占用堆与栈之间的空白。</strong>分段保留基址与界限的思路，改为给代码、堆、栈分别设置映射。</p><a href="segmentation.html">分段：分别放置各区域 →</a></div>
    <div class="tx-further" aria-label="地址转换的进一步分析">
      <details id="roles" class="tx-detail" name="translation-detail"><summary><span><small>寄存器与进程</small><strong>OS 维护设置，硬件完成每次转换</strong></span><span class="tx-expand" aria-hidden="true">＋</span></summary>
        <div class="tx-detail-body"><p class="tx-detail-lead">每个 CPU 只有一对 base / bounds 寄存器。切换进程时，OS 要让它们对应即将运行的进程。</p>
          <ol class="tx-switch-flow"><li>暂停进程 A<small>将 A 的设置保存到 PCB</small></li><li>装入进程 B 的设置<small>更新 CPU 的 base / bounds</small></li><li>恢复进程 B<small>硬件按 B 的设置转换地址</small></li></ol>
          <p class="tx-small">PCB 是 OS 保存进程状态的数据结构。OS 还负责在创建进程时分配内存、退出时回收内存，并处理硬件报告的保护异常。</p>
          <section id="relocation" class="tx-move" aria-labelledby="tx-move-title"><header><h3 id="tx-move-title">移动地址空间后，程序仍使用原来的虚拟地址</h3><p>先暂停 A，复制内容并更新基址，再恢复运行。</p></header>
            <div class="tx-move-top"><span>程序使用 <strong>VA 6</strong></span><span>A 的基址 <strong id="tx-move-base">24</strong></span><span id="tx-move-mode">A 正在运行</span></div>
            <div id="tx-move-picture"></div><p class="tx-move-key"><i class="tx-unused" aria-hidden="true"></i>斜纹：堆与栈之间未使用的区域，仍随整段一起分配。</p>
            <div class="tx-move-steps" id="tx-move-steps" role="group" aria-label="移动地址空间的阶段"></div>
            <div class="tx-reading" aria-live="polite"><span class="tx-progress" id="tx-move-progress"></span><div><h4 id="tx-move-status-title"></h4><p id="tx-move-status"></p></div></div>
            <div id="tx-move-controls">${controls('move')}</div>
          </section>
          <p class="tx-insight"><strong>动态重定位发生在每次访存时。</strong>硬件实时转换地址；复制整个地址空间是 OS 改变存放位置时的单独操作。</p>
        </div>
      </details>
      <details id="limits" class="tx-detail" name="translation-detail"><summary><span><small>速度与空间</small><strong>检查和加法很简单，整段分配却可能浪费内存</strong></span><span class="tx-expand" aria-hidden="true">＋</span></summary>
        <div class="tx-detail-body tx-cost"><div><h3>堆与栈之间的空白，也在分配范围内</h3><p>只用一对基址与界限，整个地址空间就要连续存放。中间暂未使用的 4 单位仍占物理内存，不能直接分配给其他进程。</p><div class="tx-cost-numbers"><span><b>16</b> 单位整段分配</span><span><b>4</b> 单位中间空白</span></div></div>
          <figure class="tx-allocation"><figcaption>进程 A 的 16 单位地址空间</figcaption><div class="tx-allocation-bar"><span style="grid-column:span 4">代码 / 数据</span><span style="grid-column:span 4">堆</span><span class="tx-unused" style="grid-column:span 4">未使用</span><span style="grid-column:span 4">栈</span></div><div class="tx-allocation-scale"><span>0</span><span>4</span><span>8</span><span>12</span><span>16</span></div><p>斜纹区域属于 A 的分配范围，是整段分配产生的内部碎片。</p></figure>
          <p class="tx-insight"><strong>时间上：</strong>正常访存只需硬件检查与加法，无需每次进入 OS。<br><strong>空间上：</strong>整段连续分配会保留未使用区域。</p>
        </div>
      </details>
      <details id="exercise" class="tx-detail" name="translation-detail"><summary><span><small>练习解析</small><strong>请解释什么是重定位？为什么要重定位？</strong></span><span class="tx-expand" aria-hidden="true">＋</span></summary>
        <div class="tx-detail-body"><p class="tx-detail-lead"><strong>重定位</strong>是根据程序的实际装入位置，将程序中的逻辑地址转换或修正为相应物理地址的过程。</p>
          <figure class="tx-binding"><figcaption><h3>同一程序，两种装入位置</h3><span>buffer 的逻辑地址始终为 <b>6</b></span></figcaption><div id="tx-binding-cases"></div>
            <p class="tx-insight">同一个逻辑地址 6，需要随装入位置对应到 30 或 46。重定位使程序能够装入不同的可用区域，并正确访问自己的指令与数据。</p><p id="tx-old-explanation" aria-live="polite">物理地址 30 只对应第一种装入结果。</p>
          </figure>
          <div class="tx-relocation-types"><p><strong>装入时修改地址</strong><span>静态重定位：装入程序按实际位置修正地址。</span></p><p><strong>运行时转换地址</strong><span>动态重定位：硬件在每次访存时完成转换，本页的基址机制属于这一类。</span></p></div>
        </div>
      </details>
    </div>
    </main><footer class="site-footer"><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;
  root.querySelector('.site-header nav').remove();
  const $ = selector => root.querySelector(selector);
  const $$ = selector => Array.from(root.querySelectorAll(selector));
  let address = 6, base = 24, validInput = true;
  const accessPanel = $('#tx-access-controls'), movePanel = $('#tx-move-controls');
  $('.tx-request').after(accessPanel);
  $('#tx-circuit').before($('#tx-access-log'));
  const stages = ['发出地址', '检查界限', '加上基址', '访问内存'];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

  // Playback consumes immutable model snapshots; seeking never performs an extra access.
  function makeController(panel, frames, paint) {
    let index = 0, timer = null, disabled = false;
    const buttons = Object.fromEntries(Array.from(panel.querySelectorAll('[data-control]'), button => [button.dataset.control, button]));
    const controller = {
      get index() { return index; },
      get frames() { return frames; },
      pause() { clearInterval(timer); timer = null; updateControls(); },
      seek(next) { controllers.forEach(other => other.pause()); index = Math.max(0, Math.min(next, frames.length - 1)); render(); },
      replace(next) { controllers.forEach(other => other.pause()); frames = next; index = 0; render(); },
      refresh: render,
      disable(value) { disabled = value; panel.querySelector('select').disabled = disabled; updateControls(); },
    };
    function updateControls() {
      if (disabled) { Object.values(buttons).forEach(button => {button.disabled = true;}); return; }
      buttons.play.disabled = false; buttons.reset.disabled = false;
      buttons.prev.disabled = index === 0;
      buttons.next.disabled = index === frames.length - 1;
      buttons.play.textContent = timer !== null ? '暂停' : index === frames.length - 1 ? '重播' : '播放';
      buttons.play.setAttribute('aria-pressed', String(timer !== null));
    }
    function render() { paint(frames[index], index, frames.length); updateControls(); }
    function play() {
      controllers.forEach(other => other.pause());
      if (index === frames.length - 1) { index = 0; render(); }
      timer = setInterval(() => {
        index = Math.min(index + 1, frames.length - 1);
        if (index === frames.length - 1) controller.pause();
        render();
      }, Number(panel.querySelector('select').value));
      updateControls();
    }
    buttons.play.addEventListener('click', () => timer === null ? play() : controller.pause());
    buttons.prev.addEventListener('click', () => controller.seek(index - 1));
    buttons.next.addEventListener('click', () => controller.seek(index + 1));
    buttons.reset.addEventListener('click', () => controller.seek(0));
    panel.querySelector('select').addEventListener('change', () => {if (timer !== null) play();});
    return controller;
  }
  const controllers = [];
  const access = makeController(accessPanel, buildAccess(), paintAccess);
  const move = makeController(movePanel, buildRelocation(), paintMove);
  controllers.push(access, move);

  function paintAccess(frame, index, total) {
    const rejected = frame.checked === false;
    $('#tx-circuit').dataset.state = rejected ? 'rejected' : frame.accessed ? 'accessed' : 'pending';
    $('#tx-circuit').dataset.stage = index;
    $('#tx-va').textContent = frame.address;
    $('#tx-base').textContent = frame.base;
    $('#tx-source-note').textContent = frame.address === 6 ? '读取 buffer' : frame.address < 2 && frame.address >= 0 ? '获取程序指令' : `访问 VA ${frame.address}`;
    $('#tx-check-formula').textContent = frame.checked === null ? '0 ≤ VA < 16' : rejected ? frame.address < 0 ? `${frame.address} < 0` : `${frame.address} ≥ 16` : `0 ≤ ${frame.address} < 16`;
    $('#tx-check-note').textContent = frame.checked === null ? '长度 16 · 有效地址 0–15' : rejected ? '未通过 · 不进行基址加法' : '范围检查通过';
    $('#tx-add-formula').textContent = rejected ? '不计算' : `${frame.base} + ${frame.address}`;
    $('#tx-add-note').textContent = rejected ? '本次访问被阻止' : frame.physicalAddress === null ? '检查通过后才计算' : `= ${frame.physicalAddress}`;
    $('#tx-destination-owner').textContent = rejected ? '硬件报告 → OS 处理' : '物理内存';
    $('#tx-destination-title').textContent = rejected ? '保护异常' : '访问目标位置';
    $('#tx-pa').textContent = frame.fault ? '×' : rejected ? '—' : frame.physicalAddress === null ? '—' : frame.physicalAddress;
    $('#tx-value').textContent = frame.fault ? '控制转入内核' : rejected ? '目标内存未被访问' : frame.accessed ? frame.value : frame.physicalAddress === null ? '等待物理地址' : '地址已生成，尚未读取';
    $('#tx-mode').textContent = frame.mode === 'kernel' ? '内核态' : '用户态';
    $('#tx-mode').dataset.mode = frame.mode;
    $$('.tx-circuit [data-step]').forEach(button => {
      const step = Number(button.dataset.step);
      const active = step === (rejected && index === 2 ? 3 : index);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', step === 3 && rejected ? '保护异常' : stages[step]);
      button.tabIndex = active ? 0 : -1;
      button.disabled = step === 2 && rejected;
      if (step === 2) button.hidden = rejected;
      button.dataset.done = String(step < index && !(rejected && step === 2));
    });
    $$('[data-address]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.address) === frame.address)));
    $$('[data-base]').forEach(button => {
      const selected = Number(button.dataset.base) === frame.base;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('span').textContent = selected ? '进程 A' : '可用区域';
      button.setAttribute('aria-label', `将 A 装入 ${button.dataset.base}–${Number(button.dataset.base) + 15}`);
    });
    const marker = $('#tx-target');
    marker.hidden = frame.physicalAddress === null;
    if (!marker.hidden) {
      marker.style.left = `${frame.physicalAddress / 64 * 100}%`;
      marker.dataset.address = frame.physicalAddress;
      marker.dataset.accessed = frame.accessed;
      marker.setAttribute('aria-label', `PA ${frame.physicalAddress}，${frame.accessed ? '已访问' : '尚未访问'}`);
    } else { delete marker.dataset.address; delete marker.dataset.accessed; }
    const titles = rejected ? ['程序发出虚拟地址', '地址超出了 A 的虚拟范围', '硬件触发保护异常，OS 接管'] : ['程序无需知道数据实际存在哪里', '地址位于 0–15，检查通过', `物理地址是 ${frame.physicalAddress}，尚未访问内存`, '硬件完成访问，无需每次进入 OS'];
    const descriptions = rejected ? [
      '', `${frame.address} 不满足 0 ≤ VA < 16。即使加上基址后仍落在物理内存中，也不能通过检查。`, '目标内存没有被访问。OS 根据异常决定后续处置，通常会终止越界的进程。'
    ] : [
      `A 使用虚拟地址 ${frame.address}。它的整段空间实际从物理地址 ${frame.base} 开始，两个地址不能直接混用。`,
      `bounds 表示长度，${frame.address} 小于 16。检查针对进程的地址范围，与机器还有多少空闲内存无关。`,
      `${frame.base} + ${frame.address} = ${frame.physicalAddress}。程序使用的虚拟地址仍为 ${frame.address}；绿色标记指向转换后的目标位置。`,
      frame.address >= 8 && frame.address <= 11 ? '该位置在整段范围内，但属于未使用区域。界限检查不负责判断 C 对象是否存在或访问是否符合其生命周期。' : `通过物理地址 ${frame.physicalAddress} ${frame.address <= 1 ? '取到程序指令' : '访问目标位置'}。检查与转换由硬件完成，OS 无需逐次参与正常访存。`
    ];
    $('#tx-status-title').textContent = titles[index];
    $('#tx-status').textContent = descriptions[index];
    $('#tx-progress').textContent = `${index + 1} / ${total}`;
    $('#tx-access-log').dataset.fault = rejected;
  }

  function paintMove(frame, index, total) {
    $('#tx-move-base').textContent = frame.base;
    $('#tx-move-mode').textContent = frame.paused ? 'A 已暂停 · 内核态' : 'A 正在运行 · 用户态';
    $('#tx-move-picture').innerHTML = [24, 40].map(start => {
      const cells = frame.physical.slice(start, start + 16), populated = cells[0].owner !== null;
      const active = frame.base === start;
      const state = cells[0].owner === 'copy' ? '内容已复制，尚未启用' : cells[0].owner === 'A' ? '属于进程 A' : index > 2 && start === 24 ? '已释放，可供复用' : '可用目标区域';
      return `<div class="tx-move-row" data-start="${start}" data-owner="${cells[0].owner || 'none'}"><div class="tx-move-row-title"><strong>物理 ${start}–${start + 15}</strong><span>${state}</span>${active ? '<b>当前基址</b>' : ''}</div><div class="tx-move-memory" role="img" aria-label="${state}${populated ? '，buffer 为 10，保存的虚拟引用为 6，中间 4 单位未使用' : ''}">
        ${cells.map((cell, offset) => `<span class="tx-cell${populated && offset >= 8 && offset <= 11 ? ' tx-unused' : ''}" data-address="${cell.address}" data-selected="${cell.address === frame.physicalAddress}" title="${cell.address}${populated ? ' · ' + escapeHtml(cell.content) : ' · 可用'}">${populated && offset === 6 ? '<b>10</b>' : populated && offset === 14 ? '<b>6</b>' : ''}</span>`).join('')}</div><div class="tx-move-labels">${populated ? `<span style="grid-column:6 / span 3">buffer · ${start + 6}</span><span style="grid-column:14 / span 3">saved · ${start + 14}</span>` : '<span class="tx-empty-note">没有 A 的有效内容</span>'}</div></div>`;
    }).join('');
    $('#tx-move-status-title').textContent = frame.title;
    $('#tx-move-status').textContent = [
      '硬件使用 base = 24，将 VA 6 转换为 PA 30。buffer 的值为 10，saved 保存的虚拟地址为 6。',
      'OS 暂停 A，准备可用的连续区域 40–55。此时新位置还没有 A 的内容。',
      '16 单位内容全部复制到新位置，包含中间未使用的 4 单位。A 仍暂停，基址仍为 24。',
      'OS 将 A 的基址设置更新为 40，原区域可供复用。A 仍暂停，尚未恢复访存。',
      'A 恢复后，VA 6 对应 PA 46。buffer 仍为 10，saved 仍为 6；程序中的虚拟地址不需要随物理位置修改。'
    ][index];
    $('#tx-move-progress').textContent = `${index + 1} / ${total}`;
    $$('#tx-move-steps button').forEach((button, step) => {button.setAttribute('aria-pressed', String(step === index)); button.tabIndex = step === index ? 0 : -1;});
  }
  $('#tx-move-steps').innerHTML = ['原处访问', '暂停 A', '复制内容', '更新基址', '恢复访问'].map((label, index) => `<button type="button" data-move-step="${index}">${label}</button>`).join('');

  function readAddress() {
    access.pause();
    const raw = $('#tx-address').value.trim(), value = Number(raw);
    validInput = raw !== '' && Number.isInteger(value) && value >= -1 && value <= 63;
    $('#tx-input-error').hidden = validInput;
    $('#tx-input-error').textContent = validInput ? '' : '请输入 −1 至 63 的整数。0–15 有效，其他地址用于观察越界。';
    $('#tx-address').setAttribute('aria-invalid', String(!validInput));
    $('#tx-access-view').hidden = !validInput;
    access.disable(!validInput);
    if (validInput) {address = value; access.replace(buildAccess(address, base));}
  }
  $('#tx-address').addEventListener('input', readAddress);
  $$('[data-address]').forEach(button => button.addEventListener('click', () => {$('#tx-address').value = button.dataset.address; readAddress();}));
  $$('[data-base]').forEach(button => button.addEventListener('click', () => {base = Number(button.dataset.base); readAddress();}));
  $('#tx-circuit').addEventListener('click', event => {const button = event.target.closest('[data-step]'); if (button) access.seek(Math.min(Number(button.dataset.step), access.frames.length - 1));});
  $('#tx-move-steps').addEventListener('click', event => {const button = event.target.closest('[data-move-step]'); if (button) move.seek(Number(button.dataset.moveStep));});
  function stepKeys(container, selector, controller) {
    container.addEventListener('keydown', event => {
      if (!event.target.closest(selector) || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      controller.seek(event.key === 'Home' ? 0 : event.key === 'End' ? controller.frames.length - 1 : controller.index + (event.key === 'ArrowRight' ? 1 : -1));
      container.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
    });
  }
  stepKeys($('#tx-circuit'), '[data-step]', access);
  stepKeys($('#tx-move-steps'), '[data-move-step]', move);
  $$('.tx-detail > summary').forEach(summary => summary.addEventListener('click', () => controllers.forEach(controller => controller.pause())));
  $$('.tx-detail').forEach(detail => detail.addEventListener('toggle', () => {
    if (!detail.open && detail.id === 'roles') move.pause();
    if (detail.open) controllers.forEach(controller => controller.pause());
    if (!validInput) access.disable(true);
  }));
  document.addEventListener('visibilitychange', () => {if (document.hidden) controllers.forEach(controller => controller.pause());});
  window.addEventListener('pagehide', () => controllers.forEach(controller => controller.pause()));

  // Exercise maps use a common physical scale, so a different load position is visible.
  $('#tx-binding-cases').innerHTML = [24, 40].map(start => `<div class="tx-binding-case" data-load="${start}"><div class="tx-binding-head"><strong>装入起点 ${start}</strong><span><b class="tx-blue">VA 6</b> + ${start} = <b class="tx-green">PA ${start + 6}</b></span></div>
    <div class="tx-binding-map"><div class="tx-binding-memory"><span class="tx-binding-allocation" style="left:${start / 64 * 100}%;width:25%"><span>A · ${start}–${start + 15}</span></span><span class="tx-binding-target" data-address="${start + 6}" style="left:${(start + 6) / 64 * 100}%"></span></div>
    <span class="tx-binding-target-label" style="left:${(start + 6.5) / 64 * 100}%">buffer = 10<strong>${start + 6}</strong></span><span class="tx-map-zero">0</span><span class="tx-map-end">63</span>
    ${start === 40 ? '<button type="button" id="tx-old-address" aria-pressed="false" aria-describedby="tx-old-explanation" style="left:47.65625%">旧址<br><b>30</b></button>' : ''}</div></div>`).join('');
  $('#tx-old-address').addEventListener('click', event => {
    const button = event.currentTarget, pressed = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(pressed));
    $('#tx-old-explanation').textContent = pressed ? '如果仍访问原物理地址 30，就会落到 A 的新区域 40–55 之外。正确的 buffer 位置是 46。' : '物理地址 30 只对应第一种装入结果。';
    $('#tx-old-explanation').dataset.wrong = pressed;
  });
  function openAnchor(value) {
    const hash = typeof value === 'string' ? value : location.hash.slice(1);
    if (['roles','relocation','limits','exercise'].includes(hash)) {
      const detail = $(hash === 'relocation' ? '#roles' : `#${hash}`);
      detail.open = true;
      requestAnimationFrame(() => $(hash === 'relocation' ? '#relocation' : `#${hash}`).scrollIntoView({block:'start'}));
    } else if (hash === 'boundary') {$('#tx-address').value = 16; readAddress(); $('#demo').scrollIntoView({block:'start'});}
  }
  root.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) openAnchor(link.getAttribute('href').slice(1));
  });
  window.addEventListener('hashchange', openAnchor);
  access.refresh(); move.refresh(); openAnchor();
}
renderAddressTranslationPage(document.getElementById('root'));
