from flask import Blueprint, request, jsonify, current_app, session
from werkzeug.security import generate_password_hash, check_password_hash
from auth import login_required, admin_required
from database import get_db_connection
import sqlite3

users_routes = Blueprint("users_routes", __name__)


@users_routes.route("/users", methods=["GET", "POST"])
@admin_required
def handle_users():
    """Handles GET requests to retrieve all users and POST requests to create a new user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        try:
            user_data = request.json
            username = user_data.get("username")
            password = user_data.get("password")
            role = user_data.get("role", "normal")

            if not username or not password:
                current_app.logger.warning(
                    "User creation failed: Username and password are required."
                )
                return jsonify({"error": "Username and password are required"}), 400

            # Check if username already exists
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cursor.fetchone():
                current_app.logger.warning(
                    f"User creation failed: Username '{username}' already exists."
                )
                return jsonify({"error": "Username already exists"}), 409

            # Hash the password securely
            password_hash = generate_password_hash(password)

            cursor.execute(
                "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
                (username, password_hash, 1 if role == "admin" else 0),
            )
            conn.commit()
            current_app.logger.info(f"User '{username}' created successfully.")
            return (
                jsonify(
                    {"message": "User created successfully", "id": cursor.lastrowid}
                ),
                201,
            )
        except Exception as e:
            conn.rollback()
            current_app.logger.error(f"Error creating user: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "GET":
        try:
            cursor.execute("SELECT id, username, is_admin FROM users")
            users = cursor.fetchall()
            users_list = []
            for user in users:
                user_dict = dict(user)
                # Convert is_admin to role for consistency
                user_dict['role'] = 'admin' if user_dict['is_admin'] else 'normal'
                users_list.append(user_dict)
            current_app.logger.info("Fetched all users.")
            return jsonify(users_list), 200
        except Exception as e:
            current_app.logger.error(f"Error fetching all users: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()


@users_routes.route("/users/<int:user_id>", methods=["GET", "PUT", "DELETE"])
@admin_required
def handle_single_user(user_id):
    """Handles GET, PUT, and DELETE requests for a specific user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "GET":
        try:
            cursor.execute(
                "SELECT id, username, is_admin FROM users WHERE id = ?",
                (user_id,),
            )
            user = cursor.fetchone()
            if user:
                user_dict = dict(user)
                # Convert is_admin to role for consistency
                user_dict['role'] = 'admin' if user_dict['is_admin'] else 'normal'
                current_app.logger.info(f"Fetched user with ID {user_id}.")
                return jsonify(user_dict), 200
            else:
                current_app.logger.warning(f"User with ID {user_id} not found.")
                return jsonify({"error": "User not found"}), 404
        except Exception as e:
            current_app.logger.error(
                f"Error fetching user {user_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "PUT":
        try:
            user_data = request.json
            username = user_data.get("username")
            password = user_data.get("password")
            role = user_data.get("role")

            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
            if not cursor.fetchone():
                current_app.logger.warning(
                    f"Update failed: User with ID {user_id} not found."
                )
                return jsonify({"error": "User not found"}), 404

            # Check if username is taken by another user
            if username:
                cursor.execute(
                    "SELECT id FROM users WHERE username = ? AND id != ?",
                    (username, user_id),
                )
                if cursor.fetchone():
                    current_app.logger.warning(
                        f"Update failed: Username '{username}' already exists."
                    )
                    return jsonify({"error": "Username already exists"}), 409

            # Build update query dynamically
            update_fields = []
            update_values = []

            if username:
                update_fields.append("username = ?")
                update_values.append(username)

            if password:
                update_fields.append("password = ?")
                password_hash = generate_password_hash(password)
                update_values.append(password_hash)

            if role:
                update_fields.append("is_admin = ?")
                update_values.append(1 if role == "admin" else 0)

            if not update_fields:
                current_app.logger.warning(
                    f"Update failed: No valid fields to update for user {user_id}."
                )
                return jsonify({"error": "No valid fields to update"}), 400

            update_values.append(user_id)
            update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"

            cursor.execute(update_query, update_values)
            conn.commit()
            current_app.logger.info(f"User with ID {user_id} updated successfully.")
            return jsonify({"message": "User updated successfully"}), 200
        except Exception as e:
            conn.rollback()
            current_app.logger.error(
                f"Error updating user {user_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

    elif request.method == "DELETE":
        try:
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
            if not cursor.fetchone():
                current_app.logger.warning(
                    f"Delete failed: User with ID {user_id} not found."
                )
                return jsonify({"error": "User not found"}), 404

            cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.commit()
            current_app.logger.info(f"User with ID {user_id} deleted successfully.")
            return jsonify({"message": "User deleted successfully"}), 200
        except Exception as e:
            conn.rollback()
            current_app.logger.error(
                f"Error deleting user {user_id}: {e}", exc_info=True
            )
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()


@users_routes.route("/users/<int:user_id>/change_password", methods=["POST"])
@login_required
def change_user_password(user_id):
    """Allow users to change their own password or admins to change any password."""
    
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if user exists
        cursor.execute("SELECT id, is_admin FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            current_app.logger.warning(
                f"Password change failed: User with ID {user_id} not found."
            )
            return jsonify({"error": "User not found"}), 404

        # Check permissions: users can only change their own password, admins can change any
        current_user_id = session.get("user_id")
        current_user_role = session.get("role")

        if current_user_id != user_id and current_user_role != "admin":
            current_app.logger.warning(
                f"Password change failed: User {current_user_id} tried to change password for user {user_id}."
            )
            return jsonify({"error": "Permission denied"}), 403

        user_data = request.json
        new_password = user_data.get("new_password")
        current_password = user_data.get("current_password")

        if not new_password:
            current_app.logger.warning(
                "Password change failed: New password is required."
            )
            return jsonify({"error": "New password is required"}), 400

        # If user is changing their own password, verify current password
        if current_user_id == user_id and current_password:
            # Get the current password hash from database
            cursor.execute(
                "SELECT password FROM users WHERE id = ?",
                (user_id,),
            )
            stored_hash = cursor.fetchone()
            if not stored_hash or not check_password_hash(stored_hash["password"], current_password):
                current_app.logger.warning(
                    f"Password change failed: Incorrect current password for user {user_id}."
                )
                return jsonify({"error": "Current password is incorrect"}), 400

        # Hash the new password securely
        new_password_hash = generate_password_hash(new_password)

        cursor.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            (new_password_hash, user_id),
        )
        conn.commit()
        current_app.logger.info(f"Password changed successfully for user {user_id}.")
        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        conn.rollback()
        current_app.logger.error(
            f"Error changing password for user {user_id}: {e}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
