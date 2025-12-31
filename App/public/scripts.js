import {
    fetchAndDisplayCommunityMembers,
    deleteCommunityMember,
    fetchVolunteerMVP
} from './jscripts/community.js';

import {
    handleAddDonation,
    initAddDonationForm,
    fetchAndDisplayDonation,
    filterDonors,
    resetDonorFilter,
    fetchDonationSummary,
    getNextDonationID,
    searchDonationsByDonorName,
    resetDonorNameSearch
} from './jscripts/donation.js';

import {
    renderResultTable,
    fetchColumnsForTable,
    renderColumnCheckboxes,
    runProjectionQuery,
    initializeReportPage
} from './jscripts/report.js';

import {
    initProjectsPage,
    fetchAndDisplayProjects,
    getNextProjectID,
    handleAddProject
} from './jscripts/projects.js';

import {
    initOfficeWorkersPage
} from './jscripts/officeworkers.js';

import {
    initCampaignsPage,
    fetchAndDisplayCampaigns,
    fetchAndDisplayCampaignParticipation
} from './jscripts/campaigns.js';

// ---------------------- DB Connection Banner ----------------------
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    // Only exists on index.html – if not there, just skip
    if (!statusElem || !loadingGifElem) return;

    const response = await fetch('/check-db-connection', {
        method: 'GET'
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    statusElem.style.display = 'inline';

    response.text()
        .then((text) => {
            statusElem.textContent = text;
        })
        .catch(() => {
            statusElem.textContent = 'connection timed out';
        });
}


// ---------------------- Reload Database ----------------------
async function reloadDatabase() {
    const confirmReload = confirm(
        'This will drop and recreate all tables with sample data. Continue?'
    );
    if (!confirmReload) return;

    const response = await fetch('/reload-database', { method: 'POST' });
    const data = await response.json();

    if (!data.success) {
        alert('Error reloading database!');
        return;
    }

    alert('Database has been reloaded.');

    const path = window.location.pathname;

    if (path.includes('community.html')) {
        await fetchAndDisplayCommunityMembers();
        await fetchVolunteerMVP();
    } else if (path.includes('donations.html')) {
        fetchTableData();
        fetchDonationSummary();
    } else if (path.includes('projects.html')) {
        fetchAndDisplayProjects();
    } else if (path.includes('officeworkers.html')) {
        initOfficeWorkersPage();
    } else if (path.includes('campaigns.html')) {
        fetchAndDisplayCampaigns();
        fetchAndDisplayCampaignParticipation();

    }
}


// ---------------------- Donation Table Wrapper ----------------------
function fetchTableData() {
    fetchAndDisplayDonation();
}


// ---------------------- Page Initialization ----------------------
window.onload = function () {
    checkDbConnection(); // DB banner on pages that support it

    const path = window.location.pathname;

    // Report page
    if (document.getElementById('reportTable')) {
        initializeReportPage();
    }

    // Hook up "Reload Database" button if present
    const reloadBtn = document.getElementById('reloadDatabase');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', reloadDatabase);
    }

    // Community page
    if (path.includes('community.html')) {
        fetchAndDisplayCommunityMembers();
        fetchVolunteerMVP();
    }

    // Donations page
    if (path.includes('donations.html')) {
        fetchTableData();
        initAddDonationForm();
        fetchDonationSummary();

        const searchBtn = document.getElementById('donorSearchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchDonationsByDonorName);
        }

        const resetNameBtn = document.getElementById('donorSearchResetBtn');
        if (resetNameBtn) {
            resetNameBtn.addEventListener('click', resetDonorNameSearch);
        }
    }

    // Projects page – load current projects list
    if (path.includes('projects.html')) {
        fetchAndDisplayProjects();
    }

    // Office Workers page
    if (path.includes('officeworkers.html')) {
        initOfficeWorkersPage();
    }

    // Campaigns page
    if (path.includes('campaigns.html')) {
        initCampaignsPage();
    }
};


// Extra init hook for projects page (form listeners etc.)
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('projects.html')) {
        initProjectsPage();
    }
});
