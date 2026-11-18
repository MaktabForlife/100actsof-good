export const circles = ['Yourself', 'Your family', 'Wider community'] as const;
export type Circle = typeof circles[number];
export type Team = { id: string; name: string; members: string; className: string; startedOn: string; favourite: string; surprise: string; learning: string; createdAt: string };
export type Act = { id: string; teamId: string; circle: Circle; number: number; howLived: string; hadithText: string; hadithReference: string; date: string; description: string; reflection: string; hadithId: string | null; createdAt: string };
export type Hadith = { id: string; teamId: string; circle: Circle; arabic: string; translation: string; source: string; grading: string; inspired: string; checked: boolean; createdAt: string };
export type LogbookData = { teams: Team[]; acts: Act[]; hadiths: Hadith[]; academyTotal: number };
