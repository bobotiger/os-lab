(function(global){
 'use strict';
 const pageSize=64,entrySize=4,fanout=16,rootFrame=99;
 const baseMapping=Object.freeze({0:10,1:23,4:80,5:59,254:55,255:45});
 const integer=(v,min,max,name)=>{if(!Number.isInteger(v)||v<min||v>max)throw new RangeError(name);return v;};
 const tableFrame=group=>group===0?100:group===15?101:101+group;
 const dataFrame=vpn=>baseMapping[vpn]??256+vpn;
 const presets=Object.freeze({cluster:[0,1,4,5,254,255],spread:[0,32,64,128,192,255],full:Array.from({length:256},(_,i)=>i),empty:[]});
 function structure(pages=presets.cluster){
  if(!Array.isArray(pages))throw new TypeError('pages');const mapped=[...new Set(pages.map(v=>integer(v,0,255,'vpn')))].sort((a,b)=>a-b),set=new Set(mapped);
  const groups=Array.from({length:16},(_,index)=>{const valid=mapped.filter(v=>Math.floor(v/16)===index);return {index,start:index*16,end:index*16+15,count:valid.length,allocated:valid.length>0,frame:valid.length?tableFrame(index):null,pages:Array.from({length:16},(_,i)=>{const vpn=index*16+i;return {vpn,valid:set.has(vpn),frame:set.has(vpn)?dataFrame(vpn):null};})};});
  const leaves=groups.filter(g=>g.allocated).length;return {mapped,groups,leaves,rootFrame,pageSize,entrySize,linearPages:16,linearBytes:1024,multiPages:1+leaves,multiBytes:(1+leaves)*64,savedBytes:1024-(1+leaves)*64,dataPages:mapped.length};
 }
 function walk(address=16256,pages=presets.cluster){
  integer(address,0,16383,'address');const tree=structure(pages),vpn=Math.floor(address/64),directory=Math.floor(vpn/16),leaf=vpn%16,offset=address%64,g=tree.groups[directory],entry=g.pages[leaf],snapshots=[];
  let tableReads=0,targetAccesses=0,leafFrame=null,frame=null,physical=null,pdeAddress=null,pteAddress=null,outcome='pending';
  const snapshot=phase=>snapshots.push({phase,address,vpn,directory,leaf,offset,tableReads,targetAccesses,leafFrame,frame,physical,pdeAddress,pteAddress,outcome});snapshot('split');
  pdeAddress=rootFrame*64+directory*4;tableReads++;leafFrame=g.frame;snapshot('directory');
  if(!g.allocated){outcome='directory-empty';snapshot('stop');return {tree,snapshots};}
  pteAddress=leafFrame*64+leaf*4;tableReads++;frame=entry.frame;snapshot('leaf');
  if(!entry.valid){outcome='leaf-empty';snapshot('stop');return {tree,snapshots};}
  physical=frame*64+offset;outcome='translated';snapshot('translated');targetAccesses++;outcome='accessed';snapshot('access');return {tree,snapshots};
 }
 function depth(addressBits=30,pageBytes=512){
  if(![24,30,36].includes(addressBits)||![512,4096].includes(pageBytes))throw new RangeError('configuration');
  const offsetBits=Math.log2(pageBytes),indexBits=Math.log2(pageBytes/4),vpnBits=addressBits-offsetBits;
  const two=[vpnBits-indexBits,indexBits],automatic=[];let remaining=vpnBits;while(remaining>indexBits){automatic.unshift(indexBits);remaining-=indexBits;}automatic.unshift(remaining);
  function plan(bits){return {bits,levels:bits.length,rootEntries:2**bits[0],rootBytes:2**bits[0]*4,rootPages:Math.ceil(2**bits[0]*4/pageBytes),pageBytes,offsetBits};}
  return {addressBits,pageBytes,offsetBits,indexBits,vpnBits,entriesPerPage:pageBytes/4,two:plan(two),automatic:plan(automatic)};
 }
 function costWalk(configuration=depth(),scheme='automatic',hit=false){
  if(!['two','automatic'].includes(scheme)||typeof hit!=='boolean')throw new RangeError('cost options');const plan=configuration[scheme],vpn=254,offset=5,physicalFrame=55,address=vpn*configuration.pageBytes+offset,snapshots=[];
  let tableReads=0,targetAccesses=0,physical=null;const indices=[];let shift=configuration.vpnBits;for(const bits of plan.bits){shift-=bits;indices.push(Math.floor(vpn/2**shift)%2**bits);}
  const snapshot=(phase,level=null)=>snapshots.push({phase,level,indices:[...indices],address,offset,physicalFrame,physical,tableReads,targetAccesses,hit,levels:plan.levels});snapshot(hit?'hit':'miss');
  if(!hit)for(let i=0;i<plan.levels;i++){tableReads++;snapshot('read',i);}
  physical=physicalFrame*configuration.pageBytes+offset;snapshot('translated');targetAccesses++;snapshot('access');return {plan,snapshots};
 }
 global.OSLabSmallTables=Object.freeze({pageSize,entrySize,fanout,rootFrame,presets,tableFrame,dataFrame,structure,walk,depth,costWalk});
})(typeof window==='undefined'?globalThis:window);
