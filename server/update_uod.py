"""
update_uod.py

The manual way to update the Uniform of the Day (UOD) on the portal.
Run it from the server folder:

    python update_uod.py "Class B"
    python update_uod.py "ACUs" "Bring a fleece; rain expected after 1500."

The UOD is saved with today's date. The portal shows that date as
"Last updated", and warns cadets when it isn't today.

Run it with no words after it to see the current UOD:

    python update_uod.py

It uses the database in server/.env (DB_NAME), which is the same one the
live site reads, so the change shows up on the portal right away.
"""

import sys

from storage import load_uod, save_uod

# The longest uniform text the database accepts (see setup_database.py).
MAX_UNIFORM_LENGTH = 200


def show_current_uod():
    """Print the UOD that the portal is showing right now."""
    uod = load_uod()
    if uod is None:
        print("No Uniform of the Day is set yet.")
        return
    print("Current UOD:", uod["uniform"])
    print("Last updated:", uod["date"])
    if uod["notes"]:
        print("Notes:", uod["notes"])


def main():
    """Read the uniform (and optional notes) from the command line and save them."""
    # sys.argv is the list of words typed after "python":
    #   sys.argv[0] = "update_uod.py", sys.argv[1] = uniform, sys.argv[2] = notes
    if len(sys.argv) < 2:
        show_current_uod()
        print()
        print('To change it:  python update_uod.py "Class B" "Optional notes"')
        return

    uniform = sys.argv[1].strip()
    notes = ""
    if len(sys.argv) >= 3:
        notes = sys.argv[2].strip()

    if uniform == "":
        print("The uniform can't be empty.")
        sys.exit(1)
    if len(uniform) > MAX_UNIFORM_LENGTH:
        print("The uniform must be " + str(MAX_UNIFORM_LENGTH) + " characters or less.")
        sys.exit(1)

    save_uod(uniform, notes)
    print("Saved! The portal now shows:")
    show_current_uod()


# Only run when this file is run directly (python update_uod.py ...).
if __name__ == "__main__":
    main()
