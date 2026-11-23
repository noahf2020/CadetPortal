"""
starting_data.py

The data a brand-new database starts with. setup_database.py copies it into
any table that is still empty. After that, the database is the only place the
data lives; editing this file does NOT change a database that is already set up.

Not included on purpose:
  - Uniform of the Day: set it with  python update_uod.py "Class B"
  - Announcements: add them in the database (see the README).
"""

# Quick links, in the order they are shown.
STARTING_LINKS = [
    {
        "name": "Regulation Wizard",
        "description": "Search cadet regulations quickly.",
        "url": "https://regulationwizard.com/",
        "category": "Military",
    },
    {
        "name": "Citemate",
        "description": "Build citations for academic papers.",
        "url": "https://citemate.dev",
        "category": "Academics",
    },
    {
        "name": "Ferry Hours",
        "description": "Official ferry schedule between West Point and Garrison.",
        "url": "#",
        "category": "Life",
    },
    {
        "name": "Uniform of the Day",
        "description": "Check today's uniform.",
        "url": "#",
        "category": "Military",
    },
]

# The ferry schedule (saved whole, as one JSON value, in the schedules table).
STARTING_FERRY = {
    "note": "SAMPLE DATA - replace with the official ferry schedule.",
    "schedule": [
        {"day": "Weekdays", "departs": "West Point", "times": ["07:00", "08:00", "17:00", "18:00"]},
        {"day": "Weekdays", "departs": "Garrison", "times": ["07:30", "08:30", "17:30", "18:30"]},
    ],
}

# The shuttle schedule. "minutes" are minutes past the hour.
STARTING_SHUTTLE = {
    "hours": "Shuttles run from 7am to 6pm.",
    "note": "Times are minutes past the hour. Track both shuttles live in the TransLoc app.",
    "routes": [
        {
            "route": "Northbound",
            "stops": [
                {"stop": "Visitor's Center Parking Lot", "minutes": ["00", "30"]},
                {"stop": "Hotel Thayer", "minutes": ["02", "32"]},
                {"stop": "Buffalo Soldier Field Parking Lot", "minutes": ["03", "33"]},
                {"stop": "Thayer / Cullum Rd", "minutes": ["04", "34"]},
                {"stop": "Mahan Hall Tunnel", "minutes": ["05", "35"]},
                {"stop": "Library Corner", "minutes": ["06", "36"]},
                {"stop": "Rugar / Howard", "minutes": ["07", "37"]},
                {"stop": "Bldg 667-A", "minutes": ["08", "38"]},
                {"stop": "Bldg 681", "minutes": ["09", "39"]},
                {"stop": "Washington / Buckner Hill Rd (near K-Lot)", "minutes": ["11", "41"]},
                {"stop": "K-Lot (in front of Subway)", "minutes": ["12", "42"]},
                {"stop": "Keller Hospital Circle", "minutes": ["14", "44"]},
                {"stop": "Post Laundry", "minutes": ["15", "45"]},
                {"stop": "USMAPS", "minutes": ["16", "46"]},
                {"stop": "Child Development Center", "minutes": ["25", "55"]},
                {"stop": "PX / Commissary", "minutes": ["30", "00"]},
            ],
        },
        {
            "route": "Southbound",
            "stops": [
                {"stop": "PX / Commissary (starts in front of PX)", "minutes": ["00", "30"]},
                {"stop": "USMAPS", "minutes": ["14", "44"]},
                {"stop": "Post Laundry", "minutes": ["15", "45"]},
                {"stop": "Keller Hospital Circle", "minutes": ["16", "46"]},
                {"stop": "K-Lot (in front of Subway)", "minutes": ["18", "48"]},
                {"stop": "Washington / Buckner Hill Rd (near K-Lot)", "minutes": ["19", "49"]},
                {"stop": "Bldg 681", "minutes": ["20", "50"]},
                {"stop": "Bldg 667-A", "minutes": ["21", "51"]},
                {"stop": "Thayer Statue", "minutes": ["22", "52"]},
                {"stop": "Library Corner", "minutes": ["23", "53"]},
                {"stop": "Mahan Hall Tunnel", "minutes": ["24", "54"]},
                {"stop": "Thayer / Cullum Rd", "minutes": ["25", "55"]},
                {"stop": "Buffalo Soldier Field Parking Lot", "minutes": ["26", "56"]},
                {"stop": "Bldg 626 / 622 (Southbound only)", "minutes": ["27", "57"]},
                {"stop": "Thayer Gate", "minutes": ["27", "57"]},
                {"stop": "Visitor's Center Parking Lot by the Tank", "minutes": ["30", "00"]},
            ],
        },
    ],
}

# Example study decks, so a new setup has something to search and study.
# "edit_code_hash" is the hashed edit code (the plain code is never stored).
STARTING_DECKS = [
    {
        "id": 1,
        "title": "Military Ranks",
        "course": "MS100",
        "instructor": "CPT Smith",
        "description": "Army officer and enlisted rank abbreviations.",
        "edit_code_hash": "scrypt:32768:8:1$XFEth9pIlig5iBst$3143621c6d63d70a779f541b0705ab25c46f334fe5b4f3328b18c4978d74377af72fb429302d0ad844b82b03ebd071d74045817c5a3279f8454442ca6838d9f2",
        "date": "2026-10-06",
        "cards": [
            {"term": "2LT", "definition": "Second Lieutenant"},
            {"term": "1LT", "definition": "First Lieutenant"},
            {"term": "CPT", "definition": "Captain"},
            {"term": "MAJ", "definition": "Major"},
            {"term": "SFC", "definition": "Sergeant First Class"},
        ],
    },
    {
        "id": 2,
        "title": "Networking Basics",
        "course": "CY300",
        "instructor": "MAJ Jones",
        "description": "Key terms from the first networking block.",
        "edit_code_hash": "scrypt:32768:8:1$XFEth9pIlig5iBst$3143621c6d63d70a779f541b0705ab25c46f334fe5b4f3328b18c4978d74377af72fb429302d0ad844b82b03ebd071d74045817c5a3279f8454442ca6838d9f2",
        "date": "2026-10-06",
        "cards": [
            {"term": "IP address", "definition": "A number that identifies a device on a network."},
            {"term": "DNS", "definition": "The system that turns names like westpoint.edu into IP addresses."},
            {"term": "HTTP", "definition": "The protocol web browsers use to request web pages."},
            {"term": "Port", "definition": "A number that identifies a specific program or service on a device."},
        ],
    },
]
