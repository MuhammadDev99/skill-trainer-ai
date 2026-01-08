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
    | 'multiple-choice'
    | 'matching'
    | 'multi-true-false'
    | 'sorting'
    | 'fill-in-blanks';

// 2. Shared Base Interface
export interface BaseQuestion {
    id: number;
    type: QuestionType;
    prompt: string;
    explanation: string; //AI can explain why the answer is right
}

// --- Specific Question Types ---

// 1. Choose the correct option(s)
export interface MultipleChoiceQuestion extends BaseQuestion {
    type: 'multiple-choice';
    allowMultipleSelection: boolean;
    options: {
        id: number;     // e.g. 1, 2, 3
        text: string;
        isCorrect: boolean; // AI sets this directly inside the option
    }[];
}

// 2. Match 2 sides
export interface MatchingQuestion extends BaseQuestion {
    type: 'matching';
    // AI Instruction: List the pairs that belong together. 
    // Frontend: Shuffle the 'right' side when rendering.
    pairs: {
        id: number;     // Unique ID for this specific pair
        left: string;   // e.g. "Apple"
        right: string;  // e.g. "Red" (The correct match)
    }[];
}

// 3. Multi True or False (Table format)
export interface MultiTrueFalseQuestion extends BaseQuestion {
    type: 'multi-true-false';
    items: {
        id: number;
        statement: string; // e.g. "The sun is cold"
        isTrue: boolean;   // false
    }[];
}

// 4. Set the correct order
export interface SortingQuestion extends BaseQuestion {
    type: 'sorting';
    // AI Instruction: Provide items in the CORRECT order.
    // Frontend: Shuffle them before showing to user.
    items: {
        id: number;
        text: string;
    }[];
}

// 5. Fill in the Blanks
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


export type QuizQuestion =
    | MultipleChoiceQuestion
    | MatchingQuestion
    | MultiTrueFalseQuestion
    | SortingQuestion
    | FillInBlanksQuestion;

export type QuizData = {
    questions: QuizQuestion[]
    learningPath: string
    id: number
}

type BaseAnswer = {
    isCorrect?: boolean;
};

export type QuizAnswer = BaseAnswer & (
    | { type: 'multiple-choice', values: Record<number, boolean> }
    | { type: 'matching', pairs: Record<number, string> }
    | { type: 'multi-true-false', values: Record<number, boolean | null> }
    | { type: 'sorting', sortedIds: number[] }
    | { type: 'fill-in-blanks', values: Record<number, string> }
);
//-----------------------------------------

