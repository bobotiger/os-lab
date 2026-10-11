const processPractice = [
  {title:'纯计算进程的 CPU 利用率', topic:'计算与利用率', question:'两个进程各执行五条计算指令。完成它们时，CPU 的利用率是多少？为什么？', input:'5:100,5:100', steps:[
    ['分别统计两个进程的工作量',['进程 0 执行五条计算指令；进程 1 也执行五条计算指令。','总共十次 CPU 计算，没有 I/O 请求。']],
    ['按进程列出运行时段',['时间 1–5：进程 0 执行五次计算，然后完成。','时间 6–10：进程 1 执行五次计算，然后完成。']],
    ['计算 CPU 利用率',['CPU 忙碌时间 = 5 + 5 = 10。总时间 = 10，空闲时间 = 0。','CPU 利用率 = 10 ÷ 10 × 100% = 100%。']]
  ], result:'10 个时间单位 · CPU 利用率 100%', conclusion:[['运行结果','两个进程在 10 个时间单位内全部完成，CPU 利用率为 100%。'],['没有空闲的原因','进程 0 完成后，进程 1 立即继续计算；十个时间单位都有 CPU 动作。'],['进程数量与利用率','只有一个 CPU，两个进程依次执行。利用率取决于 CPU 是否忙碌，不取决于进程是否同时运行。']]},
  {title:'先计算，再发起 I/O', topic:'输入顺序 · 计算在前', question:'进程 0 执行四条计算指令，进程 1 发起一次 I/O。完成两个进程需要多长时间？', input:'4:100,1:0', steps:[
    ['先确定计算阶段',['时间 1–4：进程 0 连续执行四条计算指令，然后完成。','这段时间进程 1 处于就绪状态，还没有发起 I/O。']],
    ['将一次 I/O 分为三个阶段',['时间 5：进程 1 使用 CPU 发起 I/O，随后阻塞。','时间 6–10：I/O 接受五个时间单位的服务。没有其他进程可运行，CPU 空闲。','时间 11：I/O 完成，进程 1 获得 CPU，执行 io_done 后结束。']],
    ['分别计算总时间和 CPU 利用率',['总时间 = 四次计算 + 一次发起 + 五个服务时间单位 + 一次完成处理 = 11。','CPU 忙碌时间 = 四次计算 + 一次发起 + 一次完成处理 = 6。','CPU 利用率 = 6 ÷ 11 × 100% ≈ 54.55%。']]
  ], result:'11 个时间单位 · CPU 利用率 54.55%', conclusion:[['完成时间','两个进程共用 11 个时间单位，CPU 忙碌 6、空闲 5。'],['空闲的原因','进程 1 开始等待 I/O 时，进程 0 已完成，等待期间没有其他进程可以使用 CPU。'],['哪些动作计入忙碌','发起 I/O 和 io_done 都占用 CPU；五个 I/O 服务时间单位不属于 CPU 忙碌时间。']]},
  {title:'先发起 I/O，再计算', topic:'输入顺序 · I/O 在前', question:'将输入改为 1:0,4:100。交换进程顺序会改变总时间吗？原因是什么？', input:'1:0,4:100', steps:[
    ['先发起 I/O，再选择计算进程',['时间 1：进程 0 发起 I/O 并阻塞。','默认 SWITCH_ON_IO 允许切换，进程 1 从时间 2 开始执行。']],
    ['区分重叠阶段与空闲阶段',['时间 2–5：进程 1 完成四次计算，同时进程 0 的 I/O 接受服务。','时间 6：进程 1 已完成，I/O 仍在服务，CPU 空闲。','时间 7：I/O 完成，进程 0 执行 io_done 后结束。']],
    ['与计算在前的输入比较',['总时间由第 2 题的 11 降为 7，减少了 4。','CPU 忙碌时间仍为四次计算、一次发起、一次完成处理，共 6。','CPU 利用率 = 6 ÷ 7 × 100% ≈ 85.71%。']]
  ], result:'7 个时间单位 · 比第 2 题少 4', conclusion:[['顺序改变后的结果','总时间为 7，CPU 只空闲 1 个时间单位，利用率为 85.71%。'],['时间缩短的原因','四次计算与四个 I/O 服务时间单位重叠，不再全部依次发生。'],['保持不变的工作量','计算次数、I/O 次数和 CPU 忙碌时间都没有减少；改变的是两种资源工作的先后与重叠。']]},
  {title:'等待 I/O 时不切换进程', topic:'阻塞后的选择 · SWITCH_ON_END', question:'相同的 1:0,4:100 输入，改用 SWITCH_ON_END。一个进程等待 I/O、另一个已经就绪时会发生什么？', input:'1:0,4:100', flags:'-S SWITCH_ON_END', steps:[
    ['确定阻塞后的选择',['时间 1：进程 0 发起 I/O，随后阻塞。','SWITCH_ON_END 不因这次阻塞选择进程 1，因此进程 1 仍在等待 CPU。']],
    ['逐段核对状态和 CPU 动作',['时间 2–6：进程 0 阻塞，进程 1 就绪，CPU 空闲五个时间单位。','时间 7：进程 0 执行 io_done，然后结束。','时间 8–11：进程 1 才获得 CPU，完成四次计算。']],
    ['计算完成时间与利用率',['总时间 = 11，CPU 忙碌时间 = 1 + 1 + 4 = 6。','CPU 利用率 = 6 ÷ 11 × 100% ≈ 54.55%。']]
  ], result:'11 个时间单位 · 等待期间 CPU 空闲 5', conclusion:[['运行结果','总时间为 11；CPU 忙碌 6、空闲 5，利用率为 54.55%。'],['有就绪进程仍空闲的原因','进程 1 虽已具备运行条件，但此规则没有在进程 0 阻塞时将 CPU 分配给它。'],['就绪与运行的区别','就绪表示可以运行；只有被调度并获得 CPU 后，进程才实际执行指令。']]},
  {title:'等待 I/O 时切换进程', topic:'阻塞后的选择 · SWITCH_ON_IO', question:'仍使用 1:0,4:100，明确指定 SWITCH_ON_IO。执行轨迹与第 4 题有何不同？', input:'1:0,4:100', flags:'-S SWITCH_ON_IO', steps:[
    ['确定切换发生的时刻',['时间 1：进程 0 发起 I/O 后阻塞。','SWITCH_ON_IO 选择就绪的进程 1，从时间 2 开始计算。']],
    ['核对计算与 I/O 的重叠',['时间 2–5：进程 1 计算，进程 0 的 I/O 同时接受服务。','时间 6：只剩 I/O 服务，CPU 空闲。','时间 7：进程 0 执行 io_done，然后结束。']],
    ['分别比较两项时间',['与第 4 题相比，总时间由 11 降为 7；CPU 空闲时间由 5 降为 1。','CPU 忙碌时间仍为 6，利用率 = 6 ÷ 7 × 100% ≈ 85.71%。','本题与第 3 题相同，因为 SWITCH_ON_IO 就是默认的切换规则。']]
  ], result:'7 个时间单位 · CPU 利用率 85.71%', conclusion:[['切换后的结果','总时间为 7，CPU 利用率为 85.71%。'],['资源重叠的原因','进程 0 等待 I/O 时，进程 1 使用 CPU 计算。五个 I/O 服务时间单位中的四个与计算重叠。'],['与不切换规则的区别','减少的是 CPU 空闲和总时间，不是需要执行的 CPU 工作量。']]},
  {title:'I/O 完成后延后运行', topic:'完成后的选择 · IO_RUN_LATER', question:'进程 0 连续发起三次 I/O，其他三个进程各执行五条计算指令。I/O 完成后不立即运行进程 0，资源利用情况如何？', input:'3:0,5:100,5:100,5:100', flags:'-S SWITCH_ON_IO -I IO_RUN_LATER', steps:[
    ['先确定第一次 I/O 与计算的重叠',['时间 1：进程 0 发起第一次 I/O。','时间 2–6：进程 1 执行五次计算，I/O 同时接受服务。']],
    ['区分 I/O 完成与进程实际运行',['第一次 I/O 在时间 7 完成，进程 0 恢复就绪。','IO_RUN_LATER 没有优先运行进程 0；时间 7–16 由进程 2、3 依次完成计算。','直到时间 17，进程 0 才执行 io_done；时间 18 才发起第二次 I/O。']],
    ['分别推演后两次 I/O，再统计时间',['第二次请求：时间 18 发起，时间 19–23 接受服务，时间 24 完成并执行 io_done。','第三次请求：时间 25 发起，时间 26–30 接受服务，时间 31 完成并执行 io_done。','CPU 忙碌时间 = 十五次计算 + 三次发起 + 三次完成处理 = 21。','总时间 = 31，CPU 空闲 = 31 − 21 = 10，利用率 = 21 ÷ 31 × 100% ≈ 67.74%。']]
  ], result:'31 个时间单位 · CPU 利用率 67.74%', conclusion:[['资源利用结果','总时间为 31，CPU 忙碌 21、空闲 10，利用率为 67.74%。'],['后两次 I/O 没有重叠的原因','进程 0 延后获得 CPU，第二次请求直到时间 18 才发起。此时三个计算进程都已完成，后两次 I/O 服务期间 CPU 只能空闲。'],['完成事件与完成处理','时间 7 的 I/O 完成不等于执行 io_done；进程 0 必须重新获得 CPU，才能处理完成事件并发起下一次请求。']]},
  {title:'I/O 完成后立即运行', topic:'完成后的选择 · IO_RUN_IMMEDIATE', question:'将第 6 题的完成规则改为 IO_RUN_IMMEDIATE。为什么尽早运行刚完成 I/O 的进程可能改善资源利用？', input:'3:0,5:100,5:100,5:100', flags:'-S SWITCH_ON_IO -I IO_RUN_IMMEDIATE', steps:[
    ['完成第一次 I/O 后尽早发起第二次',['时间 7：进程 0 立即获得 CPU，执行 io_done。','时间 8：进程 0 发起第二次 I/O；它再次阻塞后，计算进程继续使用 CPU。']],
    ['按请求列出后续关键时刻',['第二次请求：时间 8 发起，时间 9–13 接受服务，时间 14 完成并处理。','第三次请求：时间 15 发起，时间 16–20 接受服务，时间 21 完成并处理。','I/O 服务时，其他尚未完成的进程继续计算。']],
    ['核对工作量和利用率',['CPU 动作 = 十五次计算 + 三次发起 + 三次完成处理 = 21。','此次时间 1–21 每行都有 CPU 动作，总时间为 21，空闲时间为 0。','CPU 利用率 = 21 ÷ 21 × 100% = 100%。']]
  ], result:'21 个时间单位 · CPU 利用率 100%', conclusion:[['与延后运行的结果比较','总时间由 31 降为 21，CPU 空闲由 10 降为 0；CPU 工作量仍为 21。'],['缩短时间的原因','进程 0 及时处理完成事件，并紧接着发起下一次 I/O，使后续服务也能与其他进程的计算重叠。'],['本题结果的条件','这里进程 0 在完成处理后会继续发起 I/O，其他进程也有计算可做。换成其他指令序列，立即运行不一定缩短总时间。']]},
  {title:'固定随机序列，推演四种规则', topic:'随机指令 · 种子 1、2、3', question:'两个进程各生成三个操作，计算概率为 50%。分别使用种子 1、2、3，预测轨迹，并考察两种切换规则与两种完成规则的影响。', input:'3:50,3:50', flags:'-s 1', steps:[
    ['先固定每个进程的指令序列',['分别用种子 1、2、3 查看指令列表，逐进程记录实际生成的计算与 I/O 顺序。','3:50 表示生成三个基本操作，每个操作为计算的概率是 50%；不保证计算与 I/O 数量相等。','每个 I/O 请求另附加一个 io_done 动作，也要列入推演。']],
    ['将 CPU 选择和 I/O 事件分别推演',['从进程 0 开始，每个时间单位至多执行一个 CPU 动作；没有进程运行时，记录 CPU 空闲。','发起 I/O 后，记录五个服务时间单位及其后的完成事件。I/O 完成与执行 io_done 可以不在同一行。','阻塞时，依据 -S 决定是否选择其他就绪进程；I/O 完成时，依据 -I 决定是否优先运行完成者。']],
    ['保持种子不变，比较四种规则',['同一种子分别使用两种 -S 与两种 -I，组成四种运行条件。先确认各条件的指令序列相同。','逐项比较 I/O 发起时刻、I/O 完成时刻、io_done 的执行时刻和 CPU 空闲区间。','最后比较总时间与利用率。总时间相同，不代表每个进程的执行轨迹也相同。']]
  ], result:'相同种子保持指令序列不变', conclusion:[['阻塞后的选择','-S 决定当前进程阻塞后，是否选择其他就绪进程使用 CPU。'],['I/O 完成后的选择','-I 决定恢复就绪的进程是否优先获得 CPU，进而影响下一条指令的执行时刻。'],['比较规则的前提','保持种子和输入相同，只改变规则；否则生成的工作量与指令顺序也可能变化，不能把差异只归因于调度规则。']]},
];
const practiceEscape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const practiceCommand = command => `<div class="practice-command"><pre><code>${command.split(' ').map(argument => `<span class="practice-command-argument">${practiceEscape(argument)}</span>`).join(' ')}</code></pre><button type="button" data-practice-copy aria-label="复制命令" title="复制命令"><span class="practice-copy-icon" aria-hidden="true"></span></button></div>`;
const practiceStats = trace => {
  const total = Number(trace.match(/总时间 (\d+)/)[1]);
  const cpu = trace.match(/CPU 忙碌 (\d+)（([\d.]+)%）/);
  const io = trace.match(/IO 忙碌\s+(\d+)（([\d.]+)%）/);
  return {total, cpuBusy:Number(cpu[1]), cpuRate:cpu[2], ioBusy:Number(io[1]), ioRate:io[2]};
};
const practiceTimeline = trace => {
  const processCount = (trace.split('\n')[0].match(/PID:/g) || []).length;
  const rows = trace.split('\n').filter(line => /^\s*\d+\*?\s/.test(line)).map(line => {
    const tokens = line.trim().split(/\s+/);
    const states = tokens.slice(1, processCount + 1);
    const pid = states.findIndex(state => state.startsWith('RUN:'));
    return {time:parseInt(tokens[0], 10), pid, action:pid < 0 ? 'idle' : states[pid].slice(4), io:Number(tokens[processCount + 1 + (pid < 0 ? 0 : 1)] || 0), completed:tokens[0].endsWith('*')};
  });
  const actionNames = {cpu:'计算', io:'发起 I/O', io_done:'完成处理', idle:'CPU 空闲'};
  const stats = practiceStats(trace);
  return `<figure class="practice-timeline"><figcaption>CPU 动作与 I/O 服务</figcaption><div class="practice-timeline-scroll" tabindex="0" role="region" aria-label="按模拟时间排列的 CPU 与 I/O 轨迹"><div class="practice-timeline-grid" style="--practice-time:${rows.length}"><span class="practice-lane-label">时间</span>${rows.map(row => `<span class="practice-time">${row.time}${row.completed ? '*' : ''}</span>`).join('')}<span class="practice-lane-label">CPU</span>${rows.map(row => `<span class="practice-cell practice-${row.action}" title="时间 ${row.time}：${row.pid < 0 ? '' : `进程 ${row.pid}，`}${actionNames[row.action]}" aria-label="时间 ${row.time}：${row.pid < 0 ? '' : `进程 ${row.pid}，`}${actionNames[row.action]}">${row.pid < 0 ? '–' : row.pid}</span>`).join('')}<span class="practice-lane-label">I/O</span>${rows.map(row => `<span class="practice-cell ${row.io > 0 ? 'practice-service' : 'practice-no-service'}" title="时间 ${row.time}：${row.io} 个 I/O 请求正在服务" aria-label="时间 ${row.time}：${row.io} 个 I/O 请求正在服务">${row.io || '–'}</span>`).join('')}</div></div><div class="practice-legend"><span class="practice-cpu">计算</span><span class="practice-io">发起</span><span class="practice-io_done">完成处理</span><span class="practice-idle">空闲</span></div><p class="practice-timeline-note">CPU 行的数字是进程编号；I/O 行的数字是正在服务的请求数。* 表示 I/O 完成事件。</p><dl class="practice-stats"><div><dt>总时间</dt><dd>${stats.total}<small> 时间单位</small></dd></div><div><dt>CPU 利用率</dt><dd>${stats.cpuRate}<small>%</small></dd></div><div><dt>CPU 空闲</dt><dd>${stats.total - stats.cpuBusy}<small> 时间单位</small></dd></div></dl></figure>`;
};
const practiceRandomControls = `<div class="practice-random-controls"><div class="practice-seeds" role="group" aria-label="随机种子">${[1,2,3].map(seed => `<button type="button" data-practice-seed="${seed}" aria-pressed="${seed === 1}">种子 ${seed}</button>`).join('')}</div><div class="practice-rule-selects"><label>阻塞后切换 <select id="practice-switch"><option value="SWITCH_ON_IO">SWITCH_ON_IO</option><option value="SWITCH_ON_END">SWITCH_ON_END</option></select></label><label>I/O 完成后运行 <select id="practice-completion"><option value="IO_RUN_LATER">IO_RUN_LATER</option><option value="IO_RUN_IMMEDIATE">IO_RUN_IMMEDIATE</option></select></label></div></div>`;
const renderPractice = (exercise, index) => {
  const random = index === 7;
  const trace = random ? PROCESS_RANDOM_PRACTICE[0].traces[0] : PROCESS_PRACTICE_TRACES[index];
  return `<article class="practice-exercise" id="exercise-${index + 1}" aria-labelledby="exercise-title-${index + 1}">
    <header class="practice-exercise-heading"><span class="practice-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><p class="practice-topic">${exercise.topic}</p><h2 id="exercise-title-${index + 1}">${exercise.title}</h2></div></header>
    <p class="practice-question">${exercise.question}</p>
    ${random ? practiceRandomControls : ''}
    <div class="practice-body">
      <section class="practice-run" aria-label="第 ${index + 1} 题运行命令"><h3>运行与核对</h3><div ${random ? 'id="practice-random-commands"' : ''}>${practiceCommand(`python3 process-run.py -l ${exercise.input} ${exercise.flags || ''}`.trim())}${practiceCommand(`python3 process-run.py -l ${exercise.input} ${exercise.flags || ''} -c -p`.replace(/ +/g, ' '))}</div>
        ${random ? '<dl class="practice-instructions" id="practice-random-instructions"></dl>' : ''}
        <div ${random ? 'id="practice-random-timeline"' : ''}>${practiceTimeline(trace)}</div>
        <details class="practice-trace"><summary>完整运行输出</summary><pre><code data-practice-trace="${index + 1}">${practiceEscape(trace)}</code></pre></details>
      </section>
      <section class="practice-reasoning" aria-label="第 ${index + 1} 题解题过程"><h3>解题过程</h3><ol>${exercise.steps.map(([title, lines], step) => `<li><span class="practice-step">${step + 1}</span><div><h4>${title}</h4><div class="practice-step-lines">${lines.map(text => `<p>${practiceEscape(text)}</p>`).join('')}</div></div></li>`).join('')}</ol><div class="practice-conclusion"><h4>结果与原因</h4><dl class="practice-conclusion-items">${exercise.conclusion.map(([title,text]) => `<div><dt>${practiceEscape(title)}</dt><dd>${practiceEscape(text)}</dd></div>`).join('')}</dl></div>${random ? '<div class="practice-seed-explanation"><h4>当前种子的规则比较</h4><dl id="practice-random-explanation" class="practice-conclusion-items" aria-live="polite"></dl></div>' : ''}</section>
    </div>
    ${random ? '<div id="practice-random-results"></div>' : ''}
    <nav class="practice-exercise-nav" aria-label="练习间导航">${index > 0 ? `<a href="#exercise-${index}">上一题：${processPractice[index - 1].title}</a>` : '<a href="#questions">练习目录</a>'}${index < 7 ? `<a href="#exercise-${index + 2}">下一题：${processPractice[index + 1].title}</a>` : '<a href="#parameters">程序说明与参数</a>'}</nav>
  </article>`;
};

