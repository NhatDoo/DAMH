from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Router import alternatives, ahp_results, tchi_user, criteria ,user

app = FastAPI(title="AHP Alternative Ranking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(alternatives.router, prefix="/alternatives", tags=["Alternatives"])
app.include_router(ahp_results.router, prefix="/ahp_results", tags=["AHP Results"])
app.include_router(tchi_user.router, prefix="/tchi_user", tags=["Tchi User"])
app.include_router(criteria.router, prefix="/criteria", tags=["Criteria"])  # Thêm router mới

@app.get("/")
async def root():
    return {"message": "Welcome to the AHP Alternative Ranking API"}