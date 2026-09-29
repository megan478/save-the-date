import csv
import io
import os
import secrets
import sqlite3
from contextlib import contextmanager
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # SQLite-only local installs do not need the Postgres driver.
    psycopg = None

ROOT = Path(__file__).resolve().parents[1]
DATABASE = Path(os.getenv('DATABASE_PATH', ROOT / 'backend/data/save-the-date.sqlite'))
DATABASE_URL = os.getenv('DATABASE_URL', '')
DIST = ROOT / 'frontend/dist'

class Address(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    attendance: Literal['yes', 'maybe', 'no'] = 'yes'
    address: str = Field(default='', max_length=600)
    details: str = Field(default='', max_length=1200)

    @model_validator(mode='after')
    def require_address_for_attendees(self):
        if self.attendance != 'no' and len(self.address) < 8:
            raise ValueError('A mailing address is required for yes and maybe responses.')
        return self

@contextmanager
def db():
    if DATABASE_URL:
        if psycopg is None:
            raise RuntimeError('DATABASE_URL is set but psycopg is not installed.')
        connection = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        try:
            with connection: yield connection
        finally: connection.close()
        return
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    try:
        with connection: yield connection
    finally: connection.close()

def initialize():
    with db() as connection:
        if DATABASE_URL:
            connection.execute('''CREATE TABLE IF NOT EXISTS addresses (
              id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
              attendance TEXT NOT NULL DEFAULT 'yes', address TEXT NOT NULL DEFAULT '',
              details TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )''')
            connection.execute("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS attendance TEXT NOT NULL DEFAULT 'yes'")
        else:
            connection.execute('''CREATE TABLE IF NOT EXISTS addresses (
              id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL,
              attendance TEXT NOT NULL DEFAULT 'yes', address TEXT NOT NULL DEFAULT '',
              details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )''')
            columns = {row['name'] for row in connection.execute('PRAGMA table_info(addresses)')}
            if 'attendance' not in columns:
                connection.execute("ALTER TABLE addresses ADD COLUMN attendance TEXT NOT NULL DEFAULT 'yes'")

def query(sql: str) -> str:
    return sql.replace('?', '%s') if DATABASE_URL else sql

def admin(authorization: str = Header(default='')):
    password = os.getenv('ADMIN_PASSWORD', '')
    if not password or not authorization.startswith('Bearer ') or not secrets.compare_digest(authorization[7:], password):
        raise HTTPException(401, 'Admin authorization required.')

@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize()
    yield

app = FastAPI(title='Daisy & Ed Save the Date', docs_url='/api/docs', lifespan=lifespan)

@app.get('/api/health')
def health():
    with db() as connection: connection.execute('SELECT 1')
    return {'status':'ok'}

@app.post('/api/addresses', status_code=201)
def save_address(payload: Address):
    with db() as connection:
        connection.execute(query('INSERT INTO addresses(name,email,attendance,address,details) VALUES(?,?,?,?,?)'), (payload.name,payload.email,payload.attendance,payload.address,payload.details))
    return {'saved':True}

@app.get('/api/addresses/export', dependencies=[Depends(admin)])
def export_addresses():
    output=io.StringIO(); writer=csv.writer(output); writer.writerow(['Name','Email','Attendance','Mailing address','Additional details','Submitted'])
    with db() as connection:
        columns = ('name','email','attendance','address','details','created_at')
        for row in connection.execute('SELECT name,email,attendance,address,details,created_at FROM addresses ORDER BY created_at'):
            values = [row[column] for column in columns]
            writer.writerow([("'"+str(v) if str(v).lstrip().startswith(('=','+','-','@')) else v) for v in values])
    return Response('\ufeff'+output.getvalue(),media_type='text/csv',headers={'Content-Disposition':'attachment; filename="save-the-date-addresses.csv"'})

if DIST.exists():
    app.mount('/assets', StaticFiles(directory=DIST/'assets'), name='assets')
    images=DIST/'images'
    if images.exists(): app.mount('/images', StaticFiles(directory=images), name='images')
    @app.get('/{path:path}', include_in_schema=False)
    def frontend(path: str):
        if path.startswith('api/'): raise HTTPException(404)
        return FileResponse(DIST/'index.html')
