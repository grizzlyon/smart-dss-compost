from pydantic import BaseModel
from typing import List


# ==========================================
# Request
# ==========================================

class PredictionRequest(BaseModel):
    temperature: float
    mc: float
    ammonia: float


# ==========================================
# Analysis Schema
# ==========================================

class ParameterAnalysis(BaseModel):
    value: float
    status: str


class AnalysisResponse(BaseModel):
    temperature: ParameterAnalysis
    humidity: ParameterAnalysis
    gas: ParameterAnalysis


# ==========================================
# Response
# ==========================================

class PredictionResponse(BaseModel):
    score: float
    label: str
    confidence: float
    analysis: AnalysisResponse
    recommendation: List[str]