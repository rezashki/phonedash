// JavaScript for contacts_entry.html
// This file will handle form submission for adding new contact data,
// company dropdown population, adding new companies via modal, and sidebar highlighting.

import { showWarningModal } from './utils.js'; // Import the shared warning modal

document.addEventListener('DOMContentLoaded', () => {
    console.log('Contacts Entry page loaded.');

    const contactForm = document.getElementById('contactForm');
    const mainCompanySelect = document.getElementById('mainCompany');
    const addNewCompanyBtn = document.getElementById('addNewCompanyBtn');

    // Add Company Modal elements
    const addCompanyModal = document.getElementById('addCompanyModal');
    const companyFormModal = document.getElementById('companyFormModal'); // Form inside the modal
    const modalCompanyNameInput = document.getElementById('modalCompanyName');
    const modalSubCompany1Input = document.getElementById('modalSubCompany1');
    const modalSubCompany2Input = document.getElementById('modalSubCompany2');

    // Warning Modal elements (now handled by utils.js, but elements still exist in HTML)
    const warningModal = document.getElementById('warningModal'); // Keep reference for closing via window click
    // No longer need to reference warningMessage directly here as showWarningModal handles it.

    let allCompaniesData = []; // To store all fetched companies

    // Function to highlight the active link in the sidebar
    function highlightActiveSidebarLink() {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const currentPath = window.location.pathname; // e.g., /contacts_entry.html

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

    // Function to fetch all companies and populate the dropdown
    async function fetchAndPopulateCompanies() {
        try {
            const response = await fetch('/api/companies');
            allCompaniesData = await response.json();
            populateCompanyDropdown(allCompaniesData);
        } catch (error) {
            console.error('Error fetching companies:', error);
            showWarningModal('خطا در بارگذاری لیست شرکت‌ها.'); // Use imported modal
        }
    }

    // Function to populate the company dropdown
    function populateCompanyDropdown(companies) {
        mainCompanySelect.innerHTML = ''; // Clear existing options

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "انتخاب کنید...";
        mainCompanySelect.appendChild(defaultOption);

        // Collect all unique company and subsidiary names
        const allNames = new Set();
        companies.forEach(company => {
            if (company.company_name) allNames.add(company.company_name);
            if (company.sub_company1) allNames.add(company.sub_company1);
            if (company.sub_company2) allNames.add(company.sub_company2);
        });

        const sortedNames = Array.from(allNames).sort((a, b) => a.localeCompare(b, 'fa', { sensitivity: 'base' }));

        sortedNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            mainCompanySelect.appendChild(option);
        });
    }

    // Event listener for "Add New Company" button
    if (addNewCompanyBtn) {
        addNewCompanyBtn.addEventListener('click', () => {
            companyFormModal.reset(); // Clear form before opening
            addCompanyModal.style.display = 'flex';
            modalCompanyNameInput.focus(); // Focus on the first input
        });
    }

    // Handle submission of the Add Company Modal form
    if (companyFormModal) {
        companyFormModal.addEventListener('submit', async (event) => {
            event.preventDefault();

            const companyData = {
                companyName: modalCompanyNameInput.value,
                subCompany1: modalSubCompany1Input.value,
                subCompany2: modalSubCompany2Input.value
            };

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
                    showWarningModal('شرکت با موفقیت اضافه شد!', 'success'); // Use imported modal
                    addCompanyModal.style.display = 'none'; // Close modal
                    await fetchAndPopulateCompanies(); // Re-fetch and re-populate dropdown
                    mainCompanySelect.value = companyData.companyName; // Select the newly added company
                } else {
                    showWarningModal(`خطا: ${result.error || 'افزودن شرکت با شکست مواجه شد.'}`); // Use imported modal
                }
            } catch (error) {
                console.error('خطا در افزودن شرکت از طریق مودال:', error);
                showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام افزودن شرکت.'); // Use imported modal
            }
        });
    }

    // Handle Contact Form Submission
    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(contactForm);
            const contactData = {};
            for (const [key, value] of formData.entries()) {
                contactData[key] = value;
            }

            // --- Validation Logic ---
            const fullName = contactData['fullName'] ? contactData['fullName'].trim() : '';
            const mobilePhone = contactData['mobilePhone'] ? contactData['mobilePhone'].trim() : '';
            const officePhone1 = contactData['officePhone1'] ? contactData['officePhone1'].trim() : '';
            const officeManagerMobile1 = contactData['officeManagerMobile1'] ? contactData['officeManagerMobile1'].trim() : '';

            console.log('Validation Check:');
            console.log('Full Name:', fullName);
            console.log('Mobile Phone:', mobilePhone);
            console.log('Office Phone 1:', officePhone1);
            console.log('Office Manager Mobile 1:', officeManagerMobile1);

            if (!fullName) {
                console.log('Validation Failed: Full name is empty.');
                showWarningModal('نام و نام خانوادگی مخاطب الزامی است.'); // Use imported modal
                return;
            }

            if (!mobilePhone && !officePhone1 && !officeManagerMobile1) {
                console.log('Validation Failed: No phone number provided.');
                showWarningModal('حداقل یکی از فیلدهای "شماره همراه", "تلفن اداری 1" یا "شماره همراه مسئول دفتر 1" باید پر شود.'); // Use imported modal
                return;
            }
            console.log('Validation Passed.');
            // --- End Validation Logic ---

            try {
                const response = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(contactData),
                });

                const result = await response.json();

                if (response.ok) {
                    showWarningModal('مخاطب با موفقیت اضافه شد!', 'success'); // Use imported modal
                    contactForm.reset(); // Clear the form
                } else {
                    showWarningModal(`خطا: ${result.error || 'افزودن مخاطب با شکست مواجه شد.'}`); // Use imported modal
                }
            } catch (error) {
                console.error('Error adding contact:', error);
                showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام افزودن مخاطب.'); // Use imported modal
            }
        });
    }

    // Close buttons for modals (top-right X and bottom buttons)
    // These listeners are now handled by utils.js for the warning modal,
    // but still needed for addCompanyModal if it's not managed by utils.js.
    document.querySelectorAll('#addCompanyModal .close-button, #addCompanyModal .close-button-bottom').forEach(button => {
        button.addEventListener('click', () => {
            addCompanyModal.style.display = 'none';
        });
    });


    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target == addCompanyModal) {
            addCompanyModal.style.display = 'none';
        }
        // The warningModal closing is handled by utils.js now,
        // but keeping this for robustness if any other modal is added later.
        if (event.target == warningModal) {
            warningModal.style.display = 'none';
        }
    });

    // Initial fetch of companies when the page loads
    fetchAndPopulateCompanies();
});
