function renderMemoryApiPage(root) {
  const {scenes, errors, buildScenario, buildError} = OSLabMemoryApi;
  root.innerHTML = `<div class="page rr-page lde-page ma-page" id="top">
    ${wikiHeader('memoryApi', [{href: '#demo', title: '申请与释放'}, {href: '#mistakes', title: '常见错误'}, {href: '#contracts', title: '接口约定'}, {href: '#allocator', title: '库与 OS'}])}
    <main><section class="intro" aria-labelledby="page-title"><p class="eyebrow">内存虚拟化 / 使用接口</p><h1 id="page-title">内存 API <span>Memory API</span></h1><p class="definition">指针保存地址，不是对象本身。分配对象是一次动态分配得到的存储区域；从分配成功到释放，是它的生命周期，处于这一期间的对象称为活对象。</p></section>
      <section class="rr-rules" id="demo" aria-labelledby="ma-demo-title"><div class="section-heading"><h2 id="ma-demo-title">分配对象的生命周期</h2><p class="ma-progress">阶段 <strong id="ma-stage">1</strong> / <span id="ma-total">5</span></p></div>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="ma-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="ma-prev" aria-label="上一阶段" title="上一阶段"><span aria-hidden="true">←</span></button><button type="button" class="icon-button" id="ma-next" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="ma-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>场景<select id="ma-scene" aria-label="接口与结果">${Object.entries(scenes).map(([id, title]) => `<option value="${id}">${title}</option>`).join('')}</select></label><label>速度<select id="ma-speed" aria-label="播放速度"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label></div>
        <ol class="ma-steps" id="ma-steps" aria-label="执行阶段"></ol>
        <div class="ma-current-stage" aria-live="polite" aria-atomic="true"><h3 id="ma-event-title"></h3><p id="ma-reason"></p></div>
        <div class="ma-workbench"><div class="ma-diagram" id="ma-diagram" role="group" aria-label="指针与堆对象状态"></div><aside class="ma-action"><h3>当前 C 片段</h3><pre id="ma-code" aria-label="当前 C 片段"></pre><dl class="ma-result" id="ma-result"><dt>已计算的 total</dt><dd id="ma-read"></dd></dl></aside></div>
        <input id="ma-position" type="range" min="0" max="4" step="1" value="0" aria-label="演示阶段"><p class="ma-caption">每格是一个 int（4 字节），? 表示尚未初始化。本例指针为 8 字节，请求大小非零，地址为假定的虚拟地址；旧地址记录不是有效引用。</p>
        <details class="ma-lifecycle-summary"><summary id="ma-lifecycle-title">各阶段的引用与对象生命周期</summary><dl class="ma-observations"><div><dt>最近请求大小</dt><dd id="ma-request"></dd></div><div><dt>当前活对象</dt><dd id="ma-live"></dd></div></dl><div class="ma-lifecycle-scroll" role="region" aria-label="当前场景各阶段的状态对照" tabindex="0"><table><caption id="ma-lifecycle-caption"></caption><thead><tr><th scope="col">阶段</th><th scope="col">指针引用</th><th scope="col">活对象</th><th scope="col">已计算的 total</th></tr></thead><tbody id="ma-lifecycle-comparison"></tbody></table></div></details>
      </section>
      <section class="rr-rules ma-section" id="mistakes" aria-labelledby="ma-mistakes-title"><p class="section-index">02 / WHAT WENT WRONG?</p><h2 id="ma-mistakes-title">内存使用错误的对象状态与违反条件</h2><p class="ma-section-lead">涉及分配的错误示例假设申请成功。未定义行为表示 C 语言规则不规定这次操作必须产生什么结果。对象越界或释放后访问可能崩溃，也可能没有立即可见的异常；操作系统的地址保护不能自动识别每个 C 对象的边界。</p><label class="ma-error-selector">错误类型<select id="ma-error">${Object.entries(errors).map(([id, error]) => `<option value="${id}">${error.title}</option>`).join('')}</select></label>
        <div class="ma-error-summary" aria-live="polite" aria-atomic="true"><p class="ma-error-kind" id="ma-error-kind"></p><h3 id="ma-error-title"></h3><p class="ma-error-target" id="ma-error-target"></p></div><div class="ma-error-workbench"><div id="ma-error-diagram" class="ma-diagram" role="group" aria-label="错误操作涉及的指针与对象"></div><div class="ma-error-analysis"><h3>错误动作 · C 片段</h3><pre id="ma-error-code"></pre><dl class="ma-error-explanation" id="ma-error-reason"></dl></div></div><p class="ma-caption">错误示例里的 int 为 4 字节，char 为 1 字节。越界位置不属于已分配对象的范围；对象状态不能确定错误操作是否立即崩溃。</p>
      </section>
      <section class="rr-rules ma-section" id="contracts" aria-labelledby="ma-contracts-title"><p class="section-index">03 / THE API CONTRACT</p><h2 id="ma-contracts-title">内存分配接口参考</h2><details class="ma-reference"><summary>四个分配接口的用途、参数与结果</summary><p class="ma-section-lead">这些函数声明在 &lt;stdlib.h&gt; 中。size_t 是用于表示大小的无符号整数类型，NULL 表示空指针。以下分配与调整操作的申请大小均为正数。</p><div class="ma-contracts">
          <article><h3>malloc</h3><code>void *malloc(size_t nbytes);</code><dl>
            <div><dt>用途</dt><dd>分配指定大小的内存区域。</dd></div>
            <div><dt>参数</dt><dd><code>nbytes</code>：申请的字节数，不是元素数量。</dd></div>
            <div><dt>返回值</dt><dd>成功返回分配区域的起始指针；失败返回 NULL。</dd></div>
            <div><dt>对象与引用</dt><dd>分配成功后，对象的生命周期开始，但内容未初始化。通过返回的指针访问对象，读取前应先写入有效值。</dd></div>
          </dl></article>
          <article><h3>calloc</h3><code>void *calloc(size_t count, size_t size);</code><dl>
            <div><dt>用途</dt><dd>为指定数量的元素分配连续空间，并将分配区域的所有字节置零。</dd></div>
            <div><dt>参数</dt><dd><p><code>count</code>：元素数量。</p><p><code>size</code>：每个元素的字节数。总申请大小为 count × size 字节。</p></dd></div>
            <div><dt>返回值</dt><dd>成功返回分配区域的起始指针；失败返回 NULL。</dd></div>
            <div><dt>对象与引用</dt><dd>分配成功后，对象的生命周期开始，字节内容已清零。本例中的 int 元素为 0；访问对象前仍需确认返回值不是 NULL。</dd></div>
          </dl></article>
          <article><h3>realloc</h3><code>void *realloc(void *p, size_t nbytes);</code><dl>
            <div><dt>用途</dt><dd>调整已有分配区域的大小，必要时将内容移至新位置。</dd></div>
            <div><dt>参数</dt><dd><p><code>p</code>：尚未释放的分配区域的起始指针。p 为 NULL 时，等价于 malloc(nbytes)。</p><p><code>nbytes</code>：调整后的总字节数，不是增加的字节数。</p></dd></div>
            <div><dt>返回值</dt><dd>成功返回调整后区域的起始指针，地址可能改变；失败返回 NULL。</dd></div>
            <div><dt>对象与引用</dt><dd><p>成功时：保留原内容，保留长度为新旧大小的较小值；新增部分未初始化。旧对象的生命周期结束，旧引用失效，即使地址相同也应使用返回的新指针。</p><p>失败时：原对象的大小、内容和有效引用保持不变。</p></dd></div>
          </dl></article>
          <article><h3>free</h3><code>void free(void *p);</code><dl>
            <div><dt>用途</dt><dd>释放此前动态分配的内存区域。</dd></div>
            <div><dt>参数</dt><dd><p><code>p</code>：malloc、calloc 或 realloc 返回且尚未释放的分配起始指针；p 为 NULL 时不执行任何操作。</p><p>传入局部变量的地址、对象内部地址或已释放的指针，行为未定义。</p></dd></div>
            <div><dt>返回值</dt><dd>无返回值，不能通过返回值判断释放结果。</dd></div>
            <div><dt>对象与引用</dt><dd>释放结束对象的生命周期，指向它的旧引用失效，不得继续用于访问。free 不会自动将调用者的指针变量设为 NULL。</dd></div>
          </dl></article>
        </div></details>
        <details class="ma-reference"><summary>对象大小、指针大小与字符串空间</summary><div class="ma-sizing"><div><code>3 * sizeof *p</code><span>三个 int：本例为 3 × 4 = 12 字节。</span></div><div><code>sizeof p</code><span>指针变量自身：本例为 8 字节，不能据此确定所指对象大小。</span></div><div><code>strlen(s) + 1</code><span>字符串内容加结尾空字符："cat" 需要 3 + 1 = 4 字节。</span></div><p>sizeof 是运算符，用于求类型或对象的大小；strlen 是函数，用于计算有效字符串在结尾空字符之前的字节数。二者求值的对象与含义不同，不能互换。</p></div></details>
        <details class="ma-reference"><summary>realloc 失败时保留原引用</summary><div class="rr-tradeoff"><pre class="ma-safe-realloc">int *tmp = realloc(p, 3 * sizeof *p);
if (tmp != NULL) {
    p = tmp;
} else {
    /* 原来的 p 仍然有效，处理失败 */
}</pre><p>如果直接写 p = realloc(p, ...)，失败时 p 变为 NULL，可能丢失原对象的最后一个引用。零大小 realloc 的规则与 C 版本有关，不能套用上述非零大小请求的处理方式。</p></div></details>
        <details class="ma-reference"><summary>分配大小、对齐与特殊条件</summary><dl class="ma-error-explanation">
          <div><dt>大小计算</dt><dd>向 malloc 或 realloc 传入元素数量与元素大小的乘积前，应检查乘积能否由 size_t 表示。无符号乘法溢出会使计算出的申请大小与实际所需空间不符。calloc 分别接收数量与元素大小，在乘积溢出时返回 NULL。</dd></div>
          <div><dt>地址对齐</dt><dd>对齐要求规定对象起始地址应满足的倍数关系，例如 8 字节对齐要求地址为 8 的整数倍。三个分配函数的成功结果满足基本对齐要求，即不超过标准类型 max_align_t 的对齐要求；要求更高对齐的类型需要相应的对齐分配接口。</dd></div>
          <div><dt>字节清零</dt><dd>calloc 保证所有字节为零，但这不等于对任意类型完成赋值初始化。全零字节不保证表示浮点数的零值或空指针，不能把 int 示例的结果推广到所有类型。</dd></div>
          <div><dt>零大小请求</dt><dd>malloc(0) 或总大小为零的 calloc 可能返回 NULL，也可能返回可传给 free 的非空指针，但不能通过该指针访问对象。C23 规定 realloc(p, 0) 为未定义行为；更早的标准和库实现采用不同规则，不能将返回 NULL 一概解释为“调整失败、原对象仍保留”。需要释放对象时使用 free。</dd></div>
          <div><dt>释放与底层回收</dt><dd>free 不承诺清零已释放空间，也不保证对应物理页立即归还操作系统。分配器可以保留空间用于后续分配；这些底层处理不延长原对象的生命周期。</dd></div>
        </dl></details>
      </section>
      <section class="rr-rules ma-section" id="allocator" aria-labelledby="ma-allocator-title"><p class="section-index">04 / LIBRARY FIRST, OS WHEN NEEDED</p><h2 id="ma-allocator-title">程序、库分配器与操作系统的职责</h2><p class="ma-section-lead">malloc 是库接口。分配器可以复用已经获得的空间，不需要每次分配都向 OS 申请新的物理页。</p><div class="ma-layers"><div><h3>程序</h3><code>malloc / calloc / realloc / free</code><p>请求空间、管理引用、结束对象生命周期。</p></div><span aria-hidden="true">→</span><div><h3>库分配器</h3><p>管理已经获得的空间，选择可用块，并在释放后回收和复用。</p></div><span aria-hidden="true">→</span><div><h3>OS</h3><p>必要时提供或调整虚拟内存映射；真实底层机制依平台和分配器而异。</p></div></div><dl class="ma-os-apis"><div><dt>brk / sbrk</dt><dd>传统 Unix 中调整进程数据段末端的接口；sbrk 的库封装和具体系统调用机制依平台而异，并非所有分配器都依赖它。</dd></div><div><dt>mmap</dt><dd>建立虚拟内存映射，可用于匿名内存或文件映射。分配器可能用它获得空间，但建立映射不等于所有物理页立即驻留。</dd></div></dl><p class="ma-caption">具有自动存储期的局部对象在离开所属作用域时结束生命周期，无需 malloc/free 配对。返回其地址不能延长它的生命周期。</p></section>
      ${wikiRelated('memoryApi')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;

  let scene = 'malloc';
  let frames = buildScenario(scene);
  let stage = 0;
  let timer = null;
  const playButton = root.querySelector('#ma-play');
  const previousButton = root.querySelector('#ma-prev');
  const nextButton = root.querySelector('#ma-next');
  const position = root.querySelector('#ma-position');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const referenceText = (frame, pointer) => {
    const objectIndex = frame.objects.findIndex(object => object.id === pointer.object);
    return pointer.status === 'valid' ? `→ 对象 ${objectIndex + 1}` : pointer.status === 'dangling' ? `旧对象 ${objectIndex + 1} · 引用已失效` : pointer.status === 'null' ? 'NULL' : '未初始化';
  };
  const diagram = (frame, previous = null) => `<div class="ma-pointers"><h3>指针变量与引用</h3>${Object.entries(frame.pointers).map(([name, pointer]) => {
    const changed = previous && JSON.stringify(previous.pointers[name]) !== JSON.stringify(pointer);
    return `<div class="ma-pointer ma-pointer-${pointer.status}${changed ? ' ma-changed' : ''}" data-pointer="${name}" data-status="${pointer.status}"><strong>${name}</strong><span>${pointer.status === 'uninitialized' ? '未初始化' : pointer.status === 'null' ? 'NULL' : `${pointer.status === 'dangling' ? '旧地址记录：' : ''}${pointer.address}`}</span>${pointer.object ? `<p class="ma-pointer-target">${referenceText(frame, pointer)}</p>` : ''}</div>`;
  }).join('')}</div><div class="ma-object-list"><h3>对象大小与内容</h3>${frame.objects.length ? frame.objects.map((object, objectIndex) => {
    const changed = previous && JSON.stringify(previous.objects.find(value => value.id === object.id)) !== JSON.stringify(object);
    const references = Object.entries(frame.pointers).filter(([, pointer]) => pointer.status === 'valid' && pointer.object === object.id).map(([name]) => name);
    const elementBytes = object.bytes / object.values.length;
    return `<section class="ma-object ${object.live ? 'ma-object-live' : 'ma-object-ended'}${changed ? ' ma-changed' : ''}${object.live && !references.length ? ' ma-object-unreferenced' : ''}" data-object="${object.id}" data-live="${object.live}"><div class="ma-object-heading"><strong>对象 ${objectIndex + 1}</strong><code>${object.address}</code><span>${object.bytes} 字节 / ${object.live ? '活对象' : '生命周期已结束'}</span></div>${object.live ? `<div class="ma-elements">${object.values.map((value, index) => `<div class="ma-element ${value === null ? 'ma-uninitialized' : ''}"><span>${object.element === 'char' ? 'char' : 'int'} [${index}]</span><strong>${value === null ? '?' : value}</strong><small>偏移 ${index * elementBytes}–${(index + 1) * elementBytes - 1} 字节</small></div>`).join('')}</div>` : ''}${object.live && !references.length ? '<p class="ma-links">对象仍存在，但程序已丢失访问与释放它的引用。</p>' : ''}</section>`;
  }).join('') : '<p class="ma-empty">无分配对象；不能解引用 NULL 或未初始化的指针。</p>'}</div>`;
  const cancelHighlights = () => root.querySelector('#ma-diagram').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const prepare = () => {
    root.querySelector('#ma-total').textContent = frames.length;
    position.max = frames.length - 1;
    root.querySelector('#ma-lifecycle-caption').textContent = scenes[scene];
    root.querySelector('#ma-lifecycle-comparison').innerHTML = frames.map((frame, index) => `<tr data-lifecycle-stage="${index}"><th scope="row">${index + 1} · ${frame.label}</th><td>${Object.entries(frame.pointers).map(([name,pointer]) => `<div>${name} ${referenceText(frame,pointer)}</div>`).join('')}</td><td>${frame.objects.map((object, objectIndex) => object.live ? `对象 ${objectIndex + 1} · ${object.bytes} 字节` : '').filter(Boolean).join('；') || '无活对象'}</td><td>${frame.read === null ? '尚未计算' : frame.read}</td></tr>`).join('');
    root.querySelector('#ma-steps').innerHTML = frames.map((frame, index) => `<li><button type="button" data-stage="${index}" aria-label="阶段 ${index + 1}，${frame.label}" aria-pressed="false">${frame.label}</button></li>`).join('');
  };
  const paint = () => {
    const frame = frames[stage];
    cancelHighlights();
    root.querySelector('#ma-stage').textContent = stage + 1;
    root.querySelector('#ma-event-title').textContent = frame.label;
    root.querySelector('#ma-code').textContent = frame.code;
    root.querySelector('#ma-reason').textContent = frame.text;
    root.querySelector('#ma-request').textContent = `${frame.requestedBytes} 字节`;
    root.querySelector('#ma-live').textContent = `${frame.objects.filter(object => object.live).length} 个 / ${frame.objects.filter(object => object.live).reduce((total, object) => total + object.bytes, 0)} 字节`;
    root.querySelector('#ma-read').textContent = frame.read === null ? '尚未计算' : `${frame.read}（已计算，不重新读取对象）`;
    root.querySelector('#ma-result').hidden = frame.read === null;
    root.querySelector('#ma-diagram').innerHTML = diagram(frame, stage > 0 ? frames[stage - 1] : null);
    root.querySelectorAll('[data-stage]').forEach(button => {
      const selected = Number(button.dataset.stage) === stage;
      button.setAttribute('aria-pressed', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll('[data-lifecycle-stage]').forEach(row => {
      if (Number(row.dataset.lifecycleStage) === stage) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1}，${frame.label}`);
    previousButton.disabled = stage === 0;
    updatePlayState();
    nextButton.disabled = frame.complete;
    if (!reducedMotion.matches) root.querySelector('#ma-diagram').animate([{opacity: .65}, {opacity: 1}], {duration: 180});
  };
  const updatePlayState = () => {
    const playing = timer !== null;
    const label = playing ? '暂停' : frames[stage].complete ? '重新播放' : '播放';
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.setAttribute('aria-label', label);
    playButton.title = label;
    playButton.firstElementChild.textContent = playing ? 'Ⅱ' : frames[stage].complete ? '↻' : '▶';
  };
  const pause = () => { clearInterval(timer); timer = null; updatePlayState(); };
  const advance = () => { stage = Math.min(stage + 1, frames.length - 1); if (frames[stage].complete) pause(); paint(); };
  const play = () => { if (frames[stage].complete) { stage = 0; paint(); } timer = setInterval(advance, Number(root.querySelector('#ma-speed').value)); updatePlayState(); };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  previousButton.addEventListener('click', () => { pause(); stage = Math.max(0, stage - 1); paint(); });
  nextButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#ma-reset').addEventListener('click', () => { pause(); stage = 0; paint(); });
  root.querySelector('#ma-scene').addEventListener('change', event => { pause(); scene = event.target.value; frames = buildScenario(scene); stage = 0; prepare(); paint(); });
  root.querySelector('#ma-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  root.querySelector('#ma-steps').addEventListener('click', event => { const button = event.target.closest('[data-stage]'); if (button) { pause(); stage = Number(button.dataset.stage); paint(); } });
  root.querySelector('#ma-steps').addEventListener('keydown', event => {
    const button = event.target.closest('[data-stage]');
    if (!button || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    pause();
    const current = Number(button.dataset.stage);
    stage = event.key === 'Home' ? 0 : event.key === 'End' ? frames.length - 1 : Math.max(0, Math.min(frames.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
    paint();
    root.querySelector(`[data-stage="${stage}"]`).focus({preventScroll:true});
  });
  position.addEventListener('input', event => { pause(); stage = Number(event.target.value); paint(); });
  const errorAnalysis = {
    unallocated: [['指针状态','p 尚未初始化，没有指向有效对象。'],['错误动作','通过 *p 写入 10。'],['违反条件','声明指针变量不等于分配其所指对象，必须先获得有效引用。']],
    size: [['申请大小','sizeof p 为指针自身大小，本例为 8 字节，只够两个 4 字节的 int。'],['错误动作','写入 p[2]，需要偏移 8–11 的四个字节，已超出该对象。'],['正确大小','三个 int 需要 3 * sizeof *p，本例为 12 字节；不能用指针大小代替对象大小。']],
    string: [['申请大小','strlen("cat") 为 3，只申请了三个 char 的空间。'],['错误动作','strcpy 还要写入结尾空字符，合计四个字节；最后一个字节位于对象之外。'],['正确大小','使用 strlen("cat") + 1，申请 4 字节。']],
    uninitialized: [['对象状态','分配成功，对象有两个 int，但内容尚未初始化。'],['错误动作','直接读取 p[0]。'],['缺少的条件','malloc 不初始化内容，读取结果没有可依赖的确定值；需先写入有效值。']],
    bounds: [['合法范围','对象含两个 int，合法索引为 0、1，字节偏移为 0–7。'],['错误动作','写入 p[2]，对应偏移 8–11，已在对象范围之外。'],['违反条件','访问位置必须属于对象；相邻地址看起来空闲，也不代表程序拥有那部分空间。']],
    leak: [['对象状态','对象仍存在，大小为 8 字节。'],['引用变化','在没有其他引用的条件下，将最后一个指针 p 设为 NULL。'],['资源后果','赋 NULL 没有释放对象，却使程序丢失后续访问和释放它的路径。这是内存泄漏，不是该赋值本身的未定义行为。']],
    useAfterFree: [['对象状态','free(p) 已结束对象生命周期。'],['错误动作','继续通过 p[0] 读取原对象。'],['违反条件','原引用已经失效。底层字节未清零或旧地址数字相同，都不能使对象恢复有效。']],
    doubleFree: [['对象状态','第一次 free(p) 已释放这次分配。'],['错误动作','再次用原指针释放同一分配。'],['违反条件','free 的对象必须尚未释放。free(NULL) 是无操作，不等于再次释放旧对象。']],
    invalidFree: [['对象位置','p 指向分配起点；本例 p + 1 位于起点之后 4 字节。'],['错误动作','把对象内部地址 p + 1 传给 free。'],['参数条件','free 需要匹配尚未释放的分配起始指针，不能使用对象内部地址或栈变量地址。']],
  };
  const paintError = () => {
    const id = root.querySelector('#ma-error').value;
    const error = buildError(id);
    root.querySelector('#ma-error-kind').textContent = error.kind;
    root.querySelector('#ma-error-title').textContent = error.title;
    const lines = error.code.split('\n');
    root.querySelector('#ma-error-code').replaceChildren(...lines.map((line, index) => {
      const element = document.createElement('span');
      element.textContent = line;
      if (index === lines.length - 1) element.className = 'ma-problem-line';
      return element;
    }));
    root.querySelector('#ma-error-reason').innerHTML = errorAnalysis[id].map(([title,text]) => `<div><dt>${title}</dt><dd>${text}</dd></div>`).join('');
    root.querySelector('#ma-error-diagram').innerHTML = diagram(error);
    root.querySelector('#ma-error-target').textContent = ({size: '违规访问：int [2]，超出 8 字节对象', string: '违规写入：结尾空字符需要第 4 个字节', bounds: '违规访问：int [2]，超出两个元素的范围', invalidFree: '错误释放位置：对象内部 p + 1，而非分配起点', leak: '对象仍然存在，但已经没有引用', unallocated: '违规解引用：p 未初始化', uninitialized: '无确定读取值：p[0] 尚未初始化', useAfterFree: '违规读取：对象已释放', doubleFree: '违规释放：同一分配已结束'})[id];
  };
  root.querySelector('#ma-error').addEventListener('change', () => { pause(); paintError(); });
  reducedMotion.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  prepare(); paint(); paintError();
}

renderMemoryApiPage(document.getElementById('root'));