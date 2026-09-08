import hashlib
import hmac
import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv(
    "PII_SECRET_KEY",
    "development-secret-change-this"
)


def generate_placeholder(entity_type: str, value: str) -> str:
    message = f"{entity_type}:{value}".encode("utf-8")

    digest = hmac.new(
        SECRET_KEY.encode("utf-8"),
        message,
        hashlib.sha256
    ).hexdigest()

    token = digest[:12].upper()

    return f"<{entity_type}_{token}>"


def merge_entities(
    regex_entities: list[dict],
    presidio_entities: list[dict]
) -> list[dict]:

    all_entities = regex_entities + presidio_entities

    all_entities.sort(
        key=lambda x: (
            x["start"],
            -(x["end"] - x["start"]),
            -x["score"]
        )
    )

    merged = []

    for entity in all_entities:

        overlap = False

        for existing in merged:

            if (
                entity["start"] < existing["end"]
                and entity["end"] > existing["start"]
            ):

                overlap = True

                if entity["score"] > existing["score"]:
                    existing.update(entity)

                break

        if not overlap:
            merged.append(entity)

    return sorted(
        merged,
        key=lambda x: x["start"]
    )


def mask_text(
    text: str,
    entities: list[dict]
) -> tuple[str, dict]:

    mapping = {}

    entities = sorted(
        entities,
        key=lambda x: x["start"],
        reverse=True
    )

    masked_text = text

    for entity in entities:

        original_value = text[
            entity["start"]:entity["end"]
        ]

        placeholder = generate_placeholder(
            entity["entity_type"],
            original_value
        )

        mapping[placeholder] = original_value

        masked_text = (
            masked_text[:entity["start"]]
            + placeholder
            + masked_text[entity["end"]:]
        )

    return masked_text, mapping


def unmask_text(
    masked_text: str,
    mapping: dict
) -> str:

    restored_text = masked_text

    placeholders = sorted(
        mapping.keys(),
        key=len,
        reverse=True
    )

    for placeholder in placeholders:

        restored_text = restored_text.replace(
            placeholder,
            mapping[placeholder]
        )

    return restored_text