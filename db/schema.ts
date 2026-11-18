import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), name: text('name').notNull(), members: text('members').notNull().default(''), className: text('class_name').notNull().default(''), startedOn: text('started_on').notNull().default(''),
  favourite: text('favourite').notNull().default(''), surprise: text('surprise').notNull().default(''), learning: text('learning').notNull().default(''),
  createdAt: text('created_at').notNull(),
}, t => [index('teams_user_idx').on(t.userId)]);

export const hadiths = sqliteTable('hadiths', {
  id: text('id').primaryKey(), teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  circle: text('circle').notNull(), arabic: text('arabic').notNull(), translation: text('translation').notNull(), source: text('source').notNull(),
  grading: text('grading').notNull().default(''), inspired: text('inspired').notNull().default(''),
  checked: integer('checked', { mode: 'boolean' }).notNull().default(false), createdAt: text('created_at').notNull(),
}, t => [index('hadith_team_idx').on(t.teamId)]);

export const acts = sqliteTable('acts', {
  id: text('id').primaryKey(), teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  number: integer('number').notNull().default(0), howLived: text('how_lived').notNull().default(''), hadithText: text('hadith_text').notNull().default(''), hadithReference: text('hadith_reference').notNull().default(''), circle: text('circle').notNull(), date: text('date').notNull(), description: text('description').notNull(),
  reflection: text('reflection').notNull().default(''), hadithId: text('hadith_id').references(() => hadiths.id, { onDelete: 'set null' }), createdAt: text('created_at').notNull(),
}, t => [index('acts_team_idx').on(t.teamId)]);

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(), username: text('username').notNull().unique(), displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(), createdAt: text('created_at').notNull(),
});
export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }), expiresAt: integer('expires_at').notNull(),
}, t => [index('sessions_user_idx').on(t.userId)]);
export const authLimits = sqliteTable('auth_limits', { key: text('key').primaryKey(), count: integer('count').notNull(), windowStart: integer('window_start').notNull() });
