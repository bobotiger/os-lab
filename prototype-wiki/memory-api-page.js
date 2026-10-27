/* Memory API: follow the code, then inspect the object it changes. */
function renderMemoryApiPage(root) {
  const M = globalThis.OSLabMemoryApi;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups = {
    allocation: {name:'申请与使用', api:'malloc · calloc', title:'分配了空间，还要初始化内容', lead:'指针保存对象的起始地址。申请成功后，能访问多大范围、能否读取内容，仍取决于对象的大小与初始化状态。', scenes:{malloc:'malloc',calloc:'calloc',failure:'分配失败'}, errors:['unallocated','size','string','uninitialized','bounds']},
    resize: {name:'按需调整', api:'realloc', title:'调整大小后，以返回结果为准', lead:'原来两个 int 占 8 字节，现在需要三个。realloc 的参数是新的总大小 12 字节；是否移动、是否成功，都要根据返回结果处理。', scenes:{move:'成功 · 移动位置',inplace:'成功 · 地址未变',resizeFailure:'失败 · 保留原对象'}, errors:[]},
    release: {name:'结束使用', api:'free', title:'释放的是对象，失效的是所有旧引用', lead:'复制指针不会复制对象。对象不再使用时释放一次；把某个指针设为 NULL，是另外一次赋值。', scenes:{alias:'两个引用，同一个对象'}, errors:['leak','useAfterFree','doubleFree','invalidFree']},
  };
  const captions = {
    malloc:['声明指针，没有堆对象','申请成功，内容尚未初始化','写入后，两个元素有了确定值','读取两个元素，得到 30'],
    calloc:['声明指针，没有堆对象','申请成功，所有字节已清零','写入后，两个元素变为 10、20','读取两个元素，得到 30'],
    failure:['声明指针，没有堆对象','申请失败，没有获得对象','检查 NULL 后结束这条路径'],
    move:['调整前：8 字节，两个元素','调整成功：内容保留，位置改变','将 p 更新为返回的新指针'],
    inplace:['调整前：8 字节，两个元素','地址未变，也要使用返回的新指针','将 p 更新为返回的新指针'],
    resizeFailure:['调整前：8 字节，两个元素','返回 NULL，原来的 8 字节仍有效','保留 p，继续管理原对象'],
    alias:['一个指针指向一个对象','两个指针指向同一个对象','对象已释放，p 和 q 的旧引用都失效','只有 p 变为 NULL，q 仍是失效引用'],
  };
  const reasons = {
    malloc:['局部变量 p 保存地址。本例将它初始化为 NULL，还没有为 int 元素申请空间。','malloc 不初始化内容。图中的 ? 表示没有可依赖的值，读取前应先写入。','写入改变内容，没有改变分配大小，也没有产生第二个对象。','合法索引是 0 和 1。total 是本次读取的计算结果，不是另一个堆对象。'],
    calloc:['局部变量 p 保存地址；声明指针与申请它所指的对象是两件事。','calloc 将分配的字节全部置零；本例的两个 int 都是 0。','初始化后的值可以被新写入覆盖，对象仍为 8 字节。','在对象范围内读取已初始化元素，得到 total = 30。'],
    failure:['p 为 NULL，尚未指向对象。','失败返回 NULL，不能通过 p 读写。返回非空与否，应在首次访问前检查。','条件成立，执行 return；没有继续初始化或读取。'],
    move:['p 指向值为 10、20 的两个 int。tmp 用来接收调整结果。','前 8 字节保留，新增 4 字节未初始化。原对象已结束，tmp 指向新的 12 字节对象。','tmp 非 NULL，才把它赋给 p。其他旧引用不会随 p 一起更新。'],
    inplace:['目标是把总大小改为 12 字节，不是再增加 12 字节。','即使地址数字相同，成功后旧引用仍失效；tmp 是这次调用返回的有效指针。','通过返回的新指针使用调整后的对象。新增的第三个 int 仍需初始化。'],
    resizeFailure:['临时指针 tmp 与 p 分开，失败结果不会覆盖原引用。','非零大小请求失败时，原对象的大小、内容和有效引用均不变。','tmp 为 NULL，跳过 p = tmp。原对象没有扩大，但仍可继续使用或释放。'],
    alias:['p 指向已经初始化的 8 字节对象。','q = p 只复制引用；两条连线指向同一次分配。','free(p) 结束对象的生命周期，但不自动清空任何指针变量。','p = NULL 没有再次释放对象，也没有改变 q；q 不能再用于访问原对象。'],
  };
  const contracts = {
    malloc:['void *malloc(size_t size);',[['大小','size 是总字节数。n 个元素使用 n * sizeof *p；计算乘积前需检查溢出。'],['结果','成功返回起始指针，内容未初始化；失败返回 NULL。'],['零大小','malloc(0) 的结果与实现有关，不能据此访问对象。'],['对齐','成功结果满足基本类型的对齐要求；更高对齐要求需使用相应接口。']]],
    calloc:['void *calloc(size_t n, size_t size);',[['大小','n 是元素数量，size 是每个元素的字节数；乘积溢出时分配失败。'],['结果','成功后所有字节为零；失败返回 NULL。'],['零的含义','全零字节适用于本例 int 的零值，但不保证表示任意类型的零值或空指针。'],['零大小','总大小为零时的结果与实现有关，不能据此访问对象。']]],
    realloc:['void *realloc(void *p, size_t size);',[['参数','p 为尚未释放的分配起始指针，size 为新的总字节数。p 为 NULL 时等价于 malloc(size)。'],['保留范围','保留新旧大小较小范围内的内容；扩大后新增的部分未初始化。'],['成功与失败','成功后使用返回的新指针；非零大小请求失败时返回 NULL，原对象不变。'],['零大小','C23 中 realloc(p, 0) 为未定义行为。需要释放时使用 free，避免依赖不同版本的零大小规则。']]],
    free:['void free(void *p);',[['参数','分配器记录块大小，free 只接收尚未释放的分配起始指针；不接受对象内部地址或栈变量地址。'],['结果','没有返回值；free(NULL) 不执行任何操作。'],['多个引用','对象释放后，所有旧引用均失效。给 p 赋 NULL 不会清空 q。'],['空间复用','释放后的空间可供分配器复用；不保证字节清零，也不保证物理页立即归还 OS。']]],
  };
  const corrections = {
    unallocated:['先分配，再通过指针写入','int *p = malloc(sizeof *p);\nif (p != NULL) *p = 10;','声明指针只建立了保存地址的变量，没有建立它所指的 int 对象。'],
    size:['按元素所需的大小申请','int *p = malloc(3 * sizeof *p);\nif (p != NULL) p[2] = 30;','本例 sizeof p 为 8，sizeof *p 为 4。三个 int 需要 12 字节；指针的大小不等于对象的大小。'],
    string:['给结尾的空字符留一字节','char *s = malloc(strlen("cat") + 1);\nif (s != NULL) strcpy(s, "cat");','cat 有 3 个字符，复制时还会写入结尾的 \\0。需要 4 字节，少一个也会越界。'],
    uninitialized:['先写入确定的值，再读取','p[0] = 10;\nint value = p[0];','malloc 只分配空间。读取未初始化的 int，没有可依赖的确定结果。'],
    bounds:['访问索引应在对象范围内','/* 已分配两个 int */\np[1] = 30;','两个元素的索引只有 0、1。p[2] 已在对象之外，相邻地址可访问也不能使这次写入合法。'],
    leak:['不再使用时，先释放再清空','free(p);\np = NULL;','没有其他引用时，清空 p 会丢失访问与释放这个对象的途径；对象却仍占据分配空间。'],
    useAfterFree:['把使用安排在释放之前','int value = p[0];\nfree(p);','原对象的生命周期已经结束，即使原地址处的字节没有清零，也不能继续读取。'],
    doubleFree:['同一次分配只释放一次','free(p);\np = NULL;','重复释放旧对象是未定义行为。把 p 清空后调用 free(NULL) 没有作用，但其他旧引用仍需管理。'],
    invalidFree:['把分配起始指针传给 free','free(p);','p + 1 位于对象内部，不能作为释放参数；free 也不接受栈变量的地址。'],
  };
  root.innerHTML = `<div class="page mi-page" id="top">${wikiHeader('memoryApi', [])}
    <a class="mi-skip" href="#mi-main">跳到主要内容</a>
    <main id="mi-main" tabindex="-1"><header class="mi-intro"><h1>内存 API <span>Memory API</span></h1><p>栈上的局部变量随函数调用自动管理；动态对象由程序申请，在不再使用时释放。<strong>指针变量和它指向的对象，是两份不同的存储。</strong></p></header>
    <nav class="mi-workflow" aria-label="选择内存操作">${Object.entries(groups).map(([id,g])=>`<button type="button" data-group="${id}" aria-pressed="false"><span>${g.name}</span><code>${g.api}</code></button>`).join('')}</nav>
    <section id="demo" class="mi-lesson" aria-labelledby="mi-title">
      <div class="mi-lead"><h2 id="mi-title"></h2><p id="mi-lead"></p></div>
      <div class="mi-scenarios" role="group" aria-label="选择运行条件" id="mi-scenarios"></div>
      <div class="mi-bench" id="mi-bench">
        <div class="mi-program"><div class="mi-column-label">执行到这一步</div><ol id="mi-steps" aria-label="代码执行阶段"></ol><p id="mi-setup"></p></div>
        <div class="mi-state"><div class="mi-current"><span id="mi-progress"></span><h3 id="mi-event"></h3></div><pre id="mi-current-code" aria-label="当前执行的代码"></pre><div id="mi-diagram" class="mi-diagram" role="group" aria-label="指针与动态对象"></div><dl id="mi-facts" class="mi-facts"></dl><p id="mi-reason"></p></div>
        <div class="mi-controls"><button type="button" id="mi-prev" aria-label="上一步">← 上一步</button><button type="button" id="mi-play" aria-label="自动播放" aria-pressed="false">▶ 播放</button><button type="button" id="mi-next" aria-label="下一步">下一步 →</button><button type="button" id="mi-reset" aria-label="重置">↺ 重置</button><label>速度 <select id="mi-speed"><option value="1800">慢速</option><option value="1200" selected>正常</option><option value="600">快速</option></select></label></div>
      </div>
      <p class="mi-caption">本例 int 为 4 字节，指针为 8 字节；地址是示意虚拟地址，申请大小非零。<span>? 未初始化</span><span>虚线 × 旧引用已失效</span></p>
      <div id="mi-next-thought" class="mi-takeaway"></div>
      <details id="mi-failure" class="mi-detail" hidden><summary>失败时，直接覆盖 p 会丢失原对象的引用</summary><p>同样返回 NULL，区别在于把结果保存到哪里。以下两种写法从同一个有效 p 出发，且没有其他引用。</p><div class="mi-compare"><section><h3>临时指针接收</h3><code>tmp = realloc(p, 12);</code><div class="mi-mini"><span>返回结果：tmp = NULL</span><div class="mi-receive-row"><code>p<br>0x1000</code><span aria-label="有效引用">→</span><div><b>8 字节 · 未释放</b><span>10　20</span></div></div><strong>原对象仍可访问和释放</strong></div></section><section><h3>直接覆盖 p</h3><code>p = realloc(p, 12);</code><div class="mi-mini mi-warning"><span>返回结果覆盖 p</span><div class="mi-receive-row"><code>p<br>NULL</code><span aria-label="引用丢失">×</span><div><b>8 字节 · 未释放</b><span>10　20</span></div></div><strong>最后一个引用丢失，造成泄漏</strong></div></section></div></details>
      <details id="mistakes" class="mi-detail"><summary id="mi-mistakes-label"></summary><div class="mi-error-intro"><strong>能编译、能运行，不等于内存使用正确</strong><p>对象边界和生命周期由程序管理。OS 的地址保护不能识别每个 C 对象的合法访问范围。</p></div><nav id="mi-errors" aria-label="选择相关错误"></nav><div class="mi-error-body"><div><div class="mi-error-heading"><h3 id="mi-error-title"></h3><span id="mi-error-kind"></span></div><pre id="mi-error-code"></pre><div id="mi-error-diagram" class="mi-diagram" role="group" aria-label="错误涉及的对象与位置"></div></div><div class="mi-correction"><h3 id="mi-fix-title"></h3><p id="mi-error-reason"></p><pre id="mi-fix"></pre><p id="mi-error-boundary" class="mi-caption"></p></div></div><p class="mi-error-foot">未定义行为没有规定的执行结果，可能崩溃，也可能没有立即可见的异常。调试时可借助 Valgrind 等工具查找非法访问和泄漏。</p></details>
      <details id="contracts" class="mi-detail"><summary id="mi-reference-title"></summary><code id="mi-signature"></code><dl id="mi-rules"></dl><p class="mi-caption">这些是 C 库接口，声明在 &lt;stdlib.h&gt; 中。size_t 表示大小，NULL 表示空指针。<a href="https://man7.org/linux/man-pages/man3/malloc.3.html">接口手册 →</a></p></details>
    </section><nav class="mi-related" aria-label="对象的分配与访问"><p>申请成功后，得到连续的虚拟地址范围；读写对象时，仍需把虚拟地址转换为物理地址。</p><a href="address-translation.html">地址转换：读写时找到物理位置 →</a><a href="free-space.html">空闲空间管理：为对象寻找空闲块 →</a><a href="paging.html#object">分页：一个对象跨越两页 →</a></nav></main><footer class="site-footer"><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer><div id="mi-status" class="mi-sr" role="status"></div></div>`;
  $('.site-header nav')?.remove();
  let group = 'allocation', scene = 'malloc', stage = 1, frames = [], timer = null, selectedError = 'bounds';
  const before = () => ({pointers:{p:{status:'null',address:null,object:null}},objects:[],read:null,requestedBytes:0,label:'声明指针',code:'int *p = NULL;'});
  const rawFrameList = id => ['malloc','calloc'].includes(id) ? [before(),...M.buildScenario(id).slice(0,3)] : id === 'failure' ? [before(),...M.buildScenario(id)] : id === 'alias' ? M.buildScenario(id) : M.buildScenario(id).slice(0,3);
  const frameList = id => rawFrameList(id).map((frame,index) => {
    if (['malloc','calloc','failure'].includes(id) && index === 1) {
      frame.code = frame.code.replace('int *p = NULL;\n','').replace('int *p = ', 'p = ');
    }
    return frame;
  });
  const visibleObjects = frame => frame.objects.filter(o => o.live || Object.values(frame.pointers).some(p => p.object === o.id));
  const diagram = (frame, scale = 8) => `<div class="mi-pointers"><h4>局部指针变量</h4>${Object.entries(frame.pointers).map(([name,p])=>`<div class="mi-pointer" data-pointer="${name}" data-status="${p.status}" data-target="${p.object || ''}"><strong>${name}</strong><code>${p.status === 'uninitialized' ? '未初始化' : p.status === 'null' ? 'NULL' : escape(p.address)}</code><small>${p.status === 'valid' ? '有效引用' : p.status === 'dangling' ? '原地址 · 引用已失效' : '不指向对象'}</small></div>`).join('')}</div><div class="mi-objects"><h4>动态对象 · 堆</h4>${frame.objects.length ? visibleObjects(frame).map((o)=>`<div class="mi-object-slot"><section class="mi-object" data-object="${o.id}" data-live="${o.live}" style="--share:${o.bytes / scale}"><header><strong>${o.id === 'resized' ? '调整后的对象' : frame.objects.length > 1 ? '原对象' : '堆对象'}</strong><code>${o.address}</code><span>${o.bytes} 字节 · ${o.live ? '尚未释放' : '生命周期已结束'}</span></header>${o.live ? `<div class="mi-cells">${o.values.map((v,j)=>`<div class="mi-cell${v === null ? ' mi-unknown' : ''}"><small>${o.element === 'char' ? 'char' : 'int'} [${j}]</small><strong>${v === null ? '?' : escape(v)}</strong><span>${o.bytes / o.values.length} 字节</span></div>`).join('')}</div>` : '<div class="mi-ended">原对象已结束，不可访问</div>'}${o.live && !Object.values(frame.pointers).some(p=>p.status === 'valid' && p.object === o.id) ? '<p class="mi-lost">最后一个引用已丢失</p>' : ''}</section></div>`).join('') : '<div class="mi-empty"><strong>尚无动态对象</strong><span>指针变量存在，不代表它所指的空间已分配。</span></div>'}</div>`;
  const draw = container => {
    container.querySelector('svg')?.remove();
    const box = container.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const vertical = matchMedia('(max-width:600px)').matches;
    const paths = [...container.querySelectorAll('[data-pointer]')].flatMap(p => {
      const target = container.querySelector(`[data-object="${p.dataset.target}"]`);
      if (!target || !['valid','dangling'].includes(p.dataset.status)) return [];
      const a = p.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x1 = (vertical ? a.left + a.width/2 : a.right) - box.left, y1 = (vertical ? a.bottom : a.top + a.height/2) - box.top;
      const x2 = (vertical ? Math.max(b.left+8,Math.min(a.left+a.width/2,b.right-8)) : b.left) - box.left, y2 = (vertical ? b.top : Math.max(b.top+10,Math.min(a.top+a.height/2,b.bottom-10))) - box.top;
      const stale = p.dataset.status === 'dangling';
      return `<g data-route="${p.dataset.pointer}" data-target="${p.dataset.target}" data-valid="${!stale}" stroke="${stale ? '#a33f35':'#327566'}" stroke-width="1.7" fill="none"><path d="M ${x1} ${y1} L ${x2} ${y2}" ${stale ? 'stroke-dasharray="4 4"' : `marker-end="url(#${container.id}-arrow)"`}/>${stale ? `<path d="M ${x2-4} ${y2-4} l 8 8 M ${x2-4} ${y2+4} l 8 -8"/>`:''}</g>`;
    });
    container.insertAdjacentHTML('beforeend',`<svg class="mi-routes" viewBox="0 0 ${box.width} ${box.height}" width="${box.width}" height="${box.height}" aria-hidden="true"><defs><marker id="${container.id}-arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#327566"/></marker></defs>${paths.join('')}</svg>`);
  };
  function playState() {
    const running = timer !== null, ended = stage === frames.length - 1;
    $('#mi-play').textContent = running ? 'Ⅱ 暂停' : ended ? '↻ 重播' : '▶ 播放';
    $('#mi-play').setAttribute('aria-label',running ? '暂停' : ended ? '重新播放' : '自动播放');
    $('#mi-play').setAttribute('aria-pressed',String(running));
  }
  function pause() { clearInterval(timer); timer = null; if(frames.length) playState(); }
  function announce() { $('#mi-status').textContent = `${stage+1} / ${frames.length}，${captions[scene][stage]}`; }
  function paint() {
    const frame = frames[stage];
    $('#mi-bench').dataset.scene = scene; $('#mi-bench').dataset.stage = stage;
    $('#mi-progress').textContent = `${stage+1} / ${frames.length}`;
    $('#mi-current-code').textContent = frame.code; $('#mi-event').textContent = captions[scene][stage]; $('#mi-reason').textContent = reasons[scene][stage];
    $('#mi-diagram').innerHTML = diagram(frame,group === 'resize' ? 12 : 8);
    const live = frame.objects.filter(o=>o.live), p = frame.pointers.p;
    const total = live.reduce((n,o)=>n+o.bytes,0);
    const content = !live.length ? '无可用对象' : live.some(o=>o.values.includes(null)) ? live.some(o=>o.values.some(v=>v!==null)) ? '新增部分未初始化' : '未初始化' : '已初始化';
    const facts = [['当前分配',`${total} 字节`],['对象内容',content],[frame.read !== null ? '读取结果 total' : 'p 的引用',frame.read !== null ? String(frame.read) : ({valid:'有效',dangling:'已失效',null:'NULL',uninitialized:'未初始化'})[p.status]]];
    $('#mi-facts').innerHTML = facts.map(([name,value])=>`<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
    $$('#mi-steps button').forEach(b=>{const current = Number(b.dataset.stage) === stage; b.setAttribute('aria-pressed',String(current)); if(current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current'); b.tabIndex=current?0:-1;});
    $('#mi-prev').disabled = stage === 0; $('#mi-next').disabled = stage === frames.length-1;
    playState(); draw($('#mi-diagram'));
  }
  function seek(index,focus=false) { pause(); stage=index; paint(); announce(); if(focus)$(`#mi-steps [data-stage="${stage}"]`).focus({preventScroll:true}); }
  function advance() { if(stage<frames.length-1)stage++; if(stage===frames.length-1)pause(); paint(); if(timer===null)announce(); }
  function play() { if(stage===frames.length-1){stage=0;paint();} timer=setInterval(advance,Number($('#mi-speed').value));playState(); $('#mi-status').textContent='正在播放，可随时暂停。'; }
  function prepare() {
    const g = groups[group];
    $('#mi-title').textContent=scene==='calloc'?'calloc 在分配时把字节清零':scene==='failure'?'申请可能失败，使用前检查返回值':g.title; $('#mi-lead').textContent=g.lead;
    $$('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===group)));
    $('#mi-scenarios').hidden = group === 'release'; $('#mi-steps').style.setProperty('--steps',frames.length);
    $('#mi-scenarios').innerHTML=Object.entries(g.scenes).map(([id,name])=>`<button type="button" data-scene="${id}" aria-pressed="${id===scene}">${name}</button>`).join('');
    const labels=group==='allocation'?['声明指针','申请并检查',scene==='failure'?'处理失败':'写入内容','读取内容']:group==='resize'?['原来的对象','请求调整','检查返回值']:['原来的对象','复制引用','释放对象','清空 p'];
    $('#mi-steps').innerHTML=frames.map((f,i)=>`<li><button type="button" data-stage="${i}" aria-pressed="false"><span>${labels[i]}</span><code>${escape(f.code)}</code></button></li>`).join('');
    $('#mi-setup').textContent=group==='allocation'?'局部指针按栈中变量示意；函数返回时，动态对象不会随局部变量自动释放。':'起始条件：p 已指向两个初始化为 10、20 的 int。';
    $('#mi-next-thought').innerHTML=group==='allocation'?'<strong>大小属于对象，地址保存在指针中。</strong><span>两个 int 需要 2 × 4 = 8 字节。sizeof p 得到指针变量的大小，不能用来查询已分配对象的大小。</span>':group==='resize'?'<strong>先保留 p，再判断 tmp。</strong><span>调整成功后更新引用；失败时保留原对象。需要搬移时会复制保留范围内的内容，代价随复制量增加。</span>':'<strong>释放对象，结束的是程序对它的使用。</strong><span>free 后，空间可由分配器复用；页面换出则保留对象的内容与生命周期，后续访问仍可调回。两者不是同一件事。</span>';
    $('#mi-failure').hidden=group!=='resize';
    $('#mistakes').hidden=group==='resize';
    $('#mi-mistakes-label').textContent=group==='release'?'对照：泄漏、释放后使用与错误释放':'对照：空间大小、初始化与越界';
    if(g.errors.length) {if(!g.errors.includes(selectedError)) selectedError=g.errors[0]; $('#mi-errors').innerHTML=g.errors.map(id=>`<button type="button" data-error="${id}" aria-pressed="${id===selectedError}">${M.errors[id].title}</button>`).join(''); paintError();}
    const api=group==='allocation'?(scene==='calloc'?'calloc':'malloc'):group==='resize'?'realloc':'free';
    const [sig,rules]=contracts[api]; $('#mi-reference-title').textContent=`${api} 的参数与特殊条件`; $('#mi-signature').textContent=sig; $('#mi-rules').innerHTML=rules.map(([term,text])=>`<div><dt>${term}</dt><dd>${text}</dd></div>`).join('');
  }
  function selectScene(id) {pause();scene=id;frames=frameList(scene);stage=group==='allocation'?1:group==='release'?1:0;prepare();paint();announce();}
  function selectGroup(id) {pause();group=id;$('#mistakes').open=false;$('#contracts').open=false;$('#mi-failure').open=false; selectScene(Object.keys(groups[id].scenes)[0]);}
  function paintError() {
    const id=selectedError, error=M.buildError(id), [title,code,reason]=corrections[id];
    $$('[data-error]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.error===id)));
    $('#mi-error-title').textContent=error.title; $('#mi-error-kind').textContent=error.kind;
    $('#mi-error-code').innerHTML=error.code.split('\n').map((line,i,all)=>`<span${i===all.length-1?' class="mi-problem"':''}>${escape(line)}</span>`).join('');
    $('#mi-fix-title').textContent=title; $('#mi-fix').textContent=code; $('#mi-error-reason').textContent=reason;
    $('#mi-error-boundary').textContent=id==='leak'?'这是资源管理错误，不是 p = NULL 这次赋值本身的未定义行为。进程退出后 OS 会回收其资源；长期运行的进程不能依靠退出及时回收泄漏。':id==='useAfterFree'?'此前对象已初始化且分配成功。正确的先后次序取决于所有引用的最后一次使用。':'分配示例假定成功；修改操作之前，还要满足对象未释放等前提。';
    const d=$('#mi-error-diagram'); d.innerHTML=diagram(error,error.objects[0]?.bytes||8);
    if(['size','bounds','string'].includes(id)) {
      const o=d.querySelector('.mi-object-slot'), wrap=document.createElement('div'); wrap.className=id==='string'?'mi-boundary mi-string-boundary':'mi-boundary'; o.before(wrap);wrap.append(o);
      wrap.insertAdjacentHTML('beforeend',`<div class="mi-outside"><span>对象之外</span><strong>${id==='string'?'\\0':'int [2]'}</strong><span>× 写入越界</span></div>`);
    }
    if(['invalidFree','uninitialized'].includes(id)) {const cell=d.querySelectorAll('.mi-cell')[id==='invalidFree'?1:0];cell.classList.add('mi-invalid');cell.insertAdjacentHTML('beforeend',`<b>${id==='invalidFree'?'× free(p + 1)':'× 读取'}</b>`);}
    if(['useAfterFree','doubleFree'].includes(id))d.querySelector('.mi-ended').textContent=id==='doubleFree'?'× 再次 free(p)':'× 读取 p[0]';
    $('.mi-error-foot').textContent = id==='leak' ? '泄漏不会必然立即引发异常；持续遗漏释放会增加进程的内存占用。调试时可借助 Valgrind 等工具检查。' : '未定义行为没有规定的执行结果，可能崩溃，也可能没有立即可见的异常。调试时可借助 Valgrind 等工具查找非法访问。';
    if($('#mistakes').open) $('#mi-status').textContent = `${error.title}：${error.kind}。${reason}`;
    draw(d);
  }
  $('.mi-workflow').addEventListener('click',e=>{const b=e.target.closest('[data-group]');if(b)selectGroup(b.dataset.group);});
  $('#mi-scenarios').addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(b){const id=b.dataset.scene;selectScene(id);$(`[data-scene="${id}"]`).focus({preventScroll:true});}});
  $('#mi-steps').addEventListener('click',e=>{const b=e.target.closest('button[data-stage]');if(b)seek(Number(b.dataset.stage));});
  $('#mi-steps').addEventListener('keydown',e=>{if(!e.target.closest('[data-stage]')||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();seek(e.key==='Home'?0:e.key==='End'?frames.length-1:Math.max(0,Math.min(frames.length-1,stage+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1))),true);});
  $('#mi-prev').addEventListener('click',()=>seek(Math.max(0,stage-1)));
  $('#mi-next').addEventListener('click',()=>seek(Math.min(frames.length-1,stage+1)));
  $('#mi-reset').addEventListener('click',()=>seek(0));
  $('#mi-play').addEventListener('click',()=>{if(timer===null)play();else {pause();announce();}});
  $('#mi-speed').addEventListener('change',()=>{if(timer!==null){pause();play();}});
  $('#mi-errors').addEventListener('click',e=>{const b=e.target.closest('[data-error]');if(b){pause();selectedError=b.dataset.error;paintError();}});
  $$('#mistakes summary, #mi-failure summary, #contracts summary').forEach(summary=>summary.addEventListener('click',()=>{if(!summary.parentElement.open)pause();}));
  $('#mistakes').addEventListener('toggle',()=>{if($('#mistakes').open){pause();draw($('#mi-error-diagram'));}});
  $('#mi-failure').addEventListener('toggle',()=>{if($('#mi-failure').open)pause();});
  const resize=new ResizeObserver(entries=>entries.forEach(e=>draw(e.target))); resize.observe($('#mi-diagram'));resize.observe($('#mi-error-diagram'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();}); window.addEventListener('pagehide',pause);
  function anchor() {const hash=location.hash.slice(1); if(['realloc','resize'].includes(hash))selectGroup('resize');else if(['free','release'].includes(hash))selectGroup('release');else if(['mistakes','contracts','demo','malloc','calloc'].includes(hash)){selectGroup('allocation');if(hash==='calloc')selectScene('calloc');if(['mistakes','contracts'].includes(hash))$(`#${hash}`).open=true;}}
  window.addEventListener('hashchange',anchor); frames=frameList(scene); prepare();paint();anchor();
}
renderMemoryApiPage(document.getElementById('root'));
