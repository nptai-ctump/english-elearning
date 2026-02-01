# /workspaces/english-elearning/backend/app/models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # teacher, student, admin
    isLocked = Column(Boolean, default=False, nullable=False)  # ← THÊM DÒNG NÀY
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lectures = relationship("Lecture", back_populates="teacher", foreign_keys="Lecture.created_by")
    assignments = relationship("Assignment", back_populates="teacher", foreign_keys="Assignment.created_by")
    attempts = relationship("Attempt", back_populates="student", foreign_keys="Attempt.student_id")
    qa_messages_sent = relationship("QAMessage", back_populates="sender", foreign_keys="QAMessage.from_user_id")
    qa_messages_received = relationship("QAMessage", back_populates="recipient", foreign_keys="QAMessage.to_user_id")
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.to_user_id")
    homework_submissions = relationship("HomeworkSubmission", back_populates="student", foreign_keys="HomeworkSubmission.student_id")


# backend/app/models.py - Cập nhật class Lecture

class Lecture(Base):
    __tablename__ = "lectures"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    filename = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    extracted_text = Column(Text)  # ← THÊM FIELD NÀY
    
    teacher = relationship("User", back_populates="lectures")

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    instructions = Column(Text, nullable=False)
    due_at = Column(DateTime, nullable=False)
    time_limit_minutes = Column(Integer, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    teacher = relationship("User", back_populates="assignments")
    questions = relationship("QuizQuestion", back_populates="assignment")
    attempts = relationship("Attempt", back_populates="assignment")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    choice_a = Column(Text, nullable=False)
    choice_b = Column(Text, nullable=False)
    choice_c = Column(Text, nullable=False)
    choice_d = Column(Text, nullable=False)
    correct = Column(String(1), nullable=False)  # A, B, C, or D
    explanation = Column(Text)
    
    assignment = relationship("Assignment", back_populates="questions")


class Attempt(Base):
    __tablename__ = "attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime)
    score = Column(Integer)
    log = Column(Text)
    
    assignment = relationship("Assignment", back_populates="attempts")
    student = relationship("User", back_populates="attempts")


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    filename = Column(String(255))
    is_late = Column(Boolean, default=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("User", back_populates="homework_submissions")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")


class QAMessage(Base):
    __tablename__ = "qa_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sender = relationship("User", foreign_keys=[from_user_id], back_populates="qa_messages_sent")
    recipient = relationship("User", foreign_keys=[to_user_id], back_populates="qa_messages_received")