const schedulingPractice = [
  {title:'等长作业的响应与周转', topic:'原题 1 / SJF 与 FIFO', question:'使用 SJF 和 FIFO 运行三个长度均为 200 的作业，计算每个作业的响应时间和周转时间。', runs:['equal-sjf','equal-fifo'], steps:[
    ['确定两种策略的执行顺序',[
      '三个作业的长度都是 200，编号按输入位置依次为 0、1、2。',
      'FIFO 按输入顺序执行。SJF 遇到相同长度时保持输入顺序，因此两种策略都按作业 0、1、2 执行。'
    ]],
    ['逐作业确定响应和周转',[
      '所有作业在时刻 0 到达，因此响应时间等于首次运行时刻，周转时间等于完成时刻。',
      '作业 0：在 [0,200) 运行，响应为 0，周转为 200。',
      '作业 1：在 [200,400) 运行，响应为 200，周转为 400。',
      '作业 2：在 [400,600) 运行，响应为 400，周转为 600。'
    ]],
    ['分别计算两项平均值',[
      '平均响应 = (0 + 200 + 400) / 3 = 200。',
      '平均周转 = (200 + 400 + 600) / 3 = 400。'
    ]]
  ], conclusion:[
    ['响应结果','FIFO 和 SJF 的响应时间均为：作业 0 是 0，作业 1 是 200，作业 2 是 400；平均为 200。'],
    ['周转结果','FIFO 和 SJF 的周转时间均为：作业 0 是 200，作业 1 是 400，作业 2 是 600；平均为 400。'],
    ['结果相同的原因','两种策略选择的执行顺序相同，每个作业的开始和完成时刻就相同。只有一个 CPU，三个等长作业仍须依次执行。']
  ]},
  {title:'不同长度作业的响应与周转', topic:'原题 2 / 100、200、300', question:'将三个作业的长度改为 100、200、300，使用 SJF 和 FIFO 进行相同的计算。', runs:['ascending-sjf','ascending-fifo'], steps:[
    ['由长度列表确定执行顺序',[
      '作业 0、1、2 的 CPU 需求分别为 100、200、300。三个作业都在时刻 0 到达；这些数值不是到达时刻。',
      '输入已经从短到长排列，所以 FIFO 和 SJF 都按作业 0、1、2 执行。'
    ]],
    ['累计运行时长，确定开始与完成',[
      '作业 0：在 [0,100) 运行，响应为 0，周转为 100。',
      '作业 1：等作业 0 完成后，在 [100,300) 运行，响应为 100，周转为 300。',
      '作业 2：等前两个作业完成后，在 [300,600) 运行，响应为 300，周转为 600。'
    ]],
    ['分别计算两项平均值',[
      '平均响应 = (0 + 100 + 300) / 3 ≈ 133.33。',
      '平均周转 = (100 + 300 + 600) / 3 ≈ 333.33。'
    ]]
  ], conclusion:[
    ['响应结果','两种策略的响应时间均为 0、100、300，分别对应作业 0、1、2；平均为 133.33。'],
    ['周转结果','两种策略的周转时间均为 100、300、600，分别对应作业 0、1、2；平均为 333.33。'],
    ['结果相同的原因','FIFO 的输入顺序恰好就是 SJF 的从短到长顺序。作业长度虽然不同，两种策略仍给出了相同的执行顺序。']
  ]},
  {title:'加入时间片为 1 的 RR', topic:'原题 3 / 首次响应与完成时间', question:'沿用长度为 100、200、300 的作业，加入时间片为 1 的 RR，比较三种策略的响应时间和周转时间。', runs:['ascending-sjf','ascending-fifo','rr-one'], steps:[
    ['由第一轮求 RR 的响应时间',[
      '初始队列依次为作业 0、1、2，时间片为 1。第一轮分别执行 [0,1)、[1,2)、[2,3)。',
      '三者首次获得 CPU 的时刻为 0、1、2，因此平均响应 = (0 + 1 + 2) / 3 = 1。'
    ]],
    ['按队列缩短的三个阶段求完成时刻',[
      '作业 0 完成：前 99 轮共用 297 个时间单位，每个作业已运行 99。作业 0 再运行 [297,298)，累计达到 100，在 298 完成并退出队列。',
      '作业 1 完成：此后作业 1、2 交替运行。作业 1 还需运行 101，最后一个时间片是 [498,499)，所以在 499 完成。',
      '作业 2 完成：到 499 时，作业 2 累计运行了 199，还需 101。它独占 CPU 执行 [499,600)，在 600 完成。'
    ]],
    ['将响应和周转分开比较',[
      '平均响应：RR 为 1；FIFO 和 SJF 均为 133.33。RR 让后两个作业更早首次获得 CPU。',
      '平均周转：RR 为 (298 + 499 + 600) / 3 ≈ 465.67；FIFO 和 SJF 均为 333.33。RR 的前两个作业比这两种策略更晚完成。'
    ]]
  ], conclusion:[
    ['首次响应更早','RR 的平均响应为 1，低于 FIFO 和 SJF 的 133.33。'],
    ['平均周转更长','RR 的平均周转为 465.67，高于 FIFO 和 SJF 的 333.33；作业 0、1、2 分别在 298、499、600 完成。'],
    ['两个指标不同的原因','RR 很快给每个作业分配一次 CPU，但未完成作业仍要在后续轮次等待。第一次运行更早，不代表全部 CPU 工作更早完成。'],
    ['响应不等于累计等待','响应只计算首次运行前的等待；等待时间还包含后续轮次中的排队。']
  ]},
  {title:'FIFO 与 SJF 的周转时间何时相同', topic:'原题 4 / 长度与输入顺序', question:'什么类型的工作负载会使 SJF 与 FIFO 得到相同的周转时间？比较有序、等长和逆序输入。', runs:['ascending-fifo','ascending-sjf','equal-fifo','equal-sjf','reverse-fifo','reverse-sjf'], steps:[
    ['先找执行顺序相同的输入',[
      '输入长度从短到长排列时，FIFO 的输入顺序就是 SJF 的选择顺序。例如 100、200、300，两种策略都按作业 0、1、2 执行。',
      '全部等长也是顺序相同的情况。本题 SJF 对等长作业保持输入顺序。'
    ]],
    ['逆序输入按同一编号逐一比较',[
      '输入 300、200、100 时，作业 0、1、2 的长度分别为 300、200、100。SJF 排序后仍保留这些编号。',
      '作业 0：FIFO 的周转为 300；SJF 的周转为 600。',
      '作业 1：FIFO 的周转为 500；SJF 的周转为 300。',
      '作业 2：FIFO 的周转为 600；SJF 的周转为 100。',
      'FIFO 平均周转 = (300 + 500 + 600) / 3 ≈ 466.67。',
      'SJF 平均周转 = (600 + 300 + 100) / 3 ≈ 333.33。'
    ]],
    ['解释短作业提前为何降低平均周转',[
      '设相邻两个作业的长度为 x、y，且 x > y。原顺序先运行长作业 x，再运行短作业 y。',
      '交换后，短作业比原来提前 x 完成，长作业比原来推迟 y 完成。两者周转时间之和减少 x - y，后面作业的完成时刻不变。',
      '把所有排在短作业前面的长作业移到其后，就得到 SJF 的顺序，并降低平均周转。'
    ]]
  ], conclusion:[
    ['何时逐作业结果相同','所有作业同时到达、长度为正、等长作业的先后顺序相同，且输入已从短到长排列时，FIFO 和 SJF 的每个作业周转时间相同。'],
    ['逆序输入的比较结果','300、200、100 的平均周转：FIFO 为 466.67，SJF 为 333.33。SJF 使短作业更早完成，但作业 0 这个长作业反而更晚完成。'],
    ['全部完成的时刻','两种策略都在 600 完成全部作业，因为总 CPU 需求没有变化。平均周转降低，不等于整组作业更早全部完成。']
  ]},
  {title:'SJF 与 RR 的响应时间何时相同', topic:'原题 5 / 初始顺序与时间片', question:'什么工作负载和时间片长度会使 SJF 与 RR 的响应时间相同？分别比较 2、4、6 的列表和三个长度为 100 的作业。', runs:['small-sjf','small-rr-one','small-rr-four','small-rr-six','equal100-sjf','quantum-hundred'], steps:[
    ['先使两种策略的首次运行顺序一致',[
      '长度为 2、4、6 的作业编号依次为 0、1、2。SJF 按这个顺序运行，RR 的初始队列也按这个顺序排列。',
      '比较同一作业的响应时，不能只比较排序后的第几行；必须保持作业编号对应。'
    ]],
    ['计算 q=4 时的首次运行时刻',[
      '作业 0：两种策略都在 0 开始，响应为 0。',
      '作业 1：作业 0 只需运行 2，小于时间片 4，所以在两种策略下都从 2 开始，响应为 2。',
      '作业 2：作业 1 只需运行 4，在 RR 的第一个时间片内完成，所以在两种策略下都从 2 + 4 = 6 开始，响应为 6。'
    ]],
    ['用其他时间片核对相同条件',[
      '2、4、6，q=1：RR 响应为 0、1、2，与 SJF 的 0、2、6 不同。',
      '2、4、6，q=6：RR 响应仍为 0、2、6，与 SJF 相同；这次三个作业都能一次完成。',
      '100、100、100，q=100：RR 与 SJF 响应均为 0、100、200。'
    ]]
  ], conclusion:[
    ['使所有作业响应相同的条件','RR 的初始顺序与 SJF 一致，并且除了最后一个作业，其他作业都能在一个时间片内完成。这足以使同一编号的作业在两种策略下具有相同响应。'],
    ['时间片不必覆盖最后一个作业','对 2、4、6，q=4 已得到相同响应 0、2、6。最后一个作业自身虽然需要两个时间片，但它在 6 时就已首次运行，后续轮转不改变首次响应。'],
    ['较小时间片的结果','本题 q=1 时，RR 的响应为 0、1、2。后两个作业比 SJF 更早首次运行，但响应不再相同。']
  ]},
  {title:'SJF 中作业长度增加的影响', topic:'原题 6 / 成比例放大长度', question:'使用 SJF 时，作业长度增加会怎样影响响应时间？用 10、20、30，100、200、300 和 1000、2000、3000 三组输入展示趋势。', runs:['scale-ten','ascending-sjf','scale-thousand'], steps:[
    ['固定顺序，明确谁在等待谁',[
      '三组输入都从短到长排列，SJF 始终按作业 0、1、2 执行。',
      '作业 0 无须等待，响应为 0。作业 1 要等作业 0 完成；作业 2 要等作业 0、1 都完成。'
    ]],
    ['逐组累加前面作业的长度',[
      '10、20、30：响应为 0、10、10 + 20 = 30，分别对应作业 0、1、2。',
      '100、200、300：响应为 0、100、100 + 200 = 300，分别对应作业 0、1、2。',
      '1000、2000、3000：响应为 0、1000、1000 + 2000 = 3000，分别对应作业 0、1、2。'
    ]],
    ['分别求平均，核对放大倍数',[
      '10、20、30：平均响应 = (0 + 10 + 30) / 3 ≈ 13.33。',
      '100、200、300：平均响应 = (0 + 100 + 300) / 3 ≈ 133.33。',
      '1000、2000、3000：平均响应 = (0 + 1000 + 3000) / 3 ≈ 1333.33。'
    ]]
  ], conclusion:[
    ['整体放大长度的结果','三组平均响应依次为 13.33、133.33、1333.33。按未舍入值计算，每次将全部长度放大十倍，平均响应也放大十倍。'],
    ['响应增加的原因','顺序不变时，某作业的响应等于它前面所有作业的 CPU 需求之和。前面的作业执行更久，它就要等待更久；第一个作业的响应仍为 0。'],
    ['只增加自身长度的情况','若只增加最后一个作业的长度，且 SJF 顺序不变，它自己的首次响应不会改变。不能仅根据某个作业自身变长，就断定它的响应增加。']
  ]},
  {title:'RR 时间片与最坏首次响应', topic:'原题 7 / N 个作业的上界', question:'RR 的时间片增大时，响应时间怎样变化？给定 N 个同时到达的作业，写出最坏首次响应时间的公式。', runs:['quantum-one','quantum-ten','quantum-fifty','quantum-hundred','quantum-twohundred','four-jobs'], symbols:[['N','同时到达的作业数量。'],['q','时间片长度，即每次连续运行的时长上限。'],['L_j','初始队列中第 j 个作业的 CPU 需求时长，位置从 1 开始。'],['k','目标作业在初始队列中的位置，从 1 到 N。']], steps:[
    ['固定三个等长作业，只改变时间片',[
      '三个作业的长度均为 100，初始队列按作业 0、1、2 排列。',
      'q=1：响应为 0、1、2，平均为 1。',
      'q=10：响应为 0、10、20，平均为 10。',
      'q=50：响应为 0、50、100，平均为 50。',
      'q=100 和 q=200：响应均为 0、100、200，平均均为 100。'
    ]],
    ['累计目标作业前面的首次 CPU 占用',[
      '初始队列中第 k 个作业第一次运行前，前面 k - 1 个作业各运行一次。',
      '第 j 个作业本轮实际运行 min(L_j, q)，即 CPU 需求与时间片长度中较小的值。',
      '目标作业的响应时间，就是前面这 k - 1 次实际运行时长之和。第一个作业前面没有作业，响应为 0。'
    ]],
    ['由队尾位置推导上界并核对实例',[
      '队尾前面有 N - 1 个作业，每个首次占用 CPU 至多 q。因此，队尾响应不超过 (N - 1) × q，其他位置也不会超过这个值。',
      '四个长度为 100 的作业，q=10：响应为 0、10、20、30。队尾达到 (4 - 1) × 10 = 30，因为它前面的三个作业都实际运行了完整时间片。'
    ]]
  ], conclusion:[
    ['最坏首次响应的上界','在所有作业同时到达、初始队列固定、无 I/O、切换开销为零的条件下，任意作业的首次响应不超过 (N - 1) × q。'],
    ['达到上界的条件','目标作业位于队尾，而且前面的 N - 1 个作业都至少需要 q 个时间单位的 CPU。只要其中一个作业提前完成，队尾响应就小于上界。'],
    ['增大时间片的实际影响','固定作业列表和队列顺序，增大 q 不会使首次响应更早。当前面的作业都能在一个时间片内完成时，再增大 q 也不会增加响应；本题 q=100 与 q=200 的平均响应都为 100。']
  ]},
];
const schedulingEscape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const schedulingCommand = command => `<div class="practice-command"><pre><code>${command.split(' ').map(argument => `<span class="practice-command-argument">${schedulingEscape(argument)}</span>`).join(' ')}</code></pre><button type="button" data-practice-copy aria-label="复制命令" title="复制命令"><span class="practice-copy-icon" aria-hidden="true"></span></button></div>`;
const schedulingFlags = run => `-l ${run.list} -p ${run.policy}${run.quantum ? ` -q ${run.quantum}` : ''}`;
const schedulingAverages = run => [1,2,3].map(column => (run.rows.reduce((total, row) => total + row[column], 0) / run.rows.length).toFixed(2));
const schedulingOutput = run => {
  const stats = run.rows.map(([job,response,turnaround,wait]) => `  作业 ${String(job).padStart(3)} -- 响应时间：${response.toFixed(2)}  周转时间：${turnaround.toFixed(2)}  等待时间：${wait.toFixed(2)}`);
  const [response,turnaround,wait] = schedulingAverages(run);
  return `最终统计：\n${stats.join('\n')}\n\n  平均值 -- 响应时间：${response}  周转时间：${turnaround}  等待时间：${wait}`;
};
const schedulingTimeline = run => `<figure class="scheduling-timeline"><figcaption>${run.traceCount ? '首两轮与作业完成区间' : 'CPU 执行区间'}</figcaption><div class="scheduling-segments" tabindex="0" role="region" aria-label="${run.policy} 执行区间">${run.segments.map(([start,job,duration], index) => {
  const previous = run.segments[index - 1];
  const gap = previous && start > previous[0] + previous[2];
  const finished = run.rows.find(row => row[0] === job)[2] === start + duration;
  return `${gap ? '<span class="scheduling-gap">中间轮次省略</span>' : ''}<span class="scheduling-segment scheduling-job-${job}"><strong>作业 ${job}</strong><span>[${start}, ${start + duration})</span><small>${finished ? '在区间末尾完成' : `运行 ${duration}，尚未完成`}</small></span>`;
}).join('')}</div><p class="practice-timeline-note">区间 [a, b) 表示从 a 运行到 b，持续 b - a 个时间单位；区块宽度不代表时长。${run.traceCount ? `完整轨迹有 ${run.traceCount} 条运行记录，以上保留前六条与各作业最后一次运行，省略的轮次不影响下方完整统计。` : ''}</p></figure>`;
const schedulingRun = id => {
  const run = SCHEDULING_PRACTICE_RUNS[id];
  return `<section class="scheduling-run" data-scheduling-run="${id}"><h4>${run.policy}${run.quantum ? ` · q=${run.quantum}` : ''} · ${run.list}</h4>${schedulingCommand(`python3 scheduler.py ${schedulingFlags(run)}`)}${schedulingCommand(`python3 scheduler.py ${schedulingFlags(run)} -c`)}${schedulingTimeline(run)}<div class="practice-table-scroll" tabindex="0" role="region" aria-label="逐作业时间统计"><table><caption>参考统计 · 单位：模拟时间</caption><thead><tr><th scope="col">作业编号</th><th scope="col">响应</th><th scope="col">周转</th><th scope="col">等待</th></tr></thead><tbody>${run.rows.map(row => `<tr>${row.map((value,column) => column === 0 ? `<th scope="row">${value}</th>` : `<td>${value.toFixed(2)}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">平均</th>${schedulingAverages(run).map(value => `<td>${value}</td>`).join('')}</tr></tbody></table></div><details class="practice-trace"><summary>参考输出：完整统计部分</summary><pre><code>${schedulingEscape(schedulingOutput(run))}</code></pre></details></section>`;
};
const schedulingRunLabel = run => `${run.policy}${run.quantum ? ` · q=${run.quantum}` : ''} · ${run.list}`;
const schedulingComparison = exercise => `<div class="practice-table-scroll scheduling-comparison" tabindex="0" role="region" aria-label="各条件平均值对照"><table><caption>各参考条件的平均值 · 单位：模拟时间</caption><thead><tr><th scope="col">长度列表</th><th scope="col">策略</th><th scope="col">时间片 q</th><th scope="col">平均响应</th><th scope="col">平均周转</th><th scope="col">平均等待</th></tr></thead><tbody>${exercise.runs.map(id => {
  const run = SCHEDULING_PRACTICE_RUNS[id];
  return `<tr><th scope="row">${run.list}</th><td>${run.policy}</td><td>${run.quantum || '不使用'}</td>${schedulingAverages(run).map(value => `<td>${value}</td>`).join('')}</tr>`;
}).join('')}</tbody></table></div>`;
const renderSchedulingExercise = (exercise,index) => `<article class="practice-exercise" id="exercise-${index + 1}" aria-labelledby="exercise-title-${index + 1}"><header class="practice-exercise-heading"><span class="practice-number" aria-hidden="true">${String(index + 1).padStart(2,'0')}</span><div><p class="practice-topic">${exercise.topic}</p><h2 id="exercise-title-${index + 1}">${exercise.title}</h2></div></header><p class="practice-question">${exercise.question}</p>${schedulingComparison(exercise)}<div class="practice-body"><section class="practice-run" aria-label="第 ${index + 1} 题运行与参考结果"><h3>运行与核对</h3><label class="scheduling-case-label" for="scheduling-case-${index + 1}">参考条件<select id="scheduling-case-${index + 1}" data-scheduling-case="${index}">${exercise.runs.map(id => `<option value="${id}">${schedulingRunLabel(SCHEDULING_PRACTICE_RUNS[id])}</option>`).join('')}</select></label><div data-scheduling-result>${schedulingRun(exercise.runs[0])}</div></section><section class="practice-reasoning" aria-label="第 ${index + 1} 题解题过程"><h3>解题过程</h3>${exercise.symbols ? `<dl class="scheduling-symbols">${exercise.symbols.map(([symbol,definition]) => `<div><dt><code>${symbol}</code></dt><dd>${definition}</dd></div>`).join('')}</dl>` : ''}<ol>${exercise.steps.map(([title,lines],step) => `<li><span class="practice-step">${step + 1}</span><div><h4>${title}</h4><div class="scheduling-step-lines">${lines.map(text => `<p>${schedulingEscape(text)}</p>`).join('')}</div></div></li>`).join('')}</ol><div class="practice-conclusion"><h4>结果与原因</h4><dl class="scheduling-conclusion-items">${exercise.conclusion.map(([title,text]) => `<div><dt>${schedulingEscape(title)}</dt><dd>${schedulingEscape(text)}</dd></div>`).join('')}</dl></div></section></div><nav class="practice-exercise-nav" aria-label="练习间导航">${index > 0 ? `<a href="#exercise-${index}">上一题：${schedulingPractice[index - 1].title}</a>` : '<a href="#tasks">练习目录</a>'}${index < 6 ? `<a href="#exercise-${index + 2}">下一题：${schedulingPractice[index + 1].title}</a>` : '<a href="#parameters">程序说明与参数</a>'}</nav></article>`;
document.querySelector('#root').innerHTML = `<div class="page hw-page api-hw-page process-practice-page scheduling-practice-page" id="top">${wikiHeader('fcfs', [{href:'#tasks',title:'模拟练习'},{href:'#parameters',title:'参数'},{href:'#metrics',title:'指标与输出'}])}<main>
  <section class="intro" aria-labelledby="page-title"><p class="eyebrow">CPU 虚拟化 / 调度 / 作业</p><h1 id="page-title">CPU 调度基础作业 <span>Scheduling Homework</span></h1><p class="lead">从执行顺序和时间片出发，计算首次响应、全部完成与累计等待，比较 FIFO、SJF 和 RR。</p><dl class="hw-meta"><div><dt>运行环境</dt><dd>Ubuntu 22.04 · Python 3</dd></div><div><dt>依赖</dt><dd>Python 标准库</dd></div></dl><p class="hw-back"><a class="inline-link" href="cpu-scheduling.html">CPU 调度基础：策略与时间指标</a></p></section>
  <div class="practice-tabs" role="tablist" aria-label="CPU 调度作业内容"><button type="button" id="practice-tab" role="tab" aria-controls="practice-view" aria-selected="true">模拟练习</button><button type="button" id="program-tab" role="tab" aria-controls="program-view" aria-selected="false" tabindex="-1">程序说明与参数</button></div>
  <div id="practice-view" role="tabpanel" aria-labelledby="practice-tab" tabindex="0"><nav class="practice-index" id="tasks" aria-label="模拟练习目录">${schedulingPractice.map((exercise,index) => `<a href="#exercise-${index + 1}"><span>${String(index + 1).padStart(2,'0')}</span><strong>${exercise.title}</strong></a>`).join('')}</nav>
  <section id="questions" aria-labelledby="practice-title"><div class="practice-section-heading"><p class="eyebrow">HOMEWORK / SIMULATION</p><h2 id="practice-title">CPU 调度：七道模拟练习</h2><p>共同条件：一个 CPU，所有作业在时刻 0 到达，没有 I/O，切换开销取零。作业是需要一定 CPU 运行时间的任务，长度是它的 CPU 需求；编号由输入位置确定。FIFO 按输入顺序连续执行，SJF 按长度从短到长连续执行，RR 每次分配至多一个时间片，未完成者回到队尾。时间片长度记为 q，它限制一次连续运行的时长。</p><p>题目顺序来自 OSTEP <code>cpu-sched/README.md</code> 的 Homework（Simulation）节。所有表格与区间使用模拟时间单位。</p></div><div class="practice-setup"><h3>进入脚本目录</h3>${schedulingCommand('cd ~/ostep-homework/cpu-sched')}<p>不加 <code>-c</code> 查看作业列表并自行推演；使用相同参数加 <code>-c</code> 核对轨迹与统计。<a class="inline-link" href="#parameters">程序参数</a> · <a class="inline-link" href="#metrics">时间指标与输出含义</a></p></div><span id="fifo-sjf"></span>${schedulingPractice.map((exercise,index) => `${index === 2 ? '<span id="rr"></span>' : ''}${index === 3 ? '<span id="comparison"></span>' : ''}${renderSchedulingExercise(exercise,index)}`).join('')}</section></div>
  <div id="program-view" role="tabpanel" aria-labelledby="program-tab" tabindex="0" hidden><section class="hw-section" id="parameters" aria-labelledby="parameters-title"><div class="api-hw-section-heading"><p class="section-index">01 / PARAMETERS</p><h2 id="parameters-title">程序用途、运行命令与参数</h2></div><p><code>scheduler.py</code> 根据一组作业长度和所选策略，计算 CPU 执行顺序、响应时间、周转时间与等待时间。输入可以是随机生成的作业，也可以是逗号分隔的明确长度列表。</p><p>程序与原始使用说明见 <a class="inline-link" href="https://github.com/remzi-arpacidusseau/ostep-homework/tree/master/cpu-sched" target="_blank" rel="noopener noreferrer">OSTEP cpu-sched</a>，程序源码：<a class="inline-link" href="https://raw.githubusercontent.com/remzi-arpacidusseau/ostep-homework/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-sched/scheduler.py" target="_blank" rel="noopener noreferrer">scheduler.py</a>。</p><h3>先取得问题，再核对结果</h3><p>进入目录后，先指定策略、作业数量和随机种子。不加 <code>-c</code> 只列出问题；加 <code>-c</code> 显示轨迹和统计。两次必须保持相同种子与生成参数，才能比较同一组作业。</p>${schedulingCommand('cd ~/ostep-homework/cpu-sched')}${schedulingCommand('python3 scheduler.py -p FIFO -j 3 -s 100')}${schedulingCommand('python3 scheduler.py -p FIFO -j 3 -s 100 -c')}<p>这组参数生成长度为 2、5、8 的三个作业。</p><h3>明确指定长度列表</h3><p><code>-l</code> 是小写字母 L。逗号分隔各作业的 CPU 需求时长；编号按位置从 0 开始。例如 <code>5,10,15</code> 表示三个作业，分别需要 5、10、15 个时间单位，不是它们的到达时间。使用 <code>-l</code> 后，<code>-s</code>、<code>-j</code> 和 <code>-m</code> 不参与列表生成。</p>${schedulingCommand('python3 scheduler.py -p SJF -l 5,10,15')}${schedulingCommand('python3 scheduler.py -p SJF -l 5,10,15 -c')}
  <div class="practice-table-scroll" tabindex="0" role="region" aria-label="命令行参数"><table><caption>参数及默认值</caption><thead><tr><th scope="col">参数</th><th scope="col">含义</th><th scope="col">默认值</th></tr></thead><tbody><tr><th scope="row">-p</th><td>策略：FIFO、SJF 或 RR</td><td>FIFO</td></tr><tr><th scope="row">-l</th><td>逗号分隔的正数长度列表</td><td>未指定，随机生成</td></tr><tr><th scope="row">-j</th><td>随机生成的作业数量，使用正整数</td><td>3</td></tr><tr><th scope="row">-m</th><td>随机作业的最大长度，使用正整数</td><td>10</td></tr><tr><th scope="row">-s</th><td>随机种子，相同参数可复现列表</td><td>0</td></tr><tr><th scope="row">-q</th><td>RR 时间片长度，使用正整数</td><td>1</td></tr><tr><th scope="row">-c</th><td>计算执行轨迹与统计</td><td>关闭</td></tr><tr><th scope="row">-h</th><td>显示帮助</td><td>关闭</td></tr></tbody></table></div><h3>时间片与随机输入示例</h3><dl class="hw-argument-parts"><div><dt>q：时间片</dt><dd>RR 中一次连续运行的时长上限。作业不足 q 就完成时，实际运行只占剩余时长；FIFO 和 SJF 不使用时间片。</dd></div><div><dt>随机长度</dt><dd>未指定 -l 时生成 -j 个作业，每个长度为 1 到 -m 的整数。</dd></div></dl>${schedulingCommand('python3 scheduler.py -p RR -l 100,200,300 -q 1 -c')}${schedulingCommand('python3 scheduler.py -p SJF -s 1 -j 4 -m 20 -c')}<p>使用至少一个作业，长度取正数，RR 时间片取正整数。</p></section>
  <section class="hw-section" id="metrics" aria-labelledby="metrics-title"><div class="api-hw-section-heading"><p class="section-index">02 / OUTPUT</p><h2 id="metrics-title">响应、周转与累计等待</h2></div><dl class="hw-argument-examples"><div><dt>响应时间</dt><dd><strong>第一次获得 CPU 的时刻 - 到达时刻</strong><p>这里到达时刻均为 0，因此响应时间等于首次运行时刻。后续轮转等待不计入首次响应。</p></dd></div><div><dt>周转时间</dt><dd><strong>完成全部 CPU 工作的时刻 - 到达时刻</strong><p>一个 RR 时间片结束不等于作业完成；必须累计执行完它的全部长度。</p></dd></div><div><dt>等待时间</dt><dd><strong>所有就绪但未运行的时间之和</strong><p>包含首次运行前和后续轮次排队的时间。这里没有 I/O，等待时间 = 周转时间 - CPU 需求时长。FIFO/SJF 中等待与响应相同，RR 中不一定相同。</p></dd></div></dl><p>输出先列出参数和作业列表，随后在加 -c 时给出“执行轨迹”和“最终统计”。轨迹行说明哪个作业从何时开始、运行多久；带“完成”的行给出该作业的完成时刻。统计逐作业列出三项时间，末尾平均值按作业数量计算。</p><p>输出中的“秒”是模拟时间，不是命令在机器上的实际耗时。全部作业完成时刻等于总 CPU 需求，不等于平均周转时间。</p></section></div>
  </main><footer><a href="cpu-scheduling.html">返回 CPU 调度基础</a><a href="#top">回到页首</a></footer></div>`;
document.querySelector('.article-location').innerHTML = '<span>CPU 虚拟化</span><span aria-hidden="true">/</span>CPU 调度基础作业';
document.querySelector('.knowledge-nav [aria-current="page"]')?.removeAttribute('aria-current');
document.querySelector('.knowledge-nav a[href="cpu-scheduling.html"]').classList.add('scheduling-homework-topic');
document.title = 'CPU 调度基础作业 Scheduling Homework · OSLab';
document.querySelectorAll('[data-scheduling-case]').forEach(select => select.addEventListener('change', () => {
  const result = select.closest('.practice-run').querySelector('[data-scheduling-result]');
  const expanded = result.querySelector('details').open;
  result.innerHTML = schedulingRun(select.value);
  result.querySelector('details').open = expanded;
}));
const schedulingTabs = [...document.querySelectorAll('.practice-tabs [role="tab"]')];
const selectSchedulingView = panelId => schedulingTabs.forEach(tab => {
  const selected = tab.getAttribute('aria-controls') === panelId;
  tab.setAttribute('aria-selected', String(selected));
  tab.tabIndex = selected ? 0 : -1;
  document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
});
const schedulingAnchorView = hash => {
  const target = document.getElementById(hash.slice(1));
  const panel = target?.closest('[role="tabpanel"]');
  if (panel) selectSchedulingView(panel.id);
  return target;
};
schedulingTabs.forEach((tab,index) => {
  tab.addEventListener('click', () => {
    const panelId = tab.getAttribute('aria-controls');
    selectSchedulingView(panelId);
    if (location.hash !== `#${panelId}`) history.pushState(null,'',`#${panelId}`);
  });
  tab.addEventListener('keydown', event => {
    const nextIndex = {ArrowRight:(index + 1) % schedulingTabs.length,ArrowLeft:(index + schedulingTabs.length - 1) % schedulingTabs.length,Home:0,End:schedulingTabs.length - 1}[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    schedulingTabs[nextIndex].focus();
    schedulingTabs[nextIndex].click();
  });
});
document.querySelector('#root').addEventListener('click', async event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) schedulingAnchorView(link.getAttribute('href'));
  const button = event.target.closest('[data-practice-copy]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.previousElementSibling.textContent);
    button.title = '已复制';
    button.setAttribute('aria-label','已复制命令');
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(button.previousElementSibling);
    selection.removeAllRanges();
    selection.addRange(range);
    button.title = '命令已选中，可复制';
    button.setAttribute('aria-label','命令已选中，可复制');
  }
});
window.addEventListener('hashchange', () => {
  const target = schedulingAnchorView(location.hash);
  if (target) target.scrollIntoView({behavior:'instant'});
});
schedulingAnchorView(location.hash);