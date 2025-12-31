// Render the office workers table
function renderOfficeWorkersTable(rows) {
    const tbody = document.querySelector('#officeWorkersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    rows.forEach(row => {
        // Row format from backend:
        const [
            memberID,
            name,
            email,
            phone,
            dateJoined,
            location,
            salary,
            deptId
        ] = row;

        const tr = document.createElement('tr');

        const values = [
            memberID,
            name,
            email,
            phone,
            dateJoined,
            location,
            salary,
            deptId
        ];

        values.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });

        // Action cell with Update button
        const actionTd = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-primary';
        btn.textContent = 'Update';

        btn.addEventListener('click', () => {
            openUpdateModal({
                memberID,
                name,
                email,
                phone,
                location,
                salary,
                deptId
            });
        });

        actionTd.appendChild(btn);
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    });
}

// Open the Bootstrap modal and prefill fields
function openUpdateModal(worker) {
    const memberInput = document.getElementById('owMemberIdInput');
    const nameInput = document.getElementById('owNameInput');
    const emailInput = document.getElementById('owEmailInput');
    const phoneInput = document.getElementById('owPhoneInput');
    const locationInput = document.getElementById('owLocationInput');
    const salaryInput = document.getElementById('owSalaryInput');
    const deptIdInput = document.getElementById('owDeptIdInput');

    if (!memberInput) return; // modal not on this page

    memberInput.value = worker.memberID;
    nameInput.value = worker.name ?? '';
    emailInput.value = worker.email ?? '';
    phoneInput.value = worker.phone ?? '';
    locationInput.value = worker.location ?? '';
    salaryInput.value = worker.salary ?? '';
    deptIdInput.value = worker.deptId ?? '';

    const modalEl = document.getElementById('updateOfficeWorkerModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Fetch workers from backend
async function fetchAndDisplayOfficeWorkers() {
    try {
        const resp = await fetch('/officeworkers');
        const data = await resp.json();
        const rows = data.data || [];
        renderOfficeWorkersTable(rows);
    } catch (err) {
        console.error('Error fetching office workers', err);
        alert('Failed to load office workers.');
    }
}

// Handle form submit (PUT /officeworkers/:memberID)
async function handleOfficeWorkerFormSubmit(event) {
    event.preventDefault();

    const memberID = document.getElementById('owMemberIdInput').value;
    const name = document.getElementById('owNameInput').value;
    const email = document.getElementById('owEmailInput').value;
    let phone = document.getElementById('owPhoneInput').value;
    const location = document.getElementById('owLocationInput').value;
    const salary = document.getElementById('owSalaryInput').value;
    const deptId = document.getElementById('owDeptIdInput').value;

    if (/[A-Za-z]/.test(phone)) {
        alert("Phone number cannot contain letters.");
        return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
        alert("Phone number must have exactly 10 digits.");
        return;
    }
    phone = normalizePhone(phone);

    // Adopted from https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
    if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
        alert("Invalid email format");
        return;
    }

    if (salary && Number(salary) < 0) {
        alert("Salary cannot be negative");
        return;
    }

    if (!name || !email || !location || !salary) {
        alert("One or more fields are empty.");
        return;
    }

    try {
        const resp = await fetch(`/officeworkers/${memberID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                phone,
                location,
                salary,
                deptId
            })
        });

        const result = await resp.json();

        if (!resp.ok || !result.success) {
            alert(result.message || 'Failed to update office worker.');
            return;
        }

        alert('Office worker updated successfully.');

        // Refresh table and hide modal
        await fetchAndDisplayOfficeWorkers();

        const modalEl = document.getElementById('updateOfficeWorkerModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    } catch (err) {
        console.error('Error updating office worker', err);
        alert('Server error while updating office worker.');
    }
}

// Load department options for the select input
async function loadDepartmentOptions() {
    const select = document.getElementById('owDeptIdInput');
    if (!select) return;

    try {
        const resp = await fetch('/departments');
        const data = await resp.json();
        const rows = data.data || [];

        // Keep the first "keep current" option
        select.innerHTML = '<option value="">Keep current department</option>';

        rows.forEach(([deptId, deptName]) => {
            const opt = document.createElement('option');
            opt.value = deptId;
            opt.textContent = `${deptId} – ${deptName}`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Error loading departments', err);
    }
}


// Public init function for this page
export function initOfficeWorkersPage() {
    fetchAndDisplayOfficeWorkers();
    loadDepartmentOptions();

    // Hook up form submit
    const form = document.getElementById('updateOfficeWorkerForm');
    if (form) {
        form.addEventListener('submit', handleOfficeWorkerFormSubmit);
    }
}

// Helper function to normalize phone numbers to XXX-XXX-XXXX
// Adapted from: https://stackoverflow.com/questions/8358084/regular-expression-to-reformat-a-us-phone-number-in-javascript
function normalizePhone(phoneNumberString) {
    const cleaned = String(phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return match[1] + "-" + match[2] + "-" + match[3];
    }
    return null;
}
