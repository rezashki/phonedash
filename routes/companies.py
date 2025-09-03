from flask import Blueprint, request, jsonify, current_app
from auth import login_required
from database import get_db_connection
import sqlite3

companies_routes = Blueprint("companies_routes", __name__)


@companies_routes.route("/companies", methods=["GET", "POST"])
@login_required
def handle_companies():
    """Handles GET requests to retrieve all companies and POST requests to add a new company."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        try:
            company_data = request.json
            company_name = company_data.get("companyName")
            sub_company1 = company_data.get("subCompany1")
            sub_company2 = company_data.get("subCompany2")

            if not company_name:
                current_app.logger.warning(
                    "Company add failed: Company name is required."
                )
                return jsonify({"error": "Company name is required"}), 400

            cursor.execute(
                "SELECT id FROM companies WHERE company_name = ?", (company_name,)
            )
            if cursor.fetchone():
                current_app.logger.warning(
                    f"Company add failed: Company '{company_name}' already exists."
                )
                return jsonify({"error": "Company already exists"}), 409

            cursor.execute(
                "INSERT INTO companies (company_name, sub_company1, sub_company2) VALUES (?, ?, ?)",
                (company_name, sub_company1, sub_company2),
            )
            conn.commit()
            current_app.logger.info(f"Company '{company_name}' added successfully.")
            return (
                jsonify(
                    {"message": "Company added successfully", "id": cursor.lastrowid}
                ),
                201,
            )
        except Exception as e:
            conn.rollback()
            current_app.logger.error(f"Error adding company: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "GET":
        try:
            cursor.execute("SELECT * FROM companies")
            companies = cursor.fetchall()
            companies_list = [dict(company) for company in companies]
            current_app.logger.info("Fetched all companies.")
            return jsonify(companies_list), 200
        except Exception as e:
            current_app.logger.error(
                f"Error fetching all companies: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()


@companies_routes.route("/companies/unique_from_contacts", methods=["GET"])
@login_required
def get_unique_companies_from_contacts():
    """Get unique company names from contacts table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT DISTINCT main_company FROM contacts WHERE main_company IS NOT NULL AND main_company != '' ORDER BY main_company"
        )
        companies = cursor.fetchall()
        companies_list = [company["main_company"] for company in companies]
        current_app.logger.info("Fetched unique companies from contacts.")
        return jsonify(companies_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching unique companies: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@companies_routes.route("/companies/<int:company_id>", methods=["GET", "PUT", "DELETE"])
@login_required
def handle_single_company(company_id):
    """Handles GET, PUT, and DELETE requests for a specific company."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "GET":
        try:
            cursor.execute("SELECT * FROM companies WHERE id = ?", (company_id,))
            company = cursor.fetchone()
            if company:
                current_app.logger.info(f"Fetched company with ID {company_id}.")
                return jsonify(dict(company)), 200
            else:
                current_app.logger.warning(f"Company with ID {company_id} not found.")
                return jsonify({"error": "Company not found"}), 404
        except Exception as e:
            current_app.logger.error(
                f"Error fetching company {company_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "PUT":
        try:
            company_data = request.json
            company_name = company_data.get("companyName")
            sub_company1 = company_data.get("subCompany1")
            sub_company2 = company_data.get("subCompany2")

            # Check if company exists
            cursor.execute("SELECT id FROM companies WHERE id = ?", (company_id,))
            if not cursor.fetchone():
                current_app.logger.warning(
                    f"Update failed: Company with ID {company_id} not found."
                )
                return jsonify({"error": "Company not found"}), 404

            # Check if company name is taken by another company
            cursor.execute(
                "SELECT id FROM companies WHERE company_name = ? AND id != ?",
                (company_name, company_id),
            )
            if cursor.fetchone():
                current_app.logger.warning(
                    f"Update failed: Company name '{company_name}' already exists."
                )
                return jsonify({"error": "Company name already exists"}), 409

            cursor.execute(
                "UPDATE companies SET company_name = ?, sub_company1 = ?, sub_company2 = ? WHERE id = ?",
                (company_name, sub_company1, sub_company2, company_id),
            )
            conn.commit()
            current_app.logger.info(
                f"Company with ID {company_id} updated successfully."
            )
            return jsonify({"message": "Company updated successfully"}), 200
        except Exception as e:
            conn.rollback()
            current_app.logger.error(
                f"Error updating company {company_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "DELETE":
        try:
            # Check if company exists
            cursor.execute("SELECT id FROM companies WHERE id = ?", (company_id,))
            if not cursor.fetchone():
                current_app.logger.warning(
                    f"Delete failed: Company with ID {company_id} not found."
                )
                return jsonify({"error": "Company not found"}), 404

            cursor.execute("DELETE FROM companies WHERE id = ?", (company_id,))
            conn.commit()
            current_app.logger.info(
                f"Company with ID {company_id} deleted successfully."
            )
            return jsonify({"message": "Company deleted successfully"}), 200
        except Exception as e:
            conn.rollback()
            current_app.logger.error(
                f"Error deleting company {company_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()
