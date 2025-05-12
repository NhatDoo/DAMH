from fastapi import APIRouter, HTTPException
import json
from typing import List
import logging as logger
from models.alternatives import AlternativeInput, AlternativeOutput, RecalculateScoreInput, RecalculateScoreOutput
from CR.mtg import AHPMatrix
from CR.chmt import NormalizedAHPMatrix
from CR.mtt import MTT
from CR.ci import CI
from CR.cr import CR

router = APIRouter()

def create_alternative_matrix(alternatives: List[str], scores: List[float]) -> List[List[float]]:
    n = len(alternatives)
    if len(scores) != n:
        raise HTTPException(status_code=400, detail=f"Số lượng điểm ({len(scores)}) không khớp với số phương án ({n}).")
    if any(score <= 0 for score in scores):
        raise HTTPException(status_code=400, detail="Điểm phải lớn hơn 0.")
    matrix = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            ratio = scores[i] / scores[j]
            if ratio > 9:
                ratio = 9
            elif ratio < 1/9:
                ratio = 1/9
            matrix[i][j] = ratio
            matrix[j][i] = 1 / ratio
    return matrix

def run_alternative_ahp(alternatives: List[str], matrix: List[List[float]]) -> tuple[List[float], float]:
    logger.info(f"Starting run_alternative_ahp with alternatives: {alternatives}")
    logger.info(f"Input matrix: {matrix}")

    # Tạo instance của AHPMatrix
    ahp = AHPMatrix(alternatives)
    for i in range(len(matrix)):
        for j in range(len(matrix[i])):
            if matrix[i][j] != 1.0:
                ahp.update_value(i, j, matrix[i][j])
    logger.info(f"AHPMatrix after update: {ahp.matrix}")

    # Chuẩn hóa và tính vector ưu tiên
    norm_ahp = NormalizedAHPMatrix(ahp)
    norm_ahp.normalize()
    if norm_ahp.normalized_matrix is None:
        logger.error("Normalization failed: normalized_matrix is None")
        raise ValueError("Normalization failed: normalized_matrix is None")
    
    norm_ahp.calculate_priority_vector()
    if norm_ahp.priority_vector is None:
        logger.error("Priority vector calculation failed: priority_vector is None")
        raise ValueError("Priority vector calculation failed: priority_vector is None")
    
    priority_vector = norm_ahp.priority_vector
    if hasattr(priority_vector, 'tolist'):
        priority_vector = priority_vector.tolist()
    logger.info(f"Calculated priority vector: {priority_vector}")

    # Tính Consistency Ratio bằng cách sử dụng MTT, CI, và CR
    mtt = MTT(ahp_matrix=ahp, norm_ahp_matrix=norm_ahp)
    logger.info(f"MTT pairwise_matrix: {mtt.pairwise_matrix}")
    mtt.calculate_temp_matrix()
    if mtt.temp_matrix is None:
        logger.error("Temp matrix calculation failed: temp_matrix is None")
        raise ValueError("Temp matrix calculation failed: temp_matrix is None")
    
    mtt.calculate_lambda_max()
    if mtt.lambda_max is None:
        logger.error("Lambda_max calculation failed: lambda_max is None")
        raise ValueError("Lambda_max calculation failed: lambda_max is None")
    logger.info(f"Lambda_max from MTT: {mtt.lambda_max}")

    ci = CI(mtt_instance=mtt)
    ci.calculate_ci()
    if ci.consistency_index is None:
        logger.error("Consistency Index calculation failed: consistency_index is None")
        raise ValueError("Consistency Index calculation failed: consistency_index is None")
    logger.info(f"Consistency Index from CI: {ci.consistency_index}")

    cr = CR(ci_instance=ci)
    cr.calculate_cr()
    if cr.consistency_ratio is None:
        logger.error("Consistency Ratio calculation failed: consistency_ratio is None")
        raise ValueError("Consistency Ratio calculation failed: consistency_ratio is None")
    consistency_ratio = cr.consistency_ratio
    logger.info(f"Consistency Ratio from CR: {consistency_ratio}")

    return priority_vector, consistency_ratio

