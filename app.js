const KEYS = {
  users: "attendly_users_v2",
  session: "attendly_session_v2",
  records: "attendly_attendance_v2",
  courses: "attendly_courses_v1",
  registrations: "attendly_course_registrations_v1",
  scores: "attendly_course_scores_v1"
};
const app = document.getElementById("app");
const STATUSES = ["Present", "Absent", "Late", "Excused"];

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function uid(prefix = "id") {
  return prefix + "-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function shiftDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function prettyDate(date) {
  if (!date) return "—";
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" });
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
}
function roleLabel(role) {
  return ({ administrator:"Administrator", coordinator:"Coordinator", student:"Student" })[role] || "User";
}
function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0,2).map(part => part[0] || "").join("").toUpperCase();
}
function users() { return read(KEYS.users, []); }
function records() { return read(KEYS.records, []); }
function saveUsers(list) { write(KEYS.users, list); }
function saveRecords(list) { write(KEYS.records, list); }
function courses() { return read(KEYS.courses, []); }
function registrations() { return read(KEYS.registrations, []); }
function scores() { return read(KEYS.scores, []); }
function saveCourses(list) { write(KEYS.courses, list); }
function saveRegistrations(list) { write(KEYS.registrations, list); }
function saveScores(list) { write(KEYS.scores, list); }
function courseById(id) { return courses().find(c => c.id === id); }
function isRegistered(studentId, courseId) { return registrations().some(r => r.studentId === studentId && r.courseId === courseId); }
function studentCourses(studentId) { return courses().filter(c => isRegistered(studentId, c.id)); }

