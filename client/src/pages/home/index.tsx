import { useNavigate } from "react-router-dom";
import styles from "./style.module.css"
import { LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY, QUIZES_DATA_LOCALSTORAGE_KEY } from "../../common/config";
import type { QuizData } from "../../common/types";
import { signal } from "@preact/signals-react";
import { useEffect } from "react";

function getQuizes(): QuizData[] {
    const quizes_raw = localStorage.getItem(QUIZES_DATA_LOCALSTORAGE_KEY) || '[]'
    const quizes = JSON.parse(quizes_raw)
    return quizes
}
const quizes = signal<QuizData[]>([])
import { currentQuiz } from '../../store/quizStore'
import { navigateToQuiz } from "../../utils";
export default function Home() {
    useEffect(() => {
        quizes.value = getQuizes()
    }, [])
    const navigate = useNavigate();
    function onSelectQuiz(quiz: QuizData) {
        navigateToQuiz(navigate, quiz)
    }
    function onDeleteQuiz(quiz: QuizData) {
        quizes.value = quizes.value.filter(x => x !== quiz)
        localStorage.setItem(QUIZES_DATA_LOCALSTORAGE_KEY, JSON.stringify(quizes.value))
    }
    function onEditQuiz(quiz: QuizData) {
        currentQuiz.value = quiz;
        localStorage.setItem(LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY, JSON.stringify(quiz))
        navigate("/quiz-edit")
    }
    return (<div className={styles.container}>
        <div className={styles.quizes}>
            <h2>{quizes.value.length === 0 ? "Generate a quiz to get started" : "Select a quiz or generate one!"}</h2>
            <div className={styles.quizSelectors}>
                {quizes.value.map((quiz, index) => {
                    return (<div className={styles.quizSelector} key={index}>
                        <button className={styles.quizSelectorButton} onClick={() => onSelectQuiz(quiz)}>{quiz.learningPath}</button>
                        <button className={styles.quizDeleteButton} onClick={() => onDeleteQuiz(quiz)}>Delete</button>
                        <button className={styles.quizEditButton} onClick={() => onEditQuiz(quiz)}>Edit</button>
                    </div>)
                })}
            </div>
        </div>
        <div className={styles.actionButtons}>
            <button onClick={() => navigate("/generate-questions")}>Generate Quiz</button>
        </div>
    </div>)
}