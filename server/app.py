"""
app.py

The Flask server for the Cadet Portal.
It sends the portal's data (links, ferry hours, shuttle times,
UOD, announcements)
to the React webpage as JSON. The portal has no login, so these
routes are read-only.

The study deck routes (/api/decks) are the one exception: cadets can
create decks, and edit or delete them with the deck's edit code.

Run it with:  python app.py
Then visit:   http://localhost:5000/api/links
"""

from datetime import date

from flask import Flask, jsonify, request

from storage import load_json, save_json
from decks import (
    MIN_EDIT_CODE_LENGTH,
    clean_deck_input,
    deck_matches_search,
    edit_code_is_correct,
    find_deck,
    get_next_deck_id,
    hash_edit_code,
    make_deck_summary,
    make_public_deck,
)

# Create the Flask application.
app = Flask(__name__)


# GET /api/links
# Response: a list of service links, e.g. [{ "name", "description", "url", "category" }]
@app.route("/api/links")
def get_links():
    """Return the list of quick links to cadet services."""
    links = load_json("links.json")
    return jsonify(links)


# GET /api/ferry
# Response: { "note", "schedule": [{ "day", "departs", "times": [...] }] }
@app.route("/api/ferry")
def get_ferry():
    """Return the ferry schedule."""
    ferry = load_json("ferry.json")
    return jsonify(ferry)


# GET /api/shuttle
# Response: { "hours", "note", "routes": [{ "route", "stops": [{ "stop", "minutes": [...] }] }] }
@app.route("/api/shuttle")
def get_shuttle():
    """Return the shuttle schedule."""
    shuttle = load_json("shuttle.json")
    return jsonify(shuttle)


# GET /api/uod
# Response: { "date", "uniform", "notes" }
@app.route("/api/uod")
def get_uod():
    """Return the current Uniform of the Day."""
    uod = load_json("uod.json")
    return jsonify(uod)


# GET /api/announcements
# Response: a list of announcements, e.g. [{ "id", "title", "body", "author", "date" }]
@app.route("/api/announcements")
def get_announcements():
    """Return all announcements."""
    announcements = load_json("announcements.json")
    return jsonify(announcements)


# ---------- Study decks (the portal's Quizlet) ----------


# GET /api/decks?search=cy300
# "search" is optional. It matches the title, course, instructor, or description.
# Response: a list of deck summaries,
#   e.g. [{ "id", "title", "course", "instructor", "description", "date", "card_count" }]
@app.route("/api/decks", methods=["GET"])
def get_decks():
    """Return a short summary of every deck that matches the search."""
    search_text = request.args.get("search", "")
    decks = load_json("decks.json")

    summaries = []
    for deck in decks:
        if deck_matches_search(deck, search_text):
            summaries.append(make_deck_summary(deck))

    return jsonify(summaries)


# GET /api/decks/<deck_id>
# Response: one full deck,
#   e.g. { "id", "title", "course", "instructor", "description", "date",
#          "cards": [{ "term", "definition" }] }
# Error: 404 { "error" } if there is no deck with that id.
@app.route("/api/decks/<int:deck_id>", methods=["GET"])
def get_deck(deck_id):
    """Return one deck, including all of its cards."""
    decks = load_json("decks.json")
    deck = find_deck(decks, deck_id)
    if deck is None:
        return jsonify({"error": "Deck not found."}), 404

    return jsonify(make_public_deck(deck))


# POST /api/decks
# Request body: { "title", "course", "instructor", "description", "edit_code",
#                 "cards": [{ "term", "definition" }] }
# Response: 201 with the new deck (without its edit code).
# Error: 400 { "error" } if something is missing or wrong.
@app.route("/api/decks", methods=["POST"])
def create_deck():
    """Create a new deck and save it to decks.json."""
    data = request.get_json(silent=True)  # silent=True gives None instead of crashing on bad JSON
    new_deck, error = clean_deck_input(data)
    if error is not None:
        return jsonify({"error": error}), 400

    edit_code = data.get("edit_code", "")
    if not isinstance(edit_code, str) or len(edit_code) < MIN_EDIT_CODE_LENGTH:
        message = "Edit code must be at least " + str(MIN_EDIT_CODE_LENGTH) + " characters."
        return jsonify({"error": message}), 400

    decks = load_json("decks.json")
    new_deck["id"] = get_next_deck_id(decks)
    new_deck["date"] = date.today().isoformat()  # e.g. "2026-10-06"
    new_deck["edit_code_hash"] = hash_edit_code(edit_code)

    decks.append(new_deck)
    save_json("decks.json", decks)

    return jsonify(make_public_deck(new_deck)), 201


# PUT /api/decks/<deck_id>
# Request body: { "title", "course", "instructor", "description", "edit_code",
#                 "cards": [{ "term", "definition" }] }
# Response: the updated deck (without its edit code).
# Errors: 404 if the deck does not exist, 403 if the edit code is wrong,
#         400 if something is missing or wrong.
@app.route("/api/decks/<int:deck_id>", methods=["PUT"])
def update_deck(deck_id):
    """Replace a deck's details and cards, if the edit code is correct."""
    decks = load_json("decks.json")
    deck = find_deck(decks, deck_id)
    if deck is None:
        return jsonify({"error": "Deck not found."}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not edit_code_is_correct(deck, data.get("edit_code")):
        return jsonify({"error": "Wrong edit code."}), 403

    new_details, error = clean_deck_input(data)
    if error is not None:
        return jsonify({"error": error}), 400

    # Copy the new title, course, cards, etc. onto the saved deck.
    # The id, date, and edit code stay the same.
    deck.update(new_details)
    save_json("decks.json", decks)

    return jsonify(make_public_deck(deck))


# DELETE /api/decks/<deck_id>
# Request body: { "edit_code" }
# Response: { "message": "Deck deleted." }
# Errors: 404 if the deck does not exist, 403 if the edit code is wrong.
@app.route("/api/decks/<int:deck_id>", methods=["DELETE"])
def delete_deck(deck_id):
    """Delete a deck, if the edit code is correct."""
    decks = load_json("decks.json")
    deck = find_deck(decks, deck_id)
    if deck is None:
        return jsonify({"error": "Deck not found."}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not edit_code_is_correct(deck, data.get("edit_code")):
        return jsonify({"error": "Wrong edit code."}), 403

    decks.remove(deck)
    save_json("decks.json", decks)

    return jsonify({"message": "Deck deleted."})


# Only start the server when this file is run directly (python app.py).
if __name__ == "__main__":
    # debug=True restarts the server automatically when the code changes.
    app.run(port=5000, debug=True)