function initDemo() {
  if (!localStorage.getItem(KEYS.users)) {
    saveUsers([
      { id:"admin-001", name:"System Administrator", email:"admin@school.com", password:"Admin123!", role:"administrator", studentId:"" },
      { id:"coord-001", name:"Demo Coordinator", email:"coordinator@school.com", password:"Coord123!", role:"coordinator", studentId:"" },
      { id:"student-001", name:"Demo Student", email:"student@school.com", password:"Student123!", role:"student", studentId:"STU-001" },
      { id:"student-002", name:"Ama Mensah", email:"ama@school.com", password:"Student123!", role:"student", studentId:"STU-002" },
      { id:"student-003", name:"Kojo Owusu", email:"kojo@school.com", password:"Student123!", role:"student", studentId:"STU-003" },
      { id:"student-004", name:"Abena Boateng", email:"abena@school.com", password:"Student123!", role:"student", studentId:"STU-004" },
      { id:"student-005", name:"Kofi Asare", email:"kofi@school.com", password:"Student123!", role:"student", studentId:"STU-005" }
    ]);
  }
  if (!localStorage.getItem(KEYS.courses)) {
    saveCourses([
      {id:"course-cs101", code:"CS101", name:"Introduction to Computer Science", lecturer:"Department Coordinator", credits:3},
      {id:"course-comm102", code:"COM102", name:"Communication Skills", lecturer:"Department Coordinator", credits:2},
      {id:"course-math103", code:"MTH103", name:"Mathematics for Computing", lecturer:"Department Coordinator", credits:3},
      {id:"course-prog104", code:"CS104", name:"Programming Fundamentals", lecturer:"Department Coordinator", credits:3}
    ]);
  }
  if (!localStorage.getItem(KEYS.registrations)) {
    const studentIds = users().filter(u => u.role === "student").map(u => u.id);
    const courseIds = courses().map(c => c.id);
    saveRegistrations(studentIds.flatMap((studentId, i) => courseIds.slice(0, i === 0 ? 3 : 2).map(courseId => ({id:uid("reg"), studentId, courseId, registeredAt:new Date().toISOString()}))));
  }
  if (!localStorage.getItem(KEYS.scores)) {
    const demo = users().find(u => u.email === "student@school.com");
    saveScores(demo ? [
      {id:uid("score"), studentId:demo.id, courseId:"course-cs101", score:78, maxScore:100, assessment:"Mid-semester test", updatedBy:"coord-001", updatedAt:new Date().toISOString()},
      {id:uid("score"), studentId:demo.id, courseId:"course-comm102", score:84, maxScore:100, assessment:"Assignment 1", updatedBy:"coord-001", updatedAt:new Date().toISOString()}
    ] : []);
  }
  if (!localStorage.getItem(KEYS.records)) {
    const sample = [];
    const studentIds = users().filter(u => u.role === "student").map(u => u.id);
    for (let day = 1; day <= 5; day++) {
      const date = shiftDate(-day);
      studentIds.forEach((id, index) => {
        const status = ((day + index) % 9 === 0) ? "Absent" : ((day + index) % 7 === 0 ? "Late" : "Present");
        sample.push({ id:uid("att"), studentId:id, date, course:"Computer Science", status, note:"", markedBy:"coord-001", updatedAt:new Date().toISOString() });
      });
    }
    saveRecords(sample);
  }
}
function currentUser() {
  const session = read(KEYS.session, null);
  return session ? users().find(u => u.id === session.userId) || null : null;
}
function toast(message) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
function showLogin(message = "") {
  app.innerHTML = `
    <div class="login-page">
      <section class="login-visual">
        <div class="brand"><img class="brand-crest" src="atulogo.jpg" alt="Accra Technical University crest"><div class="brand-name">ATU <span>Attendance</span><small>Accra Technical University</small></div></div>
        <div class="visual-copy">
          <div class="eyebrow">ACCRA TECHNICAL UNIVERSITY · ATTENDANCE PORTAL</div>
          <h1>Every class.<br>Every student.<br>All accounted for.</h1>
          <p>A clearer way to record attendance, follow student participation, and help your school make informed decisions.</p>
          <div class="visual-stats">
            <div class="visual-stat"><strong>01</strong><span>One attendance view</span></div>
            <div class="visual-stat"><strong>24/7</strong><span>Records at a glance</span></div>
          </div>
        </div>
        <div class="decor-card"></div>
        <div class="visual-footer">Accra Technical University · Student Attendance Management System</div>
      </section>
      <section class="login-area">
        <div class="login-box">
          <div class="brand"><img class="brand-crest" src="atulogo.jpg" alt="Accra Technical University crest"><div class="brand-name">ATU <span>Attendance</span><small>Accra Technical University</small></div></div>
          <h2>Welcome back</h2>
          <p class="subheading">Sign in to manage or view attendance records for your school.</p>
          <form id="loginForm">
            <div class="field"><label for="email">EMAIL ADDRESS</label><input id="email" type="email" autocomplete="username" placeholder="you@school.com" required></div>
            <div class="field"><label for="password">PASSWORD</label><input id="password" type="password" autocomplete="current-password" placeholder="Enter your password" required></div>
            <button class="btn btn-primary btn-full" type="submit">Sign in <span aria-hidden="true">→</span></button>
            <p id="loginMessage" class="error" role="alert">${escapeHTML(message)}</p>
          </form>
          <div class="demo-box">
            <strong>DEMO ACCESS · USE ANY ACCOUNT</strong>
            <div class="demo-account"><span>Administrator</span><code>admin@school.com</code></div>
            <div class="demo-account"><span>Coordinator</span><code>coordinator@school.com</code></div>
            <div class="demo-account"><span>Student</span><code>student@school.com</code></div>
            <div class="demo-account"><span>Demo password</span><code>Admin123! / Coord123! / Student123!</code></div>
          </div>
        </div>
      </section>
    </div>`;
  document.getElementById("loginForm").addEventListener("submit", login);
}
function login(event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const found = users().find(u => u.email.toLowerCase() === email && u.password === password);
  if (!found) {
    document.getElementById("loginMessage").textContent = "That email and password do not match an account.";
    return;
  }
  write(KEYS.session, { userId:found.id });
  renderApp();
}
function logout() {
  localStorage.removeItem(KEYS.session);
  showLogin("You have been signed out.");
}
function navFor(user) {
  const items = user.role === "administrator"
    ? [["dashboard","▦","Overview"],["attendance","✓","Attendance"],["courses","▣","Courses"],["scores","％","Course scores"],["users","♙","User management"]]
    : user.role === "coordinator"
    ? [["dashboard","▦","Overview"],["attendance","✓","Take attendance"],["courses","▣","Courses"],["scores","％","Course scores"],["students","♙","Students"]]
    : [["dashboard","▦","My overview"],["myAttendance","◷","My attendance"],["courses","▣","Register courses"],["scores","％","My scores"],["security","⚿","Change password"]];
  return items.map(([id,icon,label],i) => `<button class="nav-btn ${i===0?"active":""}" data-page="${id}"><span class="nav-icon">${icon}</span>${label}</button>`).join("");
}
function shell(user, page, title, content) {
  app.innerHTML = `<div class="app-layout">
    <aside class="sidebar">
      <div class="brand"><img class="brand-crest" src="atulogo.jpg" alt="Accra Technical University crest"><div class="brand-name">ATU <span>Attendance</span><small>Accra Technical University</small></div></div>
      <div class="sidebar-label">WORKSPACE</div><nav class="nav-list">${navFor(user)}</nav>
      <div class="sidebar-bottom">
        <div class="profile-mini"><div class="avatar">${escapeHTML(initials(user.name))}</div><div><strong>${escapeHTML(user.name)}</strong><small>${escapeHTML(roleLabel(user.role))}</small></div></div>
        <button class="nav-btn logout" id="logoutBtn"><span class="nav-icon">↪</span>Sign out</button>
      </div>
    </aside>
    <div class="workspace">
      <header class="topbar"><div><div class="breadcrumb">School portal / ${escapeHTML(title)}</div><div class="topbar-title">${escapeHTML(title)}</div></div>
        <div class="topbar-right"><div class="today-chip">◷ &nbsp; ${prettyDate(todayISO())}</div><div class="avatar">${escapeHTML(initials(user.name))}</div></div>
      </header>
      <main class="page-content">${content}</main>
    </div>
  </div>`;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.querySelectorAll("[data-page]").forEach(button => {
    if (button.dataset.page === page) button.classList.add("active");
    button.addEventListener("click", () => navigate(button.dataset.page));
  });
}
function navigate(page) {
  const user = currentUser();
  if (!user) return showLogin();
  const allowed = user.role === "administrator" ? ["dashboard","attendance","courses","scores","users"] :
    user.role === "coordinator" ? ["dashboard","attendance","courses","scores","students"] : ["dashboard","myAttendance","courses","scores","security"];
  if (!allowed.includes(page)) page = "dashboard";
  if (page === "dashboard") renderOverview(user);
  else if (page === "attendance") renderAttendance(user);
  else if (page === "users") renderUsersPage(user);
  else if (page === "students") renderStudentsPage(user);
  else if (page === "courses") renderCoursesPage(user);
  else if (page === "scores") renderScoresPage(user);
  else if (page === "security" && user.role === "student") renderStudentPasswordPage(user);
  else renderMyAttendance(user);
}
function renderApp() {
  const user = currentUser();
  if (!user) { localStorage.removeItem(KEYS.session); showLogin(); return; }
  renderOverview(user);
}
function studentsList() { return users().filter(u => u.role === "student"); }
function studentById(id) { return users().find(u => u.id === id && u.role === "student"); }
function recordsForDate(date) { return records().filter(r => r.date === date); }
function statsFor(list) {
  return {
    total:list.length,
    present:list.filter(r=>r.status==="Present").length,
    absent:list.filter(r=>r.status==="Absent").length,
    late:list.filter(r=>r.status==="Late").length,
    excused:list.filter(r=>r.status==="Excused").length
  };
}
function attendanceRate(list) {
  const count = list.filter(r => ["Present","Late"].includes(r.status)).length;
  return list.length ? Math.round(count / list.length * 100) : 0;
}
function statCard(label, number, icon, color, foot) {
  return `<div class="stat-card"><div class="stat-head"><span>${label}</span><span class="stat-icon ${color}">${icon}</span></div><div class="stat-number">${number}</div><div class="stat-foot">${foot}</div></div>`;
}
function weeklyChart() {
  const days = Array.from({length:7},(_,i)=>shiftDate(i-6));
  const all = records();
  return `<div class="chart-wrap">${days.map(date=>{
    const list=all.filter(r=>r.date===date), s=statsFor(list);
    const denominator=Math.max(list.length,1);
    const presentHeight=list.length ? Math.round(s.present/denominator*145) : 5;
    const absentHeight=list.length ? Math.round((s.absent+s.late+s.excused)/denominator*145) : 5;
    return `<div class="chart-day"><div class="bar-stack" title="${prettyDate(date)}: ${s.present} present, ${s.absent} absent"><div class="bar-present" style="height:${presentHeight}px"></div><div class="bar-absent" style="height:${absentHeight}px"></div></div><span>${new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}</span></div>`;
  }).join("")}</div><div class="legend"><span><i class="present-dot"></i>Present</span><span><i class="absent-dot"></i>Other statuses</span></div>`;
}
function statusBadge(status) {
  const cls = ({Present:"present",Absent:"absent",Late:"late",Excused:"excused"})[status] || "pending";
  return `<span class="badge badge-${cls}">${escapeHTML(status || "Not marked")}</span>`;
}
function recentTable(list, showStudent=true) {
  if (!list.length) return `<div class="empty-state"><strong>No attendance records yet</strong>Records will appear here after attendance is taken.</div>`;
  return `<div class="table-wrap"><table><thead><tr>${showStudent?"<th>Student</th>":""}<th>Class / course</th><th>Date</th><th>Status</th></tr></thead><tbody>${list.slice(0,7).map(r=>{
    const s=studentById(r.studentId);
    return `<tr>${showStudent?`<td><div class="student-cell"><div class="avatar">${escapeHTML(initials(s?.name||"Student"))}</div><div><strong>${escapeHTML(s?.name||"Deleted student")}</strong><small>${escapeHTML(s?.studentId||"")}</small></div></div>`:""}<td>${escapeHTML(r.course)}</td><td>${prettyDate(r.date)}</td><td>${statusBadge(r.status)}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}
