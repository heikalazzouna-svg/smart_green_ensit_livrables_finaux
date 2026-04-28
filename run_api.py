import urllib.request
import json

BASE_URL = "http://localhost:8000/api"

def request_json(url, method="GET", headers=None, data=None):
    if headers is None: headers = {}
    if data is not None:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8')), response.status

def run():
    # Login
    auth_data, status = request_json(f"{BASE_URL}/auth/login", method="POST", data={"email": "admin@ensit.tn", "password": "Admin@2026"})
    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get sources
    sources, _ = request_json(f"{BASE_URL}/data/emission-sources", headers=headers)
    elec = next(s for s in sources if "Electricity" in s["name"])
    car = next(s for s in sources if "Car" in s["name"])

    # Get entity
    entities, _ = request_json(f"{BASE_URL}/data/entities", headers=headers)
    campus = next(e for e in entities if e["type"] == "CAMPUS")

    bills = [
        {"start": "2025-01-01", "end": "2025-01-31", "qty": 17414, "note": "Facture STEG 01/2025"},
        {"start": "2025-02-01", "end": "2025-02-28", "qty": 19206, "note": "Facture STEG 02/2025"},
        {"start": "2025-03-01", "end": "2025-03-31", "qty": 15362, "note": "Facture STEG 03/2025"},
        {"start": "2025-04-01", "end": "2025-04-30", "qty": 15513, "note": "Facture STEG 04/2025"},
    ]

    for bill in bills:
        # Elec
        request_json(f"{BASE_URL}/data/activity", method="POST", headers=headers, data={
            "source_id": elec["id"],
            "entity_id": campus["id"],
            "period_start": bill["start"],
            "period_end": bill["end"],
            "quantity": bill["qty"],
            "unit": elec["unit"],
            "data_quality": "MEASURED",
            "notes": bill["note"]
        })

        # Mobility
        request_json(f"{BASE_URL}/data/activity", method="POST", headers=headers, data={
            "source_id": car["id"],
            "entity_id": campus["id"],
            "period_start": bill["start"],
            "period_end": bill["end"],
            "quantity": 297000,
            "unit": car["unit"],
            "data_quality": "ESTIMATED",
            "notes": "Mobilité (150 ens + 1270 etu + 65 admin)"
        })

    print("Data inserted.")
    
    # Run calculation for 2025
    _, status = request_json(f"{BASE_URL}/calculations/run", method="POST", headers=headers, data={
        "period_start": "2025-01-01",
        "period_end": "2025-12-31"
    })
    print("Calculation triggered:", status)

if __name__ == "__main__":
    run()
