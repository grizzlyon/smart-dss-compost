from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart-DSS Compost"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./dss_compost.db"
    
    # ML Models path
    MODEL_CLASSIFIER_PATH: str = "app/ml/models/rf_classifier.pkl"
    MODEL_REGRESSOR_PATH: str = "app/ml/models/rf_regressor.pkl"

    class Config:
        case_sensitive = True

settings = Settings()