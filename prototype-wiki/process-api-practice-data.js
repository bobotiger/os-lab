const API_SIMULATION_PRACTICE = [
  {
    title: '逐步推导进程树', topic: '每个动作后的父子关系',
    question: '运行 fork.py -s 10，预测每个动作后的进程树，再用 -c 核对。更换随机种子 -s 或增加动作数量 -a，继续推导。',
    command: 'python3 fork.py -s 10',
    steps: [
            ['从根进程逐次添加子节点', ['初始只有 a。第一次动作是 a 创建 b，树中增加直接接在 a 下的 b。', '第二次动作是 a 创建 c。此时 a 有两个直接子进程 b、c。']],
            ['删除退出节点，检查其后代', ['第三次动作是 c 退出，从树中删除 c。', 'c 没有子进程，不需要重新挂载其他节点。此时 a 的直接子进程只剩 b。']],
            ['继续更新并核对每个阶段', ['第四、第五次动作分别是 a 创建 d、a 创建 e。最终存活节点为 a、b、d、e，b、d、e 都直接接在 a 下。', '用相同参数加 -c，逐次核对节点和连线；再用 python3 fork.py -s 4 -a 8 对新的动作序列重复推导。']],
    ],
        conclusion: [['最终进程树', 'a 的直接子进程是 b、d、e；c 已退出。'], ['节点变化的原因', '四次创建增加四个节点，一次退出删除 c，最终保留根节点及三个子节点。'], ['后续名称的分配', '退出不会使名称重新使用。c 退出后，新创建的进程仍依次命名为 d、e。']],
  },
  {
    title: '改变创建进程的概率', topic: '概率与实际创建、退出数量',
    question: '使用 -a 100 生成大量动作，将 -f 从 0.1 变到 0.9。先预测最终进程数量与父子关系的层次，再用 -c 核对。',
    command: 'python3 fork.py -s 10 -a 100 -f 0.1 -F',
    extra: 'for probability in 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9; do\n  python3 fork.py -s 10 -a 100 -f "$probability" -F -c\ndone',
    steps: [
            ['固定其他条件，只改变创建概率', ['各次运行都使用 -s 10 -a 100，只将 -f 从 0.1 逐步增至 0.9。', '-f 用小数表示概率。0.1 表示随机选择创建动作的概率为 10%，不表示本次必须恰好创建 10 次。']],
            ['逐项核算最终节点数量', ['从一个根节点开始：最终节点数 = 1 + 实际创建次数 − 实际退出次数。', '-f 0.1：1 + 50 − 50 = 1。', '-f 0.5：1 + 53 − 47 = 7。', '-f 0.9：1 + 92 − 8 = 85。']],
            ['分别检查数量、层次与根节点限制', ['在这三个参考条件中，创建概率越高，最终保留的节点越多。树有多少层、各节点有几个子进程，还要查看每次动作选中的进程。', '只剩根进程 a 时，a 不能退出，下一次有效动作必须创建进程。因此实际创建比例可能远高于设置的概率。', '换种子后重新统计数量和父子关系，不将这些具体数值推广为其他运行的固定结果。']],
    ],
        conclusion: [['本次节点数量', '种子 10、100 个动作时，创建概率 0.1、0.5、0.9 分别留下 1、7、85 个节点。'], ['数量变化的原因', '节点数由实际创建与退出次数决定，不能直接用 100 乘以创建概率求最终数量。根进程不能退出也会影响实际动作比例。'], ['节点数量与父子关系', '相同节点总数不意味着相同父子关系；树的深度和分支取决于哪些进程创建了子进程，以及退出后的重新挂载。']],
  },
  {
    title: '由进程树推断动作', topic: '比较相邻状态',
    question: '使用 -t，根据每一步给出的进程树判断发生了什么动作，再用 -c 核对。',
    command: 'python3 fork.py -s 10 -t',
    steps: [
            ['用新增节点和连线确定创建者', ['第一次变化新增 b，父节点为 a，动作是 a forks b。', '第二次变化新增 c，父节点也为 a，动作是 a forks c。']],
            ['用消失节点确定退出者', ['第三次变化中 c 消失，动作是 c EXITS；b 仍直接接在 a 下。', 'c 没有后代，因此这次退出只删除 c，没有其他连线需要调整。']],
            ['恢复剩余动作，再核对顺序', ['第四、第五次变化分别在 a 下新增 d、e，动作是 a forks d、a forks e。', '完整顺序为创建 b、创建 c、c 退出、创建 d、创建 e，与第 1 题一致。-t 改变的是给出的已知条件，不改变生成的动作。']],
    ],
        conclusion: [['恢复出的动作', '依次为 a forks b、a forks c、c EXITS、a forks d、a forks e。'], ['判断动作的依据', '相邻树之间新增节点的父节点确定创建者；消失的节点确定退出者。'], ['退出时还需检查什么', '若退出者有后代，需要按当前重新挂载规则解释连线变化，不能把所有父节点变化都当作新的创建动作。']],
  },
  {
    title: '进程退出后的父子关系', topic: '默认规则与局部重新挂载',
    question: '运行 -A a+b,b+c,c+d,c+e,c-：a 创建 b，b 创建 c，c 创建 d、e 后退出。预测退出后的树，再比较加 -R 的结果，并查阅真实系统如何接收孤儿进程。',
    command: 'python3 fork.py -A a+b,b+c,c+d,c+e,c-',
    extra: 'python3 fork.py -A a+b,b+c,c+d,c+e,c- -R -c',
    steps: [
            ['先画出退出前的父子关系', ['a 的直接子进程为 b，b 的直接子进程为 c，c 的直接子进程为 d、e。', 'c 退出时只删除 c。d、e 仍存活，需要确定它们退出后的父节点。']],
            ['按默认规则重新挂载', ['默认规则把退出节点的全部后代直接挂到根进程 a 下，因此 d、e 的父节点改为 a。', 'b 原本就接在 a 下。最终 a 的直接子进程为 b、d、e。']],
            ['按 -R 规则重新推导并比较', ['-R 将退出节点的直接子进程交给它的父节点。因此 d、e 的父节点改为 b，a 仍只有直接子进程 b。', '若 d 还有自己的子进程，-R 会保留 d 与它的子进程之间的关系，不将这些后代全部拆开。']],
    ],
        conclusion: [['默认规则的结果', 'a 的直接子进程为 b、d、e。'], ['-R 规则的结果', 'a 的直接子进程为 b；b 的直接子进程为 d、e。两种规则都保留 d、e，区别在于它们的新父节点。'], ['孤儿进程的含义', '父进程已退出、自己仍存活的子进程称为孤儿进程。这里 d、e 在 c 退出后需要由其他进程接收，不会随 c 一同退出。']],
    supplements: [['Linux 如何接收孤儿进程', '在 Linux 中，孤儿进程通常由仍存活的、最近的祖先进程中被设置为子进程收养者（subreaper）的进程接收；没有这样的祖先进程时，由所在 PID 命名空间的 init 进程接收。PID 命名空间是独立管理进程编号的范围，其中的 init 是初始进程。实际接收者由这些条件决定，不一定是原父进程的父进程，也不一定对应模拟树中的 a。']],
  },
  {
    title: '从全部动作推导最终树', topic: '按顺序更新存活节点',
    question: '使用 -F，只根据完整动作序列推导最终树。先运行 fork.py -F，再用不同种子多试几次，并用 -c 核对。',
    command: 'python3 fork.py -s 10 -F',
    extra: 'python3 fork.py -s 4 -F -c\npython3 fork.py -s 2 -F -c',
    steps: [
            ['按给定顺序逐次处理动作', ['种子 10 的顺序是 a forks b、a forks c、c EXITS、a forks d、a forks e。', '-F 不改变动作序列，只省去每个动作后的中间树。推导时仍需保留全部动作及其顺序。']],
            ['同时更新存活节点和父节点', ['从 {a} 开始，创建 b、c 后依次得到 {a,b}、{a,b,c}；b、c 的父节点均为 a。', 'c 退出后剩 {a,b}。随后创建 d、e，依次得到 {a,b,d}、{a,b,d,e}；d、e 的父节点均为 a。']],
            ['根据最终父节点画出树', ['最终 b、d、e 都存活，父节点都为 a，因此分别接在 a 下；c 不再出现在树中。', '换种子后，若某个后来退出的进程此前创建过子进程，仍须处理这些创建动作及退出时的重新挂载，不能直接略去该进程的全部历史。']],
    ],
        conclusion: [['种子 10 的最终树', 'a 有 b、d、e 三个直接子进程，c 已退出。'], ['完整动作能确定结果的原因', '初始树和重新挂载规则确定后，按顺序处理全部动作即可确定存活节点及最终父子关系。'], ['退出节点的历史仍有影响', '不能跳过后来退出的进程此前创建子进程的动作；这些子进程可能继续存活，并在父进程退出时改归其他节点。']],
  },
  {
    title: '最终树能否唯一确定动作', topic: '最终状态与历史信息',
    question: '同时使用 -t 和 -F，仅根据最终树判断发生过的动作。哪些情况下能确定完整历史，哪些情况下不能？换种子继续比较。',
    command: 'python3 fork.py -s 10 -t -F',
    extra: 'python3 fork.py -A a+b,a+c,c-,a+d,a+e -F -c\npython3 fork.py -A a+b,a+c,a+d,c-,a+e -F -c',
    steps: [
            ['区分最终状态与创建历史', ['最终 a 的直接子进程为 b、d、e。这能确定哪些节点仍存活及它们当前的父节点。', '若发生过退出和重新挂载，当前父节点不一定就是最初的创建者，最终树也不直接记录退出时刻。']],
            ['构造得到相同结果的两段历史', ['序列一：a 创建 b、a 创建 c、c 退出、a 创建 d、a 创建 e。', '序列二：a 创建 b、a 创建 c、a 创建 d、c 退出、a 创建 e。', '两段历史都是五个动作，最终树相同。连续命名下缺失的 c 提示它曾创建后退出，但不能确定退出时机。']],
            ['明确能够唯一恢复的条件', ['若已知没有退出、名称严格按创建顺序分配，且全部节点保留在最终树中，可以按名称顺序读取各节点的父节点，恢复创建动作。', '有退出或重新挂载时，中间信息可能丢失。-c 显示本次实际动作，只提供一个历史，不证明这个历史是唯一答案。']],
    ],
        conclusion: [['本题不能唯一恢复历史', '即使知道有五个动作及名称分配顺序，仍无法仅凭最终树确定 c 在创建 d 之前还是之后退出。'], ['信息不足的原因', '最终树只保留存活节点及当前连线，没有记录已退出节点的退出时刻。'], ['可以唯一恢复的条件', '若确定没有退出、全部节点都保留且名称严格按创建顺序分配，最终父节点和名称顺序可以共同确定创建动作。']],
  },
];

