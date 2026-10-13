const DATA = {
  states: [
    {id: 'new', short: '新建', english: 'New', desc: '操作系统正在创建进程，包括建立进程控制块（PCB）和准备必要资源。PCB 用于记录进程信息。', reason: '创建尚未完成，进程还没有进入就绪队列，不能参与 CPU 分配。'},
    {id: 'ready', short: '就绪', english: 'Ready', desc: '进程已具备运行条件，正在就绪队列中等待 CPU。调度器选中它后，进程才能开始运行。', reason: '就绪进程等待 CPU；阻塞进程等待 I/O 等事件完成。只有具备运行条件的进程才能参与调度。'},
    {id: 'running', short: '运行', english: 'Running', desc: '进程正在使用 CPU 执行指令。在这个单核示例中，同一时刻最多运行一个进程。', reason: '如果进程被抢占，它会回到就绪状态；如果当前操作需要等待 I/O 完成，它会进入阻塞状态。'},
    {id: 'blocked', short: '阻塞', english: 'Blocked', desc: '进程正在等待 I/O 等事件完成。在等待条件满足前，进程不能继续执行当前被阻塞的操作。', reason: 'I/O 完成后，进程重新具备运行条件，先回到就绪状态。只有再次获得 CPU 后，它才能继续执行。'},
    {id: 'terminated', short: '终止', english: 'Terminated', desc: '进程已执行结束，或被外部终止。操作系统随后回收相关资源。', reason: '终止的进程不会再次进入就绪队列。再次启动程序会创建新的进程。'},
  ],
  transitions: [
    {from: 'new', to: 'ready', label: '创建完成', desc: '操作系统已完成创建并准备好必要资源。进程进入就绪队列，等待 CPU。'},
    {from: 'ready', to: 'running', label: '调度', desc: '调度器从就绪队列中选择一个进程，为它分配 CPU。被选中的进程转入运行状态。'},
    {from: 'running', to: 'ready', label: '抢占', desc: '抢占是操作系统在进程尚未完成当前 CPU 工作时，暂停它的执行并重新分配 CPU。时间片耗尽是一个可能的触发条件；被抢占的进程仍具备运行条件，因此回到就绪队列。'},
    {from: 'running', to: 'blocked', label: '等待 I/O', desc: '进程发起 I/O 请求，且当前操作需要等待请求完成。进程因此转入阻塞状态，不再占用 CPU。'},
    {from: 'blocked', to: 'ready', label: 'I/O 完成', desc: '进程等待的 I/O 已完成。操作系统将进程转回就绪状态，等待调度器再次为它分配 CPU。'},
    {from: 'running', to: 'terminated', label: '执行结束', desc: '文件读取示例中的进程完成任务并退出，从运行转入终止状态。实际系统也可以终止处于其他状态的进程。'},
  ],
  pcb: [
    {field: '进程标识', english: 'PID', value: '进程编号', desc: '操作系统用 PID 区分当前的进程。执行同一份程序的不同进程也有不同的 PID。'},
    {field: '进程状态', english: 'State', value: '新建、就绪、运行、阻塞或终止', desc: '记录进程当前的运行条件，供操作系统判断它能否参与 CPU 分配。'},
    {field: '程序计数器', english: 'PC', value: '下一条待执行指令的地址', desc: '记录继续执行时所需的指令位置。恢复这个值后，CPU 才能从对应位置继续执行。'},
    {field: '寄存器现场', english: 'Registers', value: '切换时保存的 CPU 寄存器值', desc: '保存暂停时的计算状态，与程序计数器一起用于恢复执行。'},
    {field: '内存管理信息', english: 'Memory', value: '地址空间、页表等相关信息', desc: '操作系统依据这些信息管理进程内存。地址转换和访问保护还需要硬件参与。'},
    {field: '打开文件信息', english: 'Files', value: '文件描述符及相关引用', desc: '文件描述符是进程访问已打开文件的编号。相关引用记录编号所对应的文件或 I/O 资源。'},
  ],
  story: [
    {state: 'new', title: '创建进程', desc: '操作系统为这次执行建立进程控制块（PCB），用于记录进程信息，并准备必要资源。'},
    {state: 'ready', title: '进入就绪队列', edge: 0, desc: '资源已经准备完成。进程进入就绪队列，但还没有获得 CPU，因此尚未开始执行指令。'},
    {state: 'running', title: '获得 CPU', edge: 1, desc: '调度器为这个进程分配 CPU。进程转入运行状态，开始执行指令。'},
    {state: 'blocked', title: '等待读取', edge: 3, desc: '进程请求读取文件，但所需数据尚未返回。进程进入阻塞状态，等待读取完成；CPU 可以执行其他就绪进程。'},
    {state: 'ready', title: '读取完成', edge: 4, desc: '所请求的数据已经返回，进程重新具备运行条件。操作系统将它放回就绪队列；即使 CPU 空闲，也需要经过调度才能继续运行。'},
    {state: 'running', title: '继续执行', edge: 1, desc: '调度器再次为这个进程分配 CPU。操作系统恢复之前保存的程序计数器和寄存器值，进程继续处理已读取的数据。'},
    {state: 'terminated', title: '完成退出', edge: 5, desc: '进程已完成文件读取和后续处理，随后退出。操作系统开始回收这个进程的相关资源。'},
  ],
};

