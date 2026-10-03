const PROCESS_HOMEWORK_TASKS = [
  {title: '纯计算进程与 CPU 利用率', focus: '两个进程 · 纯计算', args: '-l 5:100,5:100', steps: ['建立两个进程，每个进程包含五条计算指令，不发起 I/O。先列出指令，预测两个进程的运行顺序。', '用同一命令加 -c -p，逐行检查 CPU 是否执行动作，以及每个进程何时完成。', '分别统计总时间、CPU 忙碌时间和空闲时间，再与末尾统计核对。'], observation: '记录两个进程的完成时刻和 CPU 利用率。说明没有 I/O 等待时，CPU 是否仍会出现空闲，以及你的判断依据。'},
  {title: '计算任务之后的 I/O 等待', focus: '四条计算指令 · 一次 I/O', args: '-l 4:100,1:0', steps: ['进程 0 包含四条计算指令，进程 1 发起一次 I/O。使用默认的切换与 I/O 完成策略，先预测执行记录。', '加 -c -p 运行，分别标出计算、发起 I/O、等待服务和处理 I/O 完成的时间单位。', '记录两个进程各自的完成时刻，并检查等待 I/O 期间是否还有可运行的计算进程。'], observation: '记录总时间、CPU 忙碌时间和 I/O 忙碌时间。说明一次 I/O 请求为什么不只包含服务等待，还需要发起和完成处理两个 CPU 动作。'},
  {title: '改变进程顺序', focus: '任务不变 · 交换输入顺序', args: '-l 1:0,4:100', compareArgs: '-l 4:100,1:0', steps: ['分别运行本题的两条命令：一次先列 I/O 进程，一次先列计算进程。两者的任务组成相同，只交换进程输入顺序。', '分别加 -c -p，标出 I/O 的服务区间与计算指令的执行区间。', '对照哪些时间单位中 CPU 与 I/O 同时忙碌，记录两个进程全部完成所需的时间。'], observation: '并列记录两种顺序的总时间和 CPU 利用率。用具体执行区间说明计算是否填补了 I/O 等待期间的 CPU 空闲。'},
  {title: '等待期间不切换进程', focus: '阻塞时的切换规则', args: '-l 1:0,4:100 -S SWITCH_ON_END', steps: ['进程 0 发起一次 I/O，进程 1 包含四条计算指令。明确使用 SWITCH_ON_END，I/O 完成策略保持默认值。', '先预测进程 0 阻塞后，进程 1 何时获得 CPU；再加 -c -p 查看执行记录。', '逐行记录等待期间两个进程的状态，统计 CPU 空闲的时间单位。'], observation: '记录进程 1 首次运行的时刻、总完成时间和 CPU 利用率。区分“存在就绪进程”与“切换规则已经允许它运行”。'},
  {title: '发起 I/O 后切换进程', focus: 'SWITCH_ON_IO 与 SWITCH_ON_END', args: '-l 1:0,4:100 -S SWITCH_ON_IO', compareArgs: '-l 1:0,4:100 -S SWITCH_ON_END', steps: ['分别运行本题的两条命令，保持进程组成和 I/O 完成策略不变，只改变 -S。', '两条命令都加 -c -p，记录进程 0 发起 I/O 后进程 1 的首次运行时刻。', '标出 CPU 空闲区间和 I/O 服务区间，比较两种规则下计算与 I/O 是否重叠。'], observation: '记录两种规则的总完成时间与 CPU 利用率。结合阻塞后的具体状态和运行时刻，解释切换规则为什么影响等待期间的 CPU 使用。'},
  {title: 'I/O 完成后等待调度', focus: '四个进程 · IO_RUN_LATER', args: '-l 3:0,5:100,5:100,5:100 -I IO_RUN_LATER', steps: ['进程 0 发起三次 I/O，其余三个进程各有五条计算指令。使用默认 SWITCH_ON_IO，并明确指定 IO_RUN_LATER。', '加 -c -p，记录进程 0 每次 I/O 完成的时刻，以及恢复就绪后何时再次执行 CPU 动作。', '找出进程 0 等待运行期间占用 CPU 的进程，并标出下一次 I/O 的发起时刻。'], observation: '列出每次 I/O 完成、完成处理及下一次请求的时刻。说明恢复就绪是否等于立即运行，以及其他计算进程如何影响请求之间的间隔。'},
  {title: 'I/O 完成后优先运行', focus: 'IO_RUN_IMMEDIATE 与 IO_RUN_LATER', args: '-l 3:0,5:100,5:100,5:100 -I IO_RUN_IMMEDIATE', compareArgs: '-l 3:0,5:100,5:100,5:100 -I IO_RUN_LATER', steps: ['分别运行本题的两条命令，保持四个进程的指令和 SWITCH_ON_IO 不变，只改变 -I。', '两条命令都加 -c -p，记录进程 0 每次 I/O 完成后的 CPU 执行动作，以及其他进程是否从运行回到就绪。', '比较相邻 I/O 请求之间的间隔、CPU 空闲时间和全部进程完成的时刻。'], observation: '并列记录两种完成策略的总时间、CPU 利用率和 I/O 利用率。结合完成事件后的进程选择，解释下一次 I/O 请求为何可能更早发起。'},
  {title: '随机任务与规则组合', focus: '固定种子 · 四种策略组合', args: '-l 3:50,3:50 -s 1', steps: ['先固定 -s 1，记录两个进程实际生成的指令；3:50 表示每个基本操作有 50% 概率为计算，不保证每个进程的计算操作恰好占一半。', '保持 -l 和 -s 不变，分别组合 SWITCH_ON_END、SWITCH_ON_IO 与 IO_RUN_LATER、IO_RUN_IMMEDIATE，得到四组运行条件。每组加 -c -p 核对。', '记录四组结果后，再用另一种子重复整组比较。每个种子内保持指令相同，不把不同指令序列的结果当成只有策略变化。'], observation: '按种子和策略记录指令序列、总时间、CPU 与 I/O 利用率。找出造成差异的具体阻塞、切换或完成事件，说明任务组成与策略各自改变了什么。'},
];

