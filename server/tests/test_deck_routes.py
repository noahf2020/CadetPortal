"""
test_deck_routes.py

Tests for the /api/decks routes in app.py.
Each test gets a "client" (see conftest.py) that calls the API with an
empty, temporary decks.json, so the real data is never changed.
"""

import json

import storage


def make_deck_data(edit_code="secret123"):
    """Return the JSON body for creating a small deck."""
    return {
        "title": "Military Ranks",
        "course": "ms100",
        "instructor": "CPT Smith",
        "description": "Army rank abbreviations.",
        "edit_code": edit_code,
        "cards": [
            {"term": "SPC", "definition": "Specialist"},
            {"term": "SGT", "definition": "Sergeant"},
        ],
    }


def create_deck(client):
    """Create a deck through the API and return the new deck's JSON."""
    response = client.post("/api/decks", json=make_deck_data())
    assert response.status_code == 201
    return response.get_json()


def read_saved_decks():
    """Read the temporary decks.json straight from disk."""
    return storage.load_json("decks.json")


# ---------- POST /api/decks ----------


def test_create_deck(client):
    deck = create_deck(client)
    assert deck["id"] == 1
    assert deck["course"] == "MS100"
    assert len(deck["cards"]) == 2
    # The edit code must never be sent back to the webpage.
    assert "edit_code" not in deck
    assert "edit_code_hash" not in deck


def test_create_deck_saves_to_file(client):
    create_deck(client)
    saved_decks = read_saved_decks()
    assert len(saved_decks) == 1
    # The file keeps a hash of the code, never the code itself.
    assert saved_decks[0]["edit_code_hash"] != "secret123"
    assert "secret123" not in json.dumps(saved_decks)


def test_create_deck_needs_a_long_enough_edit_code(client):
    response = client.post("/api/decks", json=make_deck_data(edit_code="abc"))
    assert response.status_code == 400
    assert "Edit code" in response.get_json()["error"]


def test_create_deck_needs_a_title(client):
    data = make_deck_data()
    data["title"] = ""
    response = client.post("/api/decks", json=data)
    assert response.status_code == 400
    assert response.get_json()["error"] == "Title is required."


def test_create_deck_rejects_non_json(client):
    response = client.post("/api/decks", data="hello")
    assert response.status_code == 400


# ---------- GET /api/decks ----------


def test_list_decks_is_empty_at_first(client):
    response = client.get("/api/decks")
    assert response.get_json() == []


def test_list_decks_gives_summaries(client):
    create_deck(client)
    summaries = client.get("/api/decks").get_json()
    assert len(summaries) == 1
    assert summaries[0]["card_count"] == 2
    assert "cards" not in summaries[0]  # summaries leave out the cards


def test_search_decks_by_card_text(client):
    create_deck(client)
    assert len(client.get("/api/decks?search=sergeant").get_json()) == 1
    assert len(client.get("/api/decks?search=calculus").get_json()) == 0


# ---------- GET /api/decks/<id> ----------


def test_get_one_deck(client):
    create_deck(client)
    deck = client.get("/api/decks/1").get_json()
    assert deck["title"] == "Military Ranks"
    assert "edit_code_hash" not in deck


def test_get_missing_deck(client):
    response = client.get("/api/decks/99")
    assert response.status_code == 404


# ---------- PUT /api/decks/<id> ----------


def test_update_deck_with_right_code(client):
    create_deck(client)
    data = make_deck_data()
    data["title"] = "Army Ranks"
    response = client.put("/api/decks/1", json=data)
    assert response.status_code == 200
    assert read_saved_decks()[0]["title"] == "Army Ranks"


def test_update_deck_with_wrong_code(client):
    create_deck(client)
    data = make_deck_data(edit_code="wrong-code")
    data["title"] = "Hacked"
    response = client.put("/api/decks/1", json=data)
    assert response.status_code == 403
    assert read_saved_decks()[0]["title"] == "Military Ranks"


def test_update_missing_deck(client):
    response = client.put("/api/decks/99", json=make_deck_data())
    assert response.status_code == 404


# ---------- DELETE /api/decks/<id> ----------


def test_delete_deck_with_right_code(client):
    create_deck(client)
    response = client.delete("/api/decks/1", json={"edit_code": "secret123"})
    assert response.status_code == 200
    assert read_saved_decks() == []


def test_delete_deck_with_wrong_code(client):
    create_deck(client)
    response = client.delete("/api/decks/1", json={"edit_code": "wrong-code"})
    assert response.status_code == 403
    assert len(read_saved_decks()) == 1
