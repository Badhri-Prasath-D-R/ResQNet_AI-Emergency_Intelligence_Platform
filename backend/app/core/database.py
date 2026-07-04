import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("resqnet")
logging.basicConfig(level=logging.INFO)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB with URI: {settings.MONGO_URI}")
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    # Parse database name from URI, default to 'resqnet'
    db_name = settings.MONGO_URI.split("/")[-1].split("?")[0] or "resqnet"
    db_instance.db = db_instance.client[db_name]
    logger.info(f"Connected to MongoDB database: {db_name}")
    
    # Create geospatial index (2dsphere) on coordinates fields formatted as GeoJSON
    try:
        await db_instance.db.incidents.create_index([("location", "2dsphere")])
        await db_instance.db.resources.create_index([("location", "2dsphere")])
        await db_instance.db.shelters.create_index([("location", "2dsphere")])
        await db_instance.db.stations.create_index([("location", "2dsphere")])
        logger.info("Geospatial 2dsphere indexes verified and created successfully.")
    except Exception as e:
        logger.error(f"Error creating geospatial indexes: {e}")

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db
