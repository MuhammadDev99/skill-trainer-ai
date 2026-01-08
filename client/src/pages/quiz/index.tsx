import { signal } from '@preact/signals-react';
import styles from './style.module.css'
import { downArrow, upArrow, correct, wrong, correctColored, wrongColored } from '../../images'
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import hooks
import type { QuizQuestion, SortingQuestion, MatchingQuestion, MultiTrueFalseQuestion, MultipleChoiceQuestion, FillInBlanksQuestion, QuizData, QuizAnswer } from '../../common/types';

import { currentQuiz, quizAnswers, currentQuestionIndex, instantFeedbackEnabled } from '../../store/quizStore';
/* export const testQuestions: QuizQuestion[] = [] */

function next() {
    if (!currentQuiz.value) return
    if (currentQuestionIndex.value < currentQuiz.value.questions.length - 1) {
        currentQuestionIndex.value++
    }
}
function previous() {
    if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--
    }
}

function createSeededGenerator(seedString: string): () => number {
    // 1. Hash the string to get a numeric seed
    // This is a simple bitwise hash (cyrb128 style)
    let h = 2166136261;
    for (let i = 0; i < seedString.length; i++) {
        h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
    }

    // 2. Return a PRNG function (Mulberry32 algorithm)
    return function () {
        h |= 0; h = h + 0x6D2B79F5 | 0;
        let t = Math.imul(h ^ h >>> 15, 1 | h);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// --- How to use it with your Shuffle function ---

function shuffle<T>(array: T[], seed: string): T[] {
    const copiedArray = [...array];
    const rng = createSeededGenerator(seed); // Initialize the generator once

    for (let i = copiedArray.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(rng() * (i + 1)); // Call it to get the next number
        [copiedArray[i], copiedArray[randomIndex]] = [copiedArray[randomIndex], copiedArray[i]];
    }

    return copiedArray;
}


function MultipleChoiceView({ question }: { question: MultipleChoiceQuestion }) {
    const questionId = question.id
    const currentAnswer = quizAnswers.value[questionId] || {
        type: "multiple-choice",
        values: {}
    }
    if (currentAnswer.type !== 'multiple-choice') {
        return
    }
    const isMultiQuestion = question.allowMultipleSelection

    function handleChange(optionId: number, isChecked: boolean) {
        if (currentAnswer.type !== 'multiple-choice') return;
        const newValues = { ...currentAnswer.values }
        if (!isMultiQuestion) {
            Object.keys(newValues).forEach(key => newValues[Number(key)] = false)
        }
        newValues[optionId] = isChecked
        quizAnswers.value = { ...quizAnswers.value, [questionId]: { ...currentAnswer, values: newValues } }
    }
    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsMultipleChoice}`}>
            {question.options.map(option => {
                return (
                    <div key={option.id}>
                        <label>
                            <input checked={!!currentAnswer.values[option.id]} onChange={(e) => handleChange(option.id, e.target.checked)} type={isMultiQuestion ? 'checkbox' : 'radio'} name={`question-${questionId}`} />
                            {" " + option.text}
                        </label>
                    </div>
                )
            })}
        </div>
    );
}
function MatchingView({ question }: { question: MatchingQuestion }) {
    let currentAnswer = quizAnswers.value[question.id]
    if (currentAnswer === undefined) {
        const startingAnswer = { type: 'matching' as const, pairs: {} }
        currentAnswer = startingAnswer
        quizAnswers.value = { ...quizAnswers.value, [question.id]: startingAnswer }
    }
    if (currentAnswer.type !== 'matching') return;
    function handleValueChange(optionId: number, newValue: string) {
        if (currentAnswer.type !== 'matching') return;
        const newPairs = { ...currentAnswer.pairs }
        newPairs[optionId] = newValue
        quizAnswers.value = { ...quizAnswers.value, [question.id]: { ...currentAnswer, pairs: newPairs } }
    }
    const uniqueShuffledOptions = shuffle([...new Set([...question.pairs.map(x => x.right)])], question.prompt)
    const options = ["Select...", ...uniqueShuffledOptions]
    return (
        <div className={`${styles.quizOptions}  ${styles.quizOptionsMatching}`}>
            {question.pairs.map(pair => {
                const optionId = pair.id
                const selectedOption = currentAnswer.pairs[optionId] || "Select..."
                return (
                    <div key={optionId}>
                        <span>{pair.left}</span>
                        <select value={selectedOption} onChange={e => handleValueChange(optionId, e.target.value)} >
                            {options.map((option, index) => {
                                return (<option key={index} value={option}>{option}</option>)
                            })}
                        </select>
                    </div>
                )
            })}
        </div>
    )
}
function MultiTrueFalseView({ question }: { question: MultiTrueFalseQuestion }) {
    const currentAnswer = quizAnswers.value[question.id] || {
        type: 'multi-true-false',
        values: {}
    }
    if (currentAnswer.type !== 'multi-true-false') return;

    function onValueChange(optionId: number, value: boolean) {
        if (currentAnswer.type !== 'multi-true-false') return;
        const newValues = { ...currentAnswer.values }
        newValues[optionId] = value
        quizAnswers.value = { ...quizAnswers.value, [question.id]: { ...currentAnswer, values: newValues } }
    }
    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsMultiTrueFalse}`}>
            {question.items.map(item => {
                const optionId = item.id
                const answer = currentAnswer.values[optionId]
                return (
                    <div key={item.id}>
                        <label>{item.statement}</label>
                        <br></br>
                        <div className={styles.trueFalseOptions}>
                            <div role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onValueChange(optionId, false)} onClick={() => onValueChange(optionId, false)}><img src={answer === false ? wrongColored : wrong} /><p>False</p></div>
                            <div role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onValueChange(optionId, true)} onClick={() => onValueChange(optionId, true)}><img src={answer === true ? correctColored : correct} /><p>True</p></div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
function SortingView({ question }: { question: SortingQuestion }) {
    let currentAnswer = quizAnswers.value[question.id]
    if (!currentAnswer) {
        const shuffledIds = shuffle(question.items.map(x => x.id), question.prompt)
        const initialAnswer = { type: "sorting" as const, sortedIds: shuffledIds }
        quizAnswers.value = { ...quizAnswers.value, [question.id]: initialAnswer }
        currentAnswer = initialAnswer
    }
    if (currentAnswer.type !== 'sorting') return;
    const displayItems = currentAnswer.sortedIds.map(id => {
        return question.items.find(x => x.id === id)
    })
    function moveItem(index: number, direction: 'up' | 'down') {
        if (currentAnswer.type !== 'sorting') return;
        const newSortedIds = [...currentAnswer.sortedIds]
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSortedIds.length) {
            return
        }
        const temp = newSortedIds[targetIndex]
        newSortedIds[targetIndex] = newSortedIds[index]
        newSortedIds[index] = temp

        quizAnswers.value = {
            ...quizAnswers.value, [question.id]: {
                ...currentAnswer, sortedIds: newSortedIds
            }
        }
    }

    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsSorting}`}>
            {displayItems.map((item, index) => {
                if (!item) return
                return (
                    <div key={item.id}>
                        <p><span>{index + 1}.</span> {item.text}</p>
                        <div className={styles.upDownArrows}>
                            <img role='button' tabIndex={0} onClick={() => moveItem(index, 'up')} src={upArrow} />
                            <img role='button' tabIndex={0} onClick={() => moveItem(index, 'down')} src={downArrow} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
function FillInBlanksView({ question }: { question: FillInBlanksQuestion }) {
    const currentAnswer = quizAnswers.value[question.id] || {
        type: 'fill-in-blanks',
        values: {}
    }
    if (currentAnswer.type !== 'fill-in-blanks') return;
    function fillBlank(blankId: number, value: string) {
        if (currentAnswer.type !== 'fill-in-blanks') return;
        const newBlankValues = { ...currentAnswer.values }
        newBlankValues[blankId] = value
        quizAnswers.value = {
            ...quizAnswers.value, [question.id]: {
                ...currentAnswer, values: newBlankValues
            }
        }

    }
    const parts = question.content.split(/(\{\{\d+\}\})/g);
    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsFillInBlanks}`}>
            <p className={styles.blankParagraph}>
                {parts.map((part, index) => {
                    // Check if the current part is a placeholder like {{1}}
                    const match = part.match(/\{\{(\d+)\}\}/);
                    if (match) {
                        const blankId = parseInt(match[1]);
                        const blankValue = currentAnswer.values[blankId] || ""

                        return (
                            <input
                                key={index}
                                type="text"
                                className={styles.inlineInput}
                                placeholder={`...`}
                                value={blankValue}
                                onChange={(e) => { fillBlank(blankId, e.target.value) }}
                            />
                        );
                    }

                    // Otherwise, just return the text
                    return <span key={index}>{part}</span>;
                })}
            </p>
        </div>
    );
}
function renderQuizOptions(question: QuizQuestion) {
    switch (question.type) {
        case 'multiple-choice':
            return <MultipleChoiceView question={question} />
        case 'matching':
            return <MatchingView question={question} />
        case 'multi-true-false':
            return <MultiTrueFalseView question={question} />
        case 'sorting':
            return <SortingView question={question} />
        case 'fill-in-blanks': {
            return <FillInBlanksView question={question} />
        }
        default:
            return null;
    }
}

