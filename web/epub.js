/* EPUB text extraction stays in the browser. ZIP members are never written to disk. */
(() => {
  'use strict';
  const LIMIT = {file:10*1024*1024, entries:1500, total:24*1024*1024, resource:5*1024*1024, text:500000};
  const fail = message => {throw new Error(message);};
  const crcTable = Array.from({length:256}, (_, n) => {for(let k=0;k<8;k++) n=(n&1)?0xedb88320^(n>>>1):n>>>1; return n>>>0;});
  function crc32(bytes){let crc=0xffffffff; for(const b of bytes) crc=crcTable[(crc^b)&255]^(crc>>>8); return (crc^0xffffffff)>>>0;}
  function pathName(name){
    if(!name || /[\\\u0000-\u001f?#]/.test(name) || name.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(name)) fail('El EPUB contiene una ruta no permitida.');
    if(name.split('/').some(p=>p==='..'||p==='.')) fail('El EPUB contiene una ruta no permitida.');
    return name;
  }
  function resolve(base, href){
    if(!href || /[\\\u0000-\u001f]/.test(href) || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('/') || href.startsWith('//')) fail('El EPUB contiene un recurso externo o una ruta no permitida.');
    let decoded; try{decoded=decodeURIComponent(href.split('#')[0]);}catch{fail('El EPUB contiene una ruta inválida.');}
    if(decoded.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(decoded)) fail('El EPUB contiene una ruta no permitida.');
    const parts=base.split('/').slice(0,-1);
    for(const part of decoded.split('/')){if(part==='..'){if(!parts.length) fail('El EPUB contiene una ruta fuera del libro.'); parts.pop();}else if(part!=='.'&&part!=='') parts.push(part);}
    return pathName(parts.join('/'));
  }
  async function zip(buffer){
    if(!(buffer instanceof ArrayBuffer) || buffer.byteLength>LIMIT.file || buffer.byteLength<22) fail('Selecciona un EPUB válido de hasta 10 MiB.');
    const bytes=new Uint8Array(buffer), view=new DataView(buffer);
    const u16=p=>view.getUint16(p,true), u32=p=>view.getUint32(p,true);
    let end=-1;
    for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--) if(u32(p)===0x06054b50 && p+22+u16(p+20)===bytes.length){end=p;break;}
    if(end<0) fail('El EPUB no contiene un ZIP válido.');
    const count=u16(end+10), centralSize=u32(end+12), centralOffset=u32(end+16);
    if(u16(end+4)||u16(end+6)||u16(end+8)!==count || count===65535 || centralSize===0xffffffff || centralOffset===0xffffffff) fail('No se admiten EPUB ZIP64 ni archivos divididos.');
    if(!count||count>LIMIT.entries || centralOffset+centralSize!==end) fail('El índice ZIP del EPUB es inválido o demasiado grande.');
    const decoder=new TextDecoder('utf-8',{fatal:true}), files=new Map(), ranges=[];
    function checkExtra(start,length){const stop=start+length;for(let p=start;p<stop;){if(p+4>stop)fail('Los datos adicionales ZIP están dañados.');const id=u16(p),len=u16(p+2);if(id===1)fail('No se admiten EPUB ZIP64.');p+=4+len;if(p>stop)fail('Los datos adicionales ZIP están dañados.');}}
    let pos=centralOffset,total=0;
    for(let i=0;i<count;i++){
      if(pos+46>end||u32(pos)!==0x02014b50) fail('El índice ZIP está dañado.');
      const flags=u16(pos+8),method=u16(pos+10),crc=u32(pos+16),compressed=u32(pos+20),size=u32(pos+24),nameLen=u16(pos+28),extraLen=u16(pos+30),commentLen=u16(pos+32),offset=u32(pos+42);
      if(pos+46+nameLen+extraLen+commentLen>end) fail('El índice ZIP está truncado.');
      checkExtra(pos+46+nameLen,extraLen);
      if(flags&~0x080e || flags&1 || flags&0x40 || ![0,8].includes(method)) fail('No se admite este tipo de compresión o cifrado EPUB.');
      if(size>LIMIT.resource || compressed>LIMIT.file || (total+=size)>LIMIT.total) fail('El EPUB supera los límites de contenido descomprimido.');
      let name;try{name=pathName(decoder.decode(bytes.subarray(pos+46,pos+46+nameLen)));}catch(error){if(error instanceof TypeError) fail('El EPUB contiene nombres de archivo inválidos.'); throw error;}
      if(files.has(name)) fail('El EPUB contiene recursos duplicados.');
      if(u16(pos+34)!==0 || offset+30>centralOffset || u32(offset)!==0x04034b50) fail('La cabecera ZIP es inválida.');
      const localNameLen=u16(offset+26),localExtraLen=u16(offset+28),start=offset+30+localNameLen+localExtraLen,finish=start+compressed;
      if(finish>centralOffset || u16(offset+6)!==flags || u16(offset+8)!==method || localNameLen!==nameLen || bytes.subarray(offset+30,offset+30+localNameLen).some((b,j)=>b!==bytes[pos+46+j])) fail('Las cabeceras ZIP no coinciden.');
      checkExtra(offset+30+localNameLen,localExtraLen);
      if(!(flags&8) && (u32(offset+14)!==crc || u32(offset+18)!==compressed || u32(offset+22)!==size)) fail('Los tamaños ZIP no coinciden.');
      let rangeEnd=finish;
      if(flags&8){let descriptor=finish;if(descriptor+4<=centralOffset&&u32(descriptor)===0x08074b50)descriptor+=4;if(descriptor+12>centralOffset||u32(descriptor)!==crc||u32(descriptor+4)!==compressed||u32(descriptor+8)!==size)fail('El descriptor ZIP está dañado.');rangeEnd=descriptor+12;}
      ranges.push([offset,rangeEnd]); files.set(name,{method,crc,size,start,finish}); pos+=46+nameLen+extraLen+commentLen;
    }
    if(pos!==end) fail('El índice ZIP tiene datos inesperados.');
    ranges.sort((a,b)=>a[0]-b[0]); for(let i=1;i<ranges.length;i++) if(ranges[i][0]<ranges[i-1][1]) fail('El EPUB contiene recursos solapados.');
    let consumed=0;
    async function read(name){
      const item=files.get(name); if(!item) fail('Falta un recurso necesario del EPUB.');
      let output;
      if(item.method===0){output=bytes.slice(item.start,item.finish);}else{
        if(typeof DecompressionStream==='undefined') fail('Tu navegador no permite abrir EPUB comprimidos. Actualiza Chrome o Edge.');
        let stream;try{stream=new Blob([bytes.subarray(item.start,item.finish)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));}catch{fail('Tu navegador no permite esta compresión EPUB. Actualiza Chrome o Edge.');}
        const reader=stream.getReader(),chunks=[];let length=0;
        try{while(true){const {done,value}=await reader.read();if(done) break;length+=value.length;if(length>item.size || length>LIMIT.resource || consumed+length>LIMIT.total){await reader.cancel();fail('El EPUB supera los límites de contenido descomprimido.');}chunks.push(value);}}catch(error){if(error.message.startsWith('El EPUB')) throw error;fail('Un recurso comprimido del EPUB está dañado.');}
        output=new Uint8Array(length);let at=0;for(const chunk of chunks){output.set(chunk,at);at+=chunk.length;}
      }
      consumed+=output.length;
      if(consumed>LIMIT.total || output.length!==item.size || crc32(output)!==item.crc) fail('Un recurso del EPUB está dañado o tiene un tamaño incorrecto.');
      return output;
    }
    return {read,files};
  }
  function xml(bytes){
    let source;try{const encoding=bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-8';source=new TextDecoder(encoding,{fatal:true}).decode(bytes);}catch{fail('Un documento EPUB no tiene una codificación válida.');}
    // Common EPUB 2 XHTML doctypes are discarded; internal subsets/entities are forbidden.
    if(/<!ENTITY/i.test(source) || /<!DOCTYPE[^>]*\[/i.test(source)) fail('No se admiten entidades ni declaraciones XML internas en EPUB.');
    source=source.replace(/<!DOCTYPE[^>]*>/gi,'');
    const entities={nbsp:160,ndash:8211,mdash:8212,lsquo:8216,rsquo:8217,ldquo:8220,rdquo:8221,hellip:8230,copy:169,reg:174,trade:8482,bull:8226,laquo:171,raquo:187};
    source=source.replace(/&([a-z]+);/gi,(match,name)=>Object.hasOwn(entities,name)?`&#${entities[name]};`:match);
    if(typeof DOMParser==='undefined') fail('El navegador no dispone de lector XML.');
    const doc=new DOMParser().parseFromString(source,'application/xml');
    if(doc.getElementsByTagName('parsererror').length || doc.getElementsByTagNameNS('*','parsererror').length) fail('Un documento XML del EPUB está dañado.');
    return doc;
  }
  const elements=(doc,name)=>Array.from(doc.getElementsByTagNameNS('*',name));
  function chapterText(doc){
    const body=elements(doc,'body')[0];if(!body) fail('Un capítulo del EPUB no contiene texto XHTML válido.');
    const ignored=new Set(['script','style','nav','svg','math','iframe','object','embed','audio','video','noscript','head']);
    const blocks=new Set(['p','div','section','article','h1','h2','h3','h4','h5','h6','li','blockquote','br','tr']);
    const pieces=[];let length=0;
    function add(value){length+=value.length;if(length>LIMIT.text*2) fail('El texto del EPUB supera el límite de 500 000 caracteres.');pieces.push(value);}
    function walk(node,depth=0){if(depth>256)fail('Un capítulo del EPUB tiene demasiados niveles de elementos.');if(node.nodeType===3){add(node.nodeValue||'');return;}if(node.nodeType!==1||ignored.has(node.localName.toLowerCase())) return;const block=blocks.has(node.localName.toLowerCase());if(block)add('\n');for(const child of node.childNodes)walk(child,depth+1);if(block)add('\n');}
    walk(body);return pieces.join('').replace(/[\t\r \u00a0]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  }
  async function extract(buffer){
    const archive=await zip(buffer);
    if(!archive.files.has('mimetype') || new TextDecoder().decode(await archive.read('mimetype'))!=='application/epub+zip') fail('El archivo no es un EPUB válido.');
    const encrypted=new Set();
    if(archive.files.has('META-INF/encryption.xml')){
      const encryption=xml(await archive.read('META-INF/encryption.xml'));
      const records=elements(encryption,'EncryptedData');
      if(!records.length)fail('El EPUB declara cifrado no compatible. Usa una copia sin protección.');
      for(const record of records){const method=elements(record,'EncryptionMethod')[0],reference=elements(record,'CipherReference')[0];if(!method||!reference||!['http://www.idpf.org/2008/embedding','http://ns.adobe.com/pdf/enc#RC'].includes(method.getAttribute('Algorithm')))fail('Este EPUB contiene cifrado o DRM no compatible. Usa una copia sin protección.');encrypted.add(resolve('encryption.xml',reference.getAttribute('URI')));}
    }
    async function readDocument(path){if(encrypted.has(path))fail('El texto del EPUB está cifrado y no se puede leer. Usa una copia sin protección.');return xml(await archive.read(path));}
    const container=await readDocument('META-INF/container.xml');
    const root=elements(container,'rootfile').find(n=>n.getAttribute('media-type')==='application/oebps-package+xml');
    if(!root) fail('El EPUB no declara un documento de lectura.');
    const packagePath=pathName(root.getAttribute('full-path')),opf=await readDocument(packagePath);
    const metadata=elements(opf,'metadata')[0],manifest=elements(opf,'manifest')[0],spine=elements(opf,'spine')[0];
    if(!metadata||!manifest||!spine) fail('La estructura del EPUB está incompleta.');
    const title=(elements(metadata,'title')[0]?.textContent||'Libro importado').trim().slice(0,200),language=(elements(metadata,'language')[0]?.textContent||'').trim().slice(0,50);
    const items=new Map();for(const item of elements(manifest,'item')){const id=item.getAttribute('id');if(!id||items.has(id)) fail('El manifiesto del EPUB contiene identificadores inválidos.');items.set(id,item);}
    const chapters=[];let length=0;
    for(const ref of elements(spine,'itemref')){
      if(ref.getAttribute('linear')==='no') continue;
      const item=items.get(ref.getAttribute('idref'));if(!item) fail('El orden de lectura del EPUB está incompleto.');
      if(item.getAttribute('media-type')!=='application/xhtml+xml') fail('El EPUB incluye un capítulo de formato no compatible.');
      if((item.getAttribute('properties')||'').split(/\s+/).includes('nav')) continue;
      const text=chapterText(await readDocument(resolve(packagePath,item.getAttribute('href'))));
      if(text){length+=text.length+(chapters.length?2:0);if(length>LIMIT.text) fail('El texto del EPUB supera el límite de 500 000 caracteres.');chapters.push(text);}
    }
    if(!chapters.length) fail('El EPUB no contiene texto legible.');
    return {title:title||'Libro importado',text:chapters.join('\n\n'),language};
  }
  globalThis.ReadLingoEpub={extract};
  if(typeof module!=='undefined'&&module.exports) module.exports={extract,zip,crc32,resolve};
})();
