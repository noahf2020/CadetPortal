"""
storage.py

Every function that reads or saves the portal's data. The data lives in a
MySQL database (see db.py for the connection and setup_database.py for the tables).
Routes in app.py call these functions and never write SQL themselves.

Each function returns plain Python lists and dicts shaped exactly like the
old JSON files, so the React webpage did not need to change.
"""

import json
from datetime import date

from db import fetch_all, fetch_one, get_connection


def date_to_text(row):
    """
    Change the "date" in a row from a Python date to text like "2026-10-06".
    (Flask would otherwise send dates in a long format like "Tue, 06 Oct 2026 ...".)

    Parameters:
        row (dict): A row from the database that has a "date" key.

    Returns:
        dict: The same row, with the date as text (or "" if there is no date).
    """
    if row["date"] is None:
        row["date"] = ""
    else:
        row["date"] = row["date"].isoformat()
    return row


# ---------- Portal info (read-only) ----------


def load_links():
    """
    Return the quick links, in the order they should be shown.

    Returns:
        list: Each link as { "name", "description", "url", "category" }.
    """
    return fetch_all("SELECT name, description, url, category FROM links ORDER BY position")


def load_announcements():
    """
    Return every announcement.

    Returns:
        list: Each as { "id", "title", "body", "author", "date" }.
    """
    rows = fetch_all("SELECT id, title, body, author, date FROM announcements ORDER BY id")
    for row in rows:
        date_to_text(row)
    return rows


def load_uod():
    """
    Return the current Uniform of the Day. The uod table only ever has one row (id 1).

    Returns:
        dict or None: { "date", "uniform", "notes" }, or None if it hasn't been set.
    """
    row = fetch_one("SELECT date, uniform, notes FROM uod WHERE id = 1")
    if row is None:
        return None
    return date_to_text(row)


