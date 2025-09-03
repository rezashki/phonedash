from flask import Blueprint, request, jsonify, current_app
from auth import login_required
from database import get_db_connection
import sqlite3
import pandas as pd

contacts_routes = Blueprint("contacts_routes", __name__)


@contacts_routes.route("/contacts", methods=["GET", "POST"])
@login_required
def handle_contacts():
    """Handles GET requests to retrieve all contacts and POST requests to add a new contact."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        try:
            contact_data = request.json
            # Extract data from the request, using .get() for optional fields
            full_name = contact_data.get("fullName")
            main_company = contact_data.get("mainCompany")
            job_title = contact_data.get("jobTitle")
            mobile_phone = contact_data.get("mobilePhone")
            office_phone1 = contact_data.get("officePhone1")
            extension1 = contact_data.get("extension1")
            office_phone2 = contact_data.get("officePhone2")
            extension2 = contact_data.get("extension2")
            office_phone3 = contact_data.get("officePhone3")
            extension3 = contact_data.get("extension3")
            email = contact_data.get("email")
            office_manager_name1 = contact_data.get("officeManagerName1")
            office_manager_mobile1 = contact_data.get("officeManagerMobile1")
            office_manager_name2 = contact_data.get("officeManagerName2")
            office_manager_mobile2 = contact_data.get("officeManagerMobile2")
            office_manager_name3 = contact_data.get("officeManagerName3")
            office_manager_mobile3 = contact_data.get("officeManagerMobile3")
            office_email = contact_data.get("officeEmail")
            subject_category = contact_data.get("subjectCategory")
            country = contact_data.get("country")
            address = contact_data.get("address")
            postal_code = contact_data.get("postalCode")
            description = contact_data.get("description")

            # Basic validation for required fields
            if not full_name:
                current_app.logger.warning("Contact add failed: Full name is required.")
                return jsonify({"error": "Full name is required"}), 400

            cursor.execute(
                """
                INSERT INTO contacts (
                    full_name, main_company, job_title, mobile_phone,
                    office_phone1, extension1, office_phone2, extension2, office_phone3, extension3,
                    email, office_manager_name1, office_manager_mobile1, office_manager_name2,
                    office_manager_mobile2, office_manager_name3, office_manager_mobile3,
                    office_email, subject_category, country, address, postal_code, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    full_name,
                    main_company,
                    job_title,
                    mobile_phone,
                    office_phone1,
                    extension1,
                    office_phone2,
                    extension2,
                    office_phone3,
                    extension3,
                    email,
                    office_manager_name1,
                    office_manager_mobile1,
                    office_manager_name2,
                    office_manager_mobile2,
                    office_manager_name3,
                    office_manager_mobile3,
                    office_email,
                    subject_category,
                    country,
                    address,
                    postal_code,
                    description,
                ),
            )
            conn.commit()
            current_app.logger.info(f"Contact '{full_name}' added successfully.")
            return (
                jsonify(
                    {"message": "Contact added successfully", "id": cursor.lastrowid}
                ),
                201,
            )
        except Exception as e:
            conn.rollback()
            current_app.logger.error(f"Error adding contact: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "GET":
        try:
            cursor.execute("SELECT * FROM contacts")
            contacts = cursor.fetchall()
            contacts_list = [dict(contact) for contact in contacts]
            current_app.logger.info("Fetched all contacts.")
            return jsonify(contacts_list), 200
        except Exception as e:
            current_app.logger.error(f"Error fetching all contacts: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()


@contacts_routes.route("/contacts/<int:contact_id>", methods=["GET", "PUT", "DELETE"])
@login_required
def handle_single_contact(contact_id):
    """Handles GET, PUT, and DELETE requests for a specific contact."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "GET":
        try:
            cursor.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,))
            contact = cursor.fetchone()
            if contact:
                current_app.logger.info(f"Fetched contact with ID {contact_id}.")
                return jsonify(dict(contact)), 200
            else:
                current_app.logger.warning(f"Contact with ID {contact_id} not found.")
                return jsonify({"error": "Contact not found"}), 404
        except Exception as e:
            current_app.logger.error(
                f"Error fetching contact {contact_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "PUT":
        try:
            contact_data = request.json
            full_name = contact_data.get("fullName")
            main_company = contact_data.get("mainCompany")
            job_title = contact_data.get("jobTitle")
            mobile_phone = contact_data.get("mobilePhone")
            office_phone1 = contact_data.get("officePhone1")
            extension1 = contact_data.get("extension1")
            office_phone2 = contact_data.get("officePhone2")
            extension2 = contact_data.get("extension2")
            office_phone3 = contact_data.get("officePhone3")
            extension3 = contact_data.get("extension3")
            email = contact_data.get("email")
            office_manager_name1 = contact_data.get("officeManagerName1")
            office_manager_mobile1 = contact_data.get("officeManagerMobile1")
            office_manager_name2 = contact_data.get("officeManagerName2")
            office_manager_mobile2 = contact_data.get("officeManagerMobile2")
            office_manager_name3 = contact_data.get("officeManagerName3")
            office_manager_mobile3 = contact_data.get("officeManagerMobile3")
            office_email = contact_data.get("officeEmail")
            subject_category = contact_data.get("subjectCategory")
            country = contact_data.get("country")
            address = contact_data.get("address")
            postal_code = contact_data.get("postalCode")
            description = contact_data.get("description")

            # Check if contact exists
            cursor.execute("SELECT id FROM contacts WHERE id = ?", (contact_id,))
            if not cursor.fetchone():
                current_app.logger.warning(
                    f"Update failed: Contact with ID {contact_id} not found."
                )
                return jsonify({"error": "Contact not found"}), 404

            cursor.execute(
                """
                UPDATE contacts SET
                    full_name = ?, main_company = ?, job_title = ?, mobile_phone = ?,
                    office_phone1 = ?, extension1 = ?, office_phone2 = ?, extension2 = ?, office_phone3 = ?, extension3 = ?,
                    email = ?, office_manager_name1 = ?, office_manager_mobile1 = ?, office_manager_name2 = ?,
                    office_manager_mobile2 = ?, office_manager_name3 = ?, office_manager_mobile3 = ?,
                    office_email = ?, subject_category = ?, country = ?, address = ?, postal_code = ?, description = ?
                WHERE id = ?
            """,
                (
                    full_name,
                    main_company,
                    job_title,
                    mobile_phone,
                    office_phone1,
                    extension1,
                    office_phone2,
                    extension2,
                    office_phone3,
                    extension3,
                    email,
                    office_manager_name1,
                    office_manager_mobile1,
                    office_manager_name2,
                    office_manager_mobile2,
                    office_manager_name3,
                    office_manager_mobile3,
                    office_email,
                    subject_category,
                    country,
                    address,
                    postal_code,
                    description,
                    contact_id,
                ),
            )
            conn.commit()
            current_app.logger.info(
                f"Contact with ID {contact_id} updated successfully."
            )
            return jsonify({"message": "Contact updated successfully"}), 200
        except Exception as e:
            conn.rollback()
            current_app.logger.error(
                f"Error updating contact {contact_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "DELETE":
        try:
            # Check if contact exists
            cursor.execute("SELECT id FROM contacts WHERE id = ?", (contact_id,))
            if not cursor.fetchone():
                current_app.logger.warning(
                    f"Delete failed: Contact with ID {contact_id} not found."
                )
                return jsonify({"error": "Contact not found"}), 404

            cursor.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
            conn.commit()
            current_app.logger.info(
                f"Contact with ID {contact_id} deleted successfully."
            )
            return jsonify({"message": "Contact deleted successfully"}), 200
        except Exception as e:
            conn.rollback()
            current_app.logger.error(
                f"Error deleting contact {contact_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()


@contacts_routes.route("/contacts/search", methods=["GET"])
@login_required
def search_contacts():
    """Search contacts with pagination, sorting, and filtering."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get query parameters
        term = request.args.get("term", "").strip()
        offset = int(request.args.get("offset", 0))
        limit = int(request.args.get("limit", 50))
        sort_by = request.args.get("sort_by", "").strip()
        sort_direction = request.args.get("sort_direction", "asc").strip()
        export_all = request.args.get("export_all", "false").lower() == "true"

        # Build the base query
        base_query = """
            SELECT * FROM contacts
        """

        # Add search conditions if term is provided
        where_clause = ""
        params = []
        if term:
            where_clause = """
                WHERE (full_name LIKE ? OR main_company LIKE ? OR job_title LIKE ? OR 
                       mobile_phone LIKE ? OR office_phone1 LIKE ? OR office_phone2 LIKE ? OR office_phone3 LIKE ? OR
                       email LIKE ? OR office_email LIKE ? OR subject_category LIKE ? OR 
                       country LIKE ? OR address LIKE ? OR description LIKE ?)
            """
            search_term = f"%{term}%"
            params = [search_term] * 13  # 13 fields being searched

        # Add sorting
        order_clause = ""
        valid_columns = [
            "id",
            "full_name",
            "main_company",
            "job_title",
            "mobile_phone",
            "office_phone1",
            "office_phone2",
            "office_phone3",
            "email",
            "office_email",
            "subject_category",
            "country",
            "address",
            "description",
        ]
        if sort_by in valid_columns:
            direction = "DESC" if sort_direction.lower() == "desc" else "ASC"
            order_clause = f" ORDER BY {sort_by} {direction}"

        # For export, don't apply pagination
        if export_all:
            query = base_query + where_clause + order_clause
            cursor.execute(query, params)
            contacts = cursor.fetchall()
            contacts_list = [dict(contact) for contact in contacts]
            total_count = len(contacts_list)
        else:
            # Apply pagination
            limit_clause = f" LIMIT {limit} OFFSET {offset}"
            query = base_query + where_clause + order_clause + limit_clause
            cursor.execute(query, params)
            contacts = cursor.fetchall()
            contacts_list = [dict(contact) for contact in contacts]

            # Get total count for pagination info
            count_query = f"SELECT COUNT(*) FROM contacts{where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

        current_app.logger.info(
            f"Search completed. Term: '{term}', Results: {len(contacts_list)}, Total: {total_count}"
        )

        return (
            jsonify(
                {
                    "contacts": contacts_list,
                    "total_count": total_count,
                    "offset": offset,
                    "limit": limit,
                }
            ),
            200,
        )

    except Exception as e:
        current_app.logger.error(f"Error searching contacts: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@contacts_routes.route("/contacts/import", methods=["POST"])
@login_required
def import_contacts():
    """Import contacts from Excel file."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not file.filename.lower().endswith((".xlsx", ".xls")):
            return jsonify({"error": "Only Excel files (.xlsx, .xls) are allowed"}), 400

        # Read Excel file
        try:
            df = pd.read_excel(file)
        except Exception as e:
            current_app.logger.error(f"Error reading Excel file: {e}")
            return jsonify({"error": "Invalid Excel file format"}), 400

        # Define expected columns and their mappings
        column_mapping = {
            "نام کامل": "full_name",
            "شرکت اصلی": "main_company",
            "سمت": "job_title",
            "موبایل": "mobile_phone",
            "تلفن دفتر 1": "office_phone1",
            "داخلی 1": "extension1",
            "تلفن دفتر 2": "office_phone2",
            "داخلی 2": "extension2",
            "تلفن دفتر 3": "office_phone3",
            "داخلی 3": "extension3",
            "ایمیل شخصی": "email",
            "نام مدیر دفتر 1": "office_manager_name1",
            "موبایل مدیر دفتر 1": "office_manager_mobile1",
            "نام مدیر دفتر 2": "office_manager_name2",
            "موبایل مدیر دفتر 2": "office_manager_mobile2",
            "نام مدیر دفتر 3": "office_manager_name3",
            "موبایل مدیر دفتر 3": "office_manager_mobile3",
            "ایمیل دفتر": "office_email",
            "دسته بندی موضوعی": "subject_category",
            "کشور": "country",
            "آدرس": "address",
            "کد پستی": "postal_code",
            "توضیحات": "description",
        }

        # Check required columns
        if "نام کامل" not in df.columns:
            return (
                jsonify({"error": "Required column 'نام کامل' (Full Name) not found"}),
                400,
            )

        conn = get_db_connection()
        cursor = conn.cursor()

        imported_count = 0
        errors = []

        try:
            for index, row in df.iterrows():
                try:
                    # Extract data with defaults for missing values
                    contact_data = {}
                    for persian_col, english_col in column_mapping.items():
                        value = row.get(persian_col, "")
                        # Convert NaN to empty string
                        if pd.isna(value):
                            value = ""
                        contact_data[english_col] = str(value).strip()

                    # Skip rows without full name
                    if not contact_data["full_name"]:
                        continue

                    # Insert contact
                    cursor.execute(
                        """
                        INSERT INTO contacts (
                            full_name, main_company, job_title, mobile_phone,
                            office_phone1, extension1, office_phone2, extension2, office_phone3, extension3,
                            email, office_manager_name1, office_manager_mobile1, office_manager_name2,
                            office_manager_mobile2, office_manager_name3, office_manager_mobile3,
                            office_email, subject_category, country, address, postal_code, description
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                        (
                            contact_data["full_name"],
                            contact_data["main_company"],
                            contact_data["job_title"],
                            contact_data["mobile_phone"],
                            contact_data["office_phone1"],
                            contact_data["extension1"],
                            contact_data["office_phone2"],
                            contact_data["extension2"],
                            contact_data["office_phone3"],
                            contact_data["extension3"],
                            contact_data["email"],
                            contact_data["office_manager_name1"],
                            contact_data["office_manager_mobile1"],
                            contact_data["office_manager_name2"],
                            contact_data["office_manager_mobile2"],
                            contact_data["office_manager_name3"],
                            contact_data["office_manager_mobile3"],
                            contact_data["office_email"],
                            contact_data["subject_category"],
                            contact_data["country"],
                            contact_data["address"],
                            contact_data["postal_code"],
                            contact_data["description"],
                        ),
                    )
                    imported_count += 1

                except Exception as row_error:
                    errors.append(f"Row {index + 2}: {str(row_error)}")
                    continue

            conn.commit()
            current_app.logger.info(f"Successfully imported {imported_count} contacts")

            response_data = {
                "message": f"Successfully imported {imported_count} contacts",
                "imported_count": imported_count,
            }

            if errors:
                response_data["errors"] = errors[:10]  # Limit error messages
                response_data["error_count"] = len(errors)

            return jsonify(response_data), 200

        except Exception as e:
            conn.rollback()
            current_app.logger.error(f"Error during import: {e}", exc_info=True)
            return jsonify({"error": f"Import failed: {str(e)}"}), 500
        finally:
            conn.close()

    except Exception as e:
        current_app.logger.error(f"Error in import_contacts: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
