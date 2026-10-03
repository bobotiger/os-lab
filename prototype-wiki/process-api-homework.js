const PROCESS_API_TREE_TASKS = [
  {title: '逐步推导进程树', command: 'python3 fork.py -s 10', text: '从初始进程 a 开始，为每个动作画出执行后的父子关系。保持种子不变，加 -c 核对；再改变 -s 或增加 -a 的动作数量。'},
  {title: '改变创建进程的概率', command: 'python3 fork.py -s 10 -a 100 -f 0.1 -F', text: '保持种子和动作数量不变，分别将 -f 设为 0.1、0.5、0.9。先预测最终存活进程的数量和树的层次，再加 -c 核对。概率不是本次序列中创建动作比例的保证。'},
  {title: '由进程树推断动作', command: 'python3 fork.py -s 10 -t', text: '比较相邻的进程树，记录新增或退出的进程，并确定发生创建时的父进程。使用相同参数加 -c 核对动作。'},
  {title: '进程退出后的父子关系', command: 'python3 fork.py -A a+b,b+c,c+d,d+e,c-', text: '先推导 c 退出前的父子关系，再分别预测默认规则和加 -R 后的结果。特别比较 d 与 e 是否仍保持父子关系；使用同一动作序列加 -c 核对。'},
  {title: '从全部动作推导最终树', command: 'python3 fork.py -s 20 -F', text: '只根据动作序列写出最终存活的进程及其父进程，再加 -c 核对。换用其他种子重复练习，保留自己的中间推导。'},
  {title: '最终树能否唯一确定动作', command: 'python3 fork.py -s 20 -t -F', text: '根据最终树构造一个可能的动作序列，再考虑是否存在其他序列得到同一结果。区分最终存活的父子关系与已经退出、因而不再出现在树中的进程；加 -c 查看本次实际生成的动作。'},
];

const PROCESS_API_GENERATOR_TASKS = [
  {title: '父进程等待一个子进程', program: 'fork b,1 {} wait', text: '在 read.c 中标出父子分支、休眠和等待的位置。预测哪些事件必须先发生，再编译运行 run.c，解释 a<-b 为什么出现在 b- 之后。'},
  {title: '两个子进程与两次等待', program: 'fork b,1 {} fork c,2 {} wait wait', text: '标出两个 fork 和两次 wait 的调用者，预测父进程可能等待到哪个子进程。多次运行同一个可执行文件，比较事件顺序；wait 收集的是一个已结束的子进程，不按创建顺序指定对象。'},
  {title: '嵌套创建与分层等待', program: 'fork b,1 {fork c,1 {} fork d,2 {} wait wait} wait', text: '画出 a、b、c、d 的父子关系，区分 a 的等待与 b 的等待。根据代码确定必须满足的退出、收集顺序，并与实际输出逐项对照。'},
  {title: '固定种子的随机程序', program: null, text: '使用 -s 10 -n 5 -S 2 生成程序。先阅读 read.c 并推导进程关系，再保持相同参数加 -c 执行；随后换一个种子重新推导。对同一程序的重复观测直接运行 ./run，不重新生成源码。'},
];

