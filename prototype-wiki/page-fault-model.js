(function(global){
'use strict';
const pageSize=64,copy=x=>JSON.parse(JSON.stringify(x)),key=(process,vpn)=>process+':'+vpn;
function overview(){
 const memory=[['A',0],['B',2],['B',3],['C',0]].map(([process,vpn],frame)=>({process,vpn,frame,bytes:pageSize}));
 const swap=[['A',1],['A',2],null,['B',0],['B',1],['D',0],['C',1],['D',1]].map((p,block)=>({block,process:p?.[0]??null,vpn:p?.[1]??null,bytes:pageSize}));
 const processes=['A','B','C','D'].map(process=>({process,pages:[...memory.filter(p=>p.process===process).map(p=>({...p,valid:true,present:true,location:'memory'})),...swap.filter(p=>p.process===process).map(p=>({...p,frame:null,valid:true,present:false,location:'swap'}))].sort((a,b)=>a.vpn-b.vpn)}));
 return {pageSize,memory,swap,processes,totalPages:11,residentPages:4,nonresidentPages:7};
}
function access({kind='absent',supply='free',cached=false,otherReady=true}={}){
 if(!['absent','resident','invalid','denied'].includes(kind)||!['free','clean','dirty'].includes(supply)||typeof cached!=='boolean'||typeof otherReady!=='boolean')throw new RangeError('access options');
 const missing=kind==='absent',valid=kind!=='invalid',allowed=kind!=='denied',present=kind==='resident'||kind==='denied',initialCache=kind==='resident'&&cached;
 const pages=[{process:'A',vpn:0,valid:true,present:true,frame:0,allowed:true},{process:'A',vpn:1,valid,present,frame:present?1:null,allowed,block:valid?0:null},{process:'B',vpn:2,valid:true,present:missing&&supply!=='free',frame:missing&&supply!=='free'?1:null,allowed:true},{process:'B',vpn:3,valid:true,present:true,frame:2,allowed:true},{process:'C',vpn:0,valid:true,present:true,frame:3,allowed:true}];
 const target=pages[1],victim=pages[2],victimValue=supply==='dirty'?77:22;
 const frames=[{frame:0,page:'A:0',value:10,state:'resident'},{frame:1,page:present?'A:1':missing&&supply!=='free'?'B:2':null,value:present?42:missing&&supply!=='free'?victimValue:null,state:present||missing&&supply!=='free'?'resident':'free'},{frame:2,page:'B:3',value:30,state:'resident'},{frame:3,page:'C:0',value:40,state:'resident'}];
 const disk=[{block:0,page:valid?'A:1':null,value:valid?42:null},{block:2,page:missing&&supply!=='free'?'B:2':null,value:missing&&supply!=='free'?22:null}];
 const s={kind,supply,otherReady,address:70,vpn:1,offset:6,pageSize,pc:100,register:null,processState:'运行',mode:'用户态',cpu:'A',bWork:0,tick:0,targetFrame:1,physical:null,completed:0,faults:0,tableReads:0,tlbHits:0,tlbMisses:0,retries:0,readRequests:0,readDone:0,writeRequests:0,writeDone:0,cache:initialCache?{page:'A:1',frame:1}:null,victimCache:missing&&supply!=='free'?{page:'B:2',frame:1}:null,io:null,pages,frames,disk,exception:null};
 const snapshots=[],push=(phase,group,actor)=>{s.phase=phase;s.group=group;s.actor=actor;snapshots.push(copy(s));};
 function wait(kind){s.processState='阻塞';s.mode='等待 I/O';s.cpu=otherReady?'B':'空闲';s.io={kind,progress:0,total:3,complete:false};if(kind==='read')s.readRequests++;else s.writeRequests++;push(kind+'-start','io','OS');for(let t=1;t<=3;t++){s.tick++;if(otherReady)s.bWork++;s.io.progress=t;s.io.complete=t===3;if(t===3){if(kind==='read'){s.readDone++;s.frames[1]={frame:1,page:'A:1',value:42,state:'loaded'};}else{s.writeDone++;s.disk[1].value=victimValue;}}push(kind+(t===3?'-done':'-wait'),'io',otherReady?'B + I/O':'I/O');}}
 push('request','check','A');
 if(initialCache){s.tlbHits++;push('hit','check','硬件');}
 else{s.tlbMisses++;push('miss','check','硬件');s.tableReads++;push('pte','check','硬件');
  if(!valid||!allowed){s.exception=!valid?'invalid':'protection';s.mode='内核态';push('exception','check','OS');return {snapshots};}
  if(missing){s.faults++;s.mode='内核态';push('fault','kernel','OS');
   if(supply!=='free'){push('victim','kernel','OS');victim.present=false;victim.frame=null;s.victimCache=null;s.frames[1].state='evicting';push('invalidate','kernel','OS');if(supply==='dirty')wait('write');s.frames[1]={frame:1,page:null,value:null,state:'reserved'};push('reclaim',supply==='dirty'?'io':'kernel','OS');}
   else{s.frames[1].state='reserved';push('reserve','kernel','OS');}
   wait('read');target.present=true;target.frame=1;s.frames[1].state='resident';s.processState='就绪';s.mode='等待调度';push('map','restore','OS');
   s.processState='运行';s.mode='用户态';s.cpu='A';s.retries++;push('resume','restore','A');s.tlbMisses++;push('retry-miss','restore','硬件');s.tableReads++;push('retry-pte','restore','硬件');
  }
  s.cache={page:'A:1',frame:1};push('fill',missing?'restore':'check','硬件');s.retries++;push('retry',missing?'restore':'check','A');s.tlbHits++;push('hit',missing?'restore':'check','硬件');
 }
 s.physical=pageSize+s.offset;push('translated','restore','硬件');s.register=s.frames[s.targetFrame].value;s.completed=1;s.pc=104;push('access','restore','A');
 return {snapshots};
}
function pool({low=2,high=4,pattern='spaced',mode='background'}={}){
 if(!Number.isInteger(low)||!Number.isInteger(high)||low<1||high>6||low>=high||!['spaced','burst'].includes(pattern)||!['background','ondemand'].includes(mode))throw new RangeError('pool options');
 const arrivals=pattern==='spaced'?Array.from({length:8},(_,i)=>i*3):[0,0,1,1,2,2,3,3];
 let free=4,active=false,reclaims=0,background=0,foreground=0;const pending=[],served=[],snapshots=[],delayed=new Set();
 snapshots.push({tick:-1,free,active,arrived:0,pending:[],served:[],delayed:0,reclaims,background,foreground,event:'initial',newRequests:[],reclaimed:false});
 for(let tick=0;tick<100;tick++){
  const fresh=arrivals.flatMap((t,i)=>t===tick?[i+1]:[]);pending.push(...fresh);
  while(pending.length&&free>0){const id=pending.shift();free--;served.push(id);}
  pending.forEach(id=>delayed.add(id));let reclaimed=false;
  if(mode==='background'&&free<low)active=true;
  if((mode==='background'&&active)||(mode==='ondemand'&&pending.length&&free===0)){free++;reclaims++;reclaimed=true;if(mode==='background')background++;else foreground++;}
  if(mode==='background'&&free>=high)active=false;
  const arrived=arrivals.filter(t=>t<=tick).length;
  snapshots.push({tick,free,active,arrived,pending:[...pending],served:[...served],delayed:delayed.size,reclaims,background,foreground,event:pending.length?'waiting':reclaimed?'reclaim':fresh.length?'allocate':'idle',newRequests:fresh,reclaimed});
  if(arrived===8&&pending.length===0&&!active)break;
 }
 return {low,high,pattern,mode,capacity:8,snapshots};
}
global.OSLabPageFault=Object.freeze({pageSize,overview,access,pool});
})(typeof window==='undefined'?globalThis:window);
