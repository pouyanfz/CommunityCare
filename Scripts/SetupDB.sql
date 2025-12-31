-------- Drop all tables --------

DROP TABLE Participates;

DROP TABLE Contributes;

DROP TABLE Funds;

DROP TABLE Benefits;

DROP TABLE Donates;

DROP TABLE DonationReceipt;

DROP TABLE OfficeWorker;

DROP TABLE Project;

DROP TABLE Volunteer;

DROP TABLE Supervisor;

DROP TABLE DepartmentFocus;

DROP TABLE DepartmentInfo;

DROP TABLE Campaign;

DROP TABLE Beneficiary;

DROP TABLE CommunityMember;

DROP TABLE Donor;

DROP TABLE Donation;

-------- Create all tables --------

CREATE TABLE
    Donation (
        DonationID NUMBER PRIMARY KEY,
        Amount NUMBER
            CHECK (Amount >= 0),
        DonationDate DATE,
        Method VARCHAR2 (30) NOT NULL
    );

CREATE TABLE
    Donor (
        SSN NUMBER PRIMARY KEY,
        Name VARCHAR2 (100),
        Email VARCHAR2 (255) UNIQUE,
        Address VARCHAR2 (200)
    );

CREATE TABLE
    CommunityMember (
        MemberID NUMBER PRIMARY KEY,
        Name VARCHAR2 (100),
        Email VARCHAR2 (255) UNIQUE
            CHECK (REGEXP_LIKE(Email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')),
        Phone VARCHAR2 (30)
            CHECK (REGEXP_LIKE(Phone, '^[0-9]{3}-[0-9]{3}-[0-9]{4}$')),
        DateJoined DATE
    );

CREATE TABLE
    Beneficiary (
        BeneficiaryID NUMBER PRIMARY KEY,
        Name VARCHAR2 (20),
        Phone VARCHAR2 (10)
            CHECK (REGEXP_LIKE(Phone, '^[0-9]{10}$')),
        Address VARCHAR2 (30)
    );

CREATE TABLE
    Campaign (
        CampaignID NUMBER PRIMARY KEY,
        Name VARCHAR2 (100),
        CampaignDate DATE,
        Type VARCHAR2 (50)
    );

CREATE TABLE
    DepartmentInfo (
        DeptID NUMBER PRIMARY KEY,
        Name VARCHAR2 (100) NOT NULL UNIQUE
    );
-- Needs ON UPDATE CASCADE but oracle does not support this


CREATE TABLE
    DepartmentFocus (
        Name VARCHAR2 (100) PRIMARY KEY,
        FocusArea VARCHAR2 (100) NOT NULL,
        FOREIGN KEY (Name) REFERENCES DepartmentInfo (Name) ON DELETE CASCADE
    );

CREATE TABLE
    Supervisor (
        MemberID NUMBER PRIMARY KEY,
        ExpLevel VARCHAR2 (30),
        Salary NUMBER
            CHECK (Salary >= 0),
        FOREIGN KEY (MemberID) REFERENCES CommunityMember (MemberID) ON DELETE CASCADE
    );

CREATE TABLE
    Volunteer (
        MemberID NUMBER PRIMARY KEY,
        Skills VARCHAR2 (100),
        Availability VARCHAR2 (100),
        PreferredRole VARCHAR2 (100),
        FOREIGN KEY (MemberID) REFERENCES CommunityMember (MemberID) ON DELETE CASCADE
    );

CREATE TABLE
    Project (
        ProjectID NUMBER PRIMARY KEY,
        Name VARCHAR2 (100),
        Description VARCHAR2 (500),
        GoalAmount NUMBER,
        SupervisorMemberID NUMBER NOT NULL,
        FOREIGN KEY (SupervisorMemberID) REFERENCES Supervisor (MemberID) ON DELETE CASCADE
    );

CREATE TABLE
    OfficeWorker (
        MemberID NUMBER PRIMARY KEY,
        Location VARCHAR2 (100),
        Salary NUMBER
            CHECK (Salary >= 0),
        DeptID NUMBER NOT NULL,
        FOREIGN KEY (MemberID) REFERENCES CommunityMember (MemberID) ON DELETE CASCADE,
        FOREIGN KEY (DeptID) REFERENCES DepartmentInfo (DeptID) ON DELETE SET NULL
    );

CREATE TABLE
    DonationReceipt (
        ReceiptNo NUMBER,
        DonationID NUMBER,
        DateIssued DATE,
        PRIMARY KEY (DonationID, ReceiptNo),
        FOREIGN KEY (DonationID) REFERENCES Donation (DonationID) ON DELETE CASCADE
    );

CREATE TABLE
    Donates (
        DonationID NUMBER,
        SSN NUMBER,
        PRIMARY KEY (DonationID, SSN),
        FOREIGN KEY (DonationID) REFERENCES Donation (DonationID) ON DELETE CASCADE,
        FOREIGN KEY (SSN) REFERENCES Donor (SSN) ON DELETE CASCADE
    );

CREATE TABLE
    Funds (
        ProjectID NUMBER,
        DonationID NUMBER,
        PRIMARY KEY (ProjectID, DonationID),
        FOREIGN KEY (ProjectID) REFERENCES Project (ProjectID) ON DELETE CASCADE,
        FOREIGN KEY (DonationID) REFERENCES Donation (DonationID) ON DELETE CASCADE
    );

CREATE TABLE
    Benefits (
        BeneficiaryID NUMBER,
        ProjectID NUMBER,
        TypeOfAid VARCHAR2 (30),
        PRIMARY KEY (ProjectID, BeneficiaryID),
        FOREIGN KEY (ProjectID) REFERENCES Project (ProjectID) ON DELETE CASCADE,
        FOREIGN KEY (BeneficiaryID) REFERENCES Beneficiary (BeneficiaryID) ON DELETE CASCADE
    );

CREATE TABLE
    Contributes (
        DonationID NUMBER,
        CampaignID NUMBER,
        MemberID NUMBER,
        PRIMARY KEY (DonationID, CampaignID, MemberID),
        FOREIGN KEY (DonationID) REFERENCES Donation (DonationID) ON DELETE CASCADE,
        FOREIGN KEY (CampaignID) REFERENCES Campaign (CampaignID) ON DELETE CASCADE,
        FOREIGN KEY (MemberID) REFERENCES CommunityMember (MemberID) ON DELETE CASCADE
    );

CREATE TABLE
    Participates (
        MemberID NUMBER,
        CampaignID NUMBER,
        Hours NUMBER,
        PRIMARY KEY (MemberID, CampaignID),
        FOREIGN KEY (MemberID) REFERENCES Volunteer (MemberID) ON DELETE CASCADE,
        FOREIGN KEY (CampaignID) REFERENCES Campaign (CampaignID) ON DELETE CASCADE
    );

-------- Insert sample data --------

-- Donation
INSERT INTO Donation (DonationID, Amount, DonationDate, Method) VALUES (101, 200, TO_DATE('2025-01-15', 'YYYY-MM-DD'), 'Credit Card');
INSERT INTO Donation (DonationID, Amount, DonationDate, Method) VALUES (102, 500, TO_DATE('2025-02-10', 'YYYY-MM-DD'), 'PayPal');
INSERT INTO Donation (DonationID, Amount, DonationDate, Method) VALUES (103, 150, TO_DATE('2025-03-05', 'YYYY-MM-DD'), 'Cash');
INSERT INTO Donation (DonationID, Amount, DonationDate, Method) VALUES (104, 800, TO_DATE('2025-04-20', 'YYYY-MM-DD'), 'Bank Transfer');
INSERT INTO Donation (DonationID, Amount, DonationDate, Method) VALUES (105, 300, TO_DATE('2025-05-12', 'YYYY-MM-DD'), 'Credit Card');
INSERT INTO Donation (DonationID, Amount, DonationDate, Method) VALUES (106, 1000, TO_DATE('2025-06-08', 'YYYY-MM-DD'), 'Cheque');

-- Donor
INSERT INTO Donor (SSN, Name, Email, Address) VALUES (1111, 'Jane Doe', 'jane.doe@gmail.com', '23 King St, Toronto');
INSERT INTO Donor (SSN, Name, Email, Address) VALUES (2222, 'Brian Chen', 'brian.chen@gmail.com', '90 Queen Rd, Ottawa');
INSERT INTO Donor (SSN, Name, Email, Address) VALUES (3333, 'Ryan Zf', 'ryan.zf@email.com', '12 Maple Ave, Vancouver');
INSERT INTO Donor (SSN, Name, Email, Address) VALUES (4444, 'David Miller', 'david.miller@email.com', '55 Elm St, Montreal');
INSERT INTO Donor (SSN, Name, Email, Address) VALUES (5555, 'Eva Jackson', 'eva.jackson@email.com', '78 Pine Dr, Calgary');

-- CommunityMember
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (401, 'Ava Green', 'ava.green@ngo.org', '604-555-1101', TO_DATE('2023-01-15', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (402, 'Ben Carter', 'ben.carter@ngo.org', '604-555-1102', TO_DATE('2023-03-10', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (403, 'Cara Gomez', 'cara.gomez@ngo.org', '604-555-1103', TO_DATE('2023-06-21', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (404, 'Derek Shaw', 'derek.shaw@ngo.org', '604-555-1104', TO_DATE('2024-02-05', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (405, 'Ella Watts', 'ella.watts@ngo.org', '604-555-1105', TO_DATE('2024-09-12', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (406, 'Finn Patel', 'finn.patel@ngo.org', '604-555-1106', TO_DATE('2025-01-09', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (407, 'Grace Liu', 'grace.liu@ngo.org', '604-555-1107', TO_DATE('2023-04-18', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (408, 'Henry Kim', 'henry.kim@ngo.org', '604-555-1108', TO_DATE('2023-07-23', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (409, 'Isla Thompson', 'isla.thompson@ngo.org', '604-555-1109', TO_DATE('2023-09-02', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (410, 'Jack Wilson', 'jack.wilson@ngo.org', '604-555-1110', TO_DATE('2024-01-17', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (411, 'Kara Martinez', 'kara.martinez@ngo.org', '604-555-1111', TO_DATE('2024-03-21', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (412, 'Liam Brown', 'liam.brown@ngo.org', '604-555-1112', TO_DATE('2024-05-30', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (413, 'Mia Johnson', 'mia.johnson@ngo.org', '604-555-1113', TO_DATE('2024-08-14', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (414, 'Noah Davis', 'noah.davis@ngo.org', '604-555-1114', TO_DATE('2025-02-11', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (415, 'Olivia Scott', 'olivia.scott@ngo.org', '604-555-1115', TO_DATE('2025-04-19', 'YYYY-MM-DD'));
INSERT INTO CommunityMember (MemberID, Name, Email, Phone, DateJoined) VALUES (416, 'Peter Evans', 'peter.evans@ngo.org', '604-555-1116', TO_DATE('2025-06-25', 'YYYY-MM-DD'));


-- Beneficiary
INSERT INTO Beneficiary (BeneficiaryID, Name, Phone, Address) VALUES (1001, 'David', '6041245789', '25 Kent road Vancouver');
INSERT INTO Beneficiary (BeneficiaryID, Name, Phone, Address) VALUES (1002, 'Mamad', '7781452768', '122 Lonsdale North Vancouver');
INSERT INTO Beneficiary (BeneficiaryID, Name, Phone, Address) VALUES (1003, 'Hasan', '2345896347', '535 Shaw Ave Coquitlam');
INSERT INTO Beneficiary (BeneficiaryID, Name, Phone, Address) VALUES (1004, 'John', '6048897514', '122 Bluemountain Vancouver');
INSERT INTO Beneficiary (BeneficiaryID, Name, Phone, Address) VALUES (1005, 'Alex', '7784977896', '3033 East Town road Burnaby');

-- Campaign
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3001, 'Winter Food Drive', TO_DATE('2025-01-10', 'YYYY-MM-DD'), 'Food');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3002, 'Back-to-School Kits', TO_DATE('2025-08-01', 'YYYY-MM-DD'), 'Education');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3003, 'Community Garden', TO_DATE('2025-04-15', 'YYYY-MM-DD'), 'Environment');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3004, 'Mobile Clinic', TO_DATE('2025-05-22', 'YYYY-MM-DD'), 'Health');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3005, 'Shelter Renovation', TO_DATE('2025-03-05', 'YYYY-MM-DD'), 'Housing');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3101, 'Food Drive Expansion', TO_DATE('2025-07-01', 'YYYY-MM-DD'), 'Food');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3102, 'Summer Food Pickup', TO_DATE('2025-07-15', 'YYYY-MM-DD'), 'Food');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3103, 'Fall Food Prep', TO_DATE('2025-09-10', 'YYYY-MM-DD'), 'Food');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3201, 'School Readiness', TO_DATE('2025-05-10', 'YYYY-MM-DD'), 'Education');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3202, 'Evening Tutoring', TO_DATE('2025-06-20', 'YYYY-MM-DD'), 'Education');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3203, 'STEM for Youth', TO_DATE('2025-07-05', 'YYYY-MM-DD'), 'Education');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3301, 'Health Checkup Camp', TO_DATE('2025-03-10', 'YYYY-MM-DD'), 'Health');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3302, 'Vaccination Drive', TO_DATE('2025-04-02', 'YYYY-MM-DD'), 'Health');
INSERT INTO Campaign (CampaignID, Name, CampaignDate, Type) VALUES (3303, 'First Aid Workshop', TO_DATE('2025-08-15', 'YYYY-MM-DD'), 'Health');

-- DepartmentInfo
INSERT INTO DepartmentInfo (DeptID, Name) VALUES (501, 'Community Services');
INSERT INTO DepartmentInfo (DeptID, Name) VALUES (502, 'Finance');
INSERT INTO DepartmentInfo (DeptID, Name) VALUES (503, 'Health and Safety');
INSERT INTO DepartmentInfo (DeptID, Name) VALUES (504, 'Education');
INSERT INTO DepartmentInfo (DeptID, Name) VALUES (505, 'Environmental Support');

-- DepartmentFocus
INSERT INTO DepartmentFocus (Name, FocusArea) VALUES ('Community Services', 'Poverty Relief');
INSERT INTO DepartmentFocus (Name, FocusArea) VALUES ('Finance', 'Fund Management');
INSERT INTO DepartmentFocus (Name, FocusArea) VALUES ('Health and Safety', 'Medical Assistance');
INSERT INTO DepartmentFocus (Name, FocusArea) VALUES ('Education', 'Youth Literacy Programs');
INSERT INTO DepartmentFocus (Name, FocusArea) VALUES ('Environmental Support', 'Clean Energy');

-- Supervisor
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (401, 'Senior', 85000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (402, 'Senior', 90000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (403, 'Intermediate', 70000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (404, 'Junior', 60000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (405, 'Intermediate', 75000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (406, 'Junior', 58000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (407, 'Junior', 62000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (408, 'Intermediate', 74000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (409, 'Senior', 88000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (410, 'Intermediate', 72000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (411, 'Junior', 61000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (412, 'Senior', 91000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (413, 'Intermediate', 76000);
INSERT INTO Supervisor (MemberID, ExpLevel, Salary) VALUES (414, 'Junior', 60000);


-- Volunteer
INSERT INTO Volunteer (MemberID, Skills, Availability, PreferredRole) VALUES (401, 'First aid; distribution', 'Weekends', 'Field helper');
INSERT INTO Volunteer (MemberID, Skills, Availability, PreferredRole) VALUES (402, 'Driving; logistics', 'Evenings', 'Driver');
INSERT INTO Volunteer (MemberID, Skills, Availability, PreferredRole) VALUES (404, 'Event setup', 'Flexible', 'Setup crew');
INSERT INTO Volunteer (MemberID, Skills, Availability, PreferredRole) VALUES (405, 'Tutoring', 'Weekdays', 'Mentor');
INSERT INTO Volunteer (MemberID, Skills, Availability, PreferredRole) VALUES (406, 'Food prep', 'Weekends', 'Kitchen support');
INSERT INTO Volunteer (MemberID, Skills, Availability, PreferredRole) VALUES (407, 'Food prep', 'Weekends', 'Kitchen support');


-- Project
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (301, 'Food Drive', 'Collect and distribute food for low-income families', 10000, 401);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (302, 'Clean Water', 'Install water purification systems in rural areas', 20000, 402);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (303, 'School Supplies', 'Provide educational kits for children', 12000, 403);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (304, 'Shelter Renovation', 'Repair shelters for homeless families', 25000, 404);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (305, 'Healthcare Outreach', 'Medical support for remote communities', 18000, 405);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (306, 'Tree Planting', 'Plant trees to improve urban green spaces', 15000, 407);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (307, 'Animal Rescue', 'Support and rescue stray animals', 12000, 410);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (308, 'Community Garden', 'Create gardens in neighborhoods for fresh produce', 10000, 411);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (309, 'Literacy Program', 'Provide reading programs for adults', 13000, 403);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (310, 'Youth Sports', 'Organize sports activities for children', 14000, 408);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (311, 'Disaster Relief', 'Provide aid to disaster-affected areas', 22000, 412);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (312, 'Mental Health', 'Support mental health programs for communities', 16000, 406);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (313, 'Senior Care', 'Assist senior citizens with daily needs', 15000, 414);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (314, 'Tech for Schools', 'Provide computers and tech equipment for schools', 18000, 409);
INSERT INTO Project (ProjectID, Name, Description, GoalAmount, SupervisorMemberID) VALUES (315, 'Cultural Events', 'Organize cultural programs and workshops', 11000, 401);


-- OfficeWorker
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (402, 'HQ 3F', 72000, 501);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (403, 'Finance Wing', 68000, 502);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (405, 'Clinic Trailer', 70000, 503);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (406, 'Warehouse', 61000, 505);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (404, 'HQ 2F', 60000, 504);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (407, 'Research Lab', 75000, 501);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (408, 'Reception Area', 58000, 502);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (409, 'IT Office', 72000, 504);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (410, 'Logistics Center', 65000, 501);
INSERT INTO OfficeWorker (MemberID, Location, Salary, DeptID) VALUES (411, 'Training Room', 63000, 505);


-- DonationReceipt
INSERT INTO DonationReceipt (ReceiptNo, DonationID, DateIssued) VALUES (9001, 101, TO_DATE('2025-01-16', 'YYYY-MM-DD'));
INSERT INTO DonationReceipt (ReceiptNo, DonationID, DateIssued) VALUES (9002, 102, TO_DATE('2025-02-11', 'YYYY-MM-DD'));
INSERT INTO DonationReceipt (ReceiptNo, DonationID, DateIssued) VALUES (9003, 103, TO_DATE('2025-03-06', 'YYYY-MM-DD'));
INSERT INTO DonationReceipt (ReceiptNo, DonationID, DateIssued) VALUES (9004, 104, TO_DATE('2025-04-21', 'YYYY-MM-DD'));
INSERT INTO DonationReceipt (ReceiptNo, DonationID, DateIssued) VALUES (9005, 105, TO_DATE('2025-05-13', 'YYYY-MM-DD'));
INSERT INTO DonationReceipt (ReceiptNo, DonationID, DateIssued) VALUES (9006, 106, TO_DATE('2025-06-09', 'YYYY-MM-DD'));

-- Donates
INSERT INTO Donates (DonationID, SSN) VALUES (101, 1111);
INSERT INTO Donates (DonationID, SSN) VALUES (102, 2222);
INSERT INTO Donates (DonationID, SSN) VALUES (103, 3333);
INSERT INTO Donates (DonationID, SSN) VALUES (104, 4444);
INSERT INTO Donates (DonationID, SSN) VALUES (105, 5555);
INSERT INTO Donates (DonationID, SSN) VALUES (106, 1111);

-- Funds
INSERT INTO Funds (ProjectID, DonationID) VALUES (301, 103);
INSERT INTO Funds (ProjectID, DonationID) VALUES (301, 102);
INSERT INTO Funds (ProjectID, DonationID) VALUES (302, 104);
INSERT INTO Funds (ProjectID, DonationID) VALUES (303, 102);
INSERT INTO Funds (ProjectID, DonationID) VALUES (304, 101);

-- Benefits
INSERT INTO Benefits (BeneficiaryID, ProjectID, TypeOfAid) VALUES (1001, 301, 'Cash Payment');
INSERT INTO Benefits (BeneficiaryID, ProjectID, TypeOfAid) VALUES (1002, 302, 'Medical Supplies');
INSERT INTO Benefits (BeneficiaryID, ProjectID, TypeOfAid) VALUES (1003, 303, 'Scholarship');
INSERT INTO Benefits (BeneficiaryID, ProjectID, TypeOfAid) VALUES (1004, 304, 'Shelter Support');
INSERT INTO Benefits (BeneficiaryID, ProjectID, TypeOfAid) VALUES (1005, 305, 'Groceries');

-- Contributes
INSERT INTO Contributes (DonationID, CampaignID, MemberID) VALUES (101, 3001, 401);
INSERT INTO Contributes (DonationID, CampaignID, MemberID) VALUES (102, 3002, 402);
INSERT INTO Contributes (DonationID, CampaignID, MemberID) VALUES (103, 3003, 403);
INSERT INTO Contributes (DonationID, CampaignID, MemberID) VALUES (104, 3004, 404);
INSERT INTO Contributes (DonationID, CampaignID, MemberID) VALUES (105, 3005, 405);
INSERT INTO Contributes (DonationID, CampaignID, MemberID) VALUES (106, 3001, 406);

-- Participates
-- Food: 401 has all, 402 has some
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (401, 3001, 12);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (401, 3101, 12);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (401, 3102, 5);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (401, 3103, 5);

-- Education: 404 has all
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (402, 3001, 8);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (402, 3101, 4);

-- Health: 406 has all, 405 has one
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (404, 3002, 15);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (404, 3201, 7);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (404, 3202, 6);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (404, 3203, 9);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (405, 3004, 10);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (406, 3301, 9);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (406, 3302, 8);
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (406, 3303, 7);

-- Housing (single campaign)
INSERT INTO Participates (MemberID, CampaignID, Hours) VALUES (406, 3005, 9);

COMMIT;
