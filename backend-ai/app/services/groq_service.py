import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()


GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)


if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not configured."
    )


client = Groq(
    api_key=GROQ_API_KEY
)


MODEL_NAME = "openai/gpt-oss-safeguard-20b"


def classify_safety(
    masked_text: str
) -> str:

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
                )
            },
            {
                "role": "user",
                "content": masked_text
            }
        ],

        reasoning_effort="low"
    )

    return response.choices[0].message.content