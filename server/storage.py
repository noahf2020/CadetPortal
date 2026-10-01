"""
storage.py

Small helper functions for reading the portal's JSON data files.
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
