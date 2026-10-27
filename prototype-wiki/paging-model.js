/* Deterministic examples for the paging fundamentals page. */
(function(global){
  'use strict';
  const pageSize=16, mapping=Object.freeze([3,7,5,2]);
  const integer=(v,min,max,name)=>{if(!Number.isInteger(v)||v<min||v>max)throw new RangeError(name);return v;};
  const clone=x=>JSON.parse(JSON.stringify(x));
  function allocation(bytes=54){
    integer(bytes,1,64,'bytes');
    const count=Math.ceil(bytes/pageSize),frames=mapping.slice(0,count);
    let streak=0,longest=0;for(let frame=0;frame<8;frame++){streak=mapping.includes(frame)?streak+1:0;longest=Math.max(longest,streak);}
    const largestFree=longest*pageSize;
    return {bytes,pageSize,count,allocated:count*pageSize,padding:count*pageSize-bytes,freeBefore:4,freeAfter:4-count,largestFree,contiguous:bytes<=largestFree,
      pages:frames.map((frame,vpn)=>({vpn,frame,used:Math.min(16,bytes-vpn*16),padding:Math.max(0,(vpn+1)*16-bytes)}))};
  }
  function translation(address=21,{profile='normal',operation='read'}={}){
    integer(address,0,63,'address');
    if(!['normal','readonly','absent','invalid'].includes(profile))throw new RangeError('profile');
    if(!['read','write'].includes(operation))throw new RangeError('operation');
    const entries=mapping.map((frame,vpn)=>({vpn,frame,valid:true,present:true,read:true,write:vpn!==0,execute:vpn===0,accessed:false,dirty:false}));
    if(profile==='readonly')entries[1].write=false;
    if(profile==='absent'){entries[1].present=false;entries[1].frame=null;}
    if(profile==='invalid'){entries[1].valid=false;entries[1].present=false;entries[1].frame=null;}
    const vpn=Math.floor(address/16),offset=address%16,entry=entries[vpn],pteAddress=vpn*4;
    const fault=!entry.valid?'invalid':!entry.present?'absent':operation==='write'&&!entry.write?'protection':null;
    const pa=fault?null:entry.frame*16+offset;
    const snapshots=[];
    for(let stage=0;stage<=(fault?3:4);stage++){
      const current=clone(entries);
      if(stage===4){current[vpn].accessed=true;if(operation==='write')current[vpn].dirty=true;}
      snapshots.push({stage,address,vpn:stage>=1?vpn:null,offset:stage>=1?offset:null,pteAddress:stage>=1?pteAddress:null,
        physicalAddress:stage>=3?pa:null,fault:stage>=3?fault:null,entries:current,tableReads:stage>=2?1:0,targetAccesses:stage===4?1:0,
        value:stage===4?(operation==='write'?99:(pa*7+11)%256):null});
    }
    return {address,vpn,offset,pteAddress,operation,profile,fault,physicalAddress:pa,snapshots};
  }
  function space(addressBits=32,pageBytes=4096,processes=1,usage='sparse'){
    integer(addressBits,16,40,'addressBits');integer(processes,1,100,'processes');
    if(!Number.isInteger(pageBytes)||pageBytes<1024||Math.log2(pageBytes)%1||pageBytes>2**addressBits)throw new RangeError('pageBytes');
    if(!['sparse','quarter','full'].includes(usage))throw new RangeError('usage');
    const entries=2**addressBits/pageBytes,mapped=usage==='sparse'?Math.min(3,entries):usage==='quarter'?Math.max(1,Math.floor(entries/4)):entries;
    const regionBytes=6000,regionPages=Math.ceil(regionBytes/pageBytes),regionAllocated=regionPages*pageBytes;
    return {addressBits,pageBytes,offsetBits:Math.log2(pageBytes),vpnBits:addressBits-Math.log2(pageBytes),entries,mapped,invalid:entries-mapped,pteBytes:4,tableBytes:entries*4,totalBytes:entries*4*processes,processes,
      regionBytes,regionPages,regionAllocated,regionPadding:regionAllocated-regionBytes};
  }
  function memoryTrace(start=0,iterations=2){
    integer(start,0,999,'start');integer(iterations,1,5,'iterations');if(start+iterations>1000)throw new RangeError('end');
    const events=[],instructions=[{va:1024,name:'写入 array[i] = 0'},{va:1028,name:'i 加 1'},{va:1032,name:'比较 i 与 1000'},{va:1036,name:'判断是否继续循环'}];
    let references=0;
    function request(va,kind,iteration,label){
      const vpn=Math.floor(va/1024),offset=va%1024,pfn=vpn===1?4:({39:7,40:8,41:9,42:10})[vpn];
      if(pfn===undefined)throw new RangeError('unmapped trace page');
      const common={reference:references++,va,vpn,offset,pfn,pa:pfn*1024+offset,pteAddress:1024+vpn*4,iteration,label,targetKind:kind};
      events.push({...common,kind:'table',physicalAddress:common.pteAddress});
      events.push({...common,kind,physicalAddress:common.pa});
    }
    for(let i=start;i<start+iterations;i++){
      instructions.forEach((instruction,index)=>{
        request(instruction.va,'instruction',i,instruction.name);
        if(index===0)request(40000+i*4,'write',i,`array[${i}] = 0`);
      });
    }
    return {start,iterations,events,references,tableReads:references,instructionReads:iterations*4,writes:iterations,pageSize:1024,tableBase:1024,pteBytes:4};
  }
  global.OSLabPaging=Object.freeze({pageSize,mapping,allocation,translation,space,memoryTrace});
})(typeof window==='undefined'?globalThis:window);
