from pydantic import BaseModel
from typing import List, Dict

class AlternativeInput(BaseModel):
    alternatives_list: List[str]
    alternative_scores: Dict[str, List[float]]

class RankedAlternative(BaseModel):
    alternative: str
    score: float

class AlternativeOutput(BaseModel):
    alternatives_list: List[str]
    final_scores: List[float]
    ranked_alternatives: List[RankedAlternative]

class RecalculateScoreInput(BaseModel):
    alternatives_list: list[str]
    alternative_scores: dict[str, list[float]]
    modified_index: int
    updated_criterion_scores: dict[str, float]

class RecalculateScoreOutput(BaseModel):
    final_score: float