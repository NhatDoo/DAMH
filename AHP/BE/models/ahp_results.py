from pydantic import BaseModel
from typing import List, Dict
from .alternatives import RankedAlternative
from typing import Dict, List, Optional
from pydantic import BaseModel
from typing import List, Dict, Optional

class AHPResult(BaseModel):
    id: Optional[str] = None
    alternatives_list: List[str]
    # final_scores: List[float]
    ranked_alternatives: List[RankedAlternative]
    # alternative_scores: Dict[str, List[float]]
    criteria_comparison_matrices: Optional[Dict[str, List[List[float]]]] = None
    consistency_ratios: Optional[Dict[str, float]] = None
    metadata: Dict


class UpdateScoresInput(BaseModel):
    final_score: Optional[float] = None
    criterion_scores: Optional[Dict[str, float]] = None
    comparison_matrix: Optional[List[float]] = None
    consistency_ratio: Optional[float] = None
    criteria_list : Optional[List[str]] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            float: lambda v: f"{v:.2f}" if isinstance(v, float) else v
        }