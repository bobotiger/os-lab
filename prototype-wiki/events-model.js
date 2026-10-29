(() => {
  'use strict';
  function trace(kind='io',mode='cooperative',cost=4){
    if(!['io','cpu'].includes(kind)||!['blocking','cooperative'].includes(mode)||![4,8].includes(cost))throw new Error('Invalid event configuration');
    const s={kind,mode,cost,time:0,done:{A:null,B:null},ready:['A'],io:'尚未提交',context:kind==='cpu'?`A 剩余 ${cost+2} 单位计算`:'尚未保存',history:[],actor:null,log:'请求 A 在 t=0 到达；B 将在 t=1 到达。事件循环只有一个线程。'};
    const frames=[structuredClone(s)];let remaining=cost+2;
    // Each record covers [time, time+1). B arrives at t=1; A's I/O completes at t=1+cost.
    const end=kind==='io'&&mode==='cooperative'?cost+2:cost+3;
    for(let t=0;t<end;t++){
      let actor,activity;
      if(kind==='io'){
        if(t===0){actor='A';activity='submit';s.io='进行中';s.context=mode==='cooperative'?'A · 客户端连接 · 结果缓冲区 · 完成后发送':'保留在 A 的调用栈中';s.log=mode==='cooperative'?'提交 A 的 I/O，并保存恢复处理所需的信息。调用返回，事件循环可以处理其他事件。':'A 发起 I/O 后留在阻塞调用中；事件循环线程暂时不能处理其他请求。';}
        else if(mode==='cooperative'&&t===1||mode==='blocking'&&t===cost+2){actor='B';activity='work';s.done.B=t+1;s.log='处理已经就绪的请求 B。B 不需要等待 I/O，用一个单位时间完成。';}
        else if(t===cost+1){actor='A';activity='resume';s.done.A=t+1;s.context='A 已完成，释放请求状态';s.log=mode==='cooperative'?'A 的 I/O 已完成。读取先前保存的请求状态，向对应客户端发送结果，完成 A。':'A 的阻塞调用返回，继续发送结果并完成 A；随后才能处理等待中的 B。';}
        else {actor=null;activity=mode==='blocking'?'blocked':'idle';s.log=mode==='blocking'?'这个时间段内，A 的 I/O 尚未完成，事件循环线程仍被阻塞。B 已就绪，却不能获得处理。':'这个时间段内没有就绪事件，循环在等待。B 已完成，A 的 I/O 仍在进行。';}
        if(t+1===cost+1){s.io='已完成';if(mode==='cooperative')s.context='A · 客户端连接 · 数据已就绪 · 待发送';s.log+=' 本步结束时，A 的 I/O 完成；下一步才能处理其结果。';}
      }else{
        const runB=mode==='cooperative'?t===1:t===cost+2;
        actor=runB?'B':'A';activity='work';
        if(runB){s.done.B=t+1;s.log=`事件循环处理 B，一个单位时间后完成。${remaining?'A 的计算进度已保存，随后继续。':'A 的计算已在此前完成。'}`;}
        else {remaining--;if(!remaining)s.done.A=t+1;s.context=remaining?`A 剩余 ${remaining} 单位计算`:'A 已完成';s.log=mode==='cooperative'?`A 完成一段计算，剩余 ${remaining} 单位。${remaining?'保存进度并返回循环，让已就绪的事件有机会执行。':'全部计算已完成。'}`:`A 在同一个处理函数中连续计算，剩余 ${remaining} 单位。${remaining?'即使 B 已到达，事件循环也尚未重新取得控制权。':'处理函数返回后才能处理 B。'}`;}
      }
      s.actor=actor;s.time=t+1;s.history.push({actor,activity});
      s.ready=[];if(s.time>=1&&s.done.B===null)s.ready.push('B');
      if(kind==='io'&&mode==='cooperative'&&s.time>=cost+1&&s.done.A===null)s.ready.push('A 的 I/O 完成事件');
      if(kind==='cpu'&&mode==='cooperative'&&s.done.A===null)s.ready.push('A 的下一段计算');
      frames.push(structuredClone(s));
    }
    return frames;
  }
  globalThis.OSLabEvents=Object.freeze({trace});
})();
