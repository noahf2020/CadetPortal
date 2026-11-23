"""
test_decks.py

Tests for the helper functions in decks.py.
These call the functions directly, with no server or files involved.
"""

from decks import (
    clean_cards,
    clean_deck_input,
    deck_matches_search,
    edit_code_is_correct,
    find_deck,
    get_next_deck_id,
    hash_edit_code,
    make_public_deck,
)


def make_sample_deck():
    """Return a small deck to use in the tests."""
    return {
        "id": 1,
        "title": "Military Ranks",
        "course": "MS100",
        "instructor": "CPT Smith",
        "description": "Army rank abbreviations.",
        "cards": [
            {"term": "SPC", "definition": "Specialist"},
            {"term": "SGT", "definition": "Sergeant"},
        ],
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


# ---------- clean_deck_input ----------


def test_clean_deck_input_accepts_a_good_deck():
    data = {
        "title": " Ranks ",
        "course": "ms100",
        "instructor": "",
        "description": "",
        "cards": [{"term": "SPC", "definition": "Specialist"}],
    }
    deck, error = clean_deck_input(data)
    assert error is None
    assert deck["title"] == "Ranks"
    assert deck["course"] == "MS100"  # course is changed to upper case


def test_clean_deck_input_needs_a_title():
    _, error = clean_deck_input({"title": "", "course": "CY300", "cards": []})
    assert error == "Title is required."


def test_clean_deck_input_needs_a_course():
    _, error = clean_deck_input({"title": "Ranks", "course": " ", "cards": []})
    assert error == "Course is required (for example, CY300)."


def test_clean_deck_input_needs_json():
    _, error = clean_deck_input(None)
    assert error == "Request body must be JSON."


# ---------- deck_matches_search ----------


def test_empty_search_matches_everything():
    assert deck_matches_search(make_sample_deck(), "") is True


def test_search_matches_course_in_any_case():
    assert deck_matches_search(make_sample_deck(), "ms100") is True


def test_search_matches_instructor():
    assert deck_matches_search(make_sample_deck(), "cpt smith") is True


def test_search_matches_card_text():
    assert deck_matches_search(make_sample_deck(), "sergeant") is True


def test_search_with_no_match():
    assert deck_matches_search(make_sample_deck(), "calculus") is False


# ---------- find_deck and get_next_deck_id ----------


def test_find_deck_finds_by_id():
    decks = [{"id": 1}, {"id": 5}]
    assert find_deck(decks, 5) == {"id": 5}


def test_find_deck_returns_none_when_missing():
    assert find_deck([{"id": 1}], 99) is None


def test_next_id_is_one_more_than_biggest():
    assert get_next_deck_id([{"id": 1}, {"id": 7}, {"id": 3}]) == 8


def test_next_id_starts_at_one():
    assert get_next_deck_id([]) == 1


# ---------- edit codes ----------


def test_edit_code_is_not_saved_as_plain_text():
    assert hash_edit_code("secret123") != "secret123"


def test_correct_edit_code_is_accepted():
    deck = {"edit_code_hash": hash_edit_code("secret123")}
    assert edit_code_is_correct(deck, "secret123") is True


def test_wrong_edit_code_is_rejected():
    deck = {"edit_code_hash": hash_edit_code("secret123")}
    assert edit_code_is_correct(deck, "wrong") is False


def test_missing_edit_code_is_rejected():
    deck = {"edit_code_hash": hash_edit_code("secret123")}
    assert edit_code_is_correct(deck, None) is False


def test_public_deck_hides_the_edit_code():
    deck = make_sample_deck()
    deck["edit_code_hash"] = "scrypt:abc"
    public_deck = make_public_deck(deck)
    assert "edit_code_hash" not in public_deck
    assert "edit_code_hash" in deck  # the original deck is not changed
