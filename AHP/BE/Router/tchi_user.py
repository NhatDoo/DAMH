from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Dict , Optional
from bson import ObjectId
from datetime import datetime
from Router.user import get_current_user
import io
import pandas as pd
from models.user import User
import json
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
# async def get_current_user_gmail(token: str = Depends(oauth2_scheme)) -> str:
#     # TODO: Triển khai logic giải mã JWT để lấy gmail
#     # Ví dụ: Giả lập trả về gmail
#     return "user@example.com"  # Thay bằng logic thực tế, ví dụ: decode_jwt(token)["email"]

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
# @router.post("/tchi_user", response_model=TchiUserOutput)
# async def add_to_tchi_user(data: TchiUserInput):
#     try:
#         # Kiểm tra gmail khớp với người dùng đăng nhập
#         collection, client = get_tchi_user_collection()
        
#         # Lấy danh sách tiêu chí từ criterion_scores
#         criteria_list = list(data.criterion_scores.keys())
#         if not criteria_list:
#             raise HTTPException(status_code=400, detail="Danh sách tiêu chí không được rỗng.")
        
#         # Tính ma trận so sánh từ criterion_scores
#         scores = list(data.criterion_scores.values())
#         comparison_matrix = calculate_comparison_matrix(scores)
        
#         # Chuyển ma trận 2D thành mảng phẳng
#         flat_comparison_matrix = flatten_matrix(data.comparison_matrix)
        
#         # Tính trọng số từ ma trận
#         weights = calculate_weights(flat_comparison_matrix)
        
#         # Tính final_score
#         final_score = calculate_final_score(weights, data.criterion_scores, criteria_list)

#         document = {
#             "alternative": data.alternative,
#             "final_score": final_score,
#             "criterion_scores": data.criterion_scores,
#             "criteria_list": criteria_list,  # Ensure included
#             "criteria_comparison_matrix": flat_comparison_matrix,
#             "consistency_ratio": 0.00,  # Hardcoded as per TchiUserOutput
#             "created_at": datetime.utcnow().isoformat(),
#             "updated_at": None,
           
#         }
#         result = collection.insert_one(document)
#         document["id"] = str(result.inserted_id)
#         client.close()
#         return TchiUserOutput(**document)
#     except Exception as e:
#         client.close()
#         logger.error(f"Lỗi trong add_to_tchi_user: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào MongoDB: {str(e)}")



# @router.post("/tchi_user", response_model=TchiUserOutput)
# async def add_to_tchi_user(data: TchiUserInput):
#     collection = None
#     client = None
#     try:
#         collection, client = get_tchi_user_collection()
        
#         # Lấy danh sách tiêu chí từ criteria_list hoặc criterion_scores
#         criteria_list = data.criteria_list or list(data.criterion_scores.keys())
#         if not criteria_list:
#             raise HTTPException(status_code=400, detail="Danh sách tiêu chí không được rỗng.")
        
#         # Tính ma trận so sánh từ criterion_scores nếu không có comparison_matrix
#         scores = list(data.criterion_scores.values())
#         generated_matrix = calculate_comparison_matrix(scores)
        
#         # Xử lý comparison_matrix
#         expected_size = len(criteria_list) * len(criteria_list)
#         if data.comparison_matrix:
#             flat_comparison_matrix = flatten_matrix(data.comparison_matrix)
#             if len(flat_comparison_matrix) != expected_size:
#                 logger.warning(f"Ma trận so sánh không hợp lệ (kích thước {len(flat_comparison_matrix)} != {expected_size}), sử dụng ma trận được tạo")
#                 flat_comparison_matrix = flatten_matrix(generated_matrix)
#         else:
#             logger.info("Không có comparison_matrix, sử dụng ma trận được tạo từ criterion_scores")
#             flat_comparison_matrix = flatten_matrix(generated_matrix)
        
#         # Kiểm tra giá trị trong flat_comparison_matrix
#         if not all(isinstance(val, (int, float)) and 0.111 <= val <= 9 for val in flat_comparison_matrix):
#             raise HTTPException(status_code=400, detail="Giá trị ma trận phải từ 0.111 đến 9")

#         # Tính trọng số
#         weights = calculate_weights(flat_comparison_matrix)
        
#         # Tính final_score
#         final_score = calculate_final_score(weights, data.criterion_scores, criteria_list)

