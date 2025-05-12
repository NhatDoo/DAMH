import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class Embedder:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.documents = []
        self.embeddings = None
        self.index = faiss.IndexFlatL2(384)  # Khởi tạo index với chiều 384 (all-MiniLM-L6-v2)

    def embed_documents(self, documents):
        self.documents = documents
        if documents:
            self.embeddings = self.model.encode(documents, convert_to_tensor=False)
            self.embeddings = np.array(self.embeddings, dtype=np.float32)
            self.index.reset()  # Xóa index cũ để tránh xung đột
            self.index.add(self.embeddings)  # Thêm embedding vào index
        else:
            self.documents = []
            self.embeddings = None
            self.index.reset()  # Đặt lại index nếu không có tài liệu