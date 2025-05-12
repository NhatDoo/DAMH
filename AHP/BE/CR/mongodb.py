from pymongo import MongoClient

# Kết nối với MongoDB
def get_mongo_client():
    client = MongoClient("mongodb://localhost:27017/")
    return client

# Lấy database và collection
def get_ahp_collection():
    client = get_mongo_client()
    db = client["startup_pa_dtb"]  # Tên database
    collection = db["startup_pa_dtb"]  # Tên collection
    return collection, client

# Đóng kết nối MongoDB
def close_mongo_client(client):
    client.close()