def rank_alternatives(input_data: AlternativeInput) -> AlternativeOutput:
    try:
        with open("D:/Project/AHP/BE/CR/criteria_data.json", "r") as f:
            data = json.load(f)
            criteria_list = data["criteria_list"]
            criteria_priority_vector = data["criteria_priority_vector"]
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Không tìm thấy file 'criteria_data.json'. Vui lòng chạy API tính tiêu chí trước!")
    
    alternatives_list = input_data.alternatives_list
    alternative_scores = input_data.alternative_scores
    
    if set(alternative_scores.keys()) != set(criteria_list):
        raise HTTPException(status_code=400, detail="Danh sách tiêu chí trong alternative_scores không khớp với criteria_data.json.")
    
    alternative_priority_vectors = {}
    consistency_ratios = {}
    for criterion, scores in alternative_scores.items():
        matrix = create_alternative_matrix(alternatives_list, scores)
        priority_vector, cr = run_alternative_ahp(alternatives_list, matrix)
        alternative_priority_vectors[criterion] = priority_vector
        consistency_ratios[criterion] = cr
    
    final_scores = [0] * len(alternatives_list)
    for i, criterion in enumerate(criteria_list):
        for j in range(len(alternatives_list)):
            final_scores[j] += criteria_priority_vector[i] * alternative_priority_vectors[criterion][j]
    
    sorted_alternatives = sorted(
        zip(alternatives_list, final_scores), key=lambda x: x[1], reverse=True
    )
    ranked_alternatives = [
        {"alternative": alt, "score": score} for alt, score in sorted_alternatives
    ]
    
    return AlternativeOutput(
        alternatives_list=alternatives_list,
        final_scores=final_scores,
        ranked_alternatives=ranked_alternatives,
        consistency_ratios=consistency_ratios
    )

@router.post("/rank", response_model=AlternativeOutput)
async def rank_alternatives_endpoint(input_data: AlternativeInput):
    return rank_alternatives(input_data)

@router.post("/recalculate_score")
async def recalculate_score(data: RecalculateScoreInput):
    try:
        alternatives_list = data.alternatives_list
        alternative_scores = data.alternative_scores
        modified_index = data.modified_index
        updated_criterion_scores = data.updated_criterion_scores

        # Validate input
        if modified_index < 0 or modified_index >= len(alternatives_list):
            raise HTTPException(status_code=400, detail="Invalid modified_index.")
        
        if not all(criterion in alternative_scores for criterion in updated_criterion_scores):
            raise HTTPException(status_code=400, detail="Updated criterion scores must match existing criteria.")

        # Example: Recalculate final score (simplified)
        final_score = 0.0
        for criterion, score in updated_criterion_scores.items():
            if criterion in alternative_scores:
                final_score += score * (1.0 / len(alternative_scores))  # Placeholder weight

        return {"final_score": final_score}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@router.post("/rank_alternatives_direct")
async def rank_alternatives_direct(data: dict):
    try:
        alternatives_list = data.get("alternatives_list", [])
        pairwise_matrix = data.get("pairwise_matrix", [])

        logger.info(f"Received rank_alternatives_direct request with alternatives: {alternatives_list}")
        logger.info(f"Pairwise matrix: {pairwise_matrix}")

        # Validate input
        if not alternatives_list or len(alternatives_list) < 2:
            raise HTTPException(status_code=400, detail="Cần ít nhất 2 phương án để xếp hạng.")
        
        n = len(alternatives_list)
        expected_matrix_length = n * n
        if len(pairwise_matrix) != expected_matrix_length:
            raise HTTPException(status_code=400, detail=f"Ma trận phải có kích thước {n}x{n} ({expected_matrix_length} phần tử).")
        
        if any(val < 1/9 or val > 9 for val in pairwise_matrix):
            raise HTTPException(status_code=400, detail="Giá trị trong ma trận phải từ 1/9 đến 9.")

        # Convert flat array to 2D matrix
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]
        for i in range(n):
            for j in range(n):
                matrix[i][j] = float(pairwise_matrix[i * n + j])
        logger.info(f"Converted 2D matrix: {matrix}")

        # Validate reciprocity (nới lỏng ngưỡng sai số)
        for i in range(n):
            for j in range(i + 1, n):
                if abs(matrix[i][j] * matrix[j][i] - 1.0) > 1e-3:  # Tăng ngưỡng từ 1e-6 lên 1e-3
                    raise HTTPException(status_code=400, detail=f"Ma trận không đối xứng tại vị trí ({i}, {j}): {matrix[i][j]} và {matrix[j][i]}.")

        # Calculate priority vector and CR
        priority_vector, consistency_ratio = run_alternative_ahp(alternatives_list, matrix)

        # Rank alternatives
        sorted_alternatives = sorted(
            zip(alternatives_list, priority_vector), key=lambda x: x[1], reverse=True
        )
        ranked_alternatives = [
            {"alternative": alt, "score": score} for alt, score in sorted_alternatives
        ]

        return {
            "alternatives_list": alternatives_list,
            "final_scores": priority_vector,
            "ranked_alternatives": ranked_alternatives,
            "consistency_ratio": consistency_ratio
        }

    except HTTPException as e:
        logger.error(f"HTTPException in rank_alternatives_direct: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Error in rank_alternatives_direct: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")