const homeworkHeader = wikiHeader('process', [
  {href: '#questions', title: '模拟练习'},
  {href: '#parameters', title: '参数'},
  {href: '#output', title: '输出'},
]);

document.querySelector('#root').innerHTML = `
  <div class="page hw-page api-hw-page process-practice-page" id="top">
    ${homeworkHeader}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 进程 / 作业</p>
        <h1 id="page-title">进程作业 <span>Process Homework</span></h1>
        <p class="lead">从纯计算到 I/O 调度，逐步推演进程状态、CPU 空闲与计算和 I/O 的重叠。</p>
        <dl class="hw-meta"><div><dt>运行环境</dt><dd>Ubuntu 22.04 · Python 3</dd></div><div><dt>依赖</dt><dd>Python 标准库</dd></div></dl>
        <p class="hw-back"><a class="inline-link" href="index.html">进程：状态转换与上下文切换</a></p>
      </section>

      <div class="practice-tabs" role="tablist" aria-label="进程作业内容">
        <button type="button" id="practice-tab" role="tab" aria-controls="practice-view" aria-selected="true">模拟练习</button>
        <button type="button" id="program-tab" role="tab" aria-controls="program-view" aria-selected="false" tabindex="-1">程序说明与参数</button>
      </div>
      <div id="practice-view" role="tabpanel" aria-labelledby="practice-tab" tabindex="0">
      <nav class="practice-index" aria-label="模拟练习目录">${processPractice.map((exercise, index) => `<a href="#exercise-${index + 1}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${exercise.title}</strong></a>`).join('')}</nav>
      <section id="questions" aria-labelledby="practice-title">
        <div class="practice-section-heading"><p class="eyebrow">HOMEWORK / SIMULATION</p><h2 id="practice-title">进程运行与 I/O：八道模拟练习</h2><p>共同条件：单核 CPU，切换开销取零；每次 I/O 服务为五个时间单位。发起 I/O 与执行 <code>io_done</code> 各占用一个 CPU 时间单位。不同进程的 I/O 请求可以同时接受服务；时间单位是模拟计数，不是实测秒数。</p></div>
        <div class="practice-setup"><h3>进入脚本目录</h3>${practiceCommand('cd ~/ostep-homework/cpu-intro')}<p><code>-l X:Y</code> 中，X 是操作数量，Y 是生成计算操作的概率（百分比）。<code>-c</code> 显示轨迹，<code>-p</code> 显示统计。<a class="inline-link" href="#parameters">参数与规则</a> · <a class="inline-link" href="#output">状态与输出含义</a></p></div>
        ${processPractice.map(renderPractice).join('')}
      </section>
      </div>
      <div id="program-view" role="tabpanel" aria-labelledby="program-tab" tabindex="0" hidden>
      <section class="hw-section" id="parameters" aria-labelledby="parameters-title">
        <div class="api-hw-section-heading"><p class="section-index">01 / PARAMETERS</p><h2 id="parameters-title">运行命令与参数</h2></div>
        <p><code>process-run.py</code> 根据一组模拟指令计算进程如何运行：每个进程执行计算指令，或发起 I/O 并等待完成。输入给出各进程的指令组成，输出给出它们的状态、CPU 动作和 I/O 服务情况，时间是脚本计算的模拟时间。</p>
        <p>程序来自 <a class="inline-link" href="https://github.com/remzi-arpacidusseau/ostep-homework/tree/master/cpu-intro" target="_blank" rel="noopener noreferrer">OSTEP cpu-intro</a>，使用这个固定版本的 <a class="inline-link" href="https://raw.githubusercontent.com/remzi-arpacidusseau/ostep-homework/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-intro/process-run.py" target="_blank" rel="noopener noreferrer">process-run.py</a>。就绪（READY）表示进程能运行但还未获得 CPU；阻塞（BLOCKED）表示进程在等待 I/O；完成（DONE）表示全部指令已执行完。</p>
        <h3>输入指令与计算轨迹</h3>
        <p>两条命令使用同一进程输入。不加 <code>-c</code> 时，程序列出生成的指令和调度规则；加 <code>-c</code> 计算逐时刻的执行轨迹，另加 <code>-p</code> 才在末尾显示总时间和利用率。</p>
        <pre><code>python3 process-run.py -l 5:100,5:100\npython3 process-run.py -l 5:100,5:100 -c -p</code></pre>
        <h3>进程描述格式 <code>-l X:Y</code></h3>
        <dl class="hw-argument-parts">
          <div><dt><code>X</code> 操作数量</dt><dd>计算指令和 I/O 请求的总数。</dd></div>
          <div><dt><code>Y</code> 计算概率</dt><dd>每个操作被生成为计算指令的概率，单位为百分比；否则生成 I/O 请求。</dd></div>
        </dl>
        <p>逗号分隔不同进程，进程编号按输入顺序从 0 开始。例如 <code>-l 4:100,1:0</code> 表示进程 0 执行四条计算指令，进程 1 发起一次 I/O。每次 I/O 还会自动添加一条 <code>io_done</code> 完成处理指令，不计入 X。</p>
        <h3>参数示例</h3>
        <dl class="hw-argument-examples">
          <div><dt><code>5:100</code></dt><dd><strong>全部为计算</strong><p>生成五个基本操作，计算概率为 100%，因此得到五条计算指令。</p></dd></div>
          <div><dt><code>3:0</code></dt><dd><strong>全部为 I/O 请求</strong><p>生成三个基本操作，计算概率为 0%，因此发起三次 I/O。每次请求还附加一个占用 CPU 的完成处理动作。</p></dd></div>
          <div><dt><code>3:50</code></dt><dd><strong>计算与 I/O 按概率生成</strong><p>生成三个基本操作，每个操作有 50% 概率为计算、50% 概率为 I/O 请求。实际数量由生成结果决定，不要求两类操作数量相等。</p></dd></div>
        </dl>
        <div class="hw-table-wrap"><table class="hw-table"><caption>命令行参数及默认值</caption><thead><tr><th scope="col">参数</th><th scope="col">含义</th><th scope="col">默认值</th></tr></thead><tbody>
          <tr><th scope="row"><code>-l</code></th><td>以逗号分隔多个进程，例如 <code>5:100,3:0</code>。</td><td>需要提供进程描述</td></tr>
          <tr><th scope="row"><code>-L</code></th><td>一次 I/O 服务持续的模拟时间单位。</td><td>5</td></tr>
          <tr><th scope="row"><code>-s</code></th><td>生成指令序列的随机种子；相同版本和参数可复现同一序列。</td><td>0</td></tr>
          <tr><th scope="row"><code>-S</code></th><td>当前进程发起 I/O 时，是否切换到其他就绪进程。</td><td><code>SWITCH_ON_IO</code></td></tr>
          <tr><th scope="row"><code>-I</code></th><td>I/O 完成后，是否立即选择刚恢复就绪的进程。</td><td><code>IO_RUN_LATER</code></td></tr>
          <tr><th scope="row"><code>-c</code></th><td>计算并输出执行记录。</td><td>关闭</td></tr>
          <tr><th scope="row"><code>-p</code></th><td>输出统计信息，与 <code>-c</code> 一起使用。</td><td>关闭</td></tr>
          <tr><th scope="row"><code>-P</code></th><td>显式指定程序，例如 <code>c3,i,c2:c4</code>：冒号分隔进程，<code>cN</code> 是 N 次计算，<code>i</code> 是一次 I/O。</td><td>未指定，使用 <code>-l</code></td></tr>
        </tbody></table></div>
        <h3>显式指定指令 <code>-P</code></h3>
        <p><code>-l</code> 按概率生成指令；<code>-P</code> 直接给出顺序。<code>c3,i,c2:c4</code> 中，冒号分隔进程：进程 0 计算三次、发起 I/O、再计算两次，进程 1 计算四次。逗号分隔同一进程内的动作；使用 <code>-P</code> 时，<code>-l</code> 不参与输入。</p>
        <h3>切换与 I/O 完成后的调度</h3>
        <dl class="hw-rules">
          <div><dt><code>SWITCH_ON_IO</code></dt><dd>进程发起 I/O 后阻塞，其他就绪进程可以获得 CPU；当前进程完成时也会切换。</dd></div>
          <div><dt><code>SWITCH_ON_END</code></dt><dd>发起 I/O 后不切换到其他就绪进程，CPU 可能在等待期间空闲；完成事件后的选择还受 <code>-I</code> 控制。</dd></div>
          <div><dt><code>IO_RUN_LATER</code></dt><dd>I/O 完成后恢复就绪，通常不打断另一正在运行的进程。如果只有它可运行，就立即运行它；在 SWITCH_ON_END 下，也会选择这个完成 I/O 的进程继续运行。</dd></div>
          <div><dt><code>IO_RUN_IMMEDIATE</code></dt><dd>I/O 完成后优先选择该进程；若另一个进程正在运行，它会回到就绪状态。</dd></div>
        </dl>
      </section>

      <section class="hw-section" id="output" aria-labelledby="output-title">
        <div class="api-hw-section-heading"><p class="section-index">02 / TRACE</p><h2 id="output-title">运行结果与状态含义</h2></div>
        <p>每行对应一个模拟时间单位。<code>RUN:cpu</code> 表示计算，<code>RUN:io</code> 表示发起 I/O，<code>RUN:io_done</code> 表示处理 I/O 完成。三者都计入 CPU 忙碌时间。阻塞表示进程正在等待 I/O 完成，暂时不能执行 CPU 指令。</p>
        <p>时间后的 <code>*</code> 表示该时刻发生 I/O 完成事件。CPU 列的 <code>1</code> 表示本时间单位执行了一个 CPU 动作；I/O 列是仍在服务的请求数量，不是进程编号。</p>
        <p><code>*</code> 与 <code>RUN:io_done</code> 可以出现在不同的时间行：前者表示 I/O 已完成，后者表示该进程已获得 CPU 并执行完成处理。DONE 是完成状态，不是额外执行的一条指令。</p>
        <p>CPU 利用率是 CPU 忙碌时间占总时间的比例；I/O 利用率是至少有一个请求正在服务的时间占总时间的比例。计算与 I/O 可以同时进行，因此两项利用率不必相加等于 100%。</p>
        <details class="hw-fixed-example"><summary>纯计算示例</summary><p>单核、切换开销取零。两个进程各有五条计算指令，输入为 <code>5:100,5:100</code>。先执行进程 0 的五条指令，再执行进程 1 的五条指令；十个时间单位都有 CPU 动作，因此总时间为 10，CPU 利用率为 100%。</p></details>
        <pre><code>python3 process-run.py -l 3:0 -L 5 -c -p</code></pre>
        <pre class="api-hw-terminal" aria-label="程序运行输出"><code>时间        PID: 0           CPU            IO
  1         RUN:io             1
  2           阻塞                           1
  3           阻塞                           1
  4           阻塞                           1
  5           阻塞                           1
  6           阻塞                           1
  7*   RUN:io_done             1
  8         RUN:io             1
  9           阻塞                           1
 10           阻塞                           1
 11           阻塞                           1
 12           阻塞                           1
 13           阻塞                           1
 14*   RUN:io_done             1
 15         RUN:io             1
 16           阻塞                           1
 17           阻塞                           1
 18           阻塞                           1
 19           阻塞                           1
 20           阻塞                           1
 21*   RUN:io_done             1

