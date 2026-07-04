import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash

INCIDENT_TYPES = ["flood", "cyclone", "earthquake", "building_fire", "power_outage", "chemical_leak", "traffic_accident", "mass_gathering"]
URGENCY_LEVELS = ["low", "medium", "high", "critical"]
STATUS_OPTIONS = ["reported", "dispatching", "active", "resolved"]

RESOURCE_TYPES = ["ambulance", "fire_truck", "rescue_boat", "helicopter", "generator", "food", "water", "volunteer"]
STATION_TYPES = ["fire_station", "hospital", "police_station", "volunteer_center"]

TAMIL_NADU_CITIES = [
    {"name": "Chennai", "lat": 13.0827, "lng": 80.2000},  # offset to the west to avoid sea
    {"name": "Coimbatore", "lat": 11.0168, "lng": 76.9558},
    {"name": "Madurai", "lat": 9.9252, "lng": 78.1198},
    {"name": "Tiruchirappalli", "lat": 10.7905, "lng": 78.7047},
    {"name": "Salem", "lat": 11.6643, "lng": 78.1460},
    {"name": "Tirunelveli", "lat": 8.7139, "lng": 77.7567},
    {"name": "Vellore", "lat": 12.9165, "lng": 79.1325},
    {"name": "Erode", "lat": 11.3410, "lng": 77.7172},
    {"name": "Thanjavur", "lat": 10.7870, "lng": 79.1378},
    {"name": "Dindigul", "lat": 10.3673, "lng": 77.9803},
    {"name": "Kanchipuram", "lat": 12.8342, "lng": 79.7036},
    {"name": "Tiruppur", "lat": 11.1085, "lng": 77.3411},
    {"name": "Nagercoil", "lat": 8.1833, "lng": 77.4119},
    {"name": "Cuddalore", "lat": 11.7480, "lng": 79.7500},
]

def get_random_coords(radius=0.04):
    """Generates random coordinates near a random city in Tamil Nadu, avoiding the sea."""
    city = random.choice(TAMIL_NADU_CITIES)
    lat_offset = random.uniform(-radius, radius)
    lng_offset = random.uniform(-radius, radius)
    
    # Custom bounds to prevent sea positioning for coastal cities
    if city["name"] in ["Chennai", "Cuddalore"]:
        lng_offset = random.uniform(-0.08, -0.01)
        
    return [city["lng"] + lng_offset, city["lat"] + lat_offset]


