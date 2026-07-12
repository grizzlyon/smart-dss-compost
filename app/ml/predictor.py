import joblib
import os
import warnings
import numpy as np

warnings.filterwarnings("ignore", category=UserWarning)


class MLPredictor:

    def __init__(self):

        self.classifier = None
        self.regressor = None

        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        self.clf_path = os.path.join(
            BASE_DIR,
            "app",
            "ml",
            "models",
            "rf_classifier.pkl"
        )

        self.reg_path = os.path.join(
            BASE_DIR,
            "app",
            "ml",
            "models",
            "rf_regressor.pkl"
        )

        self._load_models()

    def _load_models(self):

        try:

            self.classifier = joblib.load(self.clf_path)
            self.regressor = joblib.load(self.reg_path)

            print("[INFO] Model berhasil dimuat.")

        except Exception as e:

            print(e)

    # ----------------------------------------------------
    # Status Parameter
    # ----------------------------------------------------

    def get_temperature_status(self, value):

        if 45 <= value <= 60:
            return "Optimal"

        elif 35 <= value < 45 or 60 < value <= 65:
            return "Cukup"

        return "Tidak Optimal"

    def get_humidity_status(self, value):

        if 50 <= value <= 65:
            return "Optimal"

        elif 40 <= value < 50 or 65 < value <= 75:
            return "Cukup"

        return "Tidak Optimal"

    def get_gas_status(self, value):

        if value < 15:
            return "Normal"

        elif value < 25:
            return "Sedang"

        return "Tinggi"

    # ----------------------------------------------------
    # Recommendation
    # ----------------------------------------------------

    def get_recommendation(self, label):

        if label == "Mentah":

            return [

                "Tambahkan bahan organik kering.",

                "Lakukan pembalikan kompos.",

                "Tunggu beberapa hari lagi."

            ]

        elif label == "Fase Termofilik":

            return [

                "Pertahankan kelembapan.",

                "Pastikan aerasi tetap baik.",

                "Pantau suhu secara berkala."

            ]

        return [

            "Kompos siap dipanen.",

            "Tidak perlu penambahan air.",

            "Simpan di tempat teduh."

        ]

    # ----------------------------------------------------
    # Predict
    # ----------------------------------------------------

    def predict(
        self,
        temperature,
        humidity,
        gas
    ):

        if self.classifier is None:

            return None

        input_features = np.array([[
            temperature,
            humidity,
            gas
        ]])

        label = self.classifier.predict(input_features)[0]

        score = float(
            self.regressor.predict(input_features)[0]
        )

        score = round(
            max(0, min(100, score)),
            2
        )

        confidence = round(
            float(
                np.max(
                    self.classifier.predict_proba(
                        input_features
                    )[0]
                ) * 100
            ),
            2
        )

        return {

            "score": score,

            "label": label,

            "confidence": confidence,

            "analysis": {

                "temperature": {

                    "value": temperature,

                    "status": self.get_temperature_status(
                        temperature
                    )

                },

                "humidity": {

                    "value": humidity,

                    "status": self.get_humidity_status(
                        humidity
                    )

                },

                "gas": {

                    "value": gas,

                    "status": self.get_gas_status(
                        gas
                    )

                }

            },

            "recommendation":

                self.get_recommendation(label)

        }