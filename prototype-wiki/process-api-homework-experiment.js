globalThis.OSLabProcessAPIHomework = (() => {
  const treeQuestions = [
    '每次创建或退出后，哪些进程仍存活，它们各自的父进程是谁？',
    '相同种子和动作数量下，改变创建概率怎样影响最终存活进程及父子关系？',
    '相邻两棵进程树之间发生了什么创建或退出动作？',
    'c 退出后，默认规则与 -R 分别怎样改变 d、e 的父子关系？',
    '给定完整动作序列，最终哪些进程存活，各自的父进程是谁？',
    '同一棵最终进程树是否可能由不同动作序列得到？',
  ];
  const treeConditions = [
    '从初始进程 a 开始，按命令给出的同一动作序列推导父子关系。',
    '三组保持种子和 100 个动作不变，只将创建概率设为 0.1、0.5、0.9。',
    '命令使用 -t 给出进程树；逐次比较相邻两棵树。',
    '保持 a+b,b+c,c+d,d+e,c- 不变，两组只改变是否使用 -R。',
    '命令使用 -F，只要求完整动作序列执行后的最终树。',
    '命令使用 -t -F，只给出最终树；构造的动作须符合创建和退出规则。',
  ];
  const treeFormats = [
    '逐次动作后的父子关系：__\n新增或退出的进程：__\n与实际输出不一致的位置及原因：__',
    '三种概率下的存活进程与树的层次：__\n相同种子下观察到的变化：__\n概率为什么不保证本次创建动作的比例：__',
    '相邻树之间新增或退出的进程：__\n发生创建时的父进程：__\n据此推断的动作：__',
    '默认规则下 d、e 的父进程：__\n-R 下 d、e 的父进程：__\n两种退出规则改变了哪些关系：__',
    '最终存活进程及各自父进程：__\n影响最终树的创建与退出动作：__',
    '得到最终树的一种动作序列：__\n另一种序列或无法构造的理由：__\n最终树中无法看到的已退出进程：__',
  ];
  const generatorQuestions = [
    '父进程的等待返回必须发生在子进程的哪个事件之后？',
    '父进程的两次等待能收集哪些子进程，哪些输出顺序由代码保证？',
    'a 与 b 分别等待谁，嵌套的创建与等待怎样限制事件顺序？',
    '固定源码的父子关系和等待约束是什么，多次运行哪些输出顺序可能不同？',
  ];
  const generatorFormats = [
    '父子分支中的 fork、sleep、wait：__\n必须先发生的事件：__\na<-b 与 b- 的先后关系及原因：__',
    '两个子进程与两次 wait 的调用者：__\n多次运行的收集顺序：__\n代码保证和没有保证的事件顺序：__',
    'a、b、c、d 的父子关系：__\na 与 b 各自等待的直接子进程：__\n必须满足的退出与收集顺序：__',
    '生成源码的父子关系：__\n多次运行相同 ./run 的输出比较：__\n源码规定的等待约束：__',
  ];
  const codingFormats = [
    '父子 PID、fork 返回值及 x 的初始值：__\n父子修改后各自的 x：__\n变量是否相互影响，与输出顺序有什么区别：__',
    '文件内容与 write 返回值：__\n父子描述符对应的打开文件描述和文件偏移：__\n写入位置与行序的原因：__',
    '无同步和有同步版本的输出顺序：__\n证明 hello 已输出的同步事件：__\n父进程何时允许输出 goodbye：__',
    '本接口的参数、PATH 查找和环境来源：__\nexec 成功或失败后的执行情况：__\n父进程取得的退出状态：__',
    '子进程 wait 的返回值与 errno：__\n父进程 wait 返回的 PID：__\n原始 status 与解码退出码的区别：__',
    '指定 C 和任意子进程版本的收集顺序：__\n每次返回的 PID 与正常退出码：__\n等待对象及阻塞条件：__',
    'close、printf、fflush 的返回值与错误：__\n终端与重定向时错误报告的时机：__\n子进程关闭 stdout 对父进程的影响：__',
    '读取者收到的文本与双方退出状态：__\n父进程、写入者、读取者保留的管道端：__\n读取端出现文件结束的条件：__',
  ];
  const createLegacyDefinition = ({treeTasks, generatorTasks, codingTasks}) => {
    const source = 'https://github.com/remzi-arpacidusseau/ostep-homework/tree/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-api';
    const generate = seed => {
      if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid experiment seed');
      const pythonSeed = 1 + seed % 97;
      const scriptRun = (label, command, input, python = null) => ({label, command, predictionCommand: command, input, pythonSeed: python});
      const field = (id, label, section, placeholder, kind) => ({id, label, section, placeholder, kind, multiline: true, help: ''});
      const build = (id, task, question, conditions, runs, placeholder, sourceKind) => ({
        id, title: task.title, question, conditions, layout: 'integrated', answerTitle: '结果解释', inputLabel: id.startsWith('api-code') ? '源码文件' : '输入参数', runs,
        fields: [...runs.flatMap((run, index) => [
          ...(sourceKind ? [{...field(`run-${index}-source`, `${run.label} · ${sourceKind === 'generated' ? 'read.c 源码' : run.input}`, run.label,
            sourceKind === 'generated' ? '粘贴本次生成的 read.c 源码' : `粘贴你编写的 ${run.input} 源码`, 'source'), placement: sourceKind === 'generated' ? 'afterCommand' : 'beforeCommand'}] : []),
          field(`run-${index}-output`, `${run.label} · 原始输出`, run.label, '粘贴本次实际输出；多次运行时分别注明运行次数', 'output'),
        ]), field('analysis', '结果解释', '回答', placeholder, 'analysis')],
      });
      const tree = treeTasks.map((task, index) => {
        let runs;
        if (index === 1) runs = ['0.1', '0.5', '0.9'].map(probability => scriptRun(`创建概率 ${probability}`, `python3 fork.py -s ${pythonSeed} -a 100 -f ${probability} -F`, `-s ${pythonSeed} -a 100 -f ${probability} -F`, pythonSeed));
        else if (index === 3) runs = ['', ' -R'].map(rule => scriptRun(rule ? '直接子进程改归父进程' : '全部后代改归根进程', `python3 fork.py -A a+b,b+c,c+d,d+e,c-${rule}`, `a+b,b+c,c+d,d+e,c-${rule}`));
        else {
          const options = index === 2 ? ' -t' : index === 4 ? ' -F' : index === 5 ? ' -t -F' : '';
          runs = [scriptRun('固定动作序列', `python3 fork.py -s ${pythonSeed}${options}`, `-s ${pythonSeed}${options}`, pythonSeed)];
        }
        return build(`api-tree-${index + 1}`, task, treeQuestions[index], treeConditions[index], runs, treeFormats[index]);
      });
      const generated = generatorTasks.map((task, index) => {
        const args = task.program ? `-A "${task.program}"` : `-s ${pythonSeed} -n 5 -S 2`;
        const command = `python3 ~/ostep-homework/cpu-api/generator.py ${args}\ngcc -Wall -Wextra -o run run.c\n./run`;
        return build(`api-generated-${index + 1}`, task, generatorQuestions[index],
          task.program ? `固定程序结构：${task.program}` : '固定生成种子、5 个动作和最大 2 秒休眠；重复观测使用同一个可执行文件。',
          [scriptRun('生成与运行', command, args, task.program ? null : pythonSeed)], generatorFormats[index], 'generated');
      });
      const coding = codingTasks.map((task, index) => {
        const names = index === 2 ? ['无同步', '有同步'] : index === 3 ? ['execl', 'execle', 'execlp', 'execv', 'execvp', 'execvpe'] : index === 5 ? ['指定 C', '任意子进程'] : ['接口实验'];
        const runs = names.map((label, runIndex) => {
          const filename = `api-${String(index + 1).padStart(2, '0')}${names.length > 1 ? `-${runIndex + 1}` : ''}.c`;
          const binary = filename.slice(0, -2);
          return scriptRun(label, `gcc -Wall -Wextra -o ${binary} ${filename}\n./${binary}`, filename);
        });
        return build(`api-code-${index + 1}`, task, task.observe, task.steps.join('\n'), runs, codingFormats[index], 'student');
      });
      return [...tree, ...generated, ...coding];
    };
    return {
      scope: {project: 'oslab', chapterId: 'process-api', assignmentId: 'process-api-homework'},
      version: 'process-api-homework-v1', generationVersion: 'process-api-inputs-v1',
      chapterTitle: '进程 API', assignmentTitle: '进程 API 作业',
      generationRule: '网页保存随机 32 位种子；fork.py 与随机 generator.py 的 Python 种子为 1 + 网页种子 mod 97。显式动作、程序结构及 C 编程要求固定；实际命令随记录保存。系统调度和实际 PID 不由这个种子确定。',
      program: {name: 'fork.py / generator.py / 学生 C 源码', version: 'OSTEP cpu-api / commit 4c290a92a5ab86bc45512957c91cb24dc7845fc0', source, download: source, runtime: 'Ubuntu 22.04 / Python 3 / GCC'},
      describeField: (task, item) => item,
      describeExperiment: () => [
        ['脚本输入', '固定种子用于复现脚本生成的动作或程序结构，不决定真实操作系统的调度顺序。'],
        ['源码与执行', 'generator.py 在当前目录生成 read.c 和 run.c，同名文件会被覆盖；重复执行同一程序使用已编译的可执行文件。'],
        ['父子执行顺序', '没有同步约束的输出顺序可能变化；fork 返回值、等待对象和文件描述符的关系由接口语义决定。'],
      ],
      generate,
    };
  };
  const specifications = [
    {title: '创建进程与私有变量', question: '父子各得到什么 fork 返回值？一方修改 x 后，另一方的 x 是否改变？父进程读到的退出码是否与子进程给出的一致？', conditions: 'fork 前令 x=100，只创建一个子进程。父子分别打印 PID、fork 返回值和 x，再将父进程的 x 改为 300、子进程的 x 改为 200 并打印。\n子进程以运行命令中的数字退出。父进程用 wait 回收它，打印返回的 PID 和正常退出码。', format: '父子 PID、fork 返回值和修改前后的 x：__\nwait 返回的 PID 与子进程退出码：__\n一方修改 x 是否影响另一方，为什么：__'},
    {title: '替换进程中的程序', question: '两次运行中，execvp 后面的语句是否执行？说明原因，并比较父进程读到的退出状态。', conditions: '父进程创建一个子进程。子进程从 argv[1] 取得程序名，用 execvp 执行该程序并传入 -l，父进程等待它结束。\n两次运行使用同一源码：一次运行 ls，一次运行给定的不存在程序。execvp 失败时用 perror 报错并以非零退出码结束。', format: '成功和失败时 execvp 后的语句是否执行：__\n失败时的错误与两次退出状态：__\n成功不返回、失败返回的原因：__'},
    {title: '选择等待的子进程', question: '父进程每次 waitpid 返回时，取得的是 B 还是 C 的退出状态？说明两种模式各自允许等待哪个子进程，以及返回的 PID 和退出码的区别。', conditions: '创建 B、C 两个子进程。B 休眠 1 秒后以 11 退出，C 休眠 3 秒后以 22 退出。\n从 argv[1] 读取模式：selected 先等待 C 再回收 B；any 连续两次调用 waitpid(-1, &status, 0)。两种模式都打印每次返回的 PID 和正常退出码。', format: '每次返回的 PID 对应 B 还是 C：__\nselected 与 any 的返回顺序和退出码：__\n两种模式各自等待哪个子进程：__'},
    {title: '管道通信与描述符关闭', question: '读取者是否收到了三行完整文本？分别列出三个进程保留的管道端，说明 read 返回 0 需要哪些条件。', conditions: '父进程先创建管道，再创建写入、读取两个子进程。写入者用 dup2 将标准输出接到写端，输出三行文本；读取者将标准输入接到读端，读取并打印文本，直到 read 返回 0。\n三个进程各自关闭不使用的管道端和重复描述符。父进程回收两个子进程，记录退出状态。', format: '读取者收到的三行文本与双方退出状态：__\n三个进程各保留哪些管道端：__\nread 返回 0 时，缓冲数据和写端引用的情况：__'},
    {title: '继承文件与共享偏移（选做）', question: '父子写入的内容是否都在文件中？说明写入位置为什么使用同一个文件偏移，多次运行的行序是否相同。', conditions: '文件偏移表示下一次读写的位置。父进程在 fork 前打开并清空练习文件，父子用继承的描述符各 write 写入 10 行不同标记，记录返回值并关闭自己的描述符。\n父进程回收子进程后读取文件。重复运行同一程序，比较文件中的行序。', format: '文件中的父子标记与 write 返回值：__\n共享文件偏移怎样影响写入位置：__\n多次运行的行序是否相同：__'},
  ];
  const createCodeDefinition = () => {
    const generate = seed => {
      if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid experiment seed');
      const exitCode = 5 + seed % 20;
      const modes = [[['父子变量与退出状态', `${exitCode}`]], [['执行 ls', 'ls'], ['程序不存在', `oslab-missing-program-${seed}`]], [['指定 C', 'selected'], ['任意子进程', 'any']], [['管道传递文本', '']], [['继承文件写入', '']]];
      return specifications.map((specification, index) => {
        const filename = `api-${String(index + 1).padStart(2, '0')}.c`;
        const binary = filename.slice(0, -2);
        const compileCommand = `gcc -Wall -Wextra -o ${binary} ${filename}`;
        const runs = modes[index].map(([label, argument]) => {
          const executionCommand = `./${binary}${argument ? ` ${argument}` : ''}`;
          const command = `${compileCommand}\n${executionCommand}`;
          return {label, input: filename, command, predictionCommand: command, executionCommand, pythonSeed: null};
        });
        const field = (id, label, section, placeholder, kind) => ({id, label, section, placeholder, kind, multiline: true, help: ''});
        return {...specification, id: `api-code-${index + 1}`, optional: index === 4, layout: 'integrated', compileCommand, answerTitle: '结果解释', inputLabel: '源码文件', runs,
          fields: [field('source', `${filename} · 程序源码`, '程序源码', `粘贴你编写的 ${filename}\n同一题的各次运行使用这份源码`, 'source'),
            ...runs.map((run, runIndex) => field(`run-${runIndex}-output`, `${run.label} · 实际输出`, run.label, '粘贴本次实际输出\n重复运行时注明次数', 'output')),
            field('analysis', '结果解释', '回答', specification.format, 'analysis')],
        };
      });
    };
    const source = 'https://github.com/remzi-arpacidusseau/ostep-homework/tree/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-api';
    return {scope: {project: 'oslab', chapterId: 'process-api', assignmentId: 'process-api-homework'}, version: 'process-api-homework-v2', generationVersion: 'process-api-compact-v2', chapterTitle: '进程 API', assignmentTitle: '进程 API 作业',
      generationRule: '网页保存 32 位种子；子进程退出码为 5 + seed mod 20，不存在的执行目标带种子后缀。四题必做共四份源码、六次主要运行，各题两种情况共用源码。其他接口要求固定；种子不决定真实 PID 和调度顺序。',
      program: {name: '学生 C 源码 / OSTEP cpu-api 阅读示例', version: 'API compact v2 / OSTEP commit 4c290a92a5ab86bc45512957c91cb24dc7845fc0', source, download: source, runtime: 'Ubuntu 22.04 / GCC；阅读脚本使用 Python 3'},
      describeField: (task, field) => {
        const specification = specifications[Number(task.id.match(/^api-code-(\d+)$/)?.[1]) - 1];
        return specification && field.id === 'analysis' ? {...field, placeholder: specification.format} : field;
      },
      describeExperiment: () => [['运行参数', 'argv[1] 是程序名后面的第一个参数。例如 ./api-02 ls 中，argv[1] 是字符串 ls；它在各题中分别表示退出码、执行目标或等待模式。'], ['调用失败与退出状态', '检查接口返回值，失败时立即记录 errno 或用 perror 报错。wait、waitpid 成功且 WIFEXITED(status) 为真时，才用 WEXITSTATUS(status) 读取正常退出码。'], ['文件与管道', '父子各有自己的描述符。继承的描述符可能指向同一内核对象，一方关闭自己的描述符不会关闭另一方的描述符。']],
      generate,
    };
  };
  const generatorTasks = [
    {title:'等待位置与子进程并存',programs:[{label:'先创建两个，再等待',input:'fork b,1 {} fork c,1 {} wait wait'},{label:'等待第一个后，再创建第二个',input:'fork b,1 {} wait fork c,1 {} wait'}],conditions:'父进程 a 创建两个子进程 b、c，b、c 都休眠 1 秒。两组只改变第一次 wait 的位置。',question:'1. 第一组中，a 是先创建 c，还是先完成对 b 的等待？比较 a->c（a 创建 c）和 a<-b（a 等待 b 后返回）两行的顺序。\n2. 第二组中，这两行的顺序有什么不同？\n3. 哪一种写法要求 b 结束后才能创建 c？另一种写法是否允许 b、c 在一段时间内同时存在？说明依据，不要求根据整秒时间计算并存时长。'},
    {title:'创建顺序与等待返回顺序',programs:[{label:'b 休眠 1 秒，c 休眠 2 秒',input:'fork b,1 {} fork c,2 {} wait wait'},{label:'b 休眠 2 秒，c 休眠 1 秒',input:'fork b,2 {} fork c,1 {} wait wait'}],conditions:'两组中，父进程 a 都先创建 b，再创建 c，随后等待两者。只交换 b、c 的休眠时长；真实退出顺序还受运行情况影响。',question:'1. 两组运行中，a 第一次等到的是 b 还是 c？看 a<-b 与 a<-c，哪一行先出现。\n2. 结合 b-、c-（子进程退出前的记录），说明本次等待返回顺序与创建顺序是否相同。\n3. 有人说“先创建的子进程一定先被 wait 等到”。你的输出有没有相反的例子？如果没有，能否仅凭这两次结果认定这句话一定成立？说明理由。'},
    {title:'父子层次与等待对象',programs:[{label:'b、c、d 都由 a 创建',input:'fork b,1 {} fork c,1 {} fork d,1 {} wait wait wait'},{label:'a 创建 b，b 再创建 c、d',input:'fork b,1 {fork c,1 {} fork d,1 {} wait wait} wait'}],conditions:'第一组中，a 创建 b、c、d；第二组中，a 创建 b，b 创建 c、d。各子进程都休眠 1 秒，各父进程等待自己创建的子进程。',question:'1. 第一组中，a 的三次等待分别等到了谁？第二组中，a 等到了谁，b 又等到了谁？列出对应的等待返回记录。\n2. 第二组有没有 a<-c 或 a<-d？c、d 是 a 的后代，是否就意味着 a 可以直接 wait 到它们？\n3. 第二组中，a 的等待返回时，c、d 是否也已经结束？结合 b 等待 c、d，再由 a 等待 b 的顺序解释。'},
    {title:'观测顺序与必要顺序（选做）',programs:[{label:'生成并运行',input:'fork b,1 {} fork c,1 {} wait wait'},{label:'再次运行同一程序',input:'fork b,1 {} fork c,1 {} wait wait',repeat:true}],conditions:'a 先创建 b、c，再等待两者；b、c 都休眠 1 秒。第二次直接执行 ./run，不改变程序。日志时间只显示整秒，两次顺序不一定不同。',question:'1. 对照两次输出：a 创建 b、c 的顺序，以及 a 等到 b、c 的顺序，有没有变化？如果两次记录完全相同，也如实说明。\n2. 以下哪种顺序每次都必须满足，哪种不一定：a 先创建 b 再创建 c；b 结束后 a 才能等到 b；a 总是先等到 b 再等到 c。分别说明理由。\n3. 两行记录的秒数相同，能否证明事件同时发生？只看到两次顺序相同，能否保证下一次也相同？说明这些输出能证明什么、不能证明什么。'},
  ];
  const describeQuestion = task => generatorTasks[Number(task.id.match(/^api-generator-([1-4])$/)?.[1])-1]?.question || task.question;
  const describeFields = task => task.fields.map(field=>field.id==='analysis'?{...field,help:describeQuestion(task)}:field);
  const createDefinition = () => {
    const generate = seed => {
      if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid experiment seed');
      return generatorTasks.map((task, index) => {
        const runs=task.programs.map(program=>{const command=program.repeat?'./run':`python3 ~/ostep-homework/cpu-api/generator.py -A "${program.input}" -c`;return {...program,command,predictionCommand:command,pythonSeed:null};});
        return {...task, id: `api-generator-${index + 1}`, optional: index === 3, layout: 'integrated', answerTitle: '比较与判断', inputLabel: '生成器输入', runs,
          fields: [...runs.map((run, runIndex) => ({id: `run-${runIndex}-output`, label: '运行输出', section: run.label, multiline: true, help: '', kind: 'output', placeholder: '粘贴终端中的事件记录\n注明这是哪一次运行'})),
            {id:'analysis',label:'比较与判断',section:'回答',multiline:true,rows:4,help:task.question,kind:'analysis',placeholder:''}],
        };
      });
    };
    const source = 'https://github.com/remzi-arpacidusseau/ostep-homework/tree/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-api';
    return {scope: {project: 'oslab', chapterId: 'process-api', assignmentId: 'process-api-homework'}, version: 'process-api-homework-v4', generationVersion: 'process-api-comparisons-v4', chapterTitle: '进程 API', assignmentTitle: '进程 API 作业',
      generationRule:'三题必做分别只改变等待位置、子进程休眠时长、直接父子关系，共六次生成运行；一题选做重复同一个固定程序，不重新生成。所有输入显式固定，网页种子不决定运行顺序或时刻。只提交原始输出与针对性比较，不重复摘抄相同的事件记录。',
      program: {name: 'generator.py', version: 'OSTEP cpu-api / commit 4c290a92a5ab86bc45512957c91cb24dc7845fc0', source, download: source, runtime: 'Ubuntu 22.04 / Python 3 / GCC'},
      describeField:(task,field)=>field,
      describeFields,
      describeQuestion,
      describeExperiment: () => [['程序与文件', '同一目录生成 read.c、run.c 与可执行文件 run；同名文件会覆盖。'], ['重复运行', './run 执行已有程序，不重新生成源码。'], ['事件名称', 'a->b 表示创建记录，b- 表示 b 退出前的记录，a<-b 表示 a 的等待已返回。名称 a、b 不是系统 PID。']],
      generate,
    };
  };
  return {createDefinition, createCodeDefinition, createLegacyDefinition};
})();