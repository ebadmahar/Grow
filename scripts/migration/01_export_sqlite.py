#!/usr/bin/env python3
"""
Grōv Data Migration - Step 1: SQLite Data Extraction
Connects to grov-backend/database/database.sqlite in read-only mode and
exports all application tables to scripts/migration/export/*.json.
Preserves original database intact.
"""

import os
import sys
import json
import sqlite3
from datetime import datetime

# Configure UTF-8 encoding for standard output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DB_PATH = os.path.join(ROOT_DIR, "grov-backend", "database", "database.sqlite")
EXPORT_DIR = os.path.join(ROOT_DIR, "scripts", "migration", "export")

# List of application tables to export
APP_TABLES = [
    "users",
    "interests",
    "user_interests",
    "species",
    "locations",
    "activities",
    "plantation_activities",
    "seeding_activities",
    "activity_photos",
    "monitoring_records",
    "community_tasks",
    "community_task_participants",
    "community_goals",
    "reports",
    "notifications",
    "user_points",
    "location_aqis"
]

def export_sqlite():
    print(f"📦 Starting SQLite extraction from: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database file not found at {DB_PATH}")

    os.makedirs(EXPORT_DIR, exist_ok=True)

    # Connect in read-only mode to protect original database
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Discover all existing tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    existing_tables = [row["name"] for row in cursor.fetchall()]
    print(f"   Found {len(existing_tables)} existing tables: {', '.join(existing_tables)}\n")

    manifest = {}
    total_records = 0

    for table in existing_tables:
        cursor.execute(f"SELECT * FROM `{table}`;")
        rows = cursor.fetchall()
        data = [dict(row) for row in rows]
        
        output_file = os.path.join(EXPORT_DIR, f"{table}.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
        
        manifest[table] = {
            "count": len(data),
            "file": f"scripts/migration/export/{table}.json"
        }
        total_records += len(data)
        print(f"   ✅ Exported {table:30} : {len(data):5} records -> {output_file}")

    manifest_file = os.path.join(EXPORT_DIR, "_export_manifest.json")
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump({
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "source_db": DB_PATH,
            "total_tables": len(existing_tables),
            "total_records": total_records,
            "tables": manifest
        }, f, indent=2)

    conn.close()
    print(f"\n🎉 SQLite extraction complete: {total_records} total records exported to {EXPORT_DIR}")
    return manifest

if __name__ == "__main__":
    export_sqlite()
