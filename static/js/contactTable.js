// static/js/contactTable.js
// This file handles rendering contacts, pagination, infinite scroll, and applying column visibility.

// DOM elements (will be passed from main contacts.js or queried here if self-contained)
let contactListBody;
let tableHeaders;
let tableScrollContainer;
let loadingIndicator;
let selectAllCheckbox; // For table-wide select/deselect
let columnVisibilityDropdown; // For column visibility menu
let toggleColumnsBtn; // Button to open/close column visibility dropdown

// Data and state for table
let allContactsData = []; // Store all fetched contacts (currently only for export, as display is paginated)
let currentDisplayedContacts = []; // Store contacts currently displayed in the table

// Pagination/Infinite Scroll state
let currentPage = 0;
const itemsPerPage = 50; // Number of items to fetch per scroll
let isLoading = false;
let hasMoreData = true;
let currentSearchTerm = '';
let currentSortColumn = null;
let currentSortDirection = 'asc'; // 'asc' or 'desc'

// Define column mapping for display names and data keys
export const columnMap = {
    'full_name': 'نام و نام خانوادگی',
    'main_company': 'شرکت / سازمان اصلی',
    'job_title': 'عنوان شغلی',
    'mobile_phone': 'شماره همراه',
    'office_phone1': 'تلفن اداری 1',
    'extension1': 'داخلی 1',
    'office_phone2': 'تلفن اداری 2',
    'extension2': 'داخلی 2',
    'office_phone3': 'تلفن اداری 3',
    'extension3': 'داخلی 3',
    'email': 'ایمیل',
    'office_manager_name1': 'نام مسئول دفتر 1',
    'office_manager_mobile1': 'شماره همراه مسئول دفتر 1',
    'office_manager_name2': 'نام مسئول دفتر 2',
    'office_manager_mobile2': 'شماره همراه مسئول دفتر 2',
    'office_manager_name3': 'نام مسئول دفتر 3',
    'office_manager_mobile3': 'شماره همراه مسئول دفتر 3',
    'office_email': 'ایمیل دفتر',
    'subject_category': 'دسته بندی موضوع',
    'country': 'کشور',
    'address': 'آدرس',
    'postal_code': 'کدپستی',
    'description': 'توضیحات'
};

// Define which keys correspond to phone number columns for styling
const phoneNumberKeys = [
    'mobile_phone', 'office_phone1', 'extension1', 'office_phone2', 'extension2', 'office_phone3', 'extension3',
    'office_manager_mobile1', 'office_manager_mobile2', 'office_manager_mobile3'
];

// Initial state for column visibility (all visible by default)
let columnVisibility = JSON.parse(localStorage.getItem('columnVisibility')) || Object.keys(columnMap).reduce((acc, key) => {
    acc[key] = true; // All columns visible by default
    return acc;
}, {});

// Ensure 'full_name' and 'main_company' are always visible and cannot be toggled off
columnVisibility['full_name'] = true;
columnVisibility['main_company'] = true;

// Callback functions for external interactions (e.g., opening modals)
let onViewContactCallback = null;
let onEditContactCallback = null;
let onDeleteContactCallback = null;

export function setContactCallbacks(viewCb, editCb, deleteCb) {
    onViewContactCallback = viewCb;
    onEditContactCallback = editCb;
    onDeleteContactCallback = deleteCb;
}

