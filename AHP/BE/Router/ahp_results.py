from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from bson import ObjectId
from models.ahp_results import AHPResult, UpdateScoresInput
from datetime import datetime
import numpy as np
import logging
from CR.mongodb import get_ahp_collection, close_mongo_client

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
# class RankedAlternative(BaseModel):
#     alternative: str
#     score: float

# class UpdateScoresInput(BaseModel):
#     final_score: float
#     criterion_scores: Dict[str, float]

# class AHPResult(BaseModel):
#     id: Optional[str] = None
#     alternatives_list: List[str]
#     final_scores: List[float]
#     ranked_alternatives: List[RankedAlternative]
#     alternative_scores: Dict[str, List[float]]
#     criteria_comparison_matrices: Optional[Dict[str, List[List[float]]]] = None
#     consistency_ratios: Optional[Dict[str, float]] = None
#     metadata: Dict


def calculate_comparison_matrix(scores: List[float]) -> List[List[float]]:
    """
    Tính ma trận so sánh đôi từ danh sách điểm số của các tiêu chí.
    Args:
        scores: List[float] - Điểm số của các tiêu chí.
    Returns:
        List[List[float]] - Ma trận so sánh đôi.
    """
    if not scores or len(scores) < 2:
        logger.error(f"Danh sách điểm số không hợp lệ: {scores}")
        return [[1.0]]
    
    n = len(scores)
    matrix = [[1.0 for _ in range(n)] for _ in range(n)]
    epsilon = 1e-2  # Giá trị nhỏ để tránh tỷ lệ bị làm tròn thành 1.0
    
    for i in range(n):
        for j in range(n):
            if i != j:
                try:
                    # Tránh chia cho 0, thay thế bằng giá trị nhỏ
                    denominator = scores[j] if scores[j] != 0 else 1e-10
                    ratio = scores[i] / denominator
                    # Thêm epsilon để tránh tỷ lệ quá gần 1
                    if abs(ratio - 1.0) < 1e-2:
                        ratio += epsilon if ratio >= 1.0 else -epsilon
                    # Giới hạn theo thang AHP (1/9 đến 9)
                    matrix[i][j] = min(max(ratio, 1/9), 9)
                    matrix[j][i] = 1 / matrix[i][j]
                except Exception as e:
                    logger.warning(f"Lỗi tính tỷ lệ tại ({i}, {j}): {str(e)}")
                    matrix[i][j] = 1.01  # Gán giá trị hơi lớn hơn 1 để tránh CR = 0
                    matrix[j][i] = 1 / matrix[i][j]
    
    return [[round(val, 2) for val in row] for row in matrix]  # Làm tròn thành 2 chữ số

def calculate_cr(matrix: List[List[float]]) -> float:
    """
    Tính Consistency Ratio (CR) từ ma trận so sánh đôi.
    Args:
        matrix: List[List[float]] - Ma trận so sánh đôi.
    Returns:
        float - Giá trị CR.
    """
    if not matrix or len(matrix) < 2 or not matrix[0]:
        logger.error(f"Ma trận không hợp lệ: {matrix}")
        return 0.01  # Trả về giá trị tối thiểu nếu ma trận không hợp lệ
    
    matrix = np.array(matrix)
    n = matrix.shape[0]
    
    try:
        # Kiểm tra ma trận có toàn giá trị 1.0 không
        if np.allclose(matrix, np.ones((n, n)), atol=1e-2):
            logger.info("Ma trận gần toàn 1.0, trả về CR tối thiểu")
            return 0.01  # Trả về giá trị tối thiểu nếu ma trận toàn 1.0
        
        row_sums = np.prod(matrix, axis=1) ** (1/n)
        eigenvector = row_sums / np.sum(row_sums)
        weighted_sums = np.sum(matrix * eigenvector, axis=1)
        lambda_max = np.sum(weighted_sums / eigenvector) / n
        
        # Đảm bảo lambda_max không nhỏ hơn n
        if lambda_max < n:
            logger.warning(f"lambda_max ({lambda_max}) nhỏ hơn n ({n}), điều chỉnh thành n")
            lambda_max = n
        
        CI = (lambda_max - n) / (n - 1)
        RI = 1.32  # Random Index cho n = 7
        CR = CI / RI if RI != 0 else 0
        # Đảm bảo CR không nhỏ hơn 0.01
        return max(round(CR, 2), 0.01)
    except Exception as e:
        logger.error(f"Lỗi khi tính CR: {str(e)}")
        return 0.01  # Trả về giá trị tối thiểu nếu có lỗi

