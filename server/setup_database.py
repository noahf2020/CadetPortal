"""
setup_database.py

Run this ONCE (from the server folder) to set up the MySQL database:
    python setup_database.py

It:
  1. creates the database (DB_NAME from server/.env) if it doesn't exist,
  2. creates every table if it doesn't exist,
  3. fills each EMPTY table with the starting data from the JSON files in
     server/data/ (links, ferry, shuttle, UOD, announcements, decks).

Tables that already have data are left alone, so running it again is safe.
"""

import json
import os

from db import get_connection

# Folder with the starting data (the JSON files the portal used before MySQL).
DATA_FOLDER = os.path.join(os.path.dirname(__file__), "data")

# The SQL that creates each table.
# The odd-looking /*T![auto_id_cache] AUTO_ID_CACHE=1 */ is a TiDB setting that
# makes new ids count up 1, 2, 3, ... like normal MySQL. (Without it, TiDB can
# jump to ids like 30001.) Normal MySQL reads it as a comment and ignores it.
CREATE_TABLE_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position INT NOT NULL,              -- the order links are shown in
        name VARCHAR(200) NOT NULL,
        description VARCHAR(500) NOT NULL DEFAULT '',
        url VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT ''
    ) /*T![auto_id_cache] AUTO_ID_CACHE=1 */
    """,
    """
    CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        author VARCHAR(200) NOT NULL DEFAULT '',
        date DATE
    ) /*T![auto_id_cache] AUTO_ID_CACHE=1 */
    """,
    """
    CREATE TABLE IF NOT EXISTS uod (
        id INT PRIMARY KEY,                 -- always 1: there is only one UOD at a time
        date DATE,
        uniform VARCHAR(200) NOT NULL,
        notes TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS schedules (
        name VARCHAR(50) PRIMARY KEY,       -- "ferry" or "shuttle"
        data JSON NOT NULL                  -- the whole schedule, as JSON
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS decks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        course VARCHAR(50) NOT NULL,
        instructor VARCHAR(200) NOT NULL DEFAULT '',
        description VARCHAR(1000) NOT NULL DEFAULT '',
        edit_code_hash VARCHAR(255) NOT NULL,
        date DATE
    ) /*T![auto_id_cache] AUTO_ID_CACHE=1 */
    """,
    """
    CREATE TABLE IF NOT EXISTS cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deck_id INT NOT NULL,               -- which deck this card belongs to
        position INT NOT NULL,              -- the card's order in its deck
        term TEXT NOT NULL,
        definition TEXT NOT NULL,
        INDEX (deck_id)                     -- makes "cards for deck X" fast
    )
    """,
]


def create_database():
    """Create the database named in DB_NAME, if it doesn't exist yet."""
    database_name = os.environ.get("DB_NAME", "cadet_portal")
    connection = get_connection(use_database=False)
    try:
        with connection.cursor() as cursor:
            # Backticks let the name contain characters like "-".
            cursor.execute("CREATE DATABASE IF NOT EXISTS `" + database_name + "`")
        connection.commit()
    finally:
        connection.close()
    print("Database ready:", database_name)


def create_tables(connection):
    """
    Create every table that doesn't exist yet.

    Parameters:
        connection: An open database connection.
    """
    with connection.cursor() as cursor:
        for statement in CREATE_TABLE_STATEMENTS:
            cursor.execute(statement)
    connection.commit()


def table_is_empty(cursor, table_name):
    """
    Check whether a table has no rows.

    Parameters:
        cursor: An open database cursor.
        table_name (str): The table to check.

    Returns:
        bool: True if the table has no rows.
    """
    cursor.execute("SELECT COUNT(*) AS row_count FROM " + table_name)
    return cursor.fetchone()["row_count"] == 0


def load_starting_data(file_name):
    """
    Read one of the JSON files in server/data/.

    Parameters:
        file_name (str): e.g. "links.json".

    Returns:
        The data in the file (a list or a dict).
    """
    with open(os.path.join(DATA_FOLDER, file_name), "r", encoding="utf-8") as file:
        return json.load(file)


def blank_to_none(text):
    """Turn an empty date like "" into None, which the database saves as NULL."""
    if text == "":
        return None
    return text


def fill_links(cursor):
    """Copy links.json into the links table."""
    position = 0
    for link in load_starting_data("links.json"):
        cursor.execute(
            "INSERT INTO links (position, name, description, url, category) VALUES (%s, %s, %s, %s, %s)",
            (position, link["name"], link["description"], link["url"], link["category"]),
        )
        position = position + 1


def fill_announcements(cursor):
    """Copy announcements.json into the announcements table."""
    for announcement in load_starting_data("announcements.json"):
        cursor.execute(
            "INSERT INTO announcements (title, body, author, date) VALUES (%s, %s, %s, %s)",
            (announcement["title"], announcement["body"], announcement["author"],
             blank_to_none(announcement["date"])),
        )


def fill_uod(cursor):
    """Copy uod.json into the uod table (always id 1)."""
    uod = load_starting_data("uod.json")
    cursor.execute(
        "INSERT INTO uod (id, date, uniform, notes) VALUES (1, %s, %s, %s)",
        (blank_to_none(uod["date"]), uod["uniform"], uod["notes"]),
    )


def fill_schedules(cursor):
    """Copy ferry.json and shuttle.json into the schedules table."""
    for name in ["ferry", "shuttle"]:
        schedule = load_starting_data(name + ".json")
        cursor.execute(
            "INSERT INTO schedules (name, data) VALUES (%s, %s)",
            (name, json.dumps(schedule)),
        )


def fill_decks(cursor):
    """
    Copy decks.json into the decks and cards tables. The ids and edit code
    hashes are kept, so old links and edit codes still work.
    """
    for deck in load_starting_data("decks.json"):
        cursor.execute(
            """INSERT INTO decks (id, title, course, instructor, description, edit_code_hash, date)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (deck["id"], deck["title"], deck["course"], deck["instructor"], deck["description"],
             deck["edit_code_hash"], blank_to_none(deck["date"])),
        )
        position = 0
        for card in deck["cards"]:
            cursor.execute(
                "INSERT INTO cards (deck_id, position, term, definition) VALUES (%s, %s, %s, %s)",
                (deck["id"], position, card["term"], card["definition"]),
            )
            position = position + 1


def fill_empty_tables(connection):
    """
    Put the starting data into every table that is still empty.

    Parameters:
        connection: An open database connection.
    """
    # Each table, and the function that fills it.
    # (cards is filled together with decks.)
    tables_to_fill = [
        ("links", fill_links),
        ("announcements", fill_announcements),
        ("uod", fill_uod),
        ("schedules", fill_schedules),
        ("decks", fill_decks),
    ]

    with connection.cursor() as cursor:
        for table_name, fill_function in tables_to_fill:
            if table_is_empty(cursor, table_name):
                fill_function(cursor)
                print("Filled", table_name)
            else:
                print("Skipped", table_name, "(already has data)")
    connection.commit()


def main():
    """Create the database and tables, then add the starting data."""
    create_database()
    connection = get_connection()
    try:
        create_tables(connection)
        print("Tables ready.")
        fill_empty_tables(connection)
    finally:
        connection.close()
    print("Done! The database is set up.")


# Only run when this file is run directly (python setup_database.py).
if __name__ == "__main__":
    main()
