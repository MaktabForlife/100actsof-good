import { and, eq, inArray, desc, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { teams, acts, hadiths } from '@/db/schema';
import { requestZone } from '@/lib/zones';
import { sameOrigin } from '@/lib/security';
import { circles } from '@/lib/logbook-types';
export const dynamic = 'force-dynamic';
const text = (max: number) => z.string().trim().min(1).max(max);
const circle = z.enum(circles);
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('team'), name: text(80), members: z.string().trim().max(2000).default(''), className: z.string().trim().max(120).default(''), startedOn: z.string().max(10).default('') }),
  z.object({ action: z.literal('team-details'), teamId: z.string().uuid(), name: text(80), members: z.string().trim().max(2000), className: z.string().trim().max(120), startedOn: z.string().max(10) }),
  z.object({ action: z.literal('act'), id: z.string().uuid().optional(), draftId: z.string().uuid().optional(), teamId: z.string().uuid(), circle,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
      const d = new Date(v + 'T00:00:00Z');
      return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v <= new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }, 'Use a valid date on or before today.'),
    description: text(1000), howLived: text(3000), hadithText: z.string().trim().max(6000).default(''), hadithReference: z.string().trim().max(500).default(''), reflection: z.string().trim().max(2000), hadithId: z.string().uuid().nullable() }),
  z.object({ action: z.literal('hadith'), id: z.string().uuid().optional(), teamId: z.string().uuid(), circle,
    arabic: text(6000), translation: text(6000), source: text(500), grading: z.string().trim().max(500), inspired: z.string().trim().max(2000), checked: z.boolean() }),
  z.object({ action: z.literal('reflection'), teamId: z.string().uuid(), favourite: z.string().trim().max(4000), surprise: z.string().trim().max(4000), learning: z.string().trim().max(4000) }),
  z.object({ action: z.literal('delete-act'), teamId: z.string().uuid(), id: z.string().uuid() }),
  z.object({ action: z.literal('delete-hadith'), teamId: z.string().uuid(), id: z.string().uuid() }),
]);
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  const zone = requestZone(request);
  if (!zone) return json({ error: 'Choose Zone 1, Zone 2, or Zone 3 to open your logbook.' }, 400);
  try {
    const db = getDb();
    const ownTeams = await db.select().from(teams).where(eq(teams.userId, zone)).orderBy(teams.createdAt);
    const ids = ownTeams.map(t => t.id);
    const [ownActs, ownHadiths] = ids.length ? await Promise.all([
      db.select().from(acts).where(inArray(acts.teamId, ids)).orderBy(desc(acts.createdAt), desc(acts.date)),
      db.select().from(hadiths).where(inArray(hadiths.teamId, ids)).orderBy(hadiths.createdAt),
    ]) : [[], []];
    const [total] = await db.select({value:count()}).from(acts);
    return json({ teams: ownTeams.map(({ userId: _, ...team }) => team), acts: ownActs, hadiths: ownHadiths, academyTotal: total.value });
  } catch (error) { console.error('Logbook read failed', error); return json({ error: 'Your logbook could not be loaded. Please try again.' }, 503); }
}
export async function POST(request: Request) {
  const zone = requestZone(request);
  if (!zone) return json({ error: 'Choose your zone before saving.' }, 400);
  if (!sameOrigin(request)) return json({ error: 'This request is not allowed.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 65000) return json({ error: 'This entry is too long.' }, 413);
  let raw: unknown;
  try { const body = await request.text(); if (body.length > 65000) return json({ error: 'This entry is too long.' }, 413); raw = JSON.parse(body); }
  catch { return json({ error: 'Please check the entry and try again.' }, 400); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message || 'Please check your entry.' }, 400);
  const input = parsed.data;
  try {
    const db = getDb();
    if ('startedOn' in input && input.startedOn && (!/^\d{4}-\d{2}-\d{2}$/.test(input.startedOn) || isNaN(new Date(input.startedOn+'T00:00:00Z').getTime()) || new Date(input.startedOn+'T00:00:00Z').toISOString().slice(0,10)!==input.startedOn)) return json({error:'Please use a valid start date.'},400);
    if (input.action === 'team') {
      const id = crypto.randomUUID();
      await db.insert(teams).values({ id, userId: zone, name: input.name, members: input.members, className: input.className, startedOn: input.startedOn, createdAt: new Date().toISOString() });
      return json({ ok: true, id });
    }
    const [team] = await db.select().from(teams).where(and(eq(teams.id, input.teamId), eq(teams.userId, zone)));
    if (!team) return json({ error: 'Team not found.' }, 404);
    if (input.action === 'team-details') {
      await db.update(teams).set({name:input.name,members:input.members,className:input.className,startedOn:input.startedOn}).where(eq(teams.id,team.id));
      return json({ok:true});
    }
    if (input.action === 'act') {
      if(input.id)return json({error:'Saved log entries are read-only and cannot be edited.'},405);
      if(!input.hadithId && (!input.hadithText||!input.hadithReference))return json({error:'Include both the inspiring hadith and its full reference, or link a hadith from your collection.'},400);
      const {action:_,id:_id,draftId,...values}=input;
      const recordId=draftId||crypto.randomUUID();
      const sameEntry=(old:typeof acts.$inferSelect)=>old.teamId===team.id&&old.circle===input.circle&&old.date===input.date&&old.description===input.description&&old.howLived===input.howLived&&old.reflection===input.reflection&&old.hadithId===input.hadithId&&(!!input.hadithId||(old.hadithText===input.hadithText&&old.hadithReference===input.hadithReference));
      const [existing]=await db.select().from(acts).where(eq(acts.id,recordId));
      if(existing)return sameEntry(existing)?json({ok:true,id:recordId}):json({error:'This entry has already been saved and cannot be changed.'},409);
      if(input.hadithId){
        const [linked]=await db.select().from(hadiths).where(and(eq(hadiths.id,input.hadithId),eq(hadiths.teamId,team.id)));
        if(!linked||linked.circle!==input.circle)return json({error:'Choose a hadith from this team and circle.'},400);
        // Preserve this exact hadith and reference with the immutable entry.
        values.hadithText=linked.translation;
        values.hadithReference=linked.source;
      }
      const inserted=await db.insert(acts).values({...values,number:sql`(SELECT COALESCE(MAX(number),0)+1 FROM acts WHERE team_id=${team.id})`,id:recordId,createdAt:new Date().toISOString()}).onConflictDoNothing({target:acts.id}).returning({id:acts.id});
      if(!inserted.length){const [old]=await db.select().from(acts).where(eq(acts.id,recordId));if(!old||!sameEntry(old))return json({error:'This entry has already been saved and cannot be changed.'},409);}
      return json({ok:true,id:recordId});
    } else if (input.action === 'hadith') {
      if (!/bukhari|muslim/i.test(input.source) && !input.grading) return json({ error: 'Include a grading for sources outside Bukhari or Muslim.' }, 400);
      const { action: _, id, ...values } = input;
      if (id) {
        const [old] = await db.select().from(hadiths).where(and(eq(hadiths.id, id), eq(hadiths.teamId, team.id)));
        if (!old) return json({ error: 'Hadith not found.' }, 404);
        await db.update(hadiths).set(values).where(and(eq(hadiths.id, id), eq(hadiths.teamId, team.id)));
      } else await db.insert(hadiths).values({ ...values, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    } else if (input.action === 'reflection') {
      await db.update(teams).set({ favourite: input.favourite, surprise: input.surprise, learning: input.learning }).where(eq(teams.id, team.id));
    } else if (input.action === 'delete-act') return json({error:'Saved log entries are read-only and cannot be removed.'},405);
    else if(input.action==='delete-hadith'){
      const [used]=await db.select({id:acts.id}).from(acts).where(eq(acts.hadithId,input.id)).limit(1);
      if(used)return json({error:'This hadith is referenced by a saved log entry and cannot be removed.'},409);
      await db.delete(hadiths).where(and(eq(hadiths.id,input.id),eq(hadiths.teamId,team.id)));
    }
    return json({ ok: true });
  } catch (error) { console.error('Logbook write failed', error); return json({ error: 'Your changes could not be saved. Please try again.' }, 503); }
}
