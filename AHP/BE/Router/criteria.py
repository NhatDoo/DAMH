from fastapi import APIRouter, HTTPException, File, UploadFile
import json
import logging
import pandas as pd
from typing import List
from models.criteria import CriteriaInput, CriteriaOutput
from CR.mtg import AHPMatrix
from CR.chmt import NormalizedAHPMatrix
from CR.mtt import MTT
from CR.ci import CI
from CR.cr import CR
import tempfile
import os

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_matrix_size(criteria_list: List[str], matrix: List[float]) -> None:
    n = len(criteria_list)
    expected_size = n * n
    if len(matrix) != expected_size:
        raise HTTPException(
            status_code=400,
            detail=f"Kích thước ma trận ({len(matrix)}) không khớp với số tiêu chí ({n}x{n} = {expected_size})."
        )

def reshape_matrix(flat_matrix: List[float], n: int) -> List[List[float]]:
    return [flat_matrix[i * n:(i + 1) * n] for i in range(n)]

def read_excel_matrix(file: UploadFile):
    try:
        # Lưu file tạm thời
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            content = file.file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Đọc file Excel
        df = pd.read_excel(tmp_path, sheet_name="PairwiseMatrix", index_col=0)
        criteria_list = df.index.tolist()
        matrix = df.values
        n = len(criteria_list)

        # Xóa file tạm
        os.unlink(tmp_path)

        if matrix.shape != (n, n):
            raise HTTPException(status_code=400, detail="Ma trận trong Excel không phải vuông.")
        if (matrix <= 0).any():
            raise HTTPException(status_code=400, detail="Ma trận chứa giá trị không dương.")

        flat_matrix = matrix.flatten().tolist()
        return criteria_list, flat_matrix
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc file Excel: {str(e)}")

@router.post("/criteria/calculate_cr", response_model=CriteriaOutput)
async def calculate_criteria_cr(input_data: CriteriaInput):
    try:
        criteria_list = input_data.criteria_list
        n = len(criteria_list)
        logger.info(f"Processing {n} criteria: {criteria_list}")
        validate_matrix_size(criteria_list, input_data.pairwise_matrix)

        if any(x <= 0 for x in input_data.pairwise_matrix):
            raise HTTPException(status_code=400, detail="Giá trị ma trận phải là số dương.")

        if n == 1:
            if input_data.pairwise_matrix != [1]:
                raise HTTPException(status_code=400, detail="Ma trận cho 1 tiêu chí phải là [1].")
            output = CriteriaOutput(
                criteria_list=criteria_list,
                criteria_priority_vector=[1.0],
                consistency_ratio=0.0
            )
            with open("D:/Project/AHP/BE/CR/criteria_data.json", "w") as f:
                json.dump({
                    "criteria_list": output.criteria_list,
                    "criteria_priority_vector": output.criteria_priority_vector,
                    "consistency_ratio": output.consistency_ratio
                }, f, indent=4)
            return output

        matrix = reshape_matrix(input_data.pairwise_matrix, n)
        logger.info(f"Input matrix: {matrix}")

        ahp = AHPMatrix(criteria_list)
        for i in range(n):
            for j in range(n):
                if i != j:
                    ahp.update_value(i, j, matrix[i][j])
        ahp.display_matrix()

        norm_ahp = NormalizedAHPMatrix(ahp)
        norm_ahp.normalize()
        norm_ahp.calculate_priority_vector()
        priority_vector = norm_ahp.priority_vector
        if hasattr(priority_vector, 'tolist'):
            priority_vector = priority_vector.tolist()
        logger.info(f"Priority vector: {priority_vector}")

        # Sử dụng MTT, CI, và CR để tính Consistency Ratio
        mtt = MTT(ahp_matrix=ahp, norm_ahp_matrix=norm_ahp)
        mtt.calculate_temp_matrix()
        mtt.calculate_lambda_max()
        
        ci = CI(mtt_instance=mtt)
        ci.calculate_ci()
        
        cr = CR(ci_instance=ci)
        cr.calculate_cr()
        consistency_ratio = cr.consistency_ratio
        logger.info(f"Final CR: {consistency_ratio}")

        # Điều chỉnh CR theo logic ban đầu (nếu cần)
        if 0.009 < consistency_ratio < 0.011:
            consistency_ratio = 0.01
        consistency_ratio = max(consistency_ratio, 0.0)

        if consistency_ratio > 0.1:
            raise HTTPException(
                status_code=400,
                detail=f"Ma trận không nhất quán (CR = {consistency_ratio:.4f} > 0.1). Vui lòng điều chỉnh ma trận so sánh đôi."
            )

        output = CriteriaOutput(
            criteria_list=criteria_list,
            criteria_priority_vector=priority_vector,
            consistency_ratio=consistency_ratio
        )

        try:
            with open("D:/Project/AHP/BE/CR/criteria_data.json", "w") as f:
                json.dump({
                    "criteria_list": output.criteria_list,
                    "criteria_priority_vector": output.criteria_priority_vector,
                    "consistency_ratio": output.consistency_ratio
                }, f, indent=4)
            logger.info("Saved to criteria_data.json")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi lưu file JSON: {str(e)}")

        return output
    except Exception as e:
        logger.error(f"Error in calculate_criteria_cr: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi tính CR: {str(e)}")

@router.post("/calculate_cr_from_excel_upload", response_model=CriteriaOutput)
async def calculate_cr_from_excel_upload(file: UploadFile = File(...)):
    try:
        # Đọc ma trận từ file Excel
        criteria_list, flat_matrix = read_excel_matrix(file)
        n = len(criteria_list)
        logger.info(f"Processing {n} criteria from uploaded Excel: {criteria_list}")

        # Tái sử dụng logic tính CR
        input_data = CriteriaInput(criteria_list=criteria_list, pairwise_matrix=flat_matrix)
        return await calculate_criteria_cr(input_data)
    except Exception as e:
        logger.error(f"Error in calculate_cr_from_excel_upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi tính CR từ Excel upload: {str(e)}")