const DIAGRAMS = {
  desktop: {
    box: '0 0 740 370',
    nodes: [[70, 165], [250, 165], [470, 165], [470, 305], [670, 165]],
    paths: ['M110 165 H210', 'M290 165 H430', 'M442 137 Q360 35 278 137', 'M470 205 V265', 'M430 305 H250 V205', 'M510 165 H630'],
    labels: [[160, 140], [360, 140], [360, 72], [530, 241], [322, 289], [570, 140]],
  },
  mobile: {
    box: '0 0 360 480',
    nodes: [[95, 60], [95, 195], [245, 195], [95, 350], [245, 430]],
    paths: ['M95 100 V155', 'M135 195 H205', 'M221 164 Q170 105 119 164', 'M245 235 V350 H135', 'M95 310 V235', 'M271 168 H322 V430 H285'],
    labels: [[44, 132], [170, 183], [170, 130], [200, 374], [154, 280], [282, 145]],
  },
};

function stateDiagramSvg(layout) {
  const diagram = DIAGRAMS[layout];
  const edges = DATA.transitions.map((transition, index) => {
    const [labelX, labelY] = diagram.labels[index];
    const labelWidth = transition.label.length * 18 + 16;
    return `<g class="diagram-edge" data-edge="${index}" role="button" tabindex="0" aria-pressed="false" aria-label="${DATA.states.find(state => state.id === transition.from).short}到${DATA.states.find(state => state.id === transition.to).short}：${transition.label}">
      <path class="edge-hit" d="${diagram.paths[index]}"></path>
      <path class="edge-line" d="${diagram.paths[index]}" marker-end="url(#arrow-${layout})"></path>
      <rect class="edge-label-bg" x="${labelX - labelWidth / 2}" y="${labelY - 17}" width="${labelWidth}" height="26" rx="3"></rect>
      <text class="edge-label" x="${labelX}" y="${labelY}" text-anchor="middle">${transition.label}</text>
    </g>`;
  }).join('');
  const nodes = DATA.states.map((state, index) => {
    const [nodeX, nodeY] = diagram.nodes[index];
    return `<g class="diagram-node" data-state="${state.id}" role="button" tabindex="0" aria-pressed="${state.id === 'ready'}" aria-label="${state.short} ${state.english}">
      <circle cx="${nodeX}" cy="${nodeY}" r="36"></circle>
      <text class="node-label" x="${nodeX}" y="${nodeY - 1}" text-anchor="middle">${state.short}</text>
      <text class="node-english" x="${nodeX}" y="${nodeY + 18}" text-anchor="middle">${state.english}</text>
    </g>`;
  }).join('');
  return `<svg class="diagram diagram-${layout}" viewBox="${diagram.box}" role="group" aria-label="进程状态转换图">
    <defs><marker id="arrow-${layout}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8 Z" fill="context-stroke"></path></marker></defs>
    ${edges}${nodes}
  </svg>`;
}

