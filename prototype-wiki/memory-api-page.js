function renderMemoryApiPage(root) {
  const {scenes, errors, buildScenario, buildError} = OSLabMemoryApi;
  root.innerHTML = `<div class="page rr-page lde-page ma-page" id="top">
    ${wikiHeader('memoryApi', [{href: '#demo', title: '申请与释放'}, {href: '#mistakes', title: '常见错误'}, {href: '#contracts', title: '接口约定'}, {href: '#allocator', title: '库与 OS'}])}
    <main><section class="intro"><p class="eyebrow">内存虚拟化 / 使用接口</p><h1>内存 API <span>Memory API</span></h1><p class="lead">指针保存地址，但这个地址不一定对应可使用的对象。</p><p class="definition">malloc 成功时分配指定字节数的空间并返回指针，程序随后初始化和使用对象；free 释放这次分配，结束对象的生命周期。有效访问需要对象仍然存在、访问位置没有越界，读取的值也已经初始化。复制指针不会复制对象，因此释放对象还会影响其他指向它的引用。</p><p class="model-note">示例假设 sizeof(int)=4、sizeof(指针)=8，0x1000／0x2000 为假定的虚拟地址，动态分配请求均为非零大小。对象释放后，原指针不能再作为有效引用使用；旧地址数值不赋予访问权限。</p></section>
      <section class="rr-rules" id="demo" aria-labelledby="ma-demo-title"><div class="section-heading"><div><p class="section-index">01 / ALLOCATE · INITIALIZE · USE · FREE</p><h2 id="ma-demo-title">从申请空间，到结束对象的生命周期</h2></div><p class="ma-progress">阶段 <strong id="ma-stage">1</strong> / <span id="ma-total">5</span></p></div>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="ma-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="ma-next" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="ma-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>接口与结果<select id="ma-scene">${Object.entries(scenes).map(([id, title]) => `<option value="${id}">${title}</option>`).join('')}</select></label><label>播放速度<select id="ma-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label></div>
        <ol class="ma-steps" id="ma-steps" aria-label="执行阶段"></ol>
        <div class="ma-workbench"><aside class="ma-action"><p class="detail-kicker" id="ma-label"></p><pre id="ma-code" aria-label="当前 C 片段"></pre><p id="ma-reason" aria-live="polite" aria-atomic="true"></p><dl class="ma-observations"><div><dt>最近请求大小</dt><dd id="ma-request"></dd></div><div><dt>当前活对象</dt><dd id="ma-live"></dd></div><div><dt>计算结果记录</dt><dd id="ma-read"></dd></div></dl></aside><div class="ma-diagram" id="ma-diagram" aria-label="指针与堆对象状态"></div></div>
        <input id="ma-position" type="range" min="0" max="4" step="1" value="0" aria-label="演示阶段"><p class="ma-caption">图中每格代表一个 int，不是一个字节；? 表示尚未初始化，而不是 0。释放后，原元素不再属于可使用的对象；底层空间是否清零或归还 OS 是另一回事。</p>
      </section>
      <section class="rr-rules ma-section" id="mistakes" aria-labelledby="ma-mistakes-title"><p class="section-index">02 / WHAT WENT WRONG?</p><h2 id="ma-mistakes-title">错误发生在哪一步，为什么不合法</h2><p class="ma-section-lead">涉及分配的错误示例假设申请成功。未定义行为表示 C 语言规则不规定这次操作必须产生什么结果。对象越界或释放后访问可能崩溃，也可能没有立即可见的异常；操作系统的地址保护不能自动识别每个 C 对象的边界。</p><label class="ma-error-selector">错误类型<select id="ma-error">${Object.entries(errors).map(([id, error]) => `<option value="${id}">${error.title}</option>`).join('')}</select></label>
        <div class="ma-error-workbench"><div><p class="ma-error-kind" id="ma-error-kind"></p><pre id="ma-error-code"></pre><p class="ma-error-explanation" id="ma-error-reason"></p></div><div id="ma-error-diagram" class="ma-diagram"></div></div><p class="ma-error-target" id="ma-error-target"></p>
      </section>
      <section class="rr-rules ma-section" id="contracts" aria-labelledby="ma-contracts-title"><p class="section-index">03 / THE API CONTRACT</p><h2 id="ma-contracts-title">大小、返回值与对象生命周期</h2><div class="ma-contracts"><article><h3>malloc</h3><code>malloc(nbytes)</code><p>参数是字节数，不是元素数。成功返回满足常规对象对齐要求的空间；内容未初始化，失败返回 NULL。数组大小还要防止乘法溢出，过度对齐对象需要相应接口。</p></article><article><h3>calloc</h3><code>calloc(count, size)</code><p>按元素数与元素大小申请，并将字节清零。全零字节不保证对所有类型都表示有效的零值；仍须检查返回值。</p></article><article><h3>realloc</h3><code>tmp = realloc(p, nbytes)</code><p>非零大小请求成功时，返回调整后对象的指针；保留新旧大小较小范围内的内容，新增长部分未初始化。可能移动，也可能地址数字不变，成功后都必须使用返回的新指针。</p></article><article><h3>free</h3><code>free(p)</code><p>释放匹配的、尚未释放的分配。free(NULL) 无操作；不能释放栈地址或分配内部地址。它不自动清空指针、清零字节或立即归还物理页。</p></article></div>
        <div class="ma-sizing"><h3>计算的是对象大小，不是指针大小</h3><div><code>3 * sizeof *p</code><span>三个所指类型的元素</span></div><div><code>sizeof p</code><span>指针变量自身的大小</span></div><div><code>strlen(s) + 1</code><span>字符串内容加结尾的空字符</span></div><p>sizeof 是运算符，用于求类型或对象的大小；strlen 是函数，用于计算有效字符串在结尾空字符之前的长度。二者求值的对象与含义不同，不能互换。</p></div>
        <div class="rr-tradeoff"><h3>realloc 失败不释放原对象，也不应丢失原引用</h3><pre class="ma-safe-realloc">int *tmp = realloc(p, 3 * sizeof *p);
if (tmp != NULL) {
    p = tmp;
} else {
    /* 原来的 p 仍然有效，处理失败 */
}</pre><p>如果直接写 p = realloc(p, ...)，失败时 p 变为 NULL，可能丢失原对象的最后一个引用。零大小 realloc 的规则与 C 版本有关，不能套用上述非零大小请求的处理方式。</p></div>
      </section>
      <section class="rr-rules ma-section" id="allocator" aria-labelledby="ma-allocator-title"><p class="section-index">04 / LIBRARY FIRST, OS WHEN NEEDED</p><h2 id="ma-allocator-title">malloc 是库接口，不是每次都向 OS 申请物理页</h2><div class="ma-layers"><div><h3>程序</h3><code>malloc / calloc / realloc / free</code><p>请求空间、管理引用、结束对象生命周期。</p></div><span aria-hidden="true">→</span><div><h3>库分配器</h3><p>管理已经获得的空间，选择可用块，并在释放后回收和复用。</p></div><span aria-hidden="true">→</span><div><h3>OS</h3><p>必要时提供或调整虚拟内存映射；真实底层机制依平台和分配器而异。</p></div></div><dl class="ma-os-apis"><div><dt>brk / sbrk</dt><dd>传统 Unix 中调整进程数据段末端的接口；sbrk 的库封装和具体系统调用机制依平台而异，并非所有分配器都依赖它。</dd></div><div><dt>mmap</dt><dd>建立虚拟内存映射，可用于匿名内存或文件映射。分配器可能用它获得空间，但建立映射不等于所有物理页立即驻留。</dd></div></dl><p class="ma-caption">自动存储期的局部变量无需 malloc/free 配对。返回函数局部对象的地址，不能延长那个局部对象的生命周期。</p></section>
      ${wikiRelated('memoryApi')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;

  let scene = 'malloc';
  let frames = buildScenario(scene);
  let stage = 0;
  let timer = null;
  const playButton = root.querySelector('#ma-play');
  const nextButton = root.querySelector('#ma-next');
  const position = root.querySelector('#ma-position');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointerStatus = {null: 'NULL / 未指向对象', valid: '有效引用', dangling: '失效引用 / 旧地址记录', uninitialized: '指针未初始化'};
  const diagram = frame => `<div class="ma-pointers"><h3>指针变量</h3>${Object.entries(frame.pointers).map(([name, pointer]) => `<div class="ma-pointer ma-pointer-${pointer.status}"><strong>${name}</strong><span>${pointer.status === 'uninitialized' ? '?' : pointer.status === 'null' ? 'NULL' : pointer.address}</span><small>${pointerStatus[pointer.status]}</small></div>`).join('')}<p>复制指针只复制引用，不复制对象。</p></div><div class="ma-object-list"><h3>分配对象</h3>${frame.objects.length ? frame.objects.map(object => `<section class="ma-object ${object.live ? 'ma-object-live' : 'ma-object-ended'}" data-object="${object.id}"><div class="ma-object-heading"><strong>${object.address}</strong><span>${object.bytes} 字节 / ${object.live ? '活对象' : '生命周期已结束'}</span></div>${object.live ? `<div class="ma-elements">${object.values.map((value, index) => `<div class="ma-element ${value === null ? 'ma-uninitialized' : ''}"><span>${object.element === 'char' ? 'char' : 'int'} [${index}]</span><strong>${value === null ? '?' : value}</strong><small>${value === null ? '未初始化' : '已初始化'}</small></div>`).join('')}</div>` : '<p>原元素不可再通过旧引用访问。</p>'}<p class="ma-links">${object.live ? Object.entries(frame.pointers).filter(([, pointer]) => pointer.status === 'valid' && pointer.object === object.id).map(([name]) => `${name} → 此对象`).join('；') || '无引用：程序已丢失访问与释放它的路径' : '旧引用失效；相同地址数字不能恢复对象'}</p></section>`).join('') : '<p class="ma-empty">无分配对象</p>'}</div>`;
  const cancelHighlights = () => root.querySelector('#ma-diagram').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const prepare = () => {
    root.querySelector('#ma-total').textContent = frames.length;
    position.max = frames.length - 1;
    root.querySelector('#ma-steps').innerHTML = frames.map((frame, index) => `<li><button type="button" data-stage="${index}" aria-pressed="false"><span>${index + 1}</span>${frame.label}</button></li>`).join('');
  };
  const paint = () => {
    const frame = frames[stage];
    cancelHighlights();
    root.querySelector('#ma-stage').textContent = stage + 1;
    root.querySelector('#ma-label').textContent = `阶段 ${stage + 1} / ${frame.label}`;
    root.querySelector('#ma-code').textContent = frame.code;
    root.querySelector('#ma-reason').textContent = frame.text;
    root.querySelector('#ma-request').textContent = `${frame.requestedBytes} 字节`;
    root.querySelector('#ma-live').textContent = `${frame.objects.filter(object => object.live).length} 个 / ${frame.objects.filter(object => object.live).reduce((total, object) => total + object.bytes, 0)} 字节`;
    root.querySelector('#ma-read').textContent = frame.read === null ? '尚未计算' : `${frame.read}（已计算的历史值）`;
    root.querySelector('#ma-diagram').innerHTML = diagram(frame);
    root.querySelectorAll('[data-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.stage) === stage)));
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1}，${frame.label}`);
    playButton.disabled = frame.complete;
    nextButton.disabled = frame.complete;
    if (!reducedMotion.matches) root.querySelector('#ma-diagram').animate([{opacity: .65}, {opacity: 1}], {duration: 180});
  };
  const pause = () => { clearInterval(timer); timer = null; playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; playButton.firstElementChild.textContent = '▶'; };
  const advance = () => { stage = Math.min(stage + 1, frames.length - 1); if (frames[stage].complete) pause(); paint(); };
  const play = () => { if (frames[stage].complete) return; playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; playButton.firstElementChild.textContent = 'Ⅱ'; timer = setInterval(advance, Number(root.querySelector('#ma-speed').value)); };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  nextButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#ma-reset').addEventListener('click', () => { pause(); stage = 0; paint(); });
  root.querySelector('#ma-scene').addEventListener('change', event => { pause(); scene = event.target.value; frames = buildScenario(scene); stage = 0; prepare(); paint(); });
  root.querySelector('#ma-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  root.querySelector('#ma-steps').addEventListener('click', event => { const button = event.target.closest('[data-stage]'); if (button) { pause(); stage = Number(button.dataset.stage); paint(); } });
  position.addEventListener('input', event => { pause(); stage = Number(event.target.value); paint(); });
  const paintError = () => {
    const id = root.querySelector('#ma-error').value;
    const error = buildError(id);
    root.querySelector('#ma-error-kind').textContent = `${error.title} / ${error.kind}`;
    const lines = error.code.split('\n');
    root.querySelector('#ma-error-code').replaceChildren(...lines.map((line, index) => {
      const element = document.createElement('span');
      element.textContent = line;
      if (index === lines.length - 1) element.className = 'ma-problem-line';
      return element;
    }));
    root.querySelector('#ma-error-reason').textContent = error.reason;
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