统计：总时间 21
统计：CPU 忙碌 6（28.57%）
统计：IO 忙碌  15（71.43%）</code></pre>
        <p>三次 I/O 各需要五个服务时间单位，外加一次发起和一次完成处理，因此每次占七个时间单位。这里没有其他进程填补等待期间的 CPU 空闲。时间单位来自脚本计数，不是机器上的实际秒数。</p>
      </section>
      </div>

    </main>
    <footer><a href="index.html">返回进程知识页</a><a href="#top">回到页首 ↑</a></footer>
  </div>`;
document.title = '进程作业 Process Homework · OSLab';
const practiceTabs = [...document.querySelectorAll('.practice-tabs [role="tab"]')];
const selectPracticeView = panelId => {
  practiceTabs.forEach(tab => {
    const selected = tab.getAttribute('aria-controls') === panelId;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
};
const practiceAnchorView = hash => {
  const target = document.getElementById(hash.slice(1));
  const panel = target?.closest('[role="tabpanel"]');
  if (panel) selectPracticeView(panel.id);
  return target;
};
practiceTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    const panelId = tab.getAttribute('aria-controls');
    selectPracticeView(panelId);
    if (location.hash !== `#${panelId}`) history.pushState(null, '', `#${panelId}`);
  });
  tab.addEventListener('keydown', event => {
    const nextIndex = {ArrowRight:(index + 1) % practiceTabs.length, ArrowLeft:(index + practiceTabs.length - 1) % practiceTabs.length, Home:0, End:practiceTabs.length - 1}[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    practiceTabs[nextIndex].focus();
    practiceTabs[nextIndex].click();
  });
});
document.querySelector('#root').addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) practiceAnchorView(link.getAttribute('href'));
});
window.addEventListener('hashchange', () => {
  const target = practiceAnchorView(location.hash);
  if (target) target.scrollIntoView({behavior:'instant'});
});
practiceAnchorView(location.hash);
document.querySelector('#root').addEventListener('click', async event => {
  const button = event.target.closest('[data-practice-copy]');
  if (!button) return;
  const command = button.previousElementSibling.textContent;
  try {
    await navigator.clipboard.writeText(command);
    button.title = '已复制';
    button.setAttribute('aria-label', '已复制命令');
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(button.previousElementSibling);
    selection.removeAllRanges();
    selection.addRange(range);
    button.title = '命令已选中，可复制';
    button.setAttribute('aria-label', '命令已选中，可复制');
  }
});

