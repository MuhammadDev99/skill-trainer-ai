import { signal } from '@preact/signals-react';
import type { QuizAnswer, QuizData } from '../common/types';

// Shared global state
/* export const answerResults = signal<Record<number, boolean>>({}); */
export const quizAnswers = signal<Record<number, QuizAnswer>>({});
export const currentQuiz = signal<QuizData | null>(null)

// Navigation state
export const currentQuestionIndex = signal<number>(0);
export const instantFeedbackEnabled = signal<boolean>(true);
