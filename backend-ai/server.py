import json
from pprint import pprint
from typing import Any
from unittest import result

from app.detector.presidio_detector import detect_presidio
from app.detector.regex_detector import detect_regex
from app.masking.masker import mask_text, merge_entities, unmask_text
from app.schemas import MaskRequest, MaskResponse, SafetyRequest, SafetyRule
from app.services.groq_service import classify_safety
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TrustForge PII Engine",
    description="Hybrid local PII detection and masking engine",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


mapping_store: dict[str, dict] = {}


@app.get("/")
def root():
    return {"service": "TrustForge PII Engine", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/mask", response_model=MaskResponse)
def mask(request: MaskRequest):

    text = request.text

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    regex_entities = detect_regex(text)

    presidio_entities = detect_presidio(text)

    entities = merge_entities(regex_entities, presidio_entities)

    masked_text, mapping = mask_text(text, entities)

    request_id = str(len(mapping_store) + 1)

    mapping_store[request_id] = mapping

    return {"masked_text": masked_text, "entities": entities}


@app.post("/unmask")
def unmask(request_id: str, text: str):

    mapping = mapping_store.get(request_id)

    if mapping is None:
        raise HTTPException(status_code=404, detail="Mapping not found")

    restored = unmask_text(text, mapping)

    return {"text": restored}


@app.post("/safety")
def safety(request: SafetyRequest):

    if not request.prompt:
        raise HTTPException(status_code=400, detail="promt array cannot be empty")

    if not request.rules:
        raise HTTPException(status_code=400, detail="Rules array cannot be empty")

    rules = sorted(request.rules, key=lambda rule: rule.priority)
    # result = classify_safety(request.prompt, rules)
    print(request)

    return {"success": True, "rules": rules}
