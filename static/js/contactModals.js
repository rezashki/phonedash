// static/js/contactModals.js
// This module manages the view, edit, and delete modals for contacts.

import { showWarningModal } from './utils.js';
import { fetchAllCompanies, getAllCompaniesData, getCompanyHierarchyMap, findCompanyHierarchyRoot } from './companyData.js';

// DOM elements (initialized via init function)
let viewContactModal;
let editContactModal;
let deleteConfirmModal;
let companyTreeContainer;
let companyTreeDiv;
let editMainCompanySelect;
let addCompanyModal;
let companyFormModal; // Form inside addCompanyModal
let modalCompanyNameInput;
let modalSubCompany1Input;
let modalSubCompany2Input;
let confirmDeleteBtn;

// Callback for refreshing the main contact list after an action
let refreshContactListCallback = null;

// Temporary storage for contact ID to delete
let contactIdToDelete = null;

/**
 * Initializes the modal module by providing necessary DOM elements and callbacks.
 * This should be called once on DOMContentLoaded in contacts.js.
 * @param {object} elements - Object containing DOM element references.
 * @param {Function} refreshCallback - Callback function to refresh the main contact list.
 */
export function initContactModals(elements, refreshCallback) {
    viewContactModal = elements.viewContactModal;
    editContactModal = elements.editContactModal;
    deleteConfirmModal = elements.deleteConfirmModal;
    companyTreeContainer = elements.companyTreeContainer;
    companyTreeDiv = elements.companyTreeDiv;
    editMainCompanySelect = elements.editMainCompanySelect;
    addCompanyModal = elements.addCompanyModal;
    companyFormModal = elements.companyFormModal;
    modalCompanyNameInput = elements.modalCompanyNameInput;
    modalSubCompany1Input = elements.modalSubCompany1Input;
    modalSubCompany2Input = elements.modalSubCompany2Input;
    confirmDeleteBtn = elements.confirmDeleteBtn;

    refreshContactListCallback = refreshCallback;

    setupModalCloseListeners();
    setupEditFormSubmission();
    setupAddCompanyModalSubmission();
    setupDeleteConfirmation();
    setupAddNewCompanyButtonInEditModal();
}

/**
 * Sets up event listeners for closing all modals.
 */
function setupModalCloseListeners() {
    // Close buttons for view, edit, delete, and add company modals
    document.querySelectorAll('.modal .close-button, .modal .close-button-bottom').forEach(button => {
        button.addEventListener('click', (event) => {
            // Find the closest parent modal and hide it
            const modal = event.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target === viewContactModal) {
            viewContactModal.style.display = 'none';
        }
        if (event.target === editContactModal) {
            editContactModal.style.display = 'none';
        }
        if (event.target === deleteConfirmModal) {
            deleteConfirmModal.style.display = 'none';
        }
        if (event.target === addCompanyModal) {
            addCompanyModal.style.display = 'none';
        }
    });
}

/**
 * Populates the main company dropdown in the edit contact modal.
 * @param {string} [selectedCompanyName=''] - The name of the company to pre-select.
 */
async function populateEditCompanyDropdown(selectedCompanyName = '') {
    const allCompanies = getAllCompaniesData(); // Get from companyData module
    editMainCompanySelect.innerHTML = ''; // Clear existing options

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "انتخاب کنید...";
    editMainCompanySelect.appendChild(defaultOption);

    // Collect all unique company and subsidiary names
    const allCompanyNames = new Set();
    allCompanies.forEach(company => {
        if (company.company_name) {
            allCompanyNames.add(company.company_name);
        }
        if (company.sub_company1) {
            allCompanyNames.add(company.sub_company1);
        }
        if (company.sub_company2) {
            allCompanyNames.add(company.sub_company2);
        }
    });

    // Convert Set to Array and sort alphabetically
    const sortedCompanyNames = Array.from(allCompanyNames).sort((a, b) => a.localeCompare(b, 'fa', { sensitivity: 'base' }));

    sortedCompanyNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        editMainCompanySelect.appendChild(option);
    });

    const addNewOption = document.createElement('option');
    addNewOption.value = "add_new_company";
    addNewOption.textContent = "افزودن شرکت جدید...";
    editMainCompanySelect.appendChild(addNewOption);

    // Pre-select the company if provided
    if (selectedCompanyName) {
        editMainCompanySelect.value = selectedCompanyName;
    }
}

