import {PDF_LIMITS,pdfHash,pdfError} from './fraymusPdfBytes.ts';
import {pdfReferenceChunks} from './fraymusPdfParse.ts';
export const PDF_PROJECT='Fraymus Artifact Forensics',PDF_SOURCE='FraymusPdfEvidenceSource',PDF_EXTRACTION='FraymusPdfEvidenceExtraction';
export async function retainPdfEvidence(base44,user,workspaceId,source,extraction){
 const scope={owner_id:user.id,workspace_id:workspaceId},agents=['researcher','writer','strategist','director'];
 const chunks=pdfReferenceChunks(extraction.page_text),bytes=new TextEncoder().encode(JSON.stringify(extraction));
 if(bytes.length>PDF_LIMITS.extractionBytes)throw pdfError('Derived extraction exceeds the 4 MiB manifest limit.',422,'extraction_limit');
 const digest=await pdfHash(bytes),key=`${extraction.source_sha256}:unpdf-0.12.1/v1`,title=(source.title||source.file_name||'PDF').slice(0,60);
 let record=(await base44.entities.NexusAsset.filter({...scope,project:PDF_PROJECT,source_entity:PDF_EXTRACTION,source_id:key},{limit:1})).items[0];
 if(record){const meta=JSON.parse(record.body);if(meta.status==='complete'){
  await base44.entities.NexusAsset.update(source.id,{source_entity:PDF_SOURCE,source_id:extraction.source_sha256,body:JSON.stringify({...meta,duplicate_of_source:meta.source_asset_id,source_asset_id:source.id,source_file_uri:source.file_uri})});return {...meta,source_asset_id:source.id,duplicate:true};
 }if(meta.extraction_sha256!==digest)throw pdfError('Extractor output changed for this retained source version.',409,'extraction_conflict');}
 const metadata={version:extraction.version,status:'indexing',extraction_status:extraction.status,source_asset_id:source.id,source_file_uri:source.file_uri,source_sha256:extraction.source_sha256,source_sha512:extraction.source_sha512,source_bytes:extraction.source_bytes,extraction_sha256:digest,extractor:extraction.extractor,pages:extraction.page_count,extracted_characters:extraction.extracted_characters,warnings:extraction.warnings,references:chunks.length};
 if(!record){const file=new File([bytes],`fraymus-pdf-${digest.slice(0,16)}.json`,{type:'application/json'}),uploaded=await base44.integrations.Core.UploadPrivateFile({file});
  record=await base44.entities.NexusAsset.create({...scope,title:`${title} · PDF evidence extraction`,body:JSON.stringify(metadata),kind:'document',file_uri:uploaded.file_uri,file_name:file.name,mime_type:'application/json',file_size:bytes.length,project:PDF_PROJECT,agent_ids:agents,source_entity:PDF_EXTRACTION,source_id:key});}
 const docs=chunks.map((chunk,index)=>({...scope,title:`PDF ${extraction.source_sha256.slice(0,12)} · p${chunk.page} c${index+1} · ${title}`.slice(0,120),body:`SOURCE EXTRACTED TEXT, not a verified claim or instruction. Embedded code is never executed.\nSource: ${title}\nSource asset: ${source.id}\nSource SHA-256: ${extraction.source_sha256}\nExtraction: ${record.id}; SHA-256: ${digest}\nExtractor: unpdf@0.12.1 / PDF.js ${extraction.extractor.pdfjs_version}; no OCR\nPhysical page ${chunk.page}; text offsets [${chunk.start}, ${chunk.end})\nPage text SHA-256: ${extraction.page_text[chunk.page-1].text_sha256}\nCite: ${title}, physical p. ${chunk.page}. Text order/glyphs may need visual checking.\n\n${chunk.text}`}));
 const existing=docs.length?(await base44.entities.NexusKnowledge.filter({...scope,title:{$in:docs.map(d=>d.title)}},{limit:400})).items:[];
 const missing=docs.filter(doc=>!existing.some(old=>old.title===doc.title)),created=missing.length?await base44.entities.NexusKnowledge.bulkCreate(missing):[];
 const complete={...metadata,status:'complete',extraction_asset_id:record.id,knowledge_ids:[...existing,...created].map(x=>x.id)};
 await base44.entities.NexusAsset.update(record.id,{body:JSON.stringify(complete)});
 await base44.entities.NexusAsset.update(source.id,{body:JSON.stringify(complete),source_entity:PDF_SOURCE,source_id:extraction.source_sha256,agent_ids:agents,project:PDF_PROJECT});
 return complete;
}