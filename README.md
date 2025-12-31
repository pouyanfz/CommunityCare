# CommunityCare
**CPSC 304 Course Project**

---

## Project Summary
CommunityCare is a database system designed to support the operations of a charity or NGO. Our final project implements a functional system that manages donors, donations, campaigns, projects, volunteers, beneficiaries, office staff, and supervisors.

We built a working relational database with full create, read, update and delete support across all major entities. The system allows recording donations, allocating them to campaigns or projects, issuing and reissuing receipts, managing volunteer participation, linking beneficiaries to projects or campaigns, and organizing staff information.

We also implemented several advanced database features, including aggregation queries, nested queries, projection with dynamic columns and a report page that allows users to filter, search, and summarize key data. The web interface provides simple navigation for administrators to manage all parts of the organization.

---

## Tech Stack
- Primary Language: JavaScript

### Backend
- Runtime: Node.js
- Framework: Express.js
- Database Driver: oracledb module
- Database: Oracle SQL

### Frontend
- HTML
- JavaScript
- Bootstrap for styling and layout

---

## System Architecture
The application follows a three layer architecture:

1. Frontend  
   Static HTML and JavaScript responsible for user input, rendering tables, and sending HTTP requests.

2. Backend API  
   A REST style API implemented using Express.js that exposes routes for CRUD operations.

3. Database  
   An Oracle relational database that stores all persistent data and enforces integrity constraints.

---

## REST API Design
The backend exposes REST style endpoints that accept and return JSON.

- Frontend sends HTTP requests using fetch
- Requests contain JSON payloads
- Backend responds with success or failure messages
- Each route maps to a specific database operation

Example operations include insert, update, delete, and query endpoints for core entities.

---

## Advanced SQL Features
- Aggregation queries using GROUP BY and HAVING
- Nested and correlated subqueries
- Dynamic projection queries
- Transaction safe insert, update, and delete operations
- Reporting queries with filtering and sorting

### Developers:
- Pouyan Forouzandeh
- Hossein Toutounchi
- Muhtadi Elmardi

---
### Screenshot
![ER Diagram](/Documentation/ScreenShots/ER%20Diagram.png)
![Home Page](/Documentation/ScreenShots/1.png)
![Community Members](/Documentation/ScreenShots/2.png)
![Donation](/Documentation/ScreenShots/3.png)
![Add Donation](/Documentation/ScreenShots/4.png)
![Project](/Documentation/ScreenShots/5.png)
![Campaign](/Documentation/ScreenShots/6.png)
![Update Members](/Documentation/ScreenShots/7.png)

