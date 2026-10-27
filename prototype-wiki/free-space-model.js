const FREE_SPACE_POLICIES = Object.freeze({
  first: {title: 'First Fit', name: '首次适应', rule: '按地址从低到高，遇到第一个足够大的空闲块就停止。'},
  best: {title: 'Best Fit', name: '最佳适应', rule: '检查全部空闲块，选择能容纳请求的最小块。'},
  worst: {title: 'Worst Fit', name: '最差适应', rule: '检查全部空闲块，选择最大的空闲块。'},
});

function freeSpaceSnapshot(blocks, details) {
  const freeList = blocks.filter(block => block.owner === null).map(({start, size}) => ({start, size}));
  let run = 0;
  let largestRun = 0;
  for (const block of blocks) {
    run = block.owner === null ? run + block.size : 0;
    largestRun = Math.max(largestRun, run);
  }
  return structuredClone({
    blocks, freeList,
    totalFree: freeList.reduce((total, block) => total + block.size, 0),
    largestRun, largestEntry: Math.max(0, ...freeList.map(block => block.size)),
    inspected: [], selected: null, result: null, outcome: 'pending', ...details,
  });
}

function buildFreeSpaceStory() {
  let blocks = [{start: 0, size: 4, owner: null}, {start: 4, size: 4, owner: 'A'}, {start: 8, size: 4, owner: null}];
  const frames = [];
  const add = details => frames.push(freeSpaceSnapshot(blocks, {request: 6, ...details}));
  add({label: '查看布局', title: '总空闲 8，最大连续空闲只有 4', text: 'A 占据虚拟堆的 4–7。两侧空闲块各长 4，不能越过活对象 A 拼成连续的 6 单位。'});
  add({label: '申请失败', title: '请求连续 6 单位，但两个空闲块都只有 4 单位', text: '分配器逐项检查 [0, 4) 与 [8, 12)。没有足够大的块，布局保持不变；失败不是缺页，也不是地址转换错误。', inspected: [0, 8], outcome: 'failed'});
  blocks = blocks.map(block => block.owner === 'A' ? {...block, owner: null} : block);
  add({label: '释放 A', title: '对象 A 已释放，相邻空闲块尚未合并', text: '程序释放 A。此刻 0–11 已连续空闲，但列表还记录三个长度为 4 的块。释放不保证字节清零，也不表示物理页归还 OS。', outcome: 'released'});
  blocks = [{start: 0, size: 8, owner: null}, {start: 8, size: 4, owner: null}];
  add({label: '合并左邻', title: '左侧两块相邻，4 + 4 合并为 8', text: '起点 0、长度 4 的块，末端恰好是刚释放块的起点 4。更新空闲记录为 [0, 8)，不复制或搬动对象。', inspected: [0], selected: 0});
  blocks = [{start: 0, size: 12, owner: null}];
  add({label: '合并右邻', title: '再合并右邻，8 + 4 合并为 12', text: '合并后的块 [0, 8) 与右邻 [8, 12) 相接，更新为一个记录长度 12 的空闲表项。空闲总量仍是 12，改变的是记录方式。', inspected: [0], selected: 0});
  blocks = [{start: 0, size: 6, owner: 'N'}, {start: 6, size: 6, owner: null}];
  add({label: '重试并拆分', title: '从长度 12 的空闲块分配 6 单位，剩余 6 单位', text: '再次请求 6，分配器从块的低地址端分出 [0, 6) 给新对象 N，剩余 [6, 12) 留在空闲列表。A 已释放，不是被搬到别处。', outcome: 'success', result: {start: 0, size: 6}});
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

function buildFreeSpaceSelection(policy = 'first', request = 3) {
  if (!Object.hasOwn(FREE_SPACE_POLICIES, policy)) throw new Error('未知分配策略');
  if (!Number.isInteger(request) || request < 1 || request > 16) throw new Error('请求须为 1–16 的整数');
  let blocks = [
    {start: 0, size: 8, owner: null}, {start: 8, size: 2, owner: 'A'},
    {start: 10, size: 4, owner: null}, {start: 14, size: 2, owner: 'B'},
    {start: 16, size: 12, owner: null}, {start: 28, size: 4, owner: 'C'},
  ];
  const candidates = blocks.filter(block => block.owner === null);
  const frames = [];
  const inspected = [];
  let selected = null;
  const add = details => frames.push(freeSpaceSnapshot(blocks, {request, inspected, selected: selected?.start ?? null, ...details}));
  add({label: '开始搜索', title: `申请 ${request} 单位`, text: FREE_SPACE_POLICIES[policy].rule});
  for (const candidate of candidates) {
    inspected.push(candidate.start);
    const fits = candidate.size >= request;
    if (fits && (selected === null || policy === 'best' && candidate.size < selected.size || policy === 'worst' && candidate.size > selected.size)) selected = candidate;
    add({label: '检查空闲块', title: `起点 ${candidate.start}，长度 ${candidate.size}`, text: fits ? `长度 ${candidate.size} ≥ ${request}，可容纳请求。${policy === 'first' ? '这是第一个合适块，停止搜索。' : `当前候选：起点 ${selected.start}，长度 ${selected.size}；继续检查其余表项。`}` : `长度 ${candidate.size} < ${request}，不能容纳请求。`});
    if (fits && policy === 'first') break;
  }
  if (selected === null) {
    add({label: '申请失败', title: '没有足够大的空闲块', text: `总空闲 24，但最大连续块为 12，放不下连续的 ${request}。分配失败，不修改任何对象或空闲块。`, outcome: 'failed'});
  } else {
    add({label: '确定位置', title: `选择 [${selected.start}, ${selected.start + selected.size})`, text: `检查了 ${inspected.length} 个表项。${FREE_SPACE_POLICIES[policy].rule} 大小并列时选择低地址块；检查次数是搜索工作量，不等于实际耗时。`});
    const remainder = selected.size - request;
    blocks = blocks.flatMap(block => block.start !== selected.start ? [block] : [{start: block.start, size: request, owner: 'N'}, ...(remainder ? [{start: block.start + request, size: remainder, owner: null}] : [])]);
    add({label: remainder ? '分配并拆分' : '恰好用完', title: `N 获得 [${selected.start}, ${selected.start + request})`, text: remainder ? `选中的 ${selected.size} = 请求 ${request} + 剩余 ${remainder}。余块起点为 ${selected.start + request}；其他空闲块和活对象不变。` : `请求恰好用完整块，不创建长度为 0 的空闲表项。其他块不变。`, selected: null, outcome: 'success', result: {start: selected.start, size: request}});
  }
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

globalThis.OSLabFreeSpace = {policies: FREE_SPACE_POLICIES, buildStory: buildFreeSpaceStory, buildSelection: buildFreeSpaceSelection};
const FREE_SPACE_COMPARE_POLICIES=Object.freeze({
  first:FREE_SPACE_POLICIES.first,
  next:{title:'Next Fit',name:'循环首次适应',rule:'从上次分配结束的位置继续，必要时回到低地址；遇到足够大的块就停止。'},
  best:FREE_SPACE_POLICIES.best,
  worst:FREE_SPACE_POLICIES.worst,
});

function buildFreeSpaceComparison(requests=[3,12]){
  if(!Array.isArray(requests)||requests.length<1||requests.length>6||requests.some(n=>!Number.isInteger(n)||n<1||n>16))throw new Error('请输入 1–6 个请求，每个请求为 1–16 的整数');
  const initial=buildFreeSpaceSelection('first',3)[0].blocks;
  const rows=Object.fromEntries(Object.keys(FREE_SPACE_COMPARE_POLICIES).map(id=>[id,{blocks:structuredClone(initial),cursor:0,inspected:[],selected:null,current:null,checks:0,successes:0,failures:0,result:null,status:'pending'}]));
  const frames=[];
  const add=(requestIndex,phase,title,text)=>frames.push({requests:[...requests],requestIndex,request:requests[requestIndex],phase,title,text,rows:Object.fromEntries(Object.entries(rows).map(([id,row])=>[id,freeSpaceSnapshot(row.blocks,row)])),stage:frames.length});
  requests.forEach((request,requestIndex)=>{
    for(const row of Object.values(rows))Object.assign(row,{inspected:[],selected:null,current:null,result:null,status:'pending'});
    add(requestIndex,'request',`申请 ${request} 单位连续空间`,`第 ${requestIndex+1} 次请求。四组从各自当前的空闲列表中选块；先前分配成功的对象仍保留。`);
    const searches=Object.fromEntries(Object.entries(rows).map(([id,row])=>{
      const candidates=row.blocks.filter(b=>b.owner===null);
      return [id,{items:id==='next'?[...candidates.filter(b=>b.start>=row.cursor),...candidates.filter(b=>b.start<row.cursor)]:candidates,at:0,done:false}];
    }));
    while(Object.values(searches).some(s=>!s.done&&s.at<s.items.length)){
      for(const [id,row] of Object.entries(rows)){
        const search=searches[id];row.current=null;
        if(search.done||search.at>=search.items.length)continue;
        const candidate=search.items[search.at++];row.current=candidate.start;row.inspected.push(candidate.start);row.checks++;
        const chosen=row.blocks.find(b=>b.start===row.selected);
        if(candidate.size>=request&&(!chosen||id==='best'&&candidate.size<chosen.size||id==='worst'&&candidate.size>chosen.size))row.selected=candidate.start;
        if(candidate.size>=request&&(id==='first'||id==='next'))search.done=true;
        row.status=search.done?'chosen':'searching';
      }
      add(requestIndex,'search','逐项检查空闲块','深色边线标出本步检查的块；“候选”尚未分配。首次与循环首次找到合适块即停止，最佳与最差继续比较全部记录。');
    }
    for(const row of Object.values(rows)){row.current=null;row.status=row.selected===null?'rejected':'chosen';}
    add(requestIndex,'choose','选定位置，再改变空闲列表','检查结束。没有合适块的组将分配失败；其余组确定位置，但此时还没有切分空间。');
    for(const [id,row] of Object.entries(rows)){
      if(row.selected===null){row.failures++;row.status='failed';continue;}
      const chosen=row.blocks.find(b=>b.start===row.selected),start=chosen.start,remainder=chosen.size-request;
      row.blocks=row.blocks.flatMap(b=>b.start!==start?[b]:[{start,size:request,owner:`N${requestIndex+1}`},...(remainder?[{start:start+request,size:remainder,owner:null}]:[])]);
      row.result={start,size:request,originalSize:chosen.size};row.successes++;row.status='success';
      if(id==='next')row.cursor=(start+request)%32;
    }
    add(requestIndex,'allocate',`完成第 ${requestIndex+1} 次申请`,requestIndex<requests.length-1?'成功的组分出新对象，余块继续留在列表中；失败的组保持原布局。下一次请求将检验这些选择的后果。':'比较累计检查次数、成功次数和余下的连续块。一次留下最小余块，不保证整串请求的结果最好。');
  });
  return frames.map((f,i)=>({...f,complete:i===frames.length-1}));
}

function buildFreeSpaceBuddy(request=7){
  if(!Number.isInteger(request)||request<1||request>32)throw new Error('伙伴请求须为 1–32 的整数');
  let blocks=[{start:0,size:32,owner:null}],size=32,allocated=false;
  const frames=[];
  const add=(label,title,text,highlight=null)=>frames.push(freeSpaceSnapshot(blocks,{request,allocated,reserved:allocated?size:0,internalWaste:allocated?size-request:0,label,title,text,highlight,stage:frames.length}));
  add('开始',`申请 ${request} 单位`,`从一个 32 单位空闲块开始；块大小限制为 2 的幂。`);
  while(size/2>=request){const half=size/2;blocks=[{start:0,size:half,owner:null},{start:half,size:half,owner:null},...blocks.slice(1)];size=half;add('二分',`将 ${size*2} 分为两个 ${size}`,`两个子块来自同一次二分，互为伙伴；继续检查低地址子块。`,{start:0,size:size*2});}
  blocks[0]={...blocks[0],owner:'N'};allocated=true;
  add('分配',`申请 ${request}，实际占用 ${size}`,size===request?'请求恰好填满该块，没有内部碎片。':`块内有 ${size-request} 单位未被请求使用，暂时不能分给其他对象。这是内部碎片。`,{start:0,size});
  blocks[0]={...blocks[0],owner:null};allocated=false;add('释放','释放对象，检查同级伙伴','只有同一次二分产生、大小相同且都空闲的两个块才能重新合并。',{start:0,size});
  while(size<32){const buddy=blocks.find(b=>b.start===size&&b.size===size&&b.owner===null);if(!buddy)break;blocks=[{start:0,size:size*2,owner:null},...blocks.filter(b=>b.start>=size*2)];size*=2;add('合并',`两个伙伴合为 ${size} 单位`,size===32?'连续合并恢复了最初的 32 单位块。合并只更新管理记录，未搬动其他对象。':'合并后继续检查上一层伙伴；若伙伴仍在使用，就停止合并。',{start:0,size});}
  return frames.map((f,i)=>({...f,complete:i===frames.length-1}));
}
Object.assign(globalThis.OSLabFreeSpace,{comparisonPolicies:FREE_SPACE_COMPARE_POLICIES,buildComparison:buildFreeSpaceComparison,buildBuddy:buildFreeSpaceBuddy});
