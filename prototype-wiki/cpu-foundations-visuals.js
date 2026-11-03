(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const format = value => new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(value);

  // The same byte is interpreted as an unsigned integer, ASCII code, or gray value.
  let byte = 65;
  function renderByte() {
    const weights = [];
    document.querySelectorAll('[data-byte-bit]').forEach(button => {
      const bit = Number(button.dataset.byteBit);
      const on = (byte >> bit) & 1;
      if (on) weights.push(2 ** bit);
      button.setAttribute('aria-pressed',String(Boolean(on)));
      button.setAttribute('aria-label','位权 '+(2 ** bit)+'，当前为 '+on+'，点击切换');
      button.querySelector('b').textContent = on;
    });
    $('cf-byte-number').textContent = byte;
    $('cf-byte-equation').textContent = (weights.length ? weights.join(' + ') : '0')+' = '+byte;
    const printable = byte >= 33 && byte <= 126;
    $('cf-byte-character').textContent = printable ? String.fromCharCode(byte) : byte === 32 ? '␠' : '—';
    $('cf-byte-char-note').textContent = byte > 127 ? '超出 ASCII 的 0–127 范围'
      : byte === 32 ? '编码 32 对应空格'
      : printable ? '编码 '+byte+' 对应字符 '+String.fromCharCode(byte)
      : '编码 '+byte+' 是控制码，不显示字形';
    $('cf-byte-swatch').style.backgroundColor = 'rgb('+byte+','+byte+','+byte+')';
    $('cf-byte-swatch').setAttribute('aria-label','灰度 '+byte+'，0 为黑，255 为白');
    $('cf-byte-gray-note').textContent = byte+' / 255 · 0 为黑，255 为白';
  }
  document.querySelectorAll('[data-byte-bit]').forEach(button => button.addEventListener('click',() => {
    byte ^= 1 << Number(button.dataset.byteBit); renderByte();
  }));
  $('cf-byte-reset').addEventListener('click',() => {byte=65;renderByte();});
  renderByte();

  // Ideal positive-edge D flip-flop. Each action is assumed to satisfy setup/hold.
  let data = 0, clock = 0, held = 0, actionCount = 0;
  let registerHistory = [{data:0,clock:0,held:0,index:0}];
  let registerTimer = null;
  const registerIntroduction = '先把输入 D 改成 1：Q 会保持 0。再产生上升沿，观察 Q 接收新值。';
  function stopRegister() {
    if (registerTimer !== null) clearInterval(registerTimer);
    registerTimer = null;
    $('cf-register-play').textContent = '自动演示';
    $('cf-register-play').setAttribute('aria-pressed','false');
  }
  function waveform(key) {
    const points = registerHistory;
    const y = value => value ? 8 : 28;
    let path = 'M 0 '+y(points[0][key]);
    for(let i=1;i<points.length;i++) path += ' H '+(i*100)+' V '+y(points[i][key]);
    return path+' H '+Math.min(600,(points.length-1)*100+40);
  }
  function renderRegister(message, sampled=false) {
    $('cf-data-value').textContent = data;
    $('cf-data-input').setAttribute('aria-pressed',String(Boolean(data)));
    $('cf-data-input').setAttribute('aria-label','切换输入 D，当前为 '+data);
    $('cf-held-value').textContent = held;
    $('cf-clock-value').textContent = clock;
    $('cf-clock-toggle').textContent = clock ? '时钟 1 → 0 · 下降沿' : '时钟 0 → 1 · 上升沿';
    $('cf-sampling-label').textContent = sampled ? '已在上升沿接收' : '等待下一次上升沿';
    $('cf-held-status').textContent = sampled ? '接收 D = '+held : '保持 '+held;
    $('cf-register-event').textContent = message;
    const demo=$('cf-register-demo');
    demo.dataset.data=String(data);demo.dataset.clock=String(clock);demo.dataset.held=String(held);demo.dataset.actions=String(actionCount);
    $('cf-wave-d').setAttribute('d',waveform('data'));
    $('cf-wave-clock').setAttribute('d',waveform('clock'));
    $('cf-wave-q').setAttribute('d',waveform('held'));
    $('cf-wave-ticks').replaceChildren(...Array.from({length:7},(_,i) => {
      const span=document.createElement('span');span.textContent=registerHistory[i]?.index ?? '·';return span;
    }));
  }
  function registerTransition(previous, kind) {
    const next={...previous};
    if(kind==='data') next.data=1-previous.data;
    else {next.clock=1-previous.clock;if(next.clock===1)next.held=previous.data;}
    return next;
  }
  function registerAction(kind) {
    let sampled=false, message;
    const next=registerTransition({data,clock,held},kind);
    if(kind==='data') {
      data=next.data;
      message='输入 D 变为 '+data+'，Q 仍为 '+held+'。输入变化没有产生时钟上升沿，已经保存的值保持不变。';
    } else {
      clock=next.clock;
      sampled=clock===1;
      if(sampled) {
        const old=held;held=next.held;
        message='CLK 从 0 升到 1，接收当前 D = '+data+'。'+(old===held ? '输入与原值相同，Q 仍为 '+held+'。' : 'Q 从 '+old+' 更新为 '+held+'。');
      } else message='CLK 从 1 降到 0。这个存储单元只在上升沿接收数据，所以 Q 仍为 '+held+'。';
    }
    registerHistory.push({data,clock,held,index:++actionCount});
    registerHistory=registerHistory.slice(-7);
    renderRegister(message,sampled);
  }
  function resetRegister() {
    stopRegister();data=0;clock=0;held=0;actionCount=0;
    registerHistory=[{data,clock,held,index:0}];renderRegister(registerIntroduction);
  }
  $('cf-data-input').addEventListener('click',() => {stopRegister();registerAction('data');});
  $('cf-clock-toggle').addEventListener('click',() => {stopRegister();registerAction('clock');});
  $('cf-register-reset').addEventListener('click',resetRegister);
  $('cf-register-play').addEventListener('click',() => {
    if(registerTimer!==null) {stopRegister();return;}
    globalThis.OSLabConcurrencyMovies?.stopAll();
    resetRegister();
    const actions=['data','clock','data','clock','clock','clock'];let index=0;
    $('cf-register-play').textContent='暂停';$('cf-register-play').setAttribute('aria-pressed','true');
    registerAction(actions[index++]);
    registerTimer=setInterval(() => {
      registerAction(actions[index++]);
      if(index===actions.length) stopRegister();
    },1600);
  });
  resetRegister();

  // Equal stages emphasize event order; they are not hardware clock counts.
  let branchStep=0, branchTimer=null;
  const baselinePlan=[['等待','wait'],['等待','wait'],['确认','resolve'],['计算','calculate'],['提交','commit'],['完成','done']];
  const hitPlan=[['预测','predict'],['计算','calculate'],['确认','resolve'],['提交','commit'],['完成','done'],['完成','done']];
  const missPlan=[['预测','predict'],['计算','calculate'],['作废','discard'],['恢复','recover'],['计算','calculate'],['提交','commit']];
  function branchState(hit, step) {
    const result=hit?30:-10;
    return {hit,step,flag:step>=3?(hit?1:0):null,
      predicted:{pending:hit?(step>=2&&step<4?30:null):(step===2?30:step===5?-10:null),result:step>=(hit?4:6)?result:0,committed:step>=(hit?4:6)},
      baseline:{pending:step===4?result:null,result:step>=5?result:0,committed:step>=5},
      discarded:!hit&&step>=3};
  }
  globalThis.OSLabCPUVisuals=Object.freeze({registerTransition,branchState});
  document.addEventListener('oslab:cinema',()=>{stopRegister();stopBranch();});
  function stopBranch() {
    if(branchTimer!==null) clearInterval(branchTimer);
    branchTimer=null;
    $('cf-branch-play').textContent=branchStep===6 ? '重播' : '自动播放';
    $('cf-branch-play').setAttribute('aria-pressed','false');
  }
  function renderTrace(target,plan,hit,predicted) {
    $(target).replaceChildren(...plan.map(([label,kind],index) => {
      const item=document.createElement('li');const step=index+1;
      item.dataset.state=step>branchStep ? 'future' : 'executed';
      if(step<=branchStep) item.dataset.kind=kind;
      if(step===branchStep) item.setAttribute('aria-current','step');
      if(predicted && !hit && branchStep>=3 && step===2) {item.dataset.discarded='true';item.title='此步算出的 30 已作废';}
      const number=document.createElement('span');number.textContent=step;
      const text=document.createElement('b');text.textContent=step>branchStep ? '—' : label;
      item.append(number,text);return item;
    }));
  }
  function renderBranch() {
    const hit=$('cf-branch-outcome').value==='hit';
    const state=branchState(hit,branchStep);
    const result=hit ? 30 : -10;
    const committed=state.predicted.committed;
    const pending=state.predicted.pending===null?'—':String(state.predicted.pending).replace('-','−');
    $('cf-branch-demo').dataset.step=String(branchStep);
    $('cf-branch-condition').textContent=branchStep>=3 ? 'flag = '+(hit ? '1，条件成立' : '0，条件不成立') : 'flag 尚未返回';
    $('cf-route-true').dataset.status=branchStep>=3 ? (hit ? 'confirmed' : 'discarded') : branchStep>=1 ? 'predicted' : 'idle';
    $('cf-route-false').dataset.status=!hit && branchStep>=3 ? 'confirmed' : 'idle';
    $('cf-route-true-state').textContent=branchStep===0 ? '等待执行' : branchStep===1 ? '预测选中此路' : branchStep===2 ? '算出 30，尚未提交' : hit ? (committed ? '30 已提交' : '路径确认，等待提交') : '30 已作废';
    $('cf-route-false-state').textContent=hit || branchStep<3 ? '未执行' : branchStep===3 ? '确认应走此路' : branchStep===4 ? '恢复并重新取指' : branchStep===5 ? '算出 −10，等待提交' : '−10 已提交';
    $('cf-branch-pending').textContent=pending;
    $('cf-branch-pending-note').textContent=committed ? '已提交为正式结果' : !hit && branchStep>=3 && branchStep<5 ? '30 已丢弃，需执行正确路径' : pending!=='—' ? '已算出，尚未成为正式结果' : '先算出的值暂存在这里';
    $('cf-branch-committed').textContent=String(committed ? result : 0);
    $('cf-baseline-result').textContent=String(branchStep>=5 ? result : 0);
    $('cf-branch-progress').textContent=committed ? '第 '+(hit ? 4 : 6)+' 阶段已提交' : branchStep===0 ? '尚未开始' : '进行到第 '+branchStep+' 阶段';
    const messages=[
      '两种方案面对相同的条件等待。逐步播放，观察谁先计算，以及正式结果何时改变。',
      'flag 还没返回。等待方案暂不进入任何分支；预测方案猜条件成立，先取加法路径上的指令。',
      '预测方案已算出 10 + 20 = 30，但两种方案的正式 r 都还是 0：分支尚未确认，30 不能提交。',
      hit ? 'flag 返回 1，预测正确。暂存的 30 可以保留；等待方案此时才知道该走加法路径。' : 'flag 返回 0，预测错误。暂存的 30 作废，正式 r 仍为 0；正确路径应计算 10 − 20。',
      hit ? '预测方案提交 30，正式 r 变为 30。等待方案刚算出 30，还没有提交。' : '预测方案恢复执行现场、重新取指。等待方案已经在正确路径上算出 −10，但还没有提交。',
      hit ? '等待方案也提交 30。预测方案已在前一阶段完成，提前计算的工作节省了后续等待。' : '等待方案提交 −10；预测方案此时才算出 −10，仍待提交。错误预测增加了恢复工作。',
      hit ? '两种方案得到相同的 30；预测正确让结果更早提交。切换为“猜错”，可比较恢复错误路径的代价。' : '预测方案终于提交 −10。两种方案的最终结果相同，错误路径上的 30 从未成为正式结果。',
    ];
    $('cf-branch-event').textContent=messages[branchStep];
    renderTrace('cf-baseline-trace',baselinePlan,hit,false);
    renderTrace('cf-predicted-trace',hit ? hitPlan : missPlan,hit,true);
    $('cf-branch-prev').disabled=branchStep===0;
    $('cf-branch-next').disabled=branchStep===6;
    if(branchStep===6) stopBranch();
  }
  function resetBranch() {branchStep=0;stopBranch();renderBranch();}
  function nextBranch() {if(branchStep<6) branchStep++;renderBranch();}
  $('cf-branch-next').addEventListener('click',() => {stopBranch();nextBranch();});
  $('cf-branch-prev').addEventListener('click',() => {stopBranch();branchStep=Math.max(0,branchStep-1);renderBranch();});
  $('cf-branch-reset').addEventListener('click',resetBranch);
  $('cf-branch-outcome').addEventListener('change',resetBranch);
  $('cf-branch-play').addEventListener('click',() => {
    if(branchTimer!==null) {stopBranch();return;}
    globalThis.OSLabConcurrencyMovies?.stopAll();
    if(branchStep===6) branchStep=0;
    $('cf-branch-play').textContent='暂停';$('cf-branch-play').setAttribute('aria-pressed','true');
    nextBranch();
    if(branchStep<6) branchTimer=setInterval(nextBranch,1700);
  });
  resetBranch();

  function renderSpeed() {
    const frequency=Number($('cf-speed-frequency').value);
    const ipc=Number($('cf-speed-ipc').value);
    // Billions cancel: 10 billion instructions / (GHz * average IPC).
    const timeA=10/frequency,timeB=10/(4*ipc);
    $('cf-speed-frequency-value').textContent=format(frequency)+' GHz';
    $('cf-speed-ipc-value').textContent=format(ipc);
    $('cf-time-a').textContent=format(timeA)+' 秒';
    $('cf-time-b').textContent=format(timeB)+' 秒';
    $('cf-duration-a').style.width=(timeA/5*100)+'%';
    $('cf-duration-b').style.width=(timeB/5*100)+'%';
    $('cf-speed-demo').dataset.timeA=String(timeA);$('cf-speed-demo').dataset.timeB=String(timeB);
    $('cf-speed-result').textContent=Math.abs(timeA-timeB)<1e-9 ? 'A 与 B 同时完成，均用时 '+format(timeA)+' 秒。'
      : (timeA<timeB ? 'A 比 B' : 'B 比 A')+' 早 '+format(Math.abs(timeA-timeB))+' 秒完成。';
  }
  $('cf-speed-frequency').addEventListener('input',renderSpeed);
  $('cf-speed-ipc').addEventListener('input',renderSpeed);
  $('cf-speed-reset').addEventListener('click',() => {$('cf-speed-frequency').value='5';$('cf-speed-ipc').value='2';renderSpeed();});
  renderSpeed();
  document.addEventListener('visibilitychange',() => {if(document.hidden) {stopRegister();stopBranch();}});
  window.addEventListener('pagehide',() => {stopRegister();stopBranch();});
})();
