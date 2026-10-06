"""
storage.py

Small helper functions for reading and writing the portal's JSON data files.
All data files live in the "data" folder next to this file.
Routes in app.py should use these helpers instead of opening files directly.
"""

import json
import os

# Absolute path to the "data" folder, so it works no matter where the
# server is started from.
DATA_FOLDER = os.path.join(os.path.dirname(__file__), "data")


def load_json(file_name):
    """
    Read a JSON file from the data folder and return its contents.

    Parameters:
        file_name (str): Name of the file, for example "links.json".

    Returns:
        The Python data stored in the file (usually a list or a dict).
    """
    file_path = os.path.join(DATA_FOLDER, file_name)

    # "utf-8" makes sure special characters are read correctly on Windows.
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data


def save_json(file_name, data):
    """
    Write Python data to a JSON file in the data folder.
    This replaces everything that was in the file before.

    Parameters:
        file_name (str): Name of the file, for example "decks.json".
        data: The Python data to save (usually a list or a dict).

    Returns:
        Nothing.
    """
    file_path = os.path.join(DATA_FOLDER, file_name)

    # indent=2 keeps the file easy for people to read and edit by hand.
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)
