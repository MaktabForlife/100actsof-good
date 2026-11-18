import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { accounts, sessions, teams } from '@/db/schema';
import { getAccountUser } from '@/lib/auth';
import { digest, hashPassword, randomToken, sameOrigin, sessionCookie, sessionToken, SESSION_SECONDS, verifyPassword } from '@/lib/security';
export const dynamic = 'force-dynamic';
const json = (data:unknown,status=200,headers:Record<string,string>={}) => Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const input = z.discriminatedUnion('action',[
  z.object({action:z.literal('register'),username:z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,39}$/),displayName:z.string().trim().min(1).max(80),password:z.string().min(12).max(128)}),
  z.object({action:z.literal('login'),username:z.string().trim().toLowerCase().min(1).max(40),password:z.string().min(1).max(128)}),
  z.object({action:z.literal('logout')}),
]);
async function rateLimit(key:string,window:number,limit:number) {
  const now = Math.floor(Date.now()/1000);
  const db=getDb();
  const result=await db.run(sql`INSERT INTO auth_limits (key,count,window_start) VALUES (${key},1,${now}) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN window_start < ${now-window} THEN 1 ELSE count+1 END, window_start = CASE WHEN window_start < ${now-window} THEN ${now} ELSE window_start END RETURNING count`);
  const row=result.results?.[0] as {count?:number}|undefined;
  return Number(row?.count||0)<=limit;
}
export async function GET() {try { const user=await getAccountUser();return user?json({user}):json({error:'Sign in to open your team logbook.'},401); } catch(error) {console.error('Account lookup failed',error);return json({error:'The sign-in service is temporarily unavailable.'},503);} }
export async function POST(request:Request) {
  if(!sameOrigin(request))return json({error:'This request is not allowed.'},403);
  if(Number(request.headers.get('content-length')||0)>5000)return json({error:'Please shorten your entry.'},413);
  let parsed: z.infer<typeof input>;
  try {const body=await request.text();if(body.length>5000)return json({error:'Please shorten your entry.'},413);const r=input.safeParse(JSON.parse(body));if(!r.success)return json({error:'Use a username of 3–40 letters, numbers, hyphens or underscores, and a password of at least 12 characters.'},400);parsed=r.data;}catch{return json({error:'Please check the form and try again.'},400);}
  try {
    const db=getDb();const secure=new URL(request.url).protocol==='https:';
    if(parsed.action==='logout'){
      const token=sessionToken(request.headers.get('cookie'));if(token)await db.delete(sessions).where(eq(sessions.tokenHash,await digest(token)));
      return json({ok:true},200,{'Set-Cookie':sessionCookie('',secure,0)});
    }
    const ip=await digest(request.headers.get('cf-connecting-ip')||'local-preview');
    if(!await rateLimit(`${parsed.action}:ip:${ip}`,parsed.action==='register'?3600:900,parsed.action==='register'?6:30))return json({error:'Too many attempts. Please try again later.'},429,{'Retry-After':'900'});
    const username=parsed.username;let user;
    if(parsed.action==='register'){
      const [exists]=await db.select({id:accounts.id}).from(accounts).where(eq(accounts.username,username));
      if(exists)return json({error:'That username is already in use. Choose another, or sign in.'},409);
      const id=crypto.randomUUID();const createdAt=new Date().toISOString();
      const passwordHash=await hashPassword(parsed.password);
      try{await db.batch([
        db.insert(accounts).values({id,username,displayName:parsed.displayName,passwordHash,createdAt}),
        db.insert(teams).values({id:crypto.randomUUID(),userId:id,name:parsed.displayName,createdAt}),
      ]);}catch(error){const [duplicate]=await db.select({id:accounts.id}).from(accounts).where(eq(accounts.username,username));if(duplicate)return json({error:'That username is already in use.'},409);throw error;}
      user={id,username,displayName:parsed.displayName};
    }else{
      if(!await rateLimit(`login:user:${await digest(username)}`,900,10))return json({error:'Too many attempts for this username. Please try again in 15 minutes.'},429,{'Retry-After':'900'});
      const [existing]=await db.select().from(accounts).where(eq(accounts.username,username));
      const dummy='pbkdf2-sha256$100000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000';
      const valid=await verifyPassword(parsed.password,existing?.passwordHash||dummy);
      if(!existing||!valid)return json({error:'The username or password is incorrect.'},401);
      user=existing;
    }
    const token=randomToken();const now=Math.floor(Date.now()/1000);
    await db.insert(sessions).values({tokenHash:await digest(token),userId:user.id,expiresAt:now+SESSION_SECONDS});
    return json({user:{userId:user.id,username:user.username,displayName:user.displayName}},200,{'Set-Cookie':sessionCookie(token,secure)});
  }catch(error){console.error('Sign-in operation failed',error);return json({error:'Your sign-in could not be completed. Please try again.'},503);}
}
