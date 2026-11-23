"""
decks.py

Helper functions for the study decks (the portal's Quizlet).
The routes in app.py use these to check and clean up what the webpage sends,
and to handle edit codes. Saving and loading decks is in storage.py.

The edit code is never saved as plain text. Only a "hash" of it is saved
(a scrambled version that can be checked but not turned back into the code).
"""

from werkzeug.security import check_password_hash, generate_password_hash

# The shortest edit code we accept.
MIN_EDIT_CODE_LENGTH = 4

# The longest text we accept for each field. These match the column sizes in
# setup_database.py, so the database never gets text that is too long.
MAX_TITLE_LENGTH = 200
MAX_COURSE_LENGTH = 50
MAX_INSTRUCTOR_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 1000
MAX_CARD_TEXT_LENGTH = 1000
MAX_CARDS = 500


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

        if len(term) > MAX_CARD_TEXT_LENGTH or len(definition) > MAX_CARD_TEXT_LENGTH:
            message = "Each term and definition must be " + str(MAX_CARD_TEXT_LENGTH) + " characters or less."
            return [], message

        cleaned_cards.append({"term": term, "definition": definition})

    if len(cleaned_cards) == 0:
        return [], "A deck needs at least one card."

    if len(cleaned_cards) > MAX_CARDS:
        return [], "A deck can have at most " + str(MAX_CARDS) + " cards."

    return cleaned_cards, None


def check_length(value, max_length, field_name):
    """
    Check that a piece of text is not too long.

    Parameters:
        value (str): The text to check.
        max_length (int): The most characters allowed.
        field_name (str): The field's name for the error message, e.g. "Title".

    Returns:
        str or None: An error message, or None if the text is short enough.
    """
    if len(value) > max_length:
        return field_name + " must be " + str(max_length) + " characters or less."
    return None


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

    # Check each field's length. The first error found is returned.
    length_checks = [
        check_length(title, MAX_TITLE_LENGTH, "Title"),
        check_length(course, MAX_COURSE_LENGTH, "Class"),
        check_length(instructor, MAX_INSTRUCTOR_LENGTH, "Instructor"),
        check_length(description, MAX_DESCRIPTION_LENGTH, "Description"),
    ]
    for error in length_checks:
        if error is not None:
            return {}, error

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
    Turn an edit code into a hash that is safe to save in the database.

    Parameters:
        edit_code (str): The code the deck creator picked.

    Returns:
        str: The hashed code.
    """
    return generate_password_hash(edit_code)


def edit_code_is_correct(edit_code_hash, edit_code):
    """
    Check whether an edit code matches the one saved for a deck.

    Parameters:
        edit_code_hash (str): The deck's saved hash (from storage.load_edit_code_hash).
        edit_code: The code sent by the webpage.

    Returns:
        bool: True if the code is correct.
    """
    if not isinstance(edit_code, str):
        return False
    return check_password_hash(edit_code_hash, edit_code)
