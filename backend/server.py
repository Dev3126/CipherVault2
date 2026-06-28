from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Depends, Cookie
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import uuid
import base64
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
PBKDF2_ITER = 200_000
SALT_LEN = 16
IV_LEN = 12
KEY_LEN = 32
MAGIC = b"CVAULT01"  # file header

# ---------- Models ----------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SessionRequest(BaseModel):
    session_id: str


class ContactMessage(BaseModel):
    name: str
    email: str
    message: str


class SettingsUpdate(BaseModel):
    notifications: Optional[bool] = None
    auto_delete_days: Optional[int] = None


# ---------- Auth helper ----------
async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None),
) -> User:
    token = session_token
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


# ---------- Encryption ----------
def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=KEY_LEN, salt=salt,
                     iterations=PBKDF2_ITER, backend=default_backend())
    return kdf.derive(password.encode("utf-8"))


def encrypt_bytes(data: bytes, password: str) -> bytes:
    salt = os.urandom(SALT_LEN)
    iv = os.urandom(IV_LEN)
    key = derive_key(password, salt)
    encryptor = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend()).encryptor()
    ct = encryptor.update(data) + encryptor.finalize()
    return MAGIC + salt + iv + encryptor.tag + ct


def decrypt_bytes(blob: bytes, password: str) -> bytes:
    if not blob.startswith(MAGIC):
        raise ValueError("Not a CipherVault file")
    o = len(MAGIC)
    salt = blob[o:o + SALT_LEN]
    o += SALT_LEN
    iv = blob[o:o + IV_LEN]
    o += IV_LEN
    tag = blob[o:o + 16]
    o += 16
    ct = blob[o:]
    key = derive_key(password, salt)
    decryptor = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend()).decryptor()
    return decryptor.update(ct) + decryptor.finalize()


# ---------- Helpers ----------
async def log_history(user_id: str, op: str, filename: str, size: int, status: str, file_id: Optional[str] = None):
    await db.history.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "operation": op,
        "filename": filename,
        "size": size,
        "status": status,
        "file_id": file_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


# ---------- Auth endpoints ----------
@api_router.post("/auth/session")
async def auth_session(payload: SessionRequest, response: Response):
    async with httpx.AsyncClient(timeout=15.0) as hc:
        r = await hc.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": payload.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()

    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture")}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 60 * 60, path="/",
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc}


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    return user.model_dump()


