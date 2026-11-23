"""
db.py

Connects to the MySQL database (TiDB Cloud) and runs simple queries.
storage.py uses these helpers; routes in app.py never talk to the database directly.

The connection details come from environment variables, so passwords are
never written in the code:
    DB_HOST      e.g. gateway01.us-east-1.prod.aws.tidbcloud.com
    DB_PORT      e.g. 4000 (TiDB's port; normal MySQL uses 3306)
    DB_USER      e.g. 2abc123.root
    DB_PASSWORD  the database password
    DB_NAME      e.g. cadet_portal
    DB_SSL       "true" (default, TiDB Cloud needs it) or "false" for a local MySQL

On your computer, put them in server/.env (copy .env.example).
On Vercel, add them under Project Settings -> Environment Variables.
"""

import os

import certifi
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

# Read server/.env if it exists (on your computer). On Vercel there is no .env
# file; the variables come from the project settings instead.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def get_connection(use_database=True):
    """
    Open a new connection to the database.

    Parameters:
        use_database (bool): True to connect to DB_NAME. False to connect to
                             the server without picking a database (used by
                             setup_database.py to create the database first).

    Returns:
        A PyMySQL connection. Rows come back as dicts, e.g. {"id": 1, "title": "..."}.
        Close it with connection.close() when done.
    """
    host = os.environ.get("DB_HOST", "")
    if host == "":
        raise RuntimeError("DB_HOST is not set. Copy server/.env.example to server/.env and fill it in.")

    settings = {
        "host": host,
        "port": int(os.environ.get("DB_PORT", "4000")),
        "user": os.environ.get("DB_USER", ""),
        "password": os.environ.get("DB_PASSWORD", ""),
        "charset": "utf8mb4",  # supports every character, including emoji
        "cursorclass": pymysql.cursors.DictCursor,  # rows as dicts instead of tuples
    }
    if use_database:
        settings["database"] = os.environ.get("DB_NAME", "cadet_portal")

    # TiDB Cloud only accepts encrypted (SSL) connections. certifi provides the
    # list of trusted certificates used to check that the server is real.
    if os.environ.get("DB_SSL", "true").lower() == "true":
        settings["ssl_ca"] = certifi.where()
        settings["ssl_verify_cert"] = True
        settings["ssl_verify_identity"] = True

    return pymysql.connect(**settings)


def fetch_all(sql, params=()):
    """
    Run a SELECT query and return every row.

    Parameters:
        sql (str): The query, with %s where each value goes,
                   e.g. "SELECT * FROM cards WHERE deck_id = %s".
        params (tuple): The values for the %s spots. PyMySQL escapes them,
                        which keeps the query safe from SQL injection.

    Returns:
        list: The rows, each a dict.
    """
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            # list() because PyMySQL gives back a tuple, (), when there are no rows.
            return list(cursor.fetchall())
    finally:
        connection.close()  # always close, even if the query fails


def fetch_one(sql, params=()):
    """
    Run a SELECT query and return only the first row.

    Parameters:
        sql (str): The query (see fetch_all).
        params (tuple): The values for the %s spots.

    Returns:
        dict or None: The first row, or None if there are no rows.
    """
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchone()
    finally:
        connection.close()
