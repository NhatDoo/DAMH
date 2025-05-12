import os
from sentence_transformers import SentenceTransformer
import numpy as np
import torch
import faiss
from neo4j import GraphDatabase

class Retriever:
    def __init__(self, data_file_path=r"D:\Project\ĐAMH\RAG\data\sample_doc.txt", 
                 neo4j_uri="bolt://localhost:7687", neo4j_user="neo4j", neo4j_password="Nhat123456789", 
                 model_name='all-MiniLM-L6-v2'):
        self.data_file_path = data_file_path
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.encoder = SentenceTransformer(model_name, device=self.device)
        
        # Kết nối với Neo4j và lưu dữ liệu vào file .txt
        self.driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        self._export_documents_to_file()
        
        # Đọc tài liệu từ file .txt
        self.documents = self._load_documents_from_file(data_file_path)
        self.document_embeddings = self._embed_documents()
        
        # Tạo chỉ mục FAISS
        self.index = self._create_faiss_index()

    def _export_documents_to_file(self):
        """Lấy dữ liệu từ Neo4j và lưu vào file .txt."""
        # Tạo thư mục nếu chưa tồn tại
        os.makedirs(os.path.dirname(self.data_file_path), exist_ok=True)
        
        # Mở file để ghi
        with open(self.data_file_path, 'w', encoding='utf-8') as f:
            with self.driver.session() as session:
                # Tiêu chí và ma trận so sánh tiêu chí
                criteria_query = """
                MATCH (c1:Criterion)-[r:COMPARES]->(c2:Criterion)
                RETURN c1.name AS Criterion1, c2.name AS Criterion2, r.value AS ComparisonValue
                """
                criteria_result = session.run(criteria_query)
                for record in criteria_result:
                    doc = f"Tiêu chí '{record['Criterion1']}' so với '{record['Criterion2']}' có giá trị so sánh {record['ComparisonValue']}."
                    f.write(doc + "\n")
                    print(f"- {doc}")

                # Phương án và ma trận so sánh phương án
                alternatives_query = """
                MATCH (a1:Alternative)-[r:COMPARES]->(a2:Alternative)
                RETURN a1.name AS Alternative1, a2.name AS Alternative2, r.value AS ComparisonValue
                """
                alternatives_result = session.run(alternatives_query)
                for record in alternatives_result:
                    doc = f"Phương án '{record['Alternative1']}' so với '{record['Alternative2']}' có giá trị so sánh {record['ComparisonValue']}."
                    f.write(doc + "\n")
                    print(f"- {doc}")

                # Kết quả xếp hạng (gộp thành các tài liệu riêng lẻ)
                ranking_query = """
                MATCH (e:Evaluation)-[r:HAS_RESULT]->(a:Alternative)
                RETURN a.name AS Alternative, r.rank AS Rank, r.score AS Score
                ORDER BY r.rank ASC
                """
                ranking_result = session.run(ranking_query)
                for record in ranking_result:
                    doc = f"Phương án '{record['Alternative']}' có thứ hạng {record['Rank']} với điểm số {record['Score']}."
                    f.write(doc + "\n")
                    print(f"- {doc}")

        print(f"Đã lưu dữ liệu vào file {self.data_file_path}.")

    def _load_documents_from_file(self, file_path):
        """Đọc tài liệu từ file .txt."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} không tồn tại.")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            documents = [line.strip() for line in f if line.strip()]
        
        print(f"Đã tải {len(documents)} tài liệu từ file {file_path}:")
        for i, doc in enumerate(documents, 1):
            print(f"{i}. {doc}")
        
        return documents

    def _embed_documents(self):
        """Tạo embedding cho các tài liệu."""
        if not self.documents:
            return np.array([])
        
        embeddings = self.encoder.encode(self.documents, convert_to_tensor=False, device=self.device)
        return np.array(embeddings, dtype=np.float32)

    def _create_faiss_index(self):
        """Tạo chỉ mục FAISS cho embedding."""
        dimension = self.document_embeddings.shape[1]  # Kích thước vector embedding
        index = faiss.IndexFlatL2(dimension)  # Sử dụng khoảng cách L2
        index.add(self.document_embeddings)
        print(f"Đã tạo chỉ mục FAISS với {len(self.documents)} tài liệu.")
        return index

    def retrieve(self, query, k=5):
        """Truy xuất các tài liệu gần nhất với truy vấn."""
        print(f"Đang tìm kiếm với k={k}")
        query_embedding = self.encoder.encode([query], convert_to_tensor=False, device=self.device)
        query_embedding = np.array(query_embedding, dtype=np.float32)
        
        distances, indices = self.index.search(query_embedding, k)
        distances = distances[0]
        indices = indices[0]
        
        print("Khoảng cách của các tài liệu:")
        retrieved_docs = []
        for i, (dist, idx) in enumerate(zip(distances, indices)):
            if idx < len(self.documents):  # Đảm bảo chỉ số hợp lệ
                doc = self.documents[idx]
                print(f"{i+1}. Tài liệu: '{doc}' - Khoảng cách: {dist:.4f}")
                retrieved_docs.append((doc, dist))
        
        print(f"Số kết quả trả về: {len(retrieved_docs)}")
        
        retrieved_docs = sorted(retrieved_docs, key=lambda x: x[1])
        docs = [doc for doc, dist in retrieved_docs]
        distances = [dist for doc, dist in retrieved_docs]
        
        return docs, distances

    def augment(self, query, k=5):
        """Tạo ngữ cảnh từ các tài liệu truy xuất được."""
        docs, distances = self.retrieve(query, k=k)
        if not docs:
            return "Không tìm thấy tài liệu liên quan phù hợp."
        context = ". ".join(doc.strip() for doc in docs if doc.strip()) + "."
        return context

    def close(self):
        """Đóng kết nối Neo4j."""
        self.driver.close()

# Ví dụ sử dụng
if __name__ == "__main__":
    # Khởi tạo Retriever
    retriever = Retriever(
        data_file_path=r"D:\Project\ĐAMH\RAG\data\sample_doc.txt",
        neo4j_uri="bolt://localhost:7687",
        neo4j_user="neo4j",
        neo4j_password="Nhat123456789"  # Thay bằng mật khẩu thực tế
    )
    
    # Truy vấn ví dụ
    query = "Phương án nào có điểm cao nhất?"
    context = retriever.augment(query, k=5)
    print("Ngữ cảnh:", context)
    
    # Đóng kết nối
    retriever.close()