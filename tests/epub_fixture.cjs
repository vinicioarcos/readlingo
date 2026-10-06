'use strict';
// Original text only. ZIP fixtures are built in memory, never imported books.
const {deflateRawSync}=require('node:zlib');
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function zip(entries){
 const locals=[],central=[];let offset=0;
 for(const item of entries){
  const name=Buffer.from(item.name);const data=Buffer.from(item.text||'');const method=item.store?0:8;const compressed=method?deflateRawSync(data):data;
  const crc=crc32(data),size=item.declaredSize??data.length,flags=item.flags||0;
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(flags,6);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(size,22);local.writeUInt16LE(name.length,26);
  locals.push(local,name,compressed);
  const head=Buffer.alloc(46);head.writeUInt32LE(0x02014b50);head.writeUInt16LE(20,4);head.writeUInt16LE(20,6);head.writeUInt16LE(flags,8);head.writeUInt16LE(method,10);head.writeUInt32LE(crc,16);head.writeUInt32LE(compressed.length,20);head.writeUInt32LE(size,24);head.writeUInt16LE(name.length,28);head.writeUInt32LE(offset,42);
  central.push(head,name);offset+=local.length+name.length+compressed.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,directory,end]);
}
function epubEntries(){return [
 {name:'mimetype',text:'application/epub+zip',store:true},
 {name:'META-INF/container.xml',text:'<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="OEBPS/book.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'},
 {name:'OEBPS/second.xhtml',text:'<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Second chapter: a fresh garden.</p></body></html>'},
 {name:'OEBPS/first.xhtml',text:'<html xmlns="http://www.w3.org/1999/xhtml"><head><style>secret-style</style></head><body><h1>First chapter</h1><p>A morning in the city.</p><script>window.readlingoInjected=true;fetch("https://epub.invalid/script")</script><img src="https://epub.invalid/picture"/><iframe src="https://epub.invalid/frame"/><style>secret-style</style></body></html>'},
 {name:'OEBPS/book.opf',text:'<package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Original English EPUB</dc:title><dc:language>en</dc:language></metadata><manifest><item id="first" href="first.xhtml" media-type="application/xhtml+xml"/><item id="second" href="second.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="first"/><itemref idref="second"/></spine></package>'}
];}
function epub(){return zip(epubEntries());}
function epub2(){const entries=epubEntries();entries[3]={...entries[3],text:'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><body><p>A&nbsp;morning &mdash; &ldquo;fresh&rdquo;.</p></body></html>'};entries.push({name:'META-INF/encryption.xml',text:'<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><EncryptedData xmlns="http://www.w3.org/2001/04/xmlenc#"><EncryptionMethod Algorithm="http://www.idpf.org/2008/embedding"/><CipherData><CipherReference URI="OEBPS/font.otf"/></CipherData></EncryptedData></encryption>'},{name:'OEBPS/font.otf',text:'unused obfuscated font'});return zip(entries);}
function invalidEpubs(){
 const xml=epubEntries();xml[1]={...xml[1],text:'<!DOCTYPE container [<!ENTITY xxe SYSTEM "https://epub.invalid/private">]>'+xml[1].text};
 const understated=epubEntries();understated[3]={...understated[3],text:'x'.repeat(6*1024*1024),declaredSize:1};
 const deep=epubEntries();deep[3]={...deep[3],text:'<html xmlns="http://www.w3.org/1999/xhtml"><body>'+'<div>'.repeat(300)+'deep'+'</div>'.repeat(300)+'</body></html>'};
 return [
  {name:'Corrupt.epub',buffer:Buffer.from('not an EPUB')},
  {name:'Encrypted.epub',buffer:zip(epubEntries().map((entry,i)=>i===3?{...entry,flags:1}:entry))},
  {name:'Bomb.epub',buffer:zip([...epubEntries(),{name:'OEBPS/bomb.txt',text:'x',declaredSize:30*1024*1024}])},
  {name:'UnderstatedBomb.epub',buffer:zip(understated)},
  {name:'Deep.epub',buffer:zip(deep)},
  {name:'Traversal.epub',buffer:zip([...epubEntries(),{name:'../escape.txt',text:'bad'}])},
  {name:'XXE.epub',buffer:zip(xml)},
  {name:'DRM.epub',buffer:zip([...epubEntries(),{name:'META-INF/encryption.xml',text:'<encryption/>'}])}
 ];
}
module.exports={zip,epubEntries,epub,epub2,invalidEpubs};
