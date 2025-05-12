from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from bson import ObjectId
from datetime import datetime
from models.tchi_user import TchiUserInput, TchiUserOutput
from models.ahp_results import UpdateScoresInput
from pymongo import MongoClient
import logging
import numpy as np
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cấu hình OAuth2 để lấy token (giả định sử dụng JWT)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  

# Hàm giả lập để lấy gmail từ token (thay bằng logic xác thực thực tế)
async def get_current_user_gmail(token: str = Depends(oauth2_scheme)) -> str:
    # TODO: Triển khai logic giải mã JWT để lấy gmail
    # Ví dụ: Giả lập trả về gmail
    return "user@example.com"  # Thay bằng logic thực tế, ví dụ: decode_jwt(token)["email"]

def get_tchi_user_collection():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["startup_pa_dtb"]
    collection = db["tchi_user"]
    return collection, client

# Hàm tính ma trận so sánh từ criterion_scores
def calculate_comparison_matrix(scores: List[float]) -> List[List[float]]:
    if not scores or len(scores) < 2:
        logger.error(f"Danh sách điểm số không hợp lệ: {scores}")
        return [[1.0]]
    
    n = len(scores)
    matrix = [[1.0 for _ in range(n)] for _ in range(n)]
    epsilon = 1e-2
    
    for i in range(n):
        for j in range(n):
            if i != j:
                try:
                    denominator = scores[j] if scores[j] != 0 else 1e-10
                    ratio = scores[i] / denominator
                    if abs(ratio - 1.0) < 1e-2:
                        ratio += epsilon if ratio >= 1.0 else -epsilon
                    matrix[i][j] = min(max(ratio, 1/9), 9)
                    matrix[j][i] = 1 / matrix[i][j]
                except Exception as e:
                    logger.warning(f"Lỗi tính tỷ lệ tại ({i}, {j}): {str(e)}")
                    matrix[i][j] = 1.01
                    matrix[j][i] = 1 / matrix[i][j]
    
    return [[round(val, 2) for val in row] for row in matrix]

# Hàm tính trọng số từ ma trận so sánh đôi
def calculate_weights(pairwise_matrix: List[float]) -> List[float]:
    try:
        size = int(len(pairwise_matrix) ** 0.5)
        if size * size != len(pairwise_matrix):
            raise ValueError("Ma trận không hợp lệ, kích thước không phải là bình phương.")

        matrix = np.array(pairwise_matrix).reshape(size, size)

        # Tính tổng từng cột
        column_sums = np.sum(matrix, axis=0)
        if np.any(column_sums == 0):
            raise ValueError("Tổng cột bằng 0, không thể chuẩn hóa ma trận.")

        # Chuẩn hóa ma trận
        normalized_matrix = matrix / column_sums

        # Tính trọng số (trung bình hàng)
        weights = np.mean(normalized_matrix, axis=1)
        return weights.tolist()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error calculating weights: {str(e)}")

# Hàm tính final_score từ ma trận
def calculate_final_score(weights: List[float], criterion_scores: Dict[str, float], criteria_list: List[str]) -> float:
    try:
        if len(weights) != len(criteria_list):
            raise ValueError("Số lượng trọng số không khớp với danh sách tiêu chí.")

        # Đảm bảo criterion_scores chứa tất cả tiêu chí
        full_criterion_scores = {criterion: criterion_scores.get(criterion, 0.0) for criterion in criteria_list}
        if len(full_criterion_scores) != len(criteria_list):
            missing_criteria = [c for c in criteria_list if c not in full_criterion_scores]
            raise ValueError(f"Phải có đầy đủ tiêu chí trong criterion_scores. Thiếu: {missing_criteria}")

        final_score = 0.0
        for criterion, weight in zip(criteria_list, weights):
            score = full_criterion_scores.get(criterion, 0.0)
            final_score += score * weight
        return final_score
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error calculating final score: {str(e)}")

