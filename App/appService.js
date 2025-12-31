const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');
const path = require('path');
const fs = require('fs');

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
// Checks if the database is initialized; if not, runs the setup script.
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');

        const sqlPath = path.join(__dirname, '../Scripts/SetupDB.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await withOracleDB(async (conn) => {
            const result = await conn.execute(
                "SELECT COUNT(*) AS CNT FROM USER_TABLES WHERE TABLE_NAME = 'DEPARTMENTFOCUS'"
            );
            const exists = result.rows[0][0] === 1;

            if (!exists) {
                console.log("Donation table missing. Running SetupDB.sql...");
                await runSqlScript(sql);
                console.log("Database initialized successfully.");
            } else {
                console.log("Database already initialized.");
            }
        });
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

// close the pool and exit
async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

// Fetch donations from the Donation table
async function fetchDonationFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT 
                D.DonationID,
                D.Amount,
                TO_CHAR(D.DonationDate, 'YYYY-MM-DD') AS DonationDate,
                D.Method,
                Donor.Name AS DonorName,
                Donor.Email AS DonorEmail,
                Donor.SSN AS DonorSSN,
                P.Name AS ProjectName
            FROM Donation D
            LEFT JOIN Donates Do ON D.DonationID = Do.DonationID
            LEFT JOIN Donor ON Donor.SSN = Do.SSN
            LEFT JOIN Funds F ON D.DonationID = F.DonationID
            LEFT JOIN Project P ON F.ProjectID = P.ProjectID
            ORDER BY D.DonationID
        `);

        return result.rows;
    }).catch(err => {
        console.error(err);
        return [];
    });
}

// Filter donors who have donated more than a specified amount
async function filterDonors(minAmount) {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `
            SELECT 
                D.DonationID,
                D.Amount,
                TO_CHAR(D.DonationDate,'YYYY-MM-DD'),
                D.Method,
                Donor.Name AS DonorName,
                Donor.Email AS DonorEmail,
                Donor.SSN AS DonorSSN,
                P.Name AS ProjectName
            FROM Donation D
            JOIN Donates Do ON D.DonationID = Do.DonationID
            JOIN Donor ON Donor.SSN = Do.SSN
            LEFT JOIN Funds F ON D.DonationID = F.DonationID
            LEFT JOIN Project P ON F.ProjectID = P.ProjectID
            WHERE Donor.SSN IN (
                SELECT Do2.SSN
                FROM Donates Do2
                JOIN Donation D2 ON D2.DonationID = Do2.DonationID
                GROUP BY Do2.SSN
                HAVING SUM(D2.Amount) >= :minAmount
            )
            ORDER BY D.DonationID
            `,
            { minAmount }
        );

        return result.rows;
    });
}

// Get donation summary grouped by method
async function getDonationSummaryByMethod() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `
            SELECT 
                Method,
                SUM(Amount) AS TotalAmount
            FROM Donation
            GROUP BY Method
            ORDER BY Method
            `
        );
        return result.rows;
    });
}



// Fetch community members with their roles
// Combines data from CommunityMember and its subtypes: Supervisor, Volunteer, OfficeWorker
async function fetchCommunityMembers() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
                SELECT cm.MemberID,
                    cm.Name,
                    'Supervisor' AS Role,
                    cm.Email,
                    cm.Phone,
                    TO_CHAR(cm.DateJoined, 'YYYY-MM-DD') AS DateJoined
                FROM CommunityMember cm
                JOIN Supervisor s ON cm.MemberID = s.MemberID
                UNION ALL
                SELECT cm.MemberID,
                    cm.Name,
                    'Volunteer' AS Role,
                    cm.Email,
                    cm.Phone,
                    TO_CHAR(cm.DateJoined, 'YYYY-MM-DD') AS DateJoined
                FROM CommunityMember cm
                JOIN Volunteer v ON cm.MemberID = v.MemberID
                UNION ALL
                SELECT cm.MemberID,
                    cm.Name,
                    'Office Worker' AS Role,
                    cm.Email,
                    cm.Phone,
                    TO_CHAR(cm.DateJoined, 'YYYY-MM-DD') AS DateJoined
                FROM CommunityMember cm
                JOIN OfficeWorker ow ON cm.MemberID = ow.MemberID
                UNION ALL
                SELECT cm.MemberID,
                    cm.Name,
                    'None' AS Role,
                    cm.Email,
                    cm.Phone,
                    TO_CHAR(cm.DateJoined, 'YYYY-MM-DD') AS DateJoined
                FROM CommunityMember cm
                WHERE cm.MemberID NOT IN (
                    SELECT MemberID FROM Supervisor
                    UNION
                    SELECT MemberID FROM Volunteer
                    UNION
                    SELECT MemberID FROM OfficeWorker
                )
                ORDER BY MemberID
            `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

