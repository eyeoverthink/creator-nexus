import {readPrivatePdf,pdfHash,pdfError} from './fraymusPdfBytes.ts';
import {parsePdfEvidence} from './fraymusPdfParse.ts';
import {retainPdfEvidence,PDF_PROJECT,PDF_SOURCE} from './fraymusPdfRetention.ts';
export async function ingestPdfEvidence(base44,user,workspaceId,assetId){
 const scope={owner_id:user.id,workspace_id:workspaceId};
 const workspace=(await base44.entities.NexusWorkspace.filter({id:workspaceId,owner_id:user.id},{limit:1})).items[0];if(!workspace)throw pdfError('Workspace not found.',404);
 const source=(await base44.entities.NexusAsset.filter({...scope,id:assetId},{limit:1})).items[0];if(!source)throw pdfError('PDF source not found.',404);
 if(source.mime_type!=='application/pdf'||!source.file_uri)throw pdfError('Select a privately uploaded PDF.',400);
 if(![PDF_SOURCE,'FraymusPdfEvidenceSourcePending'].includes(source.source_entity))throw pdfError('This asset is not a PDF evidence intake source.',400);
 let identity;
 try{
  const bytes=await readPrivatePdf(base44,source.file_uri),[sha256,sha512]=await Promise.all([pdfHash(bytes),pdfHash(bytes,'SHA-512')]);
  identity={source_sha256:sha256,source_sha512:sha512,source_bytes:bytes.length};
  const extraction=await parsePdfEvidence(bytes,identity),result=await retainPdfEvidence(base44,user,workspaceId,source,extraction);
  return result;
 }catch(error){
  await base44.entities.NexusAsset.update(source.id,{body:JSON.stringify({version:'fraymus.pdf-evidence/1',status:error.pdfCode?'unsupported':'failed',code:error.pdfCode||'extraction_failed',reason:String(error.message||error).slice(0,500),...identity,source_asset_id:source.id,original_preserved:true}),project:PDF_PROJECT});
  throw error;
 }
}