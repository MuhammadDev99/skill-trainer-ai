import { BrowserRouter, Routes, Route } from "react-router"
import { Quiz, Home, GenerateQuestions, QuizGrade, QuizEdit } from './pages'
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/generate-questions" element={<GenerateQuestions />} />
                <Route path="/quiz-grade" element={<QuizGrade />} />
                <Route path="/quiz-edit" element={<QuizEdit />} />
            </Routes>
        </BrowserRouter>
    )
}