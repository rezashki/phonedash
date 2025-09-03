from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from auth import login_required
from database import get_db_connection

auth_routes = Blueprint("auth_routes", __name__)


@auth_routes.route("/register", methods=["POST"])
def register():
    """Handles user registration."""
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        role = data.get("role", "normal")

        if not username or not password:
            current_app.logger.warning(
                "Registration failed: Username and password are required."
            )
            return jsonify({"error": "Username and password are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            current_app.logger.warning(
                f"Registration failed: Username '{username}' already exists."
            )
            return jsonify({"error": "Username already exists"}), 409

        # Hash the password
        password_hash = generate_password_hash(password)

        cursor.execute(
            "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
            (username, password_hash, 1 if role == "admin" else 0),
        )
        conn.commit()
        conn.close()

        current_app.logger.info(f"User '{username}' registered successfully.")
        return jsonify({"message": "Registration successful"}), 201
    except Exception as e:
        current_app.logger.error(f"Error during registration: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@auth_routes.route("/login", methods=["POST"])
def login():
    """Handles user login."""
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            current_app.logger.warning(
                "Login failed: Username and password are required."
            )
            return jsonify({"error": "Username and password are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, password, is_admin FROM users WHERE username = ?",
            (username,),
        )
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user["password"], password):
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            session["role"] = "admin" if user["is_admin"] else "normal"
            current_app.logger.info(f"User '{username}' logged in successfully.")
            return (
                jsonify({"message": "Login successful", "role": session["role"]}),
                200,
            )
        else:
            current_app.logger.warning(
                f"Login failed: Invalid credentials for username '{username}'."
            )
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        current_app.logger.error(f"Error during login: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@auth_routes.route("/logout", methods=["GET"])
@login_required
def logout():
    """Handles user logout."""
    try:
        username = session.get("username")
        session.clear()
        current_app.logger.info(f"User '{username}' logged out successfully.")
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        current_app.logger.error(f"Error during logout: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@auth_routes.route("/users/count", methods=["GET"])
def get_users_count():
    """Get the total count of users in the database (public endpoint for login page)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users")
        result = cursor.fetchone()
        conn.close()
        current_app.logger.info("Fetched users count.")
        return jsonify({"count": result["count"]}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching users count: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
