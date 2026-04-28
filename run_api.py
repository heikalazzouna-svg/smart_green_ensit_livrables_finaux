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
    gas = next(s for s in sources if "Natural Gas" in s["name"])
    car = next(s for s in sources if "Car" in s["name"])

    # Get entity
    entities, _ = request_json(f"{BASE_URL}/data/entities", headers=headers)
    campus = next(e for e in entities if e["type"] == "CAMPUS")

    # Gas Bills (Thermies -> kWh conversion: * 1.163)
    gas_bills = [
        {"start": "2025-01-01", "end": "2025-01-31", "qty": int(29948 * 1.163), "note": "Facture Gaz 01/2025 (29948 Thermies)"},
        {"start": "2025-02-01", "end": "2025-02-28", "qty": int(34300 * 1.163), "note": "Facture Gaz 02/2025 (34300 Thermies)"},
        {"start": "2025-03-01", "end": "2025-03-31", "qty": 0, "note": "Facture Gaz 03/2025 (0 Thermies)"},
        {"start": "2025-04-01", "end": "2025-04-30", "qty": 0, "note": "Facture Gaz 04/2025 (0 Thermies)"},
    ]

    for bill in gas_bills:
        request_json(f"{BASE_URL}/data/activity", method="POST", headers=headers, data={
            "source_id": gas["id"],
            "entity_id": campus["id"],
            "period_start": bill["start"],
            "period_end": bill["end"],
            "quantity": bill["qty"],
            "unit": gas["unit"],
            "data_quality": "MEASURED",
            "notes": bill["note"]
        })

    # Electricity Oct 2025
    elec_oct = {"start": "2025-10-01", "end": "2025-10-31", "qty": 26522, "note": "Facture STEG 10/2025"}
    request_json(f"{BASE_URL}/data/activity", method="POST", headers=headers, data={
        "source_id": elec["id"],
        "entity_id": campus["id"],
        "period_start": elec_oct["start"],
        "period_end": elec_oct["end"],
        "quantity": elec_oct["qty"],
        "unit": elec["unit"],
        "data_quality": "MEASURED",
        "notes": elec_oct["note"]
    })

    # Mobility Oct 2025
    request_json(f"{BASE_URL}/data/activity", method="POST", headers=headers, data={
        "source_id": car["id"],
        "entity_id": campus["id"],
        "period_start": elec_oct["start"],
        "period_end": elec_oct["end"],
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