function isAnswerCorrect(question: QuizQuestion, answer: QuizAnswer): boolean {

    let isCorrect = false;
    if (!answer) return isCorrect

    if (answer.type === 'fill-in-blanks' && question.type === 'fill-in-blanks') {
        for (const key of Object.keys(answer.values)) {
            const blankId = Number(key)
            const correctValue = question.blanks.find(x => x.id === blankId)?.correctAnswer
            isCorrect = answer.values[blankId] === correctValue
            if (!isCorrect) break
        }
    }
    if (answer.type === 'sorting' && question.type === 'sorting') {
        const correctSort = question.items.map(x => x.id)
        const userSort = answer.sortedIds
        if (correctSort.length === userSort.length) {
            isCorrect = correctSort.every((value, index) => value === userSort[index])
        }

    }
    if (answer.type === 'multi-true-false' && question.type === 'multi-true-false') {
        for (const item of question.items) {
            isCorrect = answer.values[item.id] === item.isTrue;
            if (!isCorrect) break
        }
    }
    if (answer.type === 'matching' && question.type === 'matching') {
        for (const pair of question.pairs) {
            isCorrect = answer.pairs[pair.id] === pair.right
            if (!isCorrect) break
        }
    }
    if (answer.type === 'multiple-choice' && question.type === 'multiple-choice') {
        for (const option of question.options) {
            isCorrect = !!answer.values[option.id] === option.isCorrect
            if (!isCorrect) break
        }
    }
    return isCorrect
}

