import { skills, type Question, type Skill } from "./math";
export type Attempt = {
  id: string;
  sessionId: string;
  skill: Skill;
  level: number;
  question: Question;
  firstAnswer: string;
  independent: boolean;
  hints: number;
  wrongAnswers: number;
  at: string;
  coins: number;
};
export type SkillProgress = {
  level: number;
  independent: number;
  advanced: number;
  advancedSessions: string[];
  stars: number;
  mastered: boolean;
  streak: number;
};
export type Progress = Record<Skill, SkillProgress>;
export function initialProgress(): Progress {
  return Object.fromEntries(
    skills.map((s) => [
      s,
      {
        level: 1,
        independent: 0,
        advanced: 0,
        advancedSessions: [],
        stars: 0,
        mastered: false,
        streak: 0,
      },
    ]),
  ) as unknown as Progress;
}
export function advance(old: SkillProgress, attempt: Attempt): SkillProgress {
  const p = { ...old, advancedSessions: [...old.advancedSessions] };
  if (attempt.independent) {
    p.independent++;
    p.streak++;
    if (attempt.level === 3) {
      p.advanced++;
      if (!p.advancedSessions.includes(attempt.sessionId))
        p.advancedSessions.push(attempt.sessionId);
    }
    if (p.streak >= 3 && p.level < 3) {
      p.level++;
      p.streak = 0;
    }
  } else {
    p.streak = 0;
  }
  // Stars and mastery never decrease; mastered requires evidence across sessions.
  p.stars = Math.max(p.stars, Math.min(3, Math.floor(p.independent / 3)));
  p.mastered ||= p.advanced >= 8 && p.advancedSessions.length >= 2;
  return p;
}
