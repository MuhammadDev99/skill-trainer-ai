import { signal } from '@preact/signals-react';
import styles from './style.module.css'
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import hooks


import { currentQuiz, quizAnswers } from '../../store/quizStore';
import { LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY } from '../../common/config';
export default function QuizGrade() {
    if (!currentQuiz.value) return
    const navigate = useNavigate();
    const questions = currentQuiz.value.questions;
    const questionIds = questions.map(x => x.id)
    const totalQuestions = questionIds.length
    let gradesText = ''
    let correctAnswers = 0
    let wrongAnswers = 0
    let unAnswered = 0
    let gradeWord = 'Unknown'
    for (const question of questions) {
        const result = quizAnswers.value[question.id]?.result?.isCorrect;

        if (result === true) {
            correctAnswers++;
        } else if (result === false) {
            wrongAnswers++;
        } else {
            unAnswered++;
        }
    }
    const correctPercentage = totalQuestions === 0 ? 0 : ((correctAnswers / totalQuestions) * 100)
    if (correctPercentage >= 100) {
        gradeWord = 'Excellent'
    } else if (correctPercentage >= 80) {
        gradeWord = 'Great'
    } else if (correctPercentage >= 60) {
        gradeWord = 'Good'
    } else if (correctPercentage >= 50) {
        gradeWord = 'Not bad'
    } else if (correctPercentage >= 30) {
        gradeWord = 'Bad'
    } else if (correctPercentage >= 0) {
        gradeWord = 'Shit'
    }
    gradesText = `Correct: ${correctAnswers}
Wrong: ${wrongAnswers}
Unanswered: ${unAnswered}

Score is ${gradeWord}: ${correctPercentage.toFixed(2)}%`

    function retakeQuiz() {
        quizAnswers.value = {}
        localStorage.removeItem(LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY)
        navigate('/quiz')
    }
    return (<div className={styles.gradesContainer}>
        <h1>{gradesText}</h1>
        <div className={styles.gradesNavigationButtons}>
            <button onClick={() => navigate('/quiz')}>Go back</button>
            <button onClick={() => navigate('/generate-questions')}>Generate another quiz</button>
            <button onClick={retakeQuiz}>Retake Quiz</button>
        </div>
    </div>)
}
