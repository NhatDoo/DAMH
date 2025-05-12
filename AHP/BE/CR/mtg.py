class AHPMatrix:
    def __init__(self, criteria):
        self.criteria = criteria
        self.size = len(criteria)
        self.matrix = [[1.0 if i == j else 1.0 for j in range(self.size)] for i in range(self.size)]

    def update_value(self, row, col, value):
        if row >= self.size or col >= self.size or row < 0 or col < 0:
            print("Vị trí không hợp lệ!")
            return
        if value <= 0:
            print("Giá trị phải lớn hơn 0!")
            return
        self.matrix[row][col] = value
        self.matrix[col][row] = 1.0 / value

    def display_matrix(self):
        print("Ma trận so sánh cặp (Pairwise Comparison Matrix):")
        print(" " * 10, end="")
        for crit in self.criteria:
            print(f"{crit[:8]:<10}", end="")
        print()
        for i in range(self.size):
            print(f"{self.criteria[i][:8]:<10}", end="")
            for j in range(self.size):
                print(f"{self.matrix[i][j]:<10.2f}", end="")
            print()