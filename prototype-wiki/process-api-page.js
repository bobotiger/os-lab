function renderProcessApiPage(root) {
  const {scenarios, buildScenario} = OSLabProcessApi;
  root.innerHTML = `<div class="page rr-page lde-page api-page" id="top">
    ${wikiHeader('processApi', [{href: '#demo', title: '父子流程'}, {href: '#separation', title: '子进程环境准备'}, {href: '#contract', title: '接口边界'}])}
    <main>
      <section class="intro" aria-labelledby="page-title"><p class="eyebrow">CPU 虚拟化 / UNIX 接口</p><h1 id="page-title">进程 API <span>Interlude: Process API</span></h1><p class="lead">fork 创建子进程，exec 替换当前进程的程序映像。</p><p class="definition">程序映像包括进程执行的代码、数据和用户栈。fork 创建新的子进程；exec 在当前进程内装载新程序，不另建进程；wait 收集子进程的退出状态。创建与装载分开后，子进程可以先准备输入输出，再开始执行目标程序。</p><p class="model-note">示例使用 PID 42／43，输入为 pear、apple、banana，假设接口调用成功。父子执行顺序并不固定，阶段顺序也不表示调度时长；“可执行”表示仍可继续，不表示正在占用 CPU。</p><p class="process-homework-link"><a class="inline-link" href="process-api-homework.html">进程 API 作业：进程树、生成 C 程序与接口编程</a></p></section>
      <section class="lde-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / PROCESS API</p><h2 id="demo-title">fork 与 exec 之间的标准输入输出重定向</h2></div><p>阶段 <strong id="api-stage-index">1</strong> / <span id="api-stage-total">9</span></p></div>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="api-play" aria-label="播放" aria-pressed="false" title="播放"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="api-step" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="api-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>调用场景<select id="api-scenario">${Object.entries(scenarios).map(([id, scene]) => `<option value="${id}">${scene.title}</option>`).join('')}</select></label><label>播放速度<select id="api-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label></div>
        <div class="api-command"><span>调用 / 命令</span><code id="api-command"></code></div><p class="lde-scene-note" id="api-scene-note"></p>
        <div class="api-diagram-scroll" tabindex="0" role="region" aria-label="原进程与子进程的 API 流程"><div class="api-diagram" id="api-diagram"></div></div><input type="range" id="api-position" min="0" max="8" step="1" value="0" aria-label="演示阶段">
        <div class="lde-event api-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="api-actor"></p><h3 id="api-event-title"></h3><p id="api-event-text"></p></div>
        <div class="api-processes" id="api-processes"></div>
        <div class="api-observations"><section class="api-source" aria-labelledby="api-source-title"><h3 id="api-source-title">本步调用</h3><pre><code id="api-code"></code></pre><p class="lde-caption" id="api-code-caption"></p></section><section id="api-files-panel" aria-labelledby="api-files-title"><h3 id="api-files-title">输入与输出</h3><div class="api-files"><div><h4 id="api-input-name">input.txt</h4><pre>pear\napple\nbanana</pre></div><div><h4 id="api-output-name">output.txt</h4><pre id="api-output"></pre></div></div><p class="api-wait-result" id="api-wait-result"></p></section></div>
      </section>
      <section class="lde-entry-section" id="separation" aria-labelledby="separation-title"><div class="section-heading"><div><p class="section-index">02 / A SPACE FOR COMPOSITION</p><h2 id="separation-title">fork 与 exec 分离时的子进程环境准备</h2></div></div><div class="api-separation"><div><p class="api-formula"><code>fork</code><span>→</span><strong>准备子进程环境</strong><span>→</span><code>exec</code></p><p>这段准备代码仍是 Shell 的代码，但运行在子进程中。它可以重定向文件描述符、接入管道、改变工作目录或准备环境，随后用 exec 将子进程的程序映像替换为目标程序。</p><p>sort 只需读标准输入、写标准输出，不必解析 Shell 的重定向语法，也不必知道数据来自终端、文件还是另一个进程。</p></div><div><h3>为什么在子进程中重定向标准输入输出？</h3><p>如果先把父 Shell 的标准输出改成文件，Shell 自己的输出也会受影响；虽然可以另行保存与恢复，但在子进程中准备环境能保留父进程，并把修改限制在目标运行路径。</p><h3>创建与装载也可由组合接口完成</h3><p><code>posix_spawn()</code> 等接口可以组合创建与装载，并通过文件动作、属性等配置提供准备能力。fork／exec 的价值是可组合性，不是“操作系统必须这样设计”；现代系统也关注 fork 在多线程与性能上的限制。</p></div></div></section>
      <section class="rr-rules" id="contract" aria-labelledby="contract-title"><div class="section-heading"><div><p class="section-index">03 / IDENTITIES & CONTRACTS</p><h2 id="contract-title">进程身份，不等于程序映像</h2></div></div><table class="api-contract-table"><thead><tr><th scope="col">接口</th><th scope="col">改变什么</th><th scope="col">返回与边界</th></tr></thead><tbody><tr><th scope="row"><code>fork()</code></th><td>新增子进程。父子从同一调用之后继续，普通私有内存此后独立。</td><td>成功时父进程收到子 PID，子进程收到 0；失败返回 -1，不产生子进程。父子执行顺序不固定。</td></tr><tr><th scope="row"><code>exec*</code></th><td>替换当前进程的代码、数据、用户栈等程序映像，不新增 PID。</td><td>成功不返回旧程序；失败通常返回 -1 并设置 errno，原程序仍在。子分支必须处理失败，不能落入父 Shell 的逻辑。</td></tr><tr><th scope="row"><code>wait / waitpid</code></th><td>等待并收集子进程退出状态，回收退出记录。</td><td>子进程已经退出时可立即取得状态；也有非阻塞选项。本例用阻塞的 waitpid 等待指定前台子进程，正常退出码须用等待状态宏读取。</td></tr></tbody></table><dl class="concepts rr-concepts"><div><dt>描述符表独立，底层引用可共享</dt><dd>fork 后父子各有描述符表，继承的描述符可引用同一内核打开文件描述，因而共享文件偏移等属性。对子进程执行 dup2 或 close 不会直接改父进程的描述符表；不能说“复制了两份文件”。</dd></div><div><dt>exec 保留的资源有规则</dt><dd>本例的标准描述符未设置 close-on-exec，因此保留。设置该标志的描述符会在成功 exec 时关闭；不是所有资源都原样保留。PID 保持，但 exec 仍可能改变其他进程属性。</dd></div><div><dt>fork 不等于立即复制全部物理内存</dt><dd>Linux 通常使用写时复制实现私有内存的逻辑复制：父子最初可共享物理页，写入时再按需复制。显式共享映射则遵循共享内存的语义。</dd></div></dl><div class="rr-tradeoff"><h3>创建、装载、调度是三个不同问题</h3><p>fork 产生新的进程身份，exec 决定当前进程运行哪个程序，调度器决定何时给它 CPU。<a href="limited-direct-execution.html" class="inline-link">受限直接执行</a>涉及进入内核与恢复执行的机制，进程接口则组织父子关系与资源。单独调用 exec 也有用途，例如启动包装程序把自己替换成最终程序。</p></div></section>
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
  let scenario = 'shell';
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
  const prepare = () => {
    root.querySelector('#demo-title').textContent = {
      shell: 'fork 与 exec 之间的标准输入输出重定向',
      fork: '一次 fork，父子从同一调用之后继续',
      exec: '一次 exec，PID 不变，程序映像替换',
    }[scenario];
    root.querySelector('#api-files-panel').hidden = scenario === 'fork';
    root.querySelector('.api-observations').style.gridTemplateColumns = scenario === 'fork' ? '1fr' : '';
    root.querySelector('#api-command').textContent = scenarios[scenario].command;
    root.querySelector('#api-scene-note').textContent = scenarios[scenario].description;
    root.querySelector('#api-stage-total').textContent = frames.length;
    position.max = frames.length - 1;
    diagram.style.minWidth = `${96 + frames.length * 110}px`;
    diagram.style.setProperty('--api-stages', frames.length);
    diagram.innerHTML = `<div class="api-phase-numbers"><span>事件顺序 →</span>${frames.map((frame, index) => `<span>${String(index + 1).padStart(2, '0')}</span>`).join('')}</div><svg class="api-path" aria-hidden="true" preserveAspectRatio="none"><polyline class="api-fork-path"></polyline>${['parent', 'child'].map(lane => `<polyline class="api-planned-path" data-path="${lane}"></polyline><polyline class="api-travelled-path" data-travelled="${lane}"></polyline>`).join('')}</svg>${['parent', 'child'].map(lane => `<div class="api-lane api-${lane}"><h3>${lane === 'parent' ? '原进程' : '子进程'}<span>${lane === 'parent' ? 'PID 42' : scenario === 'exec' ? '未创建' : 'fork 后 PID 43'}</span></h3>${scenario === 'exec' && lane === 'child' ? '<p class="api-no-child">exec 没有创建子进程</p>' : frames.map(frame => frame.actor === lane || frame.actor === 'both' ? `<button type="button" class="api-stage-button" data-stage="${frame.stage}" data-lane="${lane}" aria-label="阶段 ${frame.stage + 1}：${lane === 'parent' ? 'PID 42' : 'PID 43'}，${frame.label}" title="${frame.title}" aria-pressed="false"><span>${frame[lane].status === '已回收' ? '已回收' : frame[lane].program}</span><strong>${frame.actor === 'both' ? lane === 'parent' ? 'fork → 43' : 'fork → 0' : frame.label}</strong></button>` : '<span aria-hidden="true"></span>').join('')}</div>`).join('')}`;
  };
  const syncPaths = () => {
    const width = diagram.clientWidth;
    const column = (width - 96) / frames.length;
    const point = (frame, lane) => `${96 + (frame.stage + .5) * column},${lane === 'parent' ? 54 : 162}`;
    diagram.querySelector('svg').setAttribute('viewBox', `0 0 ${width} 216`);
    for (const lane of ['parent', 'child']) {
      diagram.querySelector(`[data-path="${lane}"]`).setAttribute('points', laneFrames(lane).map(frame => point(frame, lane)).join(' '));
      diagram.querySelector(`[data-travelled="${lane}"]`).setAttribute('points', laneFrames(lane).filter(frame => frame.stage <= stage).map(frame => point(frame, lane)).join(' '));
    }
    diagram.querySelector('.api-fork-path').setAttribute('points', scenario === 'exec' ? '' : `${point(frames[0], 'parent')} ${point(frames[1], 'child')}`);
    diagram.querySelector('.api-fork-path').classList.toggle('occurred', stage > 0);
    return 96 + (stage + .5) * column;
  };
  const processView = (process, lane) => {
    if (!process) return `<section class="api-process api-child-process" aria-labelledby="api-child-title"><h3 id="api-child-title">子进程</h3><p class="api-absent">尚未创建</p><p class="lde-caption">${scenario === 'exec' ? '当前场景没有 fork，不会出现 PID 43。' : 'fork 成功后才出现独立的进程身份。'}</p></section>`;
    return `<section class="api-process api-${lane}-process" aria-labelledby="api-${lane}-title"><h3 id="api-${lane}-title">${lane === 'parent' ? scenario === 'exec' ? '原进程' : '父 Shell' : '子进程'} <span>PID ${process.pid} / PPID ${process.ppid}</span></h3><div class="api-identity"><strong class="api-program">${process.program}</strong><span class="api-status">${process.status}</span></div><dl class="api-process-details"><div><dt>fork 返回值（历史）</dt><dd>${process.forkReturn}</dd></div><div><dt>当前执行位置</dt><dd>${process.location}</dd></div></dl>${process.fds ? `<dl class="api-fds">${process.fds.map((target, index) => `<div><dt><code>${index}</code> ${['stdin', 'stdout', 'stderr'][index]}</dt><dd><span aria-hidden="true">→</span> ${target}</dd></div>`).join('')}</dl>` : `<p class="api-closed-fds">进程已退出，描述符已关闭。${process.status === '已回收' ? '父进程已收集退出状态，回收已完成。' : '仍有待收集的退出信息。'}</p>`}</section>`;
  };
  const paint = () => {
    const snapshot = frames[stage];
    root.querySelector('#api-stage-index').textContent = stage + 1;
    root.querySelector('#api-actor').textContent = `${snapshot.actor === 'both' ? '父子两个返回路径' : snapshot.actor === 'parent' ? 'PID 42' : 'PID 43'} / ${snapshot.action}`;
    root.querySelector('#api-event-title').textContent = snapshot.title;
    root.querySelector('#api-event-text').textContent = snapshot.text;
    root.querySelector('#api-processes').innerHTML = processView(snapshot.parent, 'parent') + processView(snapshot.child, 'child');
    root.querySelector('#api-code').textContent = snapshot.code === 'parse' ? scenarios[scenario].command : snippets[snapshot.code] + (snapshot.code === 'exec' && scenario === 'shell' ? '\n_exit(127);' : '');
    root.querySelector('#api-code-caption').textContent = snapshot.code === 'exec' ? 'exec 成功后，进程执行新程序，不返回原来的调用位置。只有失败才执行 perror；子进程随后用 _exit 退出，避免继续执行 Shell 的后续代码。' : '这些调用表示接口之间的先后关系。open、dup2、fork、waitpid 等接口可能失败，调用方需要检查返回值并处理错误。';
    if (snapshot.code === 'exec' && scenario === 'exec') root.querySelector('#api-code-caption').textContent = '成功不返回旧代码；失败仍是原程序并执行错误处理。如何继续或退出取决于调用方，本场景固定装载成功。';
    root.querySelector('#api-input-name').textContent = scenario === 'exec' ? '终端输入' : 'input.txt';
    root.querySelector('#api-output-name').textContent = scenario === 'exec' ? '终端输出' : 'output.txt';
    root.querySelector('#api-output').textContent = snapshot.output || (scenario === 'fork' ? '未运行 sort' : '尚无排序结果');
    root.querySelector('#api-wait-result').textContent = snapshot.collected ? `waitpid 返回 ${snapshot.collected.pid}，正常退出码 ${snapshot.collected.exitCode}；父 Shell 可显示下一次提示符。` : snapshot.child?.exitStatus === 0 ? '子进程退出码 0，尚未收集。' : scenario === 'exec' ? '没有独立的父 Shell 执行 wait；PID 42 的退出状态由它的父进程收集。' : '尚未收集子进程退出状态。';
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
  root.querySelector('#api-scenario').addEventListener('change', event => { pause(); scenario = event.target.value; stage = 0; frames = buildScenario(scenario); prepare(); paint(); });
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