function renderProcessPage(root) {
  root.innerHTML = `
    <div class="page process-page" id="top">
      ${wikiHeader('process', [{href: '#states', title: '状态变化'}, {href: '#pcb', title: '保存与恢复'}, {href: '#related', title: '进一步理解'}, {href: '#practice', title: '参考实践'}])}
      <main>
        <section class="intro" aria-labelledby="page-title">
          <p class="eyebrow">CPU 虚拟化 / 进程</p>
          <h1 id="page-title">进程 <span>Process</span></h1>
          <p class="lead">进程是程序的一次执行。</p>
          <p class="definition">程序包含指令和相关数据，同一份程序可以由多个进程执行。操作系统分别记录每个进程的标识、执行位置、计算状态和所需资源。</p>
        </section>

        <section class="state-section" id="states" aria-labelledby="states-title">
          <div class="section-heading"><div><p class="section-index">01 / 状态变化</p><h2 id="states-title">一个进程读文件时，状态怎样变化？</h2></div></div>
          <p class="section-description">本例采用单核 CPU，以进程为调度对象。文件读取属于输入/输出（I/O），本次读取需要等待数据返回。</p>
          <div class="story">
            <div class="story-heading"><h3>从创建到读取完成，再退出</h3><div class="process-story-controls" role="group" aria-label="文件读取步骤控制"><button type="button" id="process-story-prev">上一步</button><button type="button" id="process-story-next">下一步</button><button type="button" id="process-story-return" hidden>从头查看读取过程</button></div></div>
            <div class="story-sequence-scroll" role="region" aria-label="文件读取步骤" tabindex="0"><ol class="story-steps">${DATA.story.map((step, index) => `<li><button type="button" data-step="${index}" aria-pressed="false"><span class="step-number">${String(index + 1).padStart(2, '0')}</span><span class="step-title">${step.title}</span><span class="step-state">${DATA.states.find(state => state.id === step.state).short}</span></button></li>`).join('')}</ol></div>
          </div>
          <div class="state-workbench">
            <aside class="state-detail" aria-label="当前步骤或状态说明" aria-live="polite" aria-atomic="true"></aside>
            <div class="diagram-surface">${stateDiagramSvg('desktop')}${stateDiagramSvg('mobile')}<p class="diagram-caption">五种基本状态的主要转换</p></div>
          </div>
          <p class="process-state-summary">就绪：已具备运行条件，等待 CPU。阻塞：等待 I/O 等事件完成；条件满足后先回到就绪，再经调度继续运行。</p>
        </section>

        <section class="pcb-section" id="pcb" aria-labelledby="pcb-title">
          <div class="section-heading"><div><p class="section-index">02 / 保存与恢复</p><h2 id="pcb-title">进程暂停后，靠什么继续执行？</h2></div></div>
          <p class="section-description">进程控制块（PCB）是 OS 记录进程信息的数据结构。进程暂停时，保存的执行现场记录了执行位置和计算状态。</p>
          <dl class="process-context"><div><dt>执行到哪里？</dt><dd>程序计数器（PC）<span>下一条待执行指令的地址</span></dd></div><div><dt>计算到什么状态？</dt><dd>寄存器现场<span>暂停时的 CPU 寄存器值</span></dd></div></dl>
          <p class="section-description" id="context-switch">上下文切换先保存当前进程的现场，再恢复另一个进程的现场。之前的进程再次获得 CPU 时，才能从保存的位置继续执行。</p>
          <details class="process-reference"><summary>查看 PCB 的完整字段说明</summary><div class="pcb-reference-scroll" role="region" aria-label="PCB 典型字段" tabindex="0"><table class="pcb-table"><caption>PCB 中的典型信息，具体组织随操作系统实现而异</caption><thead><tr><th scope="col">字段</th><th scope="col">保存什么</th><th scope="col">为什么需要</th></tr></thead><tbody>${DATA.pcb.map(row => `<tr><th scope="row">${row.field}<span>${row.english}</span></th><td>${row.value}</td><td>${row.desc}</td></tr>`).join('')}</tbody></table></div></details>
        </section>

        <section class="related-section" id="related" aria-labelledby="related-title">
          <div class="section-heading"><div><p class="section-index">03 / 延伸概念</p><h2 id="related-title">进一步理解</h2></div></div>
          <details class="process-reference" id="thread"><summary>进程与线程有什么区别？</summary><p>线程是进程内的执行流。同一进程的线程通常共享地址空间，但各自保存程序计数器和寄存器值。现代系统通常以线程为调度单位，本页的单核示例以进程为调度对象。</p></details>
          <details class="process-reference" id="scheduling"><summary>调度怎样决定谁获得 CPU？</summary><p>调度从就绪的执行对象中选择一个，并为它分配 CPU。<a class="inline-link" href="${WIKI_PAGES.roundRobin.href}">时间片轮转</a>按就绪队列顺序分配 CPU；时间片耗尽时，未完成的进程回到队尾。</p></details>
          <details class="process-reference" id="virtual-memory"><summary>进程的地址空间与物理内存是什么关系？</summary><p>虚拟地址是进程使用的地址，虚拟地址空间是这些地址的集合。<a class="inline-link" href="${WIKI_PAGES.paging.href}">分页地址转换</a>根据映射关系得到物理地址。操作系统管理映射和访问权限，硬件在访问时执行相应检查。</p></details>
        </section>
        <section class="related-section" id="practice" aria-labelledby="process-practice-title"><div class="section-heading"><div><p class="section-index">04 / 参考实践</p><h2 id="process-practice-title">用运行记录对照进程状态</h2></div></div><p class="process-homework-link"><a class="inline-link" href="process-homework.html">进程作业：计算与 I/O 等待</a></p><p class="process-homework-link"><a class="inline-link" href="cpu-virtualization-experiments.html">CPU 虚拟化实验：观察进程与 CPU 共享</a></p></section>
        ${wikiRelated('process')}
      </main>
      <footer><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
    </div>`;

  const detail = root.querySelector('.state-detail');
  let currentStory = 0;
  const select = (stateId, edgeIndex, storyIndex) => {
    root.querySelectorAll('[data-state]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.state === stateId)));
    root.querySelectorAll('[data-edge]').forEach(edge => edge.setAttribute('aria-pressed', String(Number(edge.dataset.edge) === edgeIndex)));
    root.querySelectorAll('[data-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.step) === storyIndex)));
    const state = DATA.states.find(item => item.id === stateId);
    const transition = DATA.transitions[edgeIndex];
    const step = DATA.story[storyIndex];
    currentStory = step ? storyIndex : null;
    root.querySelector('#process-story-prev').disabled = currentStory === null || currentStory === 0;
    root.querySelector('#process-story-next').disabled = currentStory === null || currentStory === DATA.story.length - 1;
    root.querySelector('#process-story-return').hidden = currentStory !== null;
    if (step) {
      detail.innerHTML = `<p class="detail-kicker">文件读取 / 步骤 ${storyIndex + 1} / ${step.title}</p><h3>${state.short}</h3><p>${step.desc}</p>`;
    } else if (transition) {
      const from = DATA.states.find(item => item.id === transition.from);
      detail.innerHTML = `<p class="detail-kicker">状态转换 / ${transition.label}</p><h3>${from.short} → ${state.short}</h3><p>${transition.desc}</p><details class="process-reference"><summary>转入${state.short}后的相关说明</summary><p>${state.reason}</p></details>`;
    } else {
      detail.innerHTML = `<p class="detail-kicker">进程状态 / ${state.english}</p><h3>${state.short}</h3><p>${state.desc}</p><details class="process-reference"><summary>相关转换与限制</summary><p>${state.reason}</p></details>`;
    }
  };

  root.querySelectorAll('[data-state], [data-edge]').forEach(control => {
    const activate = () => {
      if (control.dataset.state) select(control.dataset.state);
      else {
        const edgeIndex = Number(control.dataset.edge);
        select(DATA.transitions[edgeIndex].to, edgeIndex);
      }
      if (matchMedia('(max-width: 1240px)').matches) detail.scrollIntoView({block: 'nearest'});
    };
    control.addEventListener('click', activate);
    control.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });
  root.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => {
      const storyIndex = Number(button.dataset.step);
      const step = DATA.story[storyIndex];
      select(step.state, step.edge, storyIndex);
    });
  });
  const selectStory = index => {
    const step = DATA.story[index];
    select(step.state, step.edge, index);
    const scroll = root.querySelector('.story-sequence-scroll');
    const button = root.querySelector(`[data-step="${index}"]`);
    if (button.offsetLeft < scroll.scrollLeft || button.offsetLeft + button.offsetWidth > scroll.scrollLeft + scroll.clientWidth) scroll.scrollLeft = button.offsetLeft;
  };
  root.querySelector('#process-story-prev').addEventListener('click', () => selectStory(currentStory - 1));
  root.querySelector('#process-story-next').addEventListener('click', () => selectStory(currentStory + 1));
  root.querySelector('#process-story-return').addEventListener('click', () => selectStory(0));
  selectStory(0);
}

renderProcessPage(document.getElementById('root'));


