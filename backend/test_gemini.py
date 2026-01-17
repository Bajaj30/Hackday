import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key[:10]}...{api_key[-5:]}" if api_key else "NO API KEY FOUND")

genai.configure(api_key=api_key)

print("\nAvailable models:")
for model in genai.list_models():
    if 'generateContent' in str(model.supported_generation_methods):
        print(f"  - {model.name}")
