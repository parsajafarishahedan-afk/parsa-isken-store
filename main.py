# main.py
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import json, os, shutil, uuid
from pathlib import Path
from passlib.context import CryptContext
import jwt, datetime

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SKINS_DIR = Path("skins"); SKINS_DIR.mkdir(exist_ok=True)
DB = Path("db.json"); DB.touch(exist_ok=True)
USERS = Path("users.json"); USERS.touch(exist_ok=True)
SECRET = "change-this-secret"

pwd = CryptContext(schemes=["bcrypt"])
oauth2 = OAuth2PasswordBearer(tokenUrl="login")

def load(path): return json.loads(path.read_text() or "{}")
def save(path, data): path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

# --- ثبت‌نام ---
class RegisterIn(BaseModel):
    email: str
    password: str

@app.post("/register")
def register(u: RegisterIn):
    users = load(USERS)
    if u.email in users:
        raise HTTPException(400, "این ایمیل قبلا ثبت شده")
    users[u.email] = {
        "hash": pwd.hash(u.password),
        "is_admin": len(users) == 0  # اولین کاربر = ادمین
    }
    save(USERS, users)
    return {"ok": True}

# --- ورود ---
@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    users = load(USERS)
    u = users.get(form.username)
    if not u or not pwd.verify(form.password, u["hash"]):
        raise HTTPException(401, "ایمیل یا رمز غلط")
    token = jwt.encode(
        {"sub": form.username, "admin": u["is_admin"],
         "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)},
        SECRET, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}

def current_user(token: str = Depends(oauth2)):
    try:
        data = jwt.decode(token, SECRET, algorithms=["HS256"])
        return data
    except:
        raise HTTPException(401, "توکن نامعتبر")

# --- آپلود اسکین (فقط ادمین) ---
@app.post("/skins")
async def upload_skin(name: str = Form(...), category: str = Form("general"),
                      file: UploadFile = File(...),
                      user=Depends(current_user)):
    if not user.get("admin"):
        raise HTTPException(403, "فقط ادمین")
    ext = Path(file.filename).suffix.lower()
    if ext != ".png":
        raise HTTPException(400, "فقط png")
    fname = f"{uuid.uuid4().hex}{ext}"
    (SKINS_DIR / fname).write_bytes(await file.read())

    db = load(DB)
    db.setdefault("skins", []).append({
        "id": uuid.uuid4().hex, "name": name, "category": category,
        "file": f"/skins/{fname}"
    })
    save(DB, db)
    return {"ok": True}

# --- لیست اسکین‌ها ---
@app.get("/skins")
def list_skins():
    return load(DB).get("skins", [])

# --- حذف (فقط ادمین) ---
@app.delete("/skins/{skin_id}")
def delete_skin(skin_id: str, user=Depends(current_user)):
    if not user.get("admin"):
        raise HTTPException(403, "فقط ادمین")
    db = load(DB)
    db["skins"] = [s for s in db.get("skins", []) if s["id"] != skin_id]
    save(DB, db)
    return {"ok": True}

app.mount("/skins", StaticFiles(directory="skins"), name="skins")