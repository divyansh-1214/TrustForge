import re


PATTERNS = {
    "EMAIL_ADDRESS": re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    ),

    "PHONE_NUMBER": re.compile(
        r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)"
    ),

    "PAN": re.compile(
        r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"
    ),

    "AADHAAR": re.compile(
        r"(?<!\d)\d{4}[\s-]\d{4}[\s-]\d{4}(?!\d)"
    ),

    "IP_ADDRESS": re.compile(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    ),

    "CREDIT_CARD": re.compile(
        r"\b(?:\d[ -]*?){13,19}\b"
    )
}


def detect_regex(text: str) -> list[dict]:
    """
    Detect structured PII using regular expressions.
    """

    entities = []

    for entity_type, pattern in PATTERNS.items():

        for match in pattern.finditer(text):

            entities.append({
                "entity_type": entity_type,
                "start": match.start(),
                "end": match.end(),
                "text": match.group(),
                "score": 1.0
            })

    return entities