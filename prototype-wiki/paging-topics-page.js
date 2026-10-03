function tlbReuseDiagram() {
  return `<p class="pt-copy">页大小为 4。VA 6 和 VA 7 都在虚拟页 1，变化的只是页内偏移。因此，第二次访问能复用的是<strong>页 1 → 框 3</strong>，不是第一次的数据，也不是完整地址。</p>
    <figure class="tl-reuse"><figcaption>同一页框映射，不同偏移对应不同物理地址</figcaption><div class="tl-address-pair">${[6, 7].map(address => `<div><strong>VA ${address}</strong><span class="tl-page-part">页号 1</span><span class="tl-offset-part">偏移 ${address % 4}</span><span aria-hidden="true">→</span><span>框 3 × 4 + ${address % 4}</span><strong>PA ${12 + address % 4}</strong></div>`).join('')}</div><p class="tl-shared-mapping"><span>TLB 中的一条转换</span><strong>虚拟页 1 → 物理框 3</strong><span>不保存这两次访问各自的偏移或数据内容</span></p></figure>
    <div class="tl-comparison"><section><h3>不使用 TLB</h3><div class="tl-cost-row"><strong>VA 6</strong><span>读页 1 的表项</span><span aria-hidden="true">→</span><span>访问 PA 14</span></div><div class="tl-cost-row"><strong>VA 7</strong><span>再读页 1 的表项</span><span aria-hidden="true">→</span><span>访问 PA 15</span></div><p>两次查表，两次目标数据访问。</p></section><section><h3>使用 TLB · 从空缓存开始</h3><div class="tl-cost-row"><strong>VA 6</strong><span>未命中 → 查表并缓存</span><span aria-hidden="true">→</span><span>访问 PA 14</span></div><div class="tl-cost-row tl-saved"><strong>VA 7</strong><span>命中 → 直接得到框 3</span><span aria-hidden="true">→</span><span>访问 PA 15</span></div><p><strong>第二次不再读页表</strong>，但仍访问目标数据。</p></section></div><p class="pt-caption">表项读取与目标数据访问是不同操作，TLB 查询本身也有成本。操作次数不能直接换算为耗时，阶段数量和线条长度也不是时间刻度。</p>
    <div class="pt-access-strip" role="img" aria-label="访问序列：VA6页1，VA7页1，VA10页2，VA6页1，VA0页0，VA10页2">${[6, 7, 10, 6, 0, 10].map((address, index) => `<div data-access="${index}"><strong>VA ${address}</strong><span>页 ${Math.floor(address / 4)}</span></div>`).join('')}</div>`;
}

