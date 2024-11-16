import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    MODEL_NAME = os.getenv('MODEL_NAME', 'claude-3-5-sonnet-20241022')
    MAX_TOKENS = 1096
    TEMPERATURE = 0.3
    CORS_ORIGINS = ["http://localhost:3000"]
    APP_NAME = "AI Data Scientist"
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES = ["csv"]

config = Config()
