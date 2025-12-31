// Fetch and render all campaigns
export async function fetchAndDisplayCampaigns() {
    const tableBody = document.querySelector('#campaignsTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    try {
        const resp = await fetch('/campaigns');
        const data = await resp.json();
        const rows = data.data || [];

        // Fill campaigns table
        rows.forEach(row => {
            const tr = document.createElement('tr');

            row.forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });

        const typeSelect = document.getElementById('campaignTypeSelect');
        if (typeSelect) {
            const types = new Set();
            rows.forEach(r => {
                if (r[3]) types.add(r[3]);
            });

            typeSelect.innerHTML = '';
            // Simple default
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Select a campaign type';
            placeholder.disabled = true;
            placeholder.selected = true;
            typeSelect.appendChild(placeholder);
            types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                typeSelect.appendChild(opt);
            });

        }

    } catch (err) {
        console.error('Error fetching campaigns', err);
    }
}

export async function fetchAndDisplayCampaignParticipation() {
    const tbody = document.querySelector('#campaignParticipantsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    try {
        const resp = await fetch('/campaign-participation');
        const data = await resp.json();
        const rows = data.data || [];

        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error fetching campaign participation', err);
    }
}


export async function runDivisionQuery() {
    const typeSelect = document.getElementById('campaignTypeSelect');
    const tbody = document.querySelector('#divisionResultsTable tbody');

    if (!typeSelect || !tbody) return;

    const selectedType = typeSelect.value;
    if (!selectedType) {
        alert('Please select a campaign type.');
        return;
    }

    tbody.innerHTML = '';

    try {
        const params = new URLSearchParams({ type: selectedType });
        const resp = await fetch(`/volunteers-division?${params.toString()}`);
        const data = await resp.json();
        const rows = data.data || [];

        if (rows.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.textContent = 'No volunteers found who participated in all campaigns of this type.';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        rows.forEach(row => {
            const [memberID, name, email, phone] = row;

            const tr = document.createElement('tr');
            [memberID, name, email, phone].forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error running division query', err);
        alert('Error running division query. Check console for details.');
    }
}


// Initialize campaigns page
export function initCampaignsPage() {
    // Load campaigns into the top table + type dropdown
    fetchAndDisplayCampaigns();
    fetchAndDisplayCampaignParticipation();

    const btn = document.getElementById('runDivisionBtn');
    if (btn) {
        btn.addEventListener('click', runDivisionQuery);
    }
}