const homeworkHeader = wikiHeader('process', [
  {href: '#parameters', title: '参数'},
  {href: '#output', title: '输出'},
  {href: '#questions', title: '作业'},
]);

document.querySelector('#root').innerHTML = `
  <div class="page hw-page api-hw-page" id="top">
    ${homeworkHeader}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 进程 / 作业</p>
        <h1 id="page-title">进程作业 <span>Process Homework</span></h1>
        <p class="lead">观察进程在计算、I/O 等待和切换期间的状态变化。</p>
        <p class="definition"><code>process-run.py</code> 根据进程指令和调度参数，计算各时间单位的进程状态、CPU 动作和 I/O 请求数量。进程等待 I/O 时不能执行下一条指令；此时 CPU 是否运行其他就绪进程，取决于切换规则。</p>
        <dl class="hw-meta"><div><dt>运行环境</dt><dd>Ubuntu 22.04 · Python 3</dd></div><div><dt>依赖</dt><dd>Python 标准库</dd></div></dl>
        <p class="hw-back"><a class="inline-link" href="index.html">进程：状态转换与上下文切换</a></p>
        <nav class="api-hw-outline" aria-label="作业分组"><a href="#parameters"><span>01</span><strong>运行与参数</strong><small>指令与调度条件</small></a><a href="#output"><span>02</span><strong>运行结果</strong><small>状态与时间记录</small></a><a href="#questions"><span>03</span><strong>进程实验</strong><small>8 项独立任务</small></a></nav>
      </section>

      <section class="hw-section" id="parameters" aria-labelledby="parameters-title">
        <div class="api-hw-section-heading"><p class="section-index">01 / PARAMETERS</p><h2 id="parameters-title">运行命令与参数</h2></div>
        <p>在 <code>process-run.py</code> 所在目录执行。第一条命令列出进程指令；第二条计算执行记录并输出统计信息。</p>
        <pre><code>python3 process-run.py -l 5:100,5:100\npython3 process-run.py -l 5:100,5:100 -c -p</code></pre>
        <h3>进程描述格式 <code>-l X:Y</code></h3>
        <dl class="hw-argument-parts">
          <div><dt><code>X</code> 操作数量</dt><dd>生成的基本操作数量；每个基本操作为计算或 I/O 请求。</dd></div>
          <div><dt><code>Y</code> 计算概率</dt><dd>每个基本操作为计算的概率，单位为百分比；其余概率对应 I/O 请求。</dd></div>
        </dl>
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
        <dl class="hw-rules">
          <div><dt><code>SWITCH_ON_IO</code></dt><dd>进程发起 I/O 后阻塞，其他就绪进程可以获得 CPU；当前进程完成时也会切换。</dd></div>
          <div><dt><code>SWITCH_ON_END</code></dt><dd>发起 I/O 后不切换到其他就绪进程，CPU 可能在等待期间空闲；完成事件后的选择还受 <code>-I</code> 控制。</dd></div>
          <div><dt><code>IO_RUN_LATER</code></dt><dd>I/O 完成的进程恢复就绪，是否立即运行取决于当前运行者和切换规则。</dd></div>
          <div><dt><code>IO_RUN_IMMEDIATE</code></dt><dd>I/O 完成后优先选择该进程；若另一个进程正在运行，它会回到就绪状态。</dd></div>
        </dl>
      </section>

      <section class="hw-section" id="output" aria-labelledby="output-title">
        <div class="api-hw-section-heading"><p class="section-index">02 / TRACE</p><h2 id="output-title">运行结果与状态含义</h2></div>
        <p>每行对应一个模拟时间单位。<code>RUN:cpu</code> 表示计算，<code>RUN:io</code> 表示发起 I/O，<code>RUN:io_done</code> 表示处理 I/O 完成。三者都计入 CPU 忙碌时间。阻塞表示进程正在等待 I/O 完成，暂时不能执行 CPU 指令。</p>
        <p>时间后的 <code>*</code> 表示该时刻发生 I/O 完成事件。CPU 列的 <code>1</code> 表示本时间单位执行了一个 CPU 动作；I/O 列是仍在服务的请求数量，不是进程编号。</p>
        <p>CPU 利用率是 CPU 忙碌时间占总时间的比例；I/O 利用率是至少有一个请求正在服务的时间占总时间的比例。计算与 I/O 可以同时进行，因此两项利用率不必相加等于 100%。</p>
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

      <section class="hw-section" id="questions" aria-labelledby="questions-title">
        <div class="api-hw-section-heading"><p class="section-index">03 / HOMEWORK</p><h2 id="questions-title">作业：比较指令顺序、切换规则与 I/O 完成策略</h2></div>
        <p>各组先记录进程状态、总完成时间和 CPU 利用率，再用同一参数加 <code>-c -p</code> 核对。省略的参数采用上表默认值。</p>
        <ol class="hw-questions api-hw-coding-tasks" id="process-tasks">${PROCESS_HOMEWORK_TASKS.map((task, index) => `<li><header class="api-hw-task-heading"><span class="api-hw-task-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><p class="api-hw-task-api">${task.focus}</p><h3>${task.title}</h3></div></header><pre><code>python3 process-run.py ${task.args}${task.compareArgs ? `\npython3 process-run.py ${task.compareArgs}` : ''}</code></pre><dl class="api-hw-task-body"><div><dt>实验要求</dt><dd><ul>${task.steps.map(step => `<li>${step}</li>`).join('')}</ul></dd></div><div><dt>记录与解释</dt><dd>${task.observation}</dd></div></dl></li>`).join('')}</ol>
        <p>随机任务的对照需保持种子和指令序列一致。每次只改变一个条件，才能区分是任务顺序、阻塞时的切换规则，还是 I/O 完成后的选择导致结果变化。</p>
      </section>
    </main>
    <footer><a href="index.html">返回进程知识页</a><a href="#top">回到页首 ↑</a></footer>
  </div>`;
document.title = '进程作业 Process Homework · OSLab';