//Fetch all office workers with details from CommunityMember
async function getOfficeWorkers() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `
            SELECT 
                ow.MemberID,
                cm.Name,
                cm.Email,
                cm.Phone,
                TO_CHAR(cm.DateJoined, 'YYYY-MM-DD') AS DateJoined,
                ow.Location,
                ow.Salary,
                ow.DeptID
            FROM OfficeWorker ow
            JOIN CommunityMember cm
              ON ow.MemberID = cm.MemberID
            ORDER BY ow.MemberID
            `
        );
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

// Update non-primary key attributes for an OfficeWorker
// Also allows updating CommunityMember info (Name, Email, Phone, DateJoined)
async function updateOfficeWorker(
    memberID,
    { name, email, phone, dateJoined, location, salary, deptId }
) {
    return await withOracleDB(async (connection) => {
        const current = await connection.execute(
            `
            SELECT 
                cm.Name,
                cm.Email,
                cm.Phone,
                TO_CHAR(cm.DateJoined, 'YYYY-MM-DD') AS DateJoined,
                ow.Location,
                ow.Salary,
                ow.DeptID
            FROM OfficeWorker ow
            JOIN CommunityMember cm
              ON ow.MemberID = cm.MemberID
            WHERE ow.MemberID = :id
            `,
            { id: memberID },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (current.rows.length === 0) {
            return { success: false, message: 'Office worker not found.' };
        }

        const existing = current.rows[0];


        let desiredEmail =
            email && email.trim() !== '' ? email.trim() : existing.EMAIL;


        if (desiredEmail) {
            desiredEmail = desiredEmail.toLowerCase();
        }


        const existingEmailLower = existing.EMAIL
            ? existing.EMAIL.toLowerCase()
            : null;

        if (desiredEmail && desiredEmail !== existingEmailLower) {
            const dupCheck = await connection.execute(
                `
                SELECT COUNT(*) AS CNT
                FROM CommunityMember
                WHERE LOWER(Email) = LOWER(:em)
                  AND MemberID <> :id
                `,
                { em: desiredEmail, id: memberID }
            );
            const dupCount = dupCheck.rows[0][0];
            if (dupCount > 0) {
                return {
                    success: false,
                    message:
                        'Email already exists for another member.'
                };
            }
        }


        const newName =
            name && name.trim() !== '' ? name : existing.NAME;

        const newEmail = desiredEmail;

        const newPhone =
            phone && phone.trim() !== '' ? phone : existing.PHONE;

        const newDateJoined =
            dateJoined && dateJoined.trim() !== ''
                ? dateJoined
                : existing.DATEJOINED;


        const newLocation =
            location && location.trim() !== '' ? location : existing.LOCATION;

        const newSalary =
            salary !== undefined && salary !== null && salary !== ''
                ? Number(salary)
                : existing.SALARY;

        const newDeptId =
            deptId !== undefined && deptId !== null && String(deptId).trim() !== ''
                ? Number(deptId)
                : existing.DEPTID;


        await connection.execute(
            `
            UPDATE CommunityMember
               SET Name       = :name,
                   Email      = :email,
                   Phone      = :phone,
                   DateJoined = TO_DATE(:dateJoined, 'YYYY-MM-DD')
             WHERE MemberID   = :memberId
            `,
            {
                name: newName,
                email: newEmail,
                phone: newPhone,
                dateJoined: newDateJoined,
                memberId: memberID
            }
        );

        const result = await connection.execute(
            `
            UPDATE OfficeWorker
               SET Location = :location,
                   Salary   = :salary,
                   DeptID   = :deptId
             WHERE MemberID = :memberId
            `,
            {
                location: newLocation,
                salary: newSalary,
                deptId: newDeptId,
                memberId: memberID
            }
        );

        await connection.commit();

        if (result.rowsAffected && result.rowsAffected > 0) {
            return { success: true, message: 'Office worker updated successfully.' };
        } else {
            return { success: false, message: 'No rows updated.' };
        }
    }).catch((err) => {
        console.error(err);

        if (err && err.errorNum === 1 && err.message.includes('EMAIL')) {
            return {
                success: false,
                message:
                    'Email already exists. Please use a different email address.'
            };
        }
        if (err && err.errorNum === 2291 && err.message.includes('DEPTID')) {
            return {
                success: false,
                message: 'Department ID does not exist.'
            };
        }

        return { success: false, message: 'Error updating office worker.' };
    });
}


// Fetch all departments (for dropdowns)
async function getDepartments() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `
            SELECT DeptID, Name
            FROM DepartmentInfo
            ORDER BY DeptID
            `
        );
        return result.rows; // [DeptID, Name]
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

