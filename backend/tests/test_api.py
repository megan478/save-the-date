import os
from fastapi.testclient import TestClient
os.environ['DATABASE_PATH']='/tmp/save-the-date-test.sqlite'
os.environ['ADMIN_PASSWORD']='test-password'
from backend.app import app

def test_address_flow(tmp_path, monkeypatch):
    from backend import app as module
    monkeypatch.setattr(module,'DATABASE',tmp_path/'test.sqlite')
    with TestClient(app) as client:
        assert client.get('/api/health').status_code==200
        result=client.post('/api/addresses',json={'name':'Alex Example','email':'alex@example.com','attendance':'maybe','address':'10 Example Street, Pittsburgh PA','details':'Apartment 2'})
        assert result.status_code==201
        assert client.get('/api/addresses/export').status_code==401
        export=client.get('/api/addresses/export',headers={'Authorization':'Bearer test-password'})
        assert export.status_code==200
        assert 'Alex Example' in export.text
        assert 'maybe' in export.text
        declined=client.post('/api/addresses',json={'name':'Taylor Example','email':'taylor@example.com','attendance':'no'})
        assert declined.status_code==201

def test_validation(tmp_path, monkeypatch):
    from backend import app as module
    monkeypatch.setattr(module,'DATABASE',tmp_path/'test.sqlite')
    with TestClient(app) as client:
        assert client.post('/api/addresses',json={'name':'A','email':'bad','address':'x'}).status_code==422
