from flask import (
    Blueprint,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
    flash,
    current_app,
)
from werkzeug.security import generate_password_hash, check_password_hash
from auth import login_required, admin_required
from database import get_db_connection

main_routes = Blueprint("main_routes", __name__)


# --- Routes for serving HTML pages ---
@main_routes.route("/")
@login_required
def index():
    """Serves the main dashboard page."""
    return render_template("dashboard.html")


@main_routes.route("/dashboard.html")
@login_required
def dashboard_page():
    """Serves the dashboard page."""
    return render_template("dashboard.html")


@main_routes.route("/contacts_entry.html")
@login_required
def contacts_entry_page():
    """Serves the contact entry page."""
    return render_template("contacts_entry.html")


@main_routes.route("/contacts.html")
@login_required
def contacts_page():
    """Serves the contacts viewing page."""
    return render_template("contacts.html")


@main_routes.route("/companies.html")
@login_required
def companies_page():
    """Serves the companies viewing page."""
    return render_template("companies.html")


@main_routes.route("/users_mng.html")
@admin_required
def users_management_page():
    """Serves the user management page."""
    return render_template("users_mng.html")


@main_routes.route("/login.html", methods=["GET"])
def login_page():
    """Serves the login page."""
    return render_template("login.html")


@main_routes.route("/register.html", methods=["GET"])
def register_page():
    """Serves the registration page."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    conn.close()
    if user_count > 0:
        flash("ثبت نام فقط برای اولین کاربر مجاز است. لطفاً وارد شوید.", "info")
        return redirect(url_for("main_routes.login_page"))
    return render_template("register.html")


# --- Authentication API Endpoints ---
# Note: These routes are temporarily defined in app.py to avoid conflicts
# They should be moved here once the route organization is completed
