// Public configuration. Anonymous migration access is removed only after verified sign-in.
const API='https://pkiliwsmcxseoczfsfar.supabase.co';
const KEY='sb_publishable_32d3KFrWN_SVr5sdEv7ekQ_1Ycwv5Qy';
const CT_SESSION_KEY='capitaltrack.session.v1';
let ctSession=null,ctRefresh=null;
try{ctSession=JSON.parse(localStorage.getItem(CT_SESSION_KEY)||'null')}catch{}
function ctValidEmail(email){return /^[^\s@]+@nova\.nexus$/i.test(String(email||'').trim())}
function ctStoreSession(session){if(session&&!ctValidEmail(session.user?.email))throw Error('Use your @nova.nexus email.');if(session&&!session.expires_at)session.expires_at=Math.floor(Date.now()/1000)+(session.expires_in||3600);ctSession=session;if(session)localStorage.setItem(CT_SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(CT_SESSION_KEY);return session}
async function ctAuthRequest(path,body){const res=await fetch(API+'/auth/v1/'+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw Error(data.msg||data.message||data.error_description||'Sign-in failed. Try again.');return data}
async function ctToken(){if(!ctSession)return KEY;if(!ctValidEmail(ctSession.user?.email)){ctStoreSession(null);return KEY}if((ctSession.expires_at||0)*1000>Date.now()+60000)return ctSession.access_token;if(!ctRefresh)ctRefresh=ctAuthRequest('token?grant_type=refresh_token',{refresh_token:ctSession.refresh_token}).then(ctStoreSession).catch(e=>{ctStoreSession(null);return null}).finally(()=>ctRefresh=null);await ctRefresh;return ctSession?.access_token||KEY}
async function api(path,opts={}){const headers={'apikey':KEY,'Authorization':'Bearer '+await ctToken(),'Content-Type':'application/json',...opts.headers};const res=await fetch(API+path,{...opts,headers});const body=await res.text();let data;try{data=body?JSON.parse(body):null}catch{data=body}if(!res.ok)throw Error(data?.message||data?.msg||('HTTP '+res.status));return data}
window.ctLogin={
 get session(){return ctSession},
 async signIn(password){if(!password)throw Error('Enter the passcode.');const session=await ctAuthRequest('token?grant_type=password',{email:'capitaltrack@nova.nexus',password});ctStoreSession(session);return session},
 async ready(){return ctToken()},
 async signOut(){if(ctSession){try{await fetch(API+'/auth/v1/logout',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+ctSession.access_token}})}catch{}}ctStoreSession(null);location.reload()}
};
window.ctAuth={
  list(){return api('/rest/v1/ct_pipeline?select=firm_id,stage,owner,tier,connection,notes')},
  put(id,stage,detail){return api('/rest/v1/ct_pipeline?on_conflict=firm_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({firm_id:+id,stage,...(detail||{})})})},
  del(id){return api('/rest/v1/ct_pipeline?firm_id=eq.'+encodeURIComponent(id),{method:'DELETE'})},
  stageTimes(){return api('/rest/v1/ct_pipeline?select=firm_id,stage_changed_at&stage_changed_at=not.is.null')},
  nextSteps(){return api('/rest/v1/ct_pipeline?select=firm_id,next_step,next_step_date')},
  pipeRow(id){return api('/rest/v1/ct_pipeline?firm_id=eq.'+encodeURIComponent(id)+'&select=*')},
  pins(){return api('/rest/v1/ct_pipeline?select=firm_id,pinned')},
  schedKinds(){return api('/rest/v1/ct_pipeline?select=firm_id,next_step_kind')},
  commitmentsFull(){return api('/rest/v1/ct_commitments?select=firm_id,amount,status')},
  tags(){return api('/rest/v1/ct_tags?select=id,name,color&order=name.asc')},
  cardTags(){return api('/rest/v1/ct_card_tags?select=firm_id,tag_id')},
  createTag(name,color){return api('/rest/v1/ct_tags',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,color})})},
  updateTag(id,name,color){return api('/rest/v1/ct_tags?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({name,color})})},
  deleteTag(id){return api('/rest/v1/ct_tags?id=eq.'+encodeURIComponent(id),{method:'DELETE'})},
  commitments(){return api('/rest/v1/ct_commitments?select=firm_id,amount,fund')},
  putCommitment(firmId,amount,status){return api('/rest/v1/ct_commitments?on_conflict=firm_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({firm_id:+firmId,amount:+amount,fund:'III',updated_at:new Date().toISOString(),...(status?{status}:{})})})},
  deleteCommitment(firmId){return api('/rest/v1/ct_commitments?firm_id=eq.'+encodeURIComponent(firmId),{method:'DELETE'})},
  funds(){return api('/rest/v1/ct_funds?select=fund,goal')},
  rankings(){return api('/rest/v1/ct_rankings?select=firm_id,elo,games')},
  putRanking(firmId,elo,games){return api('/rest/v1/ct_rankings?on_conflict=firm_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({firm_id:+firmId,elo:+elo,games:+games,updated_at:new Date().toISOString()})})},
  setCardTag(firmId,tagId,enabled){return enabled?api('/rest/v1/ct_card_tags',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({firm_id:+firmId,tag_id:+tagId})}):api('/rest/v1/ct_card_tags?firm_id=eq.'+encodeURIComponent(firmId)+'&tag_id=eq.'+encodeURIComponent(tagId),{method:'DELETE'})},
  touches(){return api('/rest/v1/ct_touches?select=id,firm_id,kind,note,owner,touched_at&order=touched_at.desc,id.desc&limit=2000')},
  addTouch(firmId,kind,note,owner,touchedAt){return api('/rest/v1/ct_touches',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({firm_id:+firmId,kind,note:note||'',owner:owner||'',...(touchedAt?{touched_at:touchedAt}:{})})})},
  deleteTouch(id){return api('/rest/v1/ct_touches?id=eq.'+encodeURIComponent(id),{method:'DELETE'})},
  updateTouch(id,touchedAt){return api('/rest/v1/ct_touches?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({touched_at:touchedAt})})},
  firmProfiles(){return api('/rest/v1/ct_firm_profiles?select=firm_id,min_commit,max_commit')},
  putFirmProfile(firmId,minCommit,maxCommit){return api('/rest/v1/ct_firm_profiles?on_conflict=firm_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({firm_id:+firmId,min_commit:minCommit,max_commit:maxCommit,updated_at:new Date().toISOString()})})},
  customFirms(){return api('/rest/v1/ct_custom_firms?select=id,name,type,city,state,aum,notes&order=name.asc')},
  addCustomFirm(firm){return api('/rest/v1/ct_custom_firms',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(firm)})},
  audit(n){return api('/rest/v1/ct_audit?select=at,action,firm_id,firm_name,detail,why&order=at.desc&limit='+(n||30))},
  contacts(){return api('/rest/v1/ct_contacts?select=firm_id,name,role,email,linkedin,unverified')},
  probe(path){return api(path)}
};
