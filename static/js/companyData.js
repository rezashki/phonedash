// static/js/companyData.js
// This module handles fetching and managing company data, including building the hierarchy.

let allCompaniesData = []; // Store all fetched companies
let companyHierarchyMap = new Map(); // Stores the processed hierarchy: companyName -> { children: [], parent: null/name }

/**
 * Fetches all company data from the API.
 * @returns {Promise<Array>} - A promise that resolves to an array of company objects.
 */
export async function fetchAllCompanies() {
    try {
        const response = await fetch('/api/companies');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allCompaniesData = await response.json();
        buildCompanyHierarchyMap(allCompaniesData); // Build hierarchy map after fetching
        return allCompaniesData;
    } catch (error) {
        console.error('Error fetching all companies:', error);
        return [];
    }
}

/**
 * Builds a hierarchical map of companies based on their main, sub1, and sub2 relationships.
 * @param {Array} companies - An array of company objects.
 */
function buildCompanyHierarchyMap(companies) {
    companyHierarchyMap.clear(); // Clear previous map

    // Initialize nodes for all unique company and sub-company names
    const allUniqueNames = new Set();
    companies.forEach(company => {
        if (company.company_name) allUniqueNames.add(company.company_name);
        if (company.sub_company1) allUniqueNames.add(company.sub_company1);
        if (company.sub_company2) allUniqueNames.add(company.sub_company2);
    });

    allUniqueNames.forEach(name => {
        companyHierarchyMap.set(name, { name: name, children: [], parent: null });
    });

    // Establish relationships
    companies.forEach(company => {
        const companyName = company.company_name;
        const sub1 = company.sub_company1;
        const sub2 = company.sub_company2;

        const mainNode = companyHierarchyMap.get(companyName);

        if (mainNode) {
            // Link sub_company1 to main_company
            if (sub1 && sub1 !== companyName) {
                const sub1Node = companyHierarchyMap.get(sub1);
                if (sub1Node && !mainNode.children.includes(sub1Node)) {
                    mainNode.children.push(sub1Node);
                    sub1Node.parent = companyName;
                }
            }
            // Link sub_company2 directly to main_company if sub1 is empty or same as main
            if (sub2 && sub2 !== companyName && (!sub1 || sub1 === companyName)) {
                const sub2Node = companyHierarchyMap.get(sub2);
                if (sub2Node && !mainNode.children.includes(sub2Node)) {
                    mainNode.children.push(sub2Node);
                    sub2Node.parent = companyName;
                }
            }
        }
        // Link sub_company2 to sub_company1
        if (sub1 && sub2 && sub1 !== companyName && sub2 !== sub1) {
            const sub1Node = companyHierarchyMap.get(sub1);
            const sub2Node = companyHierarchyMap.get(sub2);
            if (sub1Node && sub2Node && !sub1Node.children.includes(sub2Node)) {
                sub1Node.children.push(sub2Node);
                sub2Node.parent = sub1;
            }
        }
    });

    // Sort children for consistent display
    companyHierarchyMap.forEach(node => {
        node.children.sort((a, b) => a.name.localeCompare(b.name, 'fa', { sensitivity: 'base' }));
    });

    console.log('Built Company Hierarchy Map:', companyHierarchyMap);
}

/**
 * Finds the ultimate root of a company in the hierarchy.
 * @param {string} companyName - The name of the company to find the root for.
 * @returns {object|null} - The root company node or null if not found.
 */
export function findCompanyHierarchyRoot(companyName) {
    let currentNode = companyHierarchyMap.get(companyName);
    if (!currentNode) {
        // If the company name from contact is not a main company or sub-company in our list
        // it might be a standalone name, treat it as its own root.
        return { name: companyName, children: [], parent: null };
    }

    while (currentNode.parent) {
        currentNode = companyHierarchyMap.get(currentNode.parent);
        if (!currentNode) { // Should not happen if map is consistent, but safeguard
            break;
        }
    }
    return currentNode;
}

/**
 * Gets all currently loaded company data.
 * @returns {Array} - An array of all company objects.
 */
export function getAllCompaniesData() {
    return allCompaniesData;
}

/**
 * Gets the company hierarchy map.
 * @returns {Map} - The company hierarchy map.
 */
export function getCompanyHierarchyMap() {
    return companyHierarchyMap;
}
