import sqlite3
from config import DATABASE
from flask import current_app


def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the database by creating the contacts, companies, and users tables if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # --- Migration for contacts table: Remove affiliated_company1 and affiliated_company2 ---
    cursor.execute("PRAGMA table_info(contacts)")
    existing_columns = [col[1] for col in cursor.fetchall()]

    if (
        "affiliated_company1" in existing_columns
        or "affiliated_company2" in existing_columns
    ):
        current_app.logger.info(
            "Migrating contacts table: Removing affiliated_company1 and affiliated_company2 columns."
        )
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS contacts_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    main_company TEXT,
                    job_title TEXT,
                    mobile_phone TEXT NOT NULL,
                    office_phone1 TEXT,
                    extension1 TEXT,
                    office_phone2 TEXT,
                    extension2 TEXT,
                    office_phone3 TEXT,
                    extension3 TEXT,
                    email TEXT,
                    office_manager_name1 TEXT,
                    office_manager_mobile1 TEXT,
                    office_manager_name2 TEXT,
                    office_manager_mobile2 TEXT,
                    office_manager_name3 TEXT,
                    office_manager_mobile3 TEXT,
                    office_email TEXT,
                    subject_category TEXT,
                    country TEXT,
                    address TEXT,
                    postal_code TEXT,
                    description TEXT
                )
            """
            )

            columns_to_copy_from_old = [
                "id",
                "full_name",
                "main_company",
                "job_title",
                "mobile_phone",
                "office_phone1",
                "extension1",
                "office_phone2",
                "extension2",
                "office_phone3",
                "extension3",
                "email",
                "office_manager_name1",
                "office_manager_mobile1",
                "office_manager_name2",
                "office_manager_mobile2",
                "office_manager_name3",
                "office_manager_mobile3",
                "office_email",
                "subject_category",
                "country",
                "address",
                "postal_code",
                "description",
            ]

            actual_columns_in_old_table = [
                col for col in columns_to_copy_from_old if col in existing_columns
            ]

            insert_cols_new = ", ".join(actual_columns_in_old_table)
            select_cols_old = ", ".join(actual_columns_in_old_table)

            cursor.execute(
                f"INSERT INTO contacts_new ({insert_cols_new}) SELECT {select_cols_old} FROM contacts"
            )
            cursor.execute("DROP TABLE contacts")
            cursor.execute("ALTER TABLE contacts_new RENAME TO contacts")
            current_app.logger.info("Contacts table migration complete.")
            conn.commit()
        except sqlite3.Error as e:
            current_app.logger.error(f"Error during contacts table migration: {e}")
            conn.rollback()
        finally:
            conn.close()
    else:
        current_app.logger.info(
            "Contacts table already in desired schema or no migration needed."
        )
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    main_company TEXT,
                    job_title TEXT,
                    mobile_phone TEXT NOT NULL,
                    office_phone1 TEXT,
                    extension1 TEXT,
                    office_phone2 TEXT,
                    extension2 TEXT,
                    office_phone3 TEXT,
                    extension3 TEXT,
                    email TEXT,
                    office_manager_name1 TEXT,
                    office_manager_mobile1 TEXT,
                    office_manager_name2 TEXT,
                    office_manager_mobile2 TEXT,
                    office_manager_name3 TEXT,
                    office_manager_mobile3 TEXT,
                    office_email TEXT,
                    subject_category TEXT,
                    country TEXT,
                    address TEXT,
                    postal_code TEXT,
                    description TEXT
                )
            """
            )
            conn.commit()
        except sqlite3.Error as e:
            current_app.logger.error(f"Error creating contacts table: {e}")
            conn.rollback()
        finally:
            conn.close()

    # Re-establish connection for other tables
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT NOT NULL UNIQUE,
                sub_company1 TEXT,
                sub_company2 TEXT
            )
        """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                is_admin INTEGER DEFAULT 0
            )
        """
        )
        conn.commit()
    except sqlite3.Error as e:
        current_app.logger.error(f"Error creating companies or users table: {e}")
        conn.rollback()
    finally:
        conn.close()
