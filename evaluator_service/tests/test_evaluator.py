import os
import sys
import pytest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

# Ensure evaluator_service root is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import main

@pytest.mark.asyncio
async def test_health_check():
    """Verify health endpoint reports system status."""
    res = main.health_check()
    assert res["status"] == "ok"
    assert "gemini_configured" in res
    assert "model" in res
    assert "internal_auth_enabled" in res


@pytest.mark.asyncio
async def test_internal_service_key_security():
    """Verify verify_internal_key rejects missing or invalid keys and allows valid keys."""
    # Invalid key
    with pytest.raises(HTTPException) as exc_info:
        main.verify_internal_key(x_internal_service_key="wrong-key")
    assert exc_info.value.status_code == 403
    assert "Forbidden" in exc_info.value.detail

    # Missing key
    with pytest.raises(HTTPException) as exc_info:
        main.verify_internal_key(x_internal_service_key=None)
    assert exc_info.value.status_code == 403

    # Valid key
    assert main.verify_internal_key(x_internal_service_key=main.INTERNAL_SERVICE_KEY) is True


@pytest.mark.asyncio
async def test_short_answer_validation():
    """Verify short or empty answers return score 0.0 honestly without calling Gemini."""
    # Blank answer
    res_blank = await main.evaluate_answer(
        main.AnswerEvaluationRequest(question="Explain CORS", answer="   ", role="web")
    )
    assert res_blank.score == 0.0
    assert "No meaningful answer" in res_blank.feedback

    # Very short answer (< 5 chars)
    res_short = await main.evaluate_answer(
        main.AnswerEvaluationRequest(question="Explain CORS", answer="idk", role="web")
    )
    assert res_short.score == 0.0


@pytest.mark.asyncio
async def test_evaluate_and_next_short_answer_guard():
    """Verify evaluate-and-next handles short answers with honest 0.0 and follow-up prompt."""
    res = await main.evaluate_and_next(
        main.EvaluateAndNextRequest(
            current_question="Explain QuickSort",
            current_answer="abc",
            role="software-engineer",
            current_difficulty=5
        )
    )
    assert res.score == 0.0
    assert res.is_cross_question is True
    assert res.current_difficulty == 4  # decremented from 5
    assert "substantive answer" in res.next_question


@pytest.mark.asyncio
async def test_fetch_questions_contiguous_ids_and_count():
    """Verify question IDs are 1-based, contiguous, and respect num_questions."""
    mock_model = MagicMock()
    mock_model.generate_content.return_value = SimpleNamespace(
        text=(
            "# Questions for Backend\n"
            "1. How does node event loop work?\n"
            "2. Explain database indexing strategies.\n"
            "3. How do you handle cache invalidation?\n"
            "\n"
            "4. What is connection pooling?"
        )
    )
    with patch.object(main.genai, "GenerativeModel", return_value=mock_model):
        questions = await main.fetch_questions(
            main.QuestionRequest(role="backend-developer", num_questions=3)
        )
        assert len(questions) == 3
        # Check IDs are contiguous 1, 2, 3 (fixing the off-by-one header shift)
        assert questions[0].id == 1
        assert "event loop" in questions[0].text
        assert questions[1].id == 2
        assert "indexing" in questions[1].text
        assert questions[2].id == 3
        assert "cache" in questions[2].text


@pytest.mark.asyncio
async def test_structured_evaluation_parsing():
    """Verify structured JSON output parsing in evaluate-answer."""
    mock_model = MagicMock()
    mock_model.generate_content.return_value = SimpleNamespace(
        text='{"score": 0.85, "feedback": "Solid understanding of event-driven architecture."}'
    )
    with patch.object(main.genai, "GenerativeModel", return_value=mock_model):
        res = await main.evaluate_answer(
            main.AnswerEvaluationRequest(
                question="Explain Node event loop",
                answer="Node.js uses an event loop with phases to execute callbacks asynchronously.",
                role="backend-developer"
            )
        )
        assert res.score == 0.85
        assert "Solid understanding" in res.feedback


@pytest.mark.asyncio
async def test_no_silent_fallback_on_model_failure():
    """Verify AI model failures return 502/503 HTTP errors instead of silent 0.5 scores."""
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("Google upstream API timeout")
    with patch.object(main.genai, "GenerativeModel", return_value=mock_model):
        with pytest.raises(HTTPException) as exc_info:
            await main.evaluate_answer(
                main.AnswerEvaluationRequest(
                    question="What is ACID?",
                    answer="Atomicity, Consistency, Isolation, and Durability in DBMS transactions.",
                    role="database-engineer"
                )
            )
        assert exc_info.value.status_code == 502
        assert "Failed to evaluate answer" in exc_info.value.detail


@pytest.mark.asyncio
async def test_central_ai_gateway_generate_text_and_json():
    """Verify generate-text and generate-json endpoints execute correctly."""
    mock_model = MagicMock()
    mock_model.generate_content.return_value = SimpleNamespace(
        text='{"roadmap": ["Topic 1", "Topic 2"]}'
    )
    with patch.object(main.genai, "GenerativeModel", return_value=mock_model):
        json_res = await main.generate_json(main.GenerateJsonRequest(prompt="Create roadmap"))
        assert "roadmap" in json_res
        assert len(json_res["roadmap"]) == 2

    mock_model.generate_content.return_value = SimpleNamespace(
        text="A concise summary of the topic."
    )
    with patch.object(main.genai, "GenerativeModel", return_value=mock_model):
        text_res = await main.generate_text(main.GenerateTextRequest(prompt="Summarize"))
        assert text_res.text == "A concise summary of the topic."


if __name__ == "__main__":
    import asyncio
    async def run_all():
        print("Running evaluator unit & integration tests...")
        await test_health_check()
        print("  [PASS] test_health_check")
        await test_internal_service_key_security()
        print("  [PASS] test_internal_service_key_security")
        await test_short_answer_validation()
        print("  [PASS] test_short_answer_validation")
        await test_evaluate_and_next_short_answer_guard()
        print("  [PASS] test_evaluate_and_next_short_answer_guard")
        await test_fetch_questions_contiguous_ids_and_count()
        print("  [PASS] test_fetch_questions_contiguous_ids_and_count")
        await test_structured_evaluation_parsing()
        print("  [PASS] test_structured_evaluation_parsing")
        await test_no_silent_fallback_on_model_failure()
        print("  [PASS] test_no_silent_fallback_on_model_failure")
        await test_central_ai_gateway_generate_text_and_json()
        print("  [PASS] test_central_ai_gateway_generate_text_and_json")
        print("\nSUCCESS: All 8 evaluator service regression tests passed!")

    asyncio.run(run_all())

