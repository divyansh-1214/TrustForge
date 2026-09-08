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


class SafetyRequest(BaseModel):

    text: str