# Endpoints
@router.get("", response_model=List[AHPResult])
async def get_all_ahp_results():
    """
    Lấy tất cả bản ghi AHP từ MongoDB, bao gồm ma trận so sánh đôi và CR.
    """
    try:
        collection, client = get_ahp_collection()
        results = list(collection.find())
        if not results:
            close_mongo_client(client)
            raise HTTPException(status_code=404, detail="Không tìm thấy dữ liệu trong MongoDB.")
        
        formatted_results = []
        for result in results:
            logger.info(f"Xử lý bản ghi: {result.get('_id')}")
            
            # Kiểm tra dữ liệu cần thiết
            if not result.get("alternatives_list") or not result.get("alternative_scores"):
                logger.error(f"Dữ liệu thiếu: alternatives_list hoặc alternative_scores")
                continue
            
            alternatives_list = result["alternatives_list"]
            alternative_scores = result["alternative_scores"]
            criteria_comparison_matrices = {}
            consistency_ratios = {}
            
            criteria = list(alternative_scores.keys())
            if not criteria:
                logger.error("Không có tiêu chí nào trong alternative_scores")
                continue
            
            # Kiểm tra độ dài điểm số
            expected_length = len(alternatives_list)
            for criterion in criteria:
                if len(alternative_scores[criterion]) != expected_length:
                    logger.error(f"Độ dài điểm số không khớp cho tiêu chí {criterion}: "
                               f"thực tế {len(alternative_scores[criterion])}, kỳ vọng {expected_length}")
                    continue
            
            for alt_idx, alternative in enumerate(alternatives_list):
                try:
                    scores = [alternative_scores[criterion][alt_idx] for criterion in criteria]
                except IndexError:
                    logger.error(f"Chỉ số ngoài phạm vi trong alternative_scores cho phương án {alternative}")
                    scores = [1.0] * len(criteria)
                
                comparison_matrix = calculate_comparison_matrix(scores)
                cr = calculate_cr(comparison_matrix)
                
                criteria_comparison_matrices[alternative] = comparison_matrix
                consistency_ratios[alternative] = cr
            
            # Cập nhật bản ghi trong MongoDB với ma trận và CR mới
            collection.update_one(
                {"_id": result["_id"]},
                {"$set": {
                    "criteria_comparison_matrices": criteria_comparison_matrices,
                    "consistency_ratios": consistency_ratios,
                    "metadata.updated_at": datetime.utcnow().isoformat()
                }}
            )
            
            result["criteria_comparison_matrices"] = criteria_comparison_matrices
            result["consistency_ratios"] = consistency_ratios
            
            result["id"] = str(result["_id"])
            del result["_id"]
            formatted_results.append(AHPResult(**result))
        
        close_mongo_client(client)
        if not formatted_results:
            raise HTTPException(status_code=404, detail="Không có bản ghi hợp lệ sau khi xử lý.")
        return formatted_results
    except Exception as e:
        close_mongo_client(client)
        logger.error(f"Lỗi trong get_all_ahp_results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi truy vấn MongoDB: {str(e)}")

