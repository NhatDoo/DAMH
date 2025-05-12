from pydantic import BaseModel
from typing import Dict, List, Optional

class TchiUserInput(BaseModel):
    alternative: str
    final_score: float
    criterion_scores: Dict[str, float]
    comparison_matrix: Optional[List[List[float]]] = None


class TchiUserOutput(BaseModel):
    id: str
    criteria_list: List[str]
    criteria_comparison_matrix: List[float]
    consistency_ratio: float = 0.00
    created_at: str
    updated_at: Optional[str] = None
    alternative: str