#         # Tính consistency_ratio (nếu cần)
#         consistency_ratio = data.consistency_ratio or 0.0

#         document = {
#             "alternative": data.alternative,
#             "final_score": final_score,
#             # "criterion_scores": data.criterion_scores,
#             "criteria_list": criteria_list,
#             "criteria_comparison_matrix": flat_comparison_matrix,
#             "consistency_ratio": consistency_ratio,
#             "created_at": datetime.utcnow().isoformat(),
#             "updated_at": None,
#         }
#         result = collection.insert_one(document)
#         document["id"] = str(result.inserted_id)
#         return TchiUserOutput(**document)
#     except Exception as e:
#         logger.error(f"Lỗi trong add_to_tchi_user: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào MongoDB: {str(e)}")
#     finally:
#         if client:
#             client.close()

# @router.post("/tchi_user", response_model=TchiUserOutput)
# async def add_to_tchi_user(data: TchiUserInput, current_user: User = Depends(get_current_user)):
#     collection = None
#     client = None
#     try:
#         # Giả sử get_tchi_user_collection trả về collection và client
#         collection, client = get_tchi_user_collection()
        
#         # Lấy danh sách tiêu chí từ criteria_list hoặc criterion_scores
#         criteria_list = data.criteria_list or list(data.criterion_scores.keys())
#         if not criteria_list:
#             raise HTTPException(status_code=400, detail="Danh sách tiêu chí không được rỗng.")
        
#         # Tính ma trận so sánh từ criterion_scores nếu không có comparison_matrix
#         scores = list(data.criterion_scores.values())
#         generated_matrix = calculate_comparison_matrix(scores)
        
#         # Xử lý comparison_matrix
#         expected_size = len(criteria_list) * len(criteria_list)
#         if data.comparison_matrix:
#             flat_comparison_matrix = flatten_matrix(data.comparison_matrix)
#             if len(flat_comparison_matrix) != expected_size:
#                 logger.warning(f"Ma trận so sánh không hợp lệ (kích thước {len(flat_comparison_matrix)} != {expected_size}), sử dụng ma trận được tạo")
#                 flat_comparison_matrix = flatten_matrix(generated_matrix)
#         else:
#             logger.info("Không có comparison_matrix, sử dụng ma trận được tạo từ criterion_scores")
#             flat_comparison_matrix = flatten_matrix(generated_matrix)
        
#         # Kiểm tra giá trị trong flat_comparison_matrix
#         if not all(isinstance(val, (int, float)) and 0.111 <= val <= 9 for val in flat_comparison_matrix):
#             raise HTTPException(status_code=400, detail="Giá trị ma trận phải từ 0.111 đến 9")

#         # Tính trọng số
#         weights = calculate_weights(flat_comparison_matrix)
        
#         # Tính final_score
#         final_score = calculate_final_score(weights, data.criterion_scores, criteria_list)

#         # Tính consistency_ratio (nếu cần)
#         consistency_ratio = data.consistency_ratio or 0.0

#         # Tạo tài liệu với trường email từ current_user
#         document = {
#             "alternative": data.alternative,
#             "final_score": final_score,
#             "criterion_scores": data.criterion_scores,
#             "criteria_list": criteria_list,
#             "criteria_comparison_matrix": flat_comparison_matrix,
#             "consistency_ratio": consistency_ratio,
#             "email": current_user.email,  
#             "created_at": datetime.utcnow().isoformat(),
#             "updated_at": None,
#         }
#         result = collection.insert_one(document)
#         document["id"] = str(result.inserted_id)
#         return TchiUserOutput(**document)
#     except Exception as e:
#         logger.error(f"Lỗi trong add_to_tchi_user: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào MongoDB: {str(e)}")
#     finally:
#         if client:
#             client.close()
# @router.post("/tchi_user", response_model=TchiUserOutput)
# async def add_to_tchi_user(data: TchiUserInput, current_user: User = Depends(get_current_user)):
#     collection = None
#     client = None
#     try:
#         collection, client = get_tchi_user_collection()
        
#         # Lấy danh sách tiêu chí từ criteria_list hoặc criterion_scores
#         criteria_list = data.criteria_list or list(data.criterion_scores.keys())
#         if not criteria_list:
#             raise HTTPException(status_code=400, detail="Danh sách tiêu chí không được rỗng.")
        
