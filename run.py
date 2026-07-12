import uvicorn

if __name__ == "__main__":
    print("Menjalankan server Smart-DSS Compost...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)