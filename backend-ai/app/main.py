from fastapi import FastAPI, HTTPException

from app.schemas import (
    MaskRequest,
    MaskResponse,
    SafetyRequest
)

from app.detector.regex_detector import (
    detect_regex
)

from app.detector.presidio_detector import (
    detect_presidio
)

from app.masking.masker import (
    merge_entities,
    mask_text,
    unmask_text
)

from app.services.groq_service import (
    classify_safety
)


app = FastAPI(
    title="TrustForge PII Engine",
    description="Hybrid local PII detection and masking engine",
    version="1.0.0"
)


# Temporary in-memory storage for prototype.
# Later this should be replaced with a secure
# local vault/session-based store.
mapping_store: dict[str, dict] = {}


@app.get("/")
def root():

    return {
        "service": "TrustForge PII Engine",
        "status": "running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.post(
    "/mask",
    response_model=MaskResponse
)
def mask(request: MaskRequest):

    text = request.text

    if not text.strip():

        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    # Detector 1
    regex_entities = detect_regex(text)

    # Detector 2
    presidio_entities = detect_presidio(text)

    # Combine both detectors
    entities = merge_entities(
        regex_entities,
        presidio_entities
    )

    # Mask PII locally
    masked_text, mapping = mask_text(
        text,
        entities
    )

    # Generate an ID for this masking operation
    request_id = str(len(mapping_store) + 1)

    mapping_store[request_id] = mapping

    return {
        "masked_text": masked_text,
        "entities": entities
    }


@app.post("/unmask")
def unmask(
    request_id: str,
    text: str
):

    mapping = mapping_store.get(request_id)

    if mapping is None:

        raise HTTPException(
            status_code=404,
            detail="Mapping not found"
        )

    restored = unmask_text(
        text,
        mapping
    )

    return {
        "text": restored
    }


@app.post("/safety")
def safety(
    request: SafetyRequest
):

    if not request.text.strip():

        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    # IMPORTANT:
    # This endpoint expects ALREADY MASKED text.
    result = classify_safety(
        request.text
    )

    return {
        "result": result
    }