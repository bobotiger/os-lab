(() => {
  'use strict';

  document.getElementById('cf-header').outerHTML = wikiHeader('cpuFoundations', []);
  document.getElementById('cf-related').outerHTML = wikiRelated('cpuFoundations');

  const $ = id => document.getElementById(id);

  // Keep the long article navigable and open linked reference material on demand.
  const pageContents = $('cf-page-contents');
  const wideReading = window.matchMedia('(min-width:1280px)');
  const fitContents = () => { pageContents.open = wideReading.matches; };
  wideReading.addEventListener('change', fitContents);
  fitContents();
  const readingLinks = [...document.querySelectorAll('.cf-reading-nav a[href^="#"]')];
  const readingTargets = readingLinks.map(link => ({link, target: document.querySelector(link.getAttribute('href'))}));
  function openReadingTarget(hash) {
    if (!hash) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return; }
    for (let element = target; element; element = element.parentElement) {
      if (element.tagName === 'DETAILS') element.open = true;
    }
  }
  let readingFrame = null;
  function updateReadingPosition() {
    readingFrame = null;
    let current = readingTargets[0];
    for (const item of readingTargets) {
      if (item.target && item.target.getBoundingClientRect().top <= 140) current = item;
    }
    readingLinks.forEach(link => link.removeAttribute('aria-current'));
    if (current) {
      current.link.setAttribute('aria-current', 'location');
      $('cf-reading-position').textContent = current.link.dataset.part;
    }
  }
  function queueReadingPosition() {
    if (readingFrame === null) readingFrame = window.requestAnimationFrame(updateReadingPosition);
  }
  readingLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openReadingTarget(link.hash);
    if (!wideReading.matches) pageContents.open = false;
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    // Long-distance chapter jumps should arrive immediately, without a page-length animation.
    document.querySelector(link.hash)?.scrollIntoView({behavior:'instant', block:'start'});
    queueReadingPosition();
  }));
  window.addEventListener('hashchange', () => { openReadingTarget(location.hash); queueReadingPosition(); });
  window.addEventListener('scroll', queueReadingPosition, {passive:true});
  window.addEventListener('resize', queueReadingPosition, {passive:true});
  document.querySelectorAll('.cf-article details').forEach(details => details.addEventListener('toggle', queueReadingPosition));
  openReadingTarget(location.hash);
  updateReadingPosition();


  // Full-adder truth table, expressed directly by the total of the three bits.
  const bits = {a:1,b:1,carry:0};
  const bitNames = {a:'输入 A',b:'输入 B',carry:'输入进位'};
  function renderAdder() {
    const total = bits.a + bits.b + bits.carry;
    const carry = Math.floor(total / 2);
    const sum = total % 2;
    document.querySelectorAll('[data-bit]').forEach(button => {
      const value = bits[button.dataset.bit];
      button.setAttribute('aria-pressed',String(Boolean(value)));
      button.setAttribute('aria-label',bitNames[button.dataset.bit]+'，当前为 '+value);
      button.querySelector('b').textContent = String(value);
    });
    $('cf-carry').textContent = String(carry);
    $('cf-sum-bit').textContent = String(sum);
    $('cf-adder-equation').textContent = bits.a+' + '+bits.b+' + '+bits.carry+' = '+carry+sum+'₂';
  }
  document.querySelectorAll('[data-bit]').forEach(button => button.addEventListener('click',() => {
    bits[button.dataset.bit] = 1-bits[button.dataset.bit];
    renderAdder();
  }));
  renderAdder();

  // One frame represents one completed teaching instruction, never one CPU cycle.
  function programFrames(input) {
    const frames = [{pc:0,n:null,sum:null,i:null,result:null,done:false,
      event:'准备从内存读取输入 N。点击下一步，执行 PC 指向的指令。'}];
    while (!frames.at(-1).done) {
      const previous = frames.at(-1);
      const next = {...previous};
      switch (previous.pc) {
        case 0:
          next.n = input; next.pc = 1;
          next.event = '搬：从内存读出输入 '+input+'，放入寄存器 N。下一条将设置 sum。';
          break;
        case 1:
          next.sum = 0; next.pc = 2;
          next.event = '置初值：sum 设为 0，累计和从零开始。';
          break;
        case 2:
          next.i = 1; next.pc = 3;
          next.event = '置初值：i 设为 1。下一条先比较 i 与 N，决定是否需要累加。';
          break;
        case 3:
          if (previous.i > previous.n) {
            next.pc = 7;
            next.event = '比 + 跳：'+previous.i+' > '+previous.n+' 成立，PC 转到 08。循环退出，但结果还没有写回内存。';
          } else {
            next.pc = 4;
            next.event = '比 + 跳：'+previous.i+' > '+previous.n+' 不成立，继续执行 05，把当前的 i 加入累计和。';
          }
          break;
        case 4:
          next.sum = previous.sum + previous.i; next.pc = 5;
          next.event = '加：sum = '+previous.sum+' + '+previous.i+' = '+next.sum+'。新的累计和保留在寄存器中。';
          break;
        case 5:
          next.i = previous.i + 1; next.pc = 6;
          next.event = '加：i 从 '+previous.i+' 变为 '+next.i+'。更新了数据，还要跳回去检查下一轮条件。';
          break;
        case 6:
          next.pc = 3;
          next.event = '跳：PC 回到 04。sum = '+next.sum+'、i = '+next.i+' 都保留下来；重复使用指令，不是把状态恢复成初值。';
          break;
        case 7:
          next.result = previous.sum; next.pc = 8; next.done = true;
          next.event = input === 0
            ? '搬：把 sum = 0 写回内存。N 为 0 时不进入累加部分，结果为 0。程序结束。'
            : '搬：把 sum = '+next.result+' 写回内存。1 到 '+input+' 的累计和为 '+next.result+'，程序结束。';
          break;
        default: throw new Error('Invalid teaching program counter');
      }
      frames.push(next);
    }
    return frames;
  }

  globalThis.OSLabCPUProgram = Object.freeze({programFrames});
  document.addEventListener('oslab:cinema', pause);

  const compactProgram = window.matchMedia('(max-width:650px)');
  const fitProgram = () => {$('cf-program-list').open = !compactProgram.matches;};
  compactProgram.addEventListener('change',fitProgram);
  fitProgram();
  const instructionText = [...document.querySelectorAll('[data-pc] code')].map(line => line.textContent);

  let frames = programFrames(Number($('cf-input-n').value));
  let position = 0;
  let timer = null;
  function pause() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    $('cf-play').textContent = '自动播放';
    $('cf-play').setAttribute('aria-pressed','false');
  }
  function renderProgram() {
    const current = frames[position];
    document.querySelectorAll('[data-pc]').forEach(line => {
      if (position > 0 && Number(line.dataset.pc) === frames[position-1].pc) line.setAttribute('aria-current','step');
      else line.removeAttribute('aria-current');
    });
    const highlighted = position > 0 ? frames[position-1].pc : 0;
    $('cf-current').textContent = (position > 0 ? '刚执行 · ' : '待执行 · ')+String(highlighted+1).padStart(2,'0')+'  '+instructionText[highlighted];
    $('cf-pc').textContent = current.done ? '结束' : String(current.pc+1).padStart(2,'0');
    $('cf-reg-n').textContent = current.n ?? '—';
    $('cf-reg-sum').textContent = current.sum ?? '—';
    $('cf-reg-i').textContent = current.i ?? '—';
    $('cf-memory-input').textContent = $('cf-input-n').value;
    $('cf-memory-result').textContent = current.result ?? '尚未写入';
    $('cf-program-event').textContent = current.event;
    $('cf-step-count').textContent = '已执行 '+position+' 条';
    $('cf-prev').disabled = position === 0;
    $('cf-next').disabled = current.done;
    $('cf-play').disabled = current.done;
    $('cf-program-code').dataset.step = String(position);
    if (current.done) pause();
  }
  function advance() {
    if (position < frames.length-1) position++;
    renderProgram();
  }
  $('cf-next').addEventListener('click',() => {pause();advance();});
  $('cf-prev').addEventListener('click',() => {
    pause(); position = Math.max(0,position-1); renderProgram();
  });
  $('cf-play').addEventListener('click',() => {
    if (timer !== null) {pause();return;}
    globalThis.OSLabConcurrencyMovies?.stopAll();
    $('cf-play').textContent = '暂停';
    $('cf-play').setAttribute('aria-pressed','true');
    timer = window.setInterval(advance,2500);
  });
  function resetProgram() {
    pause();
    frames = programFrames(Number($('cf-input-n').value));
    position = 0;
    renderProgram();
  }
  $('cf-reset').addEventListener('click',resetProgram);
  $('cf-input-n').addEventListener('change',resetProgram);
  document.addEventListener('visibilitychange',() => {if (document.hidden) pause();});
  window.addEventListener('pagehide',pause);
  renderProgram();
  pause();

  const latencyExamples = [
    {id:'l1',name:'L1 缓存',basis:'命中 · 4 周期',cycles:4},
    {id:'l2',name:'L2 缓存',basis:'命中 · 12 周期',cycles:12},
    {id:'l3',name:'L3 缓存',basis:'命中 · 60 周期',cycles:60},
    {id:'ram',name:'主存读取',basis:'假定 100 ns',ns:100},
    {id:'ssd',name:'SSD 读取',basis:'假定 50 μs',ns:50000},
    {id:'network',name:'跨洋网络往返',basis:'假定 160 ms',ns:160000000},
  ];
  const YEAR = 365*24*60*60;
  const number = value => new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(value);
  function scaledTime(seconds) {
    if (seconds < 60) return number(seconds)+' 秒';
    if (seconds < 3600) {
      const minutes = Math.floor(seconds/60);
      const remainder = Math.round(seconds%60);
      return minutes+' 分'+(remainder ? ' '+remainder+' 秒' : '钟');
    }
    if (seconds < 86400) return '约 '+(seconds/3600).toFixed(1)+' 小时';
    if (seconds < YEAR) return '约 '+(seconds/86400).toFixed(1)+' 天';
    return '约 '+(seconds/YEAR).toFixed(1)+' 年';
  }
  function realTime(ns) {
    if (ns < 1000) return number(ns)+' ns';
    if (ns < 1000000) return number(ns/1000)+' μs';
    return number(ns/1000000)+' ms';
  }
  function compactCycles(cycles) {
    if (cycles >= 1e8) return number(cycles/1e8)+' 亿周期';
    if (cycles >= 1e4) return number(cycles/1e4)+' 万周期';
    return number(cycles)+' 周期';
  }
  function renderTime() {
    const ghz = Number($('cf-frequency').value);
    $('cf-frequency-value').textContent = ghz+' GHz';
    $('cf-period').textContent = number(1/ghz)+' ns';
    $('cf-human-second').textContent = scaledTime(ghz*1e9);
    $('cf-blink').textContent = '约 '+(0.1*ghz*1e9/YEAR).toFixed(1)+'–'+(0.4*ghz*1e9/YEAR).toFixed(1)+' 年';
    $('cf-time-rows').innerHTML = latencyExamples.map(item => {
      const cycles = item.cycles ?? item.ns*ghz;
      const ns = item.ns ?? item.cycles/ghz;
      return '<tr data-latency="'+item.id+'" data-cycles="'+cycles+'" data-ns="'+ns+'"><th scope="row">'+item.name+'<small>'+item.basis+'</small></th><td>'+realTime(ns)+'<small class="cf-mobile-cycles">'+compactCycles(cycles)+'</small></td><td>'+number(cycles)+'</td><td>'+scaledTime(cycles)+'</td></tr>';
    }).join('');
  }
  $('cf-frequency').addEventListener('input',renderTime);
  renderTime();
})();
