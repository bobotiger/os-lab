(() => {
  const U=OSLabConcurrencyStage2UI;
  U.shell('concurrencyExperiments',[{href:'#prepare',title:'实践准备'},{href:'#practice',title:'对照实践'},{href:'#extend',title:'综合分析'}],`
    <section class="intro"><p class="eyebrow">并发 / 参考实践</p><h1>并发参考实践</h1><p class="lead">改变线程的执行次序和同步（synchronization）规则，观察共享数据何时变化、哪个线程在等待谁。</p><p class="definition">可以先从计数器开始。用 Python 改变模拟的执行次序，找出哪一步覆盖了另一线程的结果。然后在 Linux 中比较两种加锁方式，看看使用真实线程时，锁要保护到哪一步。</p></section>
    <section class="cc-section" id="prepare"><h2>运行环境与实践类型</h2><table class="cc-reference-table"><thead><tr><th scope="col">实践类型</th><th scope="col">环境与观察对象</th></tr></thead><tbody><tr><th scope="row">模拟推演</th><td>使用 Python 3.8 或更高版本，无第三方依赖。按指定次序模拟共享更新、锁等待和请求响应，便于逐步对照；可在具备 Python 3 的系统运行。</td></tr><tr><th scope="row">真实线程</th><td>使用 Linux 与支持 pthread 的 C 编译器。创建两个真实线程，比较整段加锁与分别加锁的结果。选择下方“真实线程”后可下载源码并查看编译命令。</td></tr></tbody></table><p class="cc-intro-text">运行模拟推演时，下载下面的 Python 脚本，在脚本所在目录打开终端。</p><div class="c3-practice-nav"><a class="c3-download" href="demos/concurrency/concurrency_lab.py" download>下载推演脚本</a><a class="c3-download" href="demos/concurrency/README.md" download>下载使用说明</a></div><p class="cc-conditions">上面的 Python 脚本用于确定性模拟，不创建真实线程，也不测量系统性能。每步按指定次序执行；死锁场景打印结论后退出，不会让终端一直等待。</p><details class="cc-details"><summary>程序使用说明</summary><pre><code>python3 concurrency_lab.py --help
python3 concurrency_lab.py updates --help
python3 concurrency_lab.py locks --help
python3 concurrency_lab.py events --help</code></pre><p><code>updates --order</code> 接受恰含三个 A、三个 B 的执行次序。<code>locks --policy</code> 选择相反或统一的获取锁次序，<code>--schedule serial</code> 改为依次完成。<code>events --mode</code> 选择阻塞或异步方案，<code>--delay</code> 支持 4 或 8 单位 I/O 等待时间。</p><p>输出中的 local 是线程局部值，shared 是共享值；completed 表示已完成操作数或请求的完成时刻，依具体练习标明。若终端使用 python 命令启动 Python 3，可替换命令中的 python3。</p></details></section>
    <section class="cc-section" id="practice"><h2>对照实践</h2><div class="cc-mode-tabs" role="group" aria-label="实践主题"><button data-lab="updates" aria-pressed="true">共享更新</button><button data-lab="locks" aria-pressed="false">资源等待</button><button data-lab="events" aria-pressed="false">请求响应</button><button data-lab="native" aria-pressed="false">真实线程</button></div><div id="lab-content"></div></section>
    <section class="cc-section" id="extend"><h2>队列协作与综合分析</h2><p class="cc-intro-text">在条件变量页，观察消费者被通知后，任务被另一个消费者先取走的情况；再到信号量页，观察取得任务许可但尚未出队的状态。两种方式都能协调队列，但“被通知”和“已取得许可”的含义不同。</p><div class="c3-practice-nav"><a href="condition-variables.html#cooperation">条件变量：等待与重新检查 →</a><a href="semaphores.html#buffer">信号量：预留与实际修改 →</a></div><p class="c3-summary">先说明共享的是什么、正确运行依赖哪些条件，再解释执行次序为什么改变结果。回到<a href="concurrent-structures.html#design">并发数据结构</a>比较同步开销，对照<a href="concurrency-bugs.html#review">并发错误</a>检查遗漏的交错：一次正确输出，不能保证其他允许的次序都正确。</p></section>`);
  document.querySelector('.cc-page').classList.add('c3-page');
  function wireDownloads(scope) { for(const link of scope.querySelectorAll('a[download]')){
    const name=link.getAttribute('href').split('/').at(-1);
    link.download=name;
    link.href='data:text/plain;charset=utf-8,'+encodeURIComponent(OSLabConcurrencyDownloads[name]);
  }
  }
  wireDownloads(document);
  const cases={
    native:{title:'真实线程与锁的保护范围',question:'两个真实线程各加 1。比较分别保护读取和写回，与保护完整加一操作的结果。',condition:'计数初值为 0；每次访问都使用同一互斥锁。split 安排两个线程都读到旧值后再写回，以稳定复现交错。',runs:[
      {title:'完整操作加锁',command:'./thread_counter whole',result:'最终计数为 2，两次更新均被保留。',output:'joined=2; count=2; expected=2'},
      {title:'读取与写回分别加锁',command:'./thread_counter split',result:'最终计数为 1，两次写回使用了相同的旧值。',output:'joined=2; count=1; expected=2'}],explanation:'join 保证两个线程已结束，无法修复此前被覆盖的更新。split 虽然对每次读写都加了锁，却没有保护完整的加一操作，仍会丢失更新。',link:'concurrency-bugs.html#trace',linkTitle:'并发错误',native:true},
    updates:{title:'线程交替执行与更新丢失',question:'两个线程各把同一个计数器加一。只改变六个步骤的次序，观察哪一次写回覆盖了另一线程的结果。',condition:'初值为 0；A、B 各依次读取、加一、写回，共六步。预期两次更新都被保留时结果为 2。',runs:[
      {title:'交替执行',args:'updates --order ABABAB',result:'最终计数 1：一次更新被覆盖。',output:'initial count=0; expected=2\nA read  local=0 shared=0\nB read  local=0 shared=0\nA add   local=1 shared=0\nB add   local=1 shared=0\nA write local=1 shared=1\nB write local=1 shared=1\nfinal count=1; expected=2'},
      {title:'依次完成',args:'updates --order AAABBB',result:'最终计数 2：B 在 A 写回后读取。',output:'initial count=0; expected=2\nA read  local=0 shared=0\nA add   local=1 shared=0\nA write local=1 shared=1\nB read  local=1 shared=1\nB add   local=2 shared=1\nB write local=2 shared=2\nfinal count=2; expected=2'}],explanation:'交替执行时，两个线程都读取旧值 0，各自算出 1；第二次写回不会自动累加已有结果。依次完成得到正确结果，不能证明缺少同步的方案安全。可以保持各线程自身顺序不变，尝试其他交错，再到锁与互斥页比较整段保护。',link:'locks.html',linkTitle:'锁与互斥'},
    locks:{title:'获取次序与死锁',question:'两个线程都需要 L1、L2。保持工作内容和交替推进方式相同，只改变获取锁的次序，观察等待关系能否形成环。',condition:'每把锁只有一个实例；工作完成前不释放已经取得的锁。',runs:[
      {title:'相反次序',args:'locks --policy opposite',result:'死锁；两项操作都未完成。',output:'A lock L1\nB lock L2\nA waits for L2 held by B\nB waits for L1 held by A\ndeadlock=yes; completed=0/2'},
      {title:'统一次序',args:'locks --policy ordered',result:'可能等待，但两项操作均能完成。',output:'A lock L1\nB waits for L1 held by A\nA lock L2\nA work\nA unlock L2\nA unlock L1\nB lock L1\nB lock L2\nB work\nB unlock L2\nB unlock L1\ndeadlock=no; completed=2/2'}],explanation:'统一次序时，B 等待 L1，却没有先占住 L2；A 仍能取得两把锁、完成工作并释放。还可给相反次序增加 --schedule serial：这次运行不会死锁，但不能排除交替执行时的风险。',link:'deadlock.html#dependencies',linkTitle:'死锁与资源依赖'},
    events:{title:'I/O 等待与请求响应',question:'请求 A 等待读取结果，请求 B 只需要短暂处理。保持 I/O 耗时不变，比较 B 什么时候能完成。',condition:'A 在 t=0 到达，B 在 t=1 到达；A 提交与恢复各需 1 单位，I/O 需 4 单位，B 需 1 单位。',runs:[
      {title:'阻塞调用',args:'events --mode blocking --delay 4',result:'A 在 t=6 完成，B 在 t=7 完成。',output:'A arrives=0; B arrives=1; I/O delay=4\n[0,1) A submits I/O\n[1,2) loop blocked\n[2,3) loop blocked\n[3,4) loop blocked\n[4,5) loop blocked\n[5,6) A resumes and completes\n[6,7) B completes\ncompleted A=6; B=7'},
      {title:'异步提交',args:'events --mode async --delay 4',result:'A 仍在 t=6 完成，B 提前到 t=2 完成。',output:'A arrives=0; B arrives=1; I/O delay=4\n[0,1) A submits I/O\n[1,2) B completes\n[2,3) loop idle; I/O pending\n[3,4) loop idle; I/O pending\n[4,5) loop idle; I/O pending\n[5,6) A resumes and completes\ncompleted A=6; B=2'}],explanation:'异步提交没有缩短 A 的 I/O，也没有让单个循环同时执行两个处理函数。它允许循环在等待期间处理 B。把两条命令中的 --delay 都改为 8，再检查差异；比较时保持共同工作量一致。',link:'events.html#comparison',linkTitle:'事件驱动并发'}
  };
  function render(key){
    const c=cases[key],command=r=>r.command || `python3 concurrency_lab.py ${r.args}`;document.getElementById('lab-content').innerHTML=`<h3>${c.title}</h3>${c.native?'<p class="c3-practice-note">需要 Linux 与 C 编译器。下载源文件后，在同一目录编译一次，再分别运行下面两条命令。</p><a class="c3-download" href="demos/concurrency/thread_counter.c" download>下载真实线程示例</a><pre class="c3-command"><code>cc -std=c11 -O2 -Wall -Wextra -pthread thread_counter.c -o thread_counter</code></pre>':''}<p class="c3-practice-note">${c.question}</p><p class="cc-conditions">${c.condition}</p><div class="c3-pair">${c.runs.map((r,i)=>`<div class="c3-run"><div class="c3-run-header"><h3>${r.title}</h3><button data-copy="${i}">复制命令</button></div><pre class="c3-command"><code>${command(r)}</code></pre><p>${r.result}</p><details class="cc-details"><summary>${c.native?'参考末行':'完整参考输出'}</summary><pre class="c3-output">${r.output}</pre></details><p class="c3-copy-status" role="status"></p></div>`).join('')}</div><p class="c3-summary">${c.explanation}</p>${c.native?'<details class="cc-details"><summary>进程号、线程号与运行次序</summary><p>程序还打印两个线程的 pid、tid、read 和 wrote。一次运行中 pid 相同、tid 不同；read 是读到的值，wrote 是写回的值。具体号码随运行变化。</p><p>主线程在 join 后统一打印 A、B 的记录，显示顺序不代表实际执行先后。split 中的同步等待用于安排特定交错，不代表自然调度总会产生相同次序。</p></details>':''}<p class="c3-practice-nav"><a href="${c.link}">打开${c.linkTitle}演示 →</a></p>`;
    wireDownloads(document.getElementById('lab-content'));
    document.querySelectorAll('[data-copy]').forEach(button=>button.onclick=async()=>{
      const text=command(c.runs[Number(button.dataset.copy)]),status=button.closest('.c3-run').querySelector('.c3-copy-status');
      try{await navigator.clipboard.writeText(text);status.textContent='已复制命令。';}
      catch{const selection=getSelection(),range=document.createRange();range.selectNodeContents(button.closest('.c3-run').querySelector('.c3-command'));selection.removeAllRanges();selection.addRange(range);status.textContent='请复制已选中的完整命令。';}
    });
  }
  U.choose('[data-lab]',b=>render(b.dataset.lab));render('updates');
})();
