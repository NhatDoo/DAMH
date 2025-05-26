from pydantic import BaseModel ,EmailStr
from typing import Dict, List, Optional

class TchiUserInput(BaseModel):
    # email: EmailStr
    alternative: str
    # criterion_scores : Dict[str, float]
    criteria_list: List[str]
    consistency_ratio: float
    final_score: float
    criterion_scores: Dict[str, float]
    comparison_matrix: Optional[List[float]] = None


class TchiUserOutput(BaseModel):
    id: str
    criteria_list: List[str]
    criteria_comparison_matrix: List[float]
    consistency_ratio: float = 0.00
    created_at: str
    updated_at: Optional[str] = None
    alternative: str
    # lambda_max: float = 0.0;
    # priority_vector: List[float] = []  
  