function tlbWalk(frame, steps) {
  const mapping = [5, 3, 6, 1];
  const checked = steps.some(item => item.label === 'TLB 命中' || item.label === 'TLB 未命中');
  const hit = steps.some(item => item.label === 'TLB 命中');
  const read = steps.some(item => item.table);
  const fill = steps.find(item => item.label === '填入 TLB');
  const pfn = hit || read ? mapping[frame.vpn] : undefined;
  const recency = entries => [...entries].sort((first, second) => first.used - second.used).map(entry => `<span>页 ${entry.vpn}<small>第 ${entry.used + 1} 次</small></span>`).join('<span aria-hidden="true">→</span>');
  const cacheRows = Array.from({length: 2}, (_, index) => {
    const entry = frame.entries[index];
    return `<tr${entry ? ` data-tl-cache="${entry.vpn}"` : ''}${entry && checked && entry.vpn === frame.vpn ? ' class="pt-active"' : ''}><th scope="row">${entry ? `页 ${entry.vpn}` : '空位'}</th><td>${entry ? `框 ${entry.pfn}` : '—'}</td><td>${entry ? `第 ${entry.used + 1} 次` : '—'}</td></tr>`;
  }).join('');
  const decision = !checked ? '用本次页号匹配缓存条目；偏移不参与页号匹配。' : hit ? `页 ${frame.vpn} 命中：取出框 ${pfn}，本次不读取页表。` : !fill ? read ? `页表已给出页 ${frame.vpn} → 框 ${pfn}；缓存尚未填入。` : `没有页 ${frame.vpn} 的转换，需要查页表；不是缺页。` : fill.evicted === null ? `填入页 ${frame.vpn} → 框 ${pfn}；有空位，无需替换。` : `移出页 ${fill.evicted} 的缓存条目，填入页 ${frame.vpn} → 框 ${pfn}。页表映射和物理页面均未改变。`;
  const before = fill && fill.evicted !== null ? `<div class="tl-before"><span>替换前 · 从较久到较近</span><div class="tl-recency">${recency(steps[0].entries)}</div><p>页 ${fill.evicted} 上次使用更早，因此被替换。</p></div>` : '';
  const physical = pfn === undefined ? '<div class="tl-wait">先得到页框号，才能结合本次偏移定位目标数据。</div>' : `<p class="st-frame-base">框 ${pfn} · 起点 ${pfn * 4}</p><div class="st-offsets">${Array.from({length: 4}, (_, offset) => `<div${frame.physical !== null && offset === frame.offset ? ' class="st-selected-offset st-data-complete"' : ''}><span>偏移 ${offset}</span><strong>${frame.physical !== null && offset === frame.offset ? `PA ${frame.physical}` : '—'}</strong></div>`).join('')}</div><p class="st-equation">${pfn} × 4 + ${frame.offset}${frame.physical === null ? ' · 保留本次偏移' : ` = ${frame.physical}`}</p><p class="st-data-state">${frame.physical === null ? '转换已取得；尚未访问目标数据' : '目标数据访问完成'}</p>`;
  return `<div class="tl-walk"><svg class="tl-route" aria-hidden="true"></svg><section class="tl-node tl-cache"><p class="st-node-kicker">处理器侧 / 按页号匹配</p><h3 class="tl-cache-anchor">TLB · 最多两条转换</h3><p class="tl-status${checked && !hit ? ' tl-miss' : ''}">${!checked ? '尚未查询' : hit ? '命中 · 页表绕过' : fill ? '未命中 · 转换已填入' : '未命中 · 转向页表'}</p><table class="pt-table" aria-label="TLB 转换缓存"><thead><tr><th scope="col">页号</th><th scope="col">页框</th><th scope="col">上次访问</th></tr></thead><tbody>${cacheRows}</tbody></table><div class="tl-decision">${decision}</div>${before}<div class="tl-order"><span>当前缓存 · 较久 → 较近</span><div class="tl-recency">${frame.entries.length ? recency(frame.entries) : '<span>空缓存</span>'}</div></div></section><section class="tl-node tl-page-table${hit ? ' tl-bypassed' : ''}"><p class="st-node-kicker">物理内存 / 固定单级页表</p><h3 class="tl-table-anchor">页表 · 四条映射</h3><p class="tl-status">${hit ? '本次绕过 · 0 次表项读取' : read ? '本次已读取 1 个表项' : checked ? '等待读取本次表项' : '仅在未命中后读取'}</p><table class="pt-table" aria-label="固定页表映射"><thead><tr><th scope="col">虚拟页</th><th scope="col">物理页框</th></tr></thead><tbody>${mapping.map((entry, vpn) => `<tr data-tl-table="${vpn}"${read && vpn === frame.vpn ? ' class="pt-active"' : ''}><th scope="row">页 ${vpn}</th><td>框 ${entry}</td></tr>`).join('')}</tbody></table><p class="tl-table-note">${hit ? '页表映射仍有效；本次命中 TLB，无须读取表项。' : 'TLB 替换缓存转换，不改变页表映射或物理页面。'}</p></section><section class="tl-node tl-data"><p class="st-node-kicker">物理内存 / 目标数据</p><h3 class="tl-data-anchor">${pfn === undefined ? '目标页框尚未确定' : `物理页框 ${pfn}`}</h3><p class="tl-status">本次偏移 ${frame.offset} · 不从 TLB 取偏移</p>${physical}</section></div>`;
}

