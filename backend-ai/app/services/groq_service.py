import os

from dotenv import load_dotenv
from groq import Groq

from ..schemas import SafetyRule

load_dotenv()


GROQ_API_KEY = os.getenv("GROQ_API_KEY")


if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not configured.")


client = Groq(api_key=GROQ_API_KEY)


MODEL_NAME = os.getenv("MODEL_NAME")


def classify_safety(test: str, rules: list[SafetyRule]) -> str:
    print(rules)
    rulesName = [];
    configs = list[dict[any, any]];
    for rule in rules:
        rulesName.append(rule.name);


    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the TrustForge safety classifier. "
                    "Analyze the provided sanitized text for "
                    "safety policy violations. "
                    "The text contains placeholders instead "
                    "of real personal information. "
                    "Do not attempt to reconstruct the original "
                    "personal information."
                ),
            },
            {"role": "user", "content": test},
        ],
        reasoning_effort="low",
    )

    return "heyyy"