export function initContactTable(
    bodyElement, headersElement, scrollContainerElement, loadingIndicatorElement, selectAllCbElement,
    columnVisibilityDropdownElement, toggleColumnsBtnElement
) {
    contactListBody = bodyElement;
    tableHeaders = headersElement;
    tableScrollContainer = scrollContainerElement;
    loadingIndicator = loadingIndicatorElement;
    selectAllCheckbox = selectAllCbElement;
    columnVisibilityDropdown = columnVisibilityDropdownElement;
    toggleColumnsBtn = toggleColumnsBtnElement;

    console.log('initContactTable called.');
    console.log('toggleColumnsBtn element:', toggleColumnsBtn);
    console.log('columnVisibilityDropdown element:', columnVisibilityDropdown);


    // Initial setup for column visibility dropdown
    populateColumnVisibilityDropdown();
    // Ensure the dropdown is hidden on page load
    if (columnVisibilityDropdown) {
        columnVisibilityDropdown.style.display = 'none';
        console.log('Initial columnVisibilityDropdown display set to none.');
    }


    // Event listeners
    if (toggleColumnsBtn) {
        toggleColumnsBtn.addEventListener('click', (event) => {
            console.log('toggleColumnsBtn clicked!');
            event.stopPropagation(); // Prevent click from immediately closing dropdown
            if (columnVisibilityDropdown) {
                const isVisible = columnVisibilityDropdown.style.display === 'block';
                console.log('Current dropdown visibility:', isVisible ? 'block' : 'none');
                columnVisibilityDropdown.style.display = isVisible ? 'none' : 'block';
                console.log('New dropdown visibility:', columnVisibilityDropdown.style.display);
                // When opening, update the state of the "Select/Deselect All" checkbox
                if (!isVisible) { // Only update when opening
                    updateToggleAllCheckboxState();
                }
            } else {
                console.error('columnVisibilityDropdown is null when toggleColumnsBtn was clicked.');
            }
        });
    }

    // Close dropdown when clicking outside
    window.addEventListener('click', (event) => {
        if (columnVisibilityDropdown && toggleColumnsBtn && !toggleColumnsBtn.contains(event.target) && !columnVisibilityDropdown.contains(event.target)) {
            if (columnVisibilityDropdown.style.display === 'block') { // Only hide if currently visible
                columnVisibilityDropdown.style.display = 'none';
                console.log('Clicked outside, hiding columnVisibilityDropdown.');
            }
        }
    });

    // Select All Checkbox logic for table rows
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (event) => {
            const isChecked = event.target.checked;
            document.querySelectorAll('.row-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }

    // Infinite scrolling logic
    if (tableScrollContainer) {
        tableScrollContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = tableScrollContainer;
            // Check if user scrolled to the bottom (within a small threshold)
            if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading && hasMoreData) {
                fetchContacts(currentSearchTerm, currentPage * itemsPerPage, itemsPerPage, currentSortColumn, currentSortDirection);
            }
        });
    }
}


// Debounce function
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Populate column visibility dropdown
export function populateColumnVisibilityDropdown() {
    if (!columnVisibilityDropdown) return; // Ensure element exists

    columnVisibilityDropdown.innerHTML = ''; // Clear existing checkboxes

    // Add the "Select Columns" header
    const header = document.createElement('p');
    header.className = 'text-sm font-semibold text-gray-500 px-3 py-1 text-right';
    header.textContent = 'انتخاب ستون‌ها';
    columnVisibilityDropdown.appendChild(header);

    // Add Select/Deselect All checkbox
    const selectAllLabel = document.createElement('label');
    // For RTL, to have [Text] [Checkbox] visually, with checkbox on the right:
    // Use flex items-center justify-between and w-full. HTML order: <span> then <input>.
    selectAllLabel.className = 'flex items-center cursor-pointer justify-between w-full border-b pb-2 mb-2 border-gray-200';
    selectAllLabel.innerHTML = `
        <span class="font-bold">انتخاب/عدم انتخاب همه</span>
        <input type="checkbox" id="toggleAllColumnsCheckbox" class="form-checkbox text-blue-600 rounded">
    `;
    columnVisibilityDropdown.appendChild(selectAllLabel);

    // Add event listener for Select/Deselect All checkbox
    const toggleAllColumnsCheckbox = document.getElementById('toggleAllColumnsCheckbox');
    if (toggleAllColumnsCheckbox) {
        toggleAllColumnsCheckbox.addEventListener('change', (event) => {
            const isChecked = event.target.checked;
            for (const key in columnMap) {
                // Only toggle columns that are not 'full_name' or 'main_company'
                if (key !== 'full_name' && key !== 'main_company') {
                    columnVisibility[key] = isChecked;
                    // Update individual checkboxes in the dropdown
                    const individualCheckbox = columnVisibilityDropdown.querySelector(`input[data-column-key="${key}"]`);
                    if (individualCheckbox) {
                        individualCheckbox.checked = isChecked;
                    }
                }
            }
            localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility));
            renderContacts(currentDisplayedContacts); // Re-render with current data to apply visibility
        });
    }


    for (const key in columnMap) {
        // Skip 'full_name' and 'main_company' as they should always be visible
        if (key === 'full_name' || key === 'main_company') {
            continue;
        }

        const label = document.createElement('label');
        // Apply the same RTL logic for individual column checkboxes
        label.className = 'flex items-center cursor-pointer justify-between w-full';
        label.innerHTML = `
            <span>${columnMap[key]}</span>
            <input type="checkbox" data-column-key="${key}" ${columnVisibility[key] ? 'checked' : ''} class="form-checkbox text-blue-600 rounded">
        `;
        columnVisibilityDropdown.appendChild(label);
    }

    // Add event listeners to individual column checkboxes
    columnVisibilityDropdown.querySelectorAll('input[type="checkbox"]:not(#toggleAllColumnsCheckbox)').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const columnKey = event.target.dataset.columnKey;
            columnVisibility[columnKey] = event.target.checked;
            localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility)); // Save state
            renderContacts(currentDisplayedContacts); // Re-render with current data to apply changes
            updateToggleAllCheckboxState(); // Update the master checkbox
        });
    });

    // Initial update of the master checkbox state
    updateToggleAllCheckboxState();
}

