import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from Retrival.retriever import Retriever
from Generation.generation import Generator
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase

class QueryRequest(BaseModel):
    query: str

app = FastAPI(title="RAG API", description="API for Retrieval-Augmented Generation")

# Cấu hình CORS
origins = [
    "http://localhost:3000",  # Origin của ứng dụng React
    "http://localhost:8001",  # Nếu cần test trên cùng cổng API
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo driver Neo4j
neo4j_driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "Nhat123456789"))

# Hàm cập nhật dữ liệu từ Neo4j vào file .txt
def update_data_to_file(data_file_path):
    with open(data_file_path, 'w', encoding='utf-8') as f:
        with neo4j_driver.session() as session:
            # Lấy dữ liệu từ Neo4j (giống như trong Retriever)
            # Tiêu chí và ma trận so sánh tiêu chí
            criteria_query = """
            MATCH (c1:Criterion)-[r:COMPARES]->(c2:Criterion)
            RETURN c1.name AS Criterion1, c2.name AS Criterion2, r.value AS ComparisonValue
            """
            criteria_result = session.run(criteria_query)
            for record in criteria_result:
                doc = f"Tiêu chí '{record['Criterion1']}' so với '{record['Criterion2']}' có giá trị so sánh {record['ComparisonValue']}."
                f.write(doc + "\n")

            # Phương án và ma trận so sánh phương án
            alternatives_query = """
            MATCH (a1:Alternative)-[r:COMPARES]->(a2:Alternative)
            RETURN a1.name AS Alternative1, a2.name AS Alternative2, r.value AS ComparisonValue
            """
            alternatives_result = session.run(alternatives_query)
            for record in alternatives_result:
                doc = f"Phương án '{record['Alternative1']}' so với '{record['Alternative2']}' có giá trị so sánh {record['ComparisonValue']}."
                f.write(doc + "\n")

            # Kết quả xếp hạng
            ranking_query = """
            MATCH (e:Evaluation)-[r:HAS_RESULT]->(a:Alternative)
            RETURN a.name AS Alternative, r.rank AS Rank, r.score AS Score
            ORDER BY r.rank ASC
            """
            ranking_result = session.run(ranking_query)
            for record in ranking_result:
                doc = f"Phương án '{record['Alternative']}' có thứ hạng {record['Rank']} với điểm số {record['Score']}."
                f.write(doc + "\n")

    print(f"Đã cập nhật dữ liệu vào file {data_file_path}.")

# Khởi tạo Retriever với file .txt
data_file_path = r"D:\Project\ĐAMH\RAG\data\sample_doc.txt"
retriever = Retriever(data_file_path=data_file_path)
generator = Generator(model_name="llama3.2")

@app.post("/ask")
async def ask_question(request: QueryRequest):
    try:
        query = request.query
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        # Cập nhật dữ liệu từ Neo4j vào file .txt trước khi xử lý
        update_data_to_file(data_file_path)

        # Tải lại dữ liệu mới từ file .txt
        retriever = Retriever(data_file_path=data_file_path)  # Tái khởi tạo Retriever với dữ liệu mới

        docs, distances = retriever.retrieve(query, k=6)
        retrieved_docs = [
            {"text": doc, "distance": float(dist)} for doc, dist in zip(docs, distances)
        ]
        
        context = retriever.augment(query, k=6)
        
        answer = generator.generate(query, context)
        
        return {
            "query": query,
            "retrieved_docs": retrieved_docs,
            "context": context,
            "answer": answer
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
    finally:
        neo4j_driver.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)