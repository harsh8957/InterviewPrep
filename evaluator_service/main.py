import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found. AI features will be unavailable.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="EchoPrep Evaluator Service")

# Allow requests from the frontend dev server and backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    role: str
    num_questions: int = 5


class AnswerEvaluationRequest(BaseModel):
    question: str
    answer: str
    role: str = "general"


class Question(BaseModel):
    id: int
    text: str


class EvaluationResult(BaseModel):
    score: float
    feedback: str


@app.get("/health")
def health_check():
    return {"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)}


@app.post("/fetch-questions", response_model=list[Question])
async def fetch_questions(request: QuestionRequest):
    """
    Fetches role-based interview questions using Gemini AI.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured on the server.")

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = (
            f"You are an expert technical interviewer. Generate exactly {request.num_questions} "
            f"interview questions for a '{request.role}' role. "
            f"Questions should be clear, practical, and assess real-world knowledge. "
            f"Return ONLY the questions, one per line, with no numbering, bullets, or extra text."
        )
        response = model.generate_content(prompt)

        raw_lines = response.text.strip().split('\n')
        questions = [
            Question(id=i + 1, text=line.strip())
            for i, line in enumerate(raw_lines)
            if line.strip() and not line.strip().startswith('#')
        ]

        # Trim to requested count
        questions = questions[:request.num_questions]

        if not questions:
            raise HTTPException(status_code=500, detail="Gemini returned empty questions list.")

        return questions

    except HTTPException:
        raise
    except Exception as e:
        print(f"[EvaluatorService] Error fetching questions from Gemini: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate questions from AI: {str(e)}"
        )


@app.post("/evaluate-answer", response_model=EvaluationResult)
async def evaluate_answer(request: AnswerEvaluationRequest):
    """
    Evaluates a candidate's answer using Gemini AI.
    Returns a score (0.0-1.0) and detailed feedback.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured on the server.")

    if not request.answer or len(request.answer.strip()) < 5:
        return EvaluationResult(score=0.0, feedback="No meaningful answer was provided.")

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"""You are an expert technical interviewer evaluating a candidate's response.

Interview Question: "{request.question}"
Candidate's Answer: "{request.answer}"
Job Role Context: "{request.role}"

Evaluate the answer based on:
1. Accuracy and correctness
2. Completeness and depth
3. Clarity and communication
4. Relevance to the role

Respond in EXACTLY this format (do not add anything else):
Score: [a decimal between 0.0 and 1.0]
Feedback: [2-3 sentences of constructive feedback explaining the score]"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Parse Score
        score = 0.5  # default fallback
        feedback = "Unable to parse detailed feedback."

        lines = response_text.split('\n')
        for i, line in enumerate(lines):
            if line.startswith("Score:"):
                try:
                    score_str = line.replace("Score:", "").strip()
                    score = float(score_str)
                    score = max(0.0, min(1.0, score))  # clamp to [0,1]
                except ValueError:
                    pass
            elif line.startswith("Feedback:"):
                # Grab all remaining lines as feedback (handles multiline)
                feedback_parts = [line.replace("Feedback:", "").strip()]
                for remaining in lines[i + 1:]:
                    if remaining.strip():
                        feedback_parts.append(remaining.strip())
                feedback = " ".join(feedback_parts).strip()
                break

        return EvaluationResult(score=score, feedback=feedback)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[EvaluatorService] Error evaluating answer with Gemini: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate answer with AI: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)