function answer() {
    if (!currentQuiz.value) return
    const question = currentQuiz.value.questions[currentQuestionIndex.value]
    let answer = quizAnswers.value[question.id]
    const isCorrect = isAnswerCorrect(question, answer)
    /* answerResults.value = { ...answerResults.value, [question.id]: isCorrect } */
    quizAnswers.value = { ...quizAnswers.value, [question.id]: { ...quizAnswers.value[question.id], isCorrect: isCorrect } }
    localStorage.setItem(LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY, JSON.stringify(quizAnswers.value))
}
function QuestionNavigationAndProgressIndicatorView() {
    if (!currentQuiz.value) return
    return (<>
        <div className={styles.questionButtons}>
            {currentQuiz.value.questions.map((question, index) => {
                const answer = quizAnswers.value[question.id]?.isCorrect
                let buttonClassName = styles.questionButtonNoAnswer
                if (answer !== undefined) {
                    const isAnsweredCorrectly = answer
                    buttonClassName = isAnsweredCorrectly ? styles.questionButtonCorrect : styles.questionButtonWrong
                    if (!instantFeedbackEnabled.value) {
                        buttonClassName = styles.questionButtonAnswered
                    }
                }

                if (index === currentQuestionIndex.value) {
                    buttonClassName += ` ${styles.questionButtonSelected}`
                }
                return (<button onClick={() => currentQuestionIndex.value = index} className={buttonClassName} key={index}>
                    {index + 1}
                </button>)
            })}
        </div></>)
}

function saveAnswersToLocalStorage() {

}

import { LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY, LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY } from '../../common/config';
const showExplanation = signal<boolean>(false)
export default function Quiz() {
    const navigate = useNavigate();
    useEffect(() => {
        if (!currentQuiz.value) {
            const currentQuizRaw = localStorage.getItem(LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY)
            if (currentQuizRaw) {
                currentQuiz.value = JSON.parse(currentQuizRaw)
                // Also reset the index to 0 when loading a new quiz
                currentQuestionIndex.value = 0;
            } else {
                // If there's truly no quiz data anywhere, go home
                navigate("/");
            }
        }
        if (Object.keys(quizAnswers.value).length === 0) {
            const quizAnswersRaw = localStorage.getItem(LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY)
            quizAnswers.value = JSON.parse(quizAnswersRaw || '{}')
        }
    }, []);
    useEffect(() => {
        showExplanation.value = false
    }, [currentQuestionIndex.value])

    if (!currentQuiz.value) return

    const question: QuizQuestion = currentQuiz.value.questions[currentQuestionIndex.value];
    if (!question) return
    const answerResult = quizAnswers.value[question.id]?.isCorrect
    let shouldShowExplanation = false
    let answerStyleClass = styles.noAnswer;
    let answerResultMessage = "";

    if (answerResult !== undefined) {
        if (answerResult) {
            answerStyleClass = styles.correct
            answerResultMessage = "Correct!"
            shouldShowExplanation = true

        } else {
            answerStyleClass = styles.wrong
            answerResultMessage = "Wrong Answer :("
            shouldShowExplanation = showExplanation.value

        }
        answerStyleClass = answerResult ? styles.correct : styles.wrong
    }
    return (
        <div className={styles.container}>
            <div className={`${styles.quiz} ${answerStyleClass}`}>
                <QuestionNavigationAndProgressIndicatorView />
                <div>
                    <h1>{question.prompt}</h1>
                </div>
                {renderQuizOptions(question)}
                <div className={styles.questionNavigationButtons}>
                    <button onClick={previous}>Previous</button>
                    <button onClick={next}>Next</button>
                    <button onClick={answer}>Answer</button>
                    {/* <button onClick={() => isFinished.value = true}>Finish</button> */}
                    <button onClick={() => navigate('/quiz-grade')}>Finish</button>
                    <button onClick={() => instantFeedbackEnabled.value = !instantFeedbackEnabled.value}>Instant feedback {instantFeedbackEnabled.value ? 'Off' : 'On'}</button>
                    <button onClick={() => navigate('/quiz-edit')}>Edit</button>
                </div>
                {instantFeedbackEnabled.value && <div className={`${styles.answerResult} ${answerStyleClass}`}>
                    <h1>{answerResultMessage}</h1>
                    <h2>{shouldShowExplanation && question.explanation}</h2>
                    {question.explanation && !showExplanation.value && answerResult === false && <button onClick={() => showExplanation.value = true}>Show Explanation</button>}
                </div>}

            </div>
        </div>
    )
}
