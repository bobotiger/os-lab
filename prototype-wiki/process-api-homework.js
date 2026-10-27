const apiPracticeEscape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const apiPracticeCommand = command => `<div class="practice-command"><pre><code>${command.split(/(\s+)/).map(part => /\s/.test(part) ? part : `<span class="practice-command-argument">${apiPracticeEscape(part)}</span>`).join('')}</code></pre><button type="button" data-practice-copy aria-label="复制命令" title="复制命令"><span class="practice-copy-icon" aria-hidden="true"></span></button></div>`;
const apiPracticeSteps = task => `<h3>解题过程</h3><ol>${task.steps.map(([title, lines], index) => `<li><span class="practice-step">${index + 1}</span><div><h4>${title}</h4><div class="practice-step-lines">${lines.map(text => `<p>${apiPracticeEscape(text)}</p>`).join('')}</div></div></li>`).join('')}</ol><div class="practice-conclusion"><h4>结果与原因</h4><dl class="practice-conclusion-items">${task.conclusion.map(([title,text]) => `<div><dt>${apiPracticeEscape(title)}</dt><dd>${apiPracticeEscape(text)}</dd></div>`).join('')}</dl></div>${(task.supplements || []).map(([title,text]) => `<details class="practice-trace api-practice-supplement"><summary>${title}</summary><p>${text}</p></details>`).join('')}`;
const apiPracticeTree = parents => {
  const node = name => `<li><span class="api-tree-node">${name}</span>${Object.keys(parents).some(child => parents[child] === name) ? `<ul>${Object.keys(parents).filter(child => parents[child] === name).map(node).join('')}</ul>` : ''}</li>`;
  return `<ul class="api-tree" aria-label="进程树">${node('a')}</ul>`;
};
const apiFinalParents = {a:null,b:'a',d:'a',e:'a'};
const apiTreeStages = [
  {action:'初始只有 a', parents:{a:null}},
  {action:'a 创建 b', parents:{a:null,b:'a'}},
  {action:'a 创建 c', parents:{a:null,b:'a',c:'a'}},
  {action:'c 退出', parents:{a:null,b:'a'}},
  {action:'a 创建 d', parents:{a:null,b:'a',d:'a'}},
  {action:'a 创建 e', parents:apiFinalParents},
];
const apiTreeFigure = (caption, parents) => `<figure class="api-tree-figure"><figcaption>${caption}</figcaption><div class="api-tree-scroll" role="region" aria-label="${caption}" tabindex="0">${apiPracticeTree(parents)}</div></figure>`;
const apiSimulationVisual = index => [
  `<figure class="api-tree-figure"><figcaption id="api-tree-action" aria-live="polite">初始只有 a</figcaption><div id="api-tree-stage" class="api-tree-scroll" role="region" aria-label="种子 10 的当前进程树" tabindex="0">${apiPracticeTree(apiTreeStages[0].parents)}</div><div class="api-stage-controls" role="group" aria-label="种子 10 的动作阶段">${apiTreeStages.map((stage, stageIndex) => `<button type="button" data-api-stage="${stageIndex}" aria-pressed="${stageIndex === 0}" aria-label="${stageIndex === 0 ? '初始状态' : `动作 ${stageIndex}：${stage.action}`}" title="${stage.action}">${stageIndex}</button>`).join('')}</div><p class="api-figure-note">初始状态后依次执行五个动作，连线表示当前父子关系。</p></figure>`,
  `<figure class="api-probability"><figcaption>种子 10 · 100 个动作</figcaption><div class="practice-table-scroll"><table><thead><tr><th scope="col">-f</th><th scope="col">创建</th><th scope="col">退出</th><th scope="col">最终存活</th></tr></thead><tbody>${[[0.1,50,50,1],[0.5,53,47,7],[0.9,92,8,85]].map(([probability,forks,exits,remaining]) => `<tr><th scope="row">${probability}</th><td>${forks}</td><td>${exits}</td><td><div class="api-count"><span>${remaining}</span><i style="--api-count:${remaining}%" aria-hidden="true"></i></div></td></tr>`).join('')}</tbody></table></div></figure>`,
  `<dl class="api-action-changes">${[['新增 b，父节点 a','a forks b'],['新增 c，父节点 a','a forks c'],['c 消失','c EXITS'],['新增 d，父节点 a','a forks d'],['新增 e，父节点 a','a forks e']].map(([change,action]) => `<div><dt>${change}</dt><dd>${action}</dd></div>`).join('')}</dl>`,
  `<div class="api-tree-comparison">${apiTreeFigure('c 退出前', {a:null,b:'a',c:'b',d:'c',e:'c'})}${apiTreeFigure('默认：d、e 改归 a', apiFinalParents)}${apiTreeFigure('-R：d、e 改归 b', {a:null,b:'a',d:'b',e:'b'})}</div>`,
  apiTreeFigure('种子 10 的最终树', apiFinalParents),
  apiTreeFigure('两段历史得到的相同最终树', apiFinalParents),
][index];
const apiCodeVisual = index => {
  if (index === 0) return `<figure class="api-mechanism"><figcaption>父子分别从初始值 100 修改自己的变量</figcaption><div class="api-pair"><div><span>父进程</span><strong>x：100 → 300</strong><small>父进程的虚拟地址空间</small></div><div><span>子进程</span><strong>x：100 → 200</strong><small>子进程的虚拟地址空间</small></div></div></figure>`;
  if (index === 1) return `<figure class="api-mechanism api-file-demo"><figcaption>父子进程写入同一个文件时，位置怎样变化</figcaption><p class="api-file-definition">文件描述符（fd）是进程访问已打开文件的编号。“打开文件描述”是内核保存这次打开状态的对象，其中记录下一次读写的位置，称为文件偏移。</p><div class="api-pair"><div id="api-file-parent" class="api-file-reference"><span>父进程的描述符表</span><strong>fd：已打开</strong><small>引用下方同一个内核对象</small></div><div id="api-file-child" class="api-file-reference"><span>子进程的描述符表</span><strong>fd：已打开</strong><small>引用下方同一个内核对象</small></div></div><div class="api-shared-object"><strong>同一个打开文件描述</strong><span>共享偏移：<b id="api-file-offset">0</b> 字节</span><small>下一次写入从这个位置开始</small></div><div class="api-file-content"><h4>q2-output.txt 当前内容</h4><pre id="api-file-content">（空文件）</pre></div><p id="api-file-action" class="api-file-action" aria-live="polite">fork 已完成。父子各有一个 fd，引用同一个打开文件描述，文件偏移为 0。</p><div class="api-file-controls" role="group" aria-label="共享文件偏移演示"><button type="button" data-api-file-control="play" aria-label="播放写入过程" title="播放写入过程"><span aria-hidden="true">▶</span></button><button type="button" data-api-file-control="next" aria-label="下一步" title="下一步"><span aria-hidden="true">→</span></button><button type="button" data-api-file-control="reset" aria-label="回到初始状态" title="回到初始状态"><span aria-hidden="true">↺</span></button><span id="api-file-progress">0 / 4</span></div><p class="api-figure-note">以下按所示顺序执行三次完整写入。实际参考程序父子各写 50 条记录，调度顺序不固定。</p></figure>`;
  if (index === 2) return `<figure class="api-mechanism"><figcaption>成功运行时的输出依赖</figcaption><ol class="api-dependency"><li><span>子进程</span><strong>写入 hello</strong></li><li><span>子进程</span><strong>发送通知字节</strong></li><li><span>父进程</span><strong>收到通知，再写入 goodbye</strong></li></ol></figure>`;
  if (index === 3) return `<div class="practice-table-scroll api-exec-table"><table><caption>六种 exec 接口的参数、程序定位与环境</caption><thead><tr><th scope="col">接口</th><th scope="col">参数</th><th scope="col">定位</th><th scope="col">环境</th></tr></thead><tbody>${[['execl','列表','显式路径','继承'],['execle','列表','显式路径','envp'],['execlp','列表','PATH','继承'],['execv','数组','显式路径','继承'],['execvp','数组','PATH','继承'],['execvpe','数组','PATH','envp']].map(([variant,argumentsType,path,environment]) => `<tr><th scope="row">${variant}</th><td>${argumentsType}</td><td>${path}</td><td>${environment}</td></tr>`).join('')}</tbody></table></div>`;
  if (index === 7) return `<figure class="api-mechanism api-pipe"><figcaption>两个子进程之间的数据通路</figcaption><div class="api-pipe-path"><div><span>writer 子进程</span><strong>stdout · fd 1</strong><small>引用管道写端</small></div><div><span>内核管道</span><strong>单向字节流</strong><small>写入 → 读取</small></div><div><span>reader 子进程</span><strong>stdin · fd 0</strong><small>引用管道读端</small></div></div><p>父进程关闭两端，只等待子进程；reader 的 stdout 仍连接终端。</p></figure>`;
  return '';
};
const apiExerciseNav = (group, index, tasks) => `<nav class="practice-exercise-nav" aria-label="${group === 'simulation' ? '模拟' : '代码'}练习 ${index + 1} 导航">${index > 0 ? `<a href="#${group}-${index}">← ${tasks[index - 1].title}</a>` : `<a href="#${group === 'simulation' ? 'simulation' : 'coding'}">练习目录</a>`}${index < tasks.length - 1 ? `<a href="#${group}-${index + 2}">${tasks[index + 1].title} →</a>` : `<a href="#${group === 'simulation' ? 'coding' : 'top'}">${group === 'simulation' ? 'C 程序练习' : '回到页首'} →</a>`}</nav>`;
const apiExerciseHeading = (task, index, topic) => `<header class="practice-exercise-heading"><span class="practice-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><p class="practice-topic">${topic}</p><h2>${task.title}</h2></div></header><p class="practice-question">${task.question}</p>`;
const renderApiSimulation = (task, index) => `<article class="practice-exercise" id="simulation-${index + 1}">${apiExerciseHeading(task, index, task.topic)}<div class="practice-body"><section class="practice-run"><h3>运行与核对</h3>${apiPracticeCommand(task.command)}${apiPracticeCommand(`${task.command} -c`)}${apiSimulationVisual(index)}${task.extra ? `<h3 class="api-extra-heading">比较运行</h3>${apiPracticeCommand(task.extra)}` : ''}</section><section class="practice-reasoning">${apiPracticeSteps(task)}</section></div>${apiExerciseNav('simulation',index,API_SIMULATION_PRACTICE)}</article>`;
const renderApiCode = (task, index) => `<article class="practice-exercise" id="code-${index + 1}">${apiExerciseHeading(task, index, task.api)}<div class="practice-body"><section class="practice-run">${task.basic ? `<section class="api-basic"><h3>${task.basic.title}</h3><div class="practice-command"><pre><code>${apiPracticeEscape(task.basic.code)}</code></pre></div><p>${task.basic.explanation}</p></section>` : ''}<details class="api-source"><summary>${task.sourceLabel || '参考源码'} · ${task.file}.c</summary><div class="api-source-actions"><button type="button" data-copy-source="${index}" aria-label="复制 ${task.file}.c 源码" title="复制源码"><span class="practice-copy-icon" aria-hidden="true"></span></button><button type="button" data-download-source="${index}" aria-label="下载 ${task.file}.c" title="下载 C 源码"><span class="api-download-icon" aria-hidden="true">↓</span></button></div><pre tabindex="0" aria-label="${task.file}.c 完整源码"><code>${apiPracticeEscape(API_PRACTICE_SOURCES[index])}</code></pre></details><h3>编译与运行</h3>${apiPracticeCommand(`gcc -std=c11 -Wall -Wextra -Wpedantic -Werror ${task.file}.c -o ${task.file}`)}${apiPracticeCommand(task.run || `./${task.file}`)}${task.extra ? apiPracticeCommand(task.extra) : ''}${apiCodeVisual(index)}<figure class="api-output"><figcaption>${task.outputLabel || (index === 1 ? '运行结果与文件记录核对' : '程序运行结果')}</figcaption><pre><code>${apiPracticeEscape(task.output)}</code></pre><p>${task.note}</p></figure></section><section class="practice-reasoning">${apiPracticeSteps(task)}</section></div>${apiExerciseNav('code',index,API_CODE_PRACTICE)}</article>`;
const apiPracticeIndex = (group, tasks) => `<nav class="practice-index api-exercise-index" aria-label="${group === 'simulation' ? '模拟' : '代码'}练习目录">${tasks.map((task,index) => `<a href="#${group}-${index + 1}"><span>${String(index + 1).padStart(2,'0')}</span><strong>${task.title}</strong></a>`).join('')}</nav>`;
const apiProgramOptions = rows => `<div class="api-program-table"><table><thead><tr><th scope="col">参数</th><th scope="col">用途与默认值</th></tr></thead><tbody>${rows.map(([option,defaultValue,description]) => `<tr><th scope="row"><code>${apiPracticeEscape(option)}</code></th><td>${apiPracticeEscape(description)}<span class="api-param-default">默认：${apiPracticeEscape(defaultValue)}</span></td></tr>`).join('')}</tbody></table></div>`;

