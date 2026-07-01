from fastapi import FastAPI

app = FastAPI(title="SentinelGrid SOC Backend")

@app.get("/")
async def root():
    return {"message": "SentinelGrid SOC backend is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
