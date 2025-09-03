from functools import wraps
from flask import session, flash, redirect, url_for, jsonify, current_app, request
import sqlite3
from database import get_db_connection


def login_required(f):
    """Decorator to protect routes that require a logged-in user."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            current_app.logger.warning("Access denied: User not logged in.")

            # Check if this is an API request
            if request.path.startswith("/api/"):
                return jsonify({"error": "Authentication required"}), 401
            else:
                flash("برای دسترسی به این صفحه، ابتدا وارد شوید.", "error")
                return redirect(url_for("main_routes.login_page"))
        return f(*args, **kwargs)

    return decorated_function


def admin_required(f):
    """Decorator to protect routes that require an admin user."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            current_app.logger.warning(
                "Access denied: User not logged in for admin page."
            )

            # Check if this is an API request
            if request.path.startswith("/api/"):
                return jsonify({"error": "Authentication required"}), 401
            else:
                flash("برای دسترسی به این صفحه، ابتدا وارد شوید.", "error")
                return redirect(url_for("main_routes.login_page"))

        conn = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            current_user_id = session["user_id"]
            current_app.logger.info(
                f"Admin check for session user_id: {current_user_id}"
            )
            cursor.execute(
                "SELECT is_admin FROM users WHERE id = ?", (current_user_id,)
            )
            user = cursor.fetchone()

            if not user:
                current_app.logger.warning(
                    f"Access denied: User ID {current_user_id} not found in database."
                )
                session.pop("user_id", None)
                session.pop("username", None)
                session.pop("role", None)

                if request.path.startswith("/api/"):
                    return jsonify({"error": "User not found"}), 401
                else:
                    flash("کاربر یافت نشد. لطفاً دوباره وارد شوید.", "error")
                    return redirect(url_for("main_routes.login_page"))

            db_is_admin = user["is_admin"]
            current_app.logger.info(
                f"User '{session.get('username', 'N/A')}' (ID: {current_user_id}) has is_admin status from DB: {db_is_admin}"
            )

            if db_is_admin != 1:
                current_app.logger.warning(
                    f"Access denied: User {session.get('username', 'N/A')} (ID: {current_user_id}) is not an admin."
                )

                if request.path.startswith("/api/"):
                    return jsonify({"error": "Admin access required"}), 403
                else:
                    flash("شما اجازه دسترسی به این صفحه را ندارید.", "error")
                    return redirect(url_for("main_routes.dashboard_page"))

            current_app.logger.info(
                f"User {session.get('username', 'N/A')} (ID: {current_user_id}) is an admin. Granting access."
            )
            return f(*args, **kwargs)
        except sqlite3.Error as e:
            current_app.logger.error(
                f"Database error during admin check for user_id {session.get('user_id')}: {e}",
                exc_info=True,
            )
            if request.path.startswith("/api/"):
                return jsonify({"error": "Database error during admin check"}), 500
            else:
                flash("خطای پایگاه داده در بررسی دسترسی مدیر.", "error")
                return redirect(url_for("main_routes.dashboard_page"))
        except Exception as e:
            current_app.logger.error(
                f"Unexpected error during admin check for user_id {session.get('user_id')}: {e}",
                exc_info=True,
            )
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unexpected error during admin check"}), 500
            else:
                flash("خطای غیرمنتظره در بررسی دسترسی.", "error")
                return redirect(url_for("main_routes.dashboard_page"))
        finally:
            if conn:
                conn.close()

    return decorated_function
