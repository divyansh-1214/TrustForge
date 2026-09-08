from presidio_analyzer import AnalyzerEngine


analyzer = AnalyzerEngine()


PRESIDIO_ENTITIES = [
    "PERSON",
    "LOCATION",
    "PHONE_NUMBER",
    "EMAIL_ADDRESS",
    "IP_ADDRESS",
    "CREDIT_CARD",
    "DATE_TIME",
    "URL"
]


def detect_presidio(text: str) -> list[dict]:
    """
    Detect contextual PII using Microsoft Presidio.
    """

    results = analyzer.analyze(
        text=text,
        language="en",
        entities=PRESIDIO_ENTITIES
    )

    entities = []

    for result in results:

        entities.append({
            "entity_type": result.entity_type,
            "start": result.start,
            "end": result.end,
            "text": text[result.start:result.end],
            "score": result.score
        })

    return entities