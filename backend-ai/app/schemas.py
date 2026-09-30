from typing import Any

from pydantic import BaseModel


class MaskRequest(BaseModel):
    text: str


class EntityResponse(BaseModel):
    entity_type: str
    start: int
    end: int
    text: str
    score: float


class MaskResponse(BaseModel):
    masked_text: str
    entities: list[EntityResponse]


class SafetyRule(BaseModel):
    id: str
    policy_id: str
    type: str
    name: str
    action: str
    enabled: bool
    threshold: float | None = None
    config: dict[str, Any]
    priority: int


class SafetyRequest(BaseModel):
    prompt: str
    rules: list[SafetyRule]
