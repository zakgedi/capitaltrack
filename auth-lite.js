// LP Globe shared pipeline API. The publishable key is public; RLS grants link-wide editing.
const API='https://pkiliwsmcxseoczfsfar.supabase.co';
const KEY='sb_publishable_32d3KFrWN_SVr5sdEv7ekQ_1Ycwv5Qy';
async function api(path,opts={}){const headers={'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json',...opts.headers};const res=await fetch(API+path,{...opts,headers});const body=await res.text();let data;try{data=body?JSON.parse(body):null}catch{data=body}if(!res.ok)throw Error(data?.message||data?.msg||('HTTP '+res.status));return data}
window.lpAuth={
  list(){return api('/rest/v1/lp_pipeline?select=firm_id,stage,owner,tier,connection,notes')},
  put(id,stage,detail){return api('/rest/v1/lp_pipeline?on_conflict=firm_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({firm_id:+id,stage,...(detail||{})})})},
  del(id){return api('/rest/v1/lp_pipeline?firm_id=eq.'+encodeURIComponent(id),{method:'DELETE'})},
  tags(){return api('/rest/v1/lp_tags?select=id,name,color&order=name.asc')},
  cardTags(){return api('/rest/v1/lp_card_tags?select=firm_id,tag_id')},
  createTag(name,color){return api('/rest/v1/lp_tags',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,color})})},
  updateTag(id,name,color){return api('/rest/v1/lp_tags?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({name,color})})},
  deleteTag(id){return api('/rest/v1/lp_tags?id=eq.'+encodeURIComponent(id),{method:'DELETE'})},
  setCardTag(firmId,tagId,enabled){return enabled?api('/rest/v1/lp_card_tags',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({firm_id:+firmId,tag_id:+tagId})}):api('/rest/v1/lp_card_tags?firm_id=eq.'+encodeURIComponent(firmId)+'&tag_id=eq.'+encodeURIComponent(tagId),{method:'DELETE'})}
};