const PROCESS_API_C_TASKS = [
  {title: 'fork 前后的私有变量', api: 'fork()', steps: ['编写一个程序，在 fork 前定义整数 x，并赋值为 100；只创建一个子进程。', '父子分别输出自己的 PID、fork 返回值和 x 的初始值；随后父进程将 x 改为 300，子进程将 x 改为 200，各自再次输出。', '父进程等待子进程结束。每行输出标明父进程或子进程，多次运行同一个程序。'], observe: '记录父子各自的初始值与修改后值。解释子进程从哪条语句继续执行、为何修改普通私有变量不会直接改变另一进程中的值，并区分输出顺序与变量取值。'},
  {title: '继承的文件描述符', api: 'open() · fork() · write()', steps: ['父进程在 fork 前创建并打开一个练习文件，只在此时清空文件内容，然后创建一个子进程。', '父子通过继承的文件描述符各写入 10 行不同标记，例如 parent 与 child；每行使用一次 write 调用，检查实际写入的字节数。', '各自关闭不再使用的描述符，父进程等待子进程结束后读取文件。多次运行并比较文件中的行序。'], observe: '记录文件内容和 write 返回值。说明父子各自的描述符表与共享的内核打开文件描述之间的关系，以及共享文件偏移如何影响写入位置；不要把一次观察到的行序当成固定调度顺序。'},
  {title: '子进程先输出，父进程后输出', api: 'fork() · 进程同步', steps: ['创建一个子进程，让子进程输出 hello，父进程输出 goodbye；先运行没有同步的版本，记录输出顺序。', '设计并实现同步，使子进程完成 hello 的输出后，父进程才能输出 goodbye。父进程打印前不使用 wait 或 waitpid 等待子进程。', '打印后的子进程退出回收单独处理。多次运行，并改变父子打印前的工作量，检查同步条件是否仍然成立。'], observe: '写明双方通过什么事件确定 hello 已经输出，以及父进程何时被允许继续。固定时长的 sleep 只能延后执行，不能证明另一个进程已经完成输出。'},
  {title: 'exec 的参数与环境', api: 'exec 函数族', steps: ['编写程序创建一个子进程，在子进程中运行 ls -l；父进程等待并检查子进程的退出状态。', '分别用 execl、execle、execlp、execv、execvp、execvpe 实现六个版本。非 p 版本给出 /bin/ls，带 p 的版本使用 ls 并通过 PATH 查找；明确参数列表或参数数组及结尾。', '为接收显式环境的版本提供环境数组。使用 execvpe 时，在头文件之前定义 _GNU_SOURCE。另做一次不存在的程序路径测试，记录错误。'], observe: '整理六种接口如何接收参数、如何查找可执行文件、如何提供环境。记录成功与失败时 exec 后面的语句是否执行，以及父进程取得的退出状态。'},
  {title: 'wait 的返回值和退出状态', api: 'wait() · errno', steps: ['创建一个子进程。子进程不再创建其他进程，在其中调用 wait 并记录返回值；失败时立即保存 errno，再以退出码 7 结束。', '父进程调用 wait(&status)，保存返回值，并与 fork 返回的子 PID 比较。', '仅在 wait 成功返回且 WIFEXITED(status) 为真时读取 WEXITSTATUS(status)；父子输出分别注明调用者。'], observe: '分别记录子进程 wait 的返回值与错误原因、父进程 wait 返回的 PID，以及解码后的退出码。解释为什么 PID、原始 status 和正常退出码是三种不同的数据。'},
  {title: '用 waitpid 选择等待对象', api: 'waitpid()', steps: ['独立编写一个程序，由同一个父进程创建两个子进程，并保存各自的 PID。子进程 B 休眠 1 秒后以退出码 11 结束，子进程 C 休眠 3 秒后以退出码 22 结束；两者都不再创建子进程。', '版本一：父进程先调用 waitpid(pid_c, &status, 0) 等待 C，再调用 waitpid(pid_b, &status, 0) 收集 B。每次分别记录返回的 PID 和退出状态。', '版本二：保持相同的两个子进程，父进程连续两次调用 waitpid(-1, &status, 0)，每次允许收集任意一个子进程。多次运行两个版本，比较收集顺序。'], observe: '将每次成功返回的 PID 对应到 B 或 C，使用 WIFEXITED 与 WEXITSTATUS 解码正常退出码。解释 pid_c 与 -1 各自限定的等待对象，以及 options 为 0 时的阻塞条件。返回 -1 时保存 errno，不读取本次未取得的 status。'},
  {title: '关闭子进程的标准输出', api: 'close() · printf() · fflush()', steps: ['创建一个子进程。在子进程中关闭 STDOUT_FILENO，检查 close 返回值，然后调用 printf 输出一段文字。', '记录 printf 的返回值，再调用 fflush(stdout)，记录其返回值和错误原因；这些诊断使用 stderr 输出。', '父进程继续向自己的标准输出打印一行文字，并等待子进程结束。分别在终端执行和将标准输出重定向到文件后执行。'], observe: '比较终端与重定向情况下的错误报告时机。说明文字进入标准 I/O 缓冲与真正写入文件描述符之间的区别，以及关闭子进程描述符为什么不等于关闭父进程的描述符。'},
  {title: '用管道连接两个子进程', api: 'pipe() · dup2() · waitpid()', steps: ['父进程先创建一条管道，再创建写入子进程和读取子进程。写入者把标准输出连接到管道写端，读取者把标准输入连接到管道读端。', '写入者输出三行固定文本；读取者持续读取标准输入，将收到的内容写到自己的标准输出，直到读到文件结束。检查读写返回值。', '用 dup2 设置标准描述符后，关闭重复和不再使用的管道端。父进程也关闭两端，并分别等待两个子进程结束。'], observe: '记录接收到的完整文本和两个子进程的退出状态。列出父进程、写入者、读取者最终保留的描述符；解释读取端观察到文件结束需要满足的条件。'},
];

