from pydantic import BaseModel
from typing import List

class CriteriaInput(BaseModel):
    criteria_list: List[str]
    pairwise_matrix: List[float]  # Ma trận so sánh đôi dạng phẳng (flat)

class CriteriaOutput(BaseModel):
    criteria_list: List[str]
    criteria_priority_vector: List[float]
    consistency_ratio: float