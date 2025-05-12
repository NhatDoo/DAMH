from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate

class Generator:
    def __init__(self, model_name="llama3.2", ollama_host="http://localhost:11434"):
        self.model_name = model_name
        self.ollama_host = ollama_host
        print(f"Khởi tạo Generator với mô hình: {self.model_name}")
        
        # Khởi tạo OllamaLLM từ langchain-ollama
        self.llm = OllamaLLM(
            model=self.model_name,
            base_url=self.ollama_host,
            temperature=0.3
        )
        
        # Tạo prompt template
        self.prompt_template = PromptTemplate(
            input_variables=["query", "context"],
            template=" Bạn trong vai là 1 người tư vấn đầu tư thân thiện . Luật: chỉ dựa vào nội dung này: {context}\n Đâu là phương án thứ hạng cao nhất (nếu người dùng hỏi về phương án) + Trả lời câu hỏi: {query}\nTrả lời: "
        )

    def generate(self, query, context, max_tokens=100):
        """
        Sinh câu trả lời từ câu hỏi và ngữ cảnh sử dụng LangChain và Ollama.
        - query: Câu hỏi từ người dùng.
        - context: Ngữ cảnh từ Retrieval.
        - max_tokens: Số token tối đa cho câu trả lời (Ollama không hỗ trợ trực tiếp, nhưng để tương thích với API).
        """
        try:
            # Tạo prompt từ template
            prompt = self.prompt_template.format(query=query, context=context)
            
            # Sinh câu trả lời
            response = self.llm.invoke(prompt)
            
            # Trích xuất phần "Trả lời" từ kết quả
            if "Trả lời: " in response:
                answer = response.split("Trả lời: ")[-1].strip()
            else:
                answer = response.strip()
            
            return answer
        
        except Exception as e:
            print(f"Lỗi khi sinh câu trả lời: {e}")
            return "Không thể sinh câu trả lời do lỗi."