export type QuizFact = {
  fact: string;
  question: string;
  choices: string[];
  correctIndex: number;
};

type ScheduledQuiz = {
  dueDay: number;
  factIndex: number;
};

type PersistedQuizState = {
  scheduled: ScheduledQuiz[];
  nextFactIndex: number;
  lastFactDayScheduled: number; // last in-game day we scheduled a fact for
};

const QUIZ_STORAGE_KEY = "game:quiz";

/**
 * QuizController
 * - Shows a fact each morning and schedules a quiz 3 days later.
 * - When a quiz is due, the morning screen can present the question.
 * - On correct answer, the caller can grant rewards (e.g., mines).
 */
export class QuizController {
  private facts: QuizFact[] = [
    {
      fact: "Emus are fast runners, reaching speeds up to 50 km/h.",
      question: "About how fast can emus run?",
      choices: ["10 km/h", "30 km/h", "50 km/h", "80 km/h"],
      correctIndex: 2,
    },
    {
      fact: "Emus are native to Australia and are flightless birds.",
      question: "Where are emus native to?",
      choices: ["Africa", "Australia", "South America", "Europe"],
      correctIndex: 1,
    },
    {
      fact: "Crops grow over multiple in-game days before harvest.",
      question: "What helps maximize harvest value?",
      choices: ["Harvest immediately", "Wait multiple days", "Never harvest", "Sell seeds"],
      correctIndex: 1,
    },
    {
      fact: "Land mines can clear multiple nearby emus at once.",
      question: "What does deploying a mine do?",
      choices: [
        "Spawns more emus",
        "Clears nearby emus",
        "Increases money",
        "Grows crops faster",
      ],
      correctIndex: 1,
    },
    {
      fact: "Selling crops in the morning market earns money.",
      question: "Where can you sell crops?",
      choices: ["Farm field", "Morning market", "Game over screen", "Main menu"],
      correctIndex: 1,
    },
  ];

  private scheduled: ScheduledQuiz[] = [];
  private nextFactIndex = 0;
  private lastFactDayScheduled = 0;

  constructor() {
    const saved = this.load();
    if (saved) {
      this.scheduled = saved.scheduled;
      this.nextFactIndex = saved.nextFactIndex;
      this.lastFactDayScheduled = saved.lastFactDayScheduled;
    } else {
      this.save();
    }
  }

  // Persistence
  private save(): void {
    const s: PersistedQuizState = {
      scheduled: this.scheduled,
      nextFactIndex: this.nextFactIndex,
      lastFactDayScheduled: this.lastFactDayScheduled,
    };
    try {
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }

  private load(): PersistedQuizState | null {
    try {
      const str = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (!str) return null;
      return JSON.parse(str) as PersistedQuizState;
    } catch {
      return null;
    }
  }

  /**
   * Ensure a fact is scheduled for a given day; returns the fact text to show.
   * Schedules a quiz for day + 3.
   */
  ensureFactForDay(day: number): QuizFact {
    if (day < this.lastFactDayScheduled) {
      this.resetTimeline();
    }
    if (day > this.lastFactDayScheduled) {
      const factIndex = this.nextFactIndex % this.facts.length;
      this.scheduled.push({ dueDay: day + 3, factIndex });
      this.nextFactIndex = factIndex + 1;
      this.lastFactDayScheduled = day;
      this.save();
    }
    // Show the fact assigned for the current day (the most recently scheduled)
    const recentIndex = (this.nextFactIndex + this.facts.length - 1) % this.facts.length;
    return this.facts[recentIndex];
  }

  /**
   * Get the first quiz that's due today (if any).
   * Quizzes only appear starting from day 4 (first fact shown on day 1, quiz 3 days later).
   */
  getDueQuiz(day: number): { due: ScheduledQuiz; fact: QuizFact } | null {
    if (day < 4) return null; // No quizzes before day 4 (first quiz is 3 days after day 1 fact)
    const dueIdx = this.scheduled.findIndex((q) => q.dueDay === day);
    if (dueIdx === -1) return null;
    const due = this.scheduled[dueIdx];
    const fact = this.facts[due.factIndex % this.facts.length];
    return { due, fact };
  }

  /**
   * Remove the given scheduled quiz (after answering).
   */
  completeQuiz(dueDay: number): void {
    this.scheduled = this.scheduled.filter((q) => q.dueDay !== dueDay);
    this.save();
  }

  private resetTimeline(): void {
    this.scheduled = [];
    this.nextFactIndex = 0;
    this.lastFactDayScheduled = 0;
    this.save();
  }
}
