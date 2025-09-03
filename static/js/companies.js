// JavaScript for companies.html
// This file will handle fetching and displaying companies, and the add new company modal.
document.addEventListener('DOMContentLoaded', () => {
    console.log('Companies View page loaded.'); // Confirm this logs in your console

    const companyListBody = document.querySelector('#companyList tbody');

    // Get modal elements
    const addCompanyModal = document.getElementById('addCompanyModal');
    const addCompanyBtn = document.getElementById('addCompanyBtn');
    const companyForm = document.getElementById('companyForm');
    const editCompanyModal = document.getElementById('editCompanyModal'); // Get edit modal
    const editCompanyForm = document.getElementById('editCompanyForm');   // Get edit form
    const deleteCompanyConfirmModal = document.getElementById('deleteCompanyConfirmModal'); // Get delete confirm modal
    const confirmDeleteCompanyBtn = document.getElementById('confirmDeleteCompanyBtn'); // Get confirm delete button

    // Debugging: Check if modal elements are found on DOMContentLoaded
    console.log('addCompanyModal element:', addCompanyModal);
    console.log('editCompanyModal element:', editCompanyModal);
    console.log('deleteCompanyConfirmModal element:', deleteCompanyConfirmModal);


    // Get all close buttons for modals (top-right X and bottom buttons)
    const closeButtons = document.querySelectorAll('.modal .close-button, .modal .close-button-bottom');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            addCompanyModal.style.display = 'none';
            editCompanyModal.style.display = 'none'; // Close edit modal
            deleteCompanyConfirmModal.style.display = 'none'; // Close delete confirm modal
            companyForm.reset(); // Clear add form
            editCompanyForm.reset(); // Clear edit form
        });
    });

    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target == addCompanyModal) {
            addCompanyModal.style.display = 'none';
            companyForm.reset();
        }
        if (event.target == editCompanyModal) {
            editCompanyModal.style.display = 'none';
            editCompanyForm.reset();
        }
        if (event.target == deleteCompanyConfirmModal) {
            deleteCompanyConfirmModal.style.display = 'none';
        }
    });

    // Open Add Company Modal
    addCompanyBtn.addEventListener('click', () => {
        console.log('Add Company button clicked!'); // Check if this logs when you click the button
        companyForm.reset(); // Ensure form is clear before opening
        addCompanyModal.style.display = 'flex';
    });


    // Function to highlight the active link in the sidebar
    function highlightActiveSidebarLink() {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const currentPath = window.location.pathname; // e.g., /companies.html

        sidebarLinks.forEach(link => {
            // Remove active class from all links first
            link.classList.remove('active-sidebar-link');

            // Get the href attribute and compare it with the current path
            const linkHref = new URL(link.href).pathname;

            if (currentPath === linkHref) {
                link.classList.add('active-sidebar-link');
            }
        });
    }

    // Call the function when the page loads
    highlightActiveSidebarLink();

    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'

    // Function to fetch and display companies
    async function fetchCompanies() {
        try {
            const response = await fetch('/api/companies');
            let companies = await response.json();

            // Sort companies if a sort column is active
            if (currentSortColumn) {
                companies.sort((a, b) => {
                    const valA = a[currentSortColumn] || '';
                    const valB = b[currentSortColumn] || '';

                    if (typeof valA === 'string' && typeof valB === 'string') {
                        // Case-insensitive string comparison for Persian characters
                        const comparison = valA.localeCompare(valB, 'fa', { sensitivity: 'base' });
                        return currentSortDirection === 'asc' ? comparison : -comparison;
                    } else {
                        // Fallback for non-string or mixed types
                        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
                        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
                        return 0;
                    }
                });
            }

            companyListBody.innerHTML = ''; // Clear existing rows

            if (companies.length === 0) {
                const noCompaniesRow = document.createElement('tr');
                noCompaniesRow.innerHTML = `<td colspan="4" class="py-3 px-6 text-center text-gray-500">هیچ شرکتی یافت نشد.</td>`;
                companyListBody.appendChild(noCompaniesRow);
                return;
            }

            companies.forEach(company => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-200 hover:bg-gray-100';
                row.innerHTML = `
                    <td class="py-3 px-6 text-right whitespace-nowrap">${company.company_name || ''}</td>
                    <td class="py-3 px-6 text-right">${company.sub_company1 || ''}</td>
                    <td class="py-3 px-6 text-right">${company.sub_company2 || ''}</td>
                    <td class="py-3 px-6 text-center">
                        <button class="text-yellow-500 hover:text-yellow-700 mx-1 edit-btn" data-id="${company.id}" title="ویرایش">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <button class="text-red-500 hover:text-red-700 mx-1 delete-btn" data-id="${company.id}" title="حذف">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </td>
                `;
                companyListBody.appendChild(row);
            });

            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const companyId = event.target.closest('button').dataset.id;
                    console.log('Edit button clicked for company ID:', companyId); // Debugging log
                    editCompanyDetails(companyId);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const companyId = event.target.closest('button').dataset.id;
                    console.log('Delete button clicked for company ID:', companyId); // Debugging log
                    showDeleteCompanyConfirmModal(companyId);
                });
            });

        } catch (error) {
            console.error('Error fetching companies:', error);
            const errorRow = document.createElement('tr');
            errorRow.innerHTML = `<td colspan="4" class="py-3 px-6 text-center text-red-500">خطا در بارگذاری شرکت‌ها.</td>`;
            companyListBody.appendChild(errorRow);
        }
    }

    // Event listeners for sortable headers
    document.querySelectorAll('.sortable-header').forEach(button => {
        button.addEventListener('click', (event) => {
            const sortKey = event.currentTarget.dataset.sort;
            const sortIcon = event.currentTarget.querySelector('.sort-icon');

            // Reset other sort icons
            document.querySelectorAll('.sort-icon').forEach(icon => {
                if (icon !== sortIcon) {
                    icon.classList.remove('asc', 'desc');
                }
            });

            if (currentSortColumn === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortKey;
                currentSortDirection = 'asc';
            }

            // Update icon direction
            sortIcon.classList.remove('asc', 'desc');
            if (currentSortDirection === 'asc') {
                sortIcon.classList.add('asc');
            } else {
                sortIcon.classList.add('desc');
            }

            fetchCompanies(); // Re-fetch and re-render with new sort order
        });
    });


    // Handle company form submission (Add Company)
    if (companyForm) {
        companyForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(companyForm);
            const companyData = {};
            for (const [key, value] of formData.entries()) {
                companyData[key] = value;
            }

            try {
                const response = await fetch('/api/companies', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(companyData),
                });

                const result = await response.json();

                if (response.ok) {
                    alert('شرکت با موفقیت اضافه شد!'); // Using alert for now, will replace with custom modal later
                    companyForm.reset(); // Clear the form
                    addCompanyModal.style.display = 'none'; // Close modal
                    fetchCompanies(); // Refresh the company list
                } else {
                    alert(`خطا: ${result.error || 'افزودن شرکت با شکست مواجه شد.'}`); // Using alert for now
                }
            } catch (error) {
                console.error('خطا در افزودن شرکت:', error);
                alert('خطای غیرمنتظره‌ای رخ داد.');
            }
        });
    }

    // --- Edit Company Functionality ---
    async function editCompanyDetails(companyId) {
        try {
            const response = await fetch(`/api/companies/${companyId}`);
            if (!response.ok) {
                // If response is not OK, throw an error to be caught below
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
            }
            const company = await response.json();
            console.log('Fetched company data for edit:', company); // Log fetched data

            // Debugging: Log the elements before trying to set their value
            const editCompanyIdElement = document.getElementById('editCompanyId');
            const editCompanyNameElement = document.getElementById('editCompanyName');
            const editSubCompany1Element = document.getElementById('editSubCompany1');
            const editSubCompany2Element = document.getElementById('editSubCompany2');

            console.log('editCompanyIdElement:', editCompanyIdElement);
            console.log('editCompanyNameElement:', editCompanyNameElement);
            console.log('editSubCompany1Element:', editSubCompany1Element);
            console.log('editSubCompany2Element:', editSubCompany2Element);

            // Set values only if the element is found
            if (editCompanyIdElement) editCompanyIdElement.value = company.id;
            if (editCompanyNameElement) editCompanyNameElement.value = company.company_name || '';
            if (editSubCompany1Element) editSubCompany1Element.value = company.sub_company1 || '';
            if (editSubCompany2Element) editSubCompany2Element.value = company.sub_company2 || '';

            editCompanyModal.style.display = 'flex'; // Show modal
        } catch (error) {
            console.error('Error fetching company for edit:', error);
            alert('خطا در بارگذاری اطلاعات شرکت برای ویرایش: ' + error.message); // Show more specific error
        }
    }

    if (editCompanyForm) {
        editCompanyForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const companyId = document.getElementById('editCompanyId').value;
            const formData = new FormData(editCompanyForm);
            const updatedData = {};
            for (const [key, value] of formData.entries()) {
                updatedData[key] = value;
            }

            try {
                const response = await fetch(`/api/companies/${companyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });

                const result = await response.json();

                if (response.ok) {
                    alert('شرکت با موفقیت ویرایش شد!');
                    editCompanyModal.style.display = 'none';
                    fetchCompanies(); // Refresh company list
                } else {
                    alert(`خطا: ${result.error || 'ویرایش شرکت با شکست مواجه شد.'}`);
                }
            } catch (error) {
                console.error('Error updating company:', error);
                alert('خطای غیرمنتظره‌ای در هنگام ویرایش رخ داد.');
            }
        });
    }

    // --- Delete Company Functionality ---
    let companyIdToDelete = null; // Store ID temporarily for deletion

    function showDeleteCompanyConfirmModal(companyId) {
        companyIdToDelete = companyId;
        deleteCompanyConfirmModal.style.display = 'flex';
    }

    if (confirmDeleteCompanyBtn) {
        confirmDeleteCompanyBtn.addEventListener('click', async () => {
            if (companyIdToDelete) {
                try {
                    const response = await fetch(`/api/companies/${companyIdToDelete}`, {
                        method: 'DELETE',
                    });
                    if (response.ok) {
                        alert('شرکت با موفقیت حذف شد!');
                        deleteCompanyConfirmModal.style.display = 'none';
                        fetchCompanies(); // Refresh the list
                    } else {
                        const result = await response.json();
                        alert(`خطا: ${result.error || 'حذف شرکت با شکست مواجه شد.'}`);
                    }
                } catch (error) {
                    console.error('Error deleting company:', error);
                    alert('خطای غیرمنتظره‌ای در هنگام حذف رخ داد.');
                } finally {
                    companyIdToDelete = null; // Clear stored ID
                }
            }
        });
    }


    // Initial fetch of companies when the page loads
    fetchCompanies();
});