function renderOverview(user) {
  const allRecords = records();
  const students = studentsList();
  const todayRecords = recordsForDate(todayISO());
  const todayStats = statsFor(todayRecords);
  const recent = [...allRecords].sort((a,b)=>(b.date+a.updatedAt).localeCompare(a.date+b.updatedAt));
  if (user.role === "student") {
    const own = allRecords.filter(r=>r.studentId===user.id).sort((a,b)=>b.date.localeCompare(a.date));
    const rate = attendanceRate(own);
    const content = `<section class="welcome-row"><div><h1>Good day, ${escapeHTML(user.name.split(" ")[0])} 👋</h1><p>Here is your personal attendance overview.</p></div><div class="welcome-actions"><button class="btn btn-primary" data-page="myAttendance">View my records →</button></div></section>
      <section class="grid stats-grid">${statCard("Attendance rate",rate+"%","◉","icon-blue","Based on your recorded sessions")}${statCard("Classes recorded",own.length,"▤","icon-purple","All recorded sessions")}${statCard("Present",own.filter(r=>r.status==="Present").length,"✓","icon-green","Marked present")}${statCard("Absent",own.filter(r=>r.status==="Absent").length,"!","icon-orange","Marked absent")}</section>
      <section class="panel"><div class="panel-head"><div><h2>Recent attendance</h2><p>Your latest recorded classes.</p></div><button class="btn btn-light" data-page="myAttendance">View all</button></div>${recentTable(own,false)}</section>`;
    shell(user,"dashboard","My overview",content);
    bindPageButtons();
    return;
  }
  const coordinatorCount = users().filter(u=>u.role==="coordinator").length;
  const content = `<section class="welcome-row"><div><h1>${user.role==="administrator"?"School overview":"Welcome back, "+escapeHTML(user.name.split(" ")[0])+" 👋"}</h1><p>${user.role==="administrator"?"A live snapshot of student attendance and school accounts.":"Take attendance, review student records, and keep your class data up to date."}</p></div><div class="welcome-actions"><button class="btn btn-primary" data-page="attendance">＋ Take attendance</button></div></section>
    <section class="grid stats-grid">
      ${statCard("Total students",students.length,"♙","icon-blue","Student accounts")}
      ${statCard("Present today",todayStats.present,"✓","icon-green",todayRecords.length+" records marked today")}
      ${statCard("Absent today",todayStats.absent,"!","icon-orange","Requires follow-up")}
      ${statCard(user.role==="administrator"?"Coordinators":"Attendance rate",user.role==="administrator"?coordinatorCount:attendanceRate(todayRecords)+"%","◉","icon-purple",user.role==="administrator"?"Active coordinator accounts":"Present or late today")}
    </section>
    <section class="grid two-col">
      <div class="panel"><div class="panel-head"><div><h2>Attendance activity</h2><p>Recorded attendance over the last seven days.</p></div></div>${weeklyChart()}</div>
      <div class="panel"><div class="panel-head"><div><h2>Today's attendance</h2><p>Attendance status breakdown.</p></div></div>
        ${["Present","Absent","Late","Excused"].map((status,i)=>{
          const n=todayStats[status.toLowerCase()];
          const pct=todayRecords.length?Math.round(n/todayRecords.length*100):0;
          return `<div class="progress-item"><div class="progress-label"><span>${status}</span><span>${n} · ${pct}%</span></div><div class="progress-track"><div class="progress-fill ${["green","","orange",""][i]}" style="width:${pct}%"></div></div></div>`;
        }).join("")}
        <p class="stat-foot">${todayRecords.length} of ${students.length} students have a record today.</p>
      </div>
    </section>
    <section class="panel"><div class="panel-head"><div><h2>Recent attendance records</h2><p>Latest sessions recorded in the system.</p></div><button class="btn btn-light" data-page="attendance">Manage attendance →</button></div>${recentTable(recent,true)}</section>`;
  shell(user,"dashboard","Overview",content);
  bindPageButtons();
}
function bindPageButtons() {
  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.page));
  });
}
function renderAttendance(user, selectedDate=todayISO(), courseFilter="") {
  if (!["administrator","coordinator"].includes(user.role)) return renderOverview(user);
  const studentList = studentsList();
  const dayRecords = recordsForDate(selectedDate).filter(r=>!courseFilter||r.course===courseFilter);
  const stats = statsFor(dayRecords);
  const existingByStudent = new Map(dayRecords.map(r=>[r.studentId,r]));
  const courses = [...new Set(records().map(r=>r.course).filter(Boolean))];
  const content = `<section class="welcome-row"><div><h1>Attendance register</h1><p>Choose a date and course, then mark each student's status.</p></div><div class="welcome-actions"><button class="btn btn-light" id="exportAttendance">↓ Export CSV</button></div></section>
    <div id="attendanceNotice"></div>
    <section class="panel">
      <div class="attendance-form">
        <div class="field"><label for="attendanceDate">CLASS DATE</label><input class="control" type="date" id="attendanceDate" value="${escapeHTML(selectedDate)}" max="${todayISO()}"></div>
        <div class="field"><label for="attendanceCourse">COURSE / CLASS</label><input class="control" id="attendanceCourse" maxlength="100" value="${escapeHTML(courseFilter||"Computer Science")}" placeholder="e.g. Computer Science"></div>
        <div class="field"><label for="courseFilter">FILTER SAVED COURSE</label><select class="control" id="courseFilter"><option value="">All courses</option>${courses.map(c=>`<option value="${escapeHTML(c)}" ${c===courseFilter?"selected":""}>${escapeHTML(c)}</option>`).join("")}</select></div>
      </div>
      <div class="toolbar"><div class="toolbar-left"><div><strong style="font-size:13px">${studentList.length} students</strong><div class="stat-foot" style="margin-top:4px">${prettyDate(selectedDate)}</div></div></div>
        <div class="toolbar-right"><button class="btn btn-light" id="markAllPresent">Mark all present</button><button class="btn btn-primary" id="saveAttendance">Save attendance</button></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Status</th><th>Note (optional)</th></tr></thead>
      <tbody>${studentList.map(s=>{
        const r=existingByStudent.get(s.id);
        return `<tr data-student-row="${escapeHTML(s.id)}"><td><div class="student-cell"><div class="avatar">${escapeHTML(initials(s.name))}</div><div><strong>${escapeHTML(s.name)}</strong><small>${escapeHTML(s.email)}</small></div></div></td><td>${escapeHTML(s.studentId||"—")}</td><td><select class="status-select" data-status-for="${escapeHTML(s.id)}"><option value="">Not marked</option>${STATUSES.map(st=>`<option value="${st}" ${r?.status===st?"selected":""}>${st}</option>`).join("")}</select></td><td><input class="search-input" style="width:150px" data-note-for="${escapeHTML(s.id)}" maxlength="180" value="${escapeHTML(r?.note||"")}" placeholder="Optional note"></td></tr>`;
      }).join("")}</tbody></table></div>
      <p class="stat-foot" style="margin-top:14px">Choose a status for each student, then select Save attendance. Existing entries for the same student, date and course will be updated.</p>
    </section>
    <section class="grid stats-grid">
      ${statCard("Present",stats.present,"✓","icon-green","Selected date")}
      ${statCard("Absent",stats.absent,"!","icon-orange","Selected date")}
      ${statCard("Late",stats.late,"◷","icon-purple","Selected date")}
      ${statCard("Excused",stats.excused,"↗","icon-blue","Selected date")}
    </section>
    <section class="panel"><div class="panel-head"><div><h2>Saved records for ${prettyDate(selectedDate)}</h2><p>Records matching the selected date and course filter.</p></div></div>${recentTable(dayRecords.sort((a,b)=>(studentById(a.studentId)?.name||"").localeCompare(studentById(b.studentId)?.name||"")),true)}</section>`;
  shell(user,"attendance","Attendance register",content);
  document.getElementById("attendanceDate").addEventListener("change",e=>renderAttendance(currentUser(),e.target.value||todayISO(),document.getElementById("courseFilter").value));
  document.getElementById("courseFilter").addEventListener("change",e=>renderAttendance(currentUser(),document.getElementById("attendanceDate").value, e.target.value));
  document.getElementById("markAllPresent").addEventListener("click",()=>{
    document.querySelectorAll("[data-status-for]").forEach(select=>select.value="Present");
  });
  document.getElementById("saveAttendance").addEventListener("click",()=>{
    const current=currentUser();
    if(!current || !["administrator","coordinator"].includes(current.role)) { logout(); return; }
    const date=document.getElementById("attendanceDate").value;
    const course=document.getElementById("attendanceCourse").value.trim();
    const notice=document.getElementById("attendanceNotice");
    if(!date || date>todayISO() || !course) {
      notice.innerHTML='<div class="notice error">Choose a valid date (not in the future) and enter a course/class.</div>'; return;
    }
    let all=records();
    let saved=0;
    studentList.forEach(student=>{
      const status=document.querySelector(`[data-status-for="${CSS.escape(student.id)}"]`).value;
      const note=document.querySelector(`[data-note-for="${CSS.escape(student.id)}"]`).value.trim();
      if(!status) return;
      const index=all.findIndex(r=>r.studentId===student.id&&r.date===date&&r.course.toLowerCase()===course.toLowerCase());
      const item={id:index>=0?all[index].id:uid("att"),studentId:student.id,date,course,status,note,markedBy:current.id,updatedAt:new Date().toISOString()};
      if(index>=0) all[index]=item; else all.push(item);
      saved++;
    });
    saveRecords(all);
    toast(`${saved} attendance record${saved===1?"":"s"} saved.`);
    renderAttendance(currentUser(),date,document.getElementById("courseFilter").value);
  });
  document.getElementById("exportAttendance").addEventListener("click",()=>exportCSV(dayRecords,`attendance-${selectedDate}.csv`));
}
function renderUsersPage(user) {
  if(user.role!=="administrator") return renderOverview(user);
  const list=users();
  const content=`<section class="welcome-row"><div><h1>User management</h1><p>Create and review accounts for coordinators and students.</p></div><div class="welcome-actions"><button class="btn btn-primary" id="openAddUser">＋ Add user</button></div></section>
    <div id="userNotice"></div>
    <section class="panel"><div class="toolbar"><div class="toolbar-left"><input class="search-input" id="userSearch" placeholder="Search name or email…"></div><div class="toolbar-right"><select class="filter-select" id="roleFilter"><option value="">All roles</option><option value="administrator">Administrator</option><option value="coordinator">Coordinator</option><option value="student">Student</option></select></div></div>
    <div id="usersTable"></div></section>`;
  shell(user,"users","User management",content);
  const renderRows=()=>{
    const q=document.getElementById("userSearch").value.toLowerCase();
    const role=document.getElementById("roleFilter").value;
    const filtered=users().filter(u=>(!role||u.role===role)&&(`${u.name} ${u.email} ${u.studentId||""}`.toLowerCase().includes(q)));
    document.getElementById("usersTable").innerHTML=filtered.length?`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Student ID</th></tr></thead><tbody>${filtered.map(u=>`<tr><td><div class="student-cell"><div class="avatar">${escapeHTML(initials(u.name))}</div><div><strong>${escapeHTML(u.name)}</strong><small>${u.id===user.id?"You":"Account"}</small></div></div></td><td>${escapeHTML(u.email)}</td><td>${statusBadgeRole(u.role)}</td><td>${escapeHTML(u.studentId||"—")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><strong>No users found</strong>Try a different search or role filter.</div>`;
  };
  renderRows();
  document.getElementById("userSearch").addEventListener("input",renderRows);
  document.getElementById("roleFilter").addEventListener("change",renderRows);
  document.getElementById("openAddUser").addEventListener("click",()=>showAddUserModal());
}
function statusBadgeRole(role) {
  const cls=role==="administrator"?"purple":role==="coordinator"?"present":"pending";
  return `<span class="badge badge-${cls}">${escapeHTML(roleLabel(role))}</span>`;
}
function showAddUserModal() {
  document.querySelector(".modal-backdrop")?.remove();
  const modal=document.createElement("div");
  modal.className="modal-backdrop";
  modal.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="addUserTitle">
    <h2 id="addUserTitle">Create an account</h2><p>As administrator, you can create coordinator and student accounts.</p>
    <form id="newUserForm">
      <div class="field"><label for="newName">FULL NAME</label><input id="newName" required maxlength="100" placeholder="Full name"></div>
      <div class="field"><label for="newEmail">EMAIL ADDRESS</label><input id="newEmail" type="email" required maxlength="254" placeholder="name@school.com"></div>
      <div class="field"><label for="newPassword">TEMPORARY PASSWORD</label><input id="newPassword" type="password" required minlength="8" maxlength="128" placeholder="At least 8 characters"></div>
      <div class="field"><label for="newRole">ROLE</label><select id="newRole"><option value="student">Student</option><option value="coordinator">Coordinator</option></select></div>
      <div class="field" id="studentIdField"><label for="newStudentId">STUDENT ID (for students)</label><input id="newStudentId" maxlength="40" placeholder="e.g. STU-006"></div>
      <p id="newUserError" class="error"></p><div class="modal-actions"><button type="button" class="btn btn-light" id="cancelModal">Cancel</button><button type="submit" class="btn btn-primary">Create account</button></div>
    </form></section>`;
  document.body.appendChild(modal);
  const role=document.getElementById("newRole");
  role.addEventListener("change",()=>document.getElementById("studentIdField").style.display=role.value==="student"?"block":"none");
  document.getElementById("cancelModal").addEventListener("click",()=>modal.remove());
  modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
  document.getElementById("newUserForm").addEventListener("submit",e=>{
    e.preventDefault();
    const actor=currentUser();
    if(!actor||actor.role!=="administrator"){modal.remove();renderApp();return;}
    const name=document.getElementById("newName").value.trim();
    const email=document.getElementById("newEmail").value.trim().toLowerCase();
    const password=document.getElementById("newPassword").value;
    const newRole=role.value;
    const studentId=document.getElementById("newStudentId").value.trim();
    const err=document.getElementById("newUserError");
    if(users().some(u=>u.email.toLowerCase()===email)){err.textContent="An account with this email already exists.";return;}
    if(newRole==="student"&&studentId&&users().some(u=>u.studentId.toLowerCase()===studentId.toLowerCase())){err.textContent="That student ID is already in use.";return;}
    const list=users();
    list.push({id:uid(newRole),name,email,password,role:newRole,studentId:newRole==="student"?(studentId||"STU-"+String(list.filter(u=>u.role==="student").length+1).padStart(3,"0")):""});
    saveUsers(list);modal.remove();renderUsersPage(currentUser());toast("User account created.");
  });
}
function renderStudentsPage(user) {
  if(!["administrator","coordinator"].includes(user.role)) return renderOverview(user);
  const content=`<section class="welcome-row"><div><h1>Students</h1><p>Student list and individual attendance summaries.</p></div><div class="welcome-actions"><button class="btn btn-primary" id="takeAttendance">＋ Take attendance</button></div></section>
    <section class="panel"><div class="toolbar"><div class="toolbar-left"><input class="search-input" id="studentSearch" placeholder="Search students…"></div></div><div id="studentTable"></div></section>`;
  shell(user,"students","Students",content);
  const renderRows=()=>{
    const q=document.getElementById("studentSearch").value.toLowerCase();
    const list=studentsList().filter(s=>`${s.name} ${s.email} ${s.studentId}`.toLowerCase().includes(q));
    document.getElementById("studentTable").innerHTML=list.length?`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Sessions</th><th>Attendance rate</th><th>Account action</th></tr></thead><tbody>${list.map(s=>{const rs=records().filter(r=>r.studentId===s.id);return `<tr><td><div class="student-cell"><div class="avatar">${escapeHTML(initials(s.name))}</div><div><strong>${escapeHTML(s.name)}</strong><small>Email: ${escapeHTML(s.email)}</small></div></div></td><td>${escapeHTML(s.studentId||"—")}</td><td>${rs.length}</td><td><span class="badge badge-${attendanceRate(rs)>=75?"present":"late"}">${attendanceRate(rs)}%</span></td><td><button class="btn btn-light btn-sm" data-reset-student="${escapeHTML(s.id)}" type="button">Reset password</button></td></tr>`}).join("")}</tbody></table></div><p class="stat-foot" style="margin:12px 0 0">For security, passwords cannot be viewed. Use Reset password to issue a temporary password and share it securely with the student.</p>`:`<div class="empty-state"><strong>No students found</strong>Try a different search.</div>`;
    document.querySelectorAll("[data-reset-student]").forEach(button=>button.addEventListener("click",()=>{
      const actor=currentUser();
      if(!actor||!["administrator","coordinator"].includes(actor.role)){toast("You are not allowed to reset student passwords.");return;}
      const targetId=button.getAttribute("data-reset-student");
      const target=users().find(u=>u.id===targetId&&u.role==="student");
      if(!target)return;
      const temporaryPassword="ATU-"+Math.random().toString(36).slice(2,6).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase()+"!";
      const all=users().map(u=>u.id===targetId?{...u,password:temporaryPassword}:u);
      saveUsers(all);
      alert(`Temporary password for ${target.name}:\n\n${temporaryPassword}\n\nShare it privately and ask the student to change it after signing in. This demo stores credentials in browser storage; use Supabase Auth for real accounts.`);
      toast("Temporary password generated.");
    }));
  };
  renderRows();
  document.getElementById("studentSearch").addEventListener("input",renderRows);
  document.getElementById("takeAttendance").addEventListener("click",()=>renderAttendance(currentUser()));
}
function renderMyAttendance(user, filterMonth="") {
  const own=records().filter(r=>r.studentId===user.id).sort((a,b)=>b.date.localeCompare(a.date));
  const visible=own.filter(r=>!filterMonth||r.date.startsWith(filterMonth));
  const rate=attendanceRate(own);
  const content=`<section class="welcome-row"><div><h1>My attendance</h1><p>Review your attendance history and class participation.</p></div></section>
    <section class="grid two-col">
      <div class="panel"><div class="panel-head"><div><h2>Your attendance rate</h2><p>Present and late sessions count as attended.</p></div></div>
        <div class="attendance-rate"><div class="donut" style="background:conic-gradient(#4768f5 ${rate*3.6}deg,#edf0f7 0deg)"><span>${rate}%</span></div><div class="rate-copy"><strong>${rate>=75?"Good progress": "Keep building consistency"}</strong><p>You have ${own.filter(r=>["Present","Late"].includes(r.status)).length} attended sessions out of ${own.length} recorded sessions.</p></div></div>
      </div>
      <div class="panel"><div class="panel-head"><div><h2>Status summary</h2><p>Your recorded sessions.</p></div></div>
        ${["Present","Absent","Late","Excused"].map(st=>`<div class="summary-line"><div class="summary-symbol">${st==="Present"?"✓":st==="Absent"?"!":st==="Late"?"◷":"↗"}</div><div><strong>${st}</strong><small>Attendance status</small></div><b>${own.filter(r=>r.status===st).length}</b></div>`).join("")}
      </div>
    </section>
    <section class="panel"><div class="toolbar"><div><h2 style="font-size:15px;margin:0">Attendance history</h2><p class="stat-foot" style="margin-top:5px">Your personal attendance records.</p></div><div class="toolbar-right"><input type="month" class="filter-date" id="monthFilter" value="${escapeHTML(filterMonth)}"></div></div>
    ${visible.length?`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Course / class</th><th>Status</th><th>Note</th></tr></thead><tbody>${visible.map(r=>`<tr><td>${prettyDate(r.date)}</td><td>${escapeHTML(r.course)}</td><td>${statusBadge(r.status)}</td><td>${escapeHTML(r.note||"—")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><strong>No records for this period</strong>Your coordinator's saved attendance will appear here.</div>`}</section>`;
  shell(user,"myAttendance","My attendance",content);
  document.getElementById("monthFilter").addEventListener("change",e=>renderMyAttendance(currentUser(),e.target.value));
}
function renderCoursesPage(user) {
  const staff = ["administrator", "coordinator"].includes(user.role);
  const myRegs = registrations().filter(r => r.studentId === user.id);
  const content = staff ? `
    <section class="welcome-row"><div><h1>Courses</h1><p>Create and manage courses available for student registration.</p></div><div class="welcome-actions"><button class="btn btn-primary" id="openAddCourse">＋ Add course</button></div></section>
    <div id="courseNotice"></div><section class="panel"><div class="panel-head"><div><h2>Course catalogue</h2><p>${courses().length} courses currently available</p></div></div><div id="courseTable"></div></section>` : `
    <section class="welcome-row"><div><h1>Course registration</h1><p>Browse the course catalogue and register for the courses you are taking.</p></div></section>
    <div id="courseNotice"></div><section class="panel"><div class="panel-head"><div><h2>Available courses</h2><p>You can register once for each course.</p></div></div><div id="courseTable"></div></section>
    <section class="panel"><div class="panel-head"><div><h2>My registered courses</h2><p>${myRegs.length} course registrations</p></div></div><div id="myCourseTable"></div></section>`;
  shell(user,"courses",staff?"Courses":"Course registration",content);
  const renderRows = () => {
    const list = courses();
    const target = document.getElementById("courseTable");
    target.innerHTML = list.length ? `<div class="table-wrap"><table><thead><tr><th>Course code</th><th>Course name</th><th>Lecturer / coordinator</th><th>Credits</th><th>${staff?"Registered students":"Action"}</th></tr></thead><tbody>${list.map(c => {
      const count = registrations().filter(r=>r.courseId===c.id).length;
      const registered = isRegistered(user.id,c.id);
      return `<tr><td><strong>${escapeHTML(c.code)}</strong></td><td>${escapeHTML(c.name)}</td><td>${escapeHTML(c.lecturer||"—")}</td><td>${Number(c.credits)||0}</td><td>${staff?count:(registered?'<span class="badge badge-present">Registered</span>':`<button class="btn btn-primary" data-register-course="${escapeHTML(c.id)}">Register</button>`)}</td></tr>`;
    }).join("")}</tbody></table></div>` : `<div class="empty-state"><strong>No courses available</strong>${staff?"Add the first course to the catalogue.":"Please check again later."}</div>`;
    if (!staff) {
      const mine = studentCourses(user.id);
      document.getElementById("myCourseTable").innerHTML = mine.length ? `<div class="table-wrap"><table><thead><tr><th>Course</th><th>Course name</th><th>Credits</th><th>Scores</th></tr></thead><tbody>${mine.map(c=>`<tr><td>${escapeHTML(c.code)}</td><td>${escapeHTML(c.name)}</td><td>${Number(c.credits)||0}</td><td>${scores().filter(s=>s.studentId===user.id&&s.courseId===c.id).length} assessment(s)</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><strong>No courses registered yet</strong>Choose Register beside a course above to get started.</div>`;
      document.querySelectorAll("[data-register-course]").forEach(btn=>btn.addEventListener("click",()=>{
        const actor=currentUser(); if(!actor||actor.role!=="student") return;
        const courseId=btn.dataset.registerCourse;
        if(!courseById(courseId)||isRegistered(actor.id,courseId)){toast("You are already registered for this course.");return;}
        const list=registrations();list.push({id:uid("reg"),studentId:actor.id,courseId,registeredAt:new Date().toISOString()});saveRegistrations(list);renderCoursesPage(actor);toast("Course registration successful.");
      }));
    }
  };
  renderRows();
  if(staff) document.getElementById("openAddCourse").addEventListener("click",showAddCourseModal);
}
function showAddCourseModal() {
  document.querySelector(".modal-backdrop")?.remove();
  const modal=document.createElement("div");modal.className="modal-backdrop";
  modal.innerHTML=`<section class="modal" role="dialog" aria-modal="true"><h2>Add a course</h2><p>Create a course for students to register for and for staff to record scores.</p><form id="newCourseForm">
    <div class="field"><label for="courseCode">COURSE CODE</label><input id="courseCode" required maxlength="20" placeholder="e.g. CS205"></div>
    <div class="field"><label for="courseName">COURSE NAME</label><input id="courseName" required maxlength="100" placeholder="e.g. Data Structures"></div>
    <div class="field"><label for="courseLecturer">LECTURER / COORDINATOR</label><input id="courseLecturer" maxlength="100" placeholder="Name (optional)"></div>
    <div class="field"><label for="courseCredits">CREDIT HOURS</label><input id="courseCredits" type="number" min="0" max="20" value="3" required></div>
    <p id="courseError" class="error"></p><div class="modal-actions"><button type="button" class="btn btn-light" id="cancelCourse">Cancel</button><button type="submit" class="btn btn-primary">Save course</button></div></form></section>`;
  document.body.appendChild(modal);document.getElementById("cancelCourse").addEventListener("click",()=>modal.remove());modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
  document.getElementById("newCourseForm").addEventListener("submit",e=>{e.preventDefault();const actor=currentUser();if(!actor||!["administrator","coordinator"].includes(actor.role)){modal.remove();return;}
    const code=document.getElementById("courseCode").value.trim().toUpperCase(),name=document.getElementById("courseName").value.trim(),lecturer=document.getElementById("courseLecturer").value.trim(),credits=Number(document.getElementById("courseCredits").value);
    if(courses().some(c=>c.code.toLowerCase()===code.toLowerCase())){document.getElementById("courseError").textContent="That course code already exists.";return;}
    const list=courses();list.push({id:uid("course"),code,name,lecturer,credits});saveCourses(list);modal.remove();renderCoursesPage(currentUser());toast("Course added to the catalogue.");
  });
}
function renderScoresPage(user) {
  const staff=["administrator","coordinator"].includes(user.role);
  if(staff) {
    const content=`<section class="welcome-row"><div><h1>Course scores</h1><p>Record and update assessment scores for students registered in each course.</p></div></section><div id="scoreNotice"></div>
      <section class="panel"><div class="attendance-form"><div class="field"><label for="scoreCourse">COURSE</label><select class="control" id="scoreCourse">${courses().map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.code)} — ${escapeHTML(c.name)}</option>`).join("")}</select></div><div class="field"><label for="assessmentName">ASSESSMENT</label><input class="control" id="assessmentName" maxlength="100" value="Mid-semester test" placeholder="e.g. Assignment 1"></div><div class="field"><label for="maxScore">MAXIMUM SCORE</label><input class="control" id="maxScore" type="number" min="1" max="1000" value="100" required></div></div><div id="scoreEntryTable"></div></section>
      <section class="panel"><div class="panel-head"><div><h2>Recorded scores</h2><p>Existing marks by course and assessment.</p></div><button class="btn btn-light" id="exportScores">↓ Export CSV</button></div><div id="scoresTable"></div></section>`;
    shell(user,"scores","Course scores",content);
    const renderScoreTables=()=>{
      const courseId=document.getElementById("scoreCourse").value;const course=courseById(courseId);const enrolled=studentsList().filter(st=>isRegistered(st.id,courseId));
      document.getElementById("scoreEntryTable").innerHTML=!course?`<div class="empty-state"><strong>No courses yet</strong>Add a course before entering scores.</div>`:!enrolled.length?`<div class="empty-state"><strong>No students registered</strong>Students must register for ${escapeHTML(course.code)} before scores can be entered.</div>`:`<div class="toolbar"><div><strong>${escapeHTML(course.code)} — ${escapeHTML(course.name)}</strong><p class="stat-foot">Enter a score for each registered student and save.</p></div><button class="btn btn-primary" id="saveScores">Save scores</button></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Score</th><th>Maximum</th></tr></thead><tbody>${enrolled.map(st=>{const old=scores().find(sc=>sc.studentId===st.id&&sc.courseId===courseId&&sc.assessment===(document.getElementById("assessmentName").value.trim()||"Assessment"));return `<tr><td>${escapeHTML(st.name)}</td><td>${escapeHTML(st.studentId||"—")}</td><td><input class="search-input score-value" type="number" min="0" max="1000" step="0.01" data-score-student="${escapeHTML(st.id)}" value="${old?old.score:""}" placeholder="Score" style="width:110px"></td><td class="score-max-cell">${Number(document.getElementById("maxScore").value)||100}</td></tr>`}).join("")}</tbody></table></div>`;
      const list=scores().filter(sc=>!courseId||sc.courseId===courseId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
      document.getElementById("scoresTable").innerHTML=list.length?`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Course</th><th>Assessment</th><th>Score</th><th>Percentage</th></tr></thead><tbody>${list.map(sc=>{const st=studentById(sc.studentId),c=courseById(sc.courseId),pct=sc.maxScore?Math.round(sc.score/sc.maxScore*100):0;return `<tr><td>${escapeHTML(st?.name||"Deleted student")}</td><td>${escapeHTML(c?.code||"Unknown course")}</td><td>${escapeHTML(sc.assessment)}</td><td>${sc.score} / ${sc.maxScore}</td><td><span class="badge ${pct>=50?"badge-present":"badge-absent"}">${pct}%</span></td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty-state"><strong>No scores recorded</strong>Choose a course, enter an assessment name and add scores.</div>`;
      const saveBtn=document.getElementById("saveScores");if(saveBtn)saveBtn.addEventListener("click",()=>{const actor=currentUser();if(!actor||!["administrator","coordinator"].includes(actor.role))return;const cId=document.getElementById("scoreCourse").value,assessment=document.getElementById("assessmentName").value.trim()||"Assessment",max=Number(document.getElementById("maxScore").value);const notice=document.getElementById("scoreNotice");if(!max||max<1){notice.innerHTML='<div class="notice error">Maximum score must be greater than zero.</div>';return;}let list=scores(),saved=0,invalid=false;document.querySelectorAll("[data-score-student]").forEach(input=>{if(input.value.trim()==="")return;const val=Number(input.value);if(!Number.isFinite(val)||val<0||val>max){invalid=true;return;}const sid=input.dataset.scoreStudent;const idx=list.findIndex(sc=>sc.studentId===sid&&sc.courseId===cId&&sc.assessment===assessment);const item={id:idx>=0?list[idx].id:uid("score"),studentId:sid,courseId:cId,score:val,maxScore:max,assessment,updatedBy:actor.id,updatedAt:new Date().toISOString()};if(idx>=0)list[idx]=item;else list.push(item);saved++;});if(invalid){notice.innerHTML='<div class="notice error">Each score must be between zero and the maximum score.</div>';return;}saveScores(list);toast(`${saved} score record${saved===1?"":"s"} saved.`);renderScoresPage(currentUser());});
    };
    document.getElementById("scoreCourse").addEventListener("change",renderScoreTables);document.getElementById("assessmentName").addEventListener("change",renderScoreTables);document.getElementById("maxScore").addEventListener("input",()=>{document.querySelectorAll(".score-max-cell").forEach(el=>el.textContent=Number(document.getElementById("maxScore").value)||100);});document.getElementById("exportScores").addEventListener("click",()=>{const lines=[["Student","Student ID","Course Code","Course Name","Assessment","Score","Maximum","Percentage"]];scores().forEach(sc=>{const st=studentById(sc.studentId),c=courseById(sc.courseId);lines.push([st?.name||"",st?.studentId||"",c?.code||"",c?.name||"",sc.assessment,sc.score,sc.maxScore,sc.maxScore?Math.round(sc.score/sc.maxScore*100)+"%":""])});const csv=lines.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="course-scores.csv";a.click();URL.revokeObjectURL(url);});renderScoreTables();
  } else {
    const own=scores().filter(sc=>sc.studentId===user.id).sort((a,b)=>{const ca=courseById(a.courseId)?.code||"",cb=courseById(b.courseId)?.code||"";return ca.localeCompare(cb)});
    const content=`<section class="welcome-row"><div><h1>My course scores</h1><p>Review assessment marks for your registered courses.</p></div><div class="welcome-actions"><button class="btn btn-primary" data-page="courses">＋ Register for a course</button></div></section><section class="panel"><div class="panel-head"><div><h2>Assessment results</h2><p>Your scores recorded by your course coordinator.</p></div></div>${own.length?`<div class="table-wrap"><table><thead><tr><th>Course</th><th>Course name</th><th>Assessment</th><th>Score</th><th>Percentage</th><th>Grade status</th></tr></thead><tbody>${own.map(sc=>{const c=courseById(sc.courseId),pct=sc.maxScore?Math.round(sc.score/sc.maxScore*100):0;return `<tr><td>${escapeHTML(c?.code||"Unknown")}</td><td>${escapeHTML(c?.name||"Course unavailable")}</td><td>${escapeHTML(sc.assessment)}</td><td><strong>${sc.score} / ${sc.maxScore}</strong></td><td>${pct}%</td><td><span class="badge ${pct>=50?"badge-present":"badge-absent"}">${pct>=50?"Pass":"Below 50%"}</span></td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty-state"><strong>No scores available yet</strong>Scores will appear here after your coordinator records assessment results for your courses.</div>`}</section>`;
    shell(user,"scores","My course scores",content);
  }
}


function renderStudentPasswordPage(user) {
  if (!user || user.role !== "student") return renderApp();
  const content = `<section class="welcome-row"><div><h1>Change password</h1><p>Keep your student account secure by choosing a new password.</p></div></section>
    <section class="panel" style="max-width:720px"><div class="panel-head"><div><h2>Update your password</h2><p>Enter your current password, then choose a new one.</p></div></div>
      <div class="notice" style="margin-bottom:18px">For your security, choose a password you do not use on other websites. Your new password must be at least 8 characters long.</div>
      <form id="studentPasswordForm" class="form-grid" autocomplete="off">
        <div class="field"><label for="currentStudentPassword">CURRENT PASSWORD</label><input id="currentStudentPassword" type="password" autocomplete="current-password" required maxlength="128" placeholder="Enter current password"></div>
        <div class="field"><label for="newStudentPassword">NEW PASSWORD</label><input id="newStudentPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" placeholder="At least 8 characters"></div>
        <div class="field"><label for="confirmStudentPassword">CONFIRM NEW PASSWORD</label><input id="confirmStudentPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" placeholder="Re-enter new password"></div>
        <p id="studentPasswordMessage" class="error" role="alert" aria-live="polite"></p>
        <div class="modal-actions"><button type="submit" class="btn btn-primary">Update password</button></div>
      </form>
    </section>
    <section class="panel" style="max-width:720px"><div class="panel-head"><div><h2>Forgot your current password?</h2><p>If you cannot sign in, contact your school administrator or coordinator to request a password reset. This demo does not yet support secure email-based recovery.</p></div></div></section>`;
  shell(user, "security", "Change password", content);
  document.getElementById("studentPasswordForm").addEventListener("submit", event => {
    event.preventDefault();
    const current = document.getElementById("currentStudentPassword").value;
    const next = document.getElementById("newStudentPassword").value;
    const confirm = document.getElementById("confirmStudentPassword").value;
    const message = document.getElementById("studentPasswordMessage");
    const latest = users();
    const index = latest.findIndex(account => account.id === user.id && account.role === "student");
    if (index < 0) { message.textContent = "Your account could not be found. Please sign in again."; return; }
    if (latest[index].password !== current) { message.textContent = "Your current password is incorrect."; return; }
    if (next.length < 8) { message.textContent = "Your new password must contain at least 8 characters."; return; }
    if (next !== confirm) { message.textContent = "The new passwords do not match."; return; }
    if (next === current) { message.textContent = "Choose a password different from your current password."; return; }
    latest[index] = { ...latest[index], password: next, passwordUpdatedAt: new Date().toISOString() };
    saveUsers(latest);
    document.getElementById("studentPasswordForm").reset();
    message.className = "notice success";
    message.textContent = "Password updated successfully. Use your new password next time you sign in.";
  });
}

function exportCSV(list, filename) {
  const lines=[["Student","Student ID","Email","Course","Date","Status","Note"]];
  list.forEach(r=>{const s=studentById(r.studentId);lines.push([s?.name||"Deleted student",s?.studentId||"",s?.email||"",r.course,r.date,r.status,r.note||""]);});
  const csv=lines.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}
initDemo();
if(currentUser()) renderApp(); else showLogin();
