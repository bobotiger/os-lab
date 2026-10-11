const mlfqExercises = [
  {id:'random',title:'两个作业、两级队列的执行轨迹',question:'生成几个只有两个作业、两级队列的随机问题，限制作业长度并关闭 I/O。逐毫秒推导各作业所在队列和 CPU 执行顺序，再核对完整执行轨迹、响应时间与周转时间。',cases:[['seed0','种子 0：CPU 需求 10 / 5 ms'],['seed1','种子 1：CPU 需求 2 / 9 ms'],['seed2','种子 2：CPU 需求 11 / 1 ms']],steps:[['先列出就绪作业','三个条件均使用 Q1、Q0 两级队列，时间片为 4 ms，每层配额为一个时间片。两个作业在 0 ms 同时到达，按 Job 0、Job 1 的顺序进入 Q1。'],['用完配额后降低一级','种子 0 中，Job 0 在 [0,4) 运行后进入 Q0；Job 1 在 [4,8) 运行后也进入 Q0。低队列接着依次运行 Job 0、Job 1、Job 0，完成时刻分别为 15 ms 和 13 ms。'],['区分完成与降级','种子 1 的 Job 0 只需要 2 ms，先完成而不是继续等待下一层。种子 2 的 Job 1 在 5 ms 完成；Job 0 随后独占 Q0，直到 12 ms。']],conclusion:'种子 0 的 CPU 执行顺序为 Job 0 → Job 1 → Job 0 → Job 1 → Job 0，两个作业分别在 15、13 ms 完成；种子 1 分别在 2、11 ms 完成；种子 2 分别在 12、5 ms 完成。种子 1 的 Job 0、种子 2 的 Job 1 在 Q1 就完成，其余未完成作业用完 4 ms 配额后降至 Q0。三组条件均没有 I/O，CPU 从 0 ms 起连续执行，直到全部作业完成。'},
  {id:'chapter',title:'按给定场景构造 MLFQ 调度负载',question:'为下面给定的调度场景配置程序参数：单个长作业、后来到达的短作业、频繁 I/O、优先级提升、累计 CPU 记账，以及不同层级的时间片。各条件给出完整负载与规则；推导 CPU 执行区间，核对短作业是否立即运行、长作业何时等待或恢复，以及作业何时降级。',cases:[['long','单个长作业逐级下降'],['short','短作业在 100 ms 到达'],['interactive','频繁 I/O：返回后保持最高优先级'],['starved','长作业等待：不提升优先级'],['boosted','长作业恢复：每 100 ms 提升'],['old-accounting','旧规则：I/O 后重置配额'],['new-accounting','累计记账：I/O 后保留用量'],['variable','较低队列使用较长时间片']],steps:[['用作业列表表达负载','-l 0,200,0 表示一个在 0 ms 到达、需要 200 ms CPU 且不做 I/O 的作业。-l 0,180,0:100,20,0 加入一个在 100 ms 到达、需要 20 ms CPU 的短作业；它到达时进入 Q2，先于 Q0 的长作业运行。频繁 I/O 条件把第二个作业的 I/O 间隔改为 1 ms，并用 -i 1 -S 保持其返回后的最高优先级。'],['固定负载，只改变反馈规则','三个作业条件中，Job 0 在 0 ms 到达、需要 200 ms CPU；Job 1、Job 2 在 100 ms 到达，各需要 50 ms CPU，每运行 1 ms 就等待 1 ms 的 I/O。使用 -S 且不提升时，Job 0 在 [100,200) 等待；加 -B 100 后，它在 [100,110) 获得 CPU。另用两个 CPU 需求均为 300 ms 的作业，令 Job 1 每运行 9 ms 做一次 1 ms I/O，只改变是否加 -S，比较它能否持续保留 Q2。'],['分别设置时间片与配额','两个在 0 ms 到达、各需要 150 ms CPU 且不做 I/O 的作业，使用 -Q 10,20,40 -a 2。每个作业在 Q2 累计运行 20 ms、在 Q1 累计运行 40 ms 后降级；到 Q0 后按 40 ms 时间片轮转。配额个数与单个时间片长度不是同一个量。']],conclusion:[
    ['单个长作业逐级降级','Job 0 在 10 ms 降至 Q1，在 20 ms 降至 Q0，随后在最低队列继续执行。'],
    ['后来到达的短作业先运行','Job 1 在 100 ms 到达后，先于 Q0 中的 Job 0 运行。它在 [100,120) 获得 CPU，并在 120 ms 完成。'],
    ['旧规则让 I/O 作业保持高优先级','使用 -S 时，发起 I/O 会重置时间片和配额；本题频繁发起 I/O 的 Job 1 因此可持续保留 Q2。'],
    ['周期提升让长作业恢复运行','两个 I/O 作业交替在 Q2 运行时，Job 0 在 [100,200) 等待。加 -B 100 后，Job 0 在 100 ms 被提升至 Q2，并在 [100,110) 恢复运行。'],
    ['累计记账使 I/O 作业最终降级','取消 -S 后，I/O 前已消耗的 CPU 用量仍计入本层配额。因此，每累计运行 9 ms 发起一次 I/O 的 Job 1 最终降至 Q0。'],
    ['各层时间片与配额分别生效','使用 -Q 10,20,40 -a 2 时，每个作业在 Q2 累计消耗 20 ms CPU、在 Q1 累计消耗 40 ms CPU 后降级；进入 Q0 后，以 40 ms 时间片轮转。']
  ]},
  {id:'round-robin',title:'把 MLFQ 配置为时间片轮转',question:'如何设置调度器参数，使其行为与时间片轮转一致？构造三个同时到达、没有 I/O 的作业，比较每轮运行顺序与首次响应时间。',cases:[['rr','单队列、4 ms 时间片、三个作业']],steps:[['只保留一个优先级','设置 -n 1 后，所有就绪作业都在 Q0，不再存在高低优先级之间的选择。-q 4 指定同队列轮转时间片。'],['按队首顺序分配 CPU','三个作业都需要 12 ms。前一轮顺序为 Job 0：[0,4)，Job 1：[4,8)，Job 2：[8,12)；未完成作业继续排到队尾。'],['核对首次响应与完成','首次响应时间依次为 0、4、8 ms；三个作业各运行三个时间片，分别在 28、32、36 ms 完成。']],conclusion:'设置 -n 1 -q 4，关闭 I/O、优先级提升和 I/O 返回队首，便得到一个队列内的 4 ms 时间片轮转。本负载按 Job 0、Job 1、Job 2 的顺序重复轮转，首次响应分别为 0、4、8 ms，完成时刻分别为 28、32、36 ms。'},
  {id:'gaming',title:'旧规则下一个作业获得 99% 的 CPU',question:'构造两个作业和一组调度参数，用 -S 启用发起 I/O 后重置时间片和配额的旧规则，使其中一个作业在明确的时间区间内获得 99% 的 CPU。再取消 -S，用相同区间核对累计记账的效果。',cases:[['game','旧规则：I/O 后重置配额'],['game-fixed','累计记账：取消 -S']],steps:[['先确定比较区间','两级队列的时间片均为 100 ms。Job 0 不做 I/O，先运行 [0,100) 后降至 Q0。Job 1 每累计运行 99 ms 发起一次持续 1 ms 的 I/O。比较区间固定为 [100,500)，长度 400 ms。'],['旧规则不断重置剩余额度','加 -S 时，Job 1 每次都在耗完 100 ms 前发起 I/O，随后以完整时间片留在 Q1。每个 100 ms 周期由 Job 1 运行 99 ms，Job 0 在它等待 I/O 时运行 1 ms。'],['取消 -S 后继续累计','Job 1 运行 99 ms 后仍只剩 1 ms 的高优先级时间片；返回后运行到 201 ms 就降至 Q0。同一区间内，Job 1 实际运行 200 ms，占 50%。']],conclusion:'用 -l 0,500,0:0,500,99 -n 2 -q 100 -i 1 -S，Job 1 在 [100,500) 内获得 396 ms CPU，占 396 / 400 = 99%；取消 -S 后，同一作业在同一区间只获得 200 ms，占 50%。99% 来自 I/O 后重置配额并保持 Q1，不是两个作业全程的 CPU 分配比例。'},
  {id:'boost',title:'推导长作业至少获得 5% CPU 的提升周期',question:'最高队列的时间片为 10 ms。为了让一个持续需要 CPU、可能长期等待的作业至少获得 5% 的 CPU，应多长时间提升一次优先级？写出推导条件，并比较 -B 200 与 -B 400 的实际区间占比。',cases:[['boost200','每 200 ms 提升：比较两个 200 ms 区间'],['boost400','每 400 ms 提升：比较两个 400 ms 区间']],steps:[['明确占比的前提','设 B 为提升周期，q 为长作业在每个周期实际获得的 CPU 时间。假定作业在整个周期内都需要 CPU，并且每次提升后能在下次提升前获得一个完整的 10 ms 时间片。'],['由时间比例求上限','要求 q / B ≥ 0.05。取 q = 10 ms，得到 B ≤ 200 ms；200 ms 是上述条件下允许的最大提升间隔，不是唯一的可选值。'],['用同一负载核对周期','Job 1、Job 2 每运行 1 ms 就等待 1 ms 的 I/O，并使用 -S 保持高优先级。-B 200 时，Job 0 在 [0,200)、[200,400) 各运行 10 ms，占 5%；-B 400 时，在 [0,400)、[400,800) 各运行 10 ms，占 2.5%。']],conclusion:'在长作业每个周期实际获得完整 10 ms 时间片的前提下，提升间隔最多为 200 ms，因为 10 / 200 = 5%。本负载的 -B 200 在两个观察周期内均达到 5%，-B 400 则均为 2.5%。还须保证目标作业在下次提升前获得这个时间片；仅设置 -B 200，不能对任意数量的竞争作业保证 5%。'},
  {id:'io-return',title:'I/O 完成后加入队首还是队尾',question:'-I 会改变 I/O 完成后作业在当前队列中的插入位置。选择相同负载，分别运行默认规则与 -I；比较 Job 0 每次 I/O 完成后的等待、CPU 顺序，以及两个作业的周转时间。',cases:[['io-tail','默认：I/O 完成后加入队尾'],['io-front','加 -I：I/O 完成后加入队首']],steps:[['先观察同一段 I/O','只有 Q0，时间片为 4 ms。Job 0 在 [0,3) 运行后发起 I/O，阻塞区间为 [3,5)；这时 CPU 执行的是 Job 1，两个活动属于不同作业。'],['比较 5 ms 时的队列变化','默认返回队尾：Job 1 继续到 7 ms，Job 0 才获得 CPU。加 -I：Job 0 在 5 ms 插入队首，程序立即选择它运行；Job 1 被中断后仍保留尚未用完的时间片。'],['核对收益与代价','Job 0 的周转时间由 30 ms 降为 22 ms，Job 1 则由 24 ms 增为 28 ms。两者首次响应仍为 0、3 ms；变化发生在 I/O 返回后的服务顺序，而不是最初到达顺序。']],conclusion:'本负载加 -I 后，Job 0 首次 I/O 完成便在 5 ms 获得 CPU，不再像默认队尾规则那样等到 7 ms。它的周转时间从 30 ms 缩短为 22 ms，Job 1 则从 24 ms 延长为 28 ms。因此队首插入让 I/O 作业更早得到服务，同时增加另一个作业的完成等待；两个作业仍在 Q0，I/O 时长仍为 2 ms。'}
];

