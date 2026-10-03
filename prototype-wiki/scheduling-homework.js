const SCHEDULING_HOMEWORK_GROUPS = [
  {id: 'fifo-sjf', title: 'FIFO 与 SJF：作业长度和执行顺序', tasks: [
    {number: '01', title: '相同长度的三个作业', focus: '同时到达 · 长度均为 200', commands: ['-l 200,200,200 -p FIFO', '-l 200,200,200 -p SJF'], steps: ['三个作业都在时刻 0 到达，编号按输入顺序为 0、1、2。分别预测 FIFO 和 SJF 的执行顺序。', '写出每个作业首次运行与完成的时刻，计算响应时间、周转时间和等待时间。', '两条命令分别加 -c 核对，记录单个作业的数值与三项平均值。'], observation: '比较两种策略的执行顺序和统计。说明时长并列时的输入顺序为何重要，以及相同长度是否让短任务优先改变选择。'},
    {number: '02', title: '不同长度的三个作业', focus: '100、200、300 · 两种输入顺序', commands: ['-l 100,200,300 -p FIFO', '-l 100,200,300 -p SJF', '-l 300,200,100 -p FIFO', '-l 300,200,100 -p SJF'], steps: ['先按 100、200、300 输入作业，再按 300、200、100 输入；总 CPU 需求保持相同。分别使用 FIFO 和 SJF。', '每组先预测执行顺序和每个作业的响应、周转时间，再加 -c 检查。', '按输入顺序与策略记录四组平均值。比较同一组作业重排后，哪个长度的作业先获得 CPU。'], observation: '区分任务编号与任务长度，比较时按长度识别同一类任务。解释输入顺序已经从短到长时与长任务先入队时，FIFO 和 SJF 的结果分别如何变化。'},
    {number: '03', title: '增加作业长度时的首次响应', focus: '长度成倍增加 · SJF', commands: ['-l 10,20,30 -p SJF', '-l 20,40,60 -p SJF', '-l 40,80,120 -p SJF'], steps: ['保持三个作业的长短关系和同时到达条件不变，分别使用三组长度。', '先预测每个作业第一次运行的时刻，再加 -c 核对响应时间。', '记录三组平均响应时间，比较长度放大比例与等待首次运行时间的变化。'], observation: '从执行顺序解释后面的作业必须等待哪些 CPU 工作完成。区分“短任务优先”与“所有作业都能立即响应”。'},
  ]},
  {id: 'rr', title: 'RR：时间片与首次响应', tasks: [
    {number: '04', title: '时间片为 1 的轮转调度', focus: '相同长度与不同长度 · RR', commands: ['-l 200,200,200 -p RR -q 1', '-l 100,200,300 -p RR -q 1'], steps: ['两组作业都在时刻 0 到达，初始入队顺序按输入编号；时间片固定为 1。', '先写出第一轮各作业首次获得 CPU 的时刻，再推导每个作业的完成时刻和累计就绪等待。', '分别加 -c 核对。执行轨迹较长时，保留第一轮、各作业完成附近的片段及最终统计，并注明截取范围。'], observation: '比较两组任务的响应时间与周转时间。说明首次获得 CPU 较早为什么不等于全部 CPU 工作较早完成，等待时间为何还包含后续轮次的排队。'},
    {number: '05', title: '时间片增大时的响应变化', focus: '固定任务 · 改变 q 和作业数量', commands: ['-l 100,200,300 -p RR -q 1', '-l 100,200,300 -p RR -q 5', '-l 100,200,300 -p RR -q 10', '-l 100,200,300 -p RR -q 50'], steps: ['保持任务长度和初始队列顺序不变，只改变时间片；记录每个作业第一次获得 CPU 的时刻。', '分别加 -c 核对响应时间与平均值。比较排在队尾的作业，在首次运行前等待了多少个时间片。', '再改变作业数量 N，使排在目标作业之前的每个作业都至少需要一个完整时间片。推导零切换开销下，队尾作业首次响应时间的上界，并用自选列表验证。'], observation: '说明表达式需要哪些前提：同时到达、就绪队列顺序固定、时间片为 q、切换开销取零。若前面的作业不足一个时间片就完成，解释实际响应为何可能低于上界。'},
  ]},
  {id: 'comparison', title: '跨策略比较：何时指标相同', tasks: [
    {number: '06', title: 'FIFO 与 SJF 的周转时间何时相同', focus: '任务组成 · 排队顺序', commands: ['-l 2,4,6 -p FIFO', '-l 2,4,6 -p SJF', '-l 6,4,2 -p FIFO', '-l 6,4,2 -p SJF'], steps: ['对照同一组长度的两种输入顺序，分别预测 FIFO 和 SJF 的完成顺序。', '加 -c 后逐个比较周转时间，同时记录平均值；不要只看总 CPU 执行时间。', '另构造全部作业等长的一组输入，以及按长度非递减排列的一组输入，验证两种策略的结果。'], observation: '用作业长度与输入顺序描述结果相同的条件。区分“每个作业的周转时间相同”“平均周转时间相同”和“全部作业完成时间相同”。'},
    {number: '07', title: 'SJF 与 RR 的响应时间何时相同', focus: '相同输入 · 比较首次运行', commands: ['-l 2,4,6 -p SJF', '-l 2,4,6 -p RR -q 1', '-l 2,4,6 -p RR -q 6', '-l 3,3,3 -p SJF', '-l 3,3,3 -p RR -q 3'], steps: ['对 2、4、6 的列表，分别运行 SJF 和两种时间片的 RR；再对三个等长作业运行后两条命令。', '先计算各作业的首次运行时刻，再加 -c 比较每个作业的响应时间与平均值。', '根据结果提出任务长度、初始顺序和时间片需要满足的条件；自选一组输入检验，再调整顺序或时间片寻找不满足条件的情况。'], observation: '按首次分配 CPU 的时刻解释相同或不同的原因，不用完成时刻代替响应时间。明确你的结论比较的是单个作业还是平均指标。'},
  ]},
];

