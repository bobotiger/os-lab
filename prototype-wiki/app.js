const DATA = {
  states: [
    {id: 'new', short: '新建', english: 'New', desc: '进程刚被创建，操作系统正在建立进程控制块，并准备必要的资源。', reason: '创建尚未完成，还没有进入等待 CPU 的就绪队列。'},
    {id: 'ready', short: '就绪', english: 'Ready', desc: '已经具备运行条件，只差获得 CPU。它可以执行，但此刻轮到的是其他进程。', reason: '就绪是在等待 CPU；阻塞是在等待事件。两者不是同一种等待。'},
    {id: 'running', short: '运行', english: 'Running', desc: '正在使用 CPU 执行指令。在这里的单核模型中，同一时刻至多有一个进程处于运行状态。', reason: '被抢占会回到就绪；发起需要等待的 I/O 会进入阻塞。'},
    {id: 'blocked', short: '阻塞', english: 'Blocked', desc: '正在等待 I/O 等事件完成。即使现在分配 CPU，也不能继续执行后面的指令。', reason: 'I/O 完成后先回到就绪，而不是直接运行。它仍然需要等待调度。'},
    {id: 'terminated', short: '终止', english: 'Terminated', desc: '进程已执行结束，或被外部终止。操作系统随后回收相关资源。', reason: '终止的进程不会再次进入就绪队列。再次启动程序会创建新的进程。'},
  ],
  transitions: [
    {from: 'new', to: 'ready', label: '创建完成', desc: '必要资源准备完成，进程进入就绪队列，开始等待 CPU。'},
    {from: 'ready', to: 'running', label: '调度', desc: '调度器从就绪进程中选择一个，把 CPU 分配给它。'},
    {from: 'running', to: 'ready', label: '抢占', desc: '时间片用完，或满足其他抢占条件。进程仍能继续执行，只是暂时交出 CPU。'},
    {from: 'running', to: 'blocked', label: '等待 I/O', desc: '进程发起需要等待的 I/O 请求，暂时无法继续执行，因此让出 CPU。'},
    {from: 'blocked', to: 'ready', label: 'I/O 完成', desc: '等待的事件已经完成，进程重新具备运行条件，回到就绪队列。'},
    {from: 'running', to: 'terminated', label: '执行结束', desc: '示例中的进程完成任务并退出。实际系统也可能从其他状态终止进程。'},
  ],
  pcb: [
    {field: '进程标识', english: 'PID', value: '唯一标识符', desc: '区分不同进程，即使它们运行同一份程序。'},
    {field: '进程状态', english: 'State', value: '新建、就绪、运行、阻塞或终止', desc: '决定进程是否具备被调度的条件。'},
    {field: '程序计数器', english: 'PC', value: '下一条待执行指令的地址', desc: '恢复执行时，知道从哪里继续。'},
    {field: '寄存器现场', english: 'Registers', value: '切换时保存的 CPU 寄存器值', desc: '配合程序计数器恢复执行现场。'},
    {field: '内存管理信息', english: 'Memory', value: '地址空间、页表等相关信息', desc: '帮助系统管理进程内存；隔离依赖硬件与操作系统共同实现。'},
    {field: '打开文件信息', english: 'Files', value: '文件描述符及相关引用', desc: '记录进程使用的文件和 I/O 资源。'},
  ],
  story: [
    {state: 'new', title: '创建进程', desc: '启动程序，操作系统为这一次执行建立 PCB。'},
    {state: 'ready', title: '进入队列', edge: 0, desc: '资源准备完成。进程可以运行，但还没有获得 CPU。'},
    {state: 'running', title: '获得 CPU', edge: 1, desc: '调度器选中了它，进程开始执行指令。'},
    {state: 'blocked', title: '等待读取', edge: 3, desc: '进程请求读取文件，需要等待 I/O 完成，暂时让出 CPU。'},
    {state: 'ready', title: '读取完成', edge: 4, desc: '数据已就绪，但 CPU 可能还在运行其他进程，因此先回到就绪队列。'},
    {state: 'running', title: '继续执行', edge: 1, desc: '再次被调度，恢复保存的执行现场，继续处理数据。'},
    {state: 'terminated', title: '完成退出', edge: 5, desc: '任务完成，进程退出，操作系统回收相关资源。'},
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
          <p class="lead">程序是静态的。进程，是它正在发生的一次执行。</p>
          <p class="definition">操作系统为这次执行管理资源和运行状态。同一份程序可以有多个进程实例，它们拥有各自的标识和执行现场。</p>
          <p class="model-note">教学模型：单核 CPU、以进程为调度对象、五种基本状态。现代系统通常以线程为调度单位。</p>
        </section>

        <section class="state-section" id="states" aria-labelledby="states-title">
          <div class="section-heading"><div><p class="section-index">01 / STATES</p><h2 id="states-title">进程如何改变状态</h2></div><p>等待 CPU，不等于等待 I/O。</p></div>
          <div class="state-workbench">
            <div class="diagram-surface">${stateDiagramSvg('desktop')}${stateDiagramSvg('mobile')}<p class="diagram-caption">基本转换示意 · 省略挂起等扩展状态及异常终止路径</p></div>
            <aside class="state-detail" aria-label="状态与转换说明" aria-live="polite" aria-atomic="true"></aside>
          </div>
          <div class="story">
            <div class="story-heading"><h3>一次文件读取的进程旅程</h3><p>示例路径，不代表所有进程的固定顺序</p></div>
            <ol class="story-steps">${DATA.story.map((step, index) => `<li><button type="button" data-step="${index}" aria-pressed="false"><span class="step-number">${String(index + 1).padStart(2, '0')}</span><span class="step-title">${step.title}</span><span class="step-state">${DATA.states.find(state => state.id === step.state).short}</span></button></li>`).join('')}</ol>
            <div class="story-detail" aria-live="polite" aria-atomic="true"><p class="detail-kicker">文件读取 / 示例</p><p>进程请求读取文件时可能阻塞；读取完成后先就绪，再等待 CPU。一次 I/O 会把连续执行拆成两个阶段。</p></div>
          </div>
        </section>

        <section class="pcb-section" id="pcb" aria-labelledby="pcb-title">
          <div class="section-heading"><div><p class="section-index">02 / CONTEXT</p><h2 id="pcb-title">切换 CPU，执行现场不会丢</h2></div><p>PCB · 进程控制块</p></div>
          <p class="section-description">操作系统通过 PCB 记录和管理一个进程。切换执行对象时，保存当前现场；恢复时，从上次停下的位置继续。</p>
          <table class="pcb-table"><caption>PCB 中的典型信息，具体组织随操作系统实现而异</caption><thead><tr><th scope="col">字段</th><th scope="col">保存什么</th><th scope="col">为什么需要</th></tr></thead><tbody>${DATA.pcb.map(row => `<tr><th scope="row">${row.field}<span>${row.english}</span></th><td>${row.value}</td><td>${row.desc}</td></tr>`).join('')}</tbody></table>
        </section>

        <section class="related-section" id="related" aria-labelledby="related-title">
          <div class="section-heading"><div><p class="section-index">03 / CONNECTIONS</p><h2 id="related-title">把概念连起来</h2></div></div>
          <dl class="concepts">
            <div id="thread"><dt>线程 <span>Thread</span></dt><dd>进程中的执行流。同一进程的线程通常共享地址空间，但各自拥有程序计数器和寄存器现场。</dd></div>
            <div id="scheduling"><dt>调度 <span>Scheduling</span></dt><dd>决定哪个就绪的执行对象获得 CPU。<a class="inline-link" href="${WIKI_PAGES.roundRobin.href}">时间片轮转</a>让进程按队列顺序轮流执行。</dd></div>
            <div id="context-switch"><dt>上下文切换 <span>Context switch</span></dt><dd>保存当前执行对象的现场，再恢复另一个的现场。PCB 是进程管理的重要记录，而不只是一个编号。</dd></div>
            <div id="virtual-memory"><dt>虚拟内存 <span>Virtual memory</span></dt><dd>为进程提供虚拟地址空间。<a class="inline-link" href="${WIKI_PAGES.paging.href}">分页地址转换</a>把虚拟地址映射到物理地址；访问保护由硬件与操作系统共同完成。</dd></div>
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
    if (step) {
      root.querySelector('.story-detail').innerHTML = `<p class="detail-kicker">${String(storyIndex + 1).padStart(2, '0')} / ${step.title} / ${state.short}</p><p>${step.desc}</p>`;
      detail.innerHTML = `<p class="detail-kicker">进程状态 / ${state.english}</p><h3>${state.short}</h3><p>${state.desc}</p><div class="detail-reason"><span>这一刻</span><p>${state.reason}</p></div>`;
    } else if (transition) {
      const from = DATA.states.find(item => item.id === transition.from);
      detail.innerHTML = `<p class="detail-kicker">状态转换</p><h3>${from.short} → ${state.short}</h3><p class="detail-state">${transition.label}</p><p>${transition.desc}</p><div class="detail-reason"><span>到达 ${state.short}</span><p>${state.reason}</p></div>`;
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