/**
 * Sets up the event listener for the "Add New Company" option in the edit modal's company dropdown.
 */
function setupAddNewCompanyButtonInEditModal() {
    if (editMainCompanySelect) {
        editMainCompanySelect.addEventListener('change', () => {
            if (editMainCompanySelect.value === 'add_new_company') {
                companyFormModal.reset(); // Clear form before opening
                addCompanyModal.style.display = 'flex';
                modalCompanyNameInput.focus(); // Focus on the first input
            }
        });
    }
}

/**
 * Handles the submission of the Add Company Modal form.
 */
function setupAddCompanyModalSubmission() {
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
                    showWarningModal('شرکت با موفقیت اضافه شد!', 'success');
                    companyFormModal.reset();
                    addCompanyModal.style.display = 'none';
                    await fetchAllCompanies(); // Re-fetch and re-populate all companies for dropdowns
                    editMainCompanySelect.value = companyData.companyName; // Select the newly added company
                } else {
                    showWarningModal(`خطا: ${result.error || 'افزودن شرکت با شکست مواجه شد.'}`);
                }
            } catch (error) {
                console.error('خطا در افزودن شرکت از طریق مودال:', error);
                showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام افزودن شرکت.');
            }
        });
    }
}


/**
 * Displays contact details in the view modal.
 * @param {number} contactId - The ID of the contact to view.
 */
