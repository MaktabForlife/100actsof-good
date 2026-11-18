import { headers } from 'next/headers';
import { and, eq, gt } from 'drizzle-orm';
import { getDb } from '@/db';
import { accounts, sessions } from '@/db/schema';
import { digest, sessionToken } from '@/lib/security';
export type AccountUser = { userId: string; displayName: string; username: string };
export async function getAccountUser(): Promise<AccountUser | null> {
  const h = await headers();
  const token = sessionToken(h.get('cookie'));
  if (!token) return null;
  const [session] = await getDb().select({userId:accounts.id,displayName:accounts.displayName,username:accounts.username}).from(sessions).innerJoin(accounts,eq(accounts.id,sessions.userId)).where(and(eq(sessions.tokenHash,await digest(token)),gt(sessions.expiresAt,Math.floor(Date.now()/1000))));
  return session || null;
}
