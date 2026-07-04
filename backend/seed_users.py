"""
Seed script to create demo users in the ResQNet database.
Run with: python seed_users.py
"""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Load environment
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USERS = [
    {"username": "admin", "password": "admin123", "role": "Administrator"},
    {"username": "dispatcher", "password": "dispatcher123", "role": "Emergency Dispatcher"},
    {"username": "responder", "password": "responder123", "role": "Field Responder"},
    {"username": "viewer", "password": "viewer123", "role": "Viewer"},
]

async def seed():
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/resqnet")
    print(f"Connecting to: {mongo_uri[:40]}...")
    
    client = AsyncIOMotorClient(mongo_uri)
    db_name = mongo_uri.split("/")[-1].split("?")[0] or "resqnet"
    db = client[db_name]
    
    for user in DEMO_USERS:
        existing = await db.users.find_one({"username": user["username"]})
        if existing:
            print(f"  [SKIP] User '{user['username']}' already exists.")
            continue
        
        doc = {
            "username": user["username"],
            "hashed_password": pwd_context.hash(user["password"]),
            "role": user["role"],
        }
        await db.users.insert_one(doc)
        print(f"  [CREATED] User '{user['username']}' (role: {user['role']})")
    
    print("\nDone! Demo users are ready.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
