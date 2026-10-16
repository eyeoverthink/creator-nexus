import { Actor } from 'base44:runtime/actors';
import {proposeEdit,reviewProposal} from '../../shared/nexusProposals.ts';
import initializeNexusRoom from '../../shared/initializeNexusRoom.ts';

export default class NexusRoom extends Actor {
  state = {context:{panels:[],active:'draft',selection:null},draft:null,feed:[],agents:{},events:[],proposals:[],revision:0}; owner=null; workspace=null; seats=new Map(); reviewing=false;
  async handleStart() { const saved=await this.storage.get('state'); if(saved)this.state=saved; this.owner=await this.storage.get('owner'); this.workspace=await this.storage.get('workspace'); }
  async handleConnect(conn) {
    if(conn.identity.type!=='authenticated' || (this.owner && this.owner!==conn.identity.userId)){conn.reject(4003,'Private workspace');return;}
    if(!this.owner){this.owner=conn.identity.userId;await this.storage.put('owner',this.owner);}
    conn.send({type:'state',state:this.state});
  }
  async handleMessage(conn,msg) {
    if(conn.identity.type!=='authenticated'||conn.identity.userId!==this.owner||!msg||typeof msg!=='object')return;
    if(this.reviewing&&['edit','accept_proposal','reject_proposal'].includes(msg.type)){conn.send({type:'error',message:'A draft approval is being saved. Please retry your edit in a moment.'});return;}
    if(['accept_proposal','reject_proposal'].includes(msg.type)&&typeof msg.id==='string'){
      this.reviewing=true;try{await reviewProposal(this,conn,msg);}catch(error){conn.send({type:'error',message:error.message});}finally{this.reviewing=false;}return;
    }
    if(msg.type==='initialize' && typeof msg.workspace_id==='string' && typeof msg.draft_id==='string') {
      await initializeNexusRoom(this,conn,msg);
    } else if(msg.type==='context') {
      if(Array.isArray(msg.panels))this.state.context.panels=msg.panels.filter(p=>['feed','draft','activity','preview','context','performance'].includes(p)).slice(0,10);
      if(['feed','draft','activity','preview','context','performance'].includes(msg.active))this.state.context.active=msg.active;
      if(msg.selection && Number.isInteger(msg.selection.start)&&Number.isInteger(msg.selection.end))this.state.context.selection={start:Math.max(0,msg.selection.start),end:Math.max(0,msg.selection.end),text:String(msg.selection.text||'').slice(0,2000)};
      if(typeof msg.viewed==='string')this.state.context.viewed=msg.viewed.slice(0,160);
      this.broadcast({type:'state',state:this.state});
    } else if(msg.type==='edit' && this.state.draft) {
      if(msg.baseRevision!==this.state.revision){conn.send({type:'conflict',state:this.state});return;}
      this.state.draft={...this.state.draft,title:String(msg.title||'Untitled draft').slice(0,160),body:String(msg.body||'').slice(0,20000)};this.state.revision++;await this.publish();await this.schedule('save',Date.now()+1500);
    } else if(msg.type==='dismiss_event' && typeof msg.id==='string') {this.state.events=this.state.events.filter(e=>e.id!==msg.id);await this.publish();
    } else if(msg.type==='save') {await this.saveDraft();conn.send({type:'saved'});
    } else if(msg.type==='agent_status' && ['writer','researcher','strategist'].includes(msg.agent)) {
      this.state.agents[msg.agent]=msg.busy?'working':'ready';await this.publish();
    } else if(msg.type==='agent_result' && ['writer','researcher','strategist'].includes(msg.agent)&&msg.result&&this.state.draft) {
      const r=msg.result;let message=String(r.summary||'Agent finished').slice(0,500);
      if(r.kind==='edit') {
        if(proposeEdit(this,msg)){message='Draft suggestion ready for review. '+message;}else{message='Suggestion not added: invalid draft content or 8 proposals already await review. Review existing proposals, then retry.';}
      } else if(r.kind==='feed'&&Array.isArray(r.ideas)){this.state.feed=[...r.ideas.slice(0,5).map(i=>({id:crypto.randomUUID(),title:String(i.title).slice(0,160),body:String(i.body).slice(0,1200),tag:String(i.tag).slice(0,30),agent:msg.agent})),...this.state.feed].slice(0,30);}
      this.state.agents[msg.agent]='ready';const event={id:crypto.randomUUID(),agent:msg.agent,message,body:r.kind==='note'?String(r.body||'').slice(0,20000):'',kind:r.kind,time:Date.now()};this.state.events=[event,...this.state.events].slice(0,30);
      const audit=await this.client.asServiceRole.entities.NexusEvent.create({owner_id:this.owner,workspace_id:this.workspace,agent:msg.agent,message,body:event.body,kind:r.kind});event.id=audit.id;await this.publish();
    }
  }
  async saveDraft(){if(!this.state.draft)return;await this.client.asServiceRole.entities.NexusDraft.update(this.state.draft.id,{title:this.state.draft.title,body:this.state.draft.body,revision:this.state.revision});this.broadcast({type:'saved'});}
  async handleWake(key){if(key==='save')await this.saveDraft();}
  async publish(){await this.storage.put('state',this.state);this.broadcast({type:'state',state:this.state});}
}