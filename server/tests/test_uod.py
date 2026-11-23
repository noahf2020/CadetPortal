"""
test_uod.py

Tests for updating the Uniform of the Day (storage.save_uod, used by
update_uod.py) and reading it back through GET /api/uod.
Uses the TEST database (see conftest.py), never the real one.
"""

from datetime import date

import db
from storage import save_uod


def clear_uod():
    """Remove the UOD row so each test starts with no UOD."""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM uod")
        connection.commit()
    finally:
        connection.close()


def test_missing_uod_gives_clear_error(client):
    clear_uod()
    response = client.get("/api/uod")
    assert response.status_code == 404
    assert response.get_json()["error"] == "No Uniform of the Day yet."


def test_save_uod_shows_on_portal_with_todays_date(client):
    clear_uod()
    save_uod("Class B", "Rain expected.")
    uod = client.get("/api/uod").get_json()
    assert uod["uniform"] == "Class B"
    assert uod["notes"] == "Rain expected."
    assert uod["date"] == date.today().isoformat()


def test_save_uod_replaces_the_old_one(client):
    clear_uod()
    save_uod("Class B", "")
    save_uod("ACUs", "")
    uod = client.get("/api/uod").get_json()
    assert uod["uniform"] == "ACUs"
    # There is still only one UOD row.
    count = db.fetch_one("SELECT COUNT(*) AS row_count FROM uod")["row_count"]
    assert count == 1
