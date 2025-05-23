from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import openai
import os
from jose import JWTError, jwt
from datetime import timedelta, datetime

# Read context from file
CONTEXT_PATH = os.path.join(os.path.dirname(__file__), 'context', 'Context.md')
with open(CONTEXT_PATH, 'r') as f:
    CHATBOT_CONTEXT = f.read()

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return {"id": user_id}
    except JWTError:
        raise credentials_exception

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str = None

class ChatRequest(BaseModel):
    question: str

@app.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    # Dummy authentication logic
    if data.email == "demo@example.com" and data.password == "password123":
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": data.email}, expires_delta=access_token_expires
        )
        return {"success": True, "message": "Login successful!", "token": access_token}
    else:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/chat")
def chat(request: ChatRequest, user=Depends(get_current_user)):
    try:
        system_prompt = CHATBOT_CONTEXT
        print("SYSTEM PROMPT:\n", system_prompt[:500], "...\n[truncated]...")
        print("USER QUESTION:", request.question)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.question}
        ]
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=messages
        )
        return {"message": response['choices'][0]['message']['content']}
    except Exception as e:
        return {"message": "I couldn't find enough information to answer your question. Could you please provide more context or clarify your question?"} 