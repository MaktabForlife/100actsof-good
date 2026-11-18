import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const base = process.env.TEST_URL || 'http://127.0.0.1:5174';
if(new URL(base).hostname!=='127.0.0.1')throw new Error('Integration tests may only create records in a local preview.');
const suffix=crypto.randomUUID().slice(0,8);const password=crypto.randomUUID()+crypto.randomUUID();
async function call(path,body,cookie='',origin=base){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={message:text};}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};}
assert.equal((await call('/api/logbook')).status,401);
const first=await call('/api/auth',{action:'register',username:'qa_a_'+suffix,displayName:'QA Preview Team A',password});
assert.equal(first.status,200,first.data.error);assert.ok(first.cookie);
const second=await call('/api/auth',{action:'register',username:'qa_b_'+suffix,displayName:'QA Preview Team B',password});assert.equal(second.status,200,second.data.error);
let d=await call('/api/logbook',null,first.cookie);assert.equal(d.data.teams.length,1);const teamId=d.data.teams[0].id;
assert.equal((await call('/api/logbook',{action:'team-details',teamId,name:'QA Preview Team A',members:'Preview member',className:'Preview class',startedOn:'2026-11-18'},first.cookie)).status,200);
const act=await call('/api/logbook',{action:'act',teamId,circle:'Your family',date:'2026-11-18',description:'Help without being asked',howLived:'Help without being asked',hadithText:'When a man spends on his family hoping for its reward, it is charity for him.',hadithReference:'Sahih al-Bukhari 55 · Sahih Muslim 1002',reflection:'',hadithId:null},first.cookie);assert.equal(act.status,200,act.data.error);
d=await call('/api/logbook',null,first.cookie);assert.equal(d.data.acts.length,1);assert.equal(d.data.acts[0].number,1);assert.equal(d.data.acts[0].howLived,'Help without being asked');assert.equal(d.data.teams[0].className,'Preview class');assert.ok(d.data.academyTotal>=1);
const other=await call('/api/logbook',null,second.cookie);assert.equal(other.data.acts.length,0);assert.ok(!other.data.teams.some(t=>t.id===teamId));
assert.equal((await call('/api/logbook',{action:'delete-act',teamId,id:d.data.acts[0].id},second.cookie)).status,404);
assert.equal((await call('/api/logbook',{action:'reflection',teamId,favourite:'',surprise:'',learning:''},first.cookie,'https://evil.example')).status,403);
assert.equal((await call('/api/auth',{action:'login',username:'qa_a_'+suffix,password:'Incorrect test password'})).status,401);
assert.equal((await call('/api/auth',{action:'logout'},second.cookie)).status,200);
assert.equal((await call('/api/auth',null,second.cookie)).status,401);
console.log('PASS: registration, sessions, team cover, numbered PDF fields, shared progress, account isolation, CSRF, password rejection and logout.');
if(process.argv.includes('--browser')){const s=createServer((req,res)=>{if(req.url!=='/preview'){res.writeHead(404).end();return;}res.writeHead(302,{'Set-Cookie':first.cookie+'; Path=/; HttpOnly; SameSite=Lax',Location:base+'/'});res.end();});s.listen(5175,'127.0.0.1',()=>console.log('Local browser QA: http://127.0.0.1:5175/preview'));}
