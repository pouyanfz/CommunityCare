const onReportPage = document.getElementById('reportTable') !== null;
// If on report page, initialize the page
if (onReportPage) {
    document.addEventListener('DOMContentLoaded', () => {
        loadTableDropdown();
        initializeReportPage();
    });
}

// Initialize report page
export function initializeReportPage() {
    const tableSelect = document.getElementById('reportTable');
    const runBtn = document.getElementById('runProjection');

    if (!tableSelect || !runBtn) return; // If not on this page do nothing

    tableSelect.addEventListener('change', async () => {
        const table = tableSelect.value;
        document.getElementById('columnOptions').innerHTML = '';
        document.querySelector('#resultTable thead').innerHTML = '';
        document.querySelector('#resultTable tbody').innerHTML = '';
        if (!table) return;

        const columns = await fetchColumnsForTable(table);
        renderColumnCheckboxes(columns);
    });

    runBtn.addEventListener('click', async () => {
        const table = tableSelect.value;
        const checkboxes = document.querySelectorAll('#columnOptions input:checked');
        const selectedColumns = [];
        for (let i = 0; i < checkboxes.length; i++) {
            selectedColumns.push(checkboxes[i].value);
        }


        if (!table || selectedColumns.length === 0) {
            alert('Please select a table and at least one column.');
            return;
        }

        const rows = await runProjectionQuery(table, selectedColumns);
        renderResultTable(selectedColumns, rows);
    });
}

// Fetch list of tables from the server
async function fetchTables() {
    const res = await fetch('/get-tables');
    const data = await res.json();
    return data.tables || [];
}

async function loadTableDropdown() {
    const tableSelect = document.getElementById('reportTable');
    const tables = await fetchTables();
    tableSelect.innerHTML = '<option value="">Select a table</option>';
    tables.forEach(tbl => {
        const option = document.createElement('option');
        option.value = tbl;
        option.textContent = tbl;
        tableSelect.appendChild(option);
    });
}

// Render result table with Bootstrap formatting and numbered rows
export function renderResultTable(columns, rows) {
    const table = document.getElementById('resultTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    table.classList.add('table', 'table-bordered', 'table-hover', 'align-middle', 'text-center', 'shadow-sm');

    // Table header
    const headerRow = document.createElement('tr');
    headerRow.classList.add('table-dark');

    // First column header for numbering
    const numHeader = document.createElement('th');
    numHeader.textContent = '#';
    headerRow.appendChild(numHeader);

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Table content
    rows.forEach((row, index) => {
        const tr = document.createElement('tr');

        // Add number cell
        const numCell = document.createElement('td');
        numCell.textContent = index + 1;
        tr.appendChild(numCell);

        // Add data cells
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// Create column checkboxes dynamically
export function renderColumnCheckboxes(columns) {
    const container = document.getElementById('columnOptions');
    container.innerHTML = '';

    const label = document.createElement('p');
    label.classList.add('fw-bold', 'mb-2');
    label.textContent = 'Choose the columns you want to include:';
    container.appendChild(label);

    columns.forEach(col => {
        const div = document.createElement('div');
        div.classList.add('form-check');
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${col}" id="${col}">
            <label class="form-check-label" for="${col}">${col}</label>
        `;
        container.appendChild(div);
    });
}

// Fetch list of columns for a selected table
export async function fetchColumnsForTable(tableName) {
    const res = await fetch(`/get-columns/${tableName}`);
    const data = await res.json();
    return data.columns || [];
}


// Run projection query for selected table and columns
// Asks the server for data from the selected table and columns
export async function runProjectionQuery(table, columns) {
    const requestBody = {
        table: table,
        columns: columns
    };

    // Send the request to the backend route "/get-report"
    const response = await fetch('/get-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody) // convert JS object to JSON text
    });
    const result = await response.json();
    return result.rows || [];
}