function smallTableSpaceDiagram() {
  const mapped = [0, 1, 62, 63];
  const groups = Array.from({length: 8}, (_, directory) => {
    const cells = Array.from({length: 8}, (_, index) => {
      const vpn = directory * 8 + index;
      return `<span class="st-entry${mapped.includes(vpn) ? ' st-mapped' : ''}" title="虚拟页 ${vpn}：${mapped.includes(vpn) ? '已映射' : '未映射'}"></span>`;
    }).join('');
    return `<div class="st-group"><span>页 ${directory * 8}–${directory * 8 + 7}</span><div class="st-eight">${cells}</div><small>${directory === 0 || directory === 7 ? '2 项已映射' : '8 项均未映射'}</small></div>`;
  }).join('');
  return `<p class="pt-copy">这个进程只映射页 0、1、62、63。先把 64 个虚拟页按每组 8 页分开：中间六组没有任何映射，但线性页表仍为它们保留表项。</p>
    <figure class="st-space"><figcaption><strong>线性页表：八组都要占位置</strong><span>每个小格是一个表项，不是数据页；绿色为已映射，灰色为未映射。</span></figcaption><div class="st-linear" role="img" aria-label="64个等大的表项，分为8组，每组8项，仅页0、1、62、63已映射">${groups}</div><p class="st-total">64 个表项 × 2 单位 = <strong>128 单位</strong></p></figure>
    <div class="st-transform"><span aria-hidden="true">↓</span><p>把每组独立为一张下级表，再用一个目录项记录它的位置。<strong>整组未映射时，只留目录项，不分配下级表。</strong></p></div>
    <figure class="st-space"><figcaption><strong>两级页表：目录保留八项，下级表只建两张</strong><span>目录项指向下级表，不直接指向数据页框。</span></figcaption><div class="st-branches">${Array.from({length: 8}, (_, directory) => `<div class="st-branch${directory === 0 || directory === 7 ? ' st-present' : ''}"><div class="st-directory-item"><span>目录 ${directory}</span><strong>${directory === 0 || directory === 7 ? `指向表 ${directory}` : '未配置'}</strong></div><span class="st-branch-link" aria-hidden="true">${directory === 0 || directory === 7 ? '↓' : '·'}</span><div class="st-leaf-allocation">${directory === 0 || directory === 7 ? `<strong>下级表 ${directory}</strong><div class="st-eight">${Array.from({length: 8}, (_, index) => `<span class="st-entry${mapped.includes(directory * 8 + index) ? ' st-mapped' : ''}"></span>`).join('')}</div><span>8 项 · 16 单位</span>` : '<span>不建表</span><small>省去 8 项</small>'}</div></div>`).join('')}</div></figure>
    <div class="st-account"><div><span>目录 · 8 项</span><strong>16 单位</strong></div><span aria-hidden="true">+</span><div><span>下级表 0 · 8 项</span><strong>16 单位</strong></div><span aria-hidden="true">+</span><div><span>下级表 7 · 8 项</span><strong>16 单位</strong></div><span aria-hidden="true">=</span><div><span>页表总存储</span><strong>48 单位</strong></div></div>
    <p class="st-saving">省去六张下级表：6 × 16 = 96；新增目录：16。净节省 <strong>96 − 16 = 80 单位</strong>。</p><p class="pt-caption">两张已建表仍各有 8 项，包括其中未映射的条目。48 与 128 单位均为页表结构的存储量，不包含目标数据页；省去下级表不需要搬动数据。</p>`;
}

function smallTableWalk(frame, mapping) {
  const allocated = frame.directory === 0 || frame.directory === 7;
  const pfn = frame.activeLeaf ? mapping[frame.vpn] : undefined;
  const blocked = (frame.activeDirectory && !allocated) || (frame.activeLeaf && pfn === undefined);
  const leafTitle = frame.activeDirectory ? allocated ? `下级表 ${frame.directory}` : '未建立下级表' : '下级表位置待定';
  const frameTitle = pfn !== undefined ? `物理页框 ${pfn}` : blocked ? '本次不能生成物理地址' : '数据页框待定';
  const directoryRows = Array.from({length: 8}, (_, directory) => `<tr data-st-directory="${directory}"${frame.activeDirectory && directory === frame.directory ? ` class="pt-active${allocated ? '' : ' st-blocked'}"` : ''}><th scope="row">${directory}</th><td>${directory === 0 || directory === 7 ? `→ 下级表 ${directory}` : '未配置'}</td></tr>`).join('');
  const leafRows = Array.from({length: 8}, (_, leaf) => {
    const vpn = frame.directory * 8 + leaf;
    return `<tr data-st-leaf="${leaf}"${frame.activeLeaf && leaf === frame.leaf ? ` class="pt-active${pfn === undefined ? ' st-blocked' : ''}"` : ''}><th scope="row">${leaf}<small>虚拟页 ${vpn}</small></th><td>${mapping[vpn] === undefined ? '未映射' : `框 ${mapping[vpn]}`}</td></tr>`;
  }).join('');
  const leaf = !frame.activeDirectory ? '<div class="st-wait">先读取目录项，才能知道下级表在哪里。</div>' : !allocated ? `<div class="st-wait st-stop"><strong>目录 ${frame.directory} 未配置</strong><span>没有这张下级表，路径在目录停止。</span></div>` : `<table class="pt-table" aria-label="下级表 ${frame.directory}"><thead><tr><th scope="col">表内索引</th><th scope="col">数据页框</th></tr></thead><tbody>${leafRows}</tbody></table>`;
  const physical = pfn === undefined ? `<div class="st-wait${blocked ? ' st-stop' : ''}">${blocked ? frame.activeLeaf ? '<strong>条目未映射</strong><span>没有页框映射，路径在下级表停止。</span>' : '路径在目录停止；不读取下级表或目标数据。' : '等待读取下级表项，不预先给出目标页框。'}</div>` : `<p class="st-frame-base">框 ${pfn} · 起点 ${pfn * 4}</p><div class="st-offsets">${Array.from({length: 4}, (_, offset) => `<div class="${frame.physical !== null && offset === frame.offset ? `st-selected-offset${frame.dataAccess ? ' st-data-complete' : ''}` : ''}"><span>偏移 ${offset}</span><strong>${frame.physical !== null && offset === frame.offset ? `PA ${frame.physical}` : '—'}</strong></div>`).join('')}</div><p class="st-equation">${frame.physical === null ? `保留偏移 ${frame.offset}，下一步计算地址。` : `${pfn} × 4 + ${frame.offset} = ${frame.physical}`}</p><p class="st-data-state">${frame.dataAccess ? '目标数据访问完成' : '尚未访问目标数据'}</p>`;
  return `<div class="st-walk"><svg class="st-route" aria-hidden="true"></svg><section class="st-node st-node-directory"><p class="st-node-kicker">第一层 / 目录索引 ${frame.directory}</p><h3>目录 · 8 项</h3><table class="pt-table" aria-label="页目录"><thead><tr><th scope="col">索引</th><th scope="col">指向哪里</th></tr></thead><tbody>${directoryRows}</tbody></table></section><section class="st-node st-node-leaf"><p class="st-node-kicker">第二层 / 表内索引 ${frame.leaf}</p><h3 class="st-leaf-anchor">${leafTitle}</h3>${leaf}</section><section class="st-node st-node-frame"><p class="st-node-kicker">目标数据 / 偏移 ${frame.offset} 不变</p><h3 class="st-frame-anchor">${frameTitle}</h3>${physical}</section></div>`;
}