const processApiHomeworkHeader = wikiHeader('processApi', [
  {href: '#simulation', title: '模拟练习'},
  {href: '#coding', title: '代码练习'},
  {href: '#tree', title: '进程树'},
]);

document.querySelector('#root').innerHTML = `
  <div class="page hw-page api-hw-page process-practice-page api-practice-page" id="top">
    ${processApiHomeworkHeader}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / UNIX 接口 / 作业</p>
        <h1 id="page-title">进程 API 作业 <span>Process API Homework</span></h1>
        <p class="lead">从进程树的创建与退出，到真实程序中的 fork、exec、wait 和管道通信。</p>
        <dl class="hw-meta"><div><dt>运行环境</dt><dd>Ubuntu 22.04</dd></div><div><dt>程序与编译器</dt><dd>Python 3 · GCC</dd></div></dl>
        <p class="hw-back"><a class="inline-link" href="process-api.html">进程 API：fork、exec 与 wait</a></p>
      </section>

      <div class="practice-tabs" role="tablist" aria-label="进程 API 作业内容"><button type="button" id="practice-tab" role="tab" aria-controls="practice-view" aria-selected="true">模拟与代码练习</button><button type="button" id="program-tab" role="tab" aria-controls="program-view" aria-selected="false" tabindex="-1">程序说明与参数</button></div>
      <div id="practice-view" role="tabpanel" aria-labelledby="practice-tab" tabindex="0">
        <nav class="practice-index" aria-label="练习目录"><a href="#simulation"><span>01</span><strong>进程树模拟</strong></a><a href="#coding"><span>02</span><strong>C 程序练习</strong></a></nav>
        <section id="simulation" aria-labelledby="simulation-title"><div class="practice-section-heading"><p class="eyebrow">HOMEWORK / SIMULATION</p><h2 id="simulation-title">创建、退出与进程树</h2><p>a、b、c 是模拟进程的名称，连线表示父子关系，不是系统中的实际 PID。</p></div>${apiPracticeIndex('simulation', API_SIMULATION_PRACTICE)}<div class="practice-setup"><h3>进入脚本目录</h3>${apiPracticeCommand('cd ~/ostep-homework/cpu-api')}<p><code>-c</code> 显示答案；<code>-t</code> 由树推断动作；<code>-F</code> 只查看最终结果。<a href="#tree" class="inline-link">fork.py 参数与输出</a></p></div>${API_SIMULATION_PRACTICE.map(renderApiSimulation).join('')}</section>
        <section id="coding" aria-labelledby="coding-title"><div class="practice-section-heading"><p class="eyebrow">HOMEWORK / CODE</p><h2 id="coding-title">进程 API 的 C 程序练习</h2><p>fork 创建子进程，exec 替换当前进程的程序，wait 收集直接子进程的终止状态。下面分别考察变量、文件、输出顺序、执行程序、等待和管道。</p></div>${apiPracticeIndex('code', API_CODE_PRACTICE)}<div class="practice-setup"><h3>准备练习目录</h3>${apiPracticeCommand('mkdir -p ~/process-api-practice\ncd ~/process-api-practice')}<p>每题使用独立的源码文件和可执行文件。终端输出中的 PID 和没有同步约束的行序可能随运行改变。</p></div>${API_CODE_PRACTICE.map(renderApiCode).join('')}</section>
      </div>
      <div id="program-view" role="tabpanel" aria-labelledby="program-tab" tabindex="0" hidden>
        <nav class="practice-index api-program-index" aria-label="程序说明目录"><a href="#tree"><span>01</span><strong>fork.py · 进程树模拟</strong></a><a href="#generator"><span>02</span><strong>generator.py · C 程序生成</strong></a></nav>
        <section class="api-program-guide" id="tree" aria-labelledby="tree-title">
          <header class="api-program-heading"><p class="eyebrow">PROCESS TREE</p><h2 id="tree-title">fork.py：创建、退出与进程树</h2><p>模拟进程的创建与退出，并给出动作或进程树。初始进程为 a；其他进程只有一个父进程，可以有多个子进程。连线表示父子关系，a、b、c 是模拟进程名称，不是 Linux 的 PID。</p></header>
          <section class="api-program-start" aria-labelledby="fork-start-title"><h3 id="fork-start-title">基本运行</h3><p>先进入脚本目录。种子 4 固定本次动作序列；不加 <code>-c</code> 时，输出动作和待推导的树；加 <code>-c</code> 后，显示同一序列的树变化。</p>${apiPracticeCommand('cd ~/ostep-homework/cpu-api')}<div class="api-program-commands"><div><h4>给出动作，推导进程树</h4>${apiPracticeCommand('python3 fork.py -s 4')}</div><div><h4>显示对应的树变化</h4>${apiPracticeCommand('python3 fork.py -s 4 -c')}</div></div></section>
          <div class="api-program-layout">
            <section aria-labelledby="fork-options-title"><h3 id="fork-options-title">选项参数</h3>${apiProgramOptions([
              ['-s SEED','不固定种子','指定随机种子；相同种子和生成参数得到相同动作序列。'],
              ['-a COUNT','5','随机生成的创建、退出动作数量。'],
              ['-f PROB','0.7','随机选择创建动作的概率，用小数比例表示，例如 0.7 表示 70%；需大于 0.001。'],
              ['-A LIST','随机生成','使用指定的动作序列，替代随机生成。'],
              ['-t','关闭','给出进程树，隐藏需要推导的动作。'],
              ['-F','关闭','只针对最终状态出题，不逐次展示中间树。'],
              ['-c','关闭','显示当前模式中隐藏的答案。'],
              ['-P STYLE','fancy','树的输出样式：basic、line1、line2、fancy。'],
              ['-L','关闭','随机生成时，仅允许没有子进程的叶进程退出。'],
              ['-R','关闭','退出时将直接子进程改归退出进程的父进程。'],
              ['-h','关闭','显示命令帮助并退出。'],
            ])}<p class="api-program-note">根进程 a 不退出，因此随机选择的创建概率不等于每次运行中创建动作的实际比例。</p></section>
            <div class="api-program-examples">
              <section aria-labelledby="fork-input-title"><h3 id="fork-input-title">指定动作：-A 的输入格式</h3><p>动作之间用逗号分隔。<code>a+b</code> 表示 a 创建 b，<code>b-</code> 表示 b 退出。下面让 a 创建 b、b 创建 c、c 退出，最后由 a 创建 d。</p>${apiPracticeCommand('python3 fork.py -A a+b,b+c,c-,a+d -c')}<p>最终 a 的直接子进程为 b、d，c 已退出。</p></section>
              <section aria-labelledby="fork-modes-title"><h3 id="fork-modes-title">输出模式与问题标记</h3><dl class="api-program-modes"><div><dt>默认模式</dt><dd>给出初始树与逐次动作；<code>Process Tree?</code> 表示需要推导动作后的树。</dd></div><div><dt><code>-t</code></dt><dd>给出逐次变化后的树；<code>Action?</code> 表示需要推导相邻两棵树之间的动作。</dd></div><div><dt><code>-F</code></dt><dd>给出完整动作序列；<code>Final Process Tree?</code> 表示需要推导最终树。</dd></div><div><dt><code>-t -F</code></dt><dd>给出最终树，推导可能的动作序列。已退出的节点不再保留，因此序列可能不唯一。</dd></div></dl><p><code>-c</code> 显示本次实际生成的答案，不改变创建与退出的规则。</p></section>
              <section aria-labelledby="fork-output-title"><h3 id="fork-output-title">种子 4 的输出</h3><p><code>Action: a forks b</code> 表示 a 创建 b；<code>Action: d EXITS</code> 表示 d 退出。树的缩进和连线表示当前父子关系。</p><details class="practice-trace api-program-trace"><summary>python3 fork.py -s 4 -c · 动作与进程树</summary><pre tabindex="0" aria-label="种子 4 的动作与进程树"><code>Process Tree:
    a
Action: a forks b
    a
    └── b
Action: a forks c
    a
    ├── b
    └── c
Action: b forks d
    a
    ├── b
    │   └── d
    └── c
Action: d EXITS
    a
    ├── b
    └── c
Action: a forks e
    a
    ├── b
    ├── c
    └── e</code></pre></details><p>最终 b、c、e 都是 a 的直接子进程。d 曾是 b 的子进程，但已退出。</p></section>
              <section aria-labelledby="fork-exit-title"><h3 id="fork-exit-title">退出时的父子关系</h3><p>默认规则将退出进程的全部后代直接改归根进程 a；<code>-R</code> 只将其直接子进程改归它的父进程，其余后代关系保留。</p><p>例如原关系为 <code>a → b → c → d → e</code>，c 退出后：默认 d、e 都成为 a 的子进程；使用 <code>-R</code> 后，d 成为 b 的子进程，e 仍是 d 的子进程。这两项是模拟树的更新规则；Linux 中孤儿进程的接收者由实际进程关系和系统设置决定。</p></section>
            </div>
          </div>
        </section>
        <section class="api-program-guide" id="generator" aria-labelledby="generator-title">
          <header class="api-program-heading"><p class="eyebrow">PROGRAM GENERATOR</p><h2 id="generator-title">generator.py：生成并运行进程练习程序</h2><p>根据随机参数或指定的动作描述生成 C 程序，观察 fork 创建子进程、wait 等待子进程结束的过程。不加 <code>-c</code> 时生成并显示源码；加 <code>-c</code> 时还会调用 GCC 编译并运行。</p></header>
          <section class="api-program-start" aria-labelledby="generator-start-title"><h3 id="generator-start-title">基本运行</h3><p>在独立练习目录生成文件。种子 0、一个随机生成动作的示例中，a 创建 b，b 休眠 6 秒后退出，a 等待 b 结束。</p>${apiPracticeCommand('mkdir -p ~/process-api-practice\ncd ~/process-api-practice')}<div class="api-program-commands"><div><h4>生成并查看程序</h4>${apiPracticeCommand('python3 ~/ostep-homework/cpu-api/generator.py -n 1 -s 0')}</div><div><h4>生成、编译并运行</h4>${apiPracticeCommand('python3 ~/ostep-homework/cpu-api/generator.py -n 1 -s 0 -c')}</div></div><p class="api-program-note">需要 Python 3；编译运行还需要 GCC。默认生成 read.c、run.c；使用 -c 时还编译生成并执行 run。相同名称的已有文件会被覆盖。</p></section>
          <div class="api-program-layout">
            <section aria-labelledby="generator-options-title"><h3 id="generator-options-title">选项参数</h3>${apiProgramOptions([
              ['-s SEED','不固定种子','固定随机种子；相同种子和生成参数得到相同源码。'],
              ['-n COUNT','10','随机生成的动作目标数；补充的等待和退出可能使最终动作数更多。'],
              ['-S SECONDS','10','随机生成的休眠秒数在 1 到该值之间；指定输入时按输入中的秒数休眠。'],
              ['-f PERCENT','30','随机生成 fork 动作的整数百分比。'],
              ['-w PERCENT','40','随机生成 wait 动作的整数百分比；需有尚未等待的直接子进程。'],
              ['-e PERCENT','30','随机生成 exit 动作的整数百分比。'],
              ['-A PROGRAM','随机生成','用完整的程序描述代替随机生成，描述整体放在引号内。'],
              ['-r NAME','read','可读源码的文件名主体，例如 example 生成 example.c。'],
              ['-R NAME','run','可运行源码的文件名主体；配合 -c 时，也作为可执行文件名。'],
              ['-c','关闭','生成源码后编译并执行可运行程序。'],
              ['-h','关闭','显示命令帮助并退出。'],
            ])}<p class="api-program-note"><code>-f</code>、<code>-w</code>、<code>-e</code> 每项取 1–99，总和为 100。这里使用整数百分比，例如 <code>-f 30</code>；fork.py 使用小数比例，例如 <code>-f 0.7</code>。</p><h4 class="api-program-subheading">自定义生成文件名</h4>${apiPracticeCommand('python3 ~/ostep-homework/cpu-api/generator.py -n 1 -s 0 -r example -R example-run -c')}<p>生成 example.c、example-run.c，并编译运行 example-run。</p></section>
            <div class="api-program-examples">
              <section aria-labelledby="generator-input-title"><h3 id="generator-input-title">指定程序：-A 的输入格式</h3><p>外层动作由初始进程 a 执行。<code>fork b,1 {}</code> 创建子进程 b，b 先休眠 1 秒，再执行花括号内的动作；空花括号表示没有后续动作，随后退出。<code>wait</code> 等待一个直接子进程结束，不按名称指定对象。</p>${apiPracticeCommand('python3 ~/ostep-homework/cpu-api/generator.py -A "fork b,1 {} wait" -c')}<p>动作之间用空格分隔；名称与休眠秒数用逗号分隔；花括号限定子进程的动作范围。每个进程为自己创建的直接子进程安排对应的 wait。</p><h4>两个直接子进程</h4>${apiPracticeCommand('python3 ~/ostep-homework/cpu-api/generator.py -A "fork b,1 {} fork c,2 {} wait wait" -c')}<p>a 先创建 b 和 c，再等待两次。b、c 分别休眠 1 秒、2 秒后退出。</p><h4>子进程继续创建子进程</h4>${apiPracticeCommand('python3 ~/ostep-homework/cpu-api/generator.py -A "fork b,1 {fork c,2 {} fork d,3 {} wait wait} wait" -c')}<p>a 创建 b，并等待 b；b 休眠 1 秒后创建 c、d，再等待它们。c、d 分别休眠 2 秒、3 秒后退出，b 收集它们的状态后退出，最后 a 的等待返回。</p></section>
              <section aria-labelledby="generator-files-title"><h3 id="generator-files-title">生成文件的用途</h3><dl class="api-program-modes"><div><dt><code>read.c</code></dt><dd>便于阅读的源码，也是命令运行后显示的程序。</dd></div><div><dt><code>run.c</code></dt><dd>包含运行事件输出的源码。</dd></div><div><dt><code>run</code></dt><dd>加 -c 后由 run.c 编译得到的可执行文件。生成器编译后直接执行，也可在同一目录用 <code>./run</code> 再次运行。</dd></div></dl></section>
              <section aria-labelledby="generator-output-title"><h3 id="generator-output-title">运行输出的含义</h3><p>以下是 <code>-n 1 -s 0 -c</code> 的事件输出示例。第一列是从程序开始运行起经过的秒数；a、b 是程序描述中的进程名称，不是实际 PID。</p><figure class="api-program-output"><figcaption>a 创建 b，并等待 b 结束</figcaption><pre tabindex="0" aria-label="单个子进程的事件输出"><code>0 a+
0 a-&gt;b
6      b+
6      b-
6 a&lt;-b</code></pre></figure><dl class="api-program-modes"><div><dt><code>a+</code></dt><dd>初始进程 a 开始执行动作。</dd></div><div><dt><code>a-&gt;b</code></dt><dd>a 创建子进程 b。b 从创建后开始休眠。</dd></div><div><dt><code>b+</code></dt><dd>b 的休眠结束，开始执行自己的动作；不表示 b 到这一刻才被创建。</dd></div><div><dt><code>b-</code></dt><dd>b 即将退出。</dd></div><div><dt><code>a&lt;-b</code></dt><dd>a 的 wait 已返回，取得 b 的终止状态。</dd></div></dl><p>这里 b+、b-、a&lt;-b 都显示 6 秒，仍有先后关系：b 的休眠先结束，再退出，最后 a 的等待返回。时间显示到整数秒，不代表这些事件同时发生。相同源码的实际调度顺序和时间仍可能变化。</p></section>
            </div>
          </div>
        </section>
      </div>
    </main>
    <footer><a href="process-api.html">返回进程 API 知识页</a><a href="#top">回到页首 ↑</a></footer>
  </div>`;
