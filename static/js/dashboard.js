// JavaScript for dashboard.html
// This file can be used for any interactive elements or logic specific to the dashboard page.
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard page loaded.');

    // Function to highlight the active link in the sidebar
    function highlightActiveSidebarLink() {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const currentPath = window.location.pathname; // e.g., /dashboard.html

        sidebarLinks.forEach(link => {
            // Remove active class from all links first
            link.classList.remove('active-sidebar-link');

            // Get the href attribute and compare it with the current path
            // Handle cases where href might be just 'dashboard.html' or '/dashboard.html'
            const linkHref = new URL(link.href).pathname;

            if (currentPath === linkHref) {
                link.classList.add('active-sidebar-link');
            }
        });
    }

    // Call the function when the page loads
    highlightActiveSidebarLink();

    // Example: Add any dashboard-specific JavaScript here
});