const schedulingHomeworkHeader = wikiHeader('fcfs', [
  {href: '#parameters', title: '运行与参数'},
  {href: '#metrics', title: '指标与输出'},
  {href: '#tasks', title: '作业'},
]);

document.querySelector('#root').innerHTML = `
  <div class="page hw-page api-hw-page scheduling-hw-page" id="top">
    ${schedulingHomeworkHeader}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 调度 / 作业</p>
        <h1 id="page-title">CPU 调度基础作业 <span>Scheduling Homework</span></h1>
        <p class="lead">比较执行顺序与时间片如何改变响应、周转和等待时间。</p>
        <p class="definition">这里的作业是一个待执行的 CPU 任务，需求时长是完成它所需的 CPU 执行时间。<code>scheduler.py</code> 按 FIFO（先来先服务）、SJF（最短任务优先）或 RR（时间片轮转）计算执行顺序与统计。作业编号按输入列表从 0 开始，不表示需求长短。</p>
        <dl class="hw-meta"><div><dt>运行环境</dt><dd>Ubuntu 22.04 · Python 3</dd></div><div><dt>调度条件</dt><dd>单核 · 全部在时刻 0 到达 · 无 I/O</dd></div></dl>
        <nav class="scheduling-hw-topics" aria-label="相关调度知识"><a class="inline-link" href="fcfs.html">先来先服务</a><a class="inline-link" href="sjf.html">最短任务优先</a><a class="inline-link" href="srtf.html">最短剩余时间优先</a><a class="inline-link" href="round-robin.html">时间片轮转</a></nav>
        <nav class="api-hw-outline" aria-label="作业分组"><a href="#parameters"><span>01</span><strong>运行与参数</strong><small>作业列表与策略</small></a><a href="#metrics"><span>02</span><strong>指标与输出</strong><small>三类时间的区别</small></a><a href="#tasks"><span>03</span><strong>调度实验</strong><small>7 项独立任务</small></a></nav>
      </section>

      <section class="hw-section" id="parameters" aria-labelledby="parameters-title">
        <div class="api-hw-section-heading"><p class="section-index">01 / PARAMETERS</p><h2 id="parameters-title">作业列表、调度策略与时间片</h2></div>
        <p>在程序所在目录执行。第一条命令给出作业列表，第二条以相同参数计算执行轨迹和统计：</p>
        <pre><code>cd ~/ostep-homework/cpu-sched\npython3 scheduler.py -l 6,2,4 -p SJF\npython3 scheduler.py -l 6,2,4 -p SJF -c</code></pre>
        <h3>作业列表 <code>-l</code></h3>
        <dl class="hw-argument-examples">
          <div><dt><code>6,2,4</code></dt><dd><strong>三个作业的 CPU 需求时长</strong><p>作业 0 需要 6 个时间单位，作业 1 需要 2 个，作业 2 需要 4 个。它们全部在时刻 0 到达；列表位置不是到达时间。输入顺序不等于执行顺序，实际执行顺序由调度策略决定。</p></dd></div>
        </dl>
        <h3>策略名称 <code>-p</code></h3>
        <dl class="hw-rules">
          <div><dt><code>FIFO</code> / 先来先服务</dt><dd>按列表的初始顺序运行，每个作业连续执行到完成。这里的 FIFO 对应 FCFS；默认策略为 FIFO。</dd></div>
          <div><dt><code>SJF</code> / 最短任务优先</dt><dd>按 CPU 需求时长从短到长运行，时长并列时保持输入顺序；已运行的作业不因另一个作业更短而被抢占。</dd></div>
          <div><dt><code>RR</code> / 时间片轮转</dt><dd>按就绪队列轮转，一次最多运行 q 个时间单位；未完成的作业回到队尾，完成者不再入队。</dd></div>
          <div><dt><code>-q</code> / RR 时间片</dt><dd>正整数，默认 1，仅用于 RR。时间片限制一次连续执行的时长，不是整个作业的 CPU 需求。</dd></div>
        </dl>
        <h3>其他参数与输入条件</h3>
        <dl class="hw-rules">
          <div><dt><code>-c</code></dt><dd>显示执行轨迹、逐作业统计和平均值。先预测，再保持相同参数加 -c 核对。</dd></div>
          <div><dt><code>-s</code></dt><dd>随机种子，默认 0。未指定 -l 时，相同种子与生成参数可复现相同的作业列表。</dd></div>
          <div><dt><code>-j</code> 与 <code>-m</code></dt><dd>随机生成的作业数量与最大时长，默认 3 和 10。时长为 1 到 m 的整数；例如 <code>-s 1 -j 4 -m 20</code>。</dd></div>
          <div><dt>正时长与零切换开销</dt><dd>使用至少一个作业，每个时长为正数，随机参数 -j、-m 为正整数。CPU 切换开销取零，所有任务只有 CPU 工作。</dd></div>
        </dl>
      </section>

      <section class="hw-section" id="metrics" aria-labelledby="metrics-title">
        <div class="api-hw-section-heading"><p class="section-index">02 / METRICS</p><h2 id="metrics-title">响应、周转与累计等待</h2></div>
        <dl class="hw-argument-examples">
          <div><dt>响应时间</dt><dd><strong>到达 → 第一次运行</strong><p>从到达时刻到首次获得 CPU 的间隔。所有作业在 0 到达，因此数值就是第一次运行的时刻。</p></dd></div>
          <div><dt>周转时间</dt><dd><strong>到达 → 全部工作完成</strong><p>完成时刻减去到达时刻。RR 中第一次时间片结束不等于作业完成；需要累计执行全部 CPU 需求。</p></dd></div>
          <div><dt>等待时间</dt><dd><strong>所有就绪排队时间之和</strong><p>包含首次运行前以及后续轮次中的等待。无 I/O 时，等待时间等于周转时间减去 CPU 需求；不一定等于响应时间。</p></dd></div>
        </dl>
        <p>以下两次运行使用同一组作业，CPU 总需求为 12。输出中的“秒”按输入时长计算，是模拟时间单位，不是命令实际运行耗时。下列节选保留完整执行轨迹与最终统计。</p>
        <div class="api-hw-example"><div>
          <h3>SJF / 按时长选择</h3>
          <pre><code>python3 scheduler.py -l 6,2,4 -p SJF -c</code></pre>
          <pre class="api-hw-terminal" aria-label="SJF 实际运行输出节选"><code>执行轨迹：
  [ 时间   0 ] 运行作业 1，共 2.00 秒（在 2.00 完成）
  [ 时间   2 ] 运行作业 2，共 4.00 秒（在 6.00 完成）
  [ 时间   6 ] 运行作业 0，共 6.00 秒（在 12.00 完成）

最终统计：
  作业   1 -- 响应时间：0.00  周转时间：2.00  等待时间：0.00
  作业   2 -- 响应时间：2.00  周转时间：6.00  等待时间：2.00
  作业   0 -- 响应时间：6.00  周转时间：12.00  等待时间：6.00

  平均值 -- 响应时间：2.67  周转时间：6.67  等待时间：2.67</code></pre>
          <p>每个作业首次运行后连续执行到完成，所以这里的等待时间与响应时间相同。</p>
        </div><div>
          <h3>RR / 时间片为 2</h3>
          <pre><code>python3 scheduler.py -l 6,2,4 -p RR -q 2 -c</code></pre>
          <pre class="api-hw-terminal" aria-label="RR 实际运行输出节选"><code>执行轨迹：
  [ 时间   0 ] 运行作业   0，共 2.00 秒
  [ 时间   2 ] 运行作业   1，共 2.00 秒（在 4.00 完成）
  [ 时间   4 ] 运行作业   2，共 2.00 秒
  [ 时间   6 ] 运行作业   0，共 2.00 秒
  [ 时间   8 ] 运行作业   2，共 2.00 秒（在 10.00 完成）
  [ 时间  10 ] 运行作业   0，共 2.00 秒（在 12.00 完成）

最终统计：
  作业   0 -- 响应时间：0.00  周转时间：12.00  等待时间：6.00
  作业   1 -- 响应时间：2.00  周转时间：4.00  等待时间：2.00
  作业   2 -- 响应时间：4.00  周转时间：10.00  等待时间：6.00

  平均值 -- 响应时间：2.00  周转时间：8.67  等待时间：4.67</code></pre>
          <p>作业 0 在时刻 0 首次运行，但直到 12 才完成，中间累计等待 6。首次响应、全部完成和后续排队需要分别记录。</p>
        </div></div>
      </section>

      <section class="hw-section" id="tasks" aria-labelledby="tasks-title">
        <div class="api-hw-section-heading"><p class="section-index">03 / EXPERIMENTS</p><h2 id="tasks-title">调度实验：任务组成、时间片与策略比较</h2></div>
        <p>每条命令先用于列出作业并预测结果，再保持参数不变加 <code>-c</code> 核对。各任务分别记录逐作业指标和平均值；对照运行时只改变题目指定的条件。</p>
        ${SCHEDULING_HOMEWORK_GROUPS.map(group => `<section class="scheduling-hw-group" id="${group.id}" aria-labelledby="${group.id}-title"><h3 id="${group.id}-title">${group.title}</h3>${group.id === 'comparison' ? '<p>所有作业同时到达时，SJF 首先选择最短任务。它运行后剩余时间只会减少，又没有新任务到达；因此，在同长任务按相同顺序处理的条件下，SRTF 与 SJF 具有相同执行顺序。若有短任务在运行途中到达，是否抢占会改变结果，参见<a class="inline-link" href="srtf.html">最短剩余时间优先的到达场景</a>。</p>' : ''}<ol class="hw-questions api-hw-coding-tasks" start="${Number(group.tasks[0].number)}">${group.tasks.map(task => `<li><header class="api-hw-task-heading"><span class="api-hw-task-number" aria-hidden="true">${task.number}</span><div><p class="api-hw-task-api">${task.focus}</p><h3>${task.title}</h3></div></header><pre><code>${task.commands.map(args => `python3 scheduler.py ${args}`).join('\n')}</code></pre><dl class="api-hw-task-body"><div><dt>实验要求</dt><dd><ul>${task.steps.map(step => `<li>${step}</li>`).join('')}</ul></dd></div><div><dt>记录与解释</dt><dd>${task.observation}</dd></div></dl></li>`).join('')}</ol></section>`).join('')}
      </section>
    </main>
    <footer><a href="fcfs.html">先来先服务</a><a href="sjf.html">最短任务优先</a><a href="srtf.html">最短剩余时间优先</a><a href="round-robin.html">时间片轮转</a><a href="#top">回到页首 ↑</a></footer>
  </div>`;

document.querySelector('.article-location').innerHTML = '<span>CPU 虚拟化</span><span aria-hidden="true">/</span>CPU 调度基础作业';
document.querySelector('.knowledge-nav [aria-current="page"]').removeAttribute('aria-current');
for (const topic of ['fcfs', 'sjf', 'srtf', 'roundRobin']) {
  document.querySelector(`.knowledge-nav a[href="${WIKI_PAGES[topic].href}"]`).classList.add('scheduling-homework-topic');
}
document.title = 'CPU 调度基础作业 Scheduling Homework · OSLab';