const mlfqScenarioNotes = {
  long:'Job 0 在 0 ms 到达，需要 200 ms CPU，不做 I/O。三个队列的时间片均为 10 ms，每层配额为一个时间片，不提升优先级。预期在 [0,10) 运行于 Q2、[10,20) 运行于 Q1、[20,200) 运行于 Q0。',
  short:'Job 0 在 0 ms 到达，需要 180 ms CPU；Job 1 在 100 ms 到达，需要 20 ms CPU。两者都不做 I/O，三层时间片均为 10 ms、配额均为一个时间片。预期 Job 1 到达后先于 Q0 的 Job 0 运行，在 120 ms 完成；Job 0 随后继续，至 200 ms 完成。',
  interactive:'Job 0 在 0 ms 到达，需要 180 ms CPU，不做 I/O；Job 1 在 100 ms 到达，需要 20 ms CPU，每累计运行 1 ms 发起一次持续 1 ms 的 I/O。三层时间片均为 10 ms，配额均为一个时间片，使用 -S，不提升优先级。预期 Job 1 每次返回后仍在 Q2，Job 0 在其 I/O 阻塞期间运行；Job 1 在 139 ms 完成，Job 0 在 200 ms 完成。',
  starved:'Job 0 在 0 ms 到达，需要 200 ms CPU，不做 I/O；Job 1、Job 2 在 100 ms 到达，各需要 50 ms CPU，每运行 1 ms 等待 1 ms 的 I/O。三层时间片均为 10 ms，配额均为一个时间片，使用 -S，不提升优先级。预期两个 I/O 作业交替占用 Q2，Job 0 在 [100,200) 无法运行，200 ms 后继续运行。',
  boosted:'Job 0 在 0 ms 到达，需要 200 ms CPU，不做 I/O；Job 1、Job 2 在 100 ms 到达，各需要 50 ms CPU，每运行 1 ms 等待 1 ms 的 I/O。三层时间片均为 10 ms，配额均为一个时间片，使用 -S，并加 -B 100。预期 Job 0 在 100 ms 被提升至 Q2，在 [100,110) 重新获得 CPU。',
  'old-accounting':'Job 0、Job 1 都在 0 ms 到达，各需要 300 ms CPU。Job 0 不做 I/O；Job 1 每累计运行 9 ms 发起一次持续 1 ms 的 I/O。三层时间片均为 10 ms，配额均为一个时间片，不提升优先级，使用 -S。预期 Job 1 因 I/O 重置配额而持续保留 Q2，在 343 ms 完成；Job 0 在 600 ms 完成。',
  'new-accounting':'Job 0、Job 1 都在 0 ms 到达，各需要 300 ms CPU。Job 0 不做 I/O；Job 1 每累计运行 9 ms 发起一次持续 1 ms 的 I/O。三层时间片均为 10 ms，配额均为一个时间片，不提升优先级，不加 -S。预期 Job 1 返回后继续累计本层 CPU 用量，最终降至 Q0；Job 0、Job 1 分别在 453、616 ms 完成。',
  variable:'Job 0、Job 1 都在 0 ms 到达，各需要 150 ms CPU，均不做 I/O、不提升优先级。Q2、Q1、Q0 的时间片分别为 10、20、40 ms，每层配额均为两个时间片。预期每个作业在 Q2 累计运行 20 ms、在 Q1 累计运行 40 ms 后降级，再在 Q0 按 40 ms 时间片轮转。'
};

