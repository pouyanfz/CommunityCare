
// Gets the next available Project ID
export function getNextProjectID(projectData) {
    //Makes sures the function retuns the next ID if not starts from 301
    if (!projectData || projectData.length === 0) {
        return 301;
    }
    // projectData is an array of arrays 
    const lastRow = projectData[projectData.length - 1];
    const lastID = Number(lastRow[0]);

    return lastID + 1;
}

//Fetches and display data on the project page
export async function fetchAndDisplayProjects() {
    const tableElement = document.getElementById('projectsTable');
    const tableBody = tableElement.querySelector('tbody');

    try {
        const response = await fetch('/projects', { method: 'GET' });
        const responseData = await response.json();
        const projectData = responseData.data || [];

        // Clear table
        if (tableBody) tableBody.innerHTML = '';

        // Fill table
        projectData.forEach(rowValues => {
            const row = tableBody.insertRow();
            rowValues.forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });

        });

        // Auto-set next Project ID
        const nextID = getNextProjectID(projectData);
        const projectIdInput = document.getElementById('projectIdInput');
        if (projectIdInput) {
            projectIdInput.value = nextID;
        }

    } catch (error) {
        console.error('Failed to fetch and display projects:', error);
    }
}

//Supervisor validation
function askForSupervisorID() {
    return new Promise((resolve) => {
        const supervisorModalEl = document.getElementById('supervisorModal');
        const supervisorInput = document.getElementById('supervisorIdInput');
        const supervisorSubmitBtn = document.getElementById('supervisorSubmitBtn');
        const supervisorMsg = document.getElementById('supervisorMessage');

        if (!supervisorModalEl || !supervisorInput || !supervisorSubmitBtn) {
            console.error("Supervisor modal elements not found.");
            return resolve(null);
        }

        // Reset state
        supervisorMsg.textContent = '';
        supervisorInput.value = '';

        // Create Bootstrap modal instance
        const supervisorModal = new bootstrap.Modal(supervisorModalEl);
        supervisorModal.show();

        // Handler for form submission/button click
        const handleSubmit = async () => {
            const memberID = parseInt(supervisorInput.value.trim());

            if (isNaN(memberID)) {
                supervisorMsg.textContent = 'Please enter a valid numeric Employee ID.';
                return;
            }

            try {
                const response = await fetch(`/validate-supervisor/${memberID}`);
                const data = await response.json();

                if (data.isValid) {
                    supervisorModal.hide();
                    resolve(memberID);
                } else {
                    // Display error message if the ID is invalid (not found or not an employee)
                    supervisorMsg.textContent = data.message || `Error: MemberID ${memberID} is not a valid supervisor.`;
                }
            } catch (error) {
                console.error('Validation error:', error);
                supervisorMsg.textContent = 'A network error occurred during validation.';
            }
        };

        // Attach listener temporarily
        supervisorSubmitBtn.addEventListener('click', handleSubmit);

        // Resolve null if the user closes the modal without submitting
        supervisorModalEl.addEventListener('hidden.bs.modal', function onHidden() {
            supervisorSubmitBtn.removeEventListener('click', handleSubmit);
            resolve(null);
            supervisorModalEl.removeEventListener('hidden.bs.modal', onHidden);
        }, { once: true });
    });
}


/**
 * Handles the main Add Project form submission.
 */
export async function handleAddProject(event) {
    event.preventDefault();

    // 1. Collect Project details
    const projectId = document.getElementById('projectIdInput').value;
    const name = document.getElementById('projectNameInput').value;
    const description = document.getElementById('projectDescriptionInput').value;
    const goalAmount = document.getElementById('projectGoalAmountInput').value;


    // 2. Ask for Supervisor ID via a second modal
    const supervisorID = await askForSupervisorID();

    // If supervisorID is null, the user cancelled or validation failed/errored out, so stop the process.
    if (!supervisorID) {
        alert("Project creation cancelled: Supervisor ID required.");
        return;
    }

    // 3. Send data to the server (Project + Supervision relationship)
    const response = await fetch('/add-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            projectId: projectId,
            name: name,
            description: description,
            goalAmount: goalAmount,
            supervisorID: supervisorID // The validated ID
        })
    });

    const result = await response.json();

    if (result.success) {
        alert('Project added successfully!');

        // Refresh table
        fetchAndDisplayProjects();

        // Close the main project modal
        const projectModalEl = document.getElementById('addProjectModal');
        const projectModal = bootstrap.Modal.getInstance(projectModalEl);
        projectModal.hide();

        // Reset form
        document.getElementById('addProjectForm').reset();
    } else {
        alert('Error adding project: ' + (result.message || 'Unknown error'));
    }
}

//Listeners and initialization of data
export function initProjectsPage() {
    const form = document.getElementById('addProjectForm');
    if (form) {
        form.addEventListener('submit', handleAddProject);
    }


    // Load project table on page load
    fetchAndDisplayProjects();
}

// Renders the projects table based on provided data
function renderProjectsTable(projects) {
    const tbody = document.querySelector("#projectsTable tbody");
    tbody.innerHTML = ""; // Clear existing rows

    projects.forEach(proj => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${proj.PROJECTID}</td>
            <td>${proj.NAME}</td>
            <td>${proj.DESCRIPTION}</td>
            <td>${proj.GOALAMOUNT}</td>
            <td>${proj.SUPERVISORMEMBERID}</td>
        `;

        tbody.appendChild(tr);
    });
}

document.getElementById('applyProjectFilters')?.addEventListener('click', async () => {
    const type = document.getElementById('goalAmountFilterType').value;
    const value = document.getElementById('goalAmountFilterValue').value;
    if (!type) {
        alert("Please select a filter type for the goal amount.");
        return;
    }

    if (!value || isNaN(value)) {
        alert("Please enter a valid numeric value for the goal amount.");
        return;
    }

    const params = new URLSearchParams();
    if (type && value) {
        params.append('amountType', type);
        params.append('amountValue', value);
    }

    const response = await fetch(`/projects/filter?${params.toString()}`);
    const result = await response.json();
    const projects = result.data.map(row => ({
        PROJECTID: row[0],
        NAME: row[1],
        DESCRIPTION: row[2],
        GOALAMOUNT: row[3],
        SUPERVISORMEMBERID: row[4]
    }));

    renderProjectsTable(projects);
});

document.getElementById('resetProjectFilters')?.addEventListener('click', async () => {
    document.getElementById('goalAmountFilterType').value = '';
    document.getElementById('goalAmountFilterValue').value = '';
    fetchAndDisplayProjects();
});