#         # Tính ma trận so sánh từ criterion_scores nếu không có comparison_matrix
#         scores = list(data.criterion_scores.values())
#         generated_matrix = calculate_comparison_matrix(scores)
        
#         # Xử lý comparison_matrix
#         expected_size = len(criteria_list) * len(criteria_list)
#         if data.comparison_matrix:
#             flat_comparison_matrix = flatten_matrix(data.comparison_matrix)
#             if len(flat_comparison_matrix) != expected_size:
#                 logger.warning(f"Ma trận so sánh không hợp lệ (kích thước {len(flat_comparison_matrix)} != {expected_size}), sử dụng ma trận được tạo")
#                 flat_comparison_matrix = flatten_matrix(generated_matrix)
#         else:
#             logger.info("Không có comparison_matrix, sử dụng ma trận được tạo từ criterion_scores")
#             flat_comparison_matrix = flatten_matrix(generated_matrix)
        
#         # Kiểm tra giá trị trong flat_comparison_matrix
#         if not all(isinstance(val, (int, float)) and 0.111 <= val <= 9 for val in flat_comparison_matrix):
#             raise HTTPException(status_code=400, detail="Giá trị ma trận phải từ 0.111 đến 9")

#         # Tính trọng số và lambda_max
#         weights, lambda_max = calculate_weights(flat_comparison_matrix)
        
#         # Tính final_score
#         final_score = calculate_final_score(weights, data.criterion_scores, criteria_list)

#         # Tính consistency_ratio
#         consistency_ratio = data.consistency_ratio or calculate_consistency_ratio(len(criteria_list), generated_matrix)

#         # Tạo tài liệu
#         document = {
#             "alternative": data.alternative,
#             "final_score": final_score,
#             "criterion_scores": data.criterion_scores,
#             "criteria_list": criteria_list,
#             "criteria_comparison_matrix": flat_comparison_matrix,
#             "consistency_ratio": consistency_ratio,
#             "email": current_user.email,
#             "created_at": datetime.utcnow().isoformat(),
#             "updated_at": None,
#             "lambda_max": lambda_max,  # Thêm lambda_max
#             "priority_vector": weights,  # Thêm priority_vector
#         }
#         result = collection.insert_one(document)
#         document["id"] = str(result.inserted_id)
#         return TchiUserOutput(**document)
#     except Exception as e:
#         logger.error(f"Lỗi trong add_to_tchi_user: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào MongoDB: {str(e)}")
#     finally:
#         if client:
#             client.close()
@router.post("/tchi_user", response_model=TchiUserOutput)
async def add_to_tchi_user(data: TchiUserInput, current_user: User = Depends(get_current_user)):
    collection = None
    client = None
    try:
        collection, client = get_tchi_user_collection()
        
        # Lấy danh sách tiêu chí từ criteria_list hoặc criterion_scores
        criteria_list = data.criteria_list or list(data.criterion_scores.keys())
        if not criteria_list:
            raise HTTPException(status_code=400, detail="Danh sách tiêu chí không được rỗng.")
        
        # Tính ma trận so sánh từ criterion_scores nếu không có comparison_matrix
        scores = list(data.criterion_scores.values())
        generated_matrix = calculate_comparison_matrix(scores)
        
        # Xử lý comparison_matrix
        expected_size = len(criteria_list) * len(criteria_list)
        if data.comparison_matrix:
            flat_comparison_matrix = flatten_matrix(data.comparison_matrix)
            if len(flat_comparison_matrix) != expected_size:
                logger.warning(f"Ma trận so sánh không hợp lệ (kích thước {len(flat_comparison_matrix)} != {expected_size}), sử dụng ma trận được tạo")
                flat_comparison_matrix = flatten_matrix(generated_matrix)
        else:
            logger.info("Không có comparison_matrix, sử dụng ma trận được tạo từ criterion_scores")
            flat_comparison_matrix = flatten_matrix(generated_matrix)
        
        # Kiểm tra giá trị trong flat_comparison_matrix
        if not all(isinstance(val, (int, float)) and 0.111 <= val <= 9 for val in flat_comparison_matrix):
            raise HTTPException(status_code=400, detail="Giá trị ma trận phải từ 0.111 đến 9")

        # Tính trọng số
        weights = calculate_weights(flat_comparison_matrix)
        
        # Tính final_score
        final_score = calculate_final_score(weights, data.criterion_scores, criteria_list)

        # Tính consistency_ratio (nếu cần)
        consistency_ratio = data.consistency_ratio or 0.0

        # Tạo tài liệu với thêm trường email từ current_user
        document = {
            "alternative": data.alternative,
            "final_score": final_score,
            "criterion_scores": data.criterion_scores,
            "criteria_list": criteria_list,
            "criteria_comparison_matrix": flat_comparison_matrix,
            "consistency_ratio": consistency_ratio,
            "email": current_user.email,  # Thêm trường email
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": None,
        }
        result = collection.insert_one(document)
        document["id"] = str(result.inserted_id)
        return TchiUserOutput(**document)
    except Exception as e:
        logger.error(f"Lỗi trong add_to_tchi_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào MongoDB: {str(e)}")
    finally:
        if client:
            client.close()
