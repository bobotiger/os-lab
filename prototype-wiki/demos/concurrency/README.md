# 并发参考实践程序

`concurrency_lab.py` 是本站的确定性教学模拟器，使用 Python 3.8 及以上版本，不依赖第三方包。可在 Linux 终端运行，也可在具备 Python 3 的其他系统使用。

它不创建真实线程，不展示宿主机实际调度，不测量真实性能。固定次序便于重复分析；错误模型不对应带有未定义行为的 C 程序。

## 运行

下载脚本，在脚本所在目录打开终端：

```sh
python3 concurrency_lab.py --help
python3 concurrency_lab.py updates --order ABABAB
python3 concurrency_lab.py updates --order AAABBB
python3 concurrency_lab.py locks --policy opposite
python3 concurrency_lab.py locks --policy ordered
python3 concurrency_lab.py events --mode blocking --delay 4
python3 concurrency_lab.py events --mode async --delay 4
```

## 参数与输出

- `updates --order`：次序字符串恰含三个 A、三个 B。每个线程依次读取、加一、写回。`local` 是线程的局部值，`shared` 是共享值。`ABABAB` 最后为 1，`AAABBB` 最后为 2。
- `locks --policy opposite|ordered`：分别表示 A 按 L1→L2、B 按 L2→L1，以及双方统一按 L1→L2。默认交替推进；`--schedule serial` 改为 A 完成后 B 执行。`waits for` 表示获取失败后等待；`completed` 只计同时持有两锁后完成的操作。相反次序配合交替推进会形成死锁；相反次序配合依次运行可以结束，不能据此证明方案无死锁风险。
- `events --mode blocking|async --delay 4|8`：A 在 t=0 到达，B 在 t=1 到达。A 提交和恢复处理各需 1 单位，I/O 另需 delay 单位，B 需 1 单位。每行 `[t,t+1)` 表示一个区间；`completed` 是完成时刻，不是延迟或 CPU 用时。delay=4 时，阻塞方案 A=6、B=7，异步方案 A=6、B=2。`idle` 表示没有就绪事件，可以休眠等待，不要求忙等。

参数不合法会打印用法并以非零状态退出。死锁场景会在识别相互等待后正常打印结论并退出，不会让终端一直挂起。

## 分析方向

先核对逐步输出与对应知识页的共享状态，再改变一个条件进行比较。计数器关注检查或读取的结果何时过期；锁关注等待者同时持有什么；事件循环关注等待 I/O 时能否处理已就绪的其他请求。参考页面还链接条件变量和信号量的队列比较，无需编写完整的线程库或服务器。

## 真实线程对照：锁的保护范围

`thread_counter.c` 在 Linux 中通过 pthread 创建两个真实线程，共同更新一个初值为 0 的计数器。使用已有的 C 编译器编译：

```sh
cc -std=c11 -O2 -Wall -Wextra -pthread thread_counter.c -o thread_counter
./thread_counter whole
./thread_counter split
```

- `whole`：锁保护完整的“读取、加一、写回”，末行为 `joined=2; count=2; expected=2`。
- `split`：读取和写回分别加锁；程序安排两个线程都读完旧值后才继续写回，末行为 `joined=2; count=1; expected=2`。

两个方案每次访问共享计数器时都正确加锁；差别是保护范围。split 中使用一次同步等待来稳定复现“双方都读到 0”的次序，不代表自然调度总会这样安排，也不依赖无锁 C 数据竞争或随机碰运气。完整加锁方案不在持锁期间等待对方读取。

每个线程的输出记录包含 `pid`（进程号）、`tid`（Linux 线程号）、`read`（读到的旧值）和 `wrote`（写回的值）。同一次运行的两个 pid 相同、tid 不同；具体号码随运行变化。主线程在两个 join 都成功返回后统一按 A、B 顺序打印记录，这个显示顺序不代表实际执行先后。

比较两条命令时，关注 join 保证线程已结束，却不能补救此前错误的更新；正确性还取决于锁是否覆盖完整操作。源码可供查看，不要求掌握屏障接口的实现。`./thread_counter --help` 显示参数说明；非法参数以非零状态退出。
