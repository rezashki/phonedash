// utils.js
// This file contains utility functions that can be shared across different parts of the application.

/**
 * Displays a custom warning/info/success modal message to the user.
 * Replaces standard alert() calls for better UX.
 *
 * @param {string} message - The message to display in the modal.
 * @param {string} [type='info'] - The type of message: 'info', 'success', or 'error'.
 */
export function showWarningModal(message, type = 'info') {
    const warningModal = document.getElementById('warningModal');
    const warningMessage = document.getElementById('warningMessage');
    const modalContent = warningModal.querySelector('.warning-modal-content');

    if (!warningModal || !warningMessage || !modalContent) {
        console.error('Warning modal elements not found. Falling back to alert().');
        alert(message);
        return;
    }

    warningMessage.textContent = message;

    // Reset classes
    modalContent.classList.remove('bg-red-100', 'text-red-700', 'border-red-400',
                                  'bg-green-100', 'text-green-700', 'border-green-400',
                                  'bg-blue-100', 'text-blue-700', 'border-blue-400');
    modalContent.style.backgroundColor = ''; // Clear inline styles
    modalContent.style.borderColor = '';
    modalContent.style.color = '';

    // Apply type-specific styles
    if (type === 'error') {
        modalContent.classList.add('bg-red-100', 'text-red-700');
        modalContent.style.borderColor = '#ef4444'; // Tailwind red-500 equivalent
        modalContent.querySelector('h2').style.color = '#b91c1c'; // Darker red for heading
        modalContent.querySelector('.close-button').style.color = '#b91c1c'; // Darker red for close button
        modalContent.querySelector('button').classList.remove('bg-blue-600', 'hover:bg-blue-700', 'bg-green-600', 'hover:bg-green-700');
        modalContent.querySelector('button').classList.add('bg-red-600', 'hover:bg-red-700');
    } else if (type === 'success') {
        modalContent.classList.add('bg-green-100', 'text-green-700');
        modalContent.style.borderColor = '#22c55e'; // Tailwind green-500 equivalent
        modalContent.querySelector('h2').style.color = '#16a34a'; // Darker green for heading
        modalContent.querySelector('.close-button').style.color = '#16a34a'; // Darker green for close button
        modalContent.querySelector('button').classList.remove('bg-blue-600', 'hover:bg-blue-700', 'bg-red-600', 'hover:bg-red-700');
        modalContent.querySelector('button').classList.add('bg-green-600', 'hover:bg-green-700');
    } else { // 'info' or default
        modalContent.classList.add('bg-blue-100', 'text-blue-700');
        modalContent.style.borderColor = '#3b82f6'; // Tailwind blue-500 equivalent
        modalContent.querySelector('h2').style.color = '#2563eb'; // Darker blue for heading
        modalContent.querySelector('.close-button').style.color = '#2563eb'; // Darker blue for close button
        modalContent.querySelector('button').classList.remove('bg-red-600', 'hover:bg-red-700', 'bg-green-600', 'hover:bg-green-700');
        modalContent.querySelector('button').classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    warningModal.style.display = 'flex'; // Show the modal

    // Attach event listeners to close the modal
    const closeButtons = warningModal.querySelectorAll('.close-button, .close-button-bottom');
    closeButtons.forEach(button => {
        // Remove existing listeners to prevent multiple firings
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', () => {
            warningModal.style.display = 'none';
        });
    });

    // Close when clicking outside the modal content
    warningModal.addEventListener('click', (event) => {
        if (event.target === warningModal) {
            warningModal.style.display = 'none';
        }
    });
}

/**
 * Debounces a function, so it only runs after a certain delay
 * since the last time it was invoked.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
