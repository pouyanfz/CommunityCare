// Attach form listener when page loads
export function initAddDonationForm() {
    const form = document.getElementById('addDonationForm');
    if (form) {
        form.addEventListener('submit', handleAddDonation);
    }

    // Load donation table on page load
    fetchAndDisplayDonation();
    fetchDonationSummary();
    loadDonorAndProjectOptions();
}

// Add donation from modal
export async function handleAddDonation(event) {
    event.preventDefault();

    const donationID = document.getElementById('donationIdInput').value;
    const amount = document.getElementById('donationAmountInput').value;
    const donationDate = document.getElementById('donationDateInput').value;
    const method = document.getElementById('donationMethodInput').value;
    const donorSSN = document.getElementById('donorSelect').value;
    const projectIDRaw = document.getElementById('projectSelect').value;
    const projectID = projectIDRaw === "" ? null : projectIDRaw;

    if (!donorSSN) {
        alert("Please select a donor.");
        return;
    }

    const response = await fetch('/add-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationID, amount, donationDate, method, donorSSN, projectID })
    });

    const result = await response.json();

    if (result.success) {
        alert('Donation added successfully!');
        fetchAndDisplayDonation();
        fetchDonationSummary();
        const modalEl = document.getElementById('addDonationModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        document.getElementById('addDonationForm').reset();
    } else {
        alert('Error adding donation: ' + (result.message || 'Unknown error'));
    }
}

// Fetch and display donation table
export async function fetchAndDisplayDonation() {
    const response = await fetch('/donation');
    const data = await response.json();
    const rows = data.data;

    renderDonationTable(rows);

    // Auto set next donation ID
    const nextID = getNextDonationID(rows);
    document.getElementById('donationIdInput').value = nextID;
}

// Helper to draw table
function renderDonationTable(rows) {
    const tableBody = document.querySelector('#donationtable tbody');
    tableBody.innerHTML = '';

    rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Get next donation ID
export function getNextDonationID(rows) {
    if (!rows || rows.length === 0) {
        return 1;
    }

    let maxID = 0;
    for (let i = 0; i < rows.length; i++) {
        const currentID = Number(rows[i][0]);
        if (currentID > maxID) {
            maxID = currentID;
        }
    }

    return maxID + 1;
}

// Filter donors by minimum donation amount
export async function filterDonors() {
    const minAmount = document.getElementById("minDonationInput").value;

    if (!minAmount) {
        alert("Enter a minimum amount");
        return;
    }

    const response = await fetch(`/filter-donors?minAmount=${minAmount}`);
    const data = await response.json();
    const rows = data.donors;
    renderDonationTable(rows);
}

// Reset donor filter and show all donors
export async function resetDonorFilter() {
    document.getElementById("minDonationInput").value = "";
    const response = await fetch("/donation");
    const data = await response.json();
    renderDonationTable(data.data);
}

// Fetch and display donation summary table
export async function fetchDonationSummary() {
    const resp = await fetch('/donation-summary');
    const data = await resp.json();

    const tableBody = document.querySelector('#donationSummaryTable tbody');
    tableBody.innerHTML = '';

    data.data.forEach(row => {
        const tr = document.createElement('tr');

        const method = document.createElement('td');
        method.textContent = row[0];

        const total = document.createElement('td');
        total.textContent = row[1];

        tr.appendChild(method);
        tr.appendChild(total);
        tableBody.appendChild(tr);
    });
}

// Search donations by donor name
export async function searchDonationsByDonorName() {
    const input = document.getElementById('donorSearchInput');
    const table = document.getElementById('donationtable');
    if (!input || !table) return;

    const tbody = table.querySelector('tbody');
    const name = input.value.trim();

    if (!name) {
        alert('Please enter a donor name to search.');
        return;
    }

    try {
        const res = await fetch(`/donor-donations?name=${encodeURIComponent(name)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || 'Failed to fetch donations.');
            return;
        }

        const rows = data.data || [];
        tbody.innerHTML = '';

        if (rows.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 8; // match 8 table columns
            td.textContent = 'No donations found for this donor name.';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        rows.forEach(row => {
            // SELECT order (8 columns):
            // DonationID, Amount, DonationDate, Method, DonorName, DonorEmail, DonorSSN, ProjectName
            const [
                donationID,
                amount,
                donationDate,
                method,
                donorName,
                donorEmail,
                donorSSN,
                projectName
            ] = row;

            const tr = document.createElement('tr');
            [
                donationID,
                amount,
                donationDate,
                method,
                donorName,
                donorEmail,
                donorSSN,
                projectName
            ].forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error searching donations by donor name', err);
        alert('Error searching donations. Check console for details.');
    }
}


export async function resetDonorNameSearch() {
    const input = document.getElementById('donorSearchInput');
    if (input) input.value = '';
    // reload the full donations table
    await fetchAndDisplayDonation();
}

// Load donors and projects into modal dropdowns
async function loadDonorAndProjectOptions() {
    const donorSelect = document.getElementById('donorSelect');
    const projectSelect = document.getElementById('projectSelect');

    if (!donorSelect || !projectSelect) {
        return;
    }

    // Load donors
    try {
        const donorResp = await fetch('/donors-modal');
        const donorData = await donorResp.json();
        const donors = donorData.data || [];

        donorSelect.innerHTML = '<option value="">Select a donor</option>';
        donors.forEach(row => {
            const ssn = row[0];
            const name = row[1];
            const option = document.createElement('option');
            option.value = ssn;
            option.textContent = `${name} (SSN ${ssn})`;
            donorSelect.appendChild(option);
        });
    } catch (e) {
        console.error("Error loading donors", e);
    }

    // Load projects
    try {
        const projectResp = await fetch('/projects-modal');
        const projectData = await projectResp.json();
        const projects = projectData.data || [];

        projectSelect.innerHTML = '<option value="">Unassigned</option>';
        projects.forEach(row => {
            const projectID = row[0];
            const name = row[1];
            const option = document.createElement('option');
            option.value = projectID;
            option.textContent = `${name} (ID ${projectID})`;
            projectSelect.appendChild(option);
        });
    } catch (e) {
        console.error("Error loading projects", e);
    }
}

window.resetDonorFilter = resetDonorFilter;
window.filterDonors = filterDonors;