# Endpoint GET /tchi_user




# @router.get("", response_model=List[TchiUserOutput])
# async def get_tchi_user():
#     try:
#         collection, client = get_tchi_user_collection()

#         # Nếu không cần lọc theo gmail, chỉ lấy tất cả
#         results = list(collection.find())
#         client.close()

#         if not results:
#             return []

#         formatted_results = []
#         for result in results:
#             result["id"] = str(result["_id"])
#             del result["_id"]
#             formatted_results.append(TchiUserOutput(**result))
#         return formatted_results
#     except Exception as e:
#         client.close()
#         logger.error(f"Lỗi trong get_tchi_user: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Lỗi khi truy vấn MongoDB: {str(e)}")




@router.get("", response_model=List[TchiUserOutput])
async def get_tchi_user(current_user: User = Depends(get_current_user)):
    try:
        collection, client = get_tchi_user_collection()
        results = list(collection.find({"email": current_user.email}))
        if not results:
            logger.debug(f"No tchi_user found for email: {current_user.email}")
            return []

        formatted_results = []
        for result in results:
            result["id"] = str(result["_id"])
            del result["_id"]
            formatted_results.append(TchiUserOutput(**result))
        return formatted_results
    except Exception as e:
        logger.error(f"Lỗi trong get_tchi_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi truy vấn MongoDB: {str(e)}")
    finally:
        if client:
            client.close()
# @router.get("", response_model=List[TchiUserOutput])
# async def get_tchi_user(current_user: User = Depends(get_current_user)):
#     try:
#         collection, client = get_tchi_user_collection()
#         results = list(collection.find({"email": current_user.email}))
#         if not results:
#             logger.debug(f"Không tìm thấy tchi_user nào cho email: {current_user.email}")
#             return []

#         formatted_results = []
#         for result in results:
#             result["id"] = str(result["_id"])
#             del result["_id"]
#             result.setdefault("lambda_max", 0.0)  # Default if missing
#             result.setdefault("priority_vector", [])  # Default if missing
#             if isinstance(result.get("criteria_comparison_matrix"), list) and any(isinstance(x, list) for x in result["criteria_comparison_matrix"]):
#                 result["criteria_comparison_matrix"] = [val for row in result["criteria_comparison_matrix"] for val in row]
#             formatted_results.append(TchiUserOutput(**result))
#         return formatted_results
#     except Exception as e:
#         logger.error(f"Lỗi trong get_tchi_user: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Lỗi khi truy vấn MongoDB: {str(e)}")
#     finally:
#         if client:
#             client.close()
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
            logger.info(f"Updating criterion_scores: {update_data.criterion_scores}")

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

