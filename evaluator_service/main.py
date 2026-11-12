import os
import json
import re
from typing import List, Optional, Any, Dict
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
INTERNAL_SERVICE_KEY = os.getenv("INTERNAL_SERVICE_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found. AI features will be unavailable.")
else:
    genai.configure(api_key=GEMINI_API_KEY, transport="rest")

app = FastAPI(title="InterviewPrep AI Evaluator Service", version="1.0.0")

# Security: Internal service key verification dependency
def verify_internal_key(x_internal_service_key: Optional[str] = Header(None)):
    if INTERNAL_SERVICE_KEY:
        if not x_internal_service_key or x_internal_service_key != INTERNAL_SERVICE_KEY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Invalid or missing internal service key."
            )
    return True

# CORS configuration - strict origins without wildcard
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
backend_url = os.getenv("BACKEND_URL", "http://localhost:5000")
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")

if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [frontend_url, backend_url]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Request & Response Schemas
class QuestionRequest(BaseModel):
    role: str
    experience_level: Optional[str] = "mid-level"
    num_questions: int = Field(default=5, ge=1, le=20)


class Question(BaseModel):
    id: int
    text: str


class AnswerEvaluationRequest(BaseModel):
    question: str
    answer: str
    role: str = "general"
    experience_level: Optional[str] = "mid-level"


class EvaluationResult(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    feedback: str


class InterviewHistoryItem(BaseModel):
    question: str
    answer: str


class EvaluateAndNextRequest(BaseModel):
    current_question: str
    current_answer: str
    role: str = "general"
    experience_level: Optional[str] = "mid-level"
    history: List[InterviewHistoryItem] = []
    current_difficulty: int = Field(default=5, ge=1, le=10)


class EvaluateAndNextResponse(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    feedback: str
    next_question: str
    is_cross_question: bool
    current_difficulty: int
    contains_code: bool
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None


class GenerateTextRequest(BaseModel):
    prompt: str


class GenerateTextResponse(BaseModel):
    text: str


class GenerateJsonRequest(BaseModel):
    prompt: str


def clean_json_text(raw_text: str) -> str:
    """Removes markdown code fences if model enclosed JSON inside ```json ... ```."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL,
        "internal_auth_enabled": bool(INTERNAL_SERVICE_KEY)
    }


@app.post("/fetch-questions", response_model=List[Question], dependencies=[Depends(verify_internal_key)])
async def fetch_questions(request: QuestionRequest):
    """
    Fetches role-based interview questions using Gemini AI.
    Preserves requested question count and experience level.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured on the server."
        )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = (
            f"You are an expert technical interviewer. Generate exactly {request.num_questions} "
            f"distinct technical interview questions for a '{request.role}' role at {request.experience_level} level. "
            f"Questions should be clear, practical, and assess real-world knowledge. "
            f"Return ONLY the questions, one per line, with no numbering, bullets, or commentary."
        )
        response = model.generate_content(prompt)
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Empty response received from AI model."
            )

        raw_lines = [
            line.strip() for line in response.text.strip().split("\n")
            if line.strip() and not line.strip().startswith("#")
        ]

        # Strip any leading numbers like "1. ", "1) " if model generated them
        filtered_lines = [re.sub(r"^\d+[\.\)]\s*", "", line) for line in raw_lines if line]

        questions = [
            Question(id=i + 1, text=line_text)
            for i, line_text in enumerate(filtered_lines)
        ]

        # Trim to requested count
        questions = questions[:request.num_questions]

        if not questions:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to extract valid questions from model response."
            )

        return questions

    except HTTPException:
        raise
    except Exception as e:
        print(f"[EvaluatorService] Error fetching questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate questions from AI: {str(e)}"
        )


@app.post("/evaluate-answer", response_model=EvaluationResult, dependencies=[Depends(verify_internal_key)])
async def evaluate_answer(request: AnswerEvaluationRequest):
    """
    Evaluates a candidate's answer using Gemini AI.
    Returns a score (0.0-1.0) and constructive feedback without silent fabricated defaults.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured on the server."
        )

    # Short or blank answer validation
    if not request.answer or len(request.answer.strip()) < 5:
        return EvaluationResult(
            score=0.0,
            feedback="No meaningful answer was provided. Please provide a substantive response."
        )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = f"""You are an expert technical interviewer evaluating a candidate's response.

Role: {request.role}
Experience Level: {request.experience_level}
Interview Question: "{request.question}"
Candidate's Answer: "{request.answer}"

