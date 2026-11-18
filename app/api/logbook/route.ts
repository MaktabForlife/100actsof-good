import { and, eq, inArray, desc, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { teams, acts, hadiths } from '@/db/schema';
import { getAccountUser } from '@/lib/auth';
import { sameOrigin } from '@/lib/security';
import { circles } from '@/lib/logbook-types';
export const dynamic = 'force-dynamic';
const text = (max: number) => z.string().trim().min(1).max(max);
const circle = z.enum(circles);
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('team'), name: text(80), members: z.string().trim().max(2000).default(''), className: z.string().trim().max(120).default(''), startedOn: z.string().max(10).default('') }),
  z.object({ action: z.literal('team-details'), teamId: z.string().uuid(), name: text(80), members: z.string().trim().max(2000), className: z.string().trim().max(120), startedOn: z.string().max(10) }),
  z.object({ action: z.literal('act'), id: z.string().uuid().optional(), teamId: z.string().uuid(), circle,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
      const d = new Date(v + 'T00:00:00Z');
      return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v <= new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }, 'Use a valid date on or before today.'),
    description: text(1000), howLived: z.string().trim().max(3000).default(''), hadithText: z.string().trim().max(6000).default(''), hadithReference: z.string().trim().max(500).default(''), reflection: z.string().trim().max(2000), hadithId: z.string().uuid().nullable() }),
  z.object({ action: z.literal('hadith'), id: z.string().uuid().optional(), teamId: z.string().uuid(), circle,
    arabic: text(6000), translation: text(6000), source: text(500), grading: z.string().trim().max(500), inspired: z.string().trim().max(2000), checked: z.boolean() }),
  z.object({ action: z.literal('reflection'), teamId: z.string().uuid(), favourite: z.string().trim().max(4000), surprise: z.string().trim().max(4000), learning: z.string().trim().max(4000) }),
  z.object({ action: z.literal('delete-act'), teamId: z.string().uuid(), id: z.string().uuid() }),
  z.object({ action: z.literal('delete-hadith'), teamId: z.string().uuid(), id: z.string().uuid() }),
]);
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  const user = await getAccountUser();
  if (!user) return json({ error: 'Please sign in to open your logbook.' }, 401);
  try {
    const db = getDb();
    const ownTeams = await db.select().from(teams).where(eq(teams.userId, user.userId)).orderBy(teams.createdAt);
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
  const user = await getAccountUser();
  if (!user) return json({ error: 'Please sign in before saving.' }, 401);
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
      await db.insert(teams).values({ id, userId: user.userId, name: input.name, members: input.members, className: input.className, startedOn: input.startedOn, createdAt: new Date().toISOString() });
      return json({ ok: true, id });
    }
    const [team] = await db.select().from(teams).where(and(eq(teams.id, input.teamId), eq(teams.userId, user.userId)));
    if (!team) return json({ error: 'Team not found.' }, 404);
    if (input.action === 'team-details') {
      await db.update(teams).set({name:input.name,members:input.members,className:input.className,startedOn:input.startedOn}).where(eq(teams.id,team.id));
      return json({ok:true});
    }
    if (input.action === 'act') {
      if(!input.hadithId && Boolean(input.hadithText)!==Boolean(input.hadithReference))return json({error:'Include both the inspiring hadith and its full reference, or link a hadith from your collection.'},400);
      if (input.hadithId) {
        const [linked] = await db.select().from(hadiths).where(and(eq(hadiths.id, input.hadithId), eq(hadiths.teamId, team.id)));
        if (!linked || linked.circle !== input.circle) return json({ error: 'Choose a hadith from this team and circle.' }, 400);
      }
      const { action: _, id, ...values } = input;
      if (id) {
        const rows = await db.update(acts).set(values).where(and(eq(acts.id, id), eq(acts.teamId, team.id))).returning({ id: acts.id });
        if (!rows.length) return json({ error: 'Act not found.' }, 404);
      } else await db.insert(acts).values({ ...values, number:sql`(SELECT COALESCE(MAX(number),0)+1 FROM acts WHERE team_id=${team.id})`, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    } else if (input.action === 'hadith') {
      if (!/bukhari|muslim/i.test(input.source) && !input.grading) return json({ error: 'Include a grading for sources outside Bukhari or Muslim.' }, 400);
      const { action: _, id, ...values } = input;
      if (id) {
        const [old] = await db.select().from(hadiths).where(and(eq(hadiths.id, id), eq(hadiths.teamId, team.id)));
        if (!old) return json({ error: 'Hadith not found.' }, 404);
        if (old.circle !== input.circle) await db.batch([
          db.update(acts).set({ hadithId: null }).where(eq(acts.hadithId, id)),
          db.update(hadiths).set(values).where(and(eq(hadiths.id, id), eq(hadiths.teamId, team.id))),
        ]);
        else await db.update(hadiths).set(values).where(and(eq(hadiths.id, id), eq(hadiths.teamId, team.id)));
      } else await db.insert(hadiths).values({ ...values, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    } else if (input.action === 'reflection') {
      await db.update(teams).set({ favourite: input.favourite, surprise: input.surprise, learning: input.learning }).where(eq(teams.id, team.id));
    } else if (input.action === 'delete-act') await db.delete(acts).where(and(eq(acts.id, input.id), eq(acts.teamId, team.id)));
    else if (input.action === 'delete-hadith') await db.delete(hadiths).where(and(eq(hadiths.id, input.id), eq(hadiths.teamId, team.id)));
    return json({ ok: true });
  } catch (error) { console.error('Logbook write failed', error); return json({ error: 'Your changes could not be saved. Please try again.' }, 503); }
}
