from CR.mtg import AHPMatrix
import logging as logger

class NormalizedAHPMatrix:
    def __init__(self, ahp_matrix):
        if not isinstance(ahp_matrix, AHPMatrix):
            raise ValueError("Đầu vào phải là một instance của AHPMatrix")
        self.criteria = ahp_matrix.criteria
        self.size = len(self.criteria)
        self.pairwise_matrix = ahp_matrix.matrix  # Sử dụng ma trận từ AHPMatrix
        self.normalized_matrix = None
        self.priority_vector = None

    def normalize(self):
        column_sums = [sum(self.pairwise_matrix[i][j] for i in range(self.size)) for j in range(self.size)]
        if any(sum == 0 for sum in column_sums):
            logger.error("Tổng cột bằng 0, không thể chuẩn hóa ma trận.")
            raise ValueError("Tổng cột bằng 0, không thể chuẩn hóa ma trận.")
        self.normalized_matrix = [[self.pairwise_matrix[i][j] / column_sums[j] 
                                for j in range(self.size)] for i in range(self.size)]

    def calculate_priority_vector(self):
        if self.normalized_matrix is None:
            logger.error("Ma trận chưa được chuẩn hóa. Vui lòng gọi normalize() trước!")
            raise ValueError("Ma trận chưa được chuẩn hóa. Vui lòng gọi normalize() trước!")
        self.priority_vector = [sum(row) / self.size for row in self.normalized_matrix]

    def display_normalized_matrix(self):
        if self.normalized_matrix is None:
            print("Ma trận chưa được chuẩn hóa. Vui lòng gọi hàm normalize() trước!")
            return
        print("Ma trận chuẩn hóa (Normalized Matrix):")
        print(" " * 10, end="")
        for crit in self.criteria:
            print(f"{crit[:8]:<10}", end="")
        print()
        for i in range(self.size):
            print(f"{self.criteria[i][:8]:<10}", end="")
            for j in range(self.size):
                print(f"{self.normalized_matrix[i][j]:<10.4f}", end="")
            print()

    def display_priority_vector(self):
        if self.priority_vector is None:
            print("Vector ưu tiên chưa được tính. Vui lòng gọi hàm calculate_priority_vector() trước!")
            return
        print("\nVector ưu tiên (Priority Vector):")
        for i, crit in enumerate(self.criteria):
            print(f"{crit:<10}: {self.priority_vector[i]:.4f}")