export async function viewContactDetails(contactId) {
    try {
        const response = await fetch(`/api/contacts/${contactId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contact = await response.json();
        const detailsDiv = document.getElementById('viewContactDetails');
        detailsDiv.innerHTML = ''; // Clear previous details

        // Define the fields to display and their Persian labels
        const fields = {
            full_name: 'نام و نام خانوادگی',
            main_company: 'شرکت / سازمان اصلی',
            job_title: 'عنوان شغلی',
            mobile_phone: 'شماره همراه',
            office_phone1: 'تلفن اداری 1',
            extension1: 'داخلی 1',
            office_phone2: 'تلفن اداری 2',
            extension2: 'داخلی 2',
            office_phone3: 'تلفن اداری 3',
            extension3: 'داخلی 3',
            email: 'ایمیل',
            office_manager_name1: 'نام مسئول دفتر 1',
            office_manager_mobile1: 'شماره همراه مسئول دفتر 1',
            office_manager_name2: 'نام مسئول دفتر 2',
            office_manager_mobile2: 'شماره همراه مسئول دفتر 2',
            office_manager_name3: 'نام مسئول دفتر 3',
            office_manager_mobile3: 'شماره همراه مسئول دفتر 3',
            office_email: 'ایمیل دفتر',
            subject_category: 'دسته بندی موضوع',
            country: 'کشور',
            address: 'آدرس',
            postal_code: 'کدپستی',
            description: 'توضیحات'
        };

        for (const key in fields) {
            if (contact[key]) { // Only display fields that have data
                const label = document.createElement('p');
                label.className = 'font-semibold text-gray-700';
                label.textContent = `${fields[key]}:`;
                const value = document.createElement('p');
                value.className = 'text-gray-600';
                value.textContent = contact[key];
                detailsDiv.appendChild(label);
                detailsDiv.appendChild(value);
            }
        }

        // --- Company Tree Diagram Logic ---
        companyTreeDiv.innerHTML = ''; // Clear previous tree
        companyTreeContainer.classList.add('hidden'); // Hide by default

        const companyHierarchyMap = getCompanyHierarchyMap(); // Get from companyData module
        if (contact.main_company && companyHierarchyMap.size > 0) {
            // Find the root of the hierarchy for the contact's main company
            const rootCompanyNode = findCompanyHierarchyRoot(contact.main_company);

            if (rootCompanyNode) {
                companyTreeContainer.classList.remove('hidden'); // Show tree container
                // Pass the contact's main company name to highlight it
                renderCompanyTreeRecursive(rootCompanyNode, companyTreeDiv, contact.main_company);
            }
        }

        viewContactModal.style.display = 'flex'; // Show modal
    } catch (error) {
        console.error('Error fetching contact details:', error);
        showWarningModal('خطا در بارگذاری جزئیات مخاطب.');
    }
}

/**
 * Recursively renders the company hierarchy tree.
 * @param {object} companyNode - The current company node to render.
 * @param {HTMLElement} parentElement - The DOM element to append the tree to.
 * @param {string} selectedCompanyName - The name of the company to highlight.
 */
function renderCompanyTreeRecursive(companyNode, parentElement, selectedCompanyName) {
    if (!companyNode) return;

    const ul = document.createElement('ul');
    // Apply a class to the root ul for overall tree styling if it's the very first call
    if (parentElement === companyTreeDiv) {
        ul.classList.add('company-tree-root');
    }

    const li = document.createElement('li');
    li.className = 'company-node'; // Use 'company-node' for list items

    const contentDiv = document.createElement('div');
    // Apply 'tree-node-content' for general node styling and 'highlighted-company' for specific highlighting
    contentDiv.className = `tree-node-content ${companyNode.name === selectedCompanyName ? 'highlighted-company' : ''}`;
    contentDiv.textContent = companyNode.name; // Use 'name' from the hierarchy node
    li.appendChild(contentDiv);

    if (companyNode.children && companyNode.children.length > 0) {
        const childrenUl = document.createElement('ul');
        childrenUl.classList.add('company-sub-list'); // Add class for sub-lists
        // Sort children alphabetically for consistent rendering
        Array.from(companyNode.children).sort((a, b) => a.name.localeCompare(b.name, 'fa', { sensitivity: 'base' })).forEach(childNode => {
            // Pass selectedCompanyName down to recursive calls
            renderCompanyTreeRecursive(childNode, childrenUl, selectedCompanyName);
        });
        li.appendChild(childrenUl);
    }
    parentElement.appendChild(li);
}


/**
 * Populates and shows the edit contact modal.
 * @param {number} contactId - The ID of the contact to edit.
 */
export async function editContactDetails(contactId) {
    try {
        const response = await fetch(`/api/contacts/${contactId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contact = await response.json();

        // Populate the form fields
        document.getElementById('editContactId').value = contact.id;
        document.getElementById('editFullName').value = contact.full_name || '';

        // Populate the main company dropdown and set its value
        await populateEditCompanyDropdown(contact.main_company || ''); // Pass current company name for pre-selection

        document.getElementById('editJobTitle').value = contact.job_title || '';
        document.getElementById('editMobilePhone').value = contact.mobile_phone || '';
        document.getElementById('editOfficePhone1').value = contact.office_phone1 || '';
        document.getElementById('editExtension1').value = contact.extension1 || '';
        document.getElementById('editOfficePhone2').value = contact.office_phone2 || '';
        document.getElementById('editExtension2').value = contact.extension2 || '';
        document.getElementById('editOfficePhone3').value = contact.office_phone3 || '';
        document.getElementById('editExtension3').value = contact.extension3 || '';
        document.getElementById('editEmail').value = contact.email || '';
        document.getElementById('editOfficeManagerName1').value = contact.office_manager_name1 || '';
        document.getElementById('editOfficeManagerMobile1').value = contact.office_manager_mobile1 || '';
        document.getElementById('editOfficeManagerName2').value = contact.office_manager_name2 || '';
        document.getElementById('editOfficeManagerMobile2').value = contact.office_manager_mobile2 || '';
        document.getElementById('editOfficeManagerName3').value = contact.office_manager_name3 || '';
        document.getElementById('editOfficeManagerMobile3').value = contact.office_manager_mobile3 || '';
        document.getElementById('editOfficeEmail').value = contact.office_email || '';
        document.getElementById('editSubjectCategory').value = contact.subject_category || '';
        document.getElementById('editCountry').value = contact.country || '';
        document.getElementById('editAddress').value = contact.address || '';
        document.getElementById('editPostalCode').value = contact.postal_code || '';
        document.getElementById('editDescription').value = contact.description || '';

        editContactModal.style.display = 'flex'; // Show modal
    } catch (error) {
        console.error('Error fetching contact for edit:', error);
        showWarningModal('خطا در بارگذاری اطلاعات مخاطب برای ویرایش.');
    }
}

/**
 * Sets up the event listener for the edit contact form submission.
 */
function setupEditFormSubmission() {
    const editContactForm = document.getElementById('editContactForm');
    if (editContactForm) {
        editContactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const contactId = document.getElementById('editContactId').value;
            const formData = new FormData(editContactForm);
            const updatedData = {};
            for (const [key, value] of formData.entries()) {
                updatedData[key] = value;
            }

            // --- Validation Logic ---
            const fullName = updatedData['fullName'] ? updatedData['fullName'].trim() : '';
            const mobilePhone = updatedData['mobilePhone'] ? updatedData['mobilePhone'].trim() : '';
            const officePhone1 = updatedData['officePhone1'] ? updatedData['officePhone1'].trim() : '';
            const officeManagerMobile1 = updatedData['officeManagerMobile1'] ? updatedData['officeManagerMobile1'].trim() : '';

            if (!fullName) {
                showWarningModal('نام و نام خانوادگی الزامی است.');
                return;
            }

            if (!mobilePhone && !officePhone1 && !officeManagerMobile1) {
                showWarningModal('حداقل یکی از فیلدهای "شماره همراه", "تلفن اداری 1" یا "شماره همراه مسئول دفتر 1" باید پر شود.');
                return;
            }
            // --- End Validation Logic ---

            // Ensure affiliated_company fields are not sent or are empty (as they are removed from HTML)
            delete updatedData.affiliatedCompany1;
            delete updatedData.affiliatedCompany2;

            try {
                const response = await fetch(`/api/contacts/${contactId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });

                const result = await response.json();

                if (response.ok) {
                    showWarningModal('مخاطب با موفقیت به‌روزرسانی شد!', 'success');
                    editContactModal.style.display = 'none'; // Close modal
                    if (refreshContactListCallback) {
                        refreshContactListCallback(); // Refresh main table
                    }
                } else {
                    showWarningModal(`خطا: ${result.error || 'به‌روزرسانی مخاطب با شکست مواجه شد.'}`);
                }
            } catch (error) {
                console.error('Error updating contact:', error);
                showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام به‌روزرسانی.');
            }
        });
    }
}

/**
 * Shows the delete confirmation modal for a contact.
 * @param {number} contactId - The ID of the contact to delete.
 */
export function showDeleteConfirmModal(contactId) {
    contactIdToDelete = contactId;
    deleteConfirmModal.style.display = 'flex';
}

/**
 * Handles the actual deletion of a contact after confirmation.
 */
function setupDeleteConfirmation() {
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (contactIdToDelete) {
                try {
                    const response = await fetch(`/api/contacts/${contactIdToDelete}`, {
                        method: 'DELETE',
                    });
                    if (response.ok) {
                        showWarningModal('مخاطب با موفقیت حذف شد!', 'success');
                        deleteConfirmModal.style.display = 'none'; // Close modal
                        if (refreshContactListCallback) {
                            refreshContactListCallback(); // Refresh main table
                        }
                    } else {
                        const result = await response.json();
                        showWarningModal(`خطا: ${result.error || 'حذف مخاطب با شکست مواجه شد.'}`);
                    }
                } catch (error) {
                    console.error('Error deleting contact:', error);
                    showWarningModal('خطای غیرمنتظره‌ای رخ داد هنگام حذف.');
                } finally {
                    contactIdToDelete = null; // Clear stored ID
                }
            }
        });
    }
}