@api_router.post("/auth/logout")
async def auth_logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------- Encrypt / Decrypt ----------
@api_router.post("/encrypt")
async def encrypt_endpoint(
    password: str = Form(...),
    save: str = Form("true"),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    raw = await file.read()
    if len(raw) > 16 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 16MB)")
    blob = b""
    try:
        blob = encrypt_bytes(raw, password)
    except Exception as e:
        await log_history(user.user_id, "encrypt", file.filename, len(raw), "failed")
        raise HTTPException(500, f"Encryption failed: {e}")

    file_id = str(uuid.uuid4())
    encrypted_name = f"{file.filename}.cvault"
    if save.lower() == "true":
        await db.files.insert_one({
            "id": file_id,
            "user_id": user.user_id,
            "original_name": file.filename,
            "encrypted_name": encrypted_name,
            "size_original": len(raw),
            "size_encrypted": len(blob),
            "data_b64": base64.b64encode(blob).decode("ascii"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    await log_history(user.user_id, "encrypt", file.filename, len(raw), "success", file_id)

    return {
        "id": file_id,
        "encrypted_name": encrypted_name,
        "size_original": len(raw),
        "size_encrypted": len(blob),
        "data_b64": base64.b64encode(blob).decode("ascii"),
    }


@api_router.post("/decrypt")
async def decrypt_endpoint(
    password: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    raw = await file.read()
    if len(raw) > 16 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 16MB)")
    plain = b""
    try:
        plain = decrypt_bytes(raw, password)
    except Exception:
        await log_history(user.user_id, "decrypt", file.filename, len(raw), "failed")
        raise HTTPException(400, "Decryption failed. Wrong password or corrupted file.")

    out_name = file.filename[:-7] if file.filename.endswith(".cvault") else f"decrypted_{file.filename}"
    await log_history(user.user_id, "decrypt", out_name, len(plain), "success")
    return {
        "decrypted_name": out_name,
        "size": len(plain),
        "data_b64": base64.b64encode(plain).decode("ascii"),
    }


# ---------- Files ----------
@api_router.get("/files")
async def list_files(user: User = Depends(get_current_user)):
    cursor = db.files.find(
        {"user_id": user.user_id},
        {"_id": 0, "data_b64": 0}
    ).sort("created_at", -1)
    files = await cursor.to_list(500)
    return files


@api_router.get("/files/{file_id}/download")
async def download_file(file_id: str, user: User = Depends(get_current_user)):
    doc = await db.files.find_one({"id": file_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "File not found")
    blob = base64.b64decode(doc["data_b64"])
    return StreamingResponse(
        io.BytesIO(blob),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc["encrypted_name"]}"'},
    )


@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str, user: User = Depends(get_current_user)):
    r = await db.files.delete_one({"id": file_id, "user_id": user.user_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "File not found")
    return {"ok": True}


# ---------- History ----------
@api_router.get("/history")
async def list_history(user: User = Depends(get_current_user)):
    cur = db.history.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).limit(200)
    return await cur.to_list(200)


@api_router.delete("/history")
async def clear_history(user: User = Depends(get_current_user)):
    await db.history.delete_many({"user_id": user.user_id})
    return {"ok": True}


# ---------- Stats ----------
@api_router.get("/stats")
async def stats(user: User = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user.user_id}},
        {"$group": {
            "_id": {"op": "$operation", "status": "$status"},
            "count": {"$sum": 1},
            "total_size": {"$sum": "$size"},
        }}
    ]
    rows = await db.history.aggregate(pipeline).to_list(50)
    files_encrypted = sum(r["count"] for r in rows if r["_id"]["op"] == "encrypt" and r["_id"]["status"] == "success")
    files_decrypted = sum(r["count"] for r in rows if r["_id"]["op"] == "decrypt" and r["_id"]["status"] == "success")
    total_size = sum(r["total_size"] for r in rows if r["_id"]["status"] == "success")
    total_ops = sum(r["count"] for r in rows)
    success_ops = sum(r["count"] for r in rows if r["_id"]["status"] == "success")
    success_rate = 100.0 if total_ops == 0 else round(success_ops * 100 / total_ops, 1)

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    enc_month = await db.history.count_documents({
        "user_id": user.user_id, "operation": "encrypt", "status": "success",
        "created_at": {"$gte": month_start}
    })
    dec_month = await db.history.count_documents({
        "user_id": user.user_id, "operation": "decrypt", "status": "success",
        "created_at": {"$gte": month_start}
    })
    return {
        "files_encrypted": files_encrypted,
        "files_decrypted": files_decrypted,
        "total_size_bytes": total_size,
        "success_rate": success_rate,
        "encrypted_this_month": enc_month,
        "decrypted_this_month": dec_month,
    }


# ---------- Settings ----------
@api_router.get("/settings")
async def get_settings(user: User = Depends(get_current_user)):
    s = await db.settings.find_one({"user_id": user.user_id}, {"_id": 0})
    if not s:
        s = {"user_id": user.user_id, "notifications": True, "auto_delete_days": 0}
    return s


@api_router.put("/settings")
async def update_settings(payload: SettingsUpdate, user: User = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.settings.update_one(
        {"user_id": user.user_id},
        {"$set": {**update, "user_id": user.user_id}},
        upsert=True,
    )
    s = await db.settings.find_one({"user_id": user.user_id}, {"_id": 0})
    return s


# ---------- Contact ----------
@api_router.post("/contact")
async def contact(payload: ContactMessage, request: Request):
    user_id = None
    token = request.cookies.get("session_token")
    if token:
        sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if sess:
            user_id = sess["user_id"]
    await db.contact_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": payload.name,
        "email": payload.email,
        "message": payload.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"app": "CipherVault", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
