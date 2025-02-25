from urllib import request
from fastapi import HTTPException
from pydantic import BaseModel
from pydantic_ai import Agent
import os
from dotenv import load_dotenv
from googletrans import Translator, LANGUAGES
import asyncio
import re
import requests
from typing import List, Dict
from deep_translator import GoogleTranslator

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing. Add it to your .env file.")

agent = Agent(
    'gemini-1.5-flash',
    system_prompt='You are a recipe assistant. Generate recipes in Hebrew using proper Hebrew characters. Format ingredients and instructions clearly.'
)

translator = Translator()

class IngredientsRequest(BaseModel):
    ingredients: list[str]

class RecipeRequest(BaseModel):
    ingredients: list[str]

class CookingQuestionRequest(BaseModel):
    question: str

class ChatMessage(BaseModel):
    text: str
    fromUser: bool  # True = user, False = assistant

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

def is_hebrew(text: str) -> bool:
    """Check if text contains Hebrew characters."""
    hebrew_pattern = re.compile(r'[\u0590-\u05FF\uFB1D-\uFB4F]')
    return bool(hebrew_pattern.search(text))

def validate_hebrew_response(text: str) -> bool:
    """Validate if the response contains enough Hebrew characters."""
    hebrew_chars = len(re.findall(r'[\u0590-\u05FF\uFB1D-\uFB4F]', text))
    total_chars = len(text.strip())
    return hebrew_chars / total_chars > 0.3 if total_chars > 0 else False

async def translate_text(text: str, src="auto", dest="en", max_retries=3) -> str:
    """Translate text using deep_translator."""
    for attempt in range(max_retries):
        try:
            translated_text = GoogleTranslator(source=src, target=dest).translate(text)
            print(f"Translation: {translated_text}")
            return translated_text
        except Exception as e:
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=500,
                    detail=f"Translation failed after {max_retries} attempts: {str(e)}"
                )
            await asyncio.sleep(1)
            
def setup_ai_routes(app):
    @app.post("/suggest_recipe", response_model=dict)
    async def suggest_recipe(request: RecipeRequest):
        """Suggest a complete recipe based on provided ingredients."""
        try:
            try:
                translation_tasks = [translate_text(ingredient) for ingredient in request.ingredients]
                translated_ingredients = await asyncio.gather(*translation_tasks)
                ingredients_text = ", ".join(translated_ingredients)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

            prompt = (
                f"Create a recipe using these ingredients: {ingredients_text}. "
                "Write the complete recipe in Hebrew with these sections:\n"
                "1. Recipe name\n"
                "2. Ingredients\n"
                "3. Instructions\n"
                "Use proper Hebrew formatting and numbering."
            )

            result = await agent.run(prompt)

            if result and result.data:
                if not validate_hebrew_response(result.data):
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
        """Provide ingredient substitution suggestions."""
        try:
            if not request.ingredients or len(request.ingredients) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No ingredients provided"
                )

            try:
                translated_ingredient = await translate_text(request.ingredients[0])
            except Exception as e:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Translation error: {str(e)}"
                )

            prompt = (
                f"What are good substitutes for {translated_ingredient} in cooking? "
                "Provide the answer in Hebrew with proper formatting."
            )

            result = await agent.run(prompt)

            if result and result.data:
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
        """Handle general cooking questions."""
        try:
            if not request.question:
                raise HTTPException(
                    status_code=400,
                    detail="No question provided"
                )

            try:
                translated_question = await translate_text(request.question)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Translation error: {str(e)}"
                )

            prompt = (
                f"{translated_question}\n"
                "Provide the answer in Hebrew with proper formatting."
            )

            result = await agent.run(prompt)

            if result and result.data:
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
        
    @app.post("/chat", response_model=dict)
    async def chat_with_ai(request: ChatRequest):
        """Accept a list of messages and return an AI-generated response in Hebrew."""
        try:
            conversation_text = ""
            for i, msg in enumerate(request.messages):
                if msg.fromUser:
                    user_text_en = await translate_text(msg.text, src="auto", dest="en")
                    conversation_text += f"User({i+1}): {user_text_en}\n"
                else:
                    assistant_text_en = await translate_text(msg.text, src="auto", dest="en")
                    conversation_text += f"Assistant({i+1}): {assistant_text_en}\n"

            conversation_text += "\nPlease provide your next answer in Hebrew."

            result = await agent.run(conversation_text)
            if not result or not result.data:
                raise HTTPException(status_code=500, detail="AI service failed to generate a response")

            answer = result.data

            if not validate_hebrew_response(answer):
                answer_he = await translate_text(answer, src="en", dest="he")
                if not validate_hebrew_response(answer_he):
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to generate valid Hebrew response"
                    )
                answer = answer_he

            return {"answer": answer}

        except Exception as e:
            print(f"Error in /chat: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        
USDA_API_KEY = os.getenv("USDA_API_KEY")
USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

def fetch_nutritional_info(ingredient_name: str, quantity: float, unit: str) -> Dict:
    """Fetch nutritional data from the USDA FoodData Central API."""
    if not USDA_API_KEY:
        raise ValueError("USDA API key is missing! Please add it to the .env file")

    translated_name = GoogleTranslator(source="auto", target="en").translate(ingredient_name)
    print(f"Translating '{ingredient_name}' to English: '{translated_name}'")

    params = {
        "query": translated_name,
        "api_key": USDA_API_KEY
    }

    response = requests.get(USDA_API_URL, params=params)
    data = response.json()

    if "foods" not in data or not data["foods"]:
        raise ValueError(f"No nutritional data found for {translated_name}")

    food = data["foods"][0]
    nutrients = {nutrient["nutrientName"]: nutrient["value"] for nutrient in food["foodNutrients"]}

    return {
        "calories": nutrients.get("Energy", 0),
        "protein": nutrients.get("Protein", 0),
        "carbs": nutrients.get("Carbohydrate, by difference", 0),
        "fats": nutrients.get("Total lipid (fat)", 0)
    }

def calculate_nutritional_info(ingredients: List[Dict], servings: int) -> Dict:
    """Calculate recipe nutritional values using USDA API."""
    print(f"Calculating nutrition for {len(ingredients)} ingredients, {servings} servings")

    total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}

    for ingredient in ingredients:
        try:
            print(f"Fetching nutrition for: {ingredient['name']} ({ingredient['quantity']} {ingredient['unit']})")
            nutrition = fetch_nutritional_info(
                ingredient["name"], 
                float(ingredient["quantity"]), 
                ingredient["unit"]
            )
            print(f"Nutrition received: {nutrition}")

            total_nutrition["calories"] += nutrition["calories"]
            total_nutrition["protein"] += nutrition["protein"]
            total_nutrition["carbs"] += nutrition["carbs"]
            total_nutrition["fats"] += nutrition["fats"]
        except ValueError as e:
            print(f"Skipping ingredient {ingredient['name']} due to error: {e}")

    per_serving = {key: round(value / float(servings), 2) for key, value in total_nutrition.items()}
    print(f"Final nutrition per serving: {per_serving}")
    return per_serving