const processApiHomeworkHeader = wikiHeader('processApi', [
  {href: '#tree', title: '进程树'},
  {href: '#generator', title: '生成 C 程序'},
  {href: '#coding', title: 'C 编程'},
]);

document.querySelector('#root').innerHTML = `
  <div class="page hw-page api-hw-page" id="top">
    ${processApiHomeworkHeader}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / UNIX 接口 / 作业</p>
        <h1 id="page-title">进程 API 作业 <span>Process API Homework</span></h1>
        <p class="lead">推导父子进程关系，阅读生成的 C 程序，再编写进程接口实验。</p>
        <p class="definition"><code>fork.py</code> 根据创建与退出动作计算进程树；<code>generator.py</code> 生成 C 程序，其中 fork 创建子进程，wait 等待并收集子进程的退出状态，sleep 暂停调用者一段时间。exec 成功后用新程序替换当前进程的程序内容，进程编号保持不变。</p>
        <p>文件描述符是进程用于引用已打开文件或其他 I/O 对象的整数编号。管道把一端写入的字节提供给另一端读取。C 编程任务比较父子进程的描述符、返回值和输出顺序，区分资源共享与执行顺序。</p>
        <dl class="hw-meta"><div><dt>运行环境</dt><dd>Ubuntu 22.04</dd></div><div><dt>程序与编译器</dt><dd>Python 3 · GCC</dd></div></dl>
        <p class="hw-back"><a class="inline-link" href="process-api.html">进程 API：fork、exec 与 wait</a></p>
        <nav class="api-hw-outline" aria-label="作业分组"><a href="#tree"><span>01</span><strong>进程树</strong><small>6 项关系推导</small></a><a href="#generator"><span>02</span><strong>C 程序推导</strong><small>4 项代码练习</small></a><a href="#coding"><span>03</span><strong>接口编程</strong><small>8 项独立实验</small></a></nav>
      </section>

      <section class="hw-section" id="tree" aria-labelledby="tree-title">
        <div class="api-hw-section-heading"><p class="section-index">01 / PROCESS TREE</p><h2 id="tree-title">进程树：创建、退出与父子关系</h2></div>
        <p>进程树用连线表示父子关系，初始进程为 a。<code>a+b</code> 表示 a 创建 b，<code>b-</code> 表示 b 退出；退出后 b 不再出现在存活进程树中。以下命令在程序目录执行；程序位于其他目录时，相应调整路径。</p>
        <pre><code>cd ~/ostep-homework/cpu-api
python3 fork.py -s 10
python3 fork.py -s 10 -c</code></pre>
        <p>不加 <code>-c</code> 时，按给出的动作推导树；加 <code>-c</code> 后显示结果。两次命令保持相同种子和参数，才能核对同一序列。</p>
        <dl class="hw-rules">
          <div><dt><code>-s</code> 与 <code>-a</code></dt><dd>指定随机种子和动作数量。默认不固定种子，生成 5 个动作。</dd></div>
          <div><dt><code>-f</code></dt><dd>创建动作的概率，默认 0.7，即 70%；使用 0.1、0.5、0.9 这样的比例值。</dd></div>
          <div><dt><code>-A</code></dt><dd>直接指定逗号分隔的动作序列，例如 <code>a+b,b+c,c-</code>，替代随机生成。</dd></div>
          <div><dt><code>-t</code> 与 <code>-F</code></dt><dd><code>-t</code> 给出树并要求推断动作；<code>-F</code> 只要求最终结果。二者可以组合。</dd></div>
          <div><dt><code>-R</code> 与 <code>-L</code></dt><dd><code>-R</code> 将退出进程的直接子进程改归它的父进程；<code>-L</code> 在随机序列中只允许没有子进程的叶进程退出。</dd></div>
          <div><dt><code>-P</code> 与 <code>-c</code></dt><dd><code>-P</code> 选择树的打印样式：basic、line1、line2、fancy，默认 fancy；<code>-c</code> 显示树或动作的答案。</dd></div>
        </dl>
        <h3>创建与退出的运行结果</h3>
        <pre><code>python3 fork.py -A a+b,b+c,c+d,c+e,c- -c</code></pre>
        <p>输出中的动作与进程树：</p>
        <pre class="api-hw-terminal" aria-label="进程树程序输出节选"><code>                           Process Tree:
                               a

Action: a forks b
                               a
                               └── b
Action: b forks c
                               a
                               └── b
                                   └── c
Action: c forks d
                               a
                               └── b
                                   └── c
                                       └── d
Action: c forks e
                               a
                               └── b
                                   └── c
                                       ├── d
                                       └── e
Action: c EXITS
                               a
                               ├── b
                               ├── d
                               └── e</code></pre>
        <p>默认退出规则把退出进程的全部后代直接改归根进程 a，包括更深层的后代，因此可能改变原有的多层关系。使用 <code>-R</code> 时，只有直接子进程改归退出进程的父进程，其余后代保留原有关系。Linux 中孤儿进程的接收者取决于子进程收养者（subreaper）、进程所在的 PID 命名空间等条件，不能由这两个选项推断真实系统的结果。</p>
        <h3>进程树作业</h3>
        <ol class="hw-questions" id="tree-tasks">${PROCESS_API_TREE_TASKS.map(task => `<li><h3>${task.title}</h3><pre><code>${task.command}</code></pre><p>${task.text}</p></li>`).join('')}</ol>
      </section>

      <section class="hw-section" id="generator" aria-labelledby="generator-title">
        <div class="api-hw-section-heading"><p class="section-index">02 / GENERATED C</p><h2 id="generator-title">生成 C 程序：阅读、编译与执行</h2></div>
        <p><code>generator.py</code> 每次都会写出两份源码：<code>read.c</code> 省去事件打印，便于阅读父子分支；<code>run.c</code> 增加打印语句，编译后能观察创建、退出和等待返回。生成文件写入当前目录，同名文件会被覆盖。</p>
        <p>以下命令在 <code>~/process-api-practice</code> 中生成文件。先阅读 <code>read.c</code> 并预测执行顺序，再编译运行 <code>run.c</code>：</p>
        <pre><code>mkdir -p ~/process-api-practice
cd ~/process-api-practice
python3 ~/ostep-homework/cpu-api/generator.py -A "fork b,1 {} wait"
cat read.c
gcc -Wall -o run run.c
./run</code></pre>
        <p><code>fork b,1 {}</code> 让当前进程创建 b，子进程先休眠 1 秒，随后执行花括号中的代码；空花括号表示没有其他动作。花括号之后的 <code>wait</code> 由父进程执行，等待并收集一个子进程的退出状态。</p>
        <div class="api-hw-example"><div>
        <h3>源码 / read.c 的 main 函数</h3>
        <pre><code>int main(int argc, char *argv[]) {
    // process a
    if (fork_or_die() == 0) {
        sleep(1);
        // process b
        exit(0);
    }
    wait_or_die();
    return 0;
}</code></pre>
        <p><code>fork_or_die()</code> 检查 fork 返回值：子进程得到 0，进入花括号内；父进程得到子 PID，跳过这一分支并执行 <code>wait_or_die()</code>。这两个封装遇到失败时通过断言终止；子进程从 fork 之后继续，不从 main 开头重新执行。</p>
        </div><div>
        <h3>终端 / run.c 编译后的结果</h3>
        <pre class="api-hw-terminal" aria-label="生成的 C 程序运行输出"><code>  0 a+
  0 a-&gt;b
  1      b+
  1      b-
  1 a&lt;-b</code></pre>
        <p><code>a+</code> 是 a 的开始记录，<code>a-&gt;b</code> 在 fork 调用前打印，记录即将创建 b；<code>b+</code> 在 b 休眠结束后打印，不是 b 刚创建的时刻。<code>b-</code> 在子进程退出前打印，<code>a&lt;-b</code> 表示父进程的 wait 已返回并收集 b 的退出状态。</p>
        <p>第一列为程序开始后经过的实际秒数，截去小数部分。同一秒的记录仍有先后顺序；调度和运行负载可能改变时间数值及没有同步约束的事件顺序。需要核对的是代码规定的父子关系与等待条件，而不是要求每次输出完全相同。</p>
        </div></div>
        <dl class="hw-rules">
          <div><dt><code>-A</code></dt><dd>指定程序结构，例如 <code>fork b,1 {} wait</code>；花括号可以嵌套，每个进程必须为它创建的直接子进程提供匹配的 wait。</dd></div>
          <div><dt><code>-s</code>、<code>-n</code>、<code>-S</code></dt><dd>随机程序的种子、动作数量和最大休眠秒数。默认种子不固定，动作数 10，最大休眠 10 秒；短练习可用 <code>-s 10 -n 5 -S 2</code>。</dd></div>
          <div><dt><code>-f</code>、<code>-w</code>、<code>-e</code></dt><dd>随机生成 fork、wait、退出动作的整数百分比，默认 30、40、30，三者必须合计 100，且每项为 1–99。这里的 <code>-f 30</code> 与 fork.py 的 <code>-f 0.3</code> 使用不同单位。</dd></div>
          <div><dt><code>-r</code> 与 <code>-R</code></dt><dd>指定可读版和可运行版的文件名基名，默认 read、run，自动附加 .c。这里的 <code>-R</code> 指定文件名，不改变进程树的退出规则。</dd></div>
          <div><dt><code>-c</code></dt><dd>重新生成两份 C 文件，调用 GCC 编译可运行版并执行。保持同一个 <code>-A</code> 描述或相同种子及参数，才能与之前阅读的程序对照。</dd></div>
          <div><dt>重复执行</dt><dd>直接运行 <code>./run</code> 观察同一程序的多次结果；再次执行生成器可能覆盖源码与可执行文件。修改 run.c 后，需要重新编译再运行。</dd></div>
        </dl>
        <p>以下命令对相同的程序结构自动完成生成、编译和执行：</p>
        <pre><code>python3 ~/ostep-homework/cpu-api/generator.py -A "fork b,1 {} wait" -c</code></pre>
        <h3>C 程序推导练习</h3>
        <ol class="hw-questions" id="generator-tasks">${PROCESS_API_GENERATOR_TASKS.map(task => `<li><h3>${task.title}</h3><pre><code>python3 ~/ostep-homework/cpu-api/generator.py ${task.program ? `-A "${task.program}"` : '-s 10 -n 5 -S 2'}</code></pre><p>${task.text}</p></li>`).join('')}</ol>
      </section>

      <section class="hw-section" id="coding" aria-labelledby="coding-title">
        <div class="api-hw-section-heading"><p class="section-index">03 / C PROGRAMMING</p><h2 id="coding-title">C 编程：进程接口与资源关系</h2></div>
        <p>为每项任务编写一个独立 C 程序，在练习目录中保存、编译并运行。例如第一项保存为 <code>q1.c</code>：</p>
        <pre><code>cd ~/process-api-practice
gcc -Wall -Wextra -o q1 q1.c
./q1</code></pre>
        <p>检查 fork、open、dup2、pipe、exec、wait 等调用的返回值；失败时记录 errno 或用 perror 输出原因。每项记录必要代码、实际输出与解释。涉及父子执行顺序时，多次运行并区分代码保证的顺序和一次观测到的顺序。</p>
        <ol class="hw-questions api-hw-coding-tasks" id="coding-tasks">${PROCESS_API_C_TASKS.map((task, index) => `<li><header class="api-hw-task-heading"><span class="api-hw-task-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><p class="api-hw-task-api">${task.api}</p><h3>${task.title}</h3></div></header><dl class="api-hw-task-body"><div><dt>实验要求</dt><dd><ul>${task.steps.map(step => `<li>${step}</li>`).join('')}</ul></dd></div><div><dt>记录与解释</dt><dd>${task.observe}</dd></div></dl></li>`).join('')}</ol>
      </section>
    </main>
    <footer><a href="process-api.html">返回进程 API 知识页</a><a href="#top">回到页首 ↑</a></footer>
  </div>`;
document.title = '进程 API 作业 Process API Homework · OSLab';