/* ZIP contract tests; XML/XHTML extraction is verified in an actual browser. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const {zip,crc32,resolve}=require('../web/epub.js');
function fixture(entries){
 const locals=[],central=[];let offset=0;
 for(const entry of entries){
  const name=Buffer.from(entry.name),data=Buffer.from(entry.text||''),compressed=entry.deflate?zlib.deflateRawSync(data):data;
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(0x800,6);local.writeUInt16LE(entry.deflate?8:0,8);local.writeUInt32LE(crc32(data),14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
  const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(entry.deflate?8:0,10);directory.writeUInt32LE(crc32(data),16);directory.writeUInt32LE(compressed.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(name.length,28);directory.writeUInt32LE(offset,42);
  locals.push(local,name,compressed);central.push(directory,name);offset+=local.length+name.length+compressed.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 const output=Buffer.concat([...locals,directory,end]);return output.buffer.slice(output.byteOffset,output.byteOffset+output.byteLength);
}
test('stored and deflated original resources preserve bytes and CRC',async()=>{
 const archive=await zip(fixture([{name:'mimetype',text:'application/epub+zip'},{name:'OPS/chapter.xhtml',text:'Original English chapter.',deflate:true}]));
 assert.equal(new TextDecoder().decode(await archive.read('OPS/chapter.xhtml')),'Original English chapter.');
 assert.equal(new TextDecoder().decode(await archive.read('mimetype')),'application/epub+zip');
});
test('corruption is rejected before content can be used',async()=>{
 const data=fixture([{name:'chapter',text:'hello'}]);new Uint8Array(data)[37]^=1;
 const archive=await zip(data);await assert.rejects(archive.read('chapter'),/dañado/);
});
test('duplicates and traversal paths are rejected',async()=>{
 await assert.rejects(zip(fixture([{name:'same'},{name:'same'}])),/duplicados/);
 await assert.rejects(zip(fixture([{name:'../chapter'}])),/ruta/);
 await assert.rejects(zip(fixture([{name:'https://book'}])),/ruta/);
});
test('truncated, encrypted and inconsistent archives are rejected',async()=>{
 await assert.rejects(zip(new ArrayBuffer(30)),/ZIP válido/);
 const data=fixture([{name:'chapter',text:'hello'}]),view=new DataView(data);view.setUint16(30+7+5+8,0x801,true);
 await assert.rejects(zip(data),/cifrado/);
 const mismatch=fixture([{name:'chapter',text:'hello'}]);new DataView(mismatch).setUint32(22,6,true);
 await assert.rejects(zip(mismatch),/tamaños/);
});
test('declared resource and file limits reject oversized input',async()=>{
 await assert.rejects(zip(new ArrayBuffer(10*1024*1024+1)),/10 MiB/);
 const data=fixture([{name:'chapter',text:'hello'}]),view=new DataView(data);view.setUint32(30+7+5+24,5*1024*1024+1,true);
 await assert.rejects(zip(data),/límites/);
});
test('actual decompression cannot exceed the declared size',async()=>{
 const data=fixture([{name:'chapter',text:'A'.repeat(10000),deflate:true}]),view=new DataView(data),end=data.byteLength-22,central=view.getUint32(end+16,true);
 view.setUint32(22,10,true);view.setUint32(central+24,10,true);
 const archive=await zip(data);await assert.rejects(archive.read('chapter'),/límites/);
});
test('overlapping members and missing data descriptors are rejected',async()=>{
 const overlap=fixture([{name:'same',text:'one'},{name:'next',text:'two'}]),view=new DataView(overlap),central=view.getUint32(overlap.byteLength-22+16,true);
 // Extend the first stored member through the second member's local header/data.
 view.setUint32(18,40,true);view.setUint32(22,40,true);view.setUint32(central+20,40,true);view.setUint32(central+24,40,true);
 await assert.rejects(zip(overlap),/solapados/);
 const missing=fixture([{name:'chapter',text:'hello'}]),descriptor=new DataView(missing),index=descriptor.getUint32(missing.byteLength-22+16,true);
 descriptor.setUint16(6,0x808,true);descriptor.setUint16(index+8,0x808,true);
 await assert.rejects(zip(missing),/descriptor/);
});
test('ZIP64 and split volumes are rejected',async()=>{
 const zip64=fixture([{name:'chapter',text:'hello'}]),view=new DataView(zip64);view.setUint32(zip64.byteLength-22+16,0xffffffff,true);
 await assert.rejects(zip(zip64),/ZIP64/);
 const split=fixture([{name:'chapter',text:'hello'}]);new DataView(split).setUint16(split.byteLength-22+4,1,true);
 await assert.rejects(zip(split),/divididos/);
});
test('relative package resources resolve locally and reject external references',()=>{
 assert.equal(resolve('OPS/book.opf','Text/chapter%201.xhtml'),'OPS/Text/chapter 1.xhtml');
 assert.equal(resolve('OPS/book.opf','../chapter.xhtml'),'chapter.xhtml');
 for(const path of ['../../escape.xhtml','https://host/chapter','//host/chapter','%2fescape','%2e%2e/%2e%2e/escape']) assert.throws(()=>resolve('OPS/book.opf',path),/ruta|externo/);
});