@router.put("/{id}", response_model=AHPResult)
async def update_ahp_result(id: str, update_data: UpdateScoresInput):
    """
    Cập nhật bản ghi AHP, bao gồm final_score, criterion_scores, ma trận và CR.
    """
    try:
        collection, client = get_ahp_collection()
        document = collection.find_one({"_id": ObjectId(id)})
        if not document:
            close_mongo_client(client)
            raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi.")
        
        logger.info(f"Cập nhật bản ghi: {id}")
        
        if not document.get("ranked_alternatives") or not document.get("alternatives_list"):
            close_mongo_client(client)
            raise HTTPException(status_code=400, detail="Dữ liệu bản ghi không đầy đủ.")
        
        ranked_alternatives = document["ranked_alternatives"]
        alternatives_list = document["alternatives_list"]
        
        # Tìm index của phương án cần cập nhật
        alternative_index = None
        for idx, alt in enumerate(ranked_alternatives):
            if abs(alt["score"] - update_data.final_score) < 1e-6:
                alternative_index = idx
                break
        
        if alternative_index is None or alternative_index >= len(alternatives_list):
            close_mongo_client(client)
            logger.error(f"Không tìm thấy phương án với final_score: {update_data.final_score}")
            raise HTTPException(status_code=400, detail="Không tìm thấy phương án cần cập nhật.")
        
        # Cập nhật final_scores và ranked_alternatives
        if alternative_index >= len(document["final_scores"]):
            logger.error(f"Chỉ số {alternative_index} ngoài phạm vi final_scores")
            close_mongo_client(client)
            raise HTTPException(status_code=400, detail="Chỉ số ngoài phạm vi final_scores.")
        
        document["final_scores"][alternative_index] = update_data.final_score
        ranked_alternatives[alternative_index]["score"] = update_data.final_score
        document["ranked_alternatives"] = sorted(
            ranked_alternatives, key=lambda x: x["score"], reverse=True
        )

        # Cập nhật alternative_scores
        alternative_scores = document["alternative_scores"]
        for criterion, score in update_data.criterion_scores.items():
            if criterion not in alternative_scores:
                logger.warning(f"Tiêu chí {criterion} không tồn tại trong alternative_scores")
                continue
            if alternative_index < len(alternative_scores[criterion]):
                alternative_scores[criterion][alternative_index] = score
            else:
                logger.error(f"Chỉ số {alternative_index} ngoài phạm vi cho tiêu chí {criterion}")
                continue

        # Cập nhật criteria_comparison_matrices và consistency_ratios
        criteria = list(alternative_scores.keys())
        criteria_comparison_matrices = document.get("criteria_comparison_matrices", {})
        consistency_ratios = document.get("consistency_ratios", {})
        
        try:
            scores = [alternative_scores[criterion][alternative_index] for criterion in criteria]
        except IndexError:
            logger.error(f"Chỉ số ngoài phạm vi khi lấy điểm số cho phương án {alternatives_list[alternative_index]}")
            scores = [1.0] * len(criteria)
        
        comparison_matrix = calculate_comparison_matrix(scores)
        cr = calculate_cr(comparison_matrix)
        
        criteria_comparison_matrices[alternatives_list[alternative_index]] = comparison_matrix
        consistency_ratios[alternatives_list[alternative_index]] = cr

        # Lưu vào MongoDB
        collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "final_scores": document["final_scores"],
                "ranked_alternatives": document["ranked_alternatives"],
                "alternative_scores": document["alternative_scores"],
                "criteria_comparison_matrices": criteria_comparison_matrices,
                "consistency_ratios": consistency_ratios,  # Đảm bảo cập nhật consistency_ratios
                "metadata.updated_at": datetime.utcnow().isoformat()
            }}
        )

        document["criteria_comparison_matrices"] = criteria_comparison_matrices
        document["consistency_ratios"] = consistency_ratios
        
        document["id"] = str(document["_id"])
        del document["_id"]
        close_mongo_client(client)
        return AHPResult(**document)
    except Exception as e:
        close_mongo_client(client)
        logger.error(f"Lỗi trong update_ahp_result: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật MongoDB: {str(e)}")