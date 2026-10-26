import {getDocumentProxy,getResolvedPDFJS} from 'npm:unpdf@0.12.1';
import {PDF_LIMITS,pdfError,pdfHash} from './fraymusPdfBytes.ts';
export async function parsePdfEvidence(bytes,identity){
 let pdf;const started=Date.now();
 try{
  pdf=await getDocumentProxy(bytes.slice(),{isEvalSupported:false,useSystemFonts:false,disableFontFace:true,stopAtErrors:true,disableAutoFetch:true,disableStream:true});
  if(pdf.numPages<1||pdf.numPages>PDF_LIMITS.pages)throw pdfError('PDF must contain 1–250 pages.',422,'page_limit');
  const pageText=[];let characters=0;
  for(let number=1;number<=pdf.numPages;number++){
   if(Date.now()-started>90000)throw pdfError('PDF extraction exceeded its 90-second processing budget.',422,'time_limit');
   const page=await pdf.getPage(number),content=await page.getTextContent();
   const text=content.items.map(item=>typeof item.str==='string'?item.str+(item.hasEOL?'\n':' '):'').join('');page.cleanup();
   characters+=text.length;if(characters>PDF_LIMITS.characters)throw pdfError('Extracted text exceeds 1,000,000 characters. Split this PDF before importing.',422,'text_limit');
   pageText.push({page:number,text,text_sha256:await pdfHash(new TextEncoder().encode(text))});
  }
  const noText=pageText.filter(p=>!p.text.trim()).map(p=>p.page),warnings=['PDF text-layer extraction only; no OCR, visual verification, embedded-file extraction or execution. Reading order, glyphs and whitespace may differ from the rendered page.'];
  if(noText.length)warnings.push(`No extractable text on physical pages ${noText.join(', ')}. Image-only pages require OCR, which is not supported.`);
  if(!pageText.some(p=>p.text.trim()))warnings.push('Unsupported for agent text indexing: the document has no extractable text layer. Original source and empty-page manifest retained.');
  const parser=await getResolvedPDFJS();
  return {version:'fraymus.pdf-evidence/1',...identity,extractor:{name:'unpdf',version:'0.12.1',pdfjs_version:String(parser.version||'unreported'),method:'getPage/getTextContent',ocr:false,code_execution:false},page_count:pdf.numPages,extracted_characters:characters,status:noText.length===pdf.numPages?'unsupported_scanned':noText.length?'extracted_with_gaps':'extracted',warnings,page_text:pageText};
 }catch(error){if(error.pdfCode)throw error;if(error.name==='PasswordException')throw pdfError('Encrypted or password-protected PDFs are not supported.',422,'encrypted_pdf');if(['InvalidPDFException','FormatError','UnknownErrorException'].includes(error.name))throw pdfError('Malformed or unsupported PDF. The original upload remains available.',422,'malformed_pdf');throw error;
 }finally{if(pdf)await pdf.destroy();}
}
export function pdfReferenceChunks(pages){
 const chunks=[];for(const page of pages){if(!page.text.trim())continue;let offset=0;while(offset<page.text.length){let end=Math.min(offset+7000,page.text.length);if(end<page.text.length&&/[\uD800-\uDBFF]/.test(page.text[end-1]))end--;chunks.push({page:page.page,start:offset,end,text:page.text.slice(offset,end)});offset=end;}}
 if(chunks.length>PDF_LIMITS.chunks)throw pdfError('PDF creates more than 400 reference chunks. Split it before importing.',422,'reference_limit');return chunks;
}