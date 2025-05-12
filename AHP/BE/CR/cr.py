from CR.ci import CI

class CR:
    def __init__(self, ci_instance):
        if not isinstance(ci_instance, CI):
            raise ValueError("Đầu vào phải là một instance của CI")
        self.criteria = ci_instance.criteria
        self.size = len(self.criteria)  # Số tiêu chí (n)
        self.consistency_index = ci_instance.consistency_index  # CI từ CI class
        self.random_index_table = {
            1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
            6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
        }
        self.random_index = self.random_index_table.get(self.size, 1.49)  # Mặc định 1.49 nếu n > 10
        self.consistency_ratio = None

    def calculate_cr(self):
        if self.consistency_index is None:
            logger.error("Consistency Index chưa được tính. Vui lòng gọi calculate_ci() trong CI trước!")
            raise ValueError("Consistency Index chưa được tính. Vui lòng gọi calculate_ci() trong CI trước!")
        if self.random_index == 0:
            logger.info("Random Index bằng 0 (n <= 2), CR được đặt thành 0.")
            self.consistency_ratio = 0
            return
        self.consistency_ratio = self.consistency_index / self.random_index

    def display_cr(self):
        """Hiển thị Consistency Ratio (CR)"""
        if self.consistency_ratio is None:
            print("Consistency Ratio chưa được tính. Vui lòng gọi calculate_cr() trước!")
            return
        print(f"Consistency Ratio (CR): {self.consistency_ratio:.4f}")
        if self.consistency_ratio <= 0.1:
            print("CR <= 0.1: Ma trận có tính nhất quán chấp nhận được.")
        else:
            print("CR > 0.1: Ma trận không đủ nhất quán, cần xem lại các giá trị so sánh cặp.")