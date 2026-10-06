"""
decks.py

Helper functions for the study decks (the portal's Quizlet).
The routes in app.py use these helpers to search, check, and clean up decks.

A deck looks like this in data/decks.json:
    {
        "id": 1,
        "title": "Military Ranks",
        "course": "MS100",
        "instructor": "CPT Smith",
        "description": "Army rank abbreviations.",
        "edit_code_hash": "scrypt:...",
        "date": "2026-10-06",
        "cards": [{ "term": "CPT", "definition": "Captain" }]
    }

The edit code is never saved as plain text. Only a "hash" of it is saved
(a scrambled version that can be checked but not turned back into the code).
"""

from werkzeug.security import check_password_hash, generate_password_hash

# The shortest edit code we accept.
MIN_EDIT_CODE_LENGTH = 4


def make_public_deck(deck):
    """
    Make a copy of a deck that is safe to send to the webpage.

    Parameters:
        deck (dict): A deck from decks.json.

    Returns:
        dict: The same deck without the "edit_code_hash" field.
    """
    public_deck = dict(deck)  # copy, so the original deck is not changed
    public_deck.pop("edit_code_hash", None)
    return public_deck


def make_deck_summary(deck):
    """
    Make a short version of a deck for the search results list.

    Parameters:
        deck (dict): A deck from decks.json.

    Returns:
        dict: The deck's id, title, course, instructor, description, date,
              and how many cards it has (but not the cards themselves).
    """
    return {
        "id": deck["id"],
        "title": deck["title"],
        "course": deck["course"],
        "instructor": deck["instructor"],
        "description": deck["description"],
        "date": deck["date"],
        "card_count": len(deck["cards"]),
    }


def deck_matches_search(deck, search_text):
    """
    Check whether a deck matches what the cadet typed in the search box.

    Parameters:
        deck (dict): A deck from decks.json.
        search_text (str): The search words. An empty string matches every deck.

    Returns:
        bool: True if the search text appears in the deck's title, course,
              instructor, or description (upper/lower case does not matter).
    """
    search_text = search_text.strip().lower()
    if search_text == "":
        return True

    # Put all the searchable fields together into one lowercase string.
    searchable_text = " ".join([
        deck["title"],
        deck["course"],
        deck["instructor"],
        deck["description"],
    ]).lower()

    return search_text in searchable_text


def find_deck(decks, deck_id):
    """
    Find one deck in a list of decks by its id.

    Parameters:
        decks (list): All decks from decks.json.
        deck_id (int): The id of the deck to find.

    Returns:
        dict or None: The matching deck, or None if there is no such deck.
    """
    for deck in decks:
        if deck["id"] == deck_id:
            return deck
    return None


def get_next_deck_id(decks):
    """
    Pick the id for a new deck: one more than the biggest id in use.

    Parameters:
        decks (list): All decks from decks.json.

    Returns:
        int: The new id (1 if there are no decks yet).
    """
    biggest_id = 0
    for deck in decks:
        if deck["id"] > biggest_id:
            biggest_id = deck["id"]
    return biggest_id + 1


def clean_cards(cards):
    """
    Check the list of cards sent by the webpage and tidy it up.
    Rows where both the term and the definition are blank are skipped.

    Parameters:
        cards: The "cards" value from the request (it should be a list).

    Returns:
        (list, str or None): The cleaned list of cards, and an error message
                             (None if the cards are fine).
    """
    if not isinstance(cards, list):
        return [], "Cards must be a list."

    cleaned_cards = []
    for card in cards:
        if not isinstance(card, dict):
            return [], "Each card must have a term and a definition."

        term = str(card.get("term", "")).strip()
        definition = str(card.get("definition", "")).strip()

        # Skip completely empty rows (for example, an extra blank row in the form).
        if term == "" and definition == "":
            continue

        if term == "" or definition == "":
            return [], "Every card needs both a term and a definition."

        cleaned_cards.append({"term": term, "definition": definition})

    if len(cleaned_cards) == 0:
        return [], "A deck needs at least one card."

    return cleaned_cards, None


def clean_deck_input(data):
    """
    Check the deck details sent by the webpage (for creating or editing).

    Parameters:
        data (dict or None): The JSON body of the request.

    Returns:
        (dict, str or None): The cleaned deck fields (title, course, instructor,
                             description, cards), and an error message
                             (None if everything is fine).
    """
    if not isinstance(data, dict):
        return {}, "Request body must be JSON."

    title = str(data.get("title", "")).strip()
    course = str(data.get("course", "")).strip()
    instructor = str(data.get("instructor", "")).strip()
    description = str(data.get("description", "")).strip()

    if title == "":
        return {}, "Title is required."
    if course == "":
        return {}, "Course is required (for example, CY300)."

    cards, error = clean_cards(data.get("cards"))
    if error is not None:
        return {}, error

    cleaned_deck = {
        "title": title,
        "course": course.upper(),  # so "cy300" and "CY300" match
        "instructor": instructor,
        "description": description,
        "cards": cards,
    }
    return cleaned_deck, None


def hash_edit_code(edit_code):
    """
    Turn an edit code into a hash that is safe to save in the JSON file.

    Parameters:
        edit_code (str): The code the deck creator picked.

    Returns:
        str: The hashed code.
    """
    return generate_password_hash(edit_code)


def edit_code_is_correct(deck, edit_code):
    """
    Check whether an edit code matches the one saved for a deck.

    Parameters:
        deck (dict): A deck from decks.json.
        edit_code: The code sent by the webpage.

    Returns:
        bool: True if the code is correct.
    """
    if not isinstance(edit_code, str):
        return False
    return check_password_hash(deck["edit_code_hash"], edit_code)
