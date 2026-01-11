export type ConversationMessageRole = "assistant" | "user" | "system" | "developer"
export type ConversationMessage = {
    role: ConversationMessageRole;
    content: string;
}
export type ChatCompletionRequest = {
    messages: ConversationMessage[]
}
// Quiz related --------------------------------------
// 1. Question Type Names (String Literals, No Enums)
export type QuestionType =
    | 'multi-select'
    | 'single-select'
    | 'matching'
    | 'multi-true-false'
    | 'sorting'
    | 'fill-in-blanks'
    | 'open-ended';

// 2. Shared Base Interface
export interface BaseQuestion {
    id: number;
    type: QuestionType;
    prompt: string;
    explanation: string; //AI can explain why the answer is right
}

// --- Specific Question Types ---

export interface MultiSelectQuestion extends BaseQuestion {
    type: 'multi-select';
    options: {
        id: number;
        text: string;
        isCorrect: boolean;
    }[];
}

export interface SingleSelectQuestion extends BaseQuestion {
    type: 'single-select';
    options: {
        id: number;
        text: string;
    }[];
    correctOptionId: number
}


export interface MatchingQuestion extends BaseQuestion {
    type: 'matching';
    pairs: {
        id: number;
        left: string;   // e.g. "Apple"
        right: string;  // e.g. "Red" (The correct match)
    }[];
}

export interface MultiTrueFalseQuestion extends BaseQuestion {
    type: 'multi-true-false';
    items: {
        id: number;
        text: string;
        isTrue: boolean;
    }[];
}

export interface SortingQuestion extends BaseQuestion {
    type: 'sorting';
    items: {
        id: number;
        text: string;
    }[];
}

export interface FillInBlanksQuestion extends BaseQuestion {
    type: 'fill-in-blanks';
    // AI Instruction: Use {{number}} placeholders in text.
    // Example: "The capital of France is {{1}}."
    content: string;
    blanks: {
        id: number;        // Matches the {{number}} in content
        correctAnswer: string;
    }[];
}
export interface OpenEndedQuestion extends BaseQuestion {
    type: 'open-ended';
    answer: string
}


export type QuizQuestion =
    | MultiSelectQuestion
    | SingleSelectQuestion
    | MatchingQuestion
    | MultiTrueFalseQuestion
    | SortingQuestion
    | FillInBlanksQuestion
    | OpenEndedQuestion

export type QuizData = {
    questions: QuizQuestion[]
    learningPath: string
    id: number
}

type BaseAnswer = {
    result?: GradedAnswerResult
};

export type QuizAnswer = BaseAnswer & (
    | { type: 'multi-select', values: Record<number, boolean> }
    | { type: 'single-select', selectedId: number | null }
    | { type: 'matching', pairs: Record<number, string> }
    | { type: 'multi-true-false', values: Record<number, boolean | null> }
    | { type: 'sorting', sortedIds: number[] }
    | { type: 'fill-in-blanks', values: Record<number, string> }
    | { type: 'open-ended', answer: string | null }
);

export type GradedAnswerResult = {
    isCorrect: boolean,
    grade: number, // 0-10 
    optionResults: Record<number, boolean>, // optionId, isCorrect
    optionsCount: number
    correctOptionsCount: number
    wrongOptionsCount: number
}
//-----------------------------------------

