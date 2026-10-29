ATU ATTENDANCE — STUDENT ATTENDANCE MANAGEMENT SYSTEM

RUN LOCALLY
1. Extract this ZIP file.
2. Open the atu_attendance_system folder in VS Code.
3. Open index.html in a browser, or use the Live Server extension.
4. Sign in with one of the demo accounts below.

DEMO ACCOUNTS
Administrator: admin@school.com / Admin123!
Coordinator: coordinator@school.com / Coord123!
Student: student@school.com / Student123!

WHAT IS INCLUDED
- ATU crest included locally as atulogo.jpg and displayed throughout the portal branding
- Accra Technical University navy-blue and gold colour theme
- Separate index.html, style.css, and app.js files
- Responsive role-based dashboards for administrator, coordinator, and student
- Attendance recording and history, user management, filtering, and CSV export

IMPORTANT SECURITY LIMITATIONS
This is a front-end demonstration project. Users, passwords, sessions, and attendance are stored in browser localStorage. This is not secure authentication or server-enforced authorization; browser data can be modified and data is only available in that browser profile. Do not use real student data or deploy publicly. For a real school system, use a backend such as Supabase or Firebase Authentication with server-enforced role-based access policies.

RESET DEMO DATA
Clear localStorage for the page in browser developer tools and reload.

COURSES, REGISTRATION, AND SCORES
- Administrator and coordinator accounts can open Courses to add courses with a code, name, lecturer/coordinator, and credit hours.
- Students can open Register courses to browse the catalogue and register for courses. Duplicate registration is prevented.
- Administrator and coordinator accounts can open Course scores, select a course and assessment, enter scores for registered students, and save or update marks.
- Staff can filter recorded scores by course and export scores to CSV.
- Students can open My scores to check their assessment marks, maximum score, percentage, and a simple 50% pass indicator.
- The demo includes a sample course catalogue, sample registrations, and two sample marks for the student@school.com account.
- All course, registration, and score data is stored in browser localStorage for demonstration only.


STUDENT PASSWORD CHANGE
-----------------------
Students who are signed in can open “Change password” in the left menu. Enter the current password, a new password (at least 8 characters), and confirm it. If a student has forgotten their current password, an administrator/coordinator must help reset it in this demo. Secure email-based password recovery requires a configured authentication backend such as Supabase Auth.

SECURITY NOTE
-------------
This project is a front-end demo and stores demo passwords in browser localStorage. Do not use real student passwords or sensitive student data in this version. For production, use a proper authentication provider and server-side access policies.
