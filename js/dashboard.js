(function () {
  "use strict";
  const Auth = window.YaoshengAuth;
  const user = Auth.requireRoles(["admin", "admissions"]);
  if (!user) return;
  Auth.mountUserArea("dashboard");

  const metricGrid = document.getElementById("metricGrid");
  const quickLinks = document.getElementById("quickLinks");
  const insightGrid = document.getElementById("insightGrid");
  const A = window.AcademicDemo;

  function parse(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      return [];
    }
  }

  function card(label, value) {
    return '<article class="stat-card"><span>' + label + '</span><strong>' + value + '</strong></article>';
  }

  function link(href, label, text) {
    return '<a class="quick-link-card" href="' + href + '"><strong>' + label + '</strong><span>' + text + '</span></a>';
  }

  function html(value) {
    return Auth.escapeHtml(value == null ? "" : value);
  }

  function listCard(title, items, emptyText) {
    return '<article class="insight-card"><h2>' + title + '</h2><div class="insight-list">' +
      (items.length ? items.map(function (item) {
        return '<div class="insight-item"><strong>' + html(item.title) + '</strong><span>' + html(item.meta) + '</span></div>';
      }).join("") : '<div class="insight-empty">' + emptyText + '</div>') +
      '</div></article>';
  }

  function renderInsights(leads, classes, mode) {
    const recentLeads = leads.slice(0, 4).map(function (item) {
      return { title: item.contact_name || "未命名名單", meta: (item.grade || "年級未填") + " · " + (item.status || "new") };
    });
    const followLeads = leads.filter(function (item) {
      return ["new", "pending_contact", "contacted", "trial_booked"].indexOf(item.status || "new") >= 0;
    }).slice(0, 4).map(function (item) {
      return { title: item.contact_name || "未命名名單", meta: item.assigned_to ? "負責：" + item.assigned_to : "尚未指派負責人" };
    });
    const classItems = classes.slice(0, 4).map(function (item) {
      const course = A.getCourseById(item.course_id) || {};
      return { title: item.class_name || "未命名班級", meta: (course.course_name || "未指定課程") + " · " + (item.class_status || "planned") };
    });
    insightGrid.innerHTML = [
      listCard(mode === "admin" ? "最近招生名單" : "今日新增與待處理", recentLeads, "目前沒有招生名單。"),
      listCard("待追蹤清單", followLeads, "目前沒有待追蹤名單。"),
      listCard(mode === "admin" ? "最近班級動態" : "已報名清單", mode === "admin" ? classItems : leads.filter(function (item) { return item.status === "enrolled"; }).slice(0, 4).map(function (item) { return { title: item.contact_name || "已報名名單", meta: item.student_id ? "已建立學生資料" : "等待轉正式學生" }; }), mode === "admin" ? "目前沒有班級資料。" : "目前沒有已報名名單。")
    ].join("");
  }

  function renderAdmin() {
    const leads = parse("yaosheng_demo_leads_v1");
    const students = parse("yaosheng_demo_students_v1");
    const teachers = A.loadTeachers();
    const courses = A.loadCourses();
    const classes = A.loadClasses();
    metricGrid.innerHTML = [
      card("全部招生名單", leads.length),
      card("新名單", leads.filter(function (item) { return item.status === "new"; }).length),
      card("追蹤中", leads.filter(function (item) { return ["pending_contact", "contacted", "trial_booked"].indexOf(item.status) >= 0; }).length),
      card("已轉正式學生", leads.filter(function (item) { return item.status === "enrolled"; }).length),
      card("全部學生", students.length),
      card("在學學生", students.filter(function (item) { return item.student_status === "active" || !item.student_status; }).length),
      card("老師數", teachers.length),
      card("進行中班級", classes.filter(function (item) { return item.class_status === "in_progress"; }).length)
    ].join("");
    quickLinks.innerHTML = [
      link("leads.html", "招生名單", "家長聯繫、試聽安排與轉正式學生"),
      link("students.html", "學生管理", "正式學生資料與狀態"),
      link("teachers.html", "老師管理", "師資資料與授課狀態"),
      link("courses.html", "課程管理", "級段與課程設定"),
      link("classes.html", "班級管理", "開班、分班與學生加入"),
      link("accounts.html", "帳號權限", "Demo 帳號與角色入口")
    ].join("");
    renderInsights(leads, classes, "admin");
  }

  function renderAdmissions() {
    const leads = parse("yaosheng_demo_leads_v1");
    const students = parse("yaosheng_demo_students_v1");
    metricGrid.innerHTML = [
      card("全部招生名單", leads.length),
      card("新名單", leads.filter(function (item) { return item.status === "new"; }).length),
      card("追蹤中", leads.filter(function (item) { return ["pending_contact", "contacted", "trial_booked"].indexOf(item.status) >= 0; }).length),
      card("已轉正式學生", students.length)
    ].join("");
    quickLinks.innerHTML = [
      link("leads.html", "招生名單", "追蹤家長與試聽安排"),
      link("students.html", "學生管理", "查看已建立正式學生"),
      link("ailead-demo.html", "前台表單", "新增 Demo 招生資料")
    ].join("");
    renderInsights(leads, [], "admissions");
  }

  document.getElementById("menuToggle").addEventListener("click", function () {
    const sidebar = document.getElementById("sidebar");
    const open = sidebar.classList.toggle("is-open");
    this.setAttribute("aria-expanded", String(open));
  });

  if (user.role === "admin") renderAdmin();
  else renderAdmissions();
})();