let practiceSeed = 1;
const updateRandomPractice = () => {
  const record = PROCESS_RANDOM_PRACTICE.find(value => value.seed === practiceSeed);
  const switching = document.querySelector('#practice-switch').value;
  const completion = document.querySelector('#practice-completion').value;
  const ruleIndex = (switching === 'SWITCH_ON_END' ? 2 : 0) + (completion === 'IO_RUN_IMMEDIATE' ? 1 : 0);
  const command = `python3 process-run.py -s ${practiceSeed} -l 3:50,3:50 -S ${switching} -I ${completion}`;
  document.querySelector('#practice-random-commands').innerHTML = practiceCommand(command) + practiceCommand(`${command} -c -p`);
  document.querySelector('#practice-random-instructions').innerHTML = record.instructions.map((instructions, pid) => `<div><dt>进程 ${pid}</dt><dd>${instructions}</dd></div>`).join('');
  document.querySelector('#practice-random-timeline').innerHTML = practiceTimeline(record.traces[ruleIndex]);
  document.querySelector('[data-practice-trace="8"]').textContent = record.traces[ruleIndex];
  const stats = practiceStats(record.traces[ruleIndex]);
  const explanations = [['当前条件的结果', `${switching} / ${completion}：总时间 ${stats.total}；CPU 忙碌 ${stats.cpuBusy}、空闲 ${stats.total - stats.cpuBusy} 个时间单位，利用率 ${stats.cpuRate}%。`], ...record.explanation];
  document.querySelector('#practice-random-explanation').innerHTML = explanations.map(([title,text]) => `<div><dt>${practiceEscape(title)}</dt><dd>${practiceEscape(text)}</dd></div>`).join('');
  document.querySelectorAll('[data-practice-seed]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.practiceSeed) === practiceSeed)));
};
document.querySelectorAll('[data-practice-seed]').forEach(button => button.addEventListener('click', () => {
  practiceSeed = Number(button.dataset.practiceSeed);
  updateRandomPractice();
}));
document.querySelector('#practice-switch').addEventListener('change', updateRandomPractice);
document.querySelector('#practice-completion').addEventListener('change', updateRandomPractice);
document.querySelector('#practice-random-results').innerHTML = `<h3>三个种子的四种规则结果</h3><div class="practice-table-scroll" tabindex="0" role="region" aria-label="三个种子的规则结果表"><table><caption>各条件下的总时间和资源利用率</caption><thead><tr><th scope="col">种子</th><th scope="col">阻塞后</th><th scope="col">I/O 完成后</th><th scope="col">总时间</th><th scope="col">CPU 利用率</th><th scope="col">I/O 利用率</th></tr></thead><tbody>${PROCESS_RANDOM_PRACTICE.map(record => record.traces.map((trace, index) => {
  const stats = practiceStats(trace);
  return `<tr ${index === 0 ? 'class="practice-seed-start"' : ''}><th scope="row">${record.seed}</th><td>${index < 2 ? '切换' : '不切换'}</td><td>${index % 2 ? '立即运行' : '延后运行'}</td><td>${stats.total}</td><td>${stats.cpuRate}%</td><td>${stats.ioRate}%</td></tr>`;
}).join('')).join('')}</tbody></table></div><p>“切换 / 不切换”分别对应 SWITCH_ON_IO / SWITCH_ON_END；“立即 / 延后”分别对应 IO_RUN_IMMEDIATE / IO_RUN_LATER。I/O 利用率统计至少有一个请求正在服务的时间，不是把每个请求的服务时间简单相加。</p>`;
updateRandomPractice();