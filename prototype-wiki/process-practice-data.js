const PROCESS_PRACTICE_TRACES = [
`时间        PID: 0        PID: 1           CPU            IO
  1        RUN:cpu          就绪             1
  2        RUN:cpu          就绪             1
  3        RUN:cpu          就绪             1
  4        RUN:cpu          就绪             1
  5        RUN:cpu          就绪             1
  6           完成       RUN:cpu             1
  7           完成       RUN:cpu             1
  8           完成       RUN:cpu             1
  9           完成       RUN:cpu             1
 10           完成       RUN:cpu             1

统计：总时间 10
统计：CPU 忙碌 10（100.00%）
统计：IO 忙碌  0（0.00%）`,
`时间        PID: 0        PID: 1           CPU            IO
  1        RUN:cpu          就绪             1
  2        RUN:cpu          就绪             1
  3        RUN:cpu          就绪             1
  4        RUN:cpu          就绪             1
  5           完成        RUN:io             1
  6           完成          阻塞                           1
  7           完成          阻塞                           1
  8           完成          阻塞                           1
  9           完成          阻塞                           1
 10           完成          阻塞                           1
 11*          完成   RUN:io_done             1

统计：总时间 11
统计：CPU 忙碌 6（54.55%）
统计：IO 忙碌  5（45.45%）`,
`时间        PID: 0        PID: 1           CPU            IO
  1         RUN:io          就绪             1
  2           阻塞       RUN:cpu             1             1
  3           阻塞       RUN:cpu             1             1
  4           阻塞       RUN:cpu             1             1
  5           阻塞       RUN:cpu             1             1
  6           阻塞          完成                           1
  7*   RUN:io_done          完成             1

统计：总时间 7
统计：CPU 忙碌 6（85.71%）
统计：IO 忙碌  5（71.43%）`,
`时间        PID: 0        PID: 1           CPU            IO
  1         RUN:io          就绪             1
  2           阻塞          就绪                           1
  3           阻塞          就绪                           1
  4           阻塞          就绪                           1
  5           阻塞          就绪                           1
  6           阻塞          就绪                           1
  7*   RUN:io_done          就绪             1
  8           完成       RUN:cpu             1
  9           完成       RUN:cpu             1
 10           完成       RUN:cpu             1
 11           完成       RUN:cpu             1

统计：总时间 11
统计：CPU 忙碌 6（54.55%）
统计：IO 忙碌  5（45.45%）`,
null,
`时间        PID: 0        PID: 1        PID: 2        PID: 3           CPU            IO
  1         RUN:io          就绪          就绪          就绪             1
  2           阻塞       RUN:cpu          就绪          就绪             1             1
  3           阻塞       RUN:cpu          就绪          就绪             1             1
  4           阻塞       RUN:cpu          就绪          就绪             1             1
  5           阻塞       RUN:cpu          就绪          就绪             1             1
  6           阻塞       RUN:cpu          就绪          就绪             1             1
  7*          就绪          完成       RUN:cpu          就绪             1
  8           就绪          完成       RUN:cpu          就绪             1
  9           就绪          完成       RUN:cpu          就绪             1
 10           就绪          完成       RUN:cpu          就绪             1
 11           就绪          完成       RUN:cpu          就绪             1
 12           就绪          完成          完成       RUN:cpu             1
 13           就绪          完成          完成       RUN:cpu             1
 14           就绪          完成          完成       RUN:cpu             1
 15           就绪          完成          完成       RUN:cpu             1
 16           就绪          完成          完成       RUN:cpu             1
 17    RUN:io_done          完成          完成          完成             1
 18         RUN:io          完成          完成          完成             1
 19           阻塞          完成          完成          完成                           1
 20           阻塞          完成          完成          完成                           1
 21           阻塞          完成          完成          完成                           1
 22           阻塞          完成          完成          完成                           1
 23           阻塞          完成          完成          完成                           1
 24*   RUN:io_done          完成          完成          完成             1
 25         RUN:io          完成          完成          完成             1
 26           阻塞          完成          完成          完成                           1
 27           阻塞          完成          完成          完成                           1
 28           阻塞          完成          完成          完成                           1
 29           阻塞          完成          完成          完成                           1
 30           阻塞          完成          完成          完成                           1
 31*   RUN:io_done          完成          完成          完成             1

统计：总时间 31
统计：CPU 忙碌 21（67.74%）
统计：IO 忙碌  15（48.39%）`,
`时间        PID: 0        PID: 1        PID: 2        PID: 3           CPU            IO
  1         RUN:io          就绪          就绪          就绪             1
  2           阻塞       RUN:cpu          就绪          就绪             1             1
  3           阻塞       RUN:cpu          就绪          就绪             1             1
  4           阻塞       RUN:cpu          就绪          就绪             1             1
  5           阻塞       RUN:cpu          就绪          就绪             1             1
  6           阻塞       RUN:cpu          就绪          就绪             1             1
  7*   RUN:io_done          完成          就绪          就绪             1
  8         RUN:io          完成          就绪          就绪             1
  9           阻塞          完成       RUN:cpu          就绪             1             1
 10           阻塞          完成       RUN:cpu          就绪             1             1
 11           阻塞          完成       RUN:cpu          就绪             1             1
 12           阻塞          完成       RUN:cpu          就绪             1             1
 13           阻塞          完成       RUN:cpu          就绪             1             1
 14*   RUN:io_done          完成          完成          就绪             1
 15         RUN:io          完成          完成          就绪             1
 16           阻塞          完成          完成       RUN:cpu             1             1
 17           阻塞          完成          完成       RUN:cpu             1             1
 18           阻塞          完成          完成       RUN:cpu             1             1
 19           阻塞          完成          完成       RUN:cpu             1             1
 20           阻塞          完成          完成       RUN:cpu             1             1
 21*   RUN:io_done          完成          完成          完成             1

统计：总时间 21
统计：CPU 忙碌 21（100.00%）
统计：IO 忙碌  15（71.43%）`,
];
PROCESS_PRACTICE_TRACES[4] = PROCESS_PRACTICE_TRACES[2];

