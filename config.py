import logging

# Database configuration
DATABASE = "phonebook.db"

# Flask configuration
SECRET_KEY = "your_super_secret_key_here_replace_me"


# Logging configuration
def setup_logging():
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )
