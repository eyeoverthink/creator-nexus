import {useState} from 'react';
import {Upload} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {base44} from '@/api/base44Client';

export default function IngestContentDialog({open,onOpenChange,userId,onCreated}){
 const [channel,setChannel]=useState('MUSIC'),[title,setTitle]=useState(''),[bpm,setBpm]=useState(120),[tags,setTags]=useState('#EyeOverthink #Live'),[mediaUrl,setMediaUrl]=useState(''),[externalLink,setExternalLink]=useState(''),[voiceIntro,setVoiceIntro]=useState(''),[appHtml,setAppHtml]=useState(''),[code,setCode]=useState(''),[fileUri,setFileUri]=useState(''),[mimeType,setMimeType]=useState(''),[uploading,setUploading]=useState(false),[saving,setSaving]=useState(false),[err,setErr]=useState('');

 const handleFileUpload=async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  setUploading(true);setErr('');
  try{
   const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
   setFileUri(file_uri);setMimeType(file.type||'');
   if(!title)setTitle(file.name.replace(/\.[^.]+$/,''));
   if(file.type.startsWith('audio/'))setChannel('MUSIC');
   else if(file.type.startsWith('video/'))setChannel('VIDEO');
  }catch(ex){setErr(ex.message||'File upload failed');}
  finally{setUploading(false);}
 };

 const handleSave=async()=>{
  if(!title.trim()){setErr('Enter a title first.');return;}
  setSaving(true);setErr('');
  try{
   const tagList=tags.split(/[\s,]+/).map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:'#'+t);
   const rec=await base44.entities.LooseScrewItem.create({
    owner_id:String(userId||'eyeoverthink'),
    channel,
    title:title.trim(),
    duration:fileUri||mediaUrl?'LIVE_MEDIA':'04:20',
    screws:1,
    bpm:Number(bpm)||120,
    tags:tagList.length?tagList:['#EyeOverthink'],
    voice_intro:voiceIntro.trim()||`Now broadcasting ${title.trim()} on the looseScrew ${channel} channel.`,
    media_url:mediaUrl.trim(),
    file_uri:fileUri,
    mime_type:mimeType,
    external_link:externalLink.trim(),
    synth_notes:[110,146.83,164.81,196,220,261.63],
    code:code.trim()||`// Module: ${title.trim()}\nreturn "Verified online.";`,
    app_html:appHtml.trim(),
    rea_trace:`[INGESTED REAL TRANSMISSION]\n• Title: ${title.trim()}\n• Channel: ${channel}\n• Media URL: ${mediaUrl||'Uploaded private file'}\n• External Link: ${externalLink||'None'}`
   });
   onCreated?.(rec);
   onOpenChange(false);
   setTitle('');setMediaUrl('');setExternalLink('');setVoiceIntro('');setAppHtml('');setCode('');setFileUri('');
  }catch(ex){setErr(ex.message||'Could not save item');}
  finally{setSaving(false);}
 };

 return <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-mono">
   <DialogHeader>
    <DialogTitle>Ingest Real Music, Video, Link or Code App</DialogTitle>
    <DialogDescription>Upload real audio/video files (stored privately), attach YouTube/audio stream URLs, external project links, or full interactive HTML/JS apps.</DialogDescription>
   </DialogHeader>
   <div className="space-y-3 text-xs">
    <div className="grid grid-cols-3 gap-2">
     {['MUSIC','VIDEO','CODE'].map(ch=><button key={ch} type="button" onClick={()=>setChannel(ch)} className={`py-2 px-3 rounded border font-bold ${channel===ch?'border-primary bg-selection text-primary':'border-border bg-secondary text-foreground'}`}>{ch}</button>)}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
     <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title (e.g. Sub-Bass Session, New Web App)..." className="sm:col-span-2 rounded border border-input bg-background px-3 py-2"/>
     <input type="number" value={bpm} onChange={e=>setBpm(e.target.value)} placeholder="BPM (120)" className="rounded border border-input bg-background px-3 py-2"/>
    </div>
    <label className="flex items-center justify-between gap-2 rounded border border-dashed border-border bg-secondary/50 p-3 cursor-pointer hover:border-primary">
     <span className="flex items-center gap-2"><Upload size={14} className="text-primary"/>{uploading?'Uploading media file…':fileUri?`Uploaded (${mimeType||'file ready'})`:'Upload Real Audio (.mp3/.wav/.ogg) or Video (.mp4/.webm)'}</span>
     <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileUpload}/>
    </label>
    <input value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} placeholder="Direct Audio/Video Stream URL, YouTube Link, or Live Web App URL (https://...)" className="w-full rounded border border-input bg-background px-3 py-2"/>
    <input value={externalLink} onChange={e=>setExternalLink(e.target.value)} placeholder="External Reference / Repo / Download Link (https://...)" className="w-full rounded border border-input bg-background px-3 py-2"/>
    <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="#Tags (#WebAudio #Synth #REA)" className="w-full rounded border border-input bg-background px-3 py-2"/>
    <input value={voiceIntro} onChange={e=>setVoiceIntro(e.target.value)} placeholder="Avatar Host Voice Intro when selected..." className="w-full rounded border border-input bg-background px-3 py-2"/>
    <textarea rows={4} value={appHtml} onChange={e=>setAppHtml(e.target.value)} placeholder="Optional: Full Interactive App HTML/CSS/JS (<!DOCTYPE html>...) to run live on stage" className="w-full rounded border border-input bg-background p-2.5"/>
    {err&&<p className="text-destructive">{err}</p>}
   </div>
   <DialogFooter>
    <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
    <Button disabled={saving||uploading} onClick={handleSave}>{saving?'Saving…':'Save to looseScrew'}</Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}