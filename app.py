from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import numpy as np
import os
import cv2
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from werkzeug.utils import secure_filename
import pandas as pd
import logging
import sys

# Konfigurasi Logging
class SafeStreamHandler(logging.StreamHandler):
    def emit(self, record):
        try:
            super().emit(record)
        except Exception:
            pass

logging.basicConfig(
    level=logging.INFO,
    handlers=[
        SafeStreamHandler(sys.stdout),
        SafeStreamHandler(sys.stderr),
    ]
)

logger = logging.getLogger(__name__)
logger.info("Gunicorn is running...")

app = Flask(__name__)

# Path model lokal
MODEL_PATH = '/app/best_model.keras'

# Memuat model
if os.path.exists(MODEL_PATH):
    model = load_model(MODEL_PATH)
    logger.info(f"Model loaded from {MODEL_PATH}")
else:
    logger.error(f"Model not found at {MODEL_PATH}")
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

# Fungsi Preprocessing Gambar
def preprocess_image(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Invalid image format or corrupted file.")
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (128, 128))
        img = img / 255.0
        img = img_to_array(img)
        img = np.expand_dims(img, axis=0)
        return img
    except Exception as e:
        logger.error(f"Image preprocessing failed: {str(e)}")
        raise

# Fungsi OCR dengan Tesseract
def image_to_text(image_path):
    img = cv2.imread(image_path)
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_blur = cv2.GaussianBlur(img_gray, (5, 5), 0)
    _, img_thresh = cv2.threshold(img_blur, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    pil_img = Image.fromarray(img_thresh)
    custom_config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(pil_img, config=custom_config)

    return text

# Fungsi Ekstraksi Teks ke Format Tabel
def extract_receipt_details(text):
    items = []
    subtotal = None
    tax = None
    total = None

    for line in text.splitlines():
        if 'Subtotal' in line:
            subtotal = line.split()[-1]
        elif 'Tax' in line:
            tax = line.split()[-1]
        elif 'Total' in line:
            total = line.split()[-1]
        else:
            parts = line.split()
            if len(parts) > 1:
                try:
                    price = float(parts[-1].replace('$', '').replace(',', '').replace('€', ''))
                    item = " ".join(parts[:-1])
                    items.append((item, price))
                except ValueError:
                    continue

    items_df = pd.DataFrame(items, columns=['Item', 'Price'])
    summary = {'Subtotal': subtotal, 'Tax': tax, 'Total': total}

    return items_df, summary

# Route Predict
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            logger.error("No file part")
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            logger.error("No selected file")
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)

        # Simpan file sementara di /tmp
        temp_dir = "/tmp"
        os.makedirs(temp_dir, exist_ok=True)
        image_path = os.path.join(temp_dir, filename)
        file.save(image_path)

        # Proses OCR
        extracted_text = image_to_text(image_path)
        logger.debug(f"Extracted Text: {extracted_text}")
        items_df, summary = extract_receipt_details(extracted_text)

        # Prediksi dengan Model Keras
        processed_img = preprocess_image(image_path)
        predictions = model.predict(processed_img)
        predicted_class = np.argmax(predictions, axis=1)

        os.remove(image_path)  # Bersihkan file sementara

        return jsonify({
            'predicted_class': int(predicted_class[0]),
            'confidence': float(np.max(predictions)),
            'items': items_df.to_dict(orient='records'),
            'summary': summary
        })

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        if 'image_path' in locals() and os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv("PORT", 8080)))
