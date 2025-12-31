
// Fetch and render all community members
export async function fetchAndDisplayCommunityMembers() {
    const table = document.getElementById('communityMemberTable');
    const tbody = table.querySelector('tbody');
    const response = await fetch('/community-members', { method: 'GET' });
    const responseData = await response.json();

    if (tbody) tbody.innerHTML = '';

    responseData.data.forEach(member => {
        const row = tbody.insertRow();
        const [id, name, role, email, phone, dateJoined] = member;

        const idCell = row.insertCell(0);
        const nameCell = row.insertCell(1);
        const roleCell = row.insertCell(2);
        const emailCell = row.insertCell(3);
        const phoneCell = row.insertCell(4);
        const dateJoinedCell = row.insertCell(5);
        const actionCell = row.insertCell(6);



        idCell.textContent = id;
        nameCell.textContent = name;
        roleCell.textContent = role;
        emailCell.textContent = email;
        phoneCell.textContent = phone;
        dateJoinedCell.textContent = dateJoined;


        // Add delete button
        const delButton = document.createElement('button');
        delButton.textContent = 'Delete';
        delButton.className = 'btn btn-sm btn-danger';
        delButton.onclick = () => deleteCommunityMember(id, role);
        actionCell.appendChild(delButton);
    });
}

// Delete a community member safely (checks project dependencies first)
export async function deleteCommunityMember(memberID, role) {
    const confirmDelete = confirm(
        `Are you sure you want to delete MemberID ${memberID} from ${role}?`
    );
    if (!confirmDelete) return;

    // Prepare body payload
    const response = await fetch(`/delete-community-member`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            memberID: memberID,
            role: role
        })
    });

    const data = await response.json();
    const msgElem = document.getElementById('deleteResultMsg');

    // Clear any old alert
    msgElem.innerHTML = '';

    // Create Bootstrap alert dynamically
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${data.success ? 'success' : 'danger'} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
    ${data.message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    msgElem.appendChild(alertDiv);

    if (data.success) {
        fetchAndDisplayCommunityMembers();
        fetchVolunteerMVP();

    }
}


// Fetch and display MVP Volunteers (those with more than average hours)
export async function fetchVolunteerMVP() {
    const res = await fetch('/volunteer-mvp');
    const data = await res.json();
    const rows = data.data;

    const tbody = document.querySelector('#volunteerMvpTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    rows.forEach(r => {
        const tr = document.createElement('tr');

        const m = document.createElement('td');
        m.textContent = r[0];

        const n = document.createElement('td');
        n.textContent = r[1];

        const h = document.createElement('td');
        h.textContent = r[2];

        tr.appendChild(m);
        tr.appendChild(n);
        tr.appendChild(h);

        tbody.appendChild(tr);
    });
}
