"""
test_decks.py

Tests for the helper functions in decks.py.
These call the functions directly, with no server or database involved,
so they always run (even without a database set up).
"""

from decks import (
    MAX_CARDS,
    clean_cards,
    clean_deck_input,
    edit_code_is_correct,
    hash_edit_code,
)


def make_deck_data():
    """Return deck details that pass every check."""
    return {
        "title": " Ranks ",
        "course": "ms100",
        "instructor": "",
        "description": "",
        "cards": [{"term": "SPC", "definition": "Specialist"}],
    }


# ---------- clean_cards ----------
# In some tests the first result is named "_", which means "not needed here".


def test_clean_cards_trims_spaces():
    cards, error = clean_cards([{"term": "  SPC ", "definition": " Specialist  "}])
    assert error is None
    assert cards == [{"term": "SPC", "definition": "Specialist"}]


def test_clean_cards_skips_blank_rows():
    cards, error = clean_cards([
        {"term": "SPC", "definition": "Specialist"},
        {"term": "", "definition": "   "},
    ])
    assert error is None
    assert len(cards) == 1


def test_clean_cards_needs_term_and_definition():
    _, error = clean_cards([{"term": "SPC", "definition": ""}])
    assert error == "Every card needs both a term and a definition."


def test_clean_cards_needs_at_least_one_card():
    _, error = clean_cards([{"term": "", "definition": ""}])
    assert error == "A deck needs at least one card."


def test_clean_cards_must_be_a_list():
    _, error = clean_cards("not a list")
    assert error == "Cards must be a list."


def test_clean_cards_rejects_too_long_text():
    _, error = clean_cards([{"term": "SPC", "definition": "x" * 1001}])
    assert error is not None


def test_clean_cards_rejects_too_many_cards():
    too_many = []
    for number in range(MAX_CARDS + 1):
        too_many.append({"term": "Term " + str(number), "definition": "Definition"})
    _, error = clean_cards(too_many)
    assert error == "A deck can have at most " + str(MAX_CARDS) + " cards."


# ---------- clean_deck_input ----------


def test_clean_deck_input_accepts_a_good_deck():
    deck, error = clean_deck_input(make_deck_data())
    assert error is None
    assert deck["title"] == "Ranks"
    assert deck["course"] == "MS100"  # course is changed to upper case


def test_clean_deck_input_needs_a_title():
    data = make_deck_data()
    data["title"] = ""
    _, error = clean_deck_input(data)
    assert error == "Title is required."


def test_clean_deck_input_needs_a_course():
    data = make_deck_data()
    data["course"] = " "
    _, error = clean_deck_input(data)
    assert error == "Course is required (for example, CY300)."


def test_clean_deck_input_rejects_too_long_title():
    data = make_deck_data()
    data["title"] = "x" * 201
    _, error = clean_deck_input(data)
    assert error == "Title must be 200 characters or less."


def test_clean_deck_input_rejects_too_long_course():
    data = make_deck_data()
    data["course"] = "x" * 51
    _, error = clean_deck_input(data)
    assert error == "Class must be 50 characters or less."


def test_clean_deck_input_needs_json():
    _, error = clean_deck_input(None)
    assert error == "Request body must be JSON."


# ---------- edit codes ----------


def test_edit_code_is_not_saved_as_plain_text():
    assert hash_edit_code("secret123") != "secret123"


def test_correct_edit_code_is_accepted():
    assert edit_code_is_correct(hash_edit_code("secret123"), "secret123") is True


def test_wrong_edit_code_is_rejected():
    assert edit_code_is_correct(hash_edit_code("secret123"), "wrong") is False


def test_missing_edit_code_is_rejected():
    assert edit_code_is_correct(hash_edit_code("secret123"), None) is False
