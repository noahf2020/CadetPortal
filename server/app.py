"""
app.py

The Flask server for the Cadet Portal.
It sends the portal's data (links, ferry hours, shuttle times,
UOD, announcements)
to the React webpage as JSON. The portal has no login, so every
route is read-only.

Run it with:  python app.py
Then visit:   http://localhost:5000/api/links
"""

from flask import Flask, jsonify

from storage import load_json

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


# Only start the server when this file is run directly (python app.py).
if __name__ == "__main__":
    # debug=True restarts the server automatically when the code changes.
    app.run(port=5000, debug=True)
