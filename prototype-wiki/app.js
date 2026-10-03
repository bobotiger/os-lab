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
    {state: 'new', title: '创建进程', desc: '操作系统为这次程序执行创建进程，建立记录进程信息的 PCB，并准备必要资源。'},
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
    <div class="page" id="top">
      ${wikiHeader('process', [{href: '#states', title: '状态转换'}, {href: '#pcb', title: '进程控制块'}, {href: '#related', title: '关联概念'}])}
      <main>
        <section class="intro" aria-labelledby="page-title">
          <p class="eyebrow">CPU 虚拟化 / 进程</p>
          <h1 id="page-title">进程 <span>Process</span></h1>
          <p class="lead">进程是程序的一次执行。</p>
          <p class="definition">程序包含指令和相关数据。操作系统用进程管理程序的一次执行，包括所需资源和运行状态。同一份程序可以由多个进程执行；这些进程具有不同的标识，并分别记录执行位置和计算状态。</p>
          <p class="model-note">示例采用单核 CPU，以进程为调度对象，区分五种基本状态。现代系统通常以线程为调度单位。</p>
          <p class="process-homework-link"><a class="inline-link" href="process-homework.html">进程作业：process-run.py 使用说明与练习</a></p>
        </section>

        <section class="state-section" id="states" aria-labelledby="states-title">
          <div class="section-heading"><div><p class="section-index">01 / STATES</p><h2 id="states-title">进程状态与转换条件</h2></div><p>就绪等待 CPU；阻塞等待事件完成。</p></div>
          <p class="section-description">输入/输出（I/O）包括文件读取等操作。进程状态表示进程是否具备运行条件，以及是否正在使用 CPU。创建、调度、抢占和 I/O 完成都可能改变进程状态。</p>
          <div class="state-workbench">
            <div class="diagram-surface">${stateDiagramSvg('desktop')}${stateDiagramSvg('mobile')}<p class="diagram-caption">五种基本状态的主要转换</p></div>
            <aside class="state-detail" aria-label="状态与转换说明" aria-live="polite" aria-atomic="true"></aside>
          </div>
          <div class="story">
            <div class="story-heading"><h3>文件读取过程中的进程状态变化</h3><p>本次读取需要等待 I/O 完成。</p></div>
            <ol class="story-steps">${DATA.story.map((step, index) => `<li><button type="button" data-step="${index}" aria-pressed="false"><span class="step-number">${String(index + 1).padStart(2, '0')}</span><span class="step-title">${step.title}</span><span class="step-state">${DATA.states.find(state => state.id === step.state).short}</span></button></li>`).join('')}</ol>
            <div class="story-detail" aria-live="polite" aria-atomic="true"><p class="detail-kicker">文件读取 / 示例</p><p>本次文件读取需要等待数据返回，进程因此进入阻塞状态。读取完成后，进程先回到就绪队列，再通过调度获得 CPU，继续处理数据。</p></div>
          </div>
        </section>

        <section class="pcb-section" id="pcb" aria-labelledby="pcb-title">
          <div class="section-heading"><div><p class="section-index">02 / CONTEXT</p><h2 id="pcb-title">上下文切换中的现场保存与恢复</h2></div><p>PCB · 进程控制块</p></div>
          <p class="section-description">进程控制块（PCB）是操作系统记录进程信息的数据结构。执行现场包括程序计数器和寄存器值，用于记录执行位置与计算状态。上下文切换先保存当前执行对象的现场，再恢复另一个执行对象的现场，使它从保存的位置继续执行。</p>
          <table class="pcb-table"><caption>PCB 中的典型信息，具体组织随操作系统实现而异</caption><thead><tr><th scope="col">字段</th><th scope="col">保存什么</th><th scope="col">为什么需要</th></tr></thead><tbody>${DATA.pcb.map(row => `<tr><th scope="row">${row.field}<span>${row.english}</span></th><td>${row.value}</td><td>${row.desc}</td></tr>`).join('')}</tbody></table>
        </section>

        <section class="related-section" id="related" aria-labelledby="related-title">
          <div class="section-heading"><div><p class="section-index">03 / CONNECTIONS</p><h2 id="related-title">进程与线程、调度及虚拟内存的关系</h2></div></div>
          <dl class="concepts">
            <div id="thread"><dt>线程 <span>Thread</span></dt><dd>线程是进程内的执行流。同一进程的线程通常共享地址空间，但各自保存程序计数器和寄存器值。</dd></div>
            <div id="scheduling"><dt>调度 <span>Scheduling</span></dt><dd>调度从就绪的执行对象中选择一个，并为它分配 CPU。<a class="inline-link" href="${WIKI_PAGES.roundRobin.href}">时间片轮转</a>按就绪队列顺序分配 CPU；时间片耗尽时，未完成的进程回到队尾。</dd></div>
            <div id="context-switch"><dt>上下文切换 <span>Context switch</span></dt><dd>上下文切换通过保存和恢复执行现场，改变当前使用 CPU 的执行对象。进程的程序计数器和寄存器值用于恢复执行，PCB 还记录状态、内存与文件等管理信息。</dd></div>
            <div id="virtual-memory"><dt>虚拟内存 <span>Virtual memory</span></dt><dd>虚拟地址是进程使用的地址，虚拟地址空间是这些地址的集合。<a class="inline-link" href="${WIKI_PAGES.paging.href}">分页地址转换</a>根据映射关系得到物理地址。操作系统管理地址映射和访问权限，硬件在访问时执行相应检查。</dd></div>
          </dl>
        </section>
        ${wikiRelated('process')}
      </main>
      <footer><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
    </div>`;

  const detail = root.querySelector('.state-detail');
  const select = (stateId, edgeIndex, storyIndex) => {
    root.querySelectorAll('[data-state]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.state === stateId)));
    root.querySelectorAll('[data-edge]').forEach(edge => edge.setAttribute('aria-pressed', String(Number(edge.dataset.edge) === edgeIndex)));
    root.querySelectorAll('[data-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.step) === storyIndex)));
    const state = DATA.states.find(item => item.id === stateId);
    const transition = DATA.transitions[edgeIndex];
    const step = DATA.story[storyIndex];
    if (!step) {
      root.querySelector('.story-detail').innerHTML = '<p class="detail-kicker">文件读取 / 示例</p><p>本次文件读取需要等待数据返回，进程因此进入阻塞状态。读取完成后，进程先回到就绪队列，再通过调度获得 CPU，继续处理数据。</p>';
    }
    if (step) {
      root.querySelector('.story-detail').innerHTML = `<p class="detail-kicker">${String(storyIndex + 1).padStart(2, '0')} / ${step.title} / ${state.short}</p><p>${step.desc}</p>`;
      detail.innerHTML = `<p class="detail-kicker">进程状态 / ${state.english}</p><h3>${state.short}</h3><p>${state.desc}</p><div class="detail-reason"><span>状态说明</span><p>${state.reason}</p></div>`;
    } else if (transition) {
      const from = DATA.states.find(item => item.id === transition.from);
      detail.innerHTML = `<p class="detail-kicker">状态转换</p><h3>${from.short} → ${state.short}</h3><p class="detail-state">${transition.label}</p><p>${transition.desc}</p><div class="detail-reason"><span>转入${state.short}后</span><p>${state.reason}</p></div>`;
    } else {
      detail.innerHTML = `<p class="detail-kicker">进程状态 / ${state.english}</p><h3>${state.short}</h3><p>${state.desc}</p><div class="detail-reason"><span>关键区别</span><p>${state.reason}</p></div>`;
    }
  };

  root.querySelectorAll('[data-state], [data-edge]').forEach(control => {
    const activate = () => {
      if (control.dataset.state) select(control.dataset.state);
      else {
        const edgeIndex = Number(control.dataset.edge);
        select(DATA.transitions[edgeIndex].to, edgeIndex);
      }
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
  select('ready');
}

renderProcessPage(document.getElementById('root'));