# Hàm chuyển ma trận 2D thành ma trận phẳng
def flatten_matrix(matrix: List[List[float]]) -> List[float]:
    if not isinstance(matrix, list) or not matrix or not isinstance(matrix[0], list):
        logger.warning(f"Ma trận không hợp lệ, trả về như nguyên bản: {matrix}")
        return matrix if isinstance(matrix, list) else [matrix]
    return [val for row in matrix for val in row]

# Endpoint POST /tchi_user
@router.post("/tchi_user", response_model=TchiUserOutput)
async def add_to_tchi_user(data: TchiUserInput):
    try:
        # Kiểm tra gmail khớp với người dùng đăng nhập
        collection, client = get_tchi_user_collection()
        
        # Lấy danh sách tiêu chí từ criterion_scores
        criteria_list = list(data.criterion_scores.keys())
        if not criteria_list:
            raise HTTPException(status_code=400, detail="Danh sách tiêu chí không được rỗng.")
        
        # Tính ma trận so sánh từ criterion_scores
        scores = list(data.criterion_scores.values())
        comparison_matrix = calculate_comparison_matrix(scores)
        
        # Chuyển ma trận 2D thành mảng phẳng
        flat_comparison_matrix = flatten_matrix(data.comparison_matrix)
        
        # Tính trọng số từ ma trận
        weights = calculate_weights(flat_comparison_matrix)
        
        # Tính final_score
        final_score = calculate_final_score(weights, data.criterion_scores, criteria_list)

        document = {
            "alternative": data.alternative,
            "final_score": final_score,
            "criterion_scores": data.criterion_scores,
            "criteria_list": criteria_list,  # Ensure included
            "criteria_comparison_matrix": flat_comparison_matrix,
            "consistency_ratio": 0.00,  # Hardcoded as per TchiUserOutput
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": None,
           
        }
        result = collection.insert_one(document)
        document["id"] = str(result.inserted_id)
        client.close()
        return TchiUserOutput(**document)
    except Exception as e:
        client.close()
        logger.error(f"Lỗi trong add_to_tchi_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào MongoDB: {str(e)}")

# Endpoint GET /tchi_user
@router.get("", response_model=List[TchiUserOutput])
async def get_tchi_user():
    try:
        collection, client = get_tchi_user_collection()

        # Nếu không cần lọc theo gmail, chỉ lấy tất cả
        results = list(collection.find())
        client.close()

        if not results:
            return []

        formatted_results = []
        for result in results:
            result["id"] = str(result["_id"])
            del result["_id"]
            formatted_results.append(TchiUserOutput(**result))
        return formatted_results
    except Exception as e:
        client.close()
        logger.error(f"Lỗi trong get_tchi_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi truy vấn MongoDB: {str(e)}")