async def seed_database():
    print(f"Connecting to MongoDB at: {settings.MONGO_URI}")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db_name = settings.MONGO_URI.split("/")[-1].split("?")[0] or "resqnet"
    db = client[db_name]

    print("Cleaning existing collections...")
    await db.users.delete_many({})
    await db.incidents.delete_many({})
    await db.resources.delete_many({})
    await db.shelters.delete_many({})
    await db.stations.delete_many({})
    await db.dispatch_history.delete_many({})
    await db.audit_logs.delete_many({})

    # 1. Create Default Users
    print("Seeding Users...")
    users = [
        {
            "username": "admin",
            "hashed_password": get_password_hash("admin123"),
            "role": "Administrator"
        },
        {
            "username": "dispatcher",
            "hashed_password": get_password_hash("dispatcher123"),
            "role": "Emergency Dispatcher"
        },
        {
            "username": "responder",
            "hashed_password": get_password_hash("responder123"),
            "role": "Field Responder"
        },
        {
            "username": "viewer",
            "hashed_password": get_password_hash("viewer123"),
            "role": "Viewer"
        }
    ]
    await db.users.insert_many(users)

    # 2. Seed Resources (100+)
    print("Seeding Resources...")
    resources = []
    for i in range(110):
        r_type = random.choice(RESOURCE_TYPES)
        total_qty = random.randint(5, 25)
        avail = random.randint(0, total_qty)
        status = "deployed" if avail == 0 else ("idle" if avail == total_qty else "deployed")
        
        resources.append({
            "resource_type": r_type,
            "name": f"Resource-{r_type.replace('_', ' ').title()}-{i+100}",
            "quantity": total_qty,
            "availability": avail,
            "location": {
                "type": "Point",
                "coordinates": get_random_coords()
            },
            "deployment_status": status,
            "cost_per_unit": float(random.randint(50, 500)),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(5, 30)),
            "updated_at": datetime.utcnow()
        })
    res_result = await db.resources.insert_many(resources)
    resource_ids = [str(_id) for _id in res_result.inserted_ids]

    # 3. Seed Shelters (50+)
    print("Seeding Shelters...")
    shelters = []
    for i in range(55):
        cap = random.randint(50, 400)
        occ = random.randint(10, cap)
        shelters.append({
            "name": f"Shelter Center #{i+1}",
            "location": {
                "type": "Point",
                "coordinates": get_random_coords()
            },
            "capacity": cap,
            "occupancy": occ,
            "available_beds": cap - occ,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    await db.shelters.insert_many(shelters)

    # 4. Seed Stations (20+)
    print("Seeding Stations...")
    stations = []
    for i in range(25):
        s_type = random.choice(STATION_TYPES)
        stations.append({
            "name": f"Station {s_type.replace('_', ' ').title()} #{i+1}",
            "station_type": s_type,
            "location": {
                "type": "Point",
                "coordinates": get_random_coords()
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    await db.stations.insert_many(stations)

    # 5. Seed Incidents (300+)
    print("Seeding Incidents...")
    incidents = []
    
    summaries = {
        "flood": "Urban flash flooding due to heavy monsoonal rain. Water levels reaching residential basements.",
        "cyclone": "Coastal storm wind damage with uprooted power structures and minor structural collapses.",
        "earthquake": "Seismic activity resulting in residential block cracks and roadway buckling.",
        "building_fire": "Structure fire in commercial block. Active smoke columns observed.",
        "power_outage": "Grid infrastructure failure. Power sub-station damage. Repairs underway.",
        "chemical_leak": "Hazardous materials leak at local warehouse. Gas containment protocols initialized.",
        "traffic_accident": "Multi-vehicle collision on arterial corridor. Minor injuries reported.",
        "mass_gathering": "Localized crowd surge incident requiring medical observation staff."
    }

    for i in range(315):
        inc_type = random.choice(INCIDENT_TYPES)
        urg = random.choice(URGENCY_LEVELS)
        stat = random.choice(STATUS_OPTIONS)
        people = random.randint(5, 120)
        med_sev = random.randint(1, 10)
        vuln = random.randint(1, 10)
        conf = round(random.uniform(0.65, 0.99), 2)
        
        # Build assigned resources list
        assigned = []
        if stat in ["dispatching", "active", "resolved"]:
            assigned_res_count = random.randint(1, 3)
            for _ in range(assigned_res_count):
                assigned.append({
                    "resource_id": random.choice(resource_ids),
                    "resource_type": random.choice(RESOURCE_TYPES),
                    "quantity": random.randint(1, 5)
                })

        created = datetime.utcnow() - timedelta(hours=random.randint(1, 72))

        incidents.append({
            "title": f"Incident {inc_type.replace('_', ' ').title()} #{i+1000}",
            "description": f"Urgent report of {inc_type.replace('_', ' ')} incident causing hazards. Priority response active.",
            "ai_summary": summaries[inc_type],
            "incident_type": inc_type,
            "urgency": urg,
            "people_affected": people,
            "medical_severity": med_sev,
            "vulnerability_score": vuln,
            "ai_confidence": conf,
            "location": {
                "type": "Point",
                "coordinates": get_random_coords()
            },
            "status": stat,
            "assigned_resources": assigned,
            "explanation": f"Based on location analysis and estimated affected headcount ({people} people).",
            "recommended_resources": [
                {"type": "ambulance", "quantity": 2},
                {"type": "fire_truck", "quantity": 1}
            ],
            "created_at": created,
            "updated_at": created + timedelta(minutes=random.randint(5, 60))
        })
    inc_result = await db.incidents.insert_many(incidents)
    incident_ids = [str(_id) for _id in inc_result.inserted_ids]

    # 6. Seed Dispatch History & Audit Logs
    print("Seeding Dispatch History & Audit Trail...")
    dispatches = []
    for i in range(75):
        inc_id = random.choice(incident_ids)
        res_id = random.choice(resource_ids)
        r_type = random.choice(RESOURCE_TYPES)
        qty = random.randint(1, 3)
        status = random.choice(["en_route", "arrived", "completed"])

        d_time = datetime.utcnow() - timedelta(hours=random.randint(1, 24))
        a_time = d_time + timedelta(minutes=random.randint(5, 15)) if status in ["arrived", "completed"] else None
        c_time = a_time + timedelta(minutes=random.randint(15, 45)) if status == "completed" else None

        dispatches.append({
            "incident_id": inc_id,
            "resource_id": res_id,
            "resource_type": r_type,
            "quantity": qty,
            "responder_name": f"Rescue Responder Team {random.randint(1, 20)}",
            "route": {
                "type": "LineString",
                "coordinates": [get_random_coords(), get_random_coords()]
            },
            "eta_minutes": float(random.randint(8, 25)),
            "dispatched_at": d_time,
            "arrived_at": a_time,
            "completed_at": c_time,
            "status": status,
            "audit_trail": [
                {
                    "timestamp": d_time,
                    "action": f"Incident marked active. Dispatched team with {qty} {r_type} assets.",
                    "user": "dispatcher"
                }
            ]
        })
    await db.dispatch_history.insert_many(dispatches)

    print("Verification counts:")
    print(f"Users: {await db.users.count_documents({})}")
    print(f"Incidents: {await db.incidents.count_documents({})}")
    print(f"Resources: {await db.resources.count_documents({})}")
    print(f"Shelters: {await db.shelters.count_documents({})}")
    print(f"Stations: {await db.stations.count_documents({})}")
    print(f"Dispatch History: {await db.dispatch_history.count_documents({})}")
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
