# Menggunakan Python versi 3.11 yang stabil
FROM python:3.11-slim

# Menentukan letak folder di dalam server
WORKDIR /code

# Menginstal semua library Anda
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# Memindahkan seluruh file proyek ke dalam server
COPY ./ /code/

# Menyalakan Uvicorn di port khusus Hugging Face (7860)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]