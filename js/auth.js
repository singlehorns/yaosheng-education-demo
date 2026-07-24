(function () {
  "use strict";

  const USERS_KEY = "yaosheng_demo_users_v1";
  const SESSION_KEY = "yaosheng_demo_session_v1";
  const TEACHERS_KEY = "yaosheng_demo_teachers_v1";
  const STUDENTS_KEY = "yaosheng_demo_students_v1";
  const ROLE_LABELS = {
    admin: "管理員",
    admissions: "招生人員",
    teacher: "老師",
    student: "學生"
  };
  const ROLE_HOME = {
    admin: "dashboard.html",
    admissions: "dashboard.html",
    teacher: "teacher-portal.html",
    student: "student-portal.html"
  };
  const NAVS = {
    admin: [
      ["dashboard", "dashboard.html", "儀表板"],
      ["leads", "leads.html", "招生名單"],
      ["students", "students.html", "學生管理"],
      ["teachers", "teachers.html", "老師管理"],
      ["courses", "courses.html", "課程管理"],
      ["classes", "classes.html", "班級管理"],
      ["accounts", "accounts.html", "帳號權限"],
      ["demo", "index.html", "Demo 導覽"],
      ["front", "ailead-demo.html", "招生首頁"]
    ],
    admissions: [
      ["dashboard", "dashboard.html", "儀表板"],
      ["leads", "leads.html", "招生名單"],
      ["students", "students.html", "學生管理"],
      ["demo", "index.html", "Demo 導覽"],
      ["front", "ailead-demo.html", "招生首頁"]
    ],
    teacher: [
      ["demo", "index.html", "Demo 導覽"],
      ["teacher", "teacher-portal.html", "老師入口"],
      ["login", "login.html", "切換登入"]
    ],
    student: [
      ["demo", "index.html", "Demo 導覽"],
      ["student", "student-portal.html", "學生入口"],
      ["login", "login.html", "切換登入"]
    ]
  };

  function parse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("[Auth Demo] localStorage parse failed:", key, error);
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function now() {
    return new Date().toISOString();
  }

  function generateUserId() {
    return "USR-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function loadUsers() {
    return parse(USERS_KEY, []);
  }

  function saveUsers(users) {
    save(USERS_KEY, users);
  }

  function loadTeachers() {
    return parse(TEACHERS_KEY, []);
  }

  function loadStudents() {
    return parse(STUDENTS_KEY, []);
  }

  function firstActiveTeacher() {
    return loadTeachers().find(function (teacher) {
      return teacher.employment_status === "active" || !teacher.employment_status;
    }) || null;
  }

  function firstActiveStudent() {
    return loadStudents().find(function (student) {
      return student.student_status === "active" || !student.student_status;
    }) || null;
  }

  function createUser(seed) {
    const stamp = now();
    return Object.assign({
      id: generateUserId(),
      display_name: "",
      email: "",
      role: "student",
      linked_teacher_id: null,
      linked_student_id: null,
      status: "active",
      demo_pin: "1111",
      last_login_at: null,
      created_at: stamp,
      updated_at: stamp
    }, seed);
  }

  function upsertDemoUser(users, seed) {
    const existing = users.find(function (user) { return user.email === seed.email; });
    if (!existing) {
      users.push(createUser(seed));
      return true;
    }
    let changed = false;
    ["display_name", "role", "demo_pin", "linked_teacher_id", "linked_student_id"].forEach(function (key) {
      if (seed[key] !== undefined && existing[key] !== seed[key]) {
        existing[key] = seed[key];
        changed = true;
      }
    });
    if (!existing.status) {
      existing.status = "active";
      changed = true;
    }
    if (changed) existing.updated_at = now();
    return changed;
  }

  function createDemoAccounts() {
    const users = loadUsers();
    let changed = false;
    changed = upsertDemoUser(users, { display_name: "王管理員", email: "admin@demo.local", role: "admin", demo_pin: "1111" }) || changed;
    changed = upsertDemoUser(users, { display_name: "陳招生顧問", email: "admissions@demo.local", role: "admissions", demo_pin: "2222" }) || changed;
    const teacher = firstActiveTeacher();
    if (teacher) {
      changed = upsertDemoUser(users, {
        display_name: teacher.teacher_name || teacher.name || "Demo 老師",
        email: "teacher@demo.local",
        role: "teacher",
        linked_teacher_id: teacher.id,
        demo_pin: "3333"
      }) || changed;
    }
    const student = firstActiveStudent();
    if (student) {
      changed = upsertDemoUser(users, {
        display_name: student.student_name || student.name || "Demo 學生",
        email: "student@demo.local",
        role: "student",
        linked_student_id: student.id,
        demo_pin: "4444"
      }) || changed;
    }
    if (changed) {
      saveUsers(users);
      trackAuthEvent("demo_accounts_created", { count: users.length });
    }
    return users;
  }

  function getCurrentSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("[Auth Demo] sessionStorage parse failed:", error);
      return null;
    }
  }

  function getCurrentUser() {
    const session = getCurrentSession();
    if (!session || !session.user_id) return null;
    return loadUsers().find(function (user) {
      return user.id === session.user_id && user.status === "active";
    }) || null;
  }

  function login(email, demoPin) {
    trackAuthEvent("login_started", { email: email || "" });
    const normalized = String(email || "").trim().toLowerCase();
    const users = createDemoAccounts();
    const user = users.find(function (item) { return item.email.toLowerCase() === normalized; });
    if (!user || user.status !== "active" || String(user.demo_pin) !== String(demoPin || "").trim()) {
      trackAuthEvent("login_failed", { email: normalized });
      return { success: false, reason: "invalid_credentials" };
    }
    user.last_login_at = now();
    user.updated_at = now();
    saveUsers(users);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      user_id: user.id,
      role: user.role,
      linked_teacher_id: user.linked_teacher_id || null,
      linked_student_id: user.linked_student_id || null,
      logged_in_at: now()
    }));
    trackAuthEvent("login_success", { user_id: user.id, role: user.role });
    return { success: true, user: user, redirect: redirectForRole(user.role) };
  }

  function logout() {
    const user = getCurrentUser();
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    trackAuthEvent("logout", { user_id: user ? user.id : null });
  }

  function redirectForRole(role) {
    return ROLE_HOME[role || (getCurrentUser() || {}).role] || "login.html";
  }

  function renderBlocked(message) {
    document.body.innerHTML = '<main class="auth-blocked" role="alert"><h1>' + message + '</h1><p>即將回到您的角色入口。</p></main>';
  }

  function requireLogin() {
    createDemoAccounts();
    const user = getCurrentUser();
    if (user) return user;
    const next = encodeURIComponent(location.pathname.split("/").pop() || "dashboard.html");
    location.href = "login.html?next=" + next;
    return null;
  }

  function requireRoles(roles) {
    const user = requireLogin();
    if (!user) return null;
    if (roles.indexOf(user.role) >= 0) return user;
    trackAuthEvent("unauthorized_page_access", { role: user.role, page: location.pathname });
    renderBlocked("您沒有權限查看此頁面。");
    setTimeout(function () {
      location.href = redirectForRole(user.role);
    }, 1200);
    return null;
  }

  function getRoleLabel(role) {
    return ROLE_LABELS[role] || role || "未登入";
  }

  function navHtml(role, activePage) {
    const icons = {
      demo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 3 12l6 6"/><path d="M3 12h14a4 4 0 0 1 0 8"/></svg>',
      dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3Z"/></svg>',
      leads: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5Z"/><path d="M8 9h8M8 13h5"/></svg>',
      students: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
      teachers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5 12 3l8 3.5-8 3.5Z"/><path d="M6 10v5c0 2 3 4 6 4s6-2 6-4v-5"/></svg>',
      courses: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h6"/></svg>',
      classes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4Z"/><path d="M8 5v14M16 5v14M4 11h16"/></svg>',
      accounts: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a8 8 0 0 0 0-6M4.6 9a8 8 0 0 0 0 6M7 21h10"/></svg>',
      front: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
      teacher: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5 12 3l8 3.5-8 3.5Z"/><path d="M6 10v5c0 2 3 4 6 4s6-2 6-4v-5"/></svg>',
      student: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
      login: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7h8M8 12h8M8 17h8"/></svg>'
    };
    return (NAVS[role] || []).map(function (item) {
      const active = item[0] === activePage ? ' class="is-active"' : "";
      return '<a' + active + ' href="' + item[1] + '">' + (icons[item[0]] || "") + "<span>" + item[2] + "</span></a>";
    }).join("");
  }

  function mountUserArea(activePage) {
    const user = getCurrentUser();
    if (!user) return;
    const nav = document.querySelector(".sidebar-nav");
    if (nav && !document.body.classList.contains("app-page")) {
      nav.innerHTML = navHtml(user.role, activePage);
    }
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && !sidebar.querySelector(".platform-sidebar-footer") && !document.body.classList.contains("app-page")) {
      const footer = document.createElement("section");
      footer.className = "platform-sidebar-footer";
      footer.innerHTML = '<button type="button" data-auth-logout><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 8 19 12l-4 4"/><path d="M19 12H8"/><path d="M11 4H5v16h6"/></svg><span>登出帳號</span></button><div><strong>Demo / zh-TW</strong><span>資料僅存在目前瀏覽器</span></div>';
      sidebar.appendChild(footer);
    }
    document.querySelectorAll("[data-auth-logout]").forEach(function (button) {
      if (button.dataset.listenerBound === "true") return;
      button.addEventListener("click", function () {
        logout();
        location.href = "login.html";
      });
      button.dataset.listenerBound = "true";
    });
    mountTopbarUser(user);
  }

  function mountTopbarUser(user) {
    const topbar = document.querySelector(".admin-topbar, .app-topbar");
    if (!topbar) return;
    if (topbar.querySelector(".app-topbar-user")) {
      const name = topbar.querySelector(".app-user-name");
      const role = topbar.querySelector(".app-user-role");
      const avatar = topbar.querySelector(".app-user-avatar");
      if (name) name.textContent = user.display_name || user.email;
      if (role) role.textContent = getRoleLabel(user.role);
      if (avatar) avatar.textContent = (user.display_name || user.email || "YS").trim().slice(0, 1).toUpperCase();
      return;
    }
    if (topbar.querySelector(".topbar-user")) return;
    const initials = (user.display_name || user.email || "YS").trim().slice(0, 1).toUpperCase();
    const box = document.createElement("section");
    box.className = "topbar-user";
    box.setAttribute("aria-label", "目前登入使用者");
    box.innerHTML = '<button class="topbar-icon-button" type="button" aria-label="Demo 通知"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16Z"/><path d="M10 20h4"/></svg></button>' +
      '<div class="topbar-avatar" aria-hidden="true">' + escapeHtml(initials) + '</div>' +
      '<div><strong>' + escapeHtml(user.display_name || user.email) + '</strong><span>' + getRoleLabel(user.role) + '</span></div>' +
      '<button class="topbar-logout" type="button" data-auth-logout aria-label="登出"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 8 19 12l-4 4"/><path d="M19 12H8"/><path d="M11 4H5v16h6"/></svg></button>';
    topbar.appendChild(box);
    box.querySelectorAll("[data-auth-logout]").forEach(function (button) {
      button.addEventListener("click", function () {
        logout();
        location.href = "login.html";
      });
      button.dataset.listenerBound = "true";
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function trackAuthEvent(eventName, data) {
    console.log("[Auth Demo Tracking]", eventName, data || {});
  }

  window.YaoshengAuth = {
    loadUsers: loadUsers,
    saveUsers: saveUsers,
    getCurrentSession: getCurrentSession,
    getCurrentUser: getCurrentUser,
    login: login,
    logout: logout,
    requireLogin: requireLogin,
    requireRoles: requireRoles,
    redirectForRole: redirectForRole,
    getRoleLabel: getRoleLabel,
    createDemoAccounts: createDemoAccounts,
    generateUserId: generateUserId,
    trackAuthEvent: trackAuthEvent,
    mountUserArea: mountUserArea,
    escapeHtml: escapeHtml
  };
})();