def save_uod(uniform, notes):
    """
    Set the Uniform of the Day, dated today. Used by update_uod.py (and, later,
    by the UOD email fetch if access is approved).
    "ON DUPLICATE KEY UPDATE" means: add row 1 if it's missing, otherwise change it.

    Parameters:
        uniform (str): The uniform, e.g. "Class B".
        notes (str): Extra details, or "" for none.
    """
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO uod (id, date, uniform, notes) VALUES (1, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE date = VALUES(date), uniform = VALUES(uniform), notes = VALUES(notes)""",
                (date.today(), uniform, notes),
            )
        connection.commit()
    finally:
        connection.close()


def load_schedule(name):
    """
    Return a schedule ("ferry" or "shuttle"). Schedules are nested lists
    (routes -> stops -> times) that are always shown whole, so each one is
    saved as a single JSON value instead of being split across many tables.

    Parameters:
        name (str): "ferry" or "shuttle".

    Returns:
        dict or None: The schedule, or None if it isn't in the database.
    """
    row = fetch_one("SELECT data FROM schedules WHERE name = %s", (name,))
    if row is None:
        return None
    return json.loads(row["data"])  # the JSON text from the database -> Python dict


# ---------- Study decks ----------


def make_like_pattern(search_text):
    """
    Turn search text into a pattern for SQL's LIKE, which finds text anywhere inside
    a field. "%" means "anything", so "%rank%" matches "Military Ranks".

    Parameters:
        search_text (str): What the cadet typed, e.g. "rank".

    Returns:
        str: The pattern, e.g. "%rank%".
    """
    # In LIKE, "%" and "_" are special. Put a "\" in front of any the cadet
    # typed so they are searched for as normal characters.
    escaped = search_text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return "%" + escaped.lower() + "%"


def search_decks(search_text):
    """
    Return a short summary of every deck that matches the search.
    A deck matches if the text is in its title, course, instructor, description,
    or any card's term or definition. Upper/lower case does not matter.

    Parameters:
        search_text (str): The search words. An empty string returns every deck.

    Returns:
        list: Each as { "id", "title", "course", "instructor", "description",
              "date", "card_count" }.
    """
    # The card count is worked out by a small query inside the main one.
    select_part = """
        SELECT d.id, d.title, d.course, d.instructor, d.description, d.date,
               (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id) AS card_count
        FROM decks d
    """

    search_text = search_text.strip()
    if search_text == "":
        rows = fetch_all(select_part + " ORDER BY d.id")
    else:
        pattern = make_like_pattern(search_text)
        # LOWER() makes the comparison ignore upper/lower case.
        where_part = """
            WHERE LOWER(d.title) LIKE %s
               OR LOWER(d.course) LIKE %s
               OR LOWER(d.instructor) LIKE %s
               OR LOWER(d.description) LIKE %s
               OR EXISTS (
                   SELECT 1 FROM cards c
                   WHERE c.deck_id = d.id
                     AND (LOWER(c.term) LIKE %s OR LOWER(c.definition) LIKE %s)
               )
            ORDER BY d.id
        """
        # The same pattern fills all six %s spots.
        rows = fetch_all(select_part + where_part, (pattern,) * 6)

    for row in rows:
        date_to_text(row)
    return rows


def load_deck(deck_id):
    """
    Return one deck with all of its cards. The edit code hash is NOT included,
    so the result is safe to send to the webpage.

    Parameters:
        deck_id (int): The deck's id.

    Returns:
        dict or None: { "id", "title", "course", "instructor", "description", "date",
                        "cards": [{ "term", "definition" }] }, or None if there is no such deck.
    """
    deck = fetch_one(
        "SELECT id, title, course, instructor, description, date FROM decks WHERE id = %s",
        (deck_id,),
    )
    if deck is None:
        return None

    deck["cards"] = fetch_all(
        "SELECT term, definition FROM cards WHERE deck_id = %s ORDER BY position",
        (deck_id,),
    )
    return date_to_text(deck)


def load_edit_code_hash(deck_id):
    """
    Return the saved (hashed) edit code for a deck, to check a cadet's code against.

    Parameters:
        deck_id (int): The deck's id.

    Returns:
        str or None: The hash, or None if there is no such deck.
    """
    row = fetch_one("SELECT edit_code_hash FROM decks WHERE id = %s", (deck_id,))
    if row is None:
        return None
    return row["edit_code_hash"]


def insert_cards(cursor, deck_id, cards):
    """
    Save a deck's cards. "position" remembers their order.

    Parameters:
        cursor: An open database cursor (part of a bigger save).
        deck_id (int): The deck the cards belong to.
        cards (list): The cards, each { "term", "definition" }.
    """
    position = 0
    for card in cards:
        cursor.execute(
            "INSERT INTO cards (deck_id, position, term, definition) VALUES (%s, %s, %s, %s)",
            (deck_id, position, card["term"], card["definition"]),
        )
        position = position + 1


def create_deck(deck, edit_code_hash):
    """
    Save a new deck and its cards.
    It is one "transaction": either everything is saved, or (if something fails) nothing is.

    Parameters:
        deck (dict): The cleaned deck from decks.clean_deck_input
                     ({ "title", "course", "instructor", "description", "cards" }).
        edit_code_hash (str): The hashed edit code.

    Returns:
        int: The new deck's id.
    """
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO decks (title, course, instructor, description, edit_code_hash, date)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (deck["title"], deck["course"], deck["instructor"], deck["description"],
                 edit_code_hash, date.today()),
            )
            new_id = cursor.lastrowid  # the id the database picked for the new deck
            insert_cards(cursor, new_id, deck["cards"])
        connection.commit()  # save everything at once
        return new_id
    except Exception:
        connection.rollback()  # undo the half-finished save
        raise
    finally:
        connection.close()


def update_deck(deck_id, deck):
    """
    Replace a deck's details and cards. The id, date, and edit code stay the same.

    Parameters:
        deck_id (int): The deck to change.
        deck (dict): The cleaned new details (see create_deck).
    """
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """UPDATE decks SET title = %s, course = %s, instructor = %s, description = %s
                   WHERE id = %s""",
                (deck["title"], deck["course"], deck["instructor"], deck["description"], deck_id),
            )
            # Simplest way to replace the cards: delete the old ones, add the new ones.
            cursor.execute("DELETE FROM cards WHERE deck_id = %s", (deck_id,))
            insert_cards(cursor, deck_id, deck["cards"])
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def delete_deck(deck_id):
    """
    Delete a deck and all of its cards.

    Parameters:
        deck_id (int): The deck to delete.
    """
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM cards WHERE deck_id = %s", (deck_id,))
            cursor.execute("DELETE FROM decks WHERE id = %s", (deck_id,))
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