// Delete a community member from a specific subtype table
// If the member has no other roles, also delete from CommunityMember table
async function deleteCommunityMember(memberID, roleTable) {
    return await withOracleDB(async (connection) => {
        // Delete from the specified subtype (Supervisor, Volunteer, or OfficeWorker)
        const deleteRole = await connection.execute(
            `DELETE FROM ${roleTable} WHERE MemberID = :id`,
            [memberID]
        );

        // Check if the member still exists in any other subtype
        const checkOtherRoles = await connection.execute(`
                SELECT COUNT(*) AS count FROM (
                    SELECT MemberID FROM Volunteer WHERE MemberID = :id
                    UNION
                    SELECT MemberID FROM Supervisor WHERE MemberID = :id
                    UNION 
                    SELECT MemberID FROM OfficeWorker WHERE MemberID = :id
                )
            `, [memberID]);

        const remainingCount = checkOtherRoles.rows[0][0];

        if (remainingCount === 0) {
            await connection.execute(
                `DELETE FROM CommunityMember WHERE MemberID = :id`,
                [memberID]
            );
        }

        await connection.commit();

        return {
            success: true,
            message:
                remainingCount === 0
                    ? `Member ${memberID} deleted from ${roleTable} and CommunityMember.`
                    : `Member ${memberID} deleted from ${roleTable} only (still has other roles).`
        };
    }).catch((err) => {
        console.error(err);
        return { success: false, message: 'Error deleting member.' };
    });
}

// run the provided SQL script
// Adapted from https://stackoverflow.com/questions/34857458/reading-local-text-file-into-a-javascript-array
async function runSqlScript(sql) {
    return await withOracleDB(async (conn) => {
        const stmts = sql.split(/;\s*[\r\n]+/).filter(s => s.trim());
        for (const s of stmts) {
            try { await conn.execute(s); } catch (e) {
                if (e.errorNum !== 942) {
                    console.log("SQL error:", e.message);
                }
            }
        }
        await conn.commit();
        return { success: true };
    }).catch(() => ({ success: false }));
}

// Get all table names in the user's schema
async function getTables() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(`SELECT TABLE_NAME FROM USER_TABLES`);
        return result.rows.map(r => r[0]);
    }).catch(err => {
        console.error(err);
        return [];
    });
}


