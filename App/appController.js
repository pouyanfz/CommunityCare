const express = require('express');
const appService = require('./appService');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// API endpoint to check database connection
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('Connected to Oracle ✅');
    } else {
        res.send('Unable to connect to Oracle ❌');
    }
});


// API endpoint to fetch donation data
router.get('/donation', async (req, res) => {
    const tableContent = await appService.fetchDonationFromDb();
    res.json({ data: tableContent });
});


// API endpoint to fetch community members
router.get('/community-members', async (req, res) => {
    const members = await appService.fetchCommunityMembers();
    res.json({ data: members });
});


// API endpoint to fetch office workers (for the update UI)
router.get('/officeworkers', async (req, res) => {
    try {
        const workers = await appService.getOfficeWorkers();
        res.json({ data: workers });
    } catch (err) {
        console.error('Error fetching office workers', err);
        res.status(500).json({ error: 'Failed to fetch office workers' });
    }
});


// API endpoint to fetch campaign types (for division query dropdown)
router.get('/campaign-types', async (req, res) => {
    try {
        const rows = await appService.getCampaignTypes();
        res.json({ types: rows });
    } catch (err) {
        console.error('Error fetching campaign types', err);
        res.status(500).json({ types: [], message: 'Server error.' });
    }
});


// API endpoint to update an office worker's non-PK attributes
router.put('/officeworkers/:memberID', async (req, res) => {
    const memberID = parseInt(req.params.memberID, 10);
    const { name, email, phone, dateJoined, location, salary, deptId } = req.body;

    try {
        const result = await appService.updateOfficeWorker(memberID, {
            name,
            email,
            phone,
            dateJoined,
            location,
            salary,
            deptId
        });

        if (!result.success) {
            if (result.message.includes('not found')) {
                return res.status(404).json(result);
            }
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (err) {
        console.error('Error updating office worker', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});


// API endpoint to delete a community member
router.delete('/delete-community-member', async (req, res) => {
    const { memberID, role } = req.body;

    // Convert role string to exact table name
    let roleTable;
    if (role === 'Supervisor') roleTable = 'Supervisor';
    else if (role === 'Volunteer') roleTable = 'Volunteer';
    else if (role === 'Office Worker') roleTable = 'OfficeWorker';
    else {
        return res.status(400).json({
            success: false,
            message: `Invalid or missing role: ${role}`
        });
    }

    const result = await appService.deleteCommunityMember(memberID, roleTable);
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});


// API endpoint to reload the database
router.post('/reload-database', async (req, res) => {
    const sql = fs.readFileSync(path.join(__dirname, '../Scripts/SetupDB.sql'), 'utf8');
    const result = await appService.runSqlScript(sql);
    if (result.success) {
        res.json(result);
        res.message = 'Database reloaded!';
    } else {
        res.status(400).json(result);
        res.message = 'Reload failed.';
    }
});


// API endpoint to initiate demotable
router.post("/initiate-demotable", async (req, res) => {
    const initiateResult = await appService.initiateDemotable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});


// API endpoint to get all table names in the database
router.get('/get-tables', async (req, res) => {
    const result = await appService.getTables();
    res.json({ tables: result });
});


// API endpoint to get columns for a given table
router.get('/get-columns/:table', async (req, res) => {
    const table = req.params.table.toUpperCase();
    const result = await appService.getColumnsForTable(table);
    res.json({ columns: result });
});


// API endpoint to get projection of specified columns from a table
router.post('/get-report', async (req, res) => {
    const { table, columns } = req.body;
    const result = await appService.getProjection(table, columns);
    res.json({ rows: result });
});


// API endpoint to add a new donation
router.post('/add-donation', async (req, res) => {
    const { donationID, amount, donationDate, method, donorSSN, projectID } = req.body;

    if (!donorSSN) {
        return res.status(400).json({ success: false, message: 'Donor is required for a donation.' });
    }

    try {
        const result = await appService.addDonation(donationID, amount, donationDate, method, donorSSN, projectID);
        if (result.success) {
            res.json({ success: true, message: 'Donation added successfully' });
        } else {
            res.status(400).json({ success: false, message: result.message || 'Failed to add donation' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// API end point for JOIN query: donations for a given donor name 
router.get('/donor-donations', async (req, res) => {
    const name = (req.query.name || '').trim();

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Name is required'
        });
    }

    try {
        const rows = await appService.getDonationsForDonorName(name);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching donor donations', err);
        res.status(500).json({ success: false, data: [], message: 'Server error' });
    }
});


// API endpoint for Division query: volunteers who participated in all campaigns of a given type
router.get('/volunteers-division', async (req, res) => {
    const type = (req.query.type || '').trim();

    if (!type) {
        return res.status(400).json({
            success: false,
            data: [],
            message: 'Campaign type is required.'
        });
    }

    try {
        const rows = await appService.getVolunteersForAllCampaignsOfType(type);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error running division query', err);
        res.status(500).json({
            success: false,
            data: [],
            message: 'Server error.'
        });
    }
});


// API endpoint to fetch campaign data
router.get('/campaigns', async (req, res) => {
    try {
        const rows = await appService.fetchCampaignsFromDb();
        res.json({ data: rows });
    } catch (err) {
        console.error('Error fetching campaigns', err);
        res.status(500).json({ data: [], message: 'Server error.' });
    }
});


// API endpoint: show which volunteers participate in which campaigns
router.get('/campaign-participation', async (req, res) => {
    try {
        const rows = await appService.getCampaignParticipation();
        res.json({ data: rows });
    } catch (err) {
        console.error('Error fetching campaign participation', err);
        res.status(500).json({ data: [], message: 'Server error.' });
    }
});


// API endpoint to fetch all departments (for dropdowns)
router.get('/departments', async (req, res) => {
    try {
        const rows = await appService.getDepartments();
        res.json({ data: rows });
    } catch (err) {
        console.error('Error fetching departments', err);
        res.status(500).json({ data: [], message: 'Server error.' });
    }
});


// API endpoint to filter donors by minimum total donation amount
router.get('/filter-donors', async (req, res) => {
    const minAmount = Number(req.query.minAmount);

    try {
        const result = await appService.filterDonors(minAmount);
        res.json({ donors: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ donors: [] });
    }
});


// API endpoint to get donation summary by method
router.get('/donation-summary', async (req, res) => {
    const rows = await appService.getDonationSummaryByMethod();
    res.json({ data: rows });
});


// API endpoint to get MVP volunteers (those with hours greater than average)
router.get('/volunteer-mvp', async (req, res) => {
    const rows = await appService.getVolunteerMVP();
    res.json({ data: rows });
});


// API endpoint to fetch donors (for donations modal)
router.get('/donors-modal', async (req, res) => {
    try {
        const donors = await appService.getDonors();
        res.json({ data: donors });
    } catch (err) {
        console.error('Error fetching donors', err);
        res.status(500).json({ data: [] });
    }
});


// API endpoint to fetch projects (for donations modal)
router.get('/projects-modal', async (req, res) => {
    try {
        const projects = await appService.getProjects();
        res.json({ data: projects });
    } catch (err) {
        console.error('Error fetching projects', err);
        res.status(500).json({ data: [] });
    }
});


// API endpoint to fetch project data
router.get('/projects', async (req, res) => {
    const tableContent = await appService.fetchProjectsFromDb();
    res.json({ data: tableContent });
});


// API endpoint to validate a supervisor's MemberID
router.get('/validate-supervisor/:memberID', async (req, res) => {
    const memberID = parseInt(req.params.memberID, 10);
    const result = await appService.validateSupervisor(memberID);
    res.json(result);
});


// API endpoint to add a new project and its supervisor relationship
router.post('/add-project', async (req, res) => {
    const { projectId, name, description, goalAmount, supervisorID } = req.body;
    try {
        const result = await appService.addProject(projectId, name, description, goalAmount, supervisorID);
        if (result.success) {
            res.json({ success: true, message: 'Project added successfully' });
        } else {
            res.status(400).json({ success: false, message: result.message || 'Failed to add project' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// API endpoint to filter projects by goal amount
router.get('/projects/filter', async (req, res) => {
    const { amountType, amountValue } = req.query;

    if (!amountType || !amountValue) {
        return res.status(400).json({ data: [], message: 'Missing filter parameters.' });
    }

    try {
        const projects = await appService.filterProjectsByGoal(amountType, amountValue);
        res.json({ data: projects });
    } catch (err) {
        console.error(err);
        res.status(500).json({ data: [], message: 'Server error while filtering projects.' });
    }
});


module.exports = router;