function renderProcessApiPage(root) {
  const {scenarios, buildScenario} = OSLabProcessApi;
  root.innerHTML = `<div class="page rr-page lde-page api-page" id="top">
    ${wikiHeader('processApi', [{href: '#demo', title: '创建与替换'}, {href: '#separation', title: 'Shell 命令'}, {href: '#contract', title: '接口说明'}, {href: '#practice', title: '参考实践'}])}
    <main>
      <section class="intro" aria-labelledby="page-title"><p class="eyebrow">CPU 虚拟化 / UNIX 接口</p><h1 id="page-title">进程 API <span>Interlude: Process API</span></h1><p class="lead">fork 创建子进程，exec 替换程序，wait 收集退出状态。</p><p class="definition">PID 是进程编号。程序映像包括进程执行的代码、数据和用户栈；更换程序映像与创建另一个进程是不同的操作。</p></section>
      <section class="lde-demo" id="demo" aria-labelledby="api-basics-title">
        <div class="section-heading"><div><p class="section-index">01 / 创建与替换</p><h2 id="api-basics-title">fork 与 exec，分别改变什么？</h2></div></div>
        <div id="api-basic-mount"><div id="api-example"><h3 id="demo-title" class="api-scenario-title"></h3>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="api-play" aria-label="播放" aria-pressed="false" title="播放"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="api-step" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="api-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>调用场景<select id="api-scenario">${['fork', 'exec', 'shell'].map(id => `<option value="${id}">${scenarios[id].title}</option>`).join('')}</select></label><label>播放速度<select id="api-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label><p class="api-progress">阶段 <strong id="api-stage-index">1</strong> / <span id="api-stage-total">4</span></p></div>
        <div class="api-command"><span>调用 / 命令</span><code id="api-command"></code></div><p class="lde-scene-note" id="api-scene-note"></p>
        <p class="api-conditions" id="api-conditions">本例假设调用成功。父子执行顺序不固定，阶段不表示调度时长；“可执行”不表示正在占用 CPU。</p>
        <div class="lde-event api-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="api-actor"></p><h3 id="api-event-title"></h3><p id="api-event-text"></p></div>
        <div class="api-diagram-scroll" tabindex="0" role="region" aria-label="原进程与子进程的 API 流程"><div class="api-diagram" id="api-diagram"></div></div><input type="range" id="api-position" min="0" max="8" step="1" value="0" aria-label="演示阶段">
        <div class="api-processes" id="api-processes"></div>
        <div class="api-observations"><section id="api-files-panel" aria-labelledby="api-files-title"><h3 id="api-files-title">输入与输出</h3><div class="api-files"><div><h4 id="api-input-name">input.txt</h4><pre>pear\napple\nbanana</pre></div><div><h4 id="api-output-name">output.txt</h4><pre id="api-output"></pre></div></div><p class="api-wait-result" id="api-wait-result" hidden></p></section><details class="api-source api-reference"><summary id="api-source-title">查看本步接口代码</summary><pre><code id="api-code"></code></pre><p class="lde-caption" id="api-code-caption"></p></details></div>
        </div></div>
        <div class="api-case-actions"><button type="button" data-api-scenario="fork">观察 fork</button><button type="button" data-api-scenario="exec">对照 exec</button></div>
      </section>
      <section class="lde-entry-section" id="separation" aria-labelledby="separation-title"><div class="section-heading"><div><p class="section-index">02 / Shell 命令</p><h2 id="separation-title">把创建、重定向和等待串成一条命令</h2></div></div><p class="section-description">Shell 先 fork，在子进程中准备输入输出，再 exec 装载 sort；父 Shell 保留自身程序，用 waitpid 等待并收集子进程的退出状态。</p><p class="api-descriptor-note">文件描述符是访问已打开 I/O 资源的编号。0 为标准输入，1 为标准输出，2 为标准错误；重定向改变它们对应的输入输出目标。</p><div id="api-shell-mount"></div><p id="api-shell-start"><button type="button" class="api-case-button" data-api-scenario="shell">观察 Shell 命令</button></p><p class="api-conditions">重定向在子进程中执行，因此父 Shell 的输入输出仍连接终端。sort 只读标准输入、写标准输出，不需要解析 Shell 的重定向语法。</p></section>
      <section class="rr-rules" id="contract" aria-labelledby="contract-title"><div class="section-heading"><div><p class="section-index">03 / 接口说明</p><h2 id="contract-title">返回值、失败情况与资源规则</h2></div></div>
        <details class="api-reference"><summary>fork、exec、wait 分别怎样返回？失败后会怎样？</summary><div class="api-contract-scroll" role="region" aria-label="进程接口返回值与边界" tabindex="0"><table class="api-contract-table"><thead><tr><th scope="col">接口</th><th scope="col">改变什么</th><th scope="col">返回与边界</th></tr></thead><tbody><tr><th scope="row"><code>fork()</code></th><td>新增子进程。父子从同一调用之后继续，普通私有内存此后独立。</td><td>成功时父进程收到子 PID，子进程收到 0；失败返回 -1，不产生子进程。父子执行顺序不固定。</td></tr><tr><th scope="row"><code>exec*</code></th><td>替换当前进程的代码、数据、用户栈等程序映像，不新增 PID。</td><td>成功不返回旧程序；失败通常返回 -1 并设置 errno，原程序仍在。子分支必须处理失败，不能落入父 Shell 的逻辑。</td></tr><tr><th scope="row"><code>wait / waitpid</code></th><td>等待并收集子进程退出状态，回收退出记录。</td><td>子进程已经退出时可立即取得状态；也有非阻塞选项。本例用阻塞的 waitpid 等待指定前台子进程，正常退出码须用等待状态宏读取。</td></tr></tbody></table></div></details>
        <details class="api-reference"><summary>父子文件描述符独立，为什么仍可能共享文件偏移？</summary><p>fork 后父子各有描述符表，继承的描述符可引用同一内核打开文件描述，因而共享文件偏移等属性。对子进程执行 dup2 或 close 不会直接改父进程的描述符表；不是复制了两份文件。</p></details>
        <details class="api-reference"><summary>exec 后，哪些文件描述符会保留？</summary><p>本例的标准描述符未设置 close-on-exec，因此保留。设置该标志的描述符会在成功 exec 时关闭；不是所有资源都原样保留。PID 保持，但 exec 仍可能改变其他进程属性。</p></details>
        <details class="api-reference"><summary>fork 是否立即复制全部物理内存？</summary><p>Linux 通常使用写时复制实现私有内存的逻辑复制：父子最初可共享物理页，写入时再按需复制。显式共享映射则遵循共享内存的语义。</p></details>
        <details class="api-reference"><summary>fork 与 exec 分开，还能准备什么？能否使用组合接口？</summary><p>exec 前的准备代码仍是 Shell 的代码，但运行在子进程中。除重定向外，还可以接入管道、改变工作目录或准备环境。若在父 Shell 中重定向，它自身的输出也会受影响，需要另行保存与恢复。</p><p><code>posix_spawn()</code> 等接口可以组合创建与装载，并通过文件动作、属性等配置提供准备能力。fork／exec 的价值是可组合性，不是唯一设计；现代系统也关注 fork 在多线程与性能上的限制。</p></details>
        <details class="api-reference"><summary>创建、装载与 CPU 调度有什么区别？</summary><p>fork 产生新的进程身份，exec 决定当前进程运行哪个程序，调度器决定何时给它 CPU。<a href="limited-direct-execution.html" class="inline-link">受限直接执行</a>涉及进入内核与恢复执行的机制。单独调用 exec 也有用途，例如启动包装程序把自己替换成最终程序。</p></details>
      </section>
      <section class="lde-entry-section" id="practice" aria-labelledby="api-practice-title"><div class="section-heading"><div><p class="section-index">04 / 参考实践</p><h2 id="api-practice-title">用父子进程的输出检查接口行为</h2></div></div><p class="process-homework-link"><a class="inline-link" href="process-api-homework.html">进程 API 作业：进程树与接口编程</a></p></section>
      ${wikiRelated('processApi')}
    </main><footer class="site-footer"><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  const snippets = {
    parse: 'sort < input.txt > output.txt',
    fork: 'pid_t child = fork();',
    branch: 'if (child == 0) {\n    child_path();\n} else if (child > 0) {\n    parent_path();\n}',
    input: 'int in = open("input.txt", O_RDONLY);\ndup2(in, STDIN_FILENO);\nclose(in);',
    output: 'int out = open("output.txt",\n    O_WRONLY | O_CREAT | O_TRUNC, 0666);\ndup2(out, STDOUT_FILENO);\nclose(out);',
    exec: 'char *argv[] = {"sort", NULL};\nexecvp(argv[0], argv);\nperror("execvp");',
    wait: 'int status;\npid_t ended = waitpid(child, &status, 0);\nif (ended > 0 && WIFEXITED(status)) {\n    int exit_code = WEXITSTATUS(status);\n}',
    work: 'read(STDIN_FILENO, ...);\nwrite(STDOUT_FILENO, ...);',
    exit: 'exit(0);',
  };
  let scenario = 'fork';
  let frames = buildScenario(scenario);
  let stage = 0;
  let timer = null;
  const playButton = root.querySelector('#api-play');
  const stepButton = root.querySelector('#api-step');
  const position = root.querySelector('#api-position');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const diagram = root.querySelector('#api-diagram');
  const cancelHighlights = () => diagram.getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const laneFrames = lane => frames.filter(frame => frame.actor === lane || frame.actor === 'both');
  const visibleLanes = () => scenario === 'exec' ? ['parent'] : ['parent', 'child'];
  const prepare = () => {
    root.querySelector(scenario === 'shell' ? '#api-shell-mount' : '#api-basic-mount').append(root.querySelector('#api-example'));
    root.querySelector('#api-shell-start').hidden = scenario === 'shell';
    root.querySelector('#api-scenario').value = scenario;
    root.querySelectorAll('[data-api-scenario]').forEach(button => { button.hidden = button.dataset.apiScenario === scenario; });
    root.querySelector('#api-conditions').textContent = scenario === 'exec'
      ? '本例假设 exec 成功。阶段表示这个进程的事件顺序，不表示调度时长；“可执行”不表示正在占用 CPU。'
      : '本例假设调用成功。父子执行顺序不固定，阶段不表示调度时长；“可执行”不表示正在占用 CPU。';
    root.querySelector('#demo-title').textContent = {
      shell: 'fork 与 exec 之间的标准输入输出重定向',
      fork: '一次 fork，父子从同一调用之后继续',
      exec: '一次 exec，PID 不变，程序映像替换',
    }[scenario];
    root.querySelector('#api-files-panel').hidden = scenario === 'fork';
    root.querySelector('#api-command').textContent = scenarios[scenario].command;
    root.querySelector('#api-scene-note').textContent = scenarios[scenario].description;
    root.querySelector('#api-stage-total').textContent = frames.length;
    position.max = frames.length - 1;
    diagram.style.minWidth = `${96 + frames.length * 110}px`;
    diagram.style.setProperty('--api-stages', frames.length);
    diagram.dataset.scenario = scenario;
    diagram.innerHTML = `<div class="api-phase-numbers"><span>事件顺序 →</span>${frames.map((frame, index) => `<span>${String(index + 1).padStart(2, '0')}</span>`).join('')}</div><svg class="api-path" aria-hidden="true" preserveAspectRatio="none"><polyline class="api-fork-path"></polyline>${visibleLanes().map(lane => `<polyline class="api-planned-path" data-path="${lane}"></polyline><polyline class="api-travelled-path" data-travelled="${lane}"></polyline>`).join('')}</svg>${visibleLanes().map(lane => `<div class="api-lane api-${lane}"><h3>${lane === 'parent' ? '原进程' : '子进程'}<span>${lane === 'parent' ? 'PID 42' : 'fork 后 PID 43'}</span></h3>${frames.map(frame => frame.actor === lane || frame.actor === 'both' ? `<button type="button" class="api-stage-button" data-stage="${frame.stage}" data-lane="${lane}" aria-label="阶段 ${frame.stage + 1}：${lane === 'parent' ? 'PID 42' : 'PID 43'}，${frame.label}" title="${frame.title}" aria-pressed="false"><span>${frame[lane].status === '已回收' ? '已回收' : frame[lane].program}</span><strong>${frame.actor === 'both' ? lane === 'parent' ? 'fork → 43' : 'fork → 0' : frame.label}</strong></button>` : '<span aria-hidden="true"></span>').join('')}</div>`).join('')}`;
  };
  const syncPaths = () => {
    const width = diagram.clientWidth;
    const column = (width - 96) / frames.length;
    const point = (frame, lane) => `${96 + (frame.stage + .5) * column},${lane === 'parent' ? 54 : 162}`;
    diagram.querySelector('svg').setAttribute('viewBox', `0 0 ${width} ${visibleLanes().length * 108}`);
    for (const lane of visibleLanes()) {
      diagram.querySelector(`[data-path="${lane}"]`).setAttribute('points', laneFrames(lane).map(frame => point(frame, lane)).join(' '));
      diagram.querySelector(`[data-travelled="${lane}"]`).setAttribute('points', laneFrames(lane).filter(frame => frame.stage <= stage).map(frame => point(frame, lane)).join(' '));
    }
    diagram.querySelector('.api-fork-path').setAttribute('points', scenario === 'exec' ? '' : `${point(frames[0], 'parent')} ${point(frames[1], 'child')}`);
    diagram.querySelector('.api-fork-path').classList.toggle('occurred', stage > 0);
    return 96 + (stage + .5) * column;
  };
  const processView = (process, lane) => {
    if (!process) return `<section class="api-process api-child-process" aria-labelledby="api-child-title"><h3 id="api-child-title">子进程</h3><p class="api-absent">尚未创建</p></section>`;
    return `<section class="api-process api-${lane}-process" aria-labelledby="api-${lane}-title"><h3 id="api-${lane}-title">${lane === 'parent' ? scenario === 'exec' ? '原进程' : '父 Shell' : '子进程'} <span>PID ${process.pid} / 父进程 PID ${process.ppid}</span></h3><div class="api-identity"><strong class="api-program">${process.program}</strong><span class="api-status">${process.status}</span></div><dl class="api-process-details">${scenario === 'exec' ? '' : `<div><dt>fork 返回值（创建时）</dt><dd>${process.forkReturn}</dd></div>`}<div><dt>当前执行位置</dt><dd>${process.location}</dd></div></dl>${scenario !== 'shell' ? '' : process.fds ? `<dl class="api-fds">${process.fds.map((target, index) => `<div><dt><code>${index}</code> ${['标准输入', '标准输出', '标准错误'][index]}</dt><dd><span aria-hidden="true">→</span> ${target}</dd></div>`).join('')}</dl>` : `<p class="api-closed-fds">进程已退出，描述符已关闭。${process.status === '已回收' ? '父进程已收集退出状态，回收已完成。' : '仍有待收集的退出信息。'}</p>`}</section>`;
  };
  const paint = () => {
    const snapshot = frames[stage];
    root.querySelector('#api-stage-index').textContent = stage + 1;
    root.querySelector('#api-actor').textContent = `${snapshot.actor === 'both' ? '父子两个返回路径' : snapshot.actor === 'parent' ? 'PID 42' : 'PID 43'} / ${snapshot.action}`;
    root.querySelector('#api-event-title').textContent = snapshot.title;
    root.querySelector('#api-event-text').textContent = snapshot.text;
    root.querySelector('#api-processes').innerHTML = processView(snapshot.parent, 'parent') + (scenario === 'exec' ? '' : processView(snapshot.child, 'child'));
    root.querySelector('#api-processes').classList.toggle('api-single-process', scenario === 'exec');
    root.querySelector('#api-code').textContent = snapshot.code === 'parse' ? scenarios[scenario].command : snippets[snapshot.code] + (snapshot.code === 'exec' && scenario === 'shell' ? '\n_exit(127);' : '');
    root.querySelector('#api-code-caption').textContent = snapshot.code === 'exec' ? 'exec 成功后，进程执行新程序，不返回原来的调用位置。只有失败才执行 perror；子进程随后用 _exit 退出，避免继续执行 Shell 的后续代码。' : '这些调用表示接口之间的先后关系。open、dup2、fork、waitpid 等接口可能失败，调用方需要检查返回值并处理错误。';
    if (snapshot.code === 'exec' && scenario === 'exec') root.querySelector('#api-code-caption').textContent = '成功不返回旧代码；失败仍是原程序并执行错误处理。如何继续或退出取决于调用方，本场景固定装载成功。';
    root.querySelector('#api-input-name').textContent = scenario === 'exec' ? '终端输入' : 'input.txt';
    root.querySelector('#api-output-name').textContent = scenario === 'exec' ? '终端输出' : 'output.txt';
    root.querySelector('#api-output').textContent = snapshot.output || (scenario === 'fork' ? '未运行 sort' : '尚无排序结果');
    root.querySelector('#api-wait-result').textContent = snapshot.collected ? `waitpid 返回 ${snapshot.collected.pid}，正常退出码 ${snapshot.collected.exitCode}；父 Shell 可显示下一次提示符。` : snapshot.child?.exitStatus === 0 ? '子进程退出码 0，尚未收集。' : scenario === 'exec' ? '没有独立的父 Shell 执行 wait；PID 42 的退出状态由它的父进程收集。' : '尚未收集子进程退出状态。';
    root.querySelector('#api-wait-result').hidden = scenario !== 'shell' || (snapshot.code !== 'wait' && snapshot.child?.exitStatus !== 0);
    diagram.querySelectorAll('[data-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.stage) === stage)));
    const current = syncPaths();
    const scroll = root.querySelector('.api-diagram-scroll');
    if (current < scroll.scrollLeft + 96 || current > scroll.scrollLeft + scroll.clientWidth - 55) scroll.scrollLeft = Math.max(0, current - scroll.clientWidth / 2);
    if (stage === 0) scroll.scrollLeft = 0;
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1}，${snapshot.label}`);
    playButton.disabled = snapshot.complete;
    stepButton.disabled = snapshot.complete;
    cancelHighlights();
    if (!motionPreference.matches) diagram.querySelectorAll(`[data-stage="${stage}"]`).forEach(button => button.animate([{opacity: .45}, {opacity: 1}], {duration: 220}));
  };
  const pause = () => {
    clearInterval(timer);
    timer = null;
    playButton.setAttribute('aria-pressed', 'false');
    playButton.setAttribute('aria-label', '播放');
    playButton.title = '播放';
    playButton.firstElementChild.textContent = '▶';
  };
  const advance = () => { stage = Math.min(stage + 1, frames.length - 1); if (frames[stage].complete) pause(); paint(); };
  const play = () => {
    if (frames[stage].complete) return;
    playButton.setAttribute('aria-pressed', 'true');
    playButton.setAttribute('aria-label', '暂停');
    playButton.title = '暂停';
    playButton.firstElementChild.textContent = 'Ⅱ';
    timer = setInterval(advance, Number(root.querySelector('#api-speed').value));
  };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#api-reset').addEventListener('click', () => { pause(); stage = 0; paint(); });
  const selectScenario = value => {
    const focused = document.activeElement;
    pause(); scenario = value; stage = 0; frames = buildScenario(scenario); prepare(); paint();
    if (root.querySelector('#api-example').contains(focused)) focused.focus({preventScroll: true});
  };
  root.querySelector('#api-scenario').addEventListener('change', event => {
    selectScenario(event.target.value);
    root.querySelector(scenario === 'shell' ? '#separation' : '#demo').scrollIntoView({block: 'start'});
  });
  root.querySelectorAll('[data-api-scenario]').forEach(button => button.addEventListener('click', () => {
    selectScenario(button.dataset.apiScenario);
    root.querySelector(scenario === 'shell' ? '#separation' : '#demo').scrollIntoView({block: 'start'});
    playButton.focus({preventScroll: true});
  }));
  root.querySelectorAll('a[href="#demo"], a[href="#separation"]').forEach(link => link.addEventListener('click', () => {
    selectScenario(link.getAttribute('href') === '#separation' ? 'shell' : 'fork');
  }));
  root.querySelector('#api-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  position.addEventListener('input', event => { pause(); stage = Number(event.target.value); paint(); });
  diagram.addEventListener('click', event => { const button = event.target.closest('[data-stage]'); if (button) { pause(); stage = Number(button.dataset.stage); paint(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  window.addEventListener('resize', syncPaths);
  motionPreference.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  prepare();
  paint();
}

renderProcessApiPage(document.getElementById('root'));
