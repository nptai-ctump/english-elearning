"""
English E-Learning Backend API
FastAPI Application - Giáo viên & Sinh viên
"""
# Thêm import ở đầu file
from .utils.file_parser import (
    extract_text_from_file, 
    detect_file_type, 
    parse_student_list
)
from .utils.question_generator import generate_all_questions
from .utils.tts import text_to_speech, get_audio_url, generate_vocabulary_audio

import os
from datetime import datetime
from typing import List, Optional
from fastapi import (
    FastAPI, Depends, UploadFile, File, Form, HTTPException, 
    WebSocket, status, Response, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets

from .db import Base, engine, get_db, SessionLocal
from .models import (
    User, Lecture, Assignment, QuizQuestion, Attempt, 
    HomeworkSubmission, Notification, QAMessage
)
from .schemas import (
    LoginReq, TokenRes, AssignmentCreate, AssignmentRes,
    QuizQuestionCreate, AttemptStartRes, AttemptFinishReq, 
    QAMessageCreate, UserRes
)
from .auth import (
    hash_pw, verify_pw, create_token, require_auth, 
    require_role, JWT_SECRET, JWT_ALGORITHM
)
from .ws import ws_manager
from .utils_text import extract_vocab, make_sample_sentences

# ==================== CONFIGURATION ====================

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Khởi tạo FastAPI app
app = FastAPI(
    title="English E-Learning API",
    description="API cho hệ thống học tiếng Anh - Giáo viên & Sinh viên",
    version="1.0.0"
)

# ==================== CORS MIDDLEWARE ====================

# backend/app/main.py - Dòng ~25-35

# Cấu hình CORS cho GitHub Codespaces và development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Local dev
        "http://localhost:3000",      # React dev
        "https://*.github.dev",       # GitHub Codespaces - wildcard subdomain
        "https://*.githubpreview.dev" # GitHub Codespaces preview
    ],
    allow_credentials=True,           # Cần True để gửi Authorization header
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ==================== DATABASE INITIALIZATION ====================

# Tạo tất cả các bảng trong database
Base.metadata.create_all(bind=engine)

# ==================== DEMO DATA SEEDING ====================

def seed_users(db: Session):
    """
    Tạo user demo nếu chưa tồn tại
    """
    def ensure_user(username: str, password: str, role: str):
        user = db.query(User).filter(User.username == username).first()
        if not user:
            db.add(User(
                username=username, 
                password_hash=hash_pw(password), 
                role=role
            ))
            db.commit()
            print(f"✓ Created demo user: {username} ({role})")

    ensure_user("gv001", "123456", "teacher")
    ensure_user("sv001", "123456", "student")
    ensure_user("admin", "admin123", "admin")

# ==================== STARTUP EVENT ====================

@app.on_event("startup")
async def startup_event():
    """
    Chạy khi server khởi động
    """
    print("=" * 50)
    print("🚀 Starting English E-Learning Backend...")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        seed_users(db)
        print("✓ Database initialized")
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
    finally:
        db.close()
    
    print(f"✓ Upload directory: {UPLOAD_DIR}")
    print(f"✓ Server running on http://localhost:8000")
    print("=" * 50)

# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """
    Health check endpoint
    """
    return {
        "status": "ok",
        "message": "English E-Learning API is running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """
    Kiểm tra sức khỏe hệ thống
    """
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat()
    }

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post(
    "/auth/login", 
    response_model=TokenRes,
    summary="Đăng nhập hệ thống",
    description="""
    Đăng nhập với username và password.
    
    **Demo accounts:**
    - Giáo viên: `gv001` / `123456`
    - Sinh viên: `sv001` / `123456`
    - Admin: `admin` / `admin123`
    """
)
def login(
    req: LoginReq, 
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Xử lý đăng nhập
    """
    # Tìm user theo username
    user = db.query(User).filter(User.username == req.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tài khoản hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Kiểm tra mật khẩu
    if not verify_pw(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tài khoản hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Kiểm tra tài khoản bị khóa
    if user.isLocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
        )
    
    # Tạo JWT token
    access_token = create_token(user.username, user.role)
    
    # Trả về token và thông tin user
    return TokenRes(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        user_id=user.id
    )


@app.post("/auth/logout", summary="Đăng xuất")
def logout():
    """
    Đăng xuất (client sẽ xóa token ở phía frontend)
    """
    return {"message": "Đăng xuất thành công"}


@app.get(
    "/auth/me", 
    response_model=UserRes,
    summary="Lấy thông tin user hiện tại"
)
def get_current_user(
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Lấy thông tin của user đang đăng nhập
    """
    current_user = db.query(User).filter(User.username == user["username"]).first()
    
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserRes(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        isLocked=current_user.isLocked,
        created_at=current_user.created_at
    )

# ==================== ADMIN ENDPOINTS ====================

@app.post(
    "/admin/reset-demo",
    summary="Reset demo users (DEV ONLY)",
    tags=["admin"]
)
def reset_demo_users(db: Session = Depends(get_db)):
    """
    Reset mật khẩu demo users về mặc định
    CHỈ DÙNG TRONG MÔI TRƯỜNG DEV
    """
    try:
        users = [
            ("gv001", "123456", "teacher"),
            ("sv001", "123456", "student"),
            ("admin", "admin123", "admin")
        ]
        
        for username, password, role in users:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.password_hash = hash_pw(password)
                user.role = role
            else:
                db.add(User(
                    username=username,
                    password_hash=hash_pw(password),
                    role=role
                ))
        
        db.commit()
        
        return {
            "success": True,
            "message": "Reset demo users thành công",
            "demo_accounts": {
                "gv001": {"password": "123456", "role": "teacher"},
                "sv001": {"password": "123456", "role": "student"},
                "admin": {"password": "admin123", "role": "admin"}
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting users: {str(e)}")


@app.get(
    "/admin/users",
    response_model=List[UserRes],
    summary="Danh sách tất cả users",
    tags=["admin"]
)
def list_all_users(
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    """
    Lấy danh sách tất cả users (chỉ admin)
    """
    users = db.query(User).all()
    return [
        UserRes(
            id=u.id,
            username=u.username,
            role=u.role,
            isLocked=u.isLocked,
            created_at=u.created_at
        )
        for u in users
    ]

# ==================== TEACHER ENDPOINTS ====================

@app.post(
    "/teacher/change-password",
    summary="Đổi mật khẩu",
    tags=["teacher"]
)
def change_password(
    new_password: str = Form(..., min_length=6, description="Mật khẩu mới (tối thiểu 6 ký tự)"),
    confirm_password: str = Form(..., description="Xác nhận mật khẩu"),
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Giáo viên đổi mật khẩu
    """
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Mật khẩu xác nhận không khớp")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự")
    
    current_user = db.query(User).filter(User.username == user["username"]).first()
    
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cập nhật mật khẩu
    current_user.password_hash = hash_pw(new_password)
    db.commit()
    
    return {"success": True, "message": "Đổi mật khẩu thành công"}


@app.post(
    "/teacher/lectures/upload",
    summary="Tải lên bài giảng",
    tags=["teacher", "lectures"]
)
def upload_lecture(
    title: str = Form(..., description="Tiêu đề bài giảng"),
    description: str = Form("", description="Mô tả bài giảng"),
    file: UploadFile = File(..., description="File bài giảng (PDF, DOC, PPT...)"),
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Giáo viên tải lên bài giảng
    """
    # Kiểm tra file extension (optional)
    allowed_extensions = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Tạo filename unique
    timestamp = int(datetime.utcnow().timestamp())
    safe_filename = f"{timestamp}_{secrets.token_hex(8)}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Lưu file
    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    # Tạo lecture trong database
    teacher = db.query(User).filter(User.username == user["username"]).first()
    lecture = Lecture(
        title=title,
        description=description,
        file_path=file_path,
        created_by=teacher.id,
        filename=file.filename
    )
    
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    
    return {
        "success": True,
        "lecture_id": lecture.id,
        "message": "Tải lên bài giảng thành công"
    }


@app.get(
    "/lectures",
    summary="Danh sách bài giảng",
    tags=["lectures"]
)
def list_lectures(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Lấy danh sách tất cả bài giảng (tất cả user đều xem được)
    """
    lectures = db.query(Lecture)\
        .order_by(Lecture.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return [
        {
            "id": lecture.id,
            "title": lecture.title,
            "description": lecture.description,
            "filename": lecture.filename,
            "created_at": lecture.created_at,
            "created_by": lecture.teacher.username
        }
        for lecture in lectures
    ]


@app.post(
    "/teacher/assignments",
    response_model=AssignmentRes,
    summary="Tạo bài tập",
    tags=["teacher", "assignments"]
)
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Giáo viên tạo bài tập mới
    """
    teacher = db.query(User).filter(User.username == user["username"]).first()
    
    assignment = Assignment(
        title=payload.title,
        instructions=payload.instructions,
        due_at=payload.due_at,
        time_limit_minutes=payload.time_limit_minutes,
        created_by=teacher.id
    )
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return AssignmentRes(
        id=assignment.id,
        title=assignment.title,
        instructions=assignment.instructions,
        due_at=assignment.due_at,
        time_limit_minutes=assignment.time_limit_minutes,
        created_at=assignment.created_at
    )


@app.post(
    "/teacher/assignments/{assignment_id}/questions",
    summary="Thêm câu hỏi vào bài tập",
    tags=["teacher", "assignments"]
)
def add_question_to_assignment(
    assignment_id: int,
    question: QuizQuestionCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Thêm câu hỏi trắc nghiệm vào bài tập
    """
    # Kiểm tra assignment tồn tại
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Tạo câu hỏi
    quiz_question = QuizQuestion(
        assignment_id=assignment_id,
        prompt=question.prompt,
        choice_a=question.choice_a,
        choice_b=question.choice_b,
        choice_c=question.choice_c,
        choice_d=question.choice_d,
        correct=question.correct.upper(),
        explanation=question.explanation or ""
    )
    
    db.add(quiz_question)
    db.commit()
    
    return {
        "success": True,
        "question_id": quiz_question.id,
        "message": "Thêm câu hỏi thành công"
    }


@app.get(
    "/teacher/attempts",
    summary="Xem kết quả làm bài của sinh viên",
    tags=["teacher", "attempts"]
)
def get_all_attempts(
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Giáo viên xem tất cả attempts của sinh viên
    """
    attempts = db.query(Attempt)\
        .join(User, Attempt.student_id == User.id)\
        .join(Assignment, Attempt.assignment_id == Assignment.id)\
        .order_by(Attempt.started_at.desc())\
        .all()
    
    return [
        {
            "id": attempt.id,
            "assignment_id": attempt.assignment_id,
            "assignment_title": attempt.assignment.title,
            "student_id": attempt.student_id,
            "student_username": attempt.student.username,
            "started_at": attempt.started_at,
            "finished_at": attempt.finished_at,
            "score": attempt.score,
            "log": attempt.log
        }
        for attempt in attempts
    ]

@app.post("/teacher/lectures/upload-with-questions")
async def upload_lecture_with_questions(
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    generate_questions: bool = Form(False),
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Upload lecture and optionally generate questions automatically
    Supports: PDF, DOCX, PPTX
    """
    # Validate file type
    file_type = detect_file_type(file.filename)
    allowed_types = ['pdf', 'docx', 'pptx']
    
    if file_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(allowed_types)}"
        )
    
    # Save file
    timestamp = int(datetime.utcnow().timestamp())
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Extract text from file
    extracted_text = ""
    questions_generated = []
    
    if generate_questions:
        try:
            extracted_text = extract_text_from_file(file_path, file_type)
            
            if not extracted_text or len(extracted_text) < 50:
                raise ValueError("Could not extract enough text from file")
            
            # Generate questions
            questions_generated = generate_all_questions(extracted_text, {
                'vocabulary': 5,
                'fill_blank': 5,
                'multiple_choice': 10,
                'reading_comprehension': 3
            })
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            # Continue without questions if generation fails
    
    # Create lecture
    teacher = db.query(User).filter(User.username == user["username"]).first()
    lecture = Lecture(
        title=title,
        description=description,
        file_path=file_path,
        filename=file.filename,
        created_by=teacher.id,
        extracted_text=extracted_text[:5000] if extracted_text else None  # Store first 5000 chars
    )
    
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    
    return {
        "success": True,
        "lecture_id": lecture.id,
        "file_type": file_type,
        "questions_generated": len(questions_generated),
        "message": "Lecture uploaded successfully"
    }


@app.post("/teacher/students/bulk-upload")
async def bulk_upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Bulk upload students from CSV or Excel file
    Expected columns: username, password, email, full_name
    """
    # Validate file type
    file_type = detect_file_type(file.filename)
    if file_type not in ['csv', 'excel']:
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Please upload CSV or Excel file"
        )
    
    # Save file temporarily
    timestamp = int(datetime.utcnow().timestamp())
    safe_filename = f"students_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Parse student list
    try:
        students_data = parse_student_list(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    # Create students in database
    created_count = 0
    skipped_count = 0
    errors = []
    
    for student_data in students_data:
        try:
            # Check if username already exists
            existing = db.query(User).filter(User.username == student_data['username']).first()
            
            if existing:
                skipped_count += 1
                continue
            
            # Create new student
            student = User(
                username=student_data['username'],
                password_hash=hash_pw(student_data['password']),
                email=student_data['email'],
                full_name=student_data.get('full_name', student_data['username']),
                role='student'
            )
            
            db.add(student)
            created_count += 1
            
        except Exception as e:
            errors.append(f"{student_data['username']}: {str(e)}")
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    # Clean up temp file
    try:
        os.remove(file_path)
    except:
        pass
    
    return {
        "success": True,
        "created": created_count,
        "skipped": skipped_count,
        "total": len(students_data),
        "errors": errors[:10],  # Return max 10 errors
        "message": f"Created {created_count} students, skipped {skipped_count}"
    }


@app.get("/lectures/{lecture_id}/extracted-text")
def get_lecture_text(
    lecture_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """Get extracted text from lecture file"""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    return {
        "lecture_id": lecture_id,
        "title": lecture.title,
        "extracted_text": lecture.extracted_text or "",
        "has_text": bool(lecture.extracted_text)
    }


@app.post("/teacher/lectures/{lecture_id}/generate-questions")
def generate_questions_from_lecture(
    lecture_id: int,
    question_config: dict = None,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """Generate questions from existing lecture"""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    if not lecture.extracted_text:
        raise HTTPException(status_code=400, detail="No text extracted from lecture")
    
    # Generate questions
    questions = generate_all_questions(lecture.extracted_text, question_config)
    
    return {
        "lecture_id": lecture_id,
        "questions": questions,
        "total": sum(len(q) for q in questions.values())
    }    


@app.get("/lectures/{lecture_id}/vocabulary")
def get_lecture_vocabulary(
    lecture_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Get vocabulary list from lecture with audio
    """
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    if not lecture.extracted_text:
        raise HTTPException(status_code=400, detail="No text extracted")
    
    # Extract vocabulary (reuse from utils_text)
    from .utils_text import extract_vocab
    words = extract_vocab(lecture.extracted_text, top_k=30)
    
    # Generate audio for each word
    vocabulary = []
    for word in words:
        audio_path = text_to_speech(word, lang='en')
        vocabulary.append({
            'word': word,
            'audio_url': get_audio_url(audio_path) if audio_path else None
        })
    
    return {
        'lecture_id': lecture_id,
        'title': lecture.title,
        'vocabulary': vocabulary,
        'total': len(vocabulary)
    }


@app.post("/teacher/assignments/{assignment_id}/auto-generate")
def auto_generate_assignment(
    assignment_id: int,
    num_questions: int = 20,
    question_types: str = "multiple_choice,fill_blank",
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Auto-generate questions for assignment from lecture content
    """
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get all lectures (or specific lecture if linked)
    lectures = db.query(Lecture).all()
    
    if not lectures:
        raise HTTPException(status_code=400, detail="No lectures available")
    
    # Combine all lecture texts
    combined_text = " ".join([lec.extracted_text for lec in lectures if lec.extracted_text])
    
    if not combined_text:
        raise HTTPException(status_code=400, detail="No text available to generate questions")
    
    # Generate questions
    from .utils.question_generator import generate_all_questions
    
    question_types_list = question_types.split(',')
    config = {
        'vocabulary': 0,
        'fill_blank': num_questions // 2 if 'fill_blank' in question_types_list else 0,
        'multiple_choice': num_questions // 2 if 'multiple_choice' in question_types_list else 0,
        'reading_comprehension': 0
    }
    
    questions = generate_all_questions(combined_text, config)
    
    # Save questions to database
    total_saved = 0
    for q_type, q_list in questions.items():
        for q in q_list:
            if q_type == 'multiple_choice':
                quiz_q = QuizQuestion(
                    assignment_id=assignment_id,
                    prompt=q['prompt'],
                    choice_a=q['options'][0],
                    choice_b=q['options'][1],
                    choice_c=q['options'][2],
                    choice_d=q['options'][3],
                    correct=q['correct'].upper(),
                    explanation="Auto-generated question"
                )
                db.add(quiz_q)
                total_saved += 1
    
    db.commit()
    
    return {
        'success': True,
        'assignment_id': assignment_id,
        'questions_generated': total_saved,
        'message': f'Generated {total_saved} questions successfully'
    }


# ==================== STUDENT PROGRESS ENDPOINTS ====================

@app.get("/student/progress")
def get_student_progress(
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    """
    Get student's learning progress and statistics
    """
    student = db.query(User).filter(User.username == user["username"]).first()
    
    # Get all attempts by this student
    attempts = db.query(Attempt).filter(Attempt.student_id == student.id).all()
    
    # Calculate statistics
    total_attempts = len(attempts)
    completed_attempts = len([a for a in attempts if a.finished_at])
    avg_score = 0
    if completed_attempts > 0:
        scores = [a.score for a in attempts if a.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
    
    # Get assignments status
    all_assignments = db.query(Assignment).all()
    completed_assignments = len(set([a.assignment_id for a in attempts if a.finished_at]))
    
    # Get recent activity
    recent_attempts = sorted(
        [a for a in attempts if a.finished_at], 
        key=lambda x: x.finished_at, 
        reverse=True
    )[:5]
    
    return {
        'student': {
            'id': student.id,
            'username': student.username,
            'role': student.role
        },
        'statistics': {
            'total_attempts': total_attempts,
            'completed_attempts': completed_attempts,
            'average_score': round(avg_score, 2),
            'assignments_completed': completed_assignments,
            'assignments_total': len(all_assignments),
            'completion_rate': round((completed_assignments / len(all_assignments) * 100) if all_assignments else 0, 2)
        },
        'recent_activity': [
            {
                'assignment_id': a.assignment_id,
                'assignment_title': a.assignment.title if a.assignment else 'Unknown',
                'score': a.score,
                'finished_at': a.finished_at
            }
            for a in recent_attempts
        ]
    }


@app.get("/teacher/students/progress")
def get_all_students_progress(
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    """
    Get progress of all students (for teacher dashboard)
    """
    students = db.query(User).filter(User.role == 'student').all()
    
    progress_data = []
    for student in students:
        attempts = db.query(Attempt).filter(Attempt.student_id == student.id).all()
        
        completed = len([a for a in attempts if a.finished_at])
        avg_score = 0
        if completed > 0:
            scores = [a.score for a in attempts if a.score is not None]
            avg_score = sum(scores) / len(scores) if scores else 0
        
        progress_data.append({
            'student_id': student.id,
            'username': student.username,
            'full_name': student.full_name or student.username,
            'attempts': len(attempts),
            'completed': completed,
            'average_score': round(avg_score, 2),
            'last_activity': max([a.finished_at for a in attempts if a.finished_at], default=None)
        })
    
    return {
        'total_students': len(students),
        'students': sorted(progress_data, key=lambda x: x['average_score'], reverse=True)
    }


# ==================== NOTIFICATION ENDPOINTS ====================

@app.get("/notifications")
def get_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Get user's notifications
    """
    current_user = db.query(User).filter(User.username == user["username"]).first()
    
    notifications = db.query(Notification)\
        .filter(Notification.to_user_id == current_user.id)\
        .order_by(Notification.created_at.desc())\
        .limit(limit)\
        .all()
    
    return {
        'notifications': [
            {
                'id': n.id,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at,
                'type': 'qa' if 'tin nhắn' in n.message.lower() else 'system'
            }
            for n in notifications
        ],
        'unread_count': len([n for n in notifications if not n.is_read])
    }


@app.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Mark notification as read
    """
    notification = db.query(Notification)\
        .filter(Notification.id == notification_id)\
        .first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {'success': True}


# ==================== HOMEWORK ENDPOINTS ====================

@app.get("/student/homework")
def get_student_homework(
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    """
    Get all homework assignments for student
    """
    student = db.query(User).filter(User.username == user["username"]).first()
    
    # Get all assignments
    assignments = db.query(Assignment).order_by(Assignment.due_at.asc()).all()
    
    # Get submissions by this student
    submissions = db.query(HomeworkSubmission)\
        .filter(HomeworkSubmission.student_id == student.id)\
        .all()
    
    submission_map = {s.assignment_id: s for s in submissions}
    
    homework_list = []
    for assignment in assignments:
        submission = submission_map.get(assignment.id)
        now = datetime.utcnow()
        
        homework_list.append({
            'assignment_id': assignment.id,
            'title': assignment.title,
            'due_at': assignment.due_at,
            'is_submitted': submission is not None,
            'submitted_at': submission.submitted_at if submission else None,
            'is_late': submission.is_late if submission else False,
            'can_submit': now <= assignment.due_at,
            'file_path': submission.file_path if submission else None
        })
    
    return {
        'homework': homework_list,
        'total': len(homework_list),
        'submitted': len([h for h in homework_list if h['is_submitted']]),
        'pending': len([h for h in homework_list if not h['is_submitted'] and h['can_submit']])
    }

# ==================== STUDENT ENDPOINTS ====================

@app.get(
    "/assignments",
    summary="Danh sách bài tập",
    tags=["assignments"]
)
def list_assignments(
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Lấy danh sách bài tập (tất cả user đều xem được)
    """
    assignments = db.query(Assignment)\
        .join(User, Assignment.created_by == User.id)\
        .order_by(Assignment.due_at.asc())\
        .all()
    
    return [
        {
            "id": assignment.id,
            "title": assignment.title,
            "instructions": assignment.instructions,
            "due_at": assignment.due_at,
            "time_limit_minutes": assignment.time_limit_minutes,
            "created_by": assignment.teacher.username,
            "created_at": assignment.created_at
        }
        for assignment in assignments
    ]


@app.get(
    "/assignments/{assignment_id}/questions",
    summary="Lấy câu hỏi của bài tập",
    tags=["assignments"]
)
def get_assignment_questions(
    assignment_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Lấy danh sách câu hỏi của một bài tập
    """
    # Kiểm tra assignment tồn tại
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Lấy câu hỏi
    questions = db.query(QuizQuestion)\
        .filter(QuizQuestion.assignment_id == assignment_id)\
        .all()
    
    return [
        {
            "id": q.id,
            "prompt": q.prompt,
            "choice_a": q.choice_a,
            "choice_b": q.choice_b,
            "choice_c": q.choice_c,
            "choice_d": q.choice_d,
            # Không trả về đáp án đúng cho sinh viên
        }
        for q in questions
    ]


@app.post(
    "/student/attempts/{assignment_id}/start",
    response_model=AttemptStartRes,
    summary="Bắt đầu làm bài tập",
    tags=["student", "attempts"]
)
def start_assignment_attempt(
    assignment_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    """
    Sinh viên bắt đầu làm bài tập
    """
    # Kiểm tra assignment tồn tại
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")
    
    # Kiểm tra hạn nộp
    if datetime.utcnow() > assignment.due_at:
        raise HTTPException(status_code=403, detail="Đã quá hạn làm bài")
    
    # Tạo attempt mới
    student = db.query(User).filter(User.username == user["username"]).first()
    attempt = Attempt(
        assignment_id=assignment_id,
        student_id=student.id,
        log=""
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return AttemptStartRes(
        attempt_id=attempt.id,
        started_at=attempt.started_at,
        due_at=assignment.due_at,
        time_limit_minutes=assignment.time_limit_minutes
    )


@app.post(
    "/student/attempts/{attempt_id}/finish",
    summary="Nộp bài tập",
    tags=["student", "attempts"]
)
def finish_assignment_attempt(
    attempt_id: int,
    payload: AttemptFinishReq,
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    """
    Sinh viên nộp bài tập
    """
    # Kiểm tra attempt tồn tại
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Không tìm thấy attempt")
    
    # Kiểm tra ownership
    student = db.query(User).filter(User.username == user["username"]).first()
    if attempt.student_id != student.id:
        raise HTTPException(status_code=403, detail="Không có quyền nộp bài này")
    
    # Kiểm tra hạn nộp
    assignment = db.query(Assignment).filter(Assignment.id == attempt.assignment_id).first()
    if datetime.utcnow() > assignment.due_at:
        raise HTTPException(status_code=403, detail="Đã quá hạn nộp kết quả")
    
    # Cập nhật attempt
    attempt.finished_at = datetime.utcnow()
    attempt.score = payload.score
    attempt.log = payload.log
    
    db.commit()
    
    return {
        "success": True,
        "score": payload.score,
        "message": "Nộp bài thành công"
    }


@app.post(
    "/student/homework/{assignment_id}/submit",
    summary="Nộp bài tập về nhà",
    tags=["student", "homework"]
)
def submit_homework(
    assignment_id: int,
    file: UploadFile = File(..., description="File bài tập"),
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    """
    Sinh viên nộp bài tập về nhà
    """
    # Kiểm tra assignment tồn tại
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")
    
    # Kiểm tra hạn nộp
    if datetime.utcnow() > assignment.due_at:
        raise HTTPException(status_code=403, detail="Trễ hạn: không thể nộp")
    
    # Lưu file
    timestamp = int(datetime.utcnow().timestamp())
    safe_filename = f"hw_{assignment_id}_{timestamp}_{secrets.token_hex(4)}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    # Tạo submission
    student = db.query(User).filter(User.username == user["username"]).first()
    submission = HomeworkSubmission(
        assignment_id=assignment_id,
        student_id=student.id,
        file_path=file_path,
        filename=file.filename,
        is_late=False  # Có thể thêm logic kiểm tra trễ hạn
    )
    
    db.add(submission)
    db.commit()
    
    return {
        "success": True,
        "submission_id": submission.id,
        "message": "Nộp bài tập thành công"
    }

# ==================== Q&A ENDPOINTS ====================

@app.post(
    "/qa/send",
    summary="Gửi tin nhắn Q&A",
    tags=["qa"]
)
async def send_qa_message(
    payload: QAMessageCreate,
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Gửi tin nhắn Q&A đến giáo viên hoặc sinh viên khác
    """
    # Kiểm tra người nhận tồn tại
    recipient = db.query(User).filter(User.id == payload.to_user_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Người nhận không tồn tại")
    
    # Tạo tin nhắn
    sender = db.query(User).filter(User.username == user["username"]).first()
    message = QAMessage(
        from_user_id=sender.id,
        to_user_id=payload.to_user_id,
        content=payload.content
    )
    
    db.add(message)
    
    # Tạo notification
    notification = Notification(
        to_user_id=payload.to_user_id,
        message=f"Tin nhắn mới từ {sender.username}: {payload.content[:80]}"
    )
    db.add(notification)
    db.commit()
    
    # Gửi qua WebSocket nếu người nhận đang online
    await ws_manager.push(recipient.username, notification.message)
    
    return {
        "success": True,
        "message_id": message.id,
        "message": "Gửi tin nhắn thành công"
    }


@app.get(
    "/qa/messages",
    summary="Lấy tin nhắn Q&A",
    tags=["qa"]
)
def get_qa_messages(
    db: Session = Depends(get_db),
    user=Depends(require_auth)
):
    """
    Lấy danh sách tin nhắn Q&A của user hiện tại
    """
    current_user = db.query(User).filter(User.username == user["username"]).first()
    
    # Lấy tin nhắn đã nhận
    received = db.query(QAMessage)\
        .filter(QAMessage.to_user_id == current_user.id)\
        .order_by(QAMessage.created_at.desc())\
        .all()
    
    # Lấy tin nhắn đã gửi
    sent = db.query(QAMessage)\
        .filter(QAMessage.from_user_id == current_user.id)\
        .order_by(QAMessage.created_at.desc())\
        .all()
    
    return {
        "received": [
            {
                "id": msg.id,
                "from_user": msg.sender.username,
                "content": msg.content,
                "created_at": msg.created_at
            }
            for msg in received
        ],
        "sent": [
            {
                "id": msg.id,
                "to_user": msg.recipient.username,
                "content": msg.content,
                "created_at": msg.created_at
            }
            for msg in sent
        ]
    }

# ==================== TOOLS ENDPOINTS ====================

@app.post(
    "/tools/vocab-from-text",
    summary="Trích xuất từ vựng từ văn bản",
    tags=["tools"]
)
def extract_vocabulary_from_text(
    text: str = Form(..., description="Văn bản cần trích xuất từ vựng"),
    top_k: int = Form(30, description="Số lượng từ muốn trích xuất"),
    user=Depends(require_auth)
):
    """
    Trích xuất từ vựng quan trọng từ văn bản và tạo câu mẫu
    """
    if not text or len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Văn bản quá ngắn")
    
    # Trích xuất từ vựng
    words = extract_vocab(text, top_k=top_k)
    
    # Tạo câu mẫu
    sentences = make_sample_sentences(words)
    
    return {
        "success": True,
        "words": words,
        "sentences": sentences,
        "count": len(words)
    }

# ==================== WEBSOCKET ENDPOINT ====================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint cho real-time notifications
    """
    username = websocket.query_params.get("username", "")
    
    if not username:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Kết nối WebSocket
    await ws_manager.connect(username, websocket)
    
    try:
        # Giữ kết nối
        while True:
            # Nhận message (có thể dùng để ping/pong)
            data = await websocket.receive_text()
            # Có thể xử lý message ở đây nếu cần
    except Exception as e:
        print(f"WebSocket disconnected for {username}: {e}")
    finally:
        # Ngắt kết nối
        ws_manager.disconnect(username, websocket)

# ==================== ERROR HANDLERS ====================

from fastapi.responses import JSONResponse

# Cuối file app/main.py
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    Custom HTTP exception handler
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "status_code": exc.status_code,
                "detail": exc.detail
            }
        }
    )
# ==================== SHUTDOWN EVENT ====================

@app.on_event("shutdown")
async def shutdown_event():
    """
    Chạy khi server tắt
    """
    print("\n" + "=" * 50)
    print("👋 English E-Learning Backend stopped")
    print("=" * 50)

# backend/app/main.py - Thêm ở cuối file, sau các routes

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    """
    Middleware fallback cho CORS trong GitHub Codespaces
    Xử lý các origin động không match pattern
    """
    origin = request.headers.get("origin")
    
    # Cho phép mọi origin từ github.dev và githubpreview.dev
    if origin and (
        origin.endswith(".github.dev") or 
        origin.endswith(".githubpreview.dev") or
        "localhost" in origin
    ):
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    
    return await call_next(request)