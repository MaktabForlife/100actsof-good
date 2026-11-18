import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5174';
if(new URL(base).hostname!=='127.0.0.1')throw new Error('Integration tests may only create records in a local preview.');
async function call(body,zone='',origin=base){const r=await fetch(base+'/api/logbook',{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...(zone?{'X-Logbook-Zone':zone}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={message:text};}return {status:r.status,data};}
assert.equal((await call()).status,400);assert.equal((await call(null,'zone-4')).status,400);
const first=await call(null,'zone-1');assert.equal(first.status,200);assert.ok(first.data.teams.some(t=>t.name==='Zone 1'));
const created=await call({action:'team',name:'QA Preview Team',members:'',className:'Preview class',startedOn:'2026-11-18'},'zone-1');assert.equal(created.status,200);const teamId=created.data.id;
const actPayload={action:'act',draftId:crypto.randomUUID(),teamId,circle:'Your family',date:'2026-11-18',description:'Help without being asked',howLived:'Help without being asked',hadithText:'When a man spends on his family hoping for its reward, it is charity for him.',hadithReference:'Sahih al-Bukhari 55 · Sahih Muslim 1002',reflection:'',hadithId:null};
const act=await call(actPayload,'zone-1');assert.equal(act.status,200,act.data.error);
assert.equal((await call(actPayload,'zone-1')).status,200);
assert.equal((await call({...actPayload,description:'Changed'},'zone-1')).status,409);
const d=await call(null,'zone-1');const saved=d.data.acts.filter(a=>a.teamId===teamId);assert.equal(saved.length,1);assert.equal(saved[0].number,1);assert.equal(saved[0].howLived,actPayload.howLived);
assert.equal((await call({...actPayload,id:saved[0].id},'zone-1')).status,405);
assert.equal((await call({action:'delete-act',teamId,id:saved[0].id},'zone-1')).status,405);
const other=await call(null,'zone-2');assert.ok(!other.data.acts.some(a=>a.teamId===teamId));assert.ok(!other.data.teams.some(t=>t.id===teamId));
assert.equal((await call({...actPayload,draftId:crypto.randomUUID()},'zone-2')).status,404);
assert.equal((await call({action:'reflection',teamId,favourite:'',surprise:'',learning:''},'zone-1','https://evil.example')).status,403);
assert.equal((await fetch(base+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register'})})).status,404);
console.log('PASS: password-free zone access, zone scoping, shared teams, numbered PDF fields, immutable entries, retry deduplication and origin validation.');
