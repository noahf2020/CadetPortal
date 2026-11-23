"""
test_deck_routes.py

Tests for the /api/decks routes in app.py.
Each test gets a "client" (see conftest.py) that calls the API using the
TEST database, with no decks in it, so the real data is never changed.
"""

from db import fetch_all, fetch_one


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


def count_decks():
    """Count the decks saved in the test database."""
    return fetch_one("SELECT COUNT(*) AS deck_count FROM decks")["deck_count"]


# ---------- POST /api/decks ----------


def test_create_deck(client):
    deck = create_deck(client)
    assert deck["title"] == "Military Ranks"
    assert deck["course"] == "MS100"
    assert len(deck["cards"]) == 2
    assert len(deck["date"]) == 10  # e.g. "2026-11-23"
    # The edit code must never be sent back to the webpage.
    assert "edit_code" not in deck
    assert "edit_code_hash" not in deck


def test_create_deck_saves_to_database(client):
    deck = create_deck(client)
    saved = fetch_one("SELECT edit_code_hash FROM decks WHERE id = %s", (deck["id"],))
    # The database keeps a hash of the code, never the code itself.
    assert saved["edit_code_hash"] != "secret123"
    assert "secret123" not in saved["edit_code_hash"]


def test_create_deck_keeps_card_order(client):
    deck = create_deck(client)
    cards = fetch_all("SELECT term FROM cards WHERE deck_id = %s ORDER BY position", (deck["id"],))
    assert [card["term"] for card in cards] == ["SPC", "SGT"]


def test_create_deck_needs_a_long_enough_edit_code(client):
    response = client.post("/api/decks", json=make_deck_data(edit_code="abc"))
    assert response.status_code == 400
    assert "Edit code" in response.get_json()["error"]
    assert count_decks() == 0


def test_create_deck_needs_a_title(client):
    data = make_deck_data()
    data["title"] = ""
    response = client.post("/api/decks", json=data)
    assert response.status_code == 400
    assert response.get_json()["error"] == "Title is required."


def test_create_deck_rejects_a_too_long_title(client):
    data = make_deck_data()
    data["title"] = "x" * 201
    response = client.post("/api/decks", json=data)
    assert response.status_code == 400


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


def test_search_decks_by_course_in_any_case(client):
    create_deck(client)
    assert len(client.get("/api/decks?search=ms100").get_json()) == 1


def test_search_decks_by_card_text(client):
    create_deck(client)
    assert len(client.get("/api/decks?search=SERGEANT").get_json()) == 1
    assert len(client.get("/api/decks?search=calculus").get_json()) == 0


def test_search_treats_percent_as_normal_text(client):
    create_deck(client)
    # "%" means "anything" in SQL; it must not match every deck.
    assert len(client.get("/api/decks?search=%25").get_json()) == 0


# ---------- GET /api/decks/<id> ----------


def test_get_one_deck(client):
    new_deck = create_deck(client)
    deck = client.get("/api/decks/" + str(new_deck["id"])).get_json()
    assert deck["title"] == "Military Ranks"
    assert deck["cards"][0] == {"term": "SPC", "definition": "Specialist"}
    assert "edit_code_hash" not in deck


def test_get_missing_deck(client):
    response = client.get("/api/decks/999999")
    assert response.status_code == 404


# ---------- PUT /api/decks/<id> ----------


def test_update_deck_with_right_code(client):
    deck = create_deck(client)
    data = make_deck_data()
    data["title"] = "Army Ranks"
    data["cards"] = [{"term": "CPT", "definition": "Captain"}]
    response = client.put("/api/decks/" + str(deck["id"]), json=data)
    assert response.status_code == 200
    updated = response.get_json()
    assert updated["title"] == "Army Ranks"
    assert updated["cards"] == [{"term": "CPT", "definition": "Captain"}]


def test_update_deck_with_wrong_code(client):
    deck = create_deck(client)
    data = make_deck_data(edit_code="wrong-code")
    data["title"] = "Hacked"
    response = client.put("/api/decks/" + str(deck["id"]), json=data)
    assert response.status_code == 403
    saved = fetch_one("SELECT title FROM decks WHERE id = %s", (deck["id"],))
    assert saved["title"] == "Military Ranks"


def test_update_missing_deck(client):
    response = client.put("/api/decks/999999", json=make_deck_data())
    assert response.status_code == 404


# ---------- DELETE /api/decks/<id> ----------


def test_delete_deck_with_right_code(client):
    deck = create_deck(client)
    response = client.delete("/api/decks/" + str(deck["id"]), json={"edit_code": "secret123"})
    assert response.status_code == 200
    assert count_decks() == 0
    # Its cards are deleted too.
    cards = fetch_all("SELECT id FROM cards WHERE deck_id = %s", (deck["id"],))
    assert cards == []


def test_delete_deck_with_wrong_code(client):
    deck = create_deck(client)
    response = client.delete("/api/decks/" + str(deck["id"]), json={"edit_code": "wrong-code"})
    assert response.status_code == 403
    assert count_decks() == 1
