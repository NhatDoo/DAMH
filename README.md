# 🚀 Hệ thống Recommend Đầu Tư Startup

**AHP + AI Graph RAG**

---

## 📌 Giới thiệu

Đề tài **“Xây dựng hệ thống recommend đầu tư cho startup bằng mô hình AHP kết hợp với AI Graph RAG”** nhằm hỗ trợ nhà đầu tư đưa ra quyết định chính xác dựa trên dữ liệu và mô hình phân tích.

Hệ thống kết hợp:

* **AHP (Analytic Hierarchy Process)** → đánh giá và xếp hạng startup theo tiêu chí
* **Graph RAG (Retrieval-Augmented Generation trên đồ thị)** → khai thác tri thức từ dữ liệu liên kết

---

## 🧠 AHP là gì?

AHP là phương pháp ra quyết định đa tiêu chí, giúp:

* So sánh các yếu tố theo cặp
* Tính trọng số
* Xếp hạng phương án tối ưu

<p align="center">
  <img src="https://i.ytimg.com/vi/J4T70o8gjlk/maxresdefault.jpg" width="600"/>
</p>

---

## 🧠 Graph RAG là gì?

Graph RAG là sự kết hợp giữa:

* Graph Database (dữ liệu dạng liên kết)
* RAG (AI truy xuất + sinh nội dung)

👉 Giúp hệ thống:

* Hiểu mối quan hệ giữa các startup
* Đưa ra gợi ý thông minh hơn

<p align="center">
  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1bOdha_PECjb0BCxK0Lmrd6wZWPAnkfPtzw&s" width="600"/>
</p>

---

## ⚙️ Công nghệ sử dụng

* Backend: FastAPI (Python), NodeJS
* AI: Graph RAG, AHP Algorithm
* Database: MongoDB
* Runtime:

  * Python 3.13.2
  * NodeJS 22.14.0
* Package Manager:

  * npm 11.3.0

---

## 🛠️ Hướng dẫn cài đặt

### 1️⃣ Cài đặt môi trường

* Cài đặt **Python 3.13.2**
* Cài đặt **NodeJS**

  ```
  node: 22.14.0
  npm: 11.3.0
  ```
* Cài đặt MongoDB Database Tools:
  https://www.mongodb.com/try/download/database-tools

---

### 2️⃣ Setup môi trường

(Tùy theo project, có thể cần tạo virtualenv hoặc cài dependency)

---

### 3️⃣ Download source code

```bash
git clone <your-repo>
```

---

### 4️⃣ Chạy project

#### 🔹 Backend

```bash
cd AHP/BE
venv\Scripts\activate
uvicorn main:app --reload
```

#### 🔹 Frontend

```bash
cd AHP/FE/fontend
npm start
```

---

## 📊 Dữ liệu mẫu

```bash
mongorestore --db startup_pa_dtb <đường_dẫn_tới_file_backup>
```

---

## 🎯 Mục tiêu hệ thống

* Hỗ trợ quyết định đầu tư startup
* Kết hợp AI + toán học (AHP)
* Tăng độ chính xác trong recommend

---

## 🚀 Hướng phát triển

* Tích hợp LLM mạnh hơn
* Visualization graph
* Dashboard phân tích
* Deploy Docker + CI/CD

---

## 📌 Kết luận

Hệ thống là sự kết hợp giữa:

* AI hiện đại (**Graph RAG**)
* Thuật toán ra quyết định (**AHP**)

👉 Mang lại khả năng recommend đầu tư thông minh, có thể áp dụng thực tế.