// Function to update the state of the "Select/Deselect All" checkbox
export function updateToggleAllCheckboxState() {
    const toggleAllColumnsCheckbox = document.getElementById('toggleAllColumnsCheckbox');
    if (!toggleAllColumnsCheckbox) return; // Exit if the checkbox doesn't exist yet

    const togglableColumnKeys = Object.keys(columnMap).filter(key => key !== 'full_name' && key !== 'main_company');
    const totalTogglable = togglableColumnKeys.length;

    let visibleTogglableCount = 0;
    togglableColumnKeys.forEach(key => {
        if (columnVisibility[key]) {
            visibleTogglableCount++;
        }
    });

    if (totalTogglable === 0) {
        toggleAllColumnsCheckbox.checked = false;
        toggleAllColumnsCheckbox.indeterminate = false;
    } else if (visibleTogglableCount === totalTogglable) {
        toggleAllColumnsCheckbox.checked = true;
        toggleAllColumnsCheckbox.indeterminate = false;
    } else if (visibleTogglableCount > 0) {
        toggleAllColumnsCheckbox.checked = false;
        toggleAllColumnsCheckbox.indeterminate = true;
    } else {
        toggleAllColumnsCheckbox.checked = false;
        toggleAllColumnsCheckbox.indeterminate = false;
    }
}


// Apply column visibility to the table
export function applyColumnVisibility() {
    if (!tableHeaders || !contactListBody) return;

    tableHeaders.forEach(header => {
        const sortableButton = header.querySelector('.sortable-header');
        let actualColumnKey = null;

        if (sortableButton) {
            actualColumnKey = sortableButton.dataset.sort;
        }

        // Always show checkbox, actions, and explicitly 'full_name' and 'main_company'
        if (header.querySelector('#selectAllCheckbox') || actualColumnKey === 'full_name' || actualColumnKey === 'main_company') {
            header.style.display = '';
        } else if (header.dataset.columnType === 'actions') { // The actions column
            header.style.display = '';
        }
        else if (actualColumnKey && columnVisibility[actualColumnKey]) {
            header.style.display = ''; // Show header
        } else if (actualColumnKey) {
            header.style.display = 'none'; // Hide header
        }
    });

    // Loop through all rows and hide/show cells
    document.querySelectorAll('#contactList tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        let cellIndex = 0;

        // Checkbox column (index 0) - always visible
        if (cells[cellIndex]) {
            cells[cellIndex++].style.display = '';
        }


        // Data columns based on columnMap
        for (const key in columnMap) {
            if (cells[cellIndex]) { // Ensure cell exists
                // Explicitly ensure 'full_name' and 'main_company' are always visible in rows
                if (key === 'full_name' || key === 'main_company' || columnVisibility[key]) {
                    cells[cellIndex].style.display = ''; // Show cell
                } else {
                    cells[cellIndex].style.display = 'none'; // Hide cell
                }
            }
            cellIndex++;
        }
        // Actions column - always visible
        if (cells[cellIndex]) { // Check if actions column exists
            cells[cellIndex].style.display = '';
        }
    });
}


