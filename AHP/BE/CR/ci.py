from CR.mtt import MTT

class CI:
    def __init__(self, mtt_instance):
        if not isinstance(mtt_instance, MTT):
            raise ValueError("Đầu vào phải là một instance của MTT")
        self.criteria = mtt_instance.criteria
        self.size = len(self.criteria)  # Số tiêu chí (n)
        self.lambda_max = mtt_instance.lambda_max  # Lambda_max từ MTT
        self.consistency_index = None

    def calculate_ci(self):
        if self.lambda_max is None:
            logger.error("Lambda_max chưa được tính. Vui lòng gọi calculate_lambda_max() trong MTT trước!")
            raise ValueError("Lambda_max chưa được tính. Vui lòng gọi calculate_lambda_max() trong MTT trước!")
        self.consistency_index = (self.lambda_max - self.size) / (self.size - 1) if self.size > 1 else 0

    def display_ci(self):
        """Hiển thị Consistency Index (CI)"""
        if self.consistency_index is None:
            print("Consistency Index chưa được tính. Vui lòng gọi calculate_ci() trước!")
            return
        print(f"Consistency Index (CI): {self.consistency_index:.4f}")