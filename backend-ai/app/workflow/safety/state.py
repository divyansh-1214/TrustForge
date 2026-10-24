from ast import operator

from typing_extensions import Annotated, List, TypedDict


class State(TypedDict, total=False):
    text: str
    rules: List[dict]  # loaded from DB for this org
    results: Annotated[List[dict], operator.add]  # reducer: parallel nodes append
    decision: dict


class RuleInput(TypedDict):
    rule: dict
    text: str