// Function to render contacts into the table
export function renderContacts(contactsToRender, append = false) {
    if (!contactListBody) return; // Ensure element exists

    if (!append) {
        contactListBody.innerHTML = ''; // Clear existing rows if not appending
        currentDisplayedContacts = []; // Reset displayed contacts
    }

    if (contactsToRender.length === 0 && !append) {
        const noContactsRow = document.createElement('tr');
        noContactsRow.innerHTML = `<td colspan="26" class="py-3 px-6 text-center text-gray-500">هیچ مخاطبی یافت نشد.</td>`;
        contactListBody.appendChild(noContactsRow);
        return;
    }

    contactsToRender.forEach(contact => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-100';
        row.dataset.contactId = contact.id; // Store contact ID on the row

        let rowHtml = `
            <td class="py-3 px-6 text-center">
                <input type="checkbox" class="row-checkbox form-checkbox text-blue-600 rounded" data-id="${contact.id}">
            </td>
        `;
        for (const key in columnMap) {
            // Add 'phone-number-column' class to relevant cells
            const isPhoneNumberColumn = phoneNumberKeys.includes(key);
            const extraClass = isPhoneNumberColumn ? 'phone-number-column' : '';
            rowHtml += `<td class="py-3 px-6 text-right ${extraClass}">${contact[key] || ''}</td>`;
        }

        rowHtml += `
            <td class="py-3 px-6 text-center whitespace-nowrap">
                <button class="text-blue-500 hover:text-blue-700 mx-1 view-btn" data-id="${contact.id}" title="مشاهده">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button class="text-yellow-500 hover:text-yellow-700 mx-1 edit-btn" data-id="${contact.id}" title="ویرایش">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button class="text-red-500 hover:text-red-700 mx-1 delete-btn" data-id="${contact.id}" title="حذف">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </td>
        `;
        row.innerHTML = rowHtml;
        contactListBody.appendChild(row);
        currentDisplayedContacts.push(contact); // Add to currently displayed
    });

    // Re-apply column visibility after rendering new rows
    applyColumnVisibility();
    updateSelectAllCheckboxState(); // Update select all checkbox after rendering

    // Add event listeners for view, edit, and delete buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const contactId = event.target.closest('button').dataset.id;
            if (onViewContactCallback) onViewContactCallback(contactId);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const contactId = event.target.closest('button').dataset.id;
            if (onEditContactCallback) onEditContactCallback(contactId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const contactId = event.target.closest('button').dataset.id;
            if (onDeleteContactCallback) onDeleteContactCallback(contactId);
        });
    });

    // Add event listeners for individual row checkboxes
    document.querySelectorAll('.row-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectAllCheckboxState);
    });
}

// Function to update Select All Checkbox state based on individual row checkboxes
export function updateSelectAllCheckboxState() {
    if (!selectAllCheckbox) return;

    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    if (allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}


// Function to fetch contacts from the server with pagination and search
export async function fetchContacts(term = '', offset = 0, limit = itemsPerPage, sortCol = null, sortDir = 'asc') {
    if (isLoading && offset !== 0) return; // Prevent multiple loads for infinite scroll, but allow initial load

    isLoading = true;
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }

    try {
        const params = new URLSearchParams({
            term: term,
            offset: offset,
            limit: limit,
            sort_by: sortCol || '',
            sort_direction: sortDir
        });
        const response = await fetch(`/api/contacts/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const contacts = data.contacts;
        const totalCount = data.total_count;

        if (offset === 0) { // New search or initial load
            renderContacts(contacts, false); // Clear and render
        } else {
            renderContacts(contacts, true); // Append
        }

        // Update hasMoreData based on total count and current displayed contacts
        hasMoreData = (currentDisplayedContacts.length) < totalCount;
        currentPage++; // Increment page only after successful fetch and render

        // For export functionality, we might still need all contacts.
        // This would require a separate, non-paginated fetch for export or generating on the backend.
        if (offset === 0) {
            allContactsData = contacts;
        } else {
            allContactsData = allContactsData.concat(contacts);
        }


    } catch (error) {
        console.error('Error fetching contacts:', error);
        if (contactListBody && offset === 0) {
            contactListBody.innerHTML = `<td colspan="26" class="py-3 px-6 text-center text-red-500">خطا در بارگذاری مخاطبین.</td>`;
        }
        hasMoreData = false; // Stop trying to load more if there's an error
    } finally {
        isLoading = false;
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

export function initiateSearchOrLoadMore(term = '', sortCol = null, sortDir = 'asc') {
    currentPage = 0; // Reset page for new search/sort
    hasMoreData = true; // Assume more data until proven otherwise
    currentSearchTerm = term; // Update current search term
    currentSortColumn = sortCol;
    currentSortDirection = sortDir;
    // Reset scroll position to top when a new search/sort is initiated
    if (tableScrollContainer) {
        tableScrollContainer.scrollTop = 0;
    }
    fetchContacts(currentSearchTerm, currentPage * itemsPerPage, itemsPerPage, currentSortColumn, currentSortDirection);
}

// Export data for Excel operations
export function getAllContactsForExport() {
    return allContactsData;
}

export function getCurrentSearchAndSortParams() {
    return {
        term: currentSearchTerm,
        sort_by: currentSortColumn,
        sort_direction: currentSortDirection
    };
}
