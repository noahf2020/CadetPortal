"""
conftest.py

Shared setup for the server's tests (pytest reads this file automatically).
Run the tests from the "server" folder with:  python -m pytest

It gives tests a "client" that can call the API without starting the server.
The client uses a temporary data folder, so tests never change the real
files in server/data/.
"""

import json

import pytest

import storage
from app import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    """
    Make a test client that uses an empty, temporary decks.json.

    Parameters:
        tmp_path: A new empty folder for this test (given by pytest).
        monkeypatch: Lets the test swap a value just for this test (given by pytest).

    Returns:
        A Flask test client. Use it like client.get("/api/decks").
    """
    # Start with no decks.
    decks_file = tmp_path / "decks.json"
    decks_file.write_text(json.dumps([]), encoding="utf-8")

    # Point storage.py at the temporary folder instead of server/data/.
    monkeypatch.setattr(storage, "DATA_FOLDER", str(tmp_path))

    return app.test_client()