# Endpoint PUT /tchi_user/{id}
@router.put("/{id}", response_model=TchiUserOutput)
async def update_tchi_user(id: str, update_data: UpdateScoresInput):
    try:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="ID không hợp lệ. ID phải là một ObjectId.")

        collection, client = get_tchi_user_collection()
        document = collection.find_one({"_id": ObjectId(id)})
        if not document:
            client.close()
            raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi.")

        update_fields = {
            "updated_at": datetime.utcnow().isoformat()
        }
        logger.info(f"Update data received: {update_data.dict()}")

        # Lấy danh sách tiêu chí từ dữ liệu hiện tại hoặc dữ liệu cập nhật
        criteria_list = update_data.criteria_list or document.get("criteria_list", [])
        if not criteria_list:
            client.close()
            raise HTTPException(status_code=400, detail="Danh sách tiêu chí không được rỗng.")

        # Nếu cập nhật comparison_matrix
        if update_data.comparison_matrix is not None:
            matrix = update_data.comparison_matrix
            expected_size = len(criteria_list) * len(criteria_list)
            if len(matrix) != expected_size:
                client.close()
                raise HTTPException(status_code=400, detail=f"Mảng phẳng phải có đúng {expected_size} phần tử.")
            try:
                matrix = [float(val) for val in matrix]
                if not all(0.111 <= val <= 9 for val in matrix):
                    client.close()
                    raise HTTPException(status_code=400, detail="Giá trị mảng phải nằm trong khoảng từ 0.111 đến 9.")
            except (ValueError, TypeError) as e:
                client.close()
                logger.error(f"Mảng chứa giá trị không hợp lệ: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Mảng chứa giá trị không hợp lệ: {str(e)}")

            update_fields["criteria_comparison_matrix"] = matrix
            update_fields["criteria_list"] = criteria_list
            logger.info(f"Updating criteria_comparison_matrix: {matrix}")

        # Nếu cập nhật consistency_ratio
        if update_data.consistency_ratio is not None:
            cr = float(update_data.consistency_ratio)
            if cr < 0:
                client.close()
                raise HTTPException(status_code=400, detail="Consistency Ratio không được âm.")
            update_fields["consistency_ratio"] = cr
            logger.info(f"Updating consistency_ratio: {cr}")

        # Nếu cập nhật criterion_scores
        if update_data.criterion_scores is not None:
            if set(update_data.criterion_scores.keys()) != set(criteria_list):
                missing_criteria = [c for c in criteria_list if c not in update_data.criterion_scores]
                extra_criteria = [c for c in update_data.criterion_scores if c not in criteria_list]
                client.close()
                raise HTTPException(
                    status_code=400,
                    detail=f"Tiêu chí không khớp. Thiếu: {missing_criteria}, Thừa: {extra_criteria}"
                )
            update_fields["criterion_scores"] = update_data.criterion_scores

        # Tính final_score nếu có comparison_matrix hoặc criterion_scores mới
        if "criteria_comparison_matrix" in update_fields or "criterion_scores" in update_fields:
            # Lấy comparison_matrix và criterion_scores từ dữ liệu mới hoặc dữ liệu cũ
            comparison_matrix = update_fields.get("criteria_comparison_matrix", document.get("criteria_comparison_matrix"))
            criterion_scores = update_fields.get("criterion_scores", document.get("criterion_scores"))

            if not comparison_matrix or not criterion_scores:
                client.close()
                raise HTTPException(status_code=400, detail="Thiếu comparison_matrix hoặc criterion_scores để tính final_score.")

            # Tính trọng số
            weights = calculate_weights(comparison_matrix)

            # Tính final_score
            final_score = calculate_final_score(weights, criterion_scores, criteria_list)
            update_fields["final_score"] = final_score
            logger.info(f"Calculated final_score: {final_score}")

        if not update_fields:
            client.close()
            raise HTTPException(status_code=400, detail="Yêu cầu ít nhất một trường để cập nhật.")

        collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_fields}
        )

        document = collection.find_one({"_id": ObjectId(id)})
        document["id"] = str(document["_id"])
        del document["_id"]
        # Chuyển ma trận thành mảng phẳng nếu cần
        if "criteria_comparison_matrix" in document:
            if isinstance(document["criteria_comparison_matrix"], list) and any(isinstance(x, list) for x in document["criteria_comparison_matrix"]):
                document["criteria_comparison_matrix"] = flatten_matrix(document["criteria_comparison_matrix"])
        client.close()
        return TchiUserOutput(**document)
    except HTTPException as e:
        client.close()
        logger.error(f"HTTPException trong update_tchi_user: {str(e)}")
        raise e
    except Exception as e:
        client.close()
        logger.error(f"Lỗi trong update_tchi_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật MongoDB: {str(e)}")


# Endpoint DELETE /tchi_user/{id}
@router.delete("/{id}")
async def delete_tchi_user(id: str):
    try:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="ID không hợp lệ. ID phải là một ObjectId.")

        collection, client = get_tchi_user_collection()
        
        # Xóa mà không cần kiểm tra gmail
        result = collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            client.close()
            raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi hoặc bạn không có quyền.")
        
        client.close()
        logger.info(f"Đã xóa bản ghi với id: {id}")
        return {"message": "Xóa phương án thành công"}
    except Exception as e:
        client.close()
        logger.error(f"Lỗi trong delete_tchi_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa dữ liệu từ MongoDB: {str(e)}")
