"""
api/index.py

The entry point Vercel uses to run the Flask server online.
Vercel runs every Python file in the "api" folder as a serverless function,
and vercel.json sends every /api/... request here.

This file just loads the real app from server/app.py, so there is only one
copy of the server code.
"""

import os
import sys

# Let Python find the files in the server folder (app.py, storage.py, ...).
SERVER_FOLDER = os.path.join(os.path.dirname(__file__), "..", "server")
sys.path.insert(0, SERVER_FOLDER)

from app import app  # noqa: E402  (must come after the line above)

# Vercel looks for a variable named "app" and sends requests to it.
__all__ = ["app"]