const PROCESS_RANDOM_PRACTICE = [
  {seed:1, instructions:['cpu → io → io_done → io → io_done','cpu → cpu → cpu'], explanation:[
    ['阻塞时切换的轨迹','进程 0 在时间 2 发起第一次 I/O，进程 1 在时间 3–5 完成三次计算。计算与 I/O 服务重叠，总时间为 15。'],
    ['两种完成规则为何相同','时间 8 第一次 I/O 完成时，只有进程 0 还能运行。立即运行与延后运行都选择进程 0，因而得到相同轨迹。'],
    ['阻塞时不切换的差异','进程 0 等待 I/O 时不运行进程 1。进程 1 的三次计算延后到时间 16–18，总时间增至 18。']
  ], traces:[
`时间        PID: 0        PID: 1           CPU            IO
  1        RUN:cpu          就绪             1
  2         RUN:io          就绪             1
  3           阻塞       RUN:cpu             1             1
  4           阻塞       RUN:cpu             1             1
  5           阻塞       RUN:cpu             1             1
  6           阻塞          完成                           1
  7           阻塞          完成                           1
  8*   RUN:io_done          完成             1
  9         RUN:io          完成             1
 10           阻塞          完成                           1
 11           阻塞          完成                           1
 12           阻塞          完成                           1
 13           阻塞          完成                           1
 14           阻塞          完成                           1
 15*   RUN:io_done          完成             1

统计：总时间 15
统计：CPU 忙碌 8（53.33%）
统计：IO 忙碌  10（66.67%）`, null,
`时间        PID: 0        PID: 1           CPU            IO
  1        RUN:cpu          就绪             1
  2         RUN:io          就绪             1
  3           阻塞          就绪                           1
  4           阻塞          就绪                           1
  5           阻塞          就绪                           1
  6           阻塞          就绪                           1
  7           阻塞          就绪                           1
  8*   RUN:io_done          就绪             1
  9         RUN:io          就绪             1
 10           阻塞          就绪                           1
 11           阻塞          就绪                           1
 12           阻塞          就绪                           1
 13           阻塞          就绪                           1
 14           阻塞          就绪                           1
 15*   RUN:io_done          就绪             1
 16           完成       RUN:cpu             1
 17           完成       RUN:cpu             1
 18           完成       RUN:cpu             1

统计：总时间 18
统计：CPU 忙碌 8（44.44%）
统计：IO 忙碌  10（55.56%）`, null]},
  {seed:2, instructions:['io → io_done → io → io_done → cpu','cpu → io → io_done → io → io_done'], explanation:[
    ['阻塞时切换的轨迹','两个进程先后发起 I/O，时间 4–6 有两个请求同时接受服务。各请求的服务时间可以重叠，总时间为 16。'],
    ['两种完成规则为何相同','时间 7、9、14、16 的完成事件到来时，另一个进程都阻塞或已完成。没有另一个可竞争 CPU 的进程，两种完成规则不改变选择。'],
    ['阻塞时不切换的差异','四次 I/O 服务依次发生，服务时间共 4 × 5 = 20；加上 10 个 CPU 动作，总时间为 30。']
  ], traces:[
`时间        PID: 0        PID: 1           CPU            IO
  1         RUN:io          就绪             1
  2           阻塞       RUN:cpu             1             1
  3           阻塞        RUN:io             1             1
  4           阻塞          阻塞                           2
  5           阻塞          阻塞                           2
  6           阻塞          阻塞                           2
  7*   RUN:io_done          阻塞             1             1
  8         RUN:io          阻塞             1             1
  9*          阻塞   RUN:io_done             1             1
 10           阻塞        RUN:io             1             1
 11           阻塞          阻塞                           2
 12           阻塞          阻塞                           2
 13           阻塞          阻塞                           2
 14*   RUN:io_done          阻塞             1             1
 15        RUN:cpu          阻塞             1             1
 16*          完成   RUN:io_done             1

统计：总时间 16
统计：CPU 忙碌 10（62.50%）
统计：IO 忙碌  14（87.50%）`, null,
`时间        PID: 0        PID: 1           CPU            IO
  1         RUN:io          就绪             1
  2           阻塞          就绪                           1
  3           阻塞          就绪                           1
  4           阻塞          就绪                           1
  5           阻塞          就绪                           1
  6           阻塞          就绪                           1
  7*   RUN:io_done          就绪             1
  8         RUN:io          就绪             1
  9           阻塞          就绪                           1
 10           阻塞          就绪                           1
 11           阻塞          就绪                           1
 12           阻塞          就绪                           1
 13           阻塞          就绪                           1
 14*   RUN:io_done          就绪             1
 15        RUN:cpu          就绪             1
 16           完成       RUN:cpu             1
 17           完成        RUN:io             1
 18           完成          阻塞                           1
 19           完成          阻塞                           1
 20           完成          阻塞                           1
 21           完成          阻塞                           1
 22           完成          阻塞                           1
 23*          完成   RUN:io_done             1
 24           完成        RUN:io             1
 25           完成          阻塞                           1
 26           完成          阻塞                           1
 27           完成          阻塞                           1
 28           完成          阻塞                           1
 29           完成          阻塞                           1
 30*          完成   RUN:io_done             1

统计：总时间 30
统计：CPU 忙碌 10（33.33%）
统计：IO 忙碌  20（66.67%）`, null]},
  {seed:3, instructions:['cpu → io → io_done → cpu','io → io_done → io → io_done → cpu'], explanation:[
    ['阻塞时切换、完成后延后运行','时间 8，进程 0 执行 io_done。时间 9，进程 1 的 I/O 完成，但 CPU 先执行进程 0 的最后一次计算。进程 1 到时间 11 才发起第二次 I/O，总时间为 18。'],
    ['阻塞时切换、完成后立即运行','进程 1 在时间 9 执行 io_done，时间 10 发起第二次 I/O；进程 0 的最后一次计算延后到时间 11。第二次请求提前一个时间单位，总时间由 18 降为 17。'],
    ['阻塞时不切换','进程 0 在时间 1–9 执行完毕，进程 1 在时间 10–24 执行。三次 I/O 服务依次发生，15 个服务时间单位加 9 个 CPU 动作，共 24；两种完成规则得到相同轨迹。']
  ], traces:[
`时间        PID: 0        PID: 1           CPU            IO
  1        RUN:cpu          就绪             1
  2         RUN:io          就绪             1
  3           阻塞        RUN:io             1             1
  4           阻塞          阻塞                           2
  5           阻塞          阻塞                           2
  6           阻塞          阻塞                           2
  7           阻塞          阻塞                           2
  8*   RUN:io_done          阻塞             1             1
  9*       RUN:cpu          就绪             1
 10           完成   RUN:io_done             1
 11           完成        RUN:io             1
 12           完成          阻塞                           1
 13           完成          阻塞                           1
 14           完成          阻塞                           1
 15           完成          阻塞                           1
 16           完成          阻塞                           1
 17*          完成   RUN:io_done             1
 18           完成       RUN:cpu             1

统计：总时间 18
统计：CPU 忙碌 9（50.00%）
统计：IO 忙碌  11（61.11%）`,
`时间        PID: 0        PID: 1           CPU            IO
  1        RUN:cpu          就绪             1
  2         RUN:io          就绪             1
  3           阻塞        RUN:io             1             1
  4           阻塞          阻塞                           2
  5           阻塞          阻塞                           2
  6           阻塞          阻塞                           2
  7           阻塞          阻塞                           2
  8*   RUN:io_done          阻塞             1             1
  9*          就绪   RUN:io_done             1
 10           就绪        RUN:io             1
 11        RUN:cpu          阻塞             1             1
 12           完成          阻塞                           1
 13           完成          阻塞                           1
 14           完成          阻塞                           1
 15           完成          阻塞                           1
 16*          完成   RUN:io_done             1
 17           完成       RUN:cpu             1

统计：总时间 17
统计：CPU 忙碌 9（52.94%）
统计：IO 忙碌  11（64.71%）`,
`时间        PID: 0        PID: 1           CPU            IO
  1        RUN:cpu          就绪             1
  2         RUN:io          就绪             1
  3           阻塞          就绪                           1
  4           阻塞          就绪                           1
  5           阻塞          就绪                           1
  6           阻塞          就绪                           1
  7           阻塞          就绪                           1
  8*   RUN:io_done          就绪             1
  9        RUN:cpu          就绪             1
 10           完成        RUN:io             1
 11           完成          阻塞                           1
 12           完成          阻塞                           1
 13           完成          阻塞                           1
 14           完成          阻塞                           1
 15           完成          阻塞                           1
 16*          完成   RUN:io_done             1
 17           完成        RUN:io             1
 18           完成          阻塞                           1
 19           完成          阻塞                           1
 20           完成          阻塞                           1
 21           完成          阻塞                           1
 22           完成          阻塞                           1
 23*          完成   RUN:io_done             1
 24           完成       RUN:cpu             1

统计：总时间 24
统计：CPU 忙碌 9（37.50%）
统计：IO 忙碌  15（62.50%）`, null]},
];
PROCESS_RANDOM_PRACTICE.forEach(record => {
  if (record.traces[1] === null) record.traces[1] = record.traces[0];
  record.traces[3] = record.traces[2];
});