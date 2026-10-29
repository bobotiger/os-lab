(() => {
  'use strict';
  const sources = {
    model: ['Google · 神经网络中的计算', 'https://developers.google.com/machine-learning/crash-course/neural-networks/nodes-hidden-layers'],
    hardware: ['Intel · AI 硬件', 'https://www.intel.com/content/www/us/en/learn/ai-hardware.html'],
    tpu: ['Google · TPU 架构', 'https://docs.cloud.google.com/tpu/docs/system-architecture-tpu-vm'],
    runtime: ['ONNX Runtime · 执行后端', 'https://onnxruntime.ai/docs/execution-providers/'],
    windows: ['Microsoft · Windows ML', 'https://learn.microsoft.com/en-us/windows/ai/new-windows-ml/overview'],
    hybrid: ['Microsoft · 本地与云端协作方向', 'https://blogs.windows.com/windowsexperience/2026/10/07/building-windows-for-hybrid-intelligence/'],
    security: ['Microsoft · 代理安全设计', 'https://learn.microsoft.com/en-us/windows/security/book/operating-system-agentic-security'],
    cgroup: ['Linux · 控制组与资源分配', 'https://docs.kernel.org/admin-guide/cgroup-v2.html'],
  };
  const source = id => `<a class="ai-source" href="${sources[id][1]}" target="_blank" rel="noopener noreferrer">${sources[id][0]} ↗</a>`;
  const term = (id, label) => `<button type="button" class="ai-term" data-term="${id}" aria-haspopup="dialog">${label}</button>`;
  const terms = {
    memory: {name:'显存容量与带宽', text:'模型的参数和计算中的临时结果都要占用内存。独立显卡通常有专用显存；集成 GPU 等设备也可能与 CPU 共享内存。容量决定能放下多少数据，带宽表示单位时间能传输多少数据。', example:'即使计算单元很多，如果模型放不下，或者计算单元一直在等数据，任务也未必完成得快。共享内存能减少某些复制，但仍要处理数据格式、访问同步和带宽竞争。'},
    sandbox: {name:'沙箱与执行权限限制', text:'沙箱是限制程序能访问哪些资源、能执行哪些操作的环境。例如，只让一个代理读取指定课程文件夹，并拒绝它访问其他目录或网络。具体限制由操作系统及相关执行环境落实。', example:'写在提示词里的“不要读取其他文件”是一条给模型的要求；文件访问控制则可以在请求真正发生时拒绝它。沙箱不保证模型结论正确，也不能自动撤销已经产生的外部影响。'},
  };
  const chapters = [['task','程序与模型'],['silicon','CPU 与加速器'],['journey','计算分工'],['system','AI 与操作系统'],['future','系统设计设想']];
  const flow = items => `<div class="ai-flow">${items.map((text,i)=>`${i?'<span class="ai-arrow" aria-hidden="true">→</span>':''}<div class="ai-flow-item">${text}</div>`).join('')}</div>`;
  const forward = (id,text) => `<div class="ai-forward"><p>${text}</p><button type="button" data-go="${id}">继续：${chapters.find(c=>c[0]===id)[1]} →</button></div>`;
  const weights = [[3,4],[1,2],[2,1],[4,3]];
  const chips = {
    cpu: {name:'CPU', full:'中央处理器', english:'Central Processing Unit', title:'CPU 的通用计算与程序控制',
      paragraphs:['CPU 执行程序指令，处理计算、条件判断和各种控制流程。录音应用需要打开文件、处理用户操作、准备模型输入，并在失败时决定下一步。这些工作的顺序和内容经常变化，适合由 CPU 上运行的程序组织。','CPU 也能执行神经网络中的乘法和加法，而且现代 CPU 同样有多个核心，也能用一条指令处理多个数值。它与加速器的区别在于设计取向：除了重复计算，还要高效处理多种指令与复杂的执行流程。'],
      benefit:'如果任务规模较小，直接在 CPU 上完成，可能省去提交设备任务和搬运数据的额外开销。',
      limit:'当任务包含大量可同时进行的相似计算时，GPU 等加速器可能更合适。比较的是整个任务的完成效果，不能只比较计算单元的数量。', source:'hardware'},
    gpu: {name:'GPU', full:'图形处理器', english:'Graphics Processing Unit', title:'GPU 的并行计算',
      paragraphs:['绘制图像需要对大量像素或几何数据进行相似计算。神经网络也经常要对许多数值执行相同形式的运算，因此 GPU 的并行计算能力可以用于模型训练和推理。','图中四组输出使用同一份输入，但各自的参数不同。它们在数学上可以独立计算，适合分组交给并行单元。真实模型会把这种计算扩大到更多数据，并在多个计算阶段之间传递结果。'],
      benefit:'规模足够大、并行性足够高的计算，可以让许多单元持续工作。图像生成和大型模型计算因此常使用 GPU。',
      limit:`任务还需要${term('memory','足够的显存或共享内存，以及及时的数据传输')}。小任务、频繁搬运数据或复杂分支，都可能削弱并行计算带来的收益。GPU 也会复用数据，并非每次计算都重新读取外部内存。`, source:'hardware'},
    npu: {name:'NPU', full:'神经网络处理器', english:'Neural Processing Unit', title:'NPU 的专用计算与数据复用',
      paragraphs:['手机和个人电脑中的 NPU，通常把电量和散热作为重要约束。它围绕受支持的神经网络运算设计计算单元和数据通路，尽量减少不必要的控制与数据搬运，让合适的模型可以持续在本机运行。例如，把会重复使用的数值放在计算单元附近，可以减少较远距离的数据搬运。','这种专门设计也带来适用范围的限制。模型中的一项运算称为“算子”；如果设备及其软件不支持某个算子，整段模型就未必能直接交给 NPU。之后要么换模型，要么由运行软件安排其他设备接手。'],
      benefit:'实时字幕需要连续处理声音。如果模型能够在 NPU 上执行，就可以比较这种方案是否在保证字幕延迟和准确率的同时减少耗电。',
      limit:'NPU 并不是统一的芯片结构，也不代表固定的性能等级。GPU、NPU 和 TPU 都可能采用矩阵计算与数据复用；这些能力并不互相专属。', source:'windows'},
    tpu: {name:'TPU', full:'张量处理器', english:'Tensor Processing Unit', title:'TPU 的矩阵乘加阵列',
      paragraphs:['TPU 是 Google 的机器学习专用加速器系列。它与“CPU、GPU、NPU”这类宽泛称呼不处于完全相同的分类层级。这里用它说明：当计算形式足够集中时，可以进一步围绕这种计算设计硬件。','张量是组织数值数据的一种方式：一列数、一个二维矩阵，以及带多个维度的图像数据，都可以用张量表示。TPU 的重要计算部件把许多乘加单元连接起来，使输入、参数或中间结果能够在阵列中传递和复用，减少反复从较远的存储位置取数。'],
      benefit:'Google Cloud TPU 可用于大规模机器学习训练与推理。主机 CPU 仍负责组织执行和输入输出，专用阵列承担适合它的计算。',
      limit:'图中只展开一次乘加过程，不表示某代 TPU 的真实电路或时序。云端 AI 服务也可能使用 GPU 等设备，不能根据“在云端运行”推断其使用 TPU。', source:'tpu'},
  };
  const routes = {cpu:'本机 CPU',gpu:'本机 GPU',npu:'本机 NPU',cloud:'云端服务'};
  const routeHints = {cpu:'输入留在本机 · CPU 计算',gpu:'输入留在本机 · 使用 GPU',npu:'输入留在本机 · 使用 NPU',cloud:'输入上传 · 远程计算'};
  const levels = {
    feature: {label:'应用增加 AI 功能', status:'已有应用方式', title:'AI 改善应用中的具体功能',
      paragraphs:['录音应用可以加入转写模型，让用户少打一遍文字；文件管理工具可以加入自然语言搜索，让用户换一种方式表达查找条件。任务仍由应用自己的流程组织，AI 改善其中某个环节。','这类功能可以建立在现有操作系统之上。功能是否好用，取决于模型质量、交互设计和计算开销；仅凭出现一个聊天框，还无法判断系统底层发生了什么变化。'],
      path:['用户发起操作','应用调用模型','应用展示或保存结果'], takeaway:'首先改变的是应用提供的能力。模型与运行软件可以由应用自行集成，也可以使用系统提供的服务。', source:'windows'},
    platform: {label:'平台提供公共能力', status:'已有平台实例 · Windows ML', title:'共享的推理运行时与硬件适配',
      paragraphs:['如果每个应用都要分别适配 CPU、GPU 和 NPU，并携带自己的运行软件，开发和更新会重复进行。系统平台可以提供公共的推理运行时和设备执行后端，让应用通过约定的接口使用硬件。','Windows ML 是一个已有实例：应用可以选择使用共享的系统运行时，由平台维护相关组件。这里共享的是软件基础设施；多个应用是否共用同一模型、怎样分配设备时间，仍是另外的设计问题。'],
      path:['录音、绘图等多个应用','公共推理运行时与执行后端','CPU / GPU / NPU'], takeaway:'改变的是公共能力由谁提供、谁维护。减少重复适配，并不意味着系统已经能理解每个用户任务的目的。', source:'windows'},
    agent: {label:'代理持续执行任务', status:'产品探索 · 所引安全文档包含实验能力', title:'AI 代理选择行动并调用工具',
      paragraphs:['AI 代理（Agent）是围绕目标选择行动、调用工具并观察结果的软件。比如先读取指定材料，再运行统计程序，根据结果补充图表，最后生成报告草稿。模型参与决定下一步，文件读取、计算和保存仍由具体工具执行。','普通自动化也能串联多个步骤，区别在于代理可以用模型处理途中出现的新情况。不过，灵活选择行动也可能带来误操作。系统需要识别是谁在行动、它获得了哪些权限，并在每次资源访问时执行相应限制。'],
      path:['用户给出目标','模型选择行动，工具执行','观察结果，再决定下一步'], takeaway:`代理可以运行在现有应用与平台之上。${term('sandbox','沙箱')}、身份和访问控制用于限制行动范围；模型说“我会遵守要求”，不能代替实际的权限检查。`, source:'security'},
  };
  const futures = {
    goal: {label:'围绕目标管理工作', action:'把截止时间改为今晚', bridgeTitle:'用户目标与执行活动的关联', ideaTitle:'跨应用任务的统一记录', gapTitle:'期限和预算带来的约束',
      foundation:'Linux 的 cgroup（控制组）能把进程组织成组，并对组内的 CPU 等资源进行分配和限制。这说明系统已经具备“把相关执行放在一起管理”的一部分基础。',
      bridge:'一项人的目标却可能跨越浏览器、统计程序、绘图工具和远程服务。系统若要统一管理它，首先需要建立“这个目标对应哪些执行活动”的关系，再把资源消耗和进度关联起来。',
      idea:'设想系统为这项课题保存一份持续更新的任务记录：包含子任务、依赖关系、预算和产物。用户修改截止时间时，系统可以据此提出调整范围与执行顺序的方案，而不是让每个应用各自处理。',
      gap:'期限缩短不代表计算一定能按时完成。任务耗时如何估计、其他工作是否可以推迟、谁批准增加预算，都需要明确规则；语言模型判断“这很重要”，不能直接取得更高权限。',
      before:'原计划按周五交付组织资料、统计和报告草稿。图中的几项工作归属于同一个目标。',
      after:'系统提出先完成本机统计和核心结论、推迟补充资料的方案，并要求用户确认缩小范围。归组提供了调整入口，不能凭空保证今晚完成。', source:'cgroup'},
    hybrid: {label:'跨本机与云端协作', action:'模拟网络中断', bridgeTitle:'数据权限与计算资源的选择', ideaTitle:'本地与云端任务的协同安排', gapTitle:'断网后的任务进度与未完成部分',
      foundation:'本地模型运行时与云端模型服务都已存在。微软也已公布把本地与云端模型配合使用的产品方向，其中具体功能的交付状态各不相同。',
      bridge:'能访问两种计算资源，还不足以自动选对方案。系统需要知道哪些数据允许离开本机、某个模型是否适合当前步骤，以及网络、费用和可用内存是否满足要求。',
      idea:'设想同一课题中的问卷统计始终留在本机，公开资料可以通过网络获取；只有经过授权、适合远程处理的内容才交给云端模型。网络改变时，系统按这些约束重新安排尚未执行的工作。',
      gap:'云端模型和本地模型可能产生不同质量的结果。断网后，系统只能继续本机确实能完成的部分；无法完成的内容应说明缺口，并等待条件恢复或用户调整要求。',
      before:'问卷与统计留在本机；公开资料检索使用网络。后续草稿需要汇合两部分结果。',
      after:'公开资料检索暂停，本机统计可以继续。草稿仍缺少待核对的公开资料，系统不能把“完成了本地部分”说成整个任务已经完成。', source:'hybrid'},
    control: {label:'让持续执行可控', action:'撤回问卷文件的访问权限', bridgeTitle:'工具调用中的权限检查', ideaTitle:'跨应用任务的权限撤销', gapTitle:'撤权后的数据处理与外部影响',
      foundation:'已有代理安全方案采用独立身份、有限授权和访问撤销。所引 Windows 文档讨论了相关实验能力，说明这些控制正在进入系统平台的设计。',
      bridge:'一个目标可能派生多个工具调用和后台进程。只关闭聊天窗口，未必能停止它们。要有效撤销授权，需要知道哪些活动属于该目标，并让相关访问入口执行更新后的规则。',
      idea:'设想用户可以直接对“校园节能课题”撤回问卷访问权限。系统阻止新的读取请求，向相关工具报告权限变化，同时列出此前已生成的统计和草稿，便于用户决定如何处理。',
      gap:'撤销访问不能让程序忘掉已经读入的数据，也不能自动收回已发送的内容。必要时还要终止相关执行、清理临时数据，并检查外部服务是否支持删除或恢复；有些影响无法撤销。',
      before:'统计工具获得指定问卷文件的读取权限；它没有发布报告或发送消息的授权。',
      after:'新的问卷读取被拒绝，依赖这份数据的统计步骤暂停。已经生成的文件仍需单独处理；停止后续访问不等于抹去此前发生的操作。', source:'security'},
  };
  const root = document.querySelector('#root');
  root.innerHTML = `<div class="page ai-page" id="top">${wikiHeader('aiComputing', [])}<main>
    <section class="ai-hero" aria-labelledby="page-title"><p class="ai-kicker">CPU 虚拟化 · 拓展阅读</p><h1 id="page-title">AI 时代的<span class="ai-keep">计算</span>与<span class="ai-keep">操作系统</span></h1><p class="ai-intro">以<span class="ai-keep">语音转写</span>为例，了解 CPU、GPU、NPU 和 TPU <span class="ai-keep">的作用</span>，再探讨<span class="ai-keep">系统怎样管理</span><span class="ai-keep">跨应用</span>、<span class="ai-keep">跨设备</span>的 <span class="ai-keep">AI 任务</span>。</p></section>
    <div class="ai-tabs" role="tablist" aria-label="阅读主线">${chapters.map(([id,name])=>`<button type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="${id}" aria-selected="false" tabindex="-1">${name}</button>`).join('')}</div>
    <section id="task" class="ai-panel" role="tabpanel" aria-labelledby="tab-task" tabindex="0" hidden>
      <div class="ai-heading"><h2>AI 应用中的程序与模型</h2><p>打开录音、识别语音、整理要点、保存文件，看起来是一件事，实际需要普通程序与模型计算配合完成。</p></div>
      <div class="ai-task-strip" aria-label="从录音到笔记的处理过程"><div><span>应用处理</span><strong>读取录音</strong><p>取得声音的数字表示。</p></div><span class="ai-arrow" aria-hidden="true">→</span><div class="is-model"><span>模型计算</span><strong>识别语音</strong><p>根据声音生成转写文字。</p></div><span class="ai-arrow" aria-hidden="true">→</span><div class="is-model"><span>模型计算</span><strong>整理要点</strong><p>根据文字生成笔记草稿。</p></div><span class="ai-arrow" aria-hidden="true">→</span><div><span>应用处理</span><strong>保存与核对</strong><p>保存文件，由人检查内容。</p></div></div>
      <div class="ai-prose"><p>读取和保存文件，可以由程序按照明确的规则完成。语音识别与内容整理，则可以使用从数据中训练出来的模型。模型把输入转换为预测或生成结果，但结果仍可能出错，因此这里把产物称为“草稿”。</p><p><strong>模型由计算结构和参数共同描述。</strong>参数是一组从训练数据中学到的数值，决定输入怎样影响结果。录音本身也会先表示为数值，处理器执行模型中的运算，最终由软件把结果解释为文字。语音转写与笔记整理可以使用不同模型。</p><p>本页主要讨论神经网络模型。神经网络把多层数值计算连接起来，前一层的输出成为后一层的输入；训练会调整其中的参数，使整个模型更好地完成目标任务。</p></div>
      <div class="ai-subsection"><h3>模型训练与推理</h3><div class="ai-choice-row" role="group" aria-label="比较训练与推理"><button type="button" data-mode="training" aria-pressed="false">训练：调整参数</button><button type="button" data-mode="inference" aria-pressed="true">推理：处理新输入</button></div><div class="ai-model-example" aria-live="polite"><div id="ai-model-flow"></div><p id="ai-model-explanation"></p></div><p class="ai-prose">在这个例子中，课堂录音的转写属于推理：使用已经训练好的模型处理新录音，模型参数保持不变。输入改变，输出仍会改变。模型训练通常需要反复调整参数；推理虽然省去了这部分工作，计算量也可能很大。</p></div>
      <div class="ai-subsection ai-math-section"><div><h3>模型计算中的乘法与加法</h3><p>下面用两项输入和四组固定参数，计算四个输出。每组都先相乘、再相加；把参数按行列排成数表，就是矩阵。大量这类运算，是神经网络需要计算资源的一个重要原因。</p><p class="ai-note">这是手工设置的小算例，不是语音识别模型。真实网络还包含其他运算以及多层之间的数据传递。</p>${source('model')}</div><div class="ai-math-demo"><div class="ai-choice-row" role="group" aria-label="改变算例输入"><button type="button" data-input="0" aria-pressed="true">输入（2，1）</button><button type="button" data-input="1" aria-pressed="false">输入（1，3）</button></div><div id="ai-math" aria-live="polite"></div><p class="ai-note">只改变输入，四组参数保持不变。</p></div></div>
      ${forward('silicon','模型需要执行大量计算；处理器的设计决定了哪些计算适合交给它。')}
    </section>
    <section id="silicon" class="ai-panel" role="tabpanel" aria-labelledby="tab-silicon" tabindex="0" hidden>
      <div class="ai-heading"><h2>处理器设计：<span class="ai-keep">通用性</span>、<span class="ai-keep">并行性</span>与<span class="ai-keep">能耗</span></h2><p>通用性、并行能力、耗电和数据搬运<span class="ai-keep">都会影响</span><span class="ai-keep">处理器设计</span>。<br>CPU、GPU 与 NPU <span class="ai-keep">可以</span>在<span class="ai-keep">同一设备</span>中协作；TPU 是 <span class="ai-keep">Google 的专用加速器</span>。</p></div>
      <div class="ai-chip-picker" role="group" aria-label="比较处理器">${Object.entries(chips).map(([id,c])=>`<button type="button" data-chip="${id}" aria-pressed="false"><strong>${c.name}</strong><span>${c.full}</span>${id==='tpu'?'<small>Google 技术系列</small>':''}</button>`).join('')}</div>
      <div id="ai-chip-detail" class="ai-chip-detail"><div class="ai-chip-copy"><p class="ai-kicker" id="ai-chip-name"></p><h3 id="ai-chip-title"></h3><div id="ai-chip-text"></div></div><figure class="ai-chip-figure"><div id="ai-chip-art"></div><figcaption id="ai-chip-caption"></figcaption></figure></div>
      <div class="ai-chip-tradeoffs"><div><h3>设计优势</h3><p id="ai-chip-benefit"></p></div><div><h3>适用条件与限制</h3><p id="ai-chip-limit"></p></div></div><div id="ai-chip-source"></div>
      <div class="ai-takeaway"><strong>它们共同完成任务，而不是依次取代前一种处理器。</strong><p>CPU 可以组织程序并直接计算；合适的部分可以交给加速器。加速器通常需要软件准备数据和提交任务，能否加速还取决于模型、任务规模与设备支持。</p></div>
      ${forward('journey','从“有这种硬件”到“模型真的在它上面运行”，中间还需要软件安排。')}
    </section>
    <section id="journey" class="ai-panel" role="tabpanel" aria-labelledby="tab-journey" tabindex="0" hidden>
      <div class="ai-heading"><h2>模型计算的执行分工</h2><p>下面仍以录音与笔记为例。普通应用负责组织任务，模型计算则可以使用不同的执行路线。</p></div>
      <div class="ai-role-lines"><div><strong>推理运行时</strong><p>读取模型，组织输入输出，安排模型中的运算。它需要知道哪些部分能够由所选设备执行。</p></div><div><strong>执行后端与驱动</strong><p>执行后端把受支持的运算适配到设备；驱动负责与具体设备通信。它们把软件安排转换为可以提交的设备工作。</p></div><div><strong>操作系统</strong><p>管理进程、内存、设备访问和权限。它为这些软件提供执行基础；模型如何拆分，通常还需要运行时、后端和应用配置共同决定。</p></div></div>
      <div class="ai-demo-heading"><h3>执行路线与数据流向</h3><span>方案推演 · 不运行真实模型</span></div>
      <div class="ai-routes" role="group" aria-label="选择模型执行路线">${Object.entries(routes).map(([id,name])=>`<button type="button" data-route="${id}" aria-pressed="false"><span>${name}</span><small>${routeHints[id]}</small></button>`).join('')}</div>
      <div id="ai-compatibility" class="ai-compatibility" hidden><label><input id="ai-unsupported" type="checkbox"> 假设这台 NPU 不支持模型中的一项运算</label><fieldset id="ai-fallback-options" hidden><legend>在这个教学案例中选择处理方式</legend><label><input type="radio" name="fallback" value="stop" checked> 停止提交，调整模型或配置</label><label><input type="radio" name="fallback" value="cpu"> 配置 CPU 接手该项运算</label></fieldset></div>
      <p class="ai-note" id="ai-route-assumption"></p><p id="ai-route-status" class="ai-route-status" role="status"></p>
      <div class="ai-execution-board"><div id="ai-execution-map"></div><div class="ai-execution-detail" aria-live="polite" aria-atomic="true"><p class="ai-kicker" id="ai-step-label"></p><h3 id="ai-step-title"></h3><p id="ai-step-copy"></p><dl class="ai-readout"><div><dt>数据去向</dt><dd id="ai-data-location"></dd></div><div><dt>当前执行的主体</dt><dd id="ai-responsibility"></dd></div><div><dt>本机 CPU 此时负责</dt><dd id="ai-cpu-role"></dd></div></dl></div><div class="ai-step-controls"><button type="button" id="ai-prev">← 上一步</button><span id="ai-step-count"></span><button type="button" id="ai-next">下一步 →</button><button type="button" id="ai-reset">重置</button></div></div>
      <div class="ai-route-result"><h3 id="ai-route-result-title"></h3><p id="ai-route-result-copy"></p></div>
      <details class="ai-reference"><summary>教学假设与进一步阅读</summary><p>本地路线假设本机已准备好所选硬件、模型和相应软件；云端路线使用服务端的模型与计算资源。转写与整理可以由多个模型完成，图中把它们合并为模型计算部分。CPU 接手的分支，假设运行时允许这样分配，并且已有对应的 CPU 实现；实际软件也可能直接拒绝不支持的模型。</p><p>图中的位置表示职责和数据去向，不表示时间长短。此页没有实际测量性能；要比较方案，应使用明确的输入和质量要求，测量整项任务的延迟、资源占用和耗电。</p><div class="ai-source-row">${source('runtime')}${source('windows')}</div></details>
      ${forward('system','应用能够调用模型之后，操作系统平台还可以怎样减少重复工作、支持持续执行？')}
    </section>
    <section id="system" class="ai-panel" role="tabpanel" aria-labelledby="tab-system" tabindex="0" hidden>
      <div class="ai-heading"><h2>AI 操作系统的设想与已有基础</h2><p><span class="ai-keep">模型推理平台</span>已有实现，<span class="ai-keep">面向代理的系统支持</span>仍在探索。这些是设想的基础，<span class="ai-keep">不代表</span><span class="ai-keep">完整方案</span><span class="ai-keep">已经实现</span>。</p><p>下面比较<span class="ai-keep">应用功能</span>、<span class="ai-keep">公共平台</span>和<span class="ai-keep">代理执行环境</span>。它们<span class="ai-keep">可以共存</span>，<span class="ai-keep">没有必然的升级顺序</span>。</p></div>
      <div class="ai-levels" role="group" aria-label="AI 改变的不同层面">${Object.entries(levels).map(([id,l])=>`<button type="button" data-level="${id}" aria-pressed="false">${l.label}</button>`).join('')}</div>
      <div class="ai-system-detail"><p id="ai-level-status" class="ai-kicker"></p><h3 id="ai-level-title"></h3><div id="ai-level-lead" class="ai-prose"></div><div id="ai-system-path"></div><p id="ai-level-outcome" class="ai-takeaway"></p><div id="ai-level-source"></div></div>
      <div class="ai-subsection"><h3>AI 代理的权限与执行控制</h3><div class="ai-boundary"><div><span>可以由模型参与的工作</span><p>理解用户目标、提出计划、选择工具、解释结果。</p></div><div><span>需要可靠机制落实的规则</span><p>哪些文件可以读取、允许花多少资源、任务能否继续执行、操作是否留下记录。</p></div></div><p class="ai-prose">模型可能理解错目标，也可能受到材料中错误或恶意内容的影响。因此，授权和资源限制要在具体执行环节检查。代理应用本身也可以维护任务计划；系统集成的价值，是让多个应用使用统一的身份、权限和资源管理机制，共同遵守用户设定的约束。</p><p class="ai-prose">许多 AI 能力可以先建立在现有系统之上，再逐步与文件、设备和任务管理整合。是否需要修改内核，应看现有机制缺少什么；并不意味着要用语言模型替代内核，或让模型决定每一次 CPU 时间片。</p></div>
      ${forward('future','这些已有能力为系统设计提供了基础。下一节以跨应用课题为例，讨论仍需解决的问题。')}
    </section>
    <section id="future" class="ai-panel" role="tabpanel" aria-labelledby="tab-future" tabindex="0" hidden>
      <div class="ai-heading"><h2>跨应用 AI 任务的系统支持设想</h2><p>从课堂笔记再往前走：一个小组希望计算机协助完成持续几天、跨多个应用的调研工作，并且允许人在途中改变要求。</p></div>
      <blockquote class="ai-mission"><p>“周五前准备一份校园节能方案：查公开资料，分析我们提供的问卷，生成图表和报告草稿。问卷留在本机，服务费用最多 10 元；提交或对外发送由我们决定。”</p><footer>用于讨论的任务约定，不代表模型已经能够可靠完成整项工作。</footer></blockquote>
      <p class="ai-prose">这项要求同时包含目标、期限、数据边界和费用上限。把它拆成工具调用只是开始：系统还需要关联执行活动、记录进展，并在条件变化时说明哪些部分可以继续、哪些需要人决定。</p>
      <div class="ai-future-choices" role="group" aria-label="选择一个系统设计方向">${Object.entries(futures).map(([id,f])=>`<button type="button" data-future="${id}" aria-pressed="false">${f.label}</button>`).join('')}</div>
      <div class="ai-future-reasoning"><div><span class="ai-status ai-existing">已有基础</span><p id="ai-foundation"></p><div id="ai-future-source"></div></div><div><h3 id="ai-bridge-title"></h3><p id="ai-bridge"></p></div></div>
      <div class="ai-design-board"><div class="ai-demo-heading"><h3 id="ai-idea-title"></h3><span class="ai-status ai-proposal">设计推演</span></div><p id="ai-idea"></p><div class="ai-plan-root"><strong>校园节能课题</strong><span>期限 · 数据权限 · 费用预算 · 草稿产物</span></div><div id="ai-plan"></div><p class="ai-note">这些工作归属于同一目标；横向排列不表示执行先后。</p><div class="ai-plan-controls"><button type="button" id="ai-change-plan"></button><button type="button" id="ai-reset-plan">恢复原条件</button></div><p id="ai-plan-outcome" aria-live="polite"></p></div>
      <div class="ai-open-problem"><h3 id="ai-gap-title"></h3><p id="ai-gap"></p></div>
      <div class="ai-connection"><h3>异构计算与 CPU 虚拟化的联系</h3><p>资源变成 CPU、加速器和云服务的组合，任务也可能跨越多个程序；但“共享有限资源、保留控制权、约束执行”这些问题仍然存在。异构计算指不同类型处理器协同工作，它把已有问题带到了更广的环境中。</p><div><a href="limited-direct-execution.html"><strong>受限直接执行</strong><span>执行效率与控制权怎样兼顾</span></a><a href="cpu-scheduling.html"><strong>CPU 调度</strong><span>有限资源怎样在多个需求间分配</span></a><a href="multiprocessor.html"><strong>多处理器调度</strong><span>任务放在哪里运行，迁移有何代价</span></a></div></div>
    </section>
    <details class="ai-reference ai-source-notes"><summary>资料范围与来源</summary><p>资料核对日期：2026 年 10 月 28 日。硬件与运行时部分依据厂商技术文档；代理系统部分区分已有平台能力、产品探索与本页提出的设计设想。技术文档支持的是相应机制，不能据此认定整套未来方案已经实现。</p><div class="ai-source-list">${Object.keys(sources).map(source).join('')}</div></details>
    </main><footer class="site-footer"><span>OSLab / CPU 虚拟化 · 拓展阅读</span><a href="#top">回到页首 ↑</a></footer>
    <dialog class="ai-glossary" aria-labelledby="ai-term-title"><button type="button" id="ai-term-close" aria-label="关闭概念说明">×</button><h2 id="ai-term-title"></h2><p id="ai-term-text"></p><p id="ai-term-example"></p></dialog></div>`;
  root.querySelector('.site-header nav').remove();
  const el = id => document.getElementById(id);
  const pressed = (key,value) => root.querySelectorAll(`[${key}]`).forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute(key)===value)));
  let mode='inference', input=0, chip='cpu', route='cpu', step=0, level='feature', future='goal', changed=false, tpuStep=0;
  function paintModel() {
    pressed('data-mode',mode);
    el('ai-model-flow').innerHTML=mode==='training'?flow(['<span>训练样本</span><strong>录音与对应文字</strong>','<span>反复比较和调整</span><strong>预测结果与正确文字的差异</strong>','<span>保存训练结果</span><strong>得到模型参数</strong>']):flow(['<span>新的输入</span><strong>今天的课堂录音</strong>','<span>使用已训练的模型</span><strong>参数保持不变</strong>','<span>模型输出</span><strong>转写文字</strong>']);
    el('ai-model-explanation').textContent=mode==='training'?'在这个语音识别例子中，训练程序把模型的预测与样本中已有的正确文字比较，并据此反复调整参数。它学习的是怎样由声音预测文字，而不是把每段新录音都作为一条固定规则保存。':'推理把新录音转换为模型需要的输入，用已经得到的参数进行计算，再生成文字。这里的“推理”指使用模型进行预测或生成，不表示模型输出一定正确。';
  }
  function paintMath() {
    const x=input===0?[2,1]:[1,3]; pressed('data-input',String(input));
    el('ai-math').innerHTML=weights.map((w,i)=>`<div class="ai-equation"><span>输出 ${i+1}</span><code><b>${x[0]}</b> × ${w[0]} + <b>${x[1]}</b> × ${w[1]}</code><strong>= ${x[0]*w[0]+x[1]*w[1]}</strong></div>`).join('');
  }
  function paintChip() {
    const c=chips[chip]; pressed('data-chip',chip);el('ai-chip-detail').dataset.kind=chip;
    el('ai-chip-name').textContent=`${c.full} / ${c.english}`;el('ai-chip-title').textContent=c.title;
    el('ai-chip-text').innerHTML=c.paragraphs.map(p=>`<p>${p}</p>`).join('');
    el('ai-chip-benefit').textContent=c.benefit;el('ai-chip-limit').innerHTML=c.limit;el('ai-chip-source').innerHTML=source(c.source);
    const art=el('ai-chip-art');
    if(chip==='cpu') {
      art.innerHTML='<p class="ai-diagram-title">录音应用中的不同指令</p><div class="ai-cpu-path"><div>读取一段声音数据</div><span aria-hidden="true">↓</span><div>判断：数据是否准备好</div><div class="ai-cpu-branches"><div><span>已准备好</span><strong>提交或执行模型计算</strong></div><div><span>尚未准备好</span><strong>等待输入，处理界面操作</strong></div></div></div>';
      el('ai-chip-caption').textContent='程序根据条件选择下一步。示意图展示控制流程，不表示 CPU 只能串行执行。';
    } else if(chip==='gpu') {
      art.innerHTML=`<p class="ai-diagram-title">同一份输入（2，1），四组独立计算</p><div class="ai-parallel">${weights.map((w,i)=>`<div><span>计算 ${i+1}</span><code>2 × ${w[0]} + 1 × ${w[1]}</code><strong>${2*w[0]+w[1]}</strong></div>`).join('')}</div><p class="ai-diagram-note">各组输出不依赖彼此的计算结果。</p>`;
      el('ai-chip-caption').textContent='这类相互独立的计算适合分组并行。四个框表示计算任务，不表示 GPU 的核心数或实际耗时。';
    } else if(chip==='npu') {
      art.innerHTML='<p class="ai-diagram-title">让受支持的运算就近使用数据</p><div class="ai-npu-buffer">本地数据缓冲 · 复用输入与中间结果</div><div class="ai-reuse-arrows" aria-hidden="true">↕　↕　↕</div><div class="ai-npu-ops"><div>矩阵计算</div><span aria-hidden="true">→</span><div>其他受支持运算</div></div><div class="ai-npu-outside">需要另行处理：本设备不支持的运算</div>';
      el('ai-chip-caption').textContent='专用数据通路与就近复用，是常见优化思路；具体 NPU 的内部结构和支持范围因设备而异。';
    } else {
      art.innerHTML=`<p class="ai-diagram-title">两行计算，复用同一组输入</p><div class="ai-tpu-input"><span>两行都使用输入 2 ↓</span><span>两行都使用输入 1 ↓</span></div><div class="ai-tpu-array">${[[3,4],[1,2]].map((w,i)=>`<div class="ai-tpu-row"><div class="${tpuStep===1?'is-active':''}"><span>参数 ${w[0]}</span><strong>${tpuStep===0?`0 + ${w[0]} × 2`:2*w[0]}</strong></div><span aria-hidden="true">→</span><div class="${tpuStep===2?'is-active':''}"><span>参数 ${w[1]}</span><strong>${tpuStep===0?'等待左侧结果':tpuStep===1?`${2*w[0]} + ${w[1]} × 1`:2*w[0]+w[1]}</strong></div></div>`).join('')}</div><p class="ai-tpu-caption">${['相同输入用于两行计算，参数分别留在对应的计算位置。','第一列得到部分和 6 与 2，并把它们传给右侧，继续累加。','第二列接着累加，得到输出 10 与 4。计算过程中既复用输入，也继续使用传来的部分结果。'][tpuStep]}</p><div class="ai-mini-controls"><button type="button" id="ai-tpu-next"${tpuStep===2?' disabled':''}>${tpuStep===0?'计算第一列':'传递并累加'}</button><button type="button" id="ai-tpu-reset">重看</button></div>`;
      el('ai-chip-caption').textContent='这是为了说明数据复用与部分和传递而安排的小阵列，不是某代 TPU 的真实电路。箭头表示部分和向右传递；点击次数不代表硬件周期。';
    }
  }
  function npuConfiguration() {return {unsupported:route==='npu'&&el('ai-unsupported').checked,fallback:root.querySelector('input[name="fallback"]:checked').value==='cpu'};}
  function blocker(c) {
    if(c.unsupported&&!c.fallback) return 'NPU 缺少这项运算的支持，且未配置其他执行方式';
    return '';
  }
  function paintJourney() {
    const c=npuConfiguration(),reason=blocker(c),mixed=c.unsupported&&c.fallback;
    step=Math.min(step,reason?1:4);pressed('data-route',route);
    el('ai-compatibility').hidden=route!=='npu';el('ai-fallback-options').hidden=!c.unsupported;
    el('ai-route-assumption').textContent=route==='cloud'?'云端路线需要网络可用，并允许上传录音及相关文字；本例假设这两个条件已经满足。如果数据必须留在本机，就应选择本地路线。':'本例假设所选硬件及对应软件已准备好。'+(route==='npu'?'可在上方改变 NPU 的运算支持条件。':'');
    el('ai-route-status').hidden=!c.unsupported;
    el('ai-route-status').dataset.state=reason?'blocked':'possible';
    el('ai-route-status').textContent=reason?`当前路线无法提交：${reason}。`:mixed?'受支持部分交给 NPU，指定的不支持部分交给 CPU；下面可以查看两者怎样配合。':'';
    const names=['应用准备输入','检查执行条件','准备计算所需的数据','执行模型运算','接收结果并保存'];
    let title='',copy='',location='',owner='';
    if(step===0) {title='应用读取录音，并准备输入';copy=route==='cloud'?'CPU 上运行的应用读取获准的录音，按服务接口要求准备请求数据。云端模型及其参数由服务端管理，本机不需要先装入这份远程模型。':'CPU 上运行的应用读取录音，将其整理为模型要求的数据格式，并通过运行软件准备本地模型。之后即使由 GPU 或 NPU 执行计算，应用仍要先组织这些工作。';location='输入仍在本机内存';owner='运行在 CPU 上的应用';}
    if(step===1) {
      title=reason?'执行条件未满足，任务停在提交之前':mixed?'把模型分成 NPU 与 CPU 可执行的部分':`为${routes[route]}检查并安排执行`;
      copy=reason?`${reason}。此时没有开始模型计算。可以改变执行路线，或在确实具备相应实现时调整模型与运行软件的配置。`:route==='cloud'?'应用检查网络和数据授权，通过远程服务接口准备请求。服务端使用自己的模型运行环境；本机并不能只凭这个接口知道它使用哪一种处理器。':mixed?'本例由运行时将指定的不支持运算交给 CPU，其余受支持部分交给 NPU。只有运行时允许这种分配、并且 CPU 上有对应实现时，这条路线才成立。':route==='cpu'?'运行时选用 CPU 实现来安排模型运算。这些运算作为本机进程的工作，由操作系统调度线程并提供内存；这条路线不需要向加速器驱动提交计算。':'推理运行时通过执行后端检查运算的支持情况。后端和驱动安排相应的设备工作；操作系统提供进程、内存与设备访问等基础机制。';
      location='输入仍在本机，尚未提交计算';owner=route==='cloud'?'应用检查服务调用条件':'应用、推理运行时与执行后端';
    }
    if(step===2) {
      title=route==='cloud'?'获准的输入经过网络发送到远程服务':route==='cpu'?'CPU 使用本机内存中的输入与参数':mixed?'为 NPU 和 CPU 各自准备可访问的数据':`让${routes[route]}能够访问模型与输入`;
      copy=route==='cloud'?'应用通过网络发送获准的输入，远程服务接收后才能处理。这里跨过了本机与远程服务的边界；发送的是请求数据，服务端使用自己管理的模型参数。':route==='cpu'?'模型参数和输入都要占用本机内存，CPU 还会用缓存暂存近期要用的数据，减少较慢的内存访问。这条路线不需要另行向加速器提交模型计算。':mixed?'切换执行设备时，软件需要协调数据格式、访问位置和完成顺序。即使 NPU 与 CPU 共享物理内存，也仍需同步；拆分执行可能带来额外开销。':route==='gpu'?'后端和驱动让 GPU 能够访问输入与模型参数。独立显卡通常需要把所需数据准备到显存中；集成 GPU 也可能使用共享内存。CPU 运行相关软件来安排这些工作，并不意味着每个字节都由 CPU 指令逐一搬运。':'后端和驱动按这台 NPU 的要求准备数据布局和访问方式。即使 NPU 与 CPU 共享内存，也要保证数据已经准备好、计算顺序正确。把运算交给 NPU，不等于把整个应用都搬到 NPU 上。';
      location=route==='cloud'?'本机 → 远程服务':route==='cpu'?'本机内存 → CPU 计算':mixed?'本机数据 → NPU 与 CPU 可访问的区域':route==='gpu'?'本机数据 → GPU 可访问的显存或共享内存':'本机数据 → NPU 可访问的存储区域';owner=route==='cloud'?'本机应用、网络机制与远程服务':route==='cpu'?'推理运行时与操作系统的内存管理':'执行后端、驱动及内存管理机制';
    }
    if(step===3) {
      title=mixed?'NPU 与 CPU 按分配结果完成各自的运算':route==='cloud'?'远程服务执行模型计算':`${routes[route]}执行模型计算`;
      copy=mixed?'NPU 的输出可能成为 CPU 运算的输入，之后还可能交回 NPU。软件要满足这些先后依赖；两个设备参与，并不表示所有部分都能同时完成。':route==='cloud'?'服务端在自己的计算资源上运行模型，本机不执行这次远程模型计算。CPU 仍运行本机应用，处理界面与网络响应；等待服务返回时，操作系统可以调度其他就绪任务。':route==='cpu'?'CPU 既运行应用逻辑，也执行模型中的运算。它还可能与其他应用分享处理器时间，操作系统负责调度这些执行任务。':'设备执行受支持的模型运算。CPU 上的软件负责提交后续工作、等待或处理完成通知。等待设备期间，操作系统可以让 CPU 执行其他就绪任务，不需要一直空转等待。';
      location=route==='cloud'?'模型与中间结果在远程服务中':mixed?'本机 NPU / CPU 之间按依赖使用中间结果':'模型与中间结果在本机';owner=mixed?'NPU 与 CPU':route==='cloud'?'远程服务的执行环境':routes[route];
    }
    if(step===4) {title='应用接收结果，保存为笔记草稿';copy='模型计算得到的结果交回应用，由应用保存并展示。语音转写与笔记整理可能是前后两次模型调用。最后还要检查人名、术语和要点，才能判断整项任务是否达到要求。';location=route==='cloud'?'远程结果 → 本机草稿文件':'本机计算结果 → 草稿文件';owner='运行在 CPU 上的应用，以及核对内容的人';}
    el('ai-step-label').textContent=names[step];el('ai-step-title').textContent=title;el('ai-step-copy').textContent=copy;
    el('ai-data-location').textContent=location;el('ai-responsibility').textContent=owner;
    const cpuRoles=[
      '运行应用，读取录音并整理输入。',
      reason?'运行软件报告不兼容情况，不启动模型计算。':route==='cloud'?'检查调用条件，组织服务请求。':mixed?'运行推理软件，把不同运算安排给 NPU 与 CPU。':'运行推理软件，安排模型的执行方式。',
      route==='cloud'?'运行应用与网络软件，安排输入上传。':route==='cpu'?'运行软件，为本机计算准备输入与参数。':'运行后端与驱动，安排数据访问和设备任务。',
      mixed?'执行分配给 CPU 的模型运算，并协调与 NPU 的结果交接。':route==='cpu'?'同时承担应用逻辑与模型计算。':route==='cloud'?'运行应用、处理界面与服务响应；也可执行其他就绪任务。':'运行应用并处理设备完成通知；也可执行其他就绪任务。',
      '运行应用，接收和展示结果，发起文件保存。',
    ];
    el('ai-cpu-role').textContent=cpuRoles[step];
    el('ai-step-count').textContent=`${step+1} / 5`;el('ai-prev').disabled=step===0;el('ai-next').disabled=step===(reason?1:4);
    const states=['host','dispatch','compute','output'],active=step===0?'host':step===1?'dispatch':step===4?'output':'compute';
    const labels=[['本机应用 / CPU','录音与模型输入'],[route==='cloud'?'服务接口':'运行时 / 后端',reason&&step===1?'提交被阻止':mixed?'NPU 部分 + CPU 部分':'安排执行'],[route==='cloud'?'远程服务':mixed?'NPU ＋ CPU':routes[route],step<2?'等待提交':step===2?'准备可访问的数据':step===3?'执行模型运算':'计算结果已返回'],['本机应用 / CPU',step===4?'保存草稿，等待核对':'等待计算结果']];
    el('ai-execution-map').dataset.step=String(step);el('ai-execution-map').dataset.blocked=String(Boolean(reason&&step===1));
    el('ai-execution-map').innerHTML=`<p class="ai-map-caption">${route==='cloud'?'虚线框表示远程服务；进入该框意味着数据离开本机。':'本机执行路线；同一应用出现在流程两端，框表示职责而非独立机器。'}</p><div class="ai-execution-nodes">${labels.map(([name,description],i)=>`${i?`<span class="ai-arrow" aria-hidden="true">${reason&&step===1&&i===2?'×':'→'}</span>`:''}<div class="ai-exec-node ${active===states[i]?'is-current':''} ${i===2&&route==='cloud'?'is-remote':''} ${reason&&step===1&&i===1?'is-blocked':''}" data-node="${states[i]}">${mixed&&i===2?'<div class="ai-device-split"><b>NPU<small>受支持运算</small></b><span aria-hidden="true">⇄</span><b>CPU<small>补充运算</small></b></div>':`<strong>${name}</strong>`}<span>${description}</span></div>`).join('')}</div>`;
    el('ai-route-result-title').textContent=reason?'没有可执行的安排，就不能开始模型计算':mixed?'NPU 与 CPU 分担不同的模型运算':route==='cloud'?'计算交给远程服务，任务仍由本机应用发起':route==='cpu'?'应用逻辑与模型计算都由本机 CPU 承担':`模型计算交给${routes[route]}，应用仍在 CPU 上运行`;
    const takeaways={cpu:'输入、参数和结果都在本机。CPU 运行应用和推理软件，也完成模型计算；这些工作由操作系统调度，并与其他程序分享资源。',gpu:'GPU 执行适合它的模型运算，CPU 上的软件负责准备数据、提交工作和接收结果。两者通过可访问的存储区域交换数据，具体方式取决于设备。',npu:'NPU 执行设备支持的运算；CPU 运行应用、推理软件和相关驱动，组织输入输出及执行顺序。模型是否兼容，决定了计算能否按这条路线进行。',cloud:'本机应用上传获准的输入，服务端管理模型并执行计算，再把结果返回。本机 CPU 继续承担应用交互、请求组织与结果保存；云端服务的内部处理器由服务端决定。'};
    el('ai-route-result-copy').textContent=reason?'CPU 上的运行软件发现 NPU 不支持某项运算，于是停止提交。已有硬件并不足够，还需要兼容的模型或明确配置的其他执行方式。':mixed?'CPU 既组织应用和推理流程，也执行 NPU 无法承担的指定运算。两种设备之间还要交接中间结果、满足先后依赖，不能只把整个模型标成“在 NPU 上运行”。':takeaways[route];
  }
  function paintLevel() {
    const l=levels[level];pressed('data-level',level);el('ai-level-status').textContent=l.status;el('ai-level-title').textContent=l.title;
    el('ai-level-lead').innerHTML=l.paragraphs.map(p=>`<p>${p}</p>`).join('');
    el('ai-system-path').innerHTML=flow(l.path.map(p=>`<strong>${p}</strong>`))+(level==='agent'?'<p class="ai-loop-note">↶ 工具结果回到模型，可能触发下一次行动；不是固定只走一次。</p>':'');
    el('ai-level-outcome').innerHTML=l.takeaway;el('ai-level-source').innerHTML=source(l.source);
  }
  function paintFuture() {
    const f=futures[future];pressed('data-future',future);
    for(const [id,key] of [['ai-foundation','foundation'],['ai-bridge','bridge'],['ai-bridge-title','bridgeTitle'],['ai-idea','idea'],['ai-idea-title','ideaTitle'],['ai-gap','gap'],['ai-gap-title','gapTitle']]) el(id).textContent=f[key];
    el('ai-future-source').innerHTML=source(f.source);el('ai-change-plan').textContent=f.action;el('ai-change-plan').disabled=changed;el('ai-reset-plan').disabled=!changed;
    const statuses=!changed?['使用网络','仅用本机问卷','等待统计结果','只生成草稿']:future==='goal'?['建议推迟补充','建议优先完成','保留核心图表','缩小范围，等待确认']:future==='hybrid'?['网络中断，暂停','本机部分可继续','仍需等待统计','公开资料尚有缺口']:['问卷权限变化不影响此项','新的问卷读取被拒绝','等待数据处理决定','已有草稿需单独处理'];
    el('ai-plan').dataset.changed=String(changed);el('ai-plan').innerHTML=['公开资料检索','问卷统计','图表制作','报告整理'].map((name,i)=>`<div class="ai-plan-task ${changed?'is-changed':''}"><strong>${name}</strong><span>${statuses[i]}</span></div>`).join('');
    el('ai-plan-outcome').textContent=changed?f.after:f.before;
  }
  const tabIds=chapters.map(c=>c[0]);
  function showTab(id,navigate=false,focus=false) {
    if(!tabIds.includes(id)) return;
    tabIds.forEach(name=>{el(name).hidden=name!==id;el(`tab-${name}`).setAttribute('aria-selected',String(name===id));el(`tab-${name}`).tabIndex=name===id?0:-1;});
    if(navigate&&location.hash!==`#${id}`) history.pushState({chapter:id},'',`#${id}`);
    if(focus) {el(`tab-${id}`).focus({preventScroll:true});root.querySelector('.ai-tabs').scrollIntoView({block:'start'});}
  }
  root.addEventListener('click',event=>{
    if(event.target.closest('.site-footer a')) {
      event.preventDefault();
      const chapter=root.querySelector('[data-tab][aria-selected="true"]').dataset.tab;
      if(location.hash!=='#top') history.pushState({chapter},'','#top');
      window.scrollTo({top:0,behavior:'instant'});
      return;
    }
    const b=event.target.closest('button');if(!b) return;
    if(b.dataset.tab) showTab(b.dataset.tab,true);
    if(b.dataset.go) showTab(b.dataset.go,true,true);
    if(b.dataset.mode) {mode=b.dataset.mode;paintModel();}
    if(b.dataset.input) {input=Number(b.dataset.input);paintMath();}
    if(b.dataset.chip) {chip=b.dataset.chip;tpuStep=0;paintChip();}
    if(b.dataset.route) {route=b.dataset.route;step=0;paintJourney();}
    if(b.dataset.level) {level=b.dataset.level;paintLevel();}
    if(b.dataset.future) {future=b.dataset.future;changed=false;paintFuture();}
    if(b.id==='ai-tpu-next') {tpuStep=Math.min(2,tpuStep+1);paintChip();(el('ai-tpu-next').disabled?el('ai-tpu-reset'):el('ai-tpu-next')).focus();}
    if(b.id==='ai-tpu-reset') {tpuStep=0;paintChip();el('ai-tpu-reset').focus();}
    if(b.id==='ai-next') {step=Math.min(step+1,blocker(npuConfiguration())?1:4);paintJourney();}
    if(b.id==='ai-prev') {step=Math.max(0,step-1);paintJourney();}
    if(b.id==='ai-reset') {step=0;paintJourney();}
    if(b.id==='ai-change-plan') {changed=true;paintFuture();el('ai-reset-plan').focus();}
    if(b.id==='ai-reset-plan') {changed=false;paintFuture();el('ai-change-plan').focus();}
    if(b.dataset.term) {const t=terms[b.dataset.term];el('ai-term-title').textContent=t.name;el('ai-term-text').textContent=t.text;el('ai-term-example').textContent=t.example;root.querySelector('.ai-glossary').showModal();}
    if(b.id==='ai-term-close') root.querySelector('.ai-glossary').close();
  });
  root.addEventListener('change',event=>{if(event.target.closest('#journey')) {step=0;paintJourney();}});
  root.querySelector('.ai-tabs').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();const current=tabIds.indexOf(event.target.dataset.tab);const index=event.key==='Home'?0:event.key==='End'?tabIds.length-1:(current+(event.key==='ArrowRight'?1:tabIds.length-1))%tabIds.length;
    showTab(tabIds[index],true);el(`tab-${tabIds[index]}`).focus();
  });
  function fromHash() {const id=location.hash.slice(1);showTab(tabIds.includes(id)?id:id==='top'?(history.state?.chapter||'task'):'task');}
  addEventListener('hashchange',fromHash);addEventListener('popstate',fromHash);
  showTab('task');fromHash();paintModel();paintMath();paintChip();paintJourney();paintLevel();paintFuture();
})();
