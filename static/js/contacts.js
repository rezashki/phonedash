// JavaScript for contacts.html
// This file orchestrates the functionalities for the contacts view page.

import {
    initContactTable,
    initiateSearchOrLoadMore,
    getAllContactsForExport,
    getCurrentSearchAndSortParams,
    setContactCallbacks,
    columnMap // columnMap is needed for export functionality
    // Removed renderContactTable as it's not exported by contactTable.js based on the error
} from './contactTable.js';
import { fetchAllCompanies } from './companyData.js'; // This now also handles fetching all companies data
import { initContactModals, viewContactDetails, editContactDetails, showDeleteConfirmModal } from './contactModals.js';
import { debounce, showWarningModal } from './utils.js';


document.addEventListener('DOMContentLoaded', async () => {
    console.log('Contacts View page loaded.');

    // --- DOM Elements ---
    const contactListBody = document.querySelector('#contactList tbody');
    const tableHeaders = document.querySelectorAll('#contactList thead th');
    const tableScrollContainer = document.getElementById('tableScrollContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Modals
    const viewContactModal = document.getElementById('viewContactModal');
    const editContactModal = document.getElementById('editContactModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const companyTreeContainer = document.getElementById('companyTreeContainer');
    const companyTreeDiv = document.getElementById('companyTree'); // This is where the tree will be rendered

    // Column Visibility
    const toggleColumnsBtn = document.getElementById('toggleColumnsBtn');
    const columnVisibilityDropdown = document.getElementById('columnVisibilityDropdown');

    // Search and Export/Import
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const importExcelBtn = document.getElementById('importExcelBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const addContactRedirectBtn = document.getElementById('addContactRedirectBtn');

    // Autosuggest
    const autosuggestDropdown = document.getElementById('autosuggestDropdown');

    // Edit Contact Modal specific elements (for passing to contactModals.js)
    const editMainCompanySelect = document.getElementById('editMainCompany');
    const addCompanyModal = document.getElementById('addCompanyModal');
    const companyFormModal = document.getElementById('addCompanyModal').querySelector('form');
    const modalCompanyNameInput = document.getElementById('modalCompanyName');
    const modalSubCompany1Input = document.getElementById('modalSubCompany1');
    const modalSubCompany2Input = document.getElementById('modalSubCompany2');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Bulk Actions
    const bulkActionsContainer = document.getElementById('bulkActionsContainer');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');


    // --- State Variables (managed by contactTable.js, but referenced here) ---
    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'
    let allCompaniesData = []; // This will store all companies for the tree view


    // --- Helper function to render the company tree ---
    function renderCompanyTree(contactMainCompany, companies) {
        companyTreeDiv.innerHTML = ''; // Clear previous tree
        companyTreeContainer.style.display = 'none'; // Hide by default

        if (!contactMainCompany || !companies || companies.length === 0) {
            return;
        }

        // Step 1: Build a comprehensive parent-child relationship graph
        // This map will store: companyName -> { data: companyObject, children: Set<string> }
        const companyGraph = new Map();

        // Initialize all known companies/sub-companies in the graph
        companies.forEach(company => {
            if (!companyGraph.has(company.company_name)) {
                companyGraph.set(company.company_name, { data: company, children: new Set() });
            }
            if (company.sub_company1) {
                if (!companyGraph.has(company.sub_company1)) {
                    companyGraph.set(company.sub_company1, { data: { company_name: company.sub_company1 }, children: new Set() });
                }
            }
            if (company.sub_company2) {
                if (!companyGraph.has(company.sub_company2)) {
                    companyGraph.set(company.sub_company2, { data: { company_name: company.sub_company2 }, children: new Set() });
                }
            }
        });

        // Populate children relationships
        companies.forEach(company => {
            const parentNode = companyGraph.get(company.company_name);
            if (parentNode) {
                if (company.sub_company1 && company.sub_company1 !== company.company_name) {
                    parentNode.children.add(company.sub_company1);
                }
                if (company.sub_company2 && company.sub_company2 !== company.sub_company1 && company.sub_company2 !== company.company_name) {
                    // If sub_company1 exists, sub_company2 is its child, otherwise child of main company
                    const directParentForSub2 = company.sub_company1 || company.company_name;
                    const directParentNode = companyGraph.get(directParentForSub2);
                    if (directParentNode) {
                        directParentNode.children.add(company.sub_company2);
                    }
                }
            }
        });

        // Step 2: Find the ultimate root parent of the contact's main company
        let ultimateRoot = contactMainCompany;
        let foundParentInIteration = true;

        // Keep searching upwards until no more parents are found
        while (foundParentInIteration) {
            foundParentInIteration = false;
            for (const company of companies) {
                if (company.sub_company1 === ultimateRoot || company.sub_company2 === ultimateRoot) {
                    ultimateRoot = company.company_name; // Move up to the parent
                    foundParentInIteration = true;
                    break; // Found a parent, restart search from this new parent
                }
            }
        }

        // Step 3: Recursively build the tree HTML from the ultimate root
        function buildTreeHtml(nodeName, currentContactCompany) {
            let html = '';
            const isHighlighted = (nodeName === currentContactCompany);
            const nodeClass = isHighlighted ? 'highlighted-company' : '';

            html += `<li class="company-node">`;
            html += `<div class="tree-node-content ${nodeClass}">${nodeName}</div>`;

            const node = companyGraph.get(nodeName);
            if (node && node.children.size > 0) {
                html += `<ul class="company-sub-list">`;
                // Sort children alphabetically for consistent rendering
                Array.from(node.children).sort((a, b) => a.localeCompare(b, 'fa', { sensitivity: 'base' })).forEach(child => {
                    html += buildTreeHtml(child, currentContactCompany);
                });
                html += `</ul>`;
            }
            html += `</li>`;
            return html;
        }

        // Render the tree
        const treeHtml = buildTreeHtml(ultimateRoot, contactMainCompany);
        companyTreeDiv.innerHTML = `<ul class="company-tree-root">${treeHtml}</ul>`;
        companyTreeContainer.style.display = 'block';
    }

    // --- Function to update bulk actions visibility and row highlights ---
    function updateBulkActionsAndHighlights() {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        let checkedCount = 0;
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (checkbox.checked) {
                checkedCount++;
                row.classList.add('selected-row-highlight');
            } else {
                row.classList.remove('selected-row-highlight');
            }
        });

        if (checkedCount > 0) {
            bulkActionsContainer.classList.remove('hidden');
            bulkActionsContainer.classList.add('flex');
        } else {
            bulkActionsContainer.classList.add('hidden');
            bulkActionsContainer.classList.remove('flex');
        }

        // Update selectAllCheckbox state
        selectAllCheckbox.checked = checkedCount === checkboxes.length && checkboxes.length > 0;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }


    // --- Initialization Functions ---

    // 1. Fetch all companies early for dropdowns and tree diagrams
    allCompaniesData = await fetchAllCompanies(); // Store fetched companies globally

    // 2. Initialize Contact Table functionality
    initContactTable(
        contactListBody, tableHeaders, tableScrollContainer, loadingIndicator, selectAllCheckbox,
        columnVisibilityDropdown, toggleColumnsBtn, updateBulkActionsAndHighlights // Pass the new callback
    );

    // 3. Initialize Contact Modals functionality
    // Pass renderCompanyTree and allCompaniesData to initContactModals
    initContactModals({
        viewContactModal, editContactModal, deleteConfirmModal,
        companyTreeContainer, companyTreeDiv, editMainCompanySelect,
        addCompanyModal, companyFormModal, modalCompanyNameInput,
        modalSubCompany1Input, modalSubCompany2Input, confirmDeleteBtn,
        renderCompanyTreeCallback: renderCompanyTree, // Pass the render function
        allCompanies: allCompaniesData // Pass all companies data
    }, () => {
        initiateSearchOrLoadMore('', currentSortColumn, currentSortDirection);
        // Ensure updateBulkActionsAndHighlights is called after table refresh
        // to correctly reflect checkbox states and bulk action bar visibility
        updateBulkActionsAndHighlights();
    }); // Pass refresh callback

    // 4. Set callbacks for actions from contactTable.js (buttons in table rows)
    setContactCallbacks(viewContactDetails, editContactDetails, showDeleteConfirmModal);


    // 5. Initial fetch of contacts for the table
    initiateSearchOrLoadMore('', currentSortColumn, currentSortDirection);


    // --- Event Listeners ---

    // Event listener for individual row checkboxes (delegated to contactListBody)
    contactListBody.addEventListener('change', (event) => {
        if (event.target.classList.contains('row-checkbox')) {
            updateBulkActionsAndHighlights();
        }
    });

    // Event listener for select all checkbox
    selectAllCheckbox.addEventListener('change', () => {
        const isChecked = selectAllCheckbox.checked;
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        updateBulkActionsAndHighlights();
    });

    // Debounced search input handler for main table search
    const debouncedTableSearch = debounce(() => initiateSearchOrLoadMore(searchInput.value.trim().toLowerCase(), currentSortColumn, currentSortDirection), 300);

    // Debounced search input handler for autosuggest
    const debouncedAutosuggest = debounce(() => {
        const term = searchInput.value.trim();
        if (term.length > 0) {
            fetchSuggestions(term);
        } else {
            autosuggestDropdown.style.display = 'none';
        }
    }, 100);

    // Function to fetch suggestions for the autosuggest dropdown
    async function fetchSuggestions(term) {
        if (term.length < 2) {
            autosuggestDropdown.style.display = 'none';
            return;
        }
        try {
            const params = new URLSearchParams({
                term: term,
                offset: 0,
                limit: 10
            });
            const response = await fetch(`/api/contacts/search?${params.toString()}`);
            const data = await response.json();
            populateAutosuggestDropdown(data.contacts);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            autosuggestDropdown.style.display = 'none';
        }
    }

    // Function to populate the autosuggest dropdown
    function populateAutosuggestDropdown(suggestions) {
        autosuggestDropdown.innerHTML = '';
        if (suggestions.length === 0) {
            autosuggestDropdown.style.display = 'none';
            return;
        }

        suggestions.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'autosuggest-item';
            item.textContent = contact.full_name + (contact.main_company ? ` (${contact.main_company})` : '');
            item.dataset.fullName = contact.full_name;
            item.addEventListener('click', () => {
                searchInput.value = item.dataset.fullName;
                autosuggestDropdown.style.display = 'none';
                initiateSearchOrLoadMore(searchInput.value.trim().toLowerCase(), currentSortColumn, currentSortDirection);
            });
            autosuggestDropdown.appendChild(item);
        });
        autosuggestDropdown.style.display = 'block';
    }


    // Event listeners for sortable headers
    document.querySelectorAll('.sortable-header').forEach(button => {
        button.addEventListener('click', (event) => {
            // Close any other open dropdowns
            document.querySelectorAll('.sort-dropdown-menu').forEach(menu => {
                if (menu !== event.currentTarget.nextElementSibling) {
                    menu.style.display = 'none';
                }
            });

            // Toggle the current dropdown
            const dropdown = event.currentTarget.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Event listeners for sort direction buttons within the dropdowns
    document.querySelectorAll('.sort-dropdown-menu button').forEach(sortButton => {
        sortButton.addEventListener('click', (event) => {
            const sortKey = event.target.closest('.sort-dropdown-menu').dataset.sortFor;
            const direction = event.target.dataset.direction;

            currentSortColumn = sortKey;
            currentSortDirection = direction;

            // Update sort icon
            document.querySelectorAll('.sort-icon').forEach(icon => {
                icon.classList.remove('asc', 'desc');
            });
            const currentSortIcon = event.target.closest('.sortable-header').querySelector('.sort-icon');
            if (currentSortIcon) {
                currentSortIcon.classList.add(direction);
            }

            initiateSearchOrLoadMore(searchInput.value.trim().toLowerCase(), currentSortColumn, currentSortDirection);
            // Close the dropdown after selection
            event.target.closest('.sort-dropdown-menu').style.display = 'none';
        });
    });

    // Close sort dropdowns when clicking outside
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.sort-dropdown-menu').forEach(menu => {
            const headerButton = menu.previousElementSibling; // The sortable-header button
            if (headerButton && !headerButton.contains(event.target) && !menu.contains(event.target)) {
                menu.style.display = 'none';
            }
        });
    });

    // Search button click (now acts as a clear button)
    searchBtn.addEventListener('click', () => {
        searchInput.value = ''; // Clear the search input
        autosuggestDropdown.style.display = 'none'; // Hide autosuggest dropdown
        initiateSearchOrLoadMore('', currentSortColumn, currentSortDirection); // Trigger a new search with an empty term to show all contacts
    });

    // Real-time search on input for both table and autosuggest
    searchInput.addEventListener('input', () => {
        debouncedTableSearch(); // For updating the main table
        debouncedAutosuggest(); // For updating the autosuggest dropdown
    });

    // Search on Enter key press (still clears the field)
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            autosuggestDropdown.style.display = 'none'; // Hide autosuggest on Enter
            searchInput.value = ''; // Clear the search input after search on Enter
            initiateSearchOrLoadMore('', currentSortColumn, currentSortDirection); // Re-trigger search to show all contacts
        }
    });


    // Export to Excel functionality
    exportExcelBtn.addEventListener('click', async () => {
        const selectedContactIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
                                       .map(checkbox => parseInt(checkbox.dataset.id));

        let dataToExport = [];
        if (selectedContactIds.length > 0) {
            // Export only selected rows from the currently loaded data
            dataToExport = getAllContactsForExport().filter(contact => selectedContactIds.includes(contact.id));
        } else {
            // If no rows are selected, fetch ALL contacts matching the current search/sort for export
            try {
                loadingIndicator.style.display = 'block';
                const { term, sort_by, sort_direction } = getCurrentSearchAndSortParams();
                const params = new URLSearchParams({
                    term: term,
                    sort_by: sort_by || '',
                    sort_direction: sort_direction,
                    export_all: 'true' // Indicate to backend to send all data
                });
                const response = await fetch(`/api/contacts/search?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch all contacts for export.');
                const result = await response.json();
                dataToExport = result.contacts;
            } catch (error) {
                console.error('Error fetching all contacts for export:', error);
                showWarningModal('خطا در بارگذاری تمامی مخاطبین برای خروجی اکسل.');
                return; // Exit function if error
            } finally {
                loadingIndicator.style.display = 'none';
            }
        }

        if (dataToExport.length === 0) {
            showWarningModal('هیچ مخاطبی برای خروجی انتخاب نشده است.');
            return;
        }

        // Prepare data for SheetJS - Include ALL fields from columnMap, not just visible ones
        const exportData = dataToExport.map(contact => {
            const rowData = {};
            for (const key in columnMap) { // columnMap is imported from contactTable.js
                // Include all fields from columnMap, regardless of current visibility
                rowData[columnMap[key]] = contact[key] || ''; // Use display name as header
            }
            return rowData;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contacts");
        XLSX.writeFile(wb, "contacts.xlsx");
    });

    // Delete Selected Contacts functionality
    deleteSelectedBtn.addEventListener('click', async () => {
        const selectedContactIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
                                       .map(checkbox => parseInt(checkbox.dataset.id));

        if (selectedContactIds.length === 0) {
            showWarningModal('هیچ مخاطبی برای حذف انتخاب نشده است.');
            return;
        }

        // Show a confirmation modal for bulk delete
        const confirmBulkDeleteModal = document.createElement('div');
        confirmBulkDeleteModal.id = 'confirmBulkDeleteModal';
        confirmBulkDeleteModal.className = 'modal';
        confirmBulkDeleteModal.innerHTML = `
            <div class="modal-content text-center">
                <span class="close-button">&times;</span>
                <h2 class="text-2xl font-bold mb-4 text-gray-800">تایید حذف گروهی</h2>
                <p class="mb-6 text-gray-700">آیا مطمئن هستید که می‌خواهید ${selectedContactIds.length} مخاطب انتخاب شده را حذف کنید؟ این عمل قابل بازگشت نیست.</p>
                <div class="flex justify-center space-x-4 space-x-reverse">
                    <button id="confirmBulkDeleteBtn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">حذف</button>
                    <button class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md close-button-bottom">لغو</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmBulkDeleteModal);
        confirmBulkDeleteModal.style.display = 'flex';

        const closeBulkDeleteModal = () => {
            confirmBulkDeleteModal.style.display = 'none';
            document.body.removeChild(confirmBulkDeleteModal);
        };

        confirmBulkDeleteModal.querySelector('.close-button').addEventListener('click', closeBulkDeleteModal);
        confirmBulkDeleteModal.querySelector('.close-button-bottom').addEventListener('click', closeBulkDeleteModal);
        confirmBulkDeleteModal.addEventListener('click', (event) => {
            if (event.target === confirmBulkDeleteModal) {
                closeBulkDeleteModal();
            }
        });

        document.getElementById('confirmBulkDeleteBtn').addEventListener('click', async () => {
            loadingIndicator.style.display = 'block';
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const id of selectedContactIds) {
                try {
                    const response = await fetch(`/api/contacts/${id}`, {
                        method: 'DELETE',
                    });
                    if (response.ok) {
                        successCount++;
                    } else {
                        const result = await response.json();
                        errors.push(`خطا در حذف مخاطب با شناسه ${id}: ${result.error || 'خطای ناشناخته'}`);
                        errorCount++;
                    }
                } catch (error) {
                    errors.push(`خطا در حذف مخاطب با شناسه ${id}: ${error.message}`);
                    errorCount++;
                }
            }

            loadingIndicator.style.display = 'none';
            closeBulkDeleteModal();

            let message = `عملیات حذف گروهی پایان یافت:\n`;
            message += `تعداد مخاطبین با موفقیت حذف شده: ${successCount}\n`;
            message += `تعداد مخاطبین حذف نشده (به دلیل خطا): ${errorCount}\n`;
            if (errors.length > 0) {
                message += `جزئیات خطاها:\n${errors.join('\n')}`;
            }
            showWarningModal(message, errorCount === 0 ? 'success' : 'error');

            // After deletion, refresh the table and update bulk actions state
            initiateSearchOrLoadMore('', currentSortColumn, currentSortDirection);
            selectAllCheckbox.checked = false; // Uncheck select all after bulk action
            updateBulkActionsAndHighlights();
        });
    });


    // Import from Excel functionality
    importExcelBtn.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx, .xls';
        fileInput.style.display = 'none';

        document.body.appendChild(fileInput);
        fileInput.click();

        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                document.body.removeChild(fileInput); // Clean up
                return;
            }

            loadingIndicator.style.display = 'block';

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

                    if (jsonData.length === 0) {
                        showWarningModal('فایل اکسل خالی است یا فرمت آن صحیح نیست.');
                        return;
                    }

                    const headers = jsonData[0];
                    const excelToDbMap = {
                        'نام و نام خانوادگی': 'fullName',
                        'شرکت / سازمان اصلی': 'mainCompany',
                        'عنوان شغلی': 'jobTitle',
                        'شماره همراه': 'mobilePhone',
                        'تلفن اداری 1': 'officePhone1',
                        'داخلی 1': 'extension1',
                        'تلفن اداری 2': 'officePhone2',
                        'داخلی 2': 'extension2',
                        'تلفن اداری 3': 'officePhone3',
                        'داخلی 3': 'extension3',
                        'ایمیل': 'email',
                        'نام مسئول دفتر 1': 'officeManagerName1',
                        'شماره همراه مسئول دفتر 1': 'officeManagerMobile1',
                        'نام مسئول دفتر 2': 'officeManagerName2',
                        'شماره همراه مسئول دفتر 2': 'officeManagerMobile2',
                        'نام مسئول دفتر 3': 'officeManagerName3',
                        'شماره همراه مسئول دفتر 3': 'officeManagerMobile3',
                        'ایمیل دفتر': 'officeEmail',
                        'دسته بندی موضوع': 'subjectCategory',
                        'کشور': 'country',
                        'آدرس': 'address',
                        'کدپستی': 'postalCode',
                        'توضیحات': 'description'
                    };

                    const missingHeaders = Object.keys(excelToDbMap).filter(excelHeader => !headers.includes(excelHeader));
                    if (missingHeaders.length > 0) {
                        showWarningModal(`خطا: ستون‌های زیر در فایل اکسل یافت نشدند: ${missingHeaders.join(', ')}. لطفا فایل با فرمت صحیح را بارگذاری کنید.`);
                        return;
                    }

                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await fetch('/api/contacts/import', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok) {
                        let message = `عملیات وارد کردن اطلاعات اکسل با موفقیت انجام شد:\n`;
                        message += `تعداد مخاطبین وارد شده: ${result.imported_count}\n`;
                        message += `تعداد مخاطبین به‌روزرسانی شده: ${result.updated_count}\n`;
                        message += `تعداد ردیف‌های نادیده گرفته شده (به دلیل خطا/اطلاعات ناقص): ${result.skipped_count}\n`;
                        if (result.errors && result.errors.length > 0) {
                            message += `خطاها:\n${result.errors.join('\n')}`;
                        }
                        showWarningModal(message, 'success');
                        initiateSearchOrLoadMore('', currentSortColumn, currentSortDirection);
                    } else {
                        showWarningModal(`خطا در وارد کردن اطلاعات اکسل: ${result.error || 'خطای ناشناخته'}`);
                    }
                } catch (error) {
                    console.error('Error processing Excel file:', error);
                    showWarningModal(`خطا در پردازش فایل اکسل: ${error.message || 'فایل نامعتبر است.'}`);
                } finally {
                    loadingIndicator.style.display = 'none';
                    document.body.removeChild(fileInput);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    });

    // Event listener for the new "Add New Contact" button
    if (addContactRedirectBtn) {
        addContactRedirectBtn.addEventListener('click', () => {
            window.location.href = 'contacts_entry.html';
        });
    }
});