document.title = '进程 API 作业 Process API Homework · OSLab';
const apiFileStages = [
  {record:'', actor:null, closed:false, action:'fork 已完成。父子各有一个 fd，引用同一个打开文件描述，文件偏移为 0。'},
  {record:'parent: 0\n', actor:'parent', closed:false, action:'父进程从偏移 0 写入 parent: 0 和换行，共 10 字节；共享偏移变为 10。'},
  {record:'child: 0\n', actor:'child', closed:false, action:'子进程使用更新后的偏移 10，写入 child: 0 和换行，共 9 字节；共享偏移变为 19，没有覆盖父进程的记录。'},
  {record:'', actor:'parent', closed:true, action:'父进程关闭自己的 fd，父进程到内核对象的引用被移除。子进程的 fd 仍有效，共享偏移仍为 19。'},
  {record:'child: 1\n', actor:'child', closed:true, action:'子进程继续从偏移 19 写入 child: 1 和换行，共 9 字节；共享偏移变为 28。父进程关闭 fd 没有关闭子进程的 fd。'},
];
let apiFileStage = 0;
let apiFileTimer = null;
const stopApiFilePlayback = () => {
  clearInterval(apiFileTimer);
  apiFileTimer = null;
  const button = document.querySelector('[data-api-file-control="play"]');
  button.setAttribute('aria-label', '播放写入过程');
  button.title = '播放写入过程';
  button.firstElementChild.textContent = '▶';
};
const renderApiFileStage = () => {
  const stage = apiFileStages[apiFileStage];
  const content = apiFileStages.slice(0, apiFileStage + 1).map(item => item.record).join('');
  document.querySelector('#api-file-content').textContent = content || '（空文件）';
  document.querySelector('#api-file-offset').textContent = String(new TextEncoder().encode(content).length);
  document.querySelector('#api-file-action').textContent = stage.action;
  document.querySelector('#api-file-progress').textContent = `${apiFileStage} / 4`;
  for (const actor of ['parent', 'child']) {
    const node = document.querySelector(`#api-file-${actor}`);
    node.classList.toggle('api-file-active', stage.actor === actor);
    node.classList.toggle('api-file-closed', actor === 'parent' && stage.closed);
    node.querySelector('strong').textContent = actor === 'parent' && stage.closed ? 'fd：已关闭' : 'fd：已打开';
    node.querySelector('small').textContent = actor === 'parent' && stage.closed ? '此进程的引用已移除' : '引用下方同一个内核对象';
  }
  document.querySelector('[data-api-file-control="next"]').disabled = apiFileStage === apiFileStages.length - 1;
};
const advanceApiFileStage = () => {
  if (apiFileStage < apiFileStages.length - 1) apiFileStage++;
  renderApiFileStage();
  if (apiFileStage === apiFileStages.length - 1) stopApiFilePlayback();
};
const apiPracticeTabs = [...document.querySelectorAll('.practice-tabs [role="tab"]')];
const selectApiPracticeView = panelId => {
  if (panelId !== 'practice-view') stopApiFilePlayback();
  apiPracticeTabs.forEach(tab => {
    const selected = tab.getAttribute('aria-controls') === panelId;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
};
const apiPracticeAnchor = hash => {
  const target = document.getElementById(hash.slice(1));
  const panel = target?.closest('[role="tabpanel"]');
  if (panel) selectApiPracticeView(panel.id);
  if (target?.matches('details')) target.open = true;
  return target;
};
apiPracticeTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    const panelId = tab.getAttribute('aria-controls');
    selectApiPracticeView(panelId);
    if (location.hash !== `#${panelId}`) history.pushState(null, '', `#${panelId}`);
  });
  tab.addEventListener('keydown', event => {
    const next = {ArrowRight:(index + 1) % apiPracticeTabs.length, ArrowLeft:(index + apiPracticeTabs.length - 1) % apiPracticeTabs.length, Home:0, End:apiPracticeTabs.length - 1}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    apiPracticeTabs[next].focus();
    apiPracticeTabs[next].click();
  });
});
document.querySelector('#root').addEventListener('click', async event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) apiPracticeAnchor(link.getAttribute('href'));
  const fileControl = event.target.closest('[data-api-file-control]');
  if (fileControl) {
    const action = fileControl.dataset.apiFileControl;
    if (action === 'reset') {
      stopApiFilePlayback();
      apiFileStage = 0;
      renderApiFileStage();
    } else if (action === 'next') {
      stopApiFilePlayback();
      advanceApiFileStage();
    } else if (apiFileTimer !== null) {
      stopApiFilePlayback();
    } else {
      if (apiFileStage === apiFileStages.length - 1) apiFileStage = 0;
      advanceApiFileStage();
      if (apiFileStage < apiFileStages.length - 1) {
        apiFileTimer = setInterval(advanceApiFileStage, 2000);
        fileControl.setAttribute('aria-label', '暂停写入过程');
        fileControl.title = '暂停写入过程';
        fileControl.firstElementChild.textContent = 'Ⅱ';
      }
    }
  }
  const stageButton = event.target.closest('[data-api-stage]');
  if (stageButton) {
    const stage = apiTreeStages[Number(stageButton.dataset.apiStage)];
    document.querySelector('#api-tree-stage').innerHTML = apiPracticeTree(stage.parents);
    document.querySelector('#api-tree-action').textContent = stage.action;
    document.querySelectorAll('[data-api-stage]').forEach(button => button.setAttribute('aria-pressed', String(button === stageButton)));
  }
  const download = event.target.closest('[data-download-source]');
  if (download) {
    const index = Number(download.dataset.downloadSource);
    const url = URL.createObjectURL(new Blob([`${API_PRACTICE_SOURCES[index]}\n`], {type:'text/plain;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${API_CODE_PRACTICE[index].file}.c`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const sourceButton = event.target.closest('[data-copy-source]');
  if (sourceButton) {
    const code = sourceButton.closest('.api-source').querySelector('pre');
    try {
      await navigator.clipboard.writeText(`${code.textContent}\n`);
      sourceButton.title = '已复制源码';
      sourceButton.setAttribute('aria-label', '已复制源码');
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      sourceButton.title = '源码已选中，可复制';
      sourceButton.setAttribute('aria-label', '源码已选中，可复制');
    }
  }
  const button = event.target.closest('[data-practice-copy]');
  if (!button) return;
  const command = button.previousElementSibling.textContent;
  try {
    await navigator.clipboard.writeText(command);
    button.title = '已复制';
    button.setAttribute('aria-label', '已复制命令');
  } catch {
    const range = document.createRange();
    range.selectNodeContents(button.previousElementSibling);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.title = '命令已选中，可复制';
    button.setAttribute('aria-label', '命令已选中，可复制');
  }
});
window.addEventListener('hashchange', () => {
  const target = apiPracticeAnchor(location.hash);
  if (target) target.scrollIntoView({behavior:'instant'});
});
apiPracticeAnchor(location.hash);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopApiFilePlayback();
});