def calculate_consistency_ratio(size: int, matrix: List[List[float]]) -> float:
    try:
        if size * size != len([val for row in matrix for val in row]):
            raise ValueError("Ma trận không hợp lệ, kích thước không khớp.")

        flat_matrix = [val for row in matrix for val in row]
        matrix_array = np.array(flat_matrix).reshape(size, size)

        # Tính eigenvalue lớn nhất (λ_max)
        eigenvalues = np.linalg.eigvals(matrix_array)
        lambda_max = np.max(np.real(eigenvalues))

        # Tính Consistency Index (CI)
        if size == 1:
            return 0.0
        ci = (lambda_max - size) / (size - 1)

        # Random Index (RI) dựa trên kích thước ma trận
        ri_values = {1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
        ri = ri_values.get(size, 1.51)  # Giá trị mặc định cho n > 10

        # Tính Consistency Ratio (CR)
        cr = ci / ri if ri > 0 else 0.0
        return round(cr, 4)
    except Exception as e:
        logger.error(f"Lỗi tính Consistency Ratio: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error calculating consistency ratio: {str(e)}")

@router.post("/tchi_user/excel", response_model=List[TchiUserOutput])
async def add_tchi_user_from_excel(file: UploadFile = File(...)):
    collection = None
    client = None
    try:
        # Đọc file Excel
        contents = await file.read()
        excel_file = io.BytesIO(contents)
        df = pd.read_excel(excel_file)

        # Lấy danh sách tiêu chí từ tiêu đề cột
        criteria_list = list(df.columns)
        size = len(criteria_list)

        # Kiểm tra số lượng tiêu chí (phải >= 5)
        if size < 5:
            raise HTTPException(status_code=400, detail=f"Số lượng tiêu chí ({size}) nhỏ hơn 5, không hợp lệ.")

        # Kiểm tra số hàng (phải khớp với số cột để tạo ma trận vuông)
        if len(df) != size:
            raise HTTPException(status_code=400, detail=f"Ma trận phải là vuông ({size}x{size}), nhưng nhận được {len(df)} hàng và {size} cột.")

        # Khởi tạo kết nối MongoDB
        collection, client = get_tchi_user_collection()
        results = []

        # Lấy ma trận từ file Excel
        try:
            matrix = df[criteria_list].values.tolist()
            # Chuyển đổi tất cả giá trị thành float và kiểm tra phạm vi
            for i in range(size):
                for j in range(size):
                    value = matrix[i][j]
                    if not isinstance(value, (int, float)):
                        raise ValueError(f"Dòng {i + 1}, cột {criteria_list[j]}: Giá trị phải là số.")
                    if value < 1/9 or value > 9:
                        raise ValueError(f"Dòng {i + 1}, cột {criteria_list[j]}: Giá trị phải từ 0.111 đến 9.")
                    matrix[i][j] = float(value)

            # Tính Consistency Ratio (CR)
            consistency_ratio = calculate_consistency_ratio(size, matrix)
            if consistency_ratio < 0.1:
                logger.warning(f"Ma trận có CR ({consistency_ratio:.2f}) < 0.1, không hợp lệ, bỏ qua.")
                raise HTTPException(status_code=400, detail=f"Ma trận có CR ({consistency_ratio:.2f}) < 0.1, không hợp lệ.")

            # Chuẩn bị document
            document = {
                "criteria_list": criteria_list,
                "criteria_scores": {criteria: 1.0 for criteria in criteria_list},  # Mặc định tất cả tiêu chí có trọng số 1.0
                "final_score": 0.0,  # Mặc định
                "alternative": file.filename,
                "criteria_comparison_matrix": [val for row in matrix for val in row],
                "consistency_ratio": consistency_ratio,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": None,
            }

            # Lưu vào MongoDB
            result = collection.insert_one(document)
            document["id"] = str(result.inserted_id)
            results.append(TchiUserOutput(**document))

        except Exception as e:
            logger.error(f"Lỗi xử lý ma trận trong file Excel: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Lỗi xử lý ma trận: {str(e)}")

        if not results:
            raise HTTPException(status_code=400, detail="Không có dữ liệu nào được xử lý thành công từ file Excel hoặc ma trận có CR < 0.1.")
        return results

    except Exception as e:
        if client:
            client.close()
        logger.error(f"Lỗi trong add_tchi_user_from_excel: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý file Excel: {str(e)}")
    finally:
        if client:
            client.close()

@router.post("/tchi_user/export_pdf")
async def export_tchi_user_pdf(data: TchiUserInput):
    try:
        pdf_path = f"{data.alternative}_results.pdf"
        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.drawString(100, 750, f"Alternative: {data.alternative}")
        c.drawString(100, 730, f"Citerion List: {data.criteria_list}")
        c.drawString(100, 730, f"Citerion Matrix: {data.comparison_matrix}")
        c.drawString(100, 730, f"CR: {data.consistency_ratio:.2f}")
        c.save()
        return FileResponse(pdf_path, media_type='application/pdf', filename=pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")
