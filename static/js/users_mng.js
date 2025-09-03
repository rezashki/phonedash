// static/js/users_mng.js
// This file handles user management functionalities: fetching, adding, editing, and deleting users.

import { showWarningModal } from './utils.js'; // Assuming utils.js provides showWarningModal

document.addEventListener('DOMContentLoaded', () => {
    console.log('Users Management page loaded.');

    // DOM Elements
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserModal = document.getElementById('addUserModal');
    const addUserForm = document.getElementById('addUserForm');
    const userListBody = document.querySelector('#userList tbody');

    const editUserModal = document.getElementById('editUserModal');
    const editUserForm = document.getElementById('editUserForm');
    const editUserIdInput = document.getElementById('editUserId');
    const editUsernameInput = document.getElementById('editUsername');
    const editPasswordInput = document.getElementById('editPassword');
    const editIsAdminCheckbox = document.getElementById('editIsAdmin');

    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const userToDeleteUsernameSpan = document.getElementById('userToDeleteUsername');
    const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');

    let userIdToDelete = null; // To store the ID of the user to be deleted

    // Function to highlight the active link in the sidebar
    function highlightActiveSidebarLink() {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const currentPath = window.location.pathname;

        sidebarLinks.forEach(link => {
            link.classList.remove('active-sidebar-link');
            const linkHref = new URL(link.href).pathname;
            if (currentPath === linkHref) {
                link.classList.add('active-sidebar-link');
            }
        });
    }

    // Call the function when the page loads
    highlightActiveSidebarLink();

    // --- Modal Handling ---
    // Open Add User Modal
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            addUserForm.reset(); // Clear form fields
            addUserModal.style.display = 'flex';
        });
    }

    // Close buttons for modals (top-right X and bottom buttons)
    document.querySelectorAll('.modal .close-button, .modal .close-button-bottom').forEach(button => {
        button.addEventListener('click', () => {
            addUserModal.style.display = 'none';
            editUserModal.style.display = 'none';
            deleteConfirmModal.style.display = 'none';
            addUserForm.reset();
            editUserForm.reset();
            userIdToDelete = null; // Clear the stored ID
        });
    });

    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target == addUserModal) {
            addUserModal.style.display = 'none';
            addUserForm.reset();
        }
        if (event.target == editUserModal) {
            editUserModal.style.display = 'none';
            editUserForm.reset();
        }
        if (event.target == deleteConfirmModal) {
            deleteConfirmModal.style.display = 'none';
            userIdToDelete = null;
        }
    });

    // --- Fetch and Display Users ---
    async function fetchUsers() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch users');
            }
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            showWarningModal(`خطا در بارگذاری کاربران: ${error.message}`);
        }
    }

    function renderUsers(users) {
        userListBody.innerHTML = ''; // Clear existing rows
        if (users.length === 0) {
            const noUsersRow = document.createElement('tr');
            noUsersRow.innerHTML = `<td colspan="4" class="py-3 px-6 text-center text-gray-500">هیچ کاربری یافت نشد.</td>`;
            userListBody.appendChild(noUsersRow);
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.innerHTML = `
                <td class="py-3 px-6 text-right">${user.username}</td>
                <td class="py-3 px-6 text-center">${user.is_admin ? 'بله' : 'خیر'}</td>
                <td class="py-3 px-6 text-center whitespace-nowrap">
                    <button class="text-yellow-500 hover:text-yellow-700 mx-1 edit-user-btn" data-id="${user.id}" title="ویرایش">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <button class="text-red-500 hover:text-red-700 mx-1 delete-user-btn" data-id="${user.id}" data-username="${user.username}" title="حذف">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </td>
            `;
            userListBody.appendChild(row);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-user-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const userId = event.target.closest('button').dataset.id;
                editUserDetails(userId);
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const userId = event.target.closest('button').dataset.id;
                const username = event.target.closest('button').dataset.username;
                showDeleteConfirmModal(userId, username);
            });
        });
    }

    // --- Add User ---
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const isAdmin = document.getElementById('isAdmin').checked; // Get boolean value

            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password, isAdmin }),
                });

                const result = await response.json();

                if (response.ok) {
                    showWarningModal('کاربر با موفقیت اضافه شد.', 'success');
                    addUserForm.reset();
                    addUserModal.style.display = 'none';
                    fetchUsers(); // Refresh the user list
                } else {
                    showWarningModal(`خطا: ${result.error || 'افزودن کاربر با شکست مواجه شد.'}`);
                }
            } catch (error) {
                console.error('Error adding user:', error);
                showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام افزودن کاربر.');
            }
        });
    }

    // --- Edit User ---
    async function editUserDetails(userId) {
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch user details');
            }
            const user = await response.json();

            editUserIdInput.value = user.id;
            editUsernameInput.value = user.username;
            editPasswordInput.value = ''; // Password should not be pre-filled for security
            editIsAdminCheckbox.checked = user.is_admin === 1; // Set checkbox based on DB value

            editUserModal.style.display = 'flex';
        } catch (error) {
            console.error('Error fetching user for edit:', error);
            showWarningModal(`خطا در بارگذاری اطلاعات کاربر برای ویرایش: ${error.message}`);
        }
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const userId = editUserIdInput.value;
            const password = editPasswordInput.value; // Will be empty if not changed
            const isAdmin = editIsAdminCheckbox.checked; // Get boolean value

            const updateData = { isAdmin }; // Always send isAdmin status

            if (password) { // Only include password if it's been entered
                updateData.password = password;
            }

            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData),
                });

                const result = await response.json();

                if (response.ok) {
                    showWarningModal('کاربر با موفقیت به‌روزرسانی شد.', 'success');
                    editUserModal.style.display = 'none';
                    fetchUsers(); // Refresh user list
                } else {
                    showWarningModal(`خطا: ${result.error || 'به‌روزرسانی کاربر با شکست مواجه شد.'}`);
                }
            } catch (error) {
                console.error('Error updating user:', error);
                showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام به‌روزرسانی کاربر.');
            }
        });
    }

    // --- Delete User ---
    function showDeleteConfirmModal(userId, username) {
        userIdToDelete = userId;
        userToDeleteUsernameSpan.textContent = username;
        deleteConfirmModal.style.display = 'flex';
    }

    if (confirmDeleteUserBtn) {
        confirmDeleteUserBtn.addEventListener('click', async () => {
            if (userIdToDelete) {
                try {
                    const response = await fetch(`/api/users/${userIdToDelete}`, {
                        method: 'DELETE',
                    });
                    const result = await response.json();

                    if (response.ok) {
                        showWarningModal('کاربر با موفقیت حذف شد.', 'success');
                        deleteConfirmModal.style.display = 'none';
                        fetchUsers(); // Refresh the list
                    } else {
                        showWarningModal(`خطا: ${result.error || 'حذف کاربر با شکست مواجه شد.'}`);
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام حذف کاربر.');
                } finally {
                    userIdToDelete = null; // Clear stored ID
                }
            }
        });
    }

    // Initial fetch of users when the page loads
    fetchUsers();
});
