
from CR.mtg import AHPMatrix
from CR.chmt import NormalizedAHPMatrix
import logging as logger

class MTT:
    def __init__(self, ahp_matrix, norm_ahp_matrix):
        if not isinstance(ahp_matrix, AHPMatrix):
            raise ValueError("ahp_matrix phải là một instance của AHPMatrix")
        if not isinstance(norm_ahp_matrix, NormalizedAHPMatrix):
            raise ValueError("norm_ahp_matrix phải là một instance của NormalizedAHPMatrix")
        self.criteria = ahp_matrix.criteria
        self.size = len(self.criteria)
        self.pairwise_matrix = ahp_matrix.matrix  # Ma trận gốc từ AHPMatrix
        self.priority_vector = norm_ahp_matrix.priority_vector  # Vector ưu tiên từ NormalizedAHPMatrix
        self.temp_matrix = None  # Ma trận tạm (weighted sum)
        self.lambda_max = None

    def calculate_temp_matrix(self):
        if self.priority_vector is None:
            logger.warning("Vector ưu tiên chưa được tính. Vui lòng chuẩn hóa ma trận trước!")
            return
        self.temp_matrix = [0] * self.size
        for i in range(self.size):
            for j in range(self.size):
                self.temp_matrix[i] += self.pairwise_matrix[i][j] * self.priority_vector[j]
        logger.info(f"Calculated temp matrix: {self.temp_matrix}")

    def calculate_lambda_max(self):
        if self.temp_matrix is None:
            logger.warning("Ma trận tạm chưa được tính. Vui lòng gọi calculate_temp_matrix() trước!")
            return
        if self.priority_vector is None:
            logger.warning("Vector ưu tiên chưa được tính!")
            return
        lambda_sum = 0
        for i in range(self.size):
            if abs(self.priority_vector[i]) < 1e-10:
                logger.warning(f"Priority vector[{i}] gần 0, bỏ qua.")
                continue
            ratio = self.temp_matrix[i] / self.priority_vector[i]
            logger.info(f"Ratio for {self.criteria[i]}: {ratio:.4f}")
            lambda_sum += ratio
        self.lambda_max = lambda_sum / self.size if self.size > 0 else 0
        logger.info(f"Calculated lambda_max: {self.lambda_max:.4f}")

    def display_temp_matrix(self):
        """Hiển thị ma trận tạm"""
        if self.temp_matrix is None:
            print("Ma trận tạm chưa được tính. Vui lòng gọi calculate_temp_matrix() trước!")
            return
        print("Ma trận tạm (Weighted Sum Matrix):")
        for i, crit in enumerate(self.criteria):
            print(f"{crit:<10}: {self.temp_matrix[i]:.4f}")

    def display_lambda_max(self):
        """Hiển thị lambda_max"""
        if self.lambda_max is None:
            print("Lambda_max chưa được tính. Vui lòng gọi calculate_lambda_max() trước!")
            return
        print(f"\nLambda_max: {self.lambda_max:.4f}")