function renderPagingTopic(root, topic) {
  const tlb = topic === 'tlb';
  const title = tlb ? 'TLB 与快速地址转换' : '多级页表的组织与空间成本';
  const intro = tlb ? 'TLB 缓存虚拟页到物理页框的映射，不缓存页面内容。' : '虚拟地址分布稀疏时，可以省去没有映射的下级页表。';
  root.innerHTML = `<div class="page rr-page pt-page${tlb ? ' tl-page' : ' st-page'}" id="top">${wikiHeader(topic, [{href: '#why', title: tlb ? '转换复用' : '稀疏表存储'}, {href: '#demo', title: tlb ? '查询与回填' : '逐级地址转换'}, {href: '#limits', title: tlb ? '转换缓存与缺页' : '存储与查找成本'}])}<main>
    <section class="intro"><p class="eyebrow">内存虚拟化 / ${tlb ? '转换效率' : '页表组织'}</p><h1>${title}<span>${tlb ? 'TLBs' : 'Smaller Tables'}</span></h1><p class="lead">${intro}</p><p class="definition">${tlb ? 'TLB 是处理器中的地址转换缓存，保存虚拟页到物理页框的映射及相关权限。查询找到可用条目称为命中，可以直接取得转换；找不到称为未命中，需要继续查页表。取得物理地址后，仍要访问目标指令或数据。' : '页表项是记录一个虚拟页映射和属性的条目。线性页表为每个虚拟页预留表项，包括没有映射的页。多级页表则把表项分组：目录记录各组下级表的位置，下级表再记录数据页框。整组没有映射时，可以保留目录项而不分配下级表。'}</p><p class="model-note">${tlb ? '单个进程，页大小为 4 个示意单位，页 0/1/2/3 → 框 5/3/6/1，所有页均在物理内存且允许访问。TLB 初始为空，容量为 2；任意位置可保存任意页的转换，这称为全相联。LRU 淘汰最久未使用的条目；未命中由硬件读取单级页表并填入。表项读取与目标数据访问分别计数，次数不等于耗时。' : '8 位虚拟地址，页大小为 4 个示意单位，共 64 页。目录与下级表各 8 项，每项 2 存储单位；仅页 0/1/62/63 映射到数据框 5/3/6/1，且均驻留、允许访问。转换逐级读取表项，不计缓存命中；页表存储单独计量，数据框号表示目标页面的位置。'}</p></section>
    <section class="rr-rules" id="why"><p class="section-index">01 / THE COST</p><h2>${tlb ? '同一虚拟页内的访问如何复用页号映射' : '稀疏地址空间中哪些下级页表无需建立'}</h2>${tlb ? tlbReuseDiagram() : smallTableSpaceDiagram()}</section>
    <section class="rr-rules pt-section" id="demo"><div class="section-heading"><div><p class="section-index">02 / FOLLOW ONE ACCESS</p><h2>${tlb ? 'TLB 查询、页表读取与转换回填' : '先找下级表，再找数据页框'}</h2></div></div><div class="rr-toolbar pt-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button class="icon-button primary" id="pt-play" type="button" aria-label="播放" title="播放" aria-pressed="false">▶</button><button class="icon-button" id="pt-next" type="button" aria-label="下一阶段" title="下一阶段">↦</button><button class="icon-button" id="pt-reset" type="button" aria-label="重新开始" title="重新开始">↺</button></div><label>播放速度<select id="pt-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label>${tlb ? '' : '<label>虚拟地址<input id="pt-address" type="number" min="0" max="255" step="1" value="6" aria-describedby="pt-input-note pt-error"></label><label>示例<select id="pt-preset"><option value="6">页 1 · 已映射</option><option value="254">页 63 · 已映射</option><option value="32">目录未配置</option><option value="28">表内条目未映射</option><option value="custom">自选地址</option></select></label>'}</div>${tlb ? '' : '<p class="pt-caption" id="pt-input-note">本例采用 8 位虚拟地址，数值范围为 0–255。未映射可能发生在目录项，也可能发生在下级表项。</p>'}<p id="pt-error" role="alert" hidden></p>
    <div id="pt-content"><div class="pt-workbench"><div class="pt-view"><div id="pt-address-view"></div><div id="pt-tables"></div><dl class="pt-metrics" id="pt-metrics"></dl></div><aside class="pt-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="pt-stage"></p><h3 id="pt-event-title"></h3><p id="pt-event-text"></p><p class="pt-result" id="pt-result"></p></aside></div><input id="pt-position" type="range" min="0" value="0" step="1" aria-label="演示阶段"><p class="pt-caption" id="pt-summary"></p></div></section>
    <section class="rr-rules pt-section" id="limits"><p class="section-index">03 / KEEP THE DISTINCTIONS</p><h2>${tlb ? 'TLB 未命中不等于目标页不在物理内存' : '减少页表存储，不保证地址转换更快'}</h2><div class="pt-notes">${tlb ? '<article><h3>TLB 未命中 ≠ 缺页</h3><p>前者表示转换没有在缓存中找到；查页表仍可能得到已驻留页框。后者涉及页面未驻留或其他需处理的映射、权限问题。六次访问涉及的页面均已驻留，缓存未命中后仍能查表获得映射。</p></article><article><h3>替换条目 ≠ 淘汰数据页</h3><p>TLB 容量有限，LRU 替换最久未被使用的转换。被替换页仍在物理内存；下次访问只是需要重新查页表。</p></article><article><h3>地址空间切换与转换缓存</h3><p>相同虚拟页号在不同进程中可能对应不同页框。系统可以使相关缓存条目失效，也可以用地址空间标识 ASID 区分条目的所属空间。页表映射变化后，相关缓存转换也必须更新或失效，避免继续使用旧映射。</p></article>' : '<article><h3>稀疏映射与下级页表的存储需求</h3><p>若 8 张下级表全部需要创建，两级结构占 16 + 8 × 16 = 144，反而超过线性表的 128。是否节省取决于地址空间的使用分布，而不是层数越多越好。</p></article><article><h3>无缓存时，两级转换比单级多读一次表项</h3><p>无缓存时，两级转换读两次表项，再访问数据；单级只读一次表项。TLB（地址转换缓存）可缓存最终转换，使命中访问绕过遍历。真实性能还受页表遍历缓存等机制影响。</p></article><article><h3>未映射 ≠ 可载入</h3><p>未配置的虚拟页没有映射，不自动视为磁盘中的合法页面。OS 必须结合地址空间信息判断能否处理；不能把所有转换失败都解释成载入后重试。</p></article>'}</div>${tlb ? '<p class="pt-copy">六次访问中有两次命中，命中率为 2/6。访存操作次数不能直接换算为耗时或性能倍数；TLB 查询本身也有成本。</p>' : '<p class="pt-copy">更大页可减少表项数，却可能增加内部浪费；分段与分页组合、反向页表等也有各自取舍。页表的层数、索引位数与表项格式随体系结构变化。</p>'}</section>${wikiRelated(topic)}</main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;
  let frames = tlb ? OSLabPagingTopics.buildTlbStory() : OSLabPagingTopics.buildSmallTableStory();
  let stage = 0;
  let valid = true;
  let timer = null;
  const playButton = root.querySelector('#pt-play');
  const position = root.querySelector('#pt-position');
  const speed = root.querySelector('#pt-speed');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let currentFrame = null;
  if (tlb) {
    const accesses = root.querySelector('.pt-access-strip');
    accesses.setAttribute('role', 'group');
    accesses.setAttribute('aria-label', '访问序列');
    accesses.innerHTML = [6, 7, 10, 6, 0, 10].map((address, index) => `<button type="button" data-access="${index}"><small>第 ${index + 1} 次</small><strong>VA ${address}</strong><span>页 ${Math.floor(address / 4)} · 偏移 ${address % 4}</span><small class="tl-access-state">未访问</small></button>`).join('');
    root.querySelector('#pt-content').prepend(accesses);
    root.querySelector('.pt-workbench').insertAdjacentHTML('beforebegin', '<div class="tl-stages st-stages" id="tl-stages" role="group" aria-label="本次访问阶段"></div><p class="tl-route-note">实线：取得转换的路径；虚线：把页表转换填回 TLB。目标数据不经过 TLB。</p>');
  } else root.querySelector('.pt-workbench').insertAdjacentHTML('beforebegin', '<div class="st-stages" id="st-stages" role="group" aria-label="查找阶段"></div>');
  const cancel = () => root.querySelectorAll('.pt-tables, .st-walk, .tl-walk').forEach(node => node.getAnimations({subtree: true}).forEach(animation => animation.cancel()));
  const pause = () => { clearInterval(timer); timer = null; playButton.textContent = '▶'; playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; };
  const metric = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  const drawWalk = (animate = false) => {
    const diagram = root.querySelector('.st-walk');
    if (!diagram || !valid || !currentFrame) return;
    const svg = diagram.querySelector('.st-route');
    const bounds = diagram.getBoundingClientRect();
    const vertical = getComputedStyle(diagram).gridTemplateColumns.split(' ').length === 1;
    const connections = [];
    const connect = (source, target, name) => {
      if (!source || !target) return;
      const start = source.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      const sourceX = start.right - bounds.left + 3;
      const sourceY = start.top - bounds.top + start.height / 2;
      const targetX = (vertical ? end.right + 3 : end.left - 5) - bounds.left;
      const targetY = end.top - bounds.top + end.height / 2;
      const middleX = vertical ? bounds.width - 5 : (sourceX + targetX) / 2;
      connections.push({name, path: `M ${sourceX} ${sourceY} L ${middleX} ${sourceY} L ${middleX} ${targetY} L ${targetX} ${targetY}`});
    };
    if (currentFrame.activeDirectory && [0, 7].includes(currentFrame.directory)) connect(diagram.querySelector(`[data-st-directory="${currentFrame.directory}"]`), diagram.querySelector('.st-leaf-anchor'), 'directory');
    if (currentFrame.activeLeaf && [0, 1, 62, 63].includes(currentFrame.vpn)) connect(diagram.querySelector(`[data-st-leaf="${currentFrame.leaf}"]`), diagram.querySelector('.st-frame-anchor'), 'leaf');
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    svg.innerHTML = '<defs><marker id="st-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="currentColor"/></marker></defs>' + connections.map(connection => `<path data-st-path="${connection.name}" d="${connection.path}" fill="none" stroke="currentColor" stroke-width="2" marker-end="url(#st-arrow)"/>`).join('');
    const active = currentFrame.label === '读取目录项' ? 'directory' : currentFrame.label === '读取下级页表项' ? 'leaf' : null;
    const connection = connections.find(item => item.name === active);
    if (animate && !motion.matches && connection) {
      const token = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      token.setAttribute('r', '4');
      token.setAttribute('fill', 'currentColor');
      token.style.offsetPath = `path('${connection.path}')`;
      svg.append(token);
      const animation = token.animate([{offsetDistance: '0%'}, {offsetDistance: '100%'}], {duration: 550, easing: 'ease-in-out'});
      animation.onfinish = animation.oncancel = () => token.remove();
    }
  };
  const drawTlb = (animate = false) => {
    const diagram = root.querySelector('.tl-walk');
    if (!diagram || !currentFrame) return;
    const steps = frames.slice(0, stage + 1).filter(item => item.accessIndex === currentFrame.accessIndex);
    const hit = steps.some(item => item.label === 'TLB 命中');
    const miss = steps.some(item => item.label === 'TLB 未命中');
    const read = steps.some(item => item.table);
    const fill = steps.some(item => item.label === '填入 TLB');
    const bounds = diagram.getBoundingClientRect();
    const vertical = getComputedStyle(diagram).gridTemplateColumns.split(' ').length === 1;
    const connections = [];
    const connect = (source, target, name, color, bypass = false) => {
      const start = source.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      const reverse = !vertical && start.left > end.left;
      const sourceX = (reverse ? start.left - 3 : start.right + 3) - bounds.left;
      const sourceY = start.top - bounds.top + start.height / 2;
      const targetX = (vertical || reverse ? end.right + 3 : end.left - 5) - bounds.left;
      const targetY = end.top - bounds.top + end.height / 2;
      const middleX = vertical ? bounds.width - (name === 'fill' ? 14 : 6) : (sourceX + targetX) / 2;
      const path = bypass && !vertical ? `M ${sourceX} ${sourceY} L ${sourceX + 18} ${sourceY} L ${sourceX + 18} 6 L ${targetX - 18} 6 L ${targetX - 18} ${targetY} L ${targetX} ${targetY}` : `M ${sourceX} ${sourceY} L ${middleX} ${sourceY} L ${middleX} ${targetY} L ${targetX} ${targetY}`;
      connections.push({name, color, path});
    };
    if (hit) connect(diagram.querySelector(`[data-tl-cache="${currentFrame.vpn}"]`), diagram.querySelector('.tl-data-anchor'), 'hit', '#126756', true);
    if (miss) connect(diagram.querySelector('.tl-cache-anchor'), diagram.querySelector('.tl-table-anchor'), 'miss', '#965520');
    if (read) connect(diagram.querySelector(`[data-tl-table="${currentFrame.vpn}"]`), diagram.querySelector('.tl-data-anchor'), 'read', '#385974');
    if (fill) connect(diagram.querySelector(`[data-tl-table="${currentFrame.vpn}"]`), diagram.querySelector(`[data-tl-cache="${currentFrame.vpn}"]`), 'fill', '#126756');
    const svg = diagram.querySelector('.tl-route');
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    svg.innerHTML = connections.map(connection => `<defs><marker id="tl-arrow-${connection.name}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="${connection.color}"/></marker></defs><path data-tl-path="${connection.name}" d="${connection.path}" fill="none" stroke="${connection.color}" stroke-width="2"${connection.name === 'fill' ? ' stroke-dasharray="4 4"' : ''} marker-end="url(#tl-arrow-${connection.name})"/>`).join('');
    const active = {'TLB 命中': 'hit', 'TLB 未命中': 'miss', '读取页表': 'read', '填入 TLB': 'fill'}[currentFrame.label];
    const connection = connections.find(item => item.name === active);
    if (animate && !motion.matches && connection) {
      const token = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      token.setAttribute('r', '4');
      token.setAttribute('fill', connection.color);
      token.style.offsetPath = `path('${connection.path}')`;
      svg.append(token);
      const animation = token.animate([{offsetDistance: '0%'}, {offsetDistance: '100%'}], {duration: 550, easing: 'ease-in-out'});
      animation.onfinish = animation.oncancel = () => token.remove();
    }
  };
  const paint = () => {
    cancel();
    playButton.disabled = !valid || stage === frames.length - 1;
    root.querySelector('#pt-next').disabled = playButton.disabled;
    position.disabled = !valid;
    root.querySelector('#pt-content').hidden = !valid;
    if (!valid) return;
    const frame = frames[stage];
    position.max = frames.length - 1;
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1} / ${frames.length}`);
    root.querySelector('#pt-stage').textContent = `阶段 ${stage + 1} / ${frames.length}${tlb ? ` · 第 ${frame.accessIndex + 1} 次访问` : ''}`;
    root.querySelector('#pt-event-title').textContent = frame.label;
    root.querySelector('#pt-event-text').textContent = frame.text;
    root.querySelector('#pt-result').textContent = frame.physical === null ? frame.outcome === 'unmapped' ? '停止 · 不生成物理地址' : '本次物理地址：尚未生成' : `本次物理地址：${frame.physical}${frame.dataAccess || tlb ? ' · 数据访问完成' : ' · 数据访问待完成'}`;
    root.querySelector('#pt-address-view').innerHTML = `<div class="pt-address"><strong>VA ${frame.address}</strong><span>虚拟页 ${frame.vpn}</span><span>偏移 ${frame.offset}</span></div>${tlb ? '' : `<div class="pt-bits" role="img" aria-label="目录索引 ${frame.directory}，下级表索引 ${frame.leaf}，偏移 ${frame.offset}"><span>${frame.directory.toString(2).padStart(3, '0')}<small>目录 ${frame.directory}</small></span><span>${frame.leaf.toString(2).padStart(3, '0')}<small>表内 ${frame.leaf}</small></span><span>${frame.offset.toString(2).padStart(2, '0')}<small>偏移 ${frame.offset}</small></span></div>`}`;
    let tables;
    if (tlb) {
      const steps = frames.slice(0, stage + 1).filter(item => item.accessIndex === frame.accessIndex);
      tables = tlbWalk(frame, steps);
      currentFrame = frame;
      const accessStart = frames.findIndex(item => item.accessIndex === frame.accessIndex);
      const accessFrames = frames.filter(item => item.accessIndex === frame.accessIndex);
      root.querySelector('#pt-stage').textContent = `第 ${frame.accessIndex + 1} 次访问 · 本次阶段 ${stage - accessStart + 1} / ${accessFrames.length}`;
      const stages = root.querySelector('#tl-stages');
      if (stages.dataset.accessIndex !== String(frame.accessIndex)) {
        stages.dataset.accessIndex = frame.accessIndex;
        stages.style.setProperty('--tl-stage-count', accessFrames.length);
        stages.innerHTML = accessFrames.map((item, index) => `<button type="button" data-tl-stage="${accessStart + index}" aria-pressed="false"><span>${index + 1}</span>${item.label}</button>`).join('');
      }
      stages.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.tlStage) === stage)));
      root.querySelectorAll('[data-access]').forEach(node => {
        const index = Number(node.dataset.access);
        node.setAttribute('aria-current', index === frame.accessIndex ? 'step' : 'false');
        const known = index < frame.accessIndex || index === frame.accessIndex && steps.length > 1;
        node.querySelector('.tl-access-state').textContent = known ? frames.some(item => item.accessIndex === index && item.label === 'TLB 命中') ? '命中' : '未命中' : index === frame.accessIndex ? '当前访问' : '未访问';
      });
      root.querySelector('#pt-metrics').innerHTML = metric('TLB 命中', frame.hits) + metric('TLB 未命中', frame.misses) + metric('表项读取', frame.tableReads) + metric('数据访问完成', frame.completed);
      const counts = frame.complete ? '六次访问完成：无 TLB 为 6 次表项读取 + 6 次数据访问 = 12；本例为 4 + 6 = 10。不计 TLB 查询，也不是耗时比较。' : '计数累计到当前阶段；表项读取和数据访问分开计。上次访问记录序号，不是时间；缓存满时替换序号最小的条目。';
      root.querySelector('#pt-summary').textContent = `${counts} 移动标记只说明取得或回填转换的路径，不表示数据搬移或实际延迟。`;
    } else {
      const mapping = {0: 5, 1: 3, 62: 6, 63: 1};
      tables = smallTableWalk(frame, mapping);
      currentFrame = frame;
      const stages = root.querySelector('#st-stages');
      if (stages.children.length !== frames.length) stages.innerHTML = frames.map((item, index) => `<button type="button" data-st-stage="${index}" aria-pressed="false"><span>${index + 1}</span>${item.label}</button>`).join('');
      stages.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.stStage) === stage)));
      root.querySelector('#pt-metrics').innerHTML = metric('页表存储', '48 单位') + metric('已读表项', frame.reads) + metric('数据访问', frame.dataAccess ? '完成' : '未完成');
      root.querySelector('#pt-summary').textContent = '目录项指向下级表，下级表项给出数据页框，偏移保留到最后。箭头表示已确定的指向关系，而不是搬动数据；查找一条转换路径，不会删除另一张已建下级表。阶段数量不代表实际耗时。';
    }
    root.querySelector('#pt-tables').innerHTML = tables;
    if (tlb) drawTlb(true);
    if (!tlb) drawWalk(true);
  };
  const advance = () => { stage = Math.min(stage + 1, frames.length - 1); if (stage === frames.length - 1) pause(); paint(); };
  const play = () => { playButton.textContent = 'Ⅱ'; playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; timer = setInterval(advance, Number(speed.value)); };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  root.querySelector('#pt-next').addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#pt-reset').addEventListener('click', () => { pause(); if (!valid) { root.querySelector('#pt-address').value = '6'; rebuild(); } else { stage = 0; paint(); } });
  position.addEventListener('input', () => { pause(); stage = Number(position.value); paint(); });
  speed.addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  const rebuild = () => {
    pause(); stage = 0;
    const input = root.querySelector('#pt-address');
    const address = Number(input.value);
    valid = input.value !== '' && Number.isInteger(address) && address >= 0 && address <= 255;
    input.setAttribute('aria-invalid', String(!valid));
    root.querySelector('#pt-error').hidden = valid;
    root.querySelector('#pt-error').textContent = valid ? '' : '请输入 0–255 的整数地址；无效输入不作为内存访问。';
    root.querySelector('#pt-preset').value = valid && [6, 254, 32, 28].includes(address) ? String(address) : 'custom';
    if (valid) frames = OSLabPagingTopics.buildSmallTableStory(address);
    paint();
  };
  if (tlb) {
    root.querySelector('.pt-access-strip').addEventListener('click', event => { const button = event.target.closest('[data-access]'); if (button) { pause(); stage = frames.findIndex(item => item.accessIndex === Number(button.dataset.access)); paint(); } });
    root.querySelector('#tl-stages').addEventListener('click', event => { const button = event.target.closest('[data-tl-stage]'); if (button) { pause(); stage = Number(button.dataset.tlStage); paint(); } });
    window.addEventListener('resize', () => drawTlb());
  } else {
    root.querySelector('#st-stages').addEventListener('click', event => { const button = event.target.closest('[data-st-stage]'); if (button) { pause(); stage = Number(button.dataset.stStage); paint(); } });
    window.addEventListener('resize', () => drawWalk());
    root.querySelector('#pt-address').addEventListener('input', rebuild);
    root.querySelector('#pt-preset').addEventListener('change', event => { if (event.target.value !== 'custom') { root.querySelector('#pt-address').value = event.target.value; rebuild(); } else { pause(); root.querySelector('#pt-address').focus(); } });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  motion.addEventListener('change', event => { if (event.matches) cancel(); });
  paint();
}

renderPagingTopic(document.getElementById('root'), document.body.dataset.topic);