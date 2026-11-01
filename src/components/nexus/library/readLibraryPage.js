import {base44} from '@/api/base44Client';
import {assetScope} from '@/components/nexus/library/libraryConstants';
import {readVideoPage} from '@/components/nexus/library/videoReads';
export default async function readLibraryPage({workspace,query,includeVideos,onlyVideos,cursor}){
 const state=cursor?{...cursor,assets:[...cursor.assets],videos:[...cursor.videos]}:{assets:[],videos:[],assetsDone:onlyVideos,videosDone:!includeVideos,assetCursor:null,videoCursor:null};
 const items=[];let reads=0;
 while(items.length<24){
  for(const type of ['assets','videos']){
   if(state[type].length||state[type+'Done'])continue;
   if(reads>=4)return {items,has_more:true,next_cursor:state};
   reads++;
   const page=type==='assets'?await base44.entities.NexusAsset.filter(query,{sort:'-updated_date',limit:24,...(state.assetCursor?{cursor:state.assetCursor}:{})}):await readVideoPage(assetScope(workspace),state.videoCursor);
   state[type]=type==='assets'?page.items.map(asset=>({type:'asset',id:asset.id,sortDate:asset.updated_date,asset})):page.items;
   state[type+'Done']=!page.has_more;state[type==='assets'?'assetCursor':'videoCursor']=page.next_cursor;
  }
  if(['assets','videos'].some(type=>!state[type].length&&!state[type+'Done']))continue;
  const asset=state.assets[0],video=state.videos[0];if(!asset&&!video)break;
  const type=!asset?'videos':!video?'assets':String(asset.sortDate).localeCompare(String(video.sortDate))>=0?'assets':'videos';
  items.push(state[type].shift());
 }
 const hasMore=!!(state.assets.length||state.videos.length||!state.assetsDone||!state.videosDone);
 return {items,has_more:hasMore,next_cursor:hasMore?state:undefined};
}