const API_CODE_PRACTICE = [
  {
    file: 'q1-fork-variable', title: 'fork 前后的私有变量', api: 'fork()',
    question: '编写一个调用 fork() 的程序。调用前把变量 x 设为 100：子进程看到什么值？父子进程分别修改 x 后，各自的值会怎样变化？',
    steps: [
            ['确定创建时各自看到的初始值', ['fork 前 x = 100。父子在修改之前分别输出 initial x，两者均为 100。', '子进程从 fork 返回处继续执行，继承创建时的地址空间内容，不会从 main 开头重新运行。']],
            ['分别跟踪父子进程的修改', ['子进程的 fork 返回值为 0，在对应分支把自己的 x 改为 200。', '父进程的 fork 返回值是子 PID，在对应分支把自己的 x 改为 300。']],
            ['将变量取值与输出顺序分别核对', ['多次运行时，父进程修改后的 x 应为 300，子进程应为 200。每个进程都先输出自己的初始值，再输出修改后的值。', '父子之间没有规定这几行的相对顺序。末尾的 wait 等待并回收子进程，不会反过来约束此前的输出顺序。']],
    ],
    output: 'before fork: x = 100\nparent: initial x = 100\nparent: x = 300\nchild: initial x = 100\nchild: x = 200',
    note: '一次运行示例。父子各自先输出初始值、再输出修改后的值；两组输出之间的行序可能改变。',
    conclusion: [['变量取值的结果', '父子最初都看到 x = 100；修改后父进程看到 300，子进程看到 200。'], ['修改不会互相覆盖的原因', '父子拥有独立的虚拟地址空间，普通私有变量不是共享变量；一方修改自己的 x 不会改变另一方的 x。'], ['输出顺序的条件', '每个进程内部保持先输出初始值、再输出修改值，但父子两组输出之间的顺序没有保证。']],
    supplements: [['写时复制与独立变量', '写时复制（Copy-on-Write）是一种实现地址空间独立的方法：父子可以暂时引用相同的物理页面，当某个进程写入时，再为它复制相关页面。物理页面暂时相同，不意味着一个进程对私有变量的修改会被另一个进程看到。']],
  },
  {
    file: 'q2-shared-file', title: '继承的文件描述符', api: 'open() · fork() · write()',
    question: '用 open() 打开文件，再用 fork() 创建子进程。父子能否使用原来的文件描述符？它们并发写入时，文件内容会怎样变化？',
    extra: 'cat q2-output.txt\nwc -l q2-output.txt\ngrep -c "^parent:" q2-output.txt\ngrep -c "^child:" q2-output.txt',
    steps: [
    ['确定打开文件与创建进程的先后', ['先用 O_CREAT | O_TRUNC | O_WRONLY 打开 q2-output.txt，再 fork。每次运行都会先清空这个练习文件。', '父子各自的描述符表都包含可使用的 fd，两个 fd 引用同一个内核打开文件描述。打开文件描述保存文件偏移，也就是下一次读写的位置。']],
    ['分别核对记录数量和排列顺序', ['父子分别写入编号 0 到 49 的记录。正常完成后应有 100 行，其中 parent、child 各 50 行；用 wc 和 grep 核对。', '用 cat 比较记录顺序。父子各自按编号写入，但两组记录之间的先后由实际调度和 write 调用顺序决定。']],
    ['沿共享偏移解释连续写入', ['一个进程写入后推进共享文件偏移，另一个从更新后的位置继续写。因此它们不是分别从文件开头写并互相覆盖。', '父子的描述符表仍然独立。共享的是这次打开的内核对象及其中的偏移、文件状态标志，不是两张描述符表。']],
    ],
    output: 'Both processes wrote to q2-output.txt\n\n文件记录总数：100\nparent 记录：50\nchild 记录：50',
    note: '每次运行覆盖 q2-output.txt。记录顺序由实际调度和 write 调用顺序决定，不保证先 parent 或先 child。',
    conclusion: [['正常完成后的内容', '文件共 100 行，parent、child 各 50 行。两类记录可能交错排列，不保证哪一方先写完。'], ['父子能够接续写入的原因', '继承的 fd 引用同一个打开文件描述，共享文件偏移。一方写入推进偏移，另一方从更新后的位置继续写。'], ['顺序保证的范围', '多次 write 调用之间没有整体顺序保证。一个逻辑记录若分多次写入，另一进程的写入可能穿插其中。']],
  },
  {
    file: 'q3-hello-goodbye', title: '子进程先输出，父进程后输出', api: 'fork() · pipe() · read()',
    question: '创建一个子进程，让它打印 hello，让父进程打印 goodbye。能否不在父进程调用 wait()，仍保证子进程总是先打印？',
    steps: [
            ['先建立单向通知通道', ['在 fork 前创建管道，使父子都继承管道两端。', '子进程关闭读端，保留写端；父进程关闭写端，保留读端。通知从子进程传向父进程。']],
            ['按事件依赖确定两次输出的顺序', ['子进程先成功把 hello 写到标准输出，再向管道写入一个通知字节。', '父进程先读取通知；没有数据时阻塞，收到通知后才写入 goodbye。因此 goodbye 的写入必定晚于 hello 的写入。']],
            ['检查通知究竟保证了什么', ['父进程没有调用 wait 或 waitpid，输出顺序由管道通知建立，不依赖谁先获得 CPU。', '通知只说明 hello 已写入，不说明子进程已结束，也不代替回收。长期运行的父进程仍需另行回收已退出的子进程。']],
    ],
    output: 'hello\ngoodbye', note: '通知必须发生在 hello 成功写入之后；固定时长的 sleep 不能建立这个先后关系。',
    conclusion: [['成功运行时的输出', 'hello 在前，goodbye 在后；不需要用 wait 建立这一输出顺序。'], ['顺序成立的原因', '父进程先运行会等待通知，子进程先运行则留下可读取的通知。两种情况都要求 hello 写入成功后才发通知。'], ['同步与回收的区别', '通知建立输出之间的先后关系，不证明子进程已退出，也不收集其终止状态。固定时长的 sleep 不能替代这个事件依赖。']],
  },
  {
    file: 'q4-exec-variants', title: 'exec 的参数、路径与环境', api: '六种 exec 接口',
    question: 'fork 后运行 /bin/ls。分别尝试 execl、execle、execlp、execv、execvp、execvpe：为什么同一种程序替换操作需要这些接口？',
    run: 'for variant in execl execle execlp execv execvp execvpe; do\n  echo "== $variant =="\n  ./q4-exec-variants "$variant"\ndone',
    steps: [
            ['固定执行目标，只改变 exec 变体', ['六次运行都让子进程执行 ls -d /bin/ls，输出目标路径。命令行参数只选择所用的 exec 接口。', '父进程用 waitpid 等待子进程并检查退出状态。比较时保持 ls 的参数一致，避免把目标程序的差异当作接口差异。']],
            ['分别比较参数、定位和环境', ['参数形式：l 逐个传入参数，以空指针结束；v 传入以 NULL 结尾的参数数组 argv。', '程序定位：p 在文件名不含斜线时按 PATH 搜索；不带 p 的接口使用给定路径。', '环境来源：e 显式传入以 NULL 结尾的环境数组 envp；没有 e 时继承当前环境。']],
            ['分别判断成功与失败后的状态', ['六种接口成功执行同一个 ls，都输出 /bin/ls。当前进程的程序被替换，PID 不变，不返回原来的调用点。', '只有 exec 失败时才返回 -1 并设置 errno。exec 后的报错语句因此只在失败路径执行。']],
    ],
    output: '== execl ==\n/bin/ls\n== execle ==\n/bin/ls\n== execlp ==\n/bin/ls\n== execv ==\n/bin/ls\n== execvp ==\n/bin/ls\n== execvpe ==\n/bin/ls',
    note: '六种接口执行同一个 ls。不同之处是参数、程序定位与环境的提供方式。',
    conclusion: [['六种接口的运行结果', '目标程序和参数相同时，六种方式都运行 ls 并输出 /bin/ls。'], ['选择接口的依据', '参数已有数组时选 v；需要按 PATH 查找时选 p；需要指定新程序环境时选 e。差别在于如何提供参数、定位程序及设置环境。'], ['不变的程序替换语义', 'exec 替换当前进程的程序，不创建新进程，成功后不返回原调用点；fork 才创建子进程。']],
    supplements: [['Linux 中 execvpe 的声明与 PATH', 'execvpe 是 GNU 扩展，参考源码在头文件前定义 _GNU_SOURCE，使编译器能够取得它的函数声明。在 glibc 中，execvpe 用调用进程当前环境中的 PATH 搜索可执行文件，再把显式 envp 交给新程序；envp 中的 PATH 不用于这次查找。']],
  },
  {
    file: 'q5-wait-return', title: 'wait 的返回值与退出状态', api: 'wait() · ECHILD',
    question: '父进程调用 wait() 等待子进程完成，wait() 返回什么？如果子进程也调用 wait()，会发生什么？',
    steps: [
    ['先检查子进程是否有可等待对象', ['本题的子进程没有再 fork，没有自己的子进程。它调用 wait 返回 -1，errno 为 ECHILD。', '该子进程随后以退出码 7 结束。ECHILD 表示没有可等待的子进程，不是说调用者作为子进程就不能使用 wait。']],
    ['核对父进程得到的返回值', ['父进程调用 wait(&status)，等待并回收该子进程。成功返回值是被回收子进程的 PID，不是退出码 7。', '将这个返回值与父进程 fork 得到的子 PID 比较。参考输出的 yes 表示二者一致。']],
    ['再按终止类型解码 status', ['status 保存编码后的终止信息，不直接等于退出码。检查 WIFEXITED(status) 为真后，用 WEXITSTATUS(status) 得到 7。', '若子进程因信号终止，则先检查 WIFSIGNALED，再用 WTERMSIG 获取信号编号，不能按正常退出码解释。']],
    ],
    output: 'child: wait returned -1, errno = 10 (No child processes)\nparent: wait returned child PID: yes\nparent: child exit status = 7',
    note: 'errno 数字是 Ubuntu 22.04 中的一次结果。判断错误应使用 ECHILD，而不是写死数字 10。',
    conclusion: [['父进程的等待结果', 'wait 成功返回被回收子进程的 PID；确认正常退出后，从 status 解码得到退出码 7。返回 PID、status、退出码是三种不同的数据。'], ['子进程调用失败的原因', '不是“子进程不能 wait”，而是本题的子进程没有自己的子进程，因此返回 -1 并设置 ECHILD。'], ['子进程也能等待的条件', '若子进程再用 fork 创建自己的子进程，它也可以等待并回收自己的直接子进程。']],
  },
  {
    file: 'q6-waitpid', title: '用 waitpid 选择等待对象', api: 'waitpid() · WNOHANG',
    question: '把上一题的 wait() 改为 waitpid()。什么时候需要指定等待对象或采用非阻塞等待？',
        basic: {title:'先修改第 5 题的父进程等待调用', code:'pid_t result = waitpid(child_pid, &status, 0);', explanation:'把父进程中的 wait(&status) 换成这一行，其余逻辑保持不变。child_pid 是 fork 返回的子进程 PID，0 表示阻塞等待。成功时仍返回该 PID，并通过 status 取得退出码 7。'},
        sourceLabel: '双子进程扩展示例源码',
        outputLabel: '双子进程扩展示例的运行结果',
    steps: [
        ['先在单子进程程序中完成最小修改', ['将父进程的 wait(&status) 换成 waitpid(child_pid, &status, 0)，明确指定等待对象，0 表示阻塞等待。', '成功返回后的 PID、status 和退出码仍按第 5 题检查。wait(&status) 相当于 waitpid(-1, &status, 0)，可等待任意直接子进程。']],
        ['再用两个子进程区分等待对象', ['扩展示例中，第一个子进程以 11 退出；第二个必须收到管道通知后才以 22 退出。父进程保存两个不同的 PID。', '指定各自 PID 后，可以分别核对退出码 11、22，避免把另一个子进程的终止状态误认为目标对象的状态。']],
        ['按非阻塞检查、回收和通知的顺序推导', ['发送通知前，waitpid(second_child, &status, WNOHANG) 返回 0，表示此次没有取得第二个子进程的状态，不能据此解码 status。', '父进程先回收第一个子进程，再发送通知；最后用 options = 0 阻塞等待并回收第二个，得到退出码 22。', '第二个子进程的正常退出依赖通知，不是依赖固定时长的休眠。因此通知前的非阻塞检查不取决于调度速度。']],
    ],
    output: 'second child before release: waitpid returned 0\nfirst child: selected PID = yes, exit status = 11\nsecond child: selected PID = yes, exit status = 22',
    note: '管道保持第二个子进程未结束，使非阻塞检查的返回 0 不依赖调度速度。',
    conclusion: [['最小修改的结果', 'waitpid(child_pid, &status, 0) 等待指定子进程，成功返回该 PID；第 5 题的正常退出码仍为 7。'], ['两种选项的用途', '多个子进程需要区分对象时，指定 PID；需要立即检查并继续其他工作时，使用 WNOHANG。扩展示例分别回收退出码为 11、22 的两个子进程。'], ['返回值必须分别判断', '成功取得状态返回对应 PID；使用 WNOHANG 且本次无状态可取时返回 0；错误返回 -1。只有成功取得状态后才能解码 status。']],
  },
  {
    file: 'q7-close-stdout', title: '关闭子进程的标准输出', api: 'close() · printf() · fflush()',
    question: '创建子进程，在子进程中关闭 STDOUT_FILENO，再调用 printf() 打印。文字会去哪里，错误会在什么时候出现？',
    steps: [
            ['区分输出流、缓冲与文件描述符', ['stdout 是 C 标准 I/O 库的输出流，可以先在用户态缓冲中暂存字符。STDOUT_FILENO 是实际写入使用的文件描述符 1。', '参考程序在 fork 前设置全缓冲，缓冲区满或刷新时才实际写出。子进程随后关闭自己的描述符 1，父进程的描述符 1 不受影响。']],
            ['分别检查 printf 和 fflush 的结果', ['子进程的 printf 返回 37：字符先进入标准 I/O 缓冲，尚不能证明它们已到达终端。', '随后 fflush 尝试把缓冲内容写入已关闭的描述符，返回 -1，errno 为 EBADF，流的错误标志非零。']],
            ['核对诊断通道和父进程的输出', ['子进程通过仍有效的 stderr 报告 fflush、ferror、errno，而不是通过已关闭的标准输出通道报告。父进程等待子进程后仍能输出。', '其他缓冲方式下，错误可能在 printf 本身就出现。应区分写入缓冲与实际写出，不能将“printf 总是先成功”作为规则。']],
    ],
    output: 'child: printf=37, fflush=-1, ferror=1, errno=9 (Bad file descriptor)\nparent: stdout still works',
    note: 'child 诊断来自 stderr，parent 行来自 stdout。检查 EBADF 和非零流错误标志，不依赖具体 errno 或 ferror 数字。',
    conclusion: [['子进程文字的去向', 'printf 的文字先进入 stdout 缓冲，但不能经已关闭的描述符 1 写到标准输出目标。stderr 上的诊断是另一条输出通道。'], ['fflush 返回的写入错误', '本例 fflush 返回 -1，流错误标志非零，errno 为 EBADF。printf 返回字符数只表明接受了字符，不等于实际输出已完成。'], ['父进程与其他缓冲方式', '父进程的描述符 1 仍有效。若改变缓冲方式，失败也可能在 printf 时出现，而不必等到 fflush。']],
  },
  {
    file: 'q8-pipe-children', title: '用管道连接两个子进程', api: 'pipe() · dup2() · waitpid()',
    question: '创建两个子进程，用 pipe() 把一个子进程的标准输出连接到另一个的标准输入。',
    steps: [
    ['先建立管道，再连接标准输入输出', ['pipe_fds[0] 为读端，pipe_fds[1] 为写端。先 pipe 再创建两个子进程，使父进程和两个子进程都继承两端。', 'writer 用 dup2 让 fd 1 引用管道写端；reader 用 dup2 让 fd 0 引用管道读端。数据路径为 writer 的 stdout → 管道 → reader 的 stdin。']],
    ['逐进程检查保留与关闭的描述符', ['writer 关闭原始读、写端，保留指向管道的 fd 1；reader 关闭原始两端，保留指向管道的 fd 0。dup2 建立的新引用不会因关闭原始描述符而取消。', '父进程关闭自己的两端，再分别等待两个子进程。父进程不参与数据读写，也不保留写端引用。']],
    ['分别推导数据传输与读取结束', ['writer 写入 message from writer child。reader 从标准输入循环读取，读到 EOF 后把收到的内容写到自己的标准输出。', '所有写端引用都关闭，且管道数据已经读完时，read 才返回 0，表示 EOF。父进程若保留写端，reader 可能一直等不到 EOF。', '管道是单向字节流，不保留消息边界；循环读取是必要的，不能假设一次 read 就取得一次 write 的全部字节。']],
    ],
    output: 'reader received: message from writer child',
    note: '管道是单向字节流，不保留消息边界；一次 read 不保证取得一次 write 的全部字节。',
    conclusion: [['消息传输的结果', 'reader 从管道收到 writer 写入的内容，并输出 reader received: message from writer child。'], ['数据通路成立的原因', 'dup2 让 writer 的 fd 1 和 reader 的 fd 0 分别引用管道写端、读端；关闭原始描述符不取消这两个新引用。'], ['reader 结束读取的条件', '管道数据读完且所有写端引用都关闭后，read 才返回 0。父进程也必须关闭写端，不能只检查 writer 是否已退出。']],
  },
];

