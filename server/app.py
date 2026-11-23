"""
app.py

The Flask server for the Cadet Portal.
It sends the portal's data (links, ferry hours, shuttle times,
UOD, announcements) to the React webpage as JSON. The data is stored in a
MySQL database (see db.py and storage.py). The portal has no login, so these
routes are read-only.

The study deck routes (/api/decks) are the one exception: cadets can
create decks, and edit or delete them with the deck's edit code.

Run it locally with:  python app.py
Then visit:           http://localhost:5000/api/links
On Vercel, api/index.py (at the top of the repo) loads this same app.
"""

from flask import Flask, jsonify, request

import storage
from decks import (
    MIN_EDIT_CODE_LENGTH,
    clean_deck_input,
    edit_code_is_correct,
    hash_edit_code,
)

# Create the Flask application.
app = Flask(__name__)


# If anything goes wrong that a route didn't handle (for example, the database
# can't be reached), send JSON instead of an HTML error page, so the webpage
# can show the message. Flask still prints the full error in the server log.
@app.errorhandler(500)
def handle_server_error(error):
    """Return a JSON error for any unexpected server problem."""
    return jsonify({"error": "Something went wrong on the server. Try again in a minute."}), 500


# GET /api/links
# Response: a list of service links, e.g. [{ "name", "description", "url", "category" }]
@app.route("/api/links")
def get_links():
    """Return the list of quick links to cadet services."""
    return jsonify(storage.load_links())


# GET /api/ferry
# Response: { "note", "schedule": [{ "day", "departs", "times": [...] }] }
# Error: 404 { "error" } if no ferry schedule is saved.
@app.route("/api/ferry")
def get_ferry():
    """Return the ferry schedule."""
    ferry = storage.load_schedule("ferry")
    if ferry is None:
        return jsonify({"error": "No ferry schedule yet."}), 404
    return jsonify(ferry)


# GET /api/shuttle
# Response: { "hours", "note", "routes": [{ "route", "stops": [{ "stop", "minutes": [...] }] }] }
# Error: 404 { "error" } if no shuttle schedule is saved.
@app.route("/api/shuttle")
def get_shuttle():
    """Return the shuttle schedule."""
    shuttle = storage.load_schedule("shuttle")
    if shuttle is None:
        return jsonify({"error": "No shuttle schedule yet."}), 404
    return jsonify(shuttle)


# GET /api/uod
# Response: { "date", "uniform", "notes" }
# Error: 404 { "error" } if no Uniform of the Day is saved.
@app.route("/api/uod")
def get_uod():
    """Return the current Uniform of the Day."""
    uod = storage.load_uod()
    if uod is None:
        return jsonify({"error": "No Uniform of the Day yet."}), 404
    return jsonify(uod)


# GET /api/announcements
# Response: a list of announcements, e.g. [{ "id", "title", "body", "author", "date" }]
@app.route("/api/announcements")
def get_announcements():
    """Return all announcements."""
    return jsonify(storage.load_announcements())


# ---------- Study decks (the portal's Quizlet) ----------


# GET /api/decks?search=cy300
# "search" is optional. It matches the title, course, instructor, description,
# or the text of any card.
# Response: a list of deck summaries,
#   e.g. [{ "id", "title", "course", "instructor", "description", "date", "card_count" }]
@app.route("/api/decks", methods=["GET"])
def get_decks():
    """Return a short summary of every deck that matches the search."""
    search_text = request.args.get("search", "")
    return jsonify(storage.search_decks(search_text))


# GET /api/decks/<deck_id>
# Response: one full deck,
#   e.g. { "id", "title", "course", "instructor", "description", "date",
#          "cards": [{ "term", "definition" }] }
# Error: 404 { "error" } if there is no deck with that id.
@app.route("/api/decks/<int:deck_id>", methods=["GET"])
def get_deck(deck_id):
    """Return one deck, including all of its cards."""
    deck = storage.load_deck(deck_id)
    if deck is None:
        return jsonify({"error": "Deck not found."}), 404
    return jsonify(deck)


# POST /api/decks
# Request body: { "title", "course", "instructor", "description", "edit_code",
#                 "cards": [{ "term", "definition" }] }
# Response: 201 with the new deck (without its edit code).
# Error: 400 { "error" } if something is missing or wrong.
@app.route("/api/decks", methods=["POST"])
def create_deck():
    """Create a new deck and save it to the database."""
    data = request.get_json(silent=True)  # silent=True gives None instead of crashing on bad JSON
    new_deck, error = clean_deck_input(data)
    if error is not None:
        return jsonify({"error": error}), 400

    edit_code = data.get("edit_code", "")
    if not isinstance(edit_code, str) or len(edit_code) < MIN_EDIT_CODE_LENGTH:
        message = "Edit code must be at least " + str(MIN_EDIT_CODE_LENGTH) + " characters."
        return jsonify({"error": message}), 400

    new_id = storage.create_deck(new_deck, hash_edit_code(edit_code))
    return jsonify(storage.load_deck(new_id)), 201


# PUT /api/decks/<deck_id>
# Request body: { "title", "course", "instructor", "description", "edit_code",
#                 "cards": [{ "term", "definition" }] }
# Response: the updated deck (without its edit code).
# Errors: 404 if the deck does not exist, 403 if the edit code is wrong,
#         400 if something is missing or wrong.
@app.route("/api/decks/<int:deck_id>", methods=["PUT"])
def update_deck(deck_id):
    """Replace a deck's details and cards, if the edit code is correct."""
    edit_code_hash = storage.load_edit_code_hash(deck_id)
    if edit_code_hash is None:
        return jsonify({"error": "Deck not found."}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not edit_code_is_correct(edit_code_hash, data.get("edit_code")):
        return jsonify({"error": "Wrong edit code."}), 403

    new_details, error = clean_deck_input(data)
    if error is not None:
        return jsonify({"error": error}), 400

    # The id, date, and edit code stay the same.
    storage.update_deck(deck_id, new_details)
    return jsonify(storage.load_deck(deck_id))


# DELETE /api/decks/<deck_id>
# Request body: { "edit_code" }
# Response: { "message": "Deck deleted." }
# Errors: 404 if the deck does not exist, 403 if the edit code is wrong.
@app.route("/api/decks/<int:deck_id>", methods=["DELETE"])
def delete_deck(deck_id):
    """Delete a deck, if the edit code is correct."""
    edit_code_hash = storage.load_edit_code_hash(deck_id)
    if edit_code_hash is None:
        return jsonify({"error": "Deck not found."}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not edit_code_is_correct(edit_code_hash, data.get("edit_code")):
        return jsonify({"error": "Wrong edit code."}), 403

    storage.delete_deck(deck_id)
    return jsonify({"message": "Deck deleted."})


# Only start the server when this file is run directly (python app.py).
if __name__ == "__main__":
    # debug=True restarts the server automatically when the code changes.
    app.run(port=5000, debug=True)