// Get column names for a given table
async function getColumnsForTable(tableName) {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :tbl`,
            { tbl: tableName }
        );
        return result.rows.map(r => r[0]);
    }).catch((err) => {
        console.error(err);
        return [];
    });
}


// Get projection of specified columns from a table
async function getProjection(tableName, columns) {
    return await withOracleDB(async (conn) => {
        const colList = columns.map(c => `"${c}"`).join(', ');
        const sql = `SELECT ${colList} FROM ${tableName}`;
        const result = await conn.execute(sql);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

// Add a donation record
async function addDonation(donationID, amount, donationDate, method, donorSSN, projectID) {
    return await withOracleDB(async (conn) => {
        try {
            // first insert into Donation table
            await conn.execute(
                `INSERT INTO Donation (DonationID, Amount, DonationDate, Method)
                VALUES (:donationID, :amount, TO_DATE(:donationDate, 'YYYY-MM-DD'), :method)`,
                {
                    donationID,
                    amount,
                    donationDate,
                    method
                },
                { autoCommit: true }
            );

            // then insert into Donates table
            await conn.execute(
                `INSERT INTO Donates (DonationID, SSN)
                 VALUES (:donationID, :ssn)`,
                {
                    donationID,
                    ssn: donorSSN
                }
            );
            // finally, if projectID is provided, insert into Funds table
            if (projectID !== null && projectID !== undefined && String(projectID).trim() !== "") {
                await conn.execute(
                    `INSERT INTO Funds (ProjectID, DonationID)
                     VALUES (:projectID, :donationID)`,
                    {
                        projectID,
                        donationID
                    }
                );
            }
            await conn.commit();
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false };
        }
    });
}


// Get all donations for donors whose name matches a search string
async function getDonationsForDonorName(nameFragment) {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `
            SELECT 
                D.DonationID,
                D.Amount,
                TO_CHAR(D.DonationDate, 'YYYY-MM-DD') AS DonationDate,
                D.Method,
                Donor.Name  AS DonorName,
                Donor.Email AS DonorEmail,
                Donor.SSN   AS DonorSSN,
                P.Name      AS ProjectName
            FROM Donation D
            LEFT JOIN Donates Do ON D.DonationID = Do.DonationID
            LEFT JOIN Donor      ON Donor.SSN   = Do.SSN
            LEFT JOIN Funds  F   ON D.DonationID = F.DonationID
            LEFT JOIN Project P  ON F.ProjectID  = P.ProjectID
            WHERE LOWER(Donor.Name) LIKE '%' || LOWER(:nameFragment) || '%'
            ORDER BY D.DonationID
            `,
            { nameFragment }
        );
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

// Get volunteers who have contributed more than the average hours
async function getVolunteerMVP() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(`
            SELECT 
                v.MemberID,
                cm.Name,
                SUM(p.Hours) AS TotalHours
            FROM Volunteer v, CommunityMember cm, Participates p
            WHERE v.MemberID = cm.MemberID
            AND v.MemberID = p.MemberID
            GROUP BY v.MemberID, cm.Name
            HAVING SUM(p.Hours) >
            (
                SELECT AVG(total_hours)
                FROM (
                    SELECT 
                        v2.MemberID,
                        SUM(p2.Hours) AS total_hours
                    FROM Volunteer v2, Participates p2
                    WHERE v2.MemberID = p2.MemberID
                    GROUP BY v2.MemberID
                )
            )
            ORDER BY TotalHours DESC
        `);

        return result.rows;
    });
}

// Get distinct campaign types (for dropdown)
async function getCampaignTypes() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(`
            SELECT DISTINCT Type
            FROM Campaign
            ORDER BY Type
        `);
        return result.rows; // each row: [Type]
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

// Division query:
// For a given campaign type, find volunteers who participated in ALL campaigns of that type.
async function getVolunteersForAllCampaignsOfType(campaignType) {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `
            SELECT v.MemberID, cm.Name, cm.Email, cm.Phone
            FROM Volunteer v
            JOIN CommunityMember cm ON v.MemberID = cm.MemberID
            WHERE NOT EXISTS (
                SELECT c.CampaignID
                FROM Campaign c
                WHERE c.Type = :ctype
                  AND NOT EXISTS (
                      SELECT p.MemberID
                      FROM Participates p
                      WHERE p.MemberID = v.MemberID
                        AND p.CampaignID = c.CampaignID
                  )
            )
            ORDER BY v.MemberID
            `,
            { ctype: campaignType }
        );

        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

// Show which volunteers participate in which campaigns
async function getCampaignParticipation() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `
            SELECT 
                v.MemberID,
                cm.Name       AS VolunteerName,
                c.CampaignID,
                c.Name        AS CampaignName,
                c.Type,
                p.Hours
            FROM Participates p
            JOIN Volunteer v       ON p.MemberID  = v.MemberID
            JOIN CommunityMember cm ON v.MemberID = cm.MemberID
            JOIN Campaign c        ON p.CampaignID = c.CampaignID
            ORDER BY c.Type, c.CampaignID, v.MemberID
            `
        );
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}



// Fetch campaigns from the Campaign table
async function fetchCampaignsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT 
                CampaignID,
                Name,
                TO_CHAR(CampaignDate, 'YYYY-MM-DD') AS CampaignDate,
                Type
            FROM Campaign
            ORDER BY Type, CampaignID
        `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}