const API_PRACTICE_SOURCES = [
String.raw`#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
    int x = 100;
    pid_t pid;

    printf("before fork: x = %d\n", x);
    fflush(stdout);

    pid = fork();
    if (pid < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }

    if (pid == 0) {
        printf("child: initial x = %d\n", x);
        x = 200;
        printf("child: x = %d\n", x);
        return EXIT_SUCCESS;
    }

    printf("parent: initial x = %d\n", x);
    x = 300;
    printf("parent: x = %d\n", x);

    if (wait(NULL) < 0) {
        perror("wait");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}`,
String.raw`#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

static int write_all(int fd, const char *buffer, size_t length)
{
    while (length > 0) {
        ssize_t written = write(fd, buffer, length);

        if (written < 0) {
            if (errno == EINTR) {
                continue;
            }
            return -1;
        }

        buffer += written;
        length -= (size_t)written;
    }

    return 0;
}

static int write_records(int fd, const char *process_name)
{
    char record[64];

    for (int index = 0; index < 50; index++) {
        int length = snprintf(record, sizeof(record), "%s: %d\n",
                              process_name, index);

        if (length < 0 || (size_t)length >= sizeof(record) ||
            write_all(fd, record, (size_t)length) < 0) {
            return -1;
        }
    }

    return 0;
}

int main(void)
{
    const char *path = "q2-output.txt";
    int fd = open(path, O_CREAT | O_TRUNC | O_WRONLY, 0644);
    pid_t pid;

    if (fd < 0) {
        perror("open");
        return EXIT_FAILURE;
    }

    pid = fork();
    if (pid < 0) {
        perror("fork");
        close(fd);
        return EXIT_FAILURE;
    }

    if (pid == 0) {
        if (write_records(fd, "child") < 0) {
            perror("child write");
            close(fd);
            _exit(EXIT_FAILURE);
        }
        close(fd);
        _exit(EXIT_SUCCESS);
    }

    if (write_records(fd, "parent") < 0) {
        perror("parent write");
        close(fd);
        return EXIT_FAILURE;
    }

    if (close(fd) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }

    if (waitpid(pid, NULL, 0) < 0) {
        perror("waitpid");
        return EXIT_FAILURE;
    }

    printf("Both processes wrote to %s\n", path);
    return EXIT_SUCCESS;
}`,
String.raw`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <unistd.h>

static int write_all(int fd, const char *buffer, size_t length)
{
    while (length > 0) {
        ssize_t written = write(fd, buffer, length);

        if (written < 0) {
            if (errno == EINTR) {
                continue;
            }
            return -1;
        }

        buffer += written;
        length -= (size_t)written;
    }

    return 0;
}

int main(void)
{
    int ready_pipe[2];
    pid_t pid;

    if (pipe(ready_pipe) < 0) {
        perror("pipe");
        return EXIT_FAILURE;
    }

    pid = fork();
    if (pid < 0) {
        perror("fork");
        close(ready_pipe[0]);
        close(ready_pipe[1]);
        return EXIT_FAILURE;
    }

    if (pid == 0) {
        const char ready = '1';

        close(ready_pipe[0]);
        if (write_all(STDOUT_FILENO, "hello\n", 6) < 0 ||
            write_all(ready_pipe[1], &ready, 1) < 0) {
            _exit(EXIT_FAILURE);
        }
        close(ready_pipe[1]);
        _exit(EXIT_SUCCESS);
    }

    close(ready_pipe[1]);
    for (;;) {
        char ready;
        ssize_t count = read(ready_pipe[0], &ready, 1);

        if (count == 1) {
            break;
        }
        if (count < 0 && errno == EINTR) {
            continue;
        }

        close(ready_pipe[0]);
        return EXIT_FAILURE;
    }
    close(ready_pipe[0]);

    if (write_all(STDOUT_FILENO, "goodbye\n", 8) < 0) {
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}`,
String.raw`#define _GNU_SOURCE

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

extern char **environ;

static void run_exec_variant(const char *variant)
{
    char *const arguments[] = {"ls", "-d", "/bin/ls", NULL};
    char *const custom_environment[] = {
        "PATH=/usr/bin:/bin",
        "Q4_EXEC_VARIANT=custom-environment",
        NULL
    };

    if (strcmp(variant, "execl") == 0) {
        execl("/bin/ls", "ls", "-d", "/bin/ls", (char *)NULL);
    } else if (strcmp(variant, "execle") == 0) {
        execle("/bin/ls", "ls", "-d", "/bin/ls", (char *)NULL,
               custom_environment);
    } else if (strcmp(variant, "execlp") == 0) {
        execlp("ls", "ls", "-d", "/bin/ls", (char *)NULL);
    } else if (strcmp(variant, "execv") == 0) {
        execv("/bin/ls", arguments);
    } else if (strcmp(variant, "execvp") == 0) {
        execvp("ls", arguments);
    } else if (strcmp(variant, "execvpe") == 0) {
        execvpe("ls", arguments, custom_environment);
    } else {
        fprintf(stderr, "unknown variant: %s\n", variant);
        _exit(2);
    }

    fprintf(stderr, "%s failed: %s\n", variant, strerror(errno));
    _exit(127);
}

int main(int argc, char *argv[])
{
    pid_t pid;
    int status;

    if (argc != 2) {
        fprintf(stderr,
                "usage: %s execl|execle|execlp|execv|execvp|execvpe\n",
                argv[0]);
        return EXIT_FAILURE;
    }

    pid = fork();
    if (pid < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }

    if (pid == 0) {
        run_exec_variant(argv[1]);
    }

    if (waitpid(pid, &status, 0) < 0) {
        perror("waitpid");
        return EXIT_FAILURE;
    }

    if (!WIFEXITED(status) || WEXITSTATUS(status) != 0) {
        fprintf(stderr, "child did not exit successfully\n");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}`,
String.raw`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
    pid_t child_pid = fork();

    if (child_pid < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }

    if (child_pid == 0) {
        int status;
        int wait_errno;
        pid_t result;

        errno = 0;
        result = wait(&status);
        wait_errno = errno;
        printf("child: wait returned %ld, errno = %d (%s)\n",
               (long)result, wait_errno, strerror(wait_errno));
        fflush(stdout);
        if (result != -1 || wait_errno != ECHILD) {
            _exit(EXIT_FAILURE);
        }
        _exit(7);
    }

    {
        int status;
        pid_t result = wait(&status);

        if (result < 0) {
            perror("parent wait");
            return EXIT_FAILURE;
        }

        printf("parent: wait returned child PID: %s\n",
               result == child_pid ? "yes" : "no");
        if (WIFEXITED(status)) {
            printf("parent: child exit status = %d\n", WEXITSTATUS(status));
        } else {
            printf("parent: child did not exit normally\n");
        }
    }

    return EXIT_SUCCESS;
}`,
String.raw`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

static int child_exit_status(int status)
{
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}

int main(void)
{
    int release_pipe[2];
    pid_t first_child;
    pid_t second_child;
    int status;
    pid_t result;

    if (pipe(release_pipe) < 0) {
        perror("pipe");
        return EXIT_FAILURE;
    }

    first_child = fork();
    if (first_child < 0) {
        perror("first fork");
        return EXIT_FAILURE;
    }
    if (first_child == 0) {
        close(release_pipe[0]);
        close(release_pipe[1]);
        _exit(11);
    }

    second_child = fork();
    if (second_child < 0) {
        perror("second fork");
        return EXIT_FAILURE;
    }
    if (second_child == 0) {
        char release;
        ssize_t count;

        close(release_pipe[1]);
        do {
            count = read(release_pipe[0], &release, 1);
        } while (count < 0 && errno == EINTR);
        close(release_pipe[0]);
        _exit(count == 1 ? 22 : EXIT_FAILURE);
    }

    close(release_pipe[0]);

    result = waitpid(second_child, &status, WNOHANG);
    if (result < 0) {
        perror("waitpid WNOHANG");
        return EXIT_FAILURE;
    }
    printf("second child before release: waitpid returned %ld\n", (long)result);

    result = waitpid(first_child, &status, 0);
    if (result < 0) {
        perror("waitpid first child");
        return EXIT_FAILURE;
    }
    printf("first child: selected PID = %s, exit status = %d\n",
           result == first_child ? "yes" : "no", child_exit_status(status));

    if (write(release_pipe[1], "x", 1) != 1) {
        perror("release second child");
        return EXIT_FAILURE;
    }
    close(release_pipe[1]);

    result = waitpid(second_child, &status, 0);
    if (result < 0) {
        perror("waitpid second child");
        return EXIT_FAILURE;
    }
    printf("second child: selected PID = %s, exit status = %d\n",
           result == second_child ? "yes" : "no", child_exit_status(status));

    return EXIT_SUCCESS;
}`,
String.raw`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
    pid_t pid;
    int status;

    if (setvbuf(stdout, NULL, _IOFBF, BUFSIZ) != 0) {
        perror("setvbuf");
        return EXIT_FAILURE;
    }

    pid = fork();
    if (pid < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }

    if (pid == 0) {
        int printf_result;
        int flush_result;
        int flush_errno;
        int stream_error;

        if (close(STDOUT_FILENO) < 0) {
            perror("close stdout");
            _exit(EXIT_FAILURE);
        }

        printf_result = printf("child: this text cannot reach stdout\n");
        errno = 0;
        flush_result = fflush(stdout);
        flush_errno = errno;
        stream_error = ferror(stdout);

        fprintf(stderr,
                "child: printf=%d, fflush=%d, ferror=%d, errno=%d (%s)\n",
                printf_result, flush_result, stream_error, flush_errno,
                strerror(flush_errno));

        _exit(printf_result >= 0 && flush_result == EOF && stream_error != 0 &&
                      flush_errno == EBADF
                  ? EXIT_SUCCESS
                  : EXIT_FAILURE);
    }

    if (waitpid(pid, &status, 0) < 0) {
        perror("waitpid");
        return EXIT_FAILURE;
    }

    if (!WIFEXITED(status) || WEXITSTATUS(status) != EXIT_SUCCESS) {
        fprintf(stderr, "child did not observe the expected stdout error\n");
        return EXIT_FAILURE;
    }

    printf("parent: stdout still works\n");
    return EXIT_SUCCESS;
}`,
String.raw`#define _POSIX_C_SOURCE 200809L

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

static int write_all(int fd, const char *buffer, size_t length)
{
    while (length > 0) {
        ssize_t written = write(fd, buffer, length);

        if (written < 0) {
            if (errno == EINTR) {
                continue;
            }
            return -1;
        }

        buffer += written;
        length -= (size_t)written;
    }

    return 0;
}

static void run_writer(int pipe_fds[2])
{
    const char message[] = "message from writer child\n";

    if (dup2(pipe_fds[1], STDOUT_FILENO) < 0) {
        perror("writer dup2");
        _exit(EXIT_FAILURE);
    }
    close(pipe_fds[0]);
    close(pipe_fds[1]);

    if (write_all(STDOUT_FILENO, message, strlen(message)) < 0) {
        perror("writer write");
        _exit(EXIT_FAILURE);
    }

    _exit(EXIT_SUCCESS);
}

static void run_reader(int pipe_fds[2])
{
    char buffer[128];
    size_t used = 0;

    if (dup2(pipe_fds[0], STDIN_FILENO) < 0) {
        perror("reader dup2");
        _exit(EXIT_FAILURE);
    }
    close(pipe_fds[0]);
    close(pipe_fds[1]);

    while (used < sizeof(buffer) - 1) {
        ssize_t count = read(STDIN_FILENO, buffer + used,
                             sizeof(buffer) - 1 - used);

        if (count > 0) {
            used += (size_t)count;
            continue;
        }
        if (count == 0) {
            break;
        }
        if (errno != EINTR) {
            perror("reader read");
            _exit(EXIT_FAILURE);
        }
    }
    buffer[used] = '\0';

    if (dprintf(STDOUT_FILENO, "reader received: %s", buffer) < 0) {
        perror("reader dprintf");
        _exit(EXIT_FAILURE);
    }

    _exit(EXIT_SUCCESS);
}

static int child_succeeded(pid_t child)
{
    int status;

    if (waitpid(child, &status, 0) < 0) {
        perror("waitpid");
        return 0;
    }

    return WIFEXITED(status) && WEXITSTATUS(status) == EXIT_SUCCESS;
}

int main(void)
{
    int pipe_fds[2];
    pid_t writer;
    pid_t reader;

    if (pipe(pipe_fds) < 0) {
        perror("pipe");
        return EXIT_FAILURE;
    }

    writer = fork();
    if (writer < 0) {
        perror("fork writer");
        close(pipe_fds[0]);
        close(pipe_fds[1]);
        return EXIT_FAILURE;
    }
    if (writer == 0) {
        run_writer(pipe_fds);
    }

    reader = fork();
    if (reader < 0) {
        perror("fork reader");
        close(pipe_fds[0]);
        close(pipe_fds[1]);
        child_succeeded(writer);
        return EXIT_FAILURE;
    }
    if (reader == 0) {
        run_reader(pipe_fds);
    }

    close(pipe_fds[0]);
    close(pipe_fds[1]);

    if (!child_succeeded(writer) || !child_succeeded(reader)) {
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}`,
];