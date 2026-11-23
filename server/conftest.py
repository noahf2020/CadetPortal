"""
conftest.py

Shared setup for the server's tests (pytest reads this file automatically).
Run the tests from the "server" folder with:  python -m pytest

The route tests need a real MySQL database. To keep the real data safe, they
use a SEPARATE test database (TEST_DB_NAME in server/.env, default
"cadet_portal_test") on the same server, and empty its deck tables before
every test. If no database is set up (no DB_HOST), those tests are skipped.
"""

import os

import pytest

import db
from setup_database import create_tables


@pytest.fixture(scope="session")
def test_database():
    """
    Point the app at the test database and create its tables.
    Runs once for the whole test run (scope="session").
    """
    if os.environ.get("DB_HOST", "") == "":
        pytest.skip("No database set up (DB_HOST is empty in server/.env), so the route tests were skipped.")

    test_database_name = os.environ.get("TEST_DB_NAME", "cadet_portal_test")
    real_database_name = os.environ.get("DB_NAME", "cadet_portal")
    if test_database_name == real_database_name:
        pytest.exit("TEST_DB_NAME must be different from DB_NAME, so tests can't erase real data.")

    # Create the test database, then make every connection use it.
    connection = db.get_connection(use_database=False)
    try:
        with connection.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS `" + test_database_name + "`")
        connection.commit()
    finally:
        connection.close()
    os.environ["DB_NAME"] = test_database_name

    connection = db.get_connection()
    try:
        create_tables(connection)
    finally:
        connection.close()

    yield  # the tests run here

    # Put the real database name back when the tests are done.
    os.environ["DB_NAME"] = real_database_name


@pytest.fixture
def client(test_database):
    """
    Make a test client with no decks in the test database.

    Returns:
        A Flask test client. Use it like client.get("/api/decks").
    """
    # Start each test with empty deck tables.
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM cards")
            cursor.execute("DELETE FROM decks")
        connection.commit()
    finally:
        connection.close()

    # Imported here so the app is only loaded when a database is available.
    from app import app

    return app.test_client()
