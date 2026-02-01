"""
Pydantic Schemas cho API
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from typing import List


# ==================== AUTH SCHEMAS ====================

class LoginReq(BaseModel):
    """Yêu cầu đăng nhập"""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=6, max_length=100, description="Password")


class TokenRes(BaseModel):
    """Response token"""
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    user_id: int


# ==================== USER SCHEMAS ====================

class UserRes(BaseModel):
    """User response"""
    id: int
    username: str
    role: str
    isLocked: bool
    created_at: datetime


# ==================== ASSIGNMENT SCHEMAS ====================

class AssignmentCreate(BaseModel):
    """Tạo bài tập"""
    title: str = Field(..., min_length=1, max_length=200)
    instructions: str
    due_at: datetime
    time_limit_minutes: int = Field(..., gt=0)


class AssignmentRes(BaseModel):
    """Bài tập response"""
    id: int
    title: str
    instructions: str
    due_at: datetime
    time_limit_minutes: int
    created_at: datetime


# ==================== QUIZ SCHEMAS ====================

class QuizQuestionCreate(BaseModel):
    """Tạo câu hỏi trắc nghiệm"""
    prompt: str
    choice_a: str
    choice_b: str
    choice_c: str
    choice_d: str
    correct: str = Field(..., min_length=1, max_length=1, description="A, B, C, or D")
    explanation: Optional[str] = ""


# ==================== ATTEMPT SCHEMAS ====================

class AttemptStartRes(BaseModel):
    """Bắt đầu làm bài response"""
    attempt_id: int
    started_at: datetime
    due_at: datetime
    time_limit_minutes: int


class AttemptFinishReq(BaseModel):
    """Nộp bài request"""
    score: float = Field(..., ge=0, le=100)
    log: str  # JSON string chứa kết quả chi tiết


# ==================== Q&A SCHEMAS ====================

class QAMessageCreate(BaseModel):
    """Gửi tin nhắn Q&A"""
    to_user_id: int
    content: str = Field(..., min_length=1, max_length=1000)


# ==================== HOMEWORK SCHEMAS ====================

class HomeworkSubmissionCreate(BaseModel):
    """Nộp bài tập về nhà"""
    assignment_id: int
    file_path: str