Evaluate the answer thoroughly based on technical accuracy, completeness, and clarity.
Return ONLY a valid JSON object with the following schema:
{{
  "score": <float between 0.0 and 1.0>,
  "feedback": "<2-3 sentences of constructive feedback explaining the score>"
}}"""

        response = model.generate_content(prompt)
        cleaned = clean_json_text(response.text)
        data = json.loads(cleaned)

        raw_score = float(data.get("score", 0.0))
        score = max(0.0, min(1.0, round(raw_score, 2)))
        feedback = str(data.get("feedback", "No feedback provided.")).strip()

        return EvaluationResult(score=score, feedback=feedback)

    except HTTPException:
        raise
    except json.JSONDecodeError as jde:
        print(f"[EvaluatorService] JSON parse error in evaluate_answer: {jde}")
        # Parse fallback from line format if JSON decode fails
        try:
            raw_text = response.text.strip()
            score_match = re.search(r"score\s*[:=]\s*([0-1]?\.\d+)", raw_text, re.IGNORECASE)
            feedback_match = re.search(r"feedback\s*[:=]\s*(.*)", raw_text, re.IGNORECASE | re.DOTALL)
            if score_match:
                score = max(0.0, min(1.0, float(score_match.group(1))))
                feedback = feedback_match.group(1).strip() if feedback_match else "Evaluation completed."
                return EvaluationResult(score=score, feedback=feedback)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Model returned invalid JSON format for answer evaluation."
        )
    except Exception as e:
        print(f"[EvaluatorService] Error evaluating answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to evaluate answer with AI: {str(e)}"
        )


@app.post("/evaluate-and-next", response_model=EvaluateAndNextResponse, dependencies=[Depends(verify_internal_key)])
async def evaluate_and_next(request: EvaluateAndNextRequest):
    """
    Evaluates candidate's answer and generates next adaptive question dynamically.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured on the server."
        )

    # Consistent short/empty answer validation
    if not request.current_answer or len(request.current_answer.strip()) < 5:
        return EvaluateAndNextResponse(
            score=0.0,
            feedback="No meaningful answer was provided.",
            next_question="Could you please provide a substantive answer to the question?",
            is_cross_question=True,
            current_difficulty=max(1, request.current_difficulty - 1),
            contains_code=False,
            time_complexity=None,
            space_complexity=None
        )

    history_text = ""
    if request.history:
        history_text = "Previous Interview History:\n"
        for i, item in enumerate(request.history):
            history_text += f"Q{i+1}: {item.question}\nA{i+1}: {item.answer}\n\n"

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = f"""You are an expert technical interviewer evaluating a candidate for a '{request.role}' role at {request.experience_level} level.

{history_text}
Current Question: "{request.current_question}"
Candidate's Answer: "{request.current_answer}"
Current Difficulty Level: {request.current_difficulty}/10

Tasks:
1. Evaluate the answer based on accuracy, completeness, and clarity.
2. Determine if the answer contains code or algorithmic logic; if so, identify Time and Space complexity.
3. Formulate the NEXT question:
   - If current answer was weak or incomplete, ask a clarifying follow-up (cross-question); difficulty remains same or decreases slightly.
   - If answer was strong, move to a new topic; difficulty increases slightly (max 10).
   - Do NOT repeat questions from the history.

Return ONLY a valid JSON object with the following schema:
{{
  "score": <float between 0.0 and 1.0>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "next_question": "<the exact text of the next question>",
  "is_cross_question": <true or false>,
  "new_difficulty": <integer between 1 and 10>,
  "contains_code": <true or false>,
  "time_complexity": <string or null>,
  "space_complexity": <string or null>
}}"""

        response = model.generate_content(prompt)
        cleaned = clean_json_text(response.text)
        data = json.loads(cleaned)

        raw_score = float(data.get("score", 0.0))
        score = max(0.0, min(1.0, round(raw_score, 2)))
        feedback = str(data.get("feedback", "Evaluation completed.")).strip()
        next_question = str(data.get("next_question", "Can you explain another technical project you worked on?")).strip()
        is_cross_question = bool(data.get("is_cross_question", False))
        new_difficulty = max(1, min(10, int(data.get("new_difficulty", request.current_difficulty))))
        contains_code = bool(data.get("contains_code", False))
        time_complexity = data.get("time_complexity")
        space_complexity = data.get("space_complexity")

        return EvaluateAndNextResponse(
            score=score,
            feedback=feedback,
            next_question=next_question,
            is_cross_question=is_cross_question,
            current_difficulty=new_difficulty,
            contains_code=contains_code,
            time_complexity=time_complexity if time_complexity != "N/A" else None,
            space_complexity=space_complexity if space_complexity != "N/A" else None
        )

    except HTTPException:
        raise
    except json.JSONDecodeError as jde:
        print(f"[EvaluatorService] JSON parse error in evaluate_and_next: {jde}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Model returned invalid JSON format for adaptive evaluation."
        )
    except Exception as e:
        print(f"[EvaluatorService] Error in evaluate_and_next: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to process adaptive evaluation with AI: {str(e)}"
        )


@app.post("/generate-text", response_model=GenerateTextResponse, dependencies=[Depends(verify_internal_key)])
async def generate_text(request: GenerateTextRequest):
    """
    Central AI text generation endpoint for general tasks (FAQ, summaries).
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured on the server."
        )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(request.prompt)
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Empty response received from AI model."
            )
        return GenerateTextResponse(text=response.text.strip())
    except HTTPException:
        raise
    except Exception as e:
        print(f"[EvaluatorService] Error in generate_text: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate text: {str(e)}"
        )


@app.post("/generate-json", dependencies=[Depends(verify_internal_key)])
async def generate_json(request: GenerateJsonRequest):
    """
    Central AI JSON generation endpoint for structured tasks (Roadmap, Resume Analysis, Reviews).
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured on the server."
        )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(request.prompt)
        cleaned = clean_json_text(response.text)
        return json.loads(cleaned)
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Model response was not valid JSON."
        )
    except Exception as e:
        print(f"[EvaluatorService] Error in generate_json: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate structured JSON: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
