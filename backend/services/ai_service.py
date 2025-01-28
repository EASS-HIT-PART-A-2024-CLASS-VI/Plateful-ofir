from fastapi import HTTPException
from pydantic import BaseModel
from pydantic_ai import Agent
import os
from dotenv import load_dotenv
from googletrans import Translator, LANGUAGES
import asyncio
import re

# Load environment variables from .env
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing. Add it to your .env file.")

# Initialize AI agent
agent = Agent(
    'gemini-1.5-flash',
    system_prompt='You are a recipe assistant. Generate recipes in Hebrew using proper Hebrew characters. Format ingredients and instructions clearly.'
)

# Initialize translator with fallback
translator = Translator()

class IngredientsRequest(BaseModel):
    ingredients: list[str]

class RecipeRequest(BaseModel):
    ingredients: list[str]

class CookingQuestionRequest(BaseModel):
    question: str

def is_hebrew(text: str) -> bool:
    """Check if text contains Hebrew characters"""
    hebrew_pattern = re.compile(r'[\u0590-\u05FF\uFB1D-\uFB4F]')
    return bool(hebrew_pattern.search(text))

def validate_hebrew_response(text: str) -> bool:
    """Validate if the response contains a meaningful amount of Hebrew text"""
    hebrew_chars = len(re.findall(r'[\u0590-\u05FF\uFB1D-\uFB4F]', text))
    total_chars = len(text.strip())
    return hebrew_chars / total_chars > 0.3 if total_chars > 0 else False

async def translate_text(text: str, src="auto", dest="en", max_retries=3) -> str:
    """Helper function to handle async translation with retries and validation"""
    for attempt in range(max_retries):
        try:
            # If text is already in Hebrew and dest is Hebrew, return as is
            if dest == "he" and is_hebrew(text):
                return text
            
            translation = await translator.translate(text, src=src, dest=dest)
            translated_text = translation.text

            # Validate Hebrew output if that's the target language
            if dest == "he" and not validate_hebrew_response(translated_text):
                if attempt == max_retries - 1:
                    raise ValueError("Failed to generate valid Hebrew translation")
                continue

            return translated_text

        except Exception as e:
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=500,
                    detail=f"Translation failed after {max_retries} attempts: {str(e)}"
                )
            await asyncio.sleep(1)  # Short delay before retry

def setup_ai_routes(app):
    @app.post("/suggest_recipe", response_model=dict)
    async def suggest_recipe(request: RecipeRequest):
        """
        Suggest a complete recipe based on the provided ingredients.
        """
        try:
            # Translate ingredients to English if needed
            try:
                translation_tasks = [translate_text(ingredient) for ingredient in request.ingredients]
                translated_ingredients = await asyncio.gather(*translation_tasks)
                ingredients_text = ", ".join(translated_ingredients)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

            # Generate recipe directly in Hebrew
            prompt = (
                f"Create a recipe using these ingredients: {ingredients_text}. "
                "Write the complete recipe in Hebrew with these sections:\n"
                "1. שם המתכון (Recipe name)\n"
                "2. מצרכים (Ingredients)\n"
                "3. אופן ההכנה (Instructions)\n"
                "Use proper Hebrew formatting and numbering."
            )

            result = await agent.run(prompt)

            if result and result.data:
                # Verify the response contains proper Hebrew
                if not validate_hebrew_response(result.data):
                    # Try to fix the response by translating to Hebrew
                    try:
                        result.data = await translate_text(result.data, src="en", dest="he")
                        if not validate_hebrew_response(result.data):
                            raise HTTPException(
                                status_code=500,
                                detail="Failed to generate valid Hebrew recipe"
                            )
                    except Exception as e:
                        raise HTTPException(
                            status_code=500,
                            detail=f"Translation error: {str(e)}"
                        )
                
                return {"recipe": result.data}
            else:
                raise HTTPException(
                    status_code=500,
                    detail="AI service failed to generate a response"
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/ingredient_substitution", response_model=dict)
    async def ingredient_substitution(request: IngredientsRequest):
        """
        Handle substitution-related questions, allowing users to ask in Hebrew or any language.
        """
        try:
            if not request.ingredients or len(request.ingredients) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No ingredients provided"
                )

            # Translate the ingredient to English
            try:
                translated_ingredient = await translate_text(request.ingredients[0])
            except Exception as e:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Translation error: {str(e)}"
                )

            # Generate substitution suggestions
            prompt = (
                f"What are good substitutes for {translated_ingredient} in cooking? "
                "Provide the answer in Hebrew with proper formatting."
            )

            result = await agent.run(prompt)

            if result and result.data:
                # Ensure proper Hebrew response
                if not validate_hebrew_response(result.data):
                    try:
                        translated_answer = await translate_text(result.data, src="en", dest="he")
                        if not validate_hebrew_response(translated_answer):
                            raise HTTPException(
                                status_code=500,
                                detail="Failed to generate valid Hebrew response"
                            )
                        return {"substitutes": translated_answer}
                    except Exception as e:
                        raise HTTPException(
                            status_code=500,
                            detail=f"Translation error: {str(e)}"
                        )
                return {"substitutes": result.data}
            else:
                raise HTTPException(
                    status_code=500,
                    detail="AI service failed to generate a response"
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/general_cooking_questions", response_model=dict)
    async def general_cooking_questions(request: CookingQuestionRequest):
        """
        Handle general cooking-related questions, supporting input and output in Hebrew.
        """
        try:
            if not request.question:
                raise HTTPException(
                    status_code=400,
                    detail="No question provided"
                )

            # Translate the question to English
            try:
                translated_question = await translate_text(request.question)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Translation error: {str(e)}"
                )

            # Generate response
            prompt = (
                f"{translated_question}\n"
                "Provide the answer in Hebrew with proper formatting."
            )

            result = await agent.run(prompt)

            if result and result.data:
                # Ensure proper Hebrew response
                if not validate_hebrew_response(result.data):
                    try:
                        translated_answer = await translate_text(result.data, src="en", dest="he")
                        if not validate_hebrew_response(translated_answer):
                            raise HTTPException(
                                status_code=500,
                                detail="Failed to generate valid Hebrew response"
                            )
                        return {"answer": translated_answer}
                    except Exception as e:
                        raise HTTPException(
                            status_code=500,
                            detail=f"Translation error: {str(e)}"
                        )
                return {"answer": result.data}
            else:
                raise HTTPException(
                    status_code=500,
                    detail="AI service failed to generate a response"
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))