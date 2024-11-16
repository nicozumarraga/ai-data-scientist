from typing import Dict, Any, Optional, List
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: Any

    model_config = {
        "extra": "allow",
        "arbitrary_types_allowed": True
    }

class AnalysisRequest(BaseModel):
    query: Any
    chat_history: Optional[List[ChatMessage]] = None
    data_info: Optional[Dict[str, Any]] = None

    model_config = {
        "extra": "allow",
        "arbitrary_types_allowed": True
    }

class ExecuteCodeRequest(BaseModel):
    code: Any

    model_config = {
        "extra": "allow",
        "arbitrary_types_allowed": True
    }

class GenerateReportRequest(BaseModel):
    chat_history: Any

    model_config = {
        "extra": "allow",
        "arbitrary_types_allowed": True
    }