const mlfqEscape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const mlfqCommand = command => `<div class="practice-command"><pre><code>${command.split(' ').map(word => word.startsWith('-') ? `<span class="practice-command-argument">${mlfqEscape(word)}</span>` : mlfqEscape(word)).join(' ')}</code></pre><button type="button" data-practice-copy title="复制命令" aria-label="复制命令"><span class="practice-copy-icon" aria-hidden="true"></span></button></div>`;
const mlfqAverage = (rows, column) => (rows.reduce((sum, row) => sum + row[column], 0) / rows.length).toFixed(2);
const mlfqTable = (caption, headings, rows) => `<div class="practice-table-scroll"><table><caption>${caption}</caption><thead><tr>${headings.map(heading => `<th scope="col">${heading}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${mlfqEscape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function mlfqTimeline(run) {
  const args = run.args.split(' ');
  const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const queueCount = option('-Q', '').split(',').filter(Boolean).length || Number(option('-n', 3));
  const quantums = option('-Q', Array(queueCount).fill(option('-q', 10)).join(',')).split(',').map(Number);
  const allotments = option('-A', Array(queueCount).fill(option('-a', 1)).join(',')).split(',').map(Number);
  const windows = [[]];
  run.segments.forEach((segment, index) => {
    if (index && segment[0] - run.segments[index - 1][1] > Number(option('-i', 5))) windows.push([]);
    windows.at(-1).push(segment);
  });
  const plots = windows.map((segments, windowIndex) => {
    const start = segments[0][0];
    const finish = segments.at(-1)[1];
    const duration = finish - start;
    const width = Math.max(320, Math.min(900, duration * 16));
    const position = time => (time - start) / duration * 100;
    const ticks = Array.from({length: 6}, (_, index) => start + Math.round(duration * index / 5)).filter((time, index, values) => values.indexOf(time) === index);
    const axis = ticks.map(time => `<span class="mlfq-time-tick" style="left:${position(time)}%">${time}</span>`).join('');
    const gridLines = ticks.map(time => `<span class="mlfq-grid-line" style="left:${position(time)}%" aria-hidden="true"></span>`).join('');
    const gaps = segments.flatMap((segment, index) => index && segment[0] > segments[index - 1][1] ? [[segments[index - 1][1], segment[0]]] : []);
    const lanes = quantums.map((quantum, level) => {
      const priority = queueCount - level - 1;
      const bars = segments.filter(segment => segment[3] === priority).map(([begin,end,job]) => {
        const label = `Job ${job} · Q${priority} · [${begin},${end}) · ${end-begin} ms`;
        return `<div class="mlfq-segment mlfq-job-${job}" data-start="${begin}" data-finish="${end}" data-priority="${priority}" style="left:${position(begin)}%;width:${(end-begin)/duration*100}%" title="${label}" aria-label="${label}">${(end-begin)/duration*width >= 42 ? `<span>Job ${job}</span>` : ''}</div>`;
      }).join('');
      const missing = gaps.map(([begin,end]) => `<span class="mlfq-track-gap" style="left:${position(begin)}%;width:${(end-begin)/duration*100}%" title="[${begin},${end}) ${run.io ? 'CPU 空闲' : '执行记录省略'}"></span>`).join('');
      return `<div class="mlfq-queue-label"><strong>Q${priority}${level === 0 ? '<small>最高优先级</small>' : level === queueCount - 1 ? '<small>最低优先级</small>' : ''}</strong><span>时间片 ${quantum} ms</span><span>配额 ${allotments[level]} 个时间片</span></div><div class="mlfq-queue-track" data-queue="${priority}">${gridLines}${missing}${bars}</div>`;
    }).join('');
    const omission = windowIndex ? `<p class="mlfq-omission">[${windows[windowIndex-1].at(-1)[1]},${start}) 执行记录省略</p>` : '';
    return `${omission}<div class="mlfq-chart-scroll" tabindex="0" role="region" aria-label="队列分层 CPU 时间图，${start} 至 ${finish} ms"><div class="mlfq-chart" style="--mlfq-plot-width:${width}px"><div class="mlfq-axis-label">时间 / ms</div><div class="mlfq-time-axis">${axis}</div>${lanes}</div></div>`;
  }).join('');
  const legend = run.jobs.map(([job]) => `<span><i class="mlfq-job-${job}" aria-hidden="true"></i>Job ${job}</span>`).join('');
  return `<figure class="mlfq-timeline"><figcaption>按队列优先级分层的 CPU 执行时间图</figcaption><div class="mlfq-legend">${legend}</div>${plots}<p class="practice-timeline-note">上方队列的优先级更高；每个色块表示 CPU 在该层执行一个作业，不表示队列中的等待作业。同一段时间轴内，块宽与执行时长成正比，各层的时刻上下对齐。区间包含起点、不包含终点；同作业、同层的连续执行可跨越多个时间片。</p><details class="mlfq-interval-details"><summary>各执行区间的作业、队列与时长</summary>${mlfqTable('CPU 执行区间',['区间 / ms','作业','队列','执行 / ms'],run.segments.map(([start,finish,job,priority]) => [`[${start},${finish})`,`Job ${job}`,`Q${priority}`,finish-start]))}</details></figure>`;
}
function mlfqRun(id, exercise) {
  const run = MLFQ_PRACTICE_RUNS[id];
  const command = `python3 mlfq.py ${run.args}`;
  const output = `Final statistics:\n${run.rows.map(([job,start,response,turnaround]) => `  Job ${String(job).padStart(2)}: startTime ${String(start).padStart(3)} - response ${String(response).padStart(3)} - turnaround ${String(turnaround).padStart(3)}`).join('\n')}`;
  const conditions = `${mlfqScenarioNotes[id] ? `<section data-mlfq-scenario><h4>负载、调度条件与预期执行</h4><p class="practice-timeline-note">${mlfqScenarioNotes[id]}</p></section>` : ''}${mlfqTable('作业条件；ioFreq = 0 表示不发起 I/O',['作业','到达 / ms','CPU 需求 / ms','ioFreq / ms'],run.jobs.map(([job,...values]) => [`Job ${job}`,...values]))}`;
  const statistics = mlfqTable('最终统计',['作业','到达 / ms','响应 / ms','周转 / ms'],run.rows.map(([job,...values]) => [`Job ${job}`,...values]));
  const measurements = run.measurements ? mlfqTable('指定区间内的 CPU 服务与占比',['区间 / ms','作业','CPU 服务 / ms','CPU 占比'],run.measurements.map(([start,finish,job,service]) => [`[${start},${finish})`,`Job ${job}`,service,`${(service/(finish-start)*100).toFixed(1)}%`])) : '';
  const io = run.io ? mlfqTable('等待 I/O 的作业与阻塞区间', ['作业','I/O 开始 / ms','I/O 完成 / ms'],run.io.map(([start,finish,job]) => [`Job ${job}`,start,finish])) : '';
  const reasoning = `<section class="practice-reasoning"><h3>推演与机制解释</h3><ol>${exercise.steps.map(([title,text],step) => `<li><span class="practice-step">${step+1}</span><div><h4>${title}</h4><p>${text}</p></div></li>`).join('')}</ol></section>`;
  return `<div data-mlfq-run="${id}"><div class="mlfq-run-setup"><section class="mlfq-run-commands"><h4>预测用命令</h4>${mlfqCommand(command)}<h4>核对用命令</h4>${mlfqCommand(`${command} -c`)}</section><section class="mlfq-run-conditions">${conditions}</section></div>${mlfqTimeline(run)}<div class="mlfq-analysis-grid"><section class="mlfq-run-outcomes"><h3>运行结果</h3>${measurements}${statistics}${io}<details class="practice-trace"><summary>查看程序最终统计摘录</summary><pre><code>${mlfqEscape(output)}</code></pre></details></section>${reasoning}</div></div>`;
}
function renderMlfqExercise(exercise,index) {
  const comparison = mlfqTable('各条件的最终统计均值；只在相同负载与指标条件下比较',['条件','平均响应 / ms','平均周转 / ms'],exercise.cases.map(([id,label]) => [label,mlfqAverage(MLFQ_PRACTICE_RUNS[id].rows,2),mlfqAverage(MLFQ_PRACTICE_RUNS[id].rows,3)]));
  const conclusion = Array.isArray(exercise.conclusion) ? `<dl class="mlfq-conclusion-items">${exercise.conclusion.map(([title,text]) => `<div><dt>${mlfqEscape(title)}</dt><dd>${mlfqEscape(text)}</dd></div>`).join('')}</dl>` : `<p>${exercise.conclusion}</p>`;
  return `<section class="practice-exercise" id="${exercise.id}" aria-labelledby="${exercise.id}-title"><header class="practice-exercise-heading"><span class="practice-number">${String(index+1).padStart(2,'0')}</span><div><p class="practice-topic">Homework (Simulation) / 第 ${index+1} 题</p><h2 id="${exercise.id}-title">${exercise.title}</h2></div></header><p class="practice-question">${exercise.question}</p><div class="mlfq-overview"><section class="practice-conclusion"><h3>参考结论</h3>${conclusion}</section><section class="mlfq-case-comparison">${comparison}</section></div><div class="practice-body"><section class="mlfq-case"><div class="mlfq-case-heading"><h3>运行条件与调度过程</h3><label class="mlfq-case-label">参考条件<select data-mlfq-case aria-label="第 ${index+1} 题参考条件">${exercise.cases.map(([id,label]) => `<option value="${id}">${label}</option>`).join('')}</select></label></div><div data-mlfq-result>${mlfqRun(exercise.cases[0][0],exercise)}</div></section></div></section>`;
}
const mlfqParameters = [
  ['-h','显示帮助。'],['-s SEED','随机种子，默认 0；相同输入与种子生成相同作业。'],['-j NUMJOBS','随机作业数量，默认 3；指定 -l 时，以列表中的作业为准。'],['-m MAXLEN','随机 CPU 总需求的长度上限参数，默认 100；例如 -m 12 生成 1 至 11 ms 的整数需求。'],['-M MAXIO','随机 I/O 间隔的上限参数，默认 10；-M 0 关闭随机作业的 I/O，-M 1 则每累计运行 1 ms 发起 I/O。'],['-n NUMQUEUES','队列数，默认 3；只在未指定 -Q 时使用。'],['-q QUANTUM','所有队列统一的时间片长度，默认 10 ms；只在未指定 -Q 时使用。'],['-Q x,y,z','从最高至最低的各层时间片长度，单位 ms；列表长度决定队列数。例如 10,20,40 对应 Q2、Q1、Q0。'],['-a ALLOTMENT','每层配额的时间片个数，默认 1；不是毫秒数。只在未指定 -A 时使用。'],['-A x,y,z','从最高至最低的各层配额个数；列表长度须等于队列数。例如 -Q 10,20,40 -A 2,2,2 对应 20、40、80 ms 的本层 CPU 配额。'],['-l JLIST','指定作业列表，格式为 startTime,runTime,ioFreq:startTime,runTime,ioFreq；按列表顺序编号 Job 0、Job 1……。'],['-B BOOST','周期性提升间隔，单位 ms；默认 0，即关闭。提升时重置层级配额，正在等待 I/O 的作业仍须等到 I/O 完成。'],['-i IOTIME','每次 I/O 的固定持续时间，默认 5 ms。'],['-S','启用 I/O 后重置时间片与配额的旧规则；默认关闭，默认规则保留本层累计 CPU 用量。'],['-I','I/O 完成后插入当前队列的队首；默认插入队尾。'],['-c','打印完整执行轨迹和最终统计；不加时只显示条件并提出待推导问题。']
];
const mlfqProgramGuide = `<section class="practice-section-heading" id="program"><p class="section-index">MLFQ.PY / 程序说明</p><h2>生成调度问题，或指定负载核对执行轨迹</h2><p>mlfq.py 根据队列参数与作业条件给出 MLFQ 调度问题；加 -c 后输出逐毫秒执行轨迹，以及响应时间、周转时间和平均值。</p></section><section class="practice-setup" id="setup"><h3>基本运行</h3><div>${mlfqCommand('cd ~/ostep-homework/cpu-sched-mlfq')}${mlfqCommand('python3 mlfq.py')}${mlfqCommand('python3 mlfq.py -h')}<p>以下命令均在此目录运行。程序来自 OSTEP 的 cpu-sched-mlfq 目录。</p><p><a class="inline-link" href="https://github.com/remzi-arpacidusseau/ostep-homework/tree/master/cpu-sched-mlfq">程序、README 与章节 PDF</a> · <a class="inline-link" href="https://raw.githubusercontent.com/remzi-arpacidusseau/ostep-homework/master/cpu-sched-mlfq/mlfq.py">获取 mlfq.py</a></p></div></section><section class="practice-exercise" id="usage"><h2>先生成问题，再核对答案</h2><p class="practice-question">随机负载可以通过作业数量、长度和 I/O 间隔限制范围。保持参数不变，加 -c 会显示同一组作业的执行结果。</p>${mlfqCommand('python3 mlfq.py -s 0 -j 3')}${mlfqCommand('python3 mlfq.py -s 0 -j 3 -c')}<p class="practice-timeline-note">默认使用三个队列；Q2 最高、Q0 最低。单核，每毫秒选择最高的非空就绪队列；I/O 持续时间固定，各作业的 I/O 可以重叠。队列编号越大优先级越高。</p></section><section class="practice-exercise" id="parameters"><h2>选项参数</h2>${mlfqTable('时间参数均为整数；时间片、配额个数与 I/O 持续时间使用正值',['选项','含义与默认值'],mlfqParameters)}</section><section class="practice-exercise" id="input"><h2>指定作业列表与层级参数</h2><dl class="mlfq-symbols"><div><dt>startTime</dt><dd>作业进入系统的时刻，单位 ms；可取 0。</dd></div><div><dt>runTime</dt><dd>完成作业所需的总 CPU 时间，单位 ms；不含 I/O 等待和就绪队列等待。</dd></div><div><dt>ioFreq</dt><dd>每累计运行多少 ms 发起一次 I/O；0 表示不发起 I/O，不是零耗时 I/O。</dd></div></dl>${mlfqCommand('python3 mlfq.py -l 0,180,0:100,20,0 -q 10 -c')}<p class="practice-question">Job 0 在 0 ms 到达，需要 180 ms CPU，不做 I/O；Job 1 在 100 ms 到达，需要 20 ms CPU，也不做 I/O。三项用逗号分隔，作业之间用冒号分隔。</p>${mlfqCommand('python3 mlfq.py -l 0,150,0:0,150,0 -Q 10,20,40 -A 2,2,2 -c')}<p class="practice-question">各层时间片按 Q2、Q1、Q0 排列，为 10、20、40 ms。配额均为两个时间片，即累计 20、40、80 ms；Q0 已是最低层，用完时间片后继续在本层轮转。</p></section><section class="practice-exercise" id="output"><h2>输出字段与时间含义</h2><dl class="mlfq-symbols"><div><dt>OPTIONS / Job List</dt><dd>实际队列配置和作业条件；先核对这些值是否与预期一致。</dd></div><div><dt>JOB BEGINS</dt><dd>作业在标注时刻到达，进入最高优先级就绪队列。</dd></div><div><dt>Run JOB / PRIORITY</dt><dd>此行标注时刻开始的 1 ms 内，CPU 执行的作业编号及其队列编号。</dd></div><div><dt>TICKS / ALLOT / TIME</dt><dd>该 1 ms 执行后的剩余时间片时间、本层剩余配额个数、剩余 CPU 总需求。TICKS 为 0 时，这个时间片刚好用完。</dd></div><div><dt>IO_START / IO_DONE</dt><dd>指定作业发起 I/O 或完成 I/O 的时刻；发起后暂不可运行，完成后进入就绪队列。</dd></div><div><dt>BOOST</dt><dd>本次周期性优先级提升发生的时刻。</dd></div><div><dt>FINISHED / IDLE</dt><dd>作业已完成全部 CPU 需求，或 CPU 在当前时刻没有可运行作业。</dd></div><div><dt>response</dt><dd>首次执行时刻减去到达时刻，单位 ms。</dd></div><div><dt>turnaround</dt><dd>完成时刻减去到达时刻，包含 CPU 执行、就绪等待和 I/O 等待，单位 ms。</dd></div><div><dt>Avg</dt><dd>各作业响应时间与周转时间的算术平均值。</dd></div></dl><details class="practice-trace"><summary>短作业到达例的最终统计摘录</summary><pre><code>${mlfqEscape('Final statistics:\n  Job  0: startTime   0 - response   0 - turnaround 200\n  Job  1: startTime 100 - response   0 - turnaround  20')}</code></pre></details><p class="practice-timeline-note">Job 1 在 100 ms 到达后立即运行，在 120 ms 完成，所以响应时间为 0 ms，周转时间为 20 ms；Job 0 在 200 ms 完成。</p></section>`;

document.getElementById('root').innerHTML = `<div class="page rr-page process-practice-page mlfq-practice-page" id="top">${wikiHeader('mlfq',[{href:'#practice-view',title:'参考作业'},{href:'#program-view',title:'程序说明'}])}<main><section class="intro" aria-labelledby="page-title"><p class="eyebrow">CPU 虚拟化 / 调度参考实践</p><h1 id="page-title">多级反馈队列作业<span>MLFQ Homework</span></h1><p class="lead">从作业的到达、CPU 用量和 I/O 行为出发，推导优先级变化、执行顺序与等待时间。</p><p class="hw-back"><a class="inline-link" href="mlfq.html">返回多级反馈队列知识页</a> · <a class="inline-link" href="scheduling-homework.html">CPU 调度基础作业</a></p></section><div class="practice-tabs" role="tablist" aria-label="作业内容视图"><button id="practice-tab" type="button" role="tab" aria-controls="practice-view" aria-selected="true" tabindex="0">参考作业</button><button id="program-tab" type="button" role="tab" aria-controls="program-view" aria-selected="false" tabindex="-1">程序说明</button></div><div id="practice-view" role="tabpanel" aria-labelledby="practice-tab"><section class="practice-section-heading"><p class="section-index">HOMEWORK / 六个问题</p><h2>队列优先级、累计配额与 CPU 服务</h2><p>时间片是同层一次连续服务的限额；层级配额是降级前可消耗的时间片个数。以下默认按累计 CPU 用量降级，加 -S 才使用 I/O 后重置配额的旧规则。脚本中 Q2 高于 Q1、Q0；两级条件中 Q1 最高。</p></section><section class="practice-setup"><h3>运行目录</h3><div>${mlfqCommand('cd ~/ostep-homework/cpu-sched-mlfq')}<p class="practice-timeline-note">题目来自 cpu-sched-mlfq.pdf 最后一页的 Homework (Simulation)，按原六题顺序展开。</p></div></section><nav class="practice-index" aria-label="六题目录">${mlfqExercises.map((exercise,index) => `<a href="#${exercise.id}"><span>${String(index+1).padStart(2,'0')}</span><strong>${exercise.title}</strong></a>`).join('')}</nav>${mlfqExercises.map(renderMlfqExercise).join('')}</div><div id="program-view" role="tabpanel" aria-labelledby="program-tab" hidden>${mlfqProgramGuide}</div></main></div>`;
document.querySelector('.article-location').innerHTML = '<span>CPU 虚拟化</span><span aria-hidden="true">/</span>多级反馈队列作业';
document.title = '多级反馈队列作业 MLFQ Homework · OSLab';
document.querySelectorAll('[data-mlfq-case]').forEach(select => select.addEventListener('change', () => {
  const result = select.closest('.mlfq-case').querySelector('[data-mlfq-result]');
  const expanded = [...result.querySelectorAll('details')].map(details => details.open);
  const exercise = mlfqExercises.find(item => item.id === select.closest('.practice-exercise').id);
  result.innerHTML = mlfqRun(select.value, exercise);
  result.querySelectorAll('details').forEach((details,index) => { details.open = expanded[index]; });
}));
const mlfqTabs = [...document.querySelectorAll('.practice-tabs [role="tab"]')];
const selectMlfqView = panelId => mlfqTabs.forEach(tab => {
  const selected = tab.getAttribute('aria-controls') === panelId;
  tab.setAttribute('aria-selected',String(selected));
  tab.tabIndex = selected ? 0 : -1;
  document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
});
const mlfqAnchorView = hash => {
  const target = document.getElementById(hash.slice(1));
  const panel = target?.closest('[role="tabpanel"]');
  if (panel) selectMlfqView(panel.id);
  return target;
};
mlfqTabs.forEach((tab,index) => {
  tab.addEventListener('click', () => {
    const panelId = tab.getAttribute('aria-controls');
    selectMlfqView(panelId);
    if (location.hash !== `#${panelId}`) history.pushState(null,'',`#${panelId}`);
  });
  tab.addEventListener('keydown', event => {
    const next = {ArrowRight:(index+1)%mlfqTabs.length,ArrowLeft:(index+mlfqTabs.length-1)%mlfqTabs.length,Home:0,End:mlfqTabs.length-1}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    mlfqTabs[next].focus();
    mlfqTabs[next].click();
  });
});
document.getElementById('root').addEventListener('click', async event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) mlfqAnchorView(link.getAttribute('href'));
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
  const target = mlfqAnchorView(location.hash);
  if (target) target.scrollIntoView({behavior:'instant'});
});
mlfqAnchorView(location.hash);