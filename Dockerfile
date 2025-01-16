# Gunakan image Python yang sesuai
FROM python:3.9

# Install dependensi untuk Tesseract OCR dan OpenCV (termasuk libGL)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libpng-dev \
    libjpeg-dev \
    libgl1-mesa-glx \
    && apt-get clean

# Set working directory
WORKDIR /app

# Salin file requirements.txt dan install dependensi Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode aplikasi ke container
COPY . /app/

# Salin model ke dalam container
COPY best_model.keras /app/

# Expose port yang digunakan oleh aplikasi (8080 untuk App Engine)
EXPOSE 8080

# Jalankan aplikasi menggunakan Gunicorn
CMD ["gunicorn", "-b", ":8080", "--workers", "2", "app:app"]
