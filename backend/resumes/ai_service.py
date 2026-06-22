"""
AI Resume Analyzer Service

Uses OpenAI GPT to analyze a candidate's resume text against a job description.
Returns a structured JSON response with:
  - match_score (0-100)
  - strengths (list)
  - weaknesses (list)
  - missing_skills (list)
  - suggestions (list)
"""

import os
import json
import logging

import openai
from django.conf import settings
from decouple import config

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_file_path: str) -> str:
    """
    Extracts plain text from a PDF file.
    Falls back to raw binary extraction if PyPDF2 is unavailable.
    """
    try:
        import PyPDF2
        text = []
        with open(pdf_file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        return '\n'.join(text)
    except ImportError:
        logger.warning("PyPDF2 not installed. Using raw text extraction fallback.")
        try:
            with open(pdf_file_path, 'rb') as f:
                content = f.read()
                return content.decode('latin-1', errors='ignore')
        except Exception as e:
            logger.error(f"Failed to read PDF: {e}")
            return ""


def analyze_resume_against_job(resume_text: str, job_description: str) -> dict:
    """
    Calls OpenAI API to analyze resume vs job description.
    Returns a structured dict with scores and recommendations.
    """
    api_key = config('OPENAI_API_KEY', default='')
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in environment variables.")

    client = openai.OpenAI(api_key=api_key)

    system_prompt = """
You are an expert AI career coach and talent acquisition specialist.
Your task is to analyze a candidate's resume against a job description and provide detailed feedback.
You must ALWAYS respond with a valid JSON object. Do NOT include markdown or code blocks.

JSON Response Format:
{
  "match_score": <integer 0-100>,
  "strengths": [<list of strings describing what the candidate does well for this role>],
  "weaknesses": [<list of strings describing gaps or concerns>],
  "missing_skills": [<list of specific skills/technologies the job requires but resume lacks>],
  "suggestions": [<list of actionable advice to improve candidacy>]
}
"""

    user_prompt = f"""
RESUME TEXT:
---
{resume_text[:4000]}
---

JOB DESCRIPTION:
---
{job_description[:3000]}
---

Analyze the resume against the job description and return a structured JSON response.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            temperature=0.3,
        )
        raw_content = response.choices[0].message.content.strip()
        # Strip potential markdown code fences
        if raw_content.startswith("```"):
            raw_content = raw_content.split("```")[1]
            if raw_content.startswith("json"):
                raw_content = raw_content[4:]
        result = json.loads(raw_content)
        return result
    except json.JSONDecodeError as e:
        logger.error(f"AI response JSON parse error: {e}")
        return {
            "match_score": 0,
            "strengths": [],
            "weaknesses": ["Unable to parse AI analysis."],
            "missing_skills": [],
            "suggestions": ["Please try again later."]
        }
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise


def compute_skill_match_score(candidate_skills: list, job_skills: list) -> dict:
    """
    Simple keyword-based skill match score (no AI cost).
    Used when AI is unavailable or as a quick pre-filter.
    """
    if not job_skills:
        return {"score": 0, "matched": [], "missing": []}

    candidate_set = {s.lower().strip() for s in candidate_skills}
    job_set = {s.lower().strip() for s in job_skills}

    matched = candidate_set.intersection(job_set)
    missing = job_set - candidate_set

    score = int((len(matched) / len(job_set)) * 100) if job_set else 0
    return {
        "score": score,
        "matched": list(matched),
        "missing": list(missing)
    }