// Validate if a MemberID exists and is a Supervisor
async function validateSupervisor(memberID) {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(
            `
            SELECT COUNT(*) 
            FROM CommunityMember cm
            JOIN Supervisor s ON cm.MemberID = s.MemberID
            WHERE cm.MemberID = :id
            `,
            [memberID]
        );

        const count = result.rows[0][0];

        if (count === 1) {
            return { isValid: true, message: `Supervisor ID ${memberID} validated.` };
        } else {
            return { isValid: false, message: `MemberID ${memberID} is not a registered supervisor.` };
        }
    }).catch((err) => {
        console.error(err);
        return { isValid: false, message: 'Server error during validation.' };
    });
}

// Add a Project record
async function addProject(projectId, name, description, goalAmount, supervisorID) {
    return await withOracleDB(async (conn) => {
        try {
            // Insert the new Project record, using SupervisorMemberID as a foreign key directly in the Project table.
            await conn.execute(
                `INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID)
                 VALUES (:projectId, :name, :description, :goalAmount, :supervisorID)`,
                {
                    projectId,
                    name,
                    description,
                    goalAmount: parseFloat(goalAmount),
                    supervisorID
                }
            );

            await conn.commit();
            return { success: true };
        } catch (err) {
            console.error(err);
            // This captures DB errors like primary key violations or FK violations (invalid supervisorID)
            return { success: false, message: 'Database constraint violation or server error.' };
        }
    });
}

// Fetch projects from the Project table
async function fetchProjectsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT 
                ProjectID, 
                Name, 
                Description, 
                GoalAmount,
                SupervisorMemberID
            FROM Project
            ORDER BY ProjectID
        `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}


// Fetch all donors (for dropdown)
async function getDonors() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(`
            SELECT SSN, Name
            FROM Donor
            ORDER BY Name
        `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

// Fetch all projects (for dropdown)
async function getProjects() {
    return await withOracleDB(async (conn) => {
        const result = await conn.execute(`
            SELECT ProjectID, Name
            FROM Project
            ORDER BY ProjectID
        `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}


// Filter projects by goal amount
// type = "lt" for less than, "gt" for greater than
async function filterProjectsByGoal(type, amount) {
    return await withOracleDB(async (conn) => {
        let sql = `
            SELECT ProjectID, Name, Description, GoalAmount, SupervisorMemberID
            FROM Project
        `;

        if (type === 'lt') {
            sql += ` WHERE GoalAmount < :amount`;
        } else if (type === 'gt') {
            sql += ` WHERE GoalAmount > :amount`;
        }

        sql += ` ORDER BY ProjectID`;

        const result = await conn.execute(sql, { amount: parseFloat(amount) });
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}



module.exports = {
    testOracleConnection,
    fetchDonationFromDb,
    fetchProjectsFromDb,
    deleteCommunityMember,
    fetchCommunityMembers,
    runSqlScript,
    getColumnsForTable,
    getProjection,
    addDonation,
    getOfficeWorkers,
    updateOfficeWorker,
    getTables,
    filterDonors,
    getDonationSummaryByMethod,
    getVolunteerMVP,
    validateSupervisor,
    addProject,
    getDonors,
    getProjects,
    getDonationsForDonorName,
    filterProjectsByGoal,
    getCampaignTypes,
    getVolunteersForAllCampaignsOfType,
    fetchCampaignsFromDb,
    getDepartments,
    getCampaignParticipation
};