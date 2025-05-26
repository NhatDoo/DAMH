HƯỚNG DẪN CÀI ĐẶT 
1 - cài đặt python bản 3.13.2
2 - cài đặt nodeJS :npm: '11.3.0', node: '22.14.0',
3 - MongoDB database tool : https://www.mongodb.com/try/download/database-tools

Setup môi trường 

3 Download sourcecode 

4 Chạy lần lượt các lệnh sau :
Chạy Backend
cd AHP/BE/venv\Scripts\activate
uvicorn main:app --reload
Chạy Fontend 
cd AHP/FE/fontend 
npm start 

Dữ liệu mẫu :
mongorestore --db startup_pa_dtb đường dẫn tới file backup
