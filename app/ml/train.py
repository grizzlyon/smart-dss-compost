import pandas as pd
import os
import joblib
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error

# ======================================
# SETUP DIRECTORY ABSOLUTE PATH
# ======================================
# Memastikan path selalu benar meskipun dijalankan dari direktori berbeda
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "data", "Compost Data.csv")
MODEL_DIR = os.path.join(BASE_DIR, "app", "ml", "models")

# Buat folder models jika belum ada
os.makedirs(MODEL_DIR, exist_ok=True)

def create_label(score):
    if score < 40:
        return "Mentah"
    elif score < 70:
        return "Fase Termofilik"
    return "Matang"

def run_training():
    print(f"Mencari dataset di: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError("Dataset tidak ditemukan. Pastikan file 'Compost Data.csv' diletakkan di folder 'data/'.")

    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip()

    # Validasi Kolom
    required_cols = ["Temperature", "MC(%)", "Ammonia(mg/kg)", "Score"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Kolom '{col}' tidak ditemukan di dataset.")

    # Generate Label
    df["Kematangan"] = df["Score"].apply(create_label)

    # Pisahkan Fitur (X) dan Target (y)
    X = df[["Temperature", "MC(%)", "Ammonia(mg/kg)"]]
    y_class = df["Kematangan"]
    y_reg = df["Score"]

    # Stratified Split (menggunakan y_class agar distribusi seimbang)
    X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42, stratify=y_class
    )

    # ---------------------------------------------------------
    # 1. Melatih Model Classifier (Fase)
    # ---------------------------------------------------------
    print("\n[1/2] Melatih RandomForestClassifier untuk prediksi Fase...")
    clf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
    clf.fit(X_train, yc_train)
    
    yc_pred = clf.predict(X_test)
    print(f"Akurasi Classifier: {accuracy_score(yc_test, yc_pred):.4f}")
    print("Classification Report:\n", classification_report(yc_test, yc_pred))

    # ---------------------------------------------------------
    # 2. Melatih Model Regressor (Maturity Score)
    # ---------------------------------------------------------
    print("\n[2/2] Melatih RandomForestRegressor untuk prediksi Skor (0-100)...")
    reg = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
    reg.fit(X_train, yr_train)
    
    yr_pred = reg.predict(X_test)
    print(f"MSE Regressor: {mean_squared_error(yr_test, yr_pred):.4f}")

    # ---------------------------------------------------------
    # Simpan Model (.pkl)
    # ---------------------------------------------------------
    clf_path = os.path.join(MODEL_DIR, "rf_classifier.pkl")
    reg_path = os.path.join(MODEL_DIR, "rf_regressor.pkl")

    joblib.dump(clf, clf_path)
    joblib.dump(reg, reg_path)

    print(f"\n✅ Proses Selesai! Model berhasil disimpan di:")
    print(f"- {clf_path}")
    print(f"- {reg_path}")

if __name__ == "__main__":
    run_training()