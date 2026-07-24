(function () {
  "use strict";
  const Auth = window.YaoshengAuth;
  const currentUser = Auth.requireRoles(["admin"]);
  if (!currentUser) return;
  Auth.mountUserArea("accounts");

  const A = window.AcademicDemo;
  const els = {
    sidebar: document.getElementById("sidebar"),
    menuToggle: document.getElementById("menuToggle"),
    search: document.getElementById("searchInput"),
    roleFilter: document.getElementById("roleFilter"),
    refreshDemo: document.getElementById("refreshDemo"),
    form: document.getElementById("accountForm"),
    displayName: document.getElementById("displayName"),
    email: document.getElementById("accountEmail"),
    role: document.getElementById("accountRole"),
    pin: document.getElementById("accountPin"),
    linkedId: document.getElementById("linkedId"),
    linkField: document.getElementById("linkField"),
    table: document.getElementById("tableBody"),
    live: document.getElementById("liveMessage")
  };

  function html(value) { return Auth.escapeHtml(value); }
  function msg(text) { els.live.textContent = text; els.live.classList.add("is-visible"); clearTimeout(msg.t); msg.t = setTimeout(function () { els.live.classList.remove("is-visible"); }, 2400); }
  function users() { return Auth.loadUsers(); }
  function save(list) { Auth.saveUsers(list); }
  function roleLabel(role) { return Auth.getRoleLabel(role); }
  function teachers() { return A.loadTeachers().filter(function (item) { return item.employment_status === "active" || !item.employment_status; }); }
  function students() {
    try {
      return JSON.parse(localStorage.getItem("yaosheng_demo_students_v1") || "[]").filter(function (item) {
        return item.student_status === "active" || !item.student_status;
      });
    } catch (error) {
      return [];
    }
  }

  function linkedLabel(user) {
    if (user.role === "teacher") {
      const teacher = teachers().find(function (item) { return item.id === user.linked_teacher_id; });
      return teacher ? teacher.teacher_name : "未連結老師";
    }
    if (user.role === "student") {
      const student = students().find(function (item) { return item.id === user.linked_student_id; });
      return student ? student.student_name : "未連結學生";
    }
    return "不需連結";
  }

  function fillLinkedOptions() {
    const role = els.role.value;
    els.linkField.style.display = role === "teacher" || role === "student" ? "" : "none";
    if (role === "teacher") {
      els.linkedId.innerHTML = teachers().map(function (item) { return '<option value="' + item.id + '">' + html(item.teacher_name) + "</option>"; }).join("");
    } else if (role === "student") {
      els.linkedId.innerHTML = students().map(function (item) { return '<option value="' + item.id + '">' + html(item.student_name) + "</option>"; }).join("");
    } else {
      els.linkedId.innerHTML = "";
    }
  }

  function hasActiveLinkedAccount(role, linkedId, ignoreId) {
    return users().some(function (user) {
      if (user.id === ignoreId || user.status !== "active" || user.role !== role) return false;
      return role === "teacher" ? user.linked_teacher_id === linkedId : user.linked_student_id === linkedId;
    });
  }

  function render() {
    const keyword = els.search.value.trim().toLowerCase();
    const role = els.roleFilter.value;
    const rows = users().filter(function (user) {
      const text = [user.display_name, user.email].join(" ").toLowerCase();
      return (!keyword || text.indexOf(keyword) >= 0) && (!role || user.role === role);
    });
    els.table.innerHTML = rows.map(function (user) {
      return "<tr>" +
        "<td><input class='table-input' data-action='name' data-id='" + user.id + "' value='" + html(user.display_name) + "'></td>" +
        "<td>" + html(user.email) + "</td>" +
        "<td>" + roleLabel(user.role) + "</td>" +
        "<td>" + (user.status === "active" ? "啟用" : "停用") + "</td>" +
        "<td>" + html(linkedLabel(user)) + "</td>" +
        "<td class='table-actions'>" +
        "<button type='button' data-action='pin' data-id='" + user.id + "'>重設PIN</button>" +
        "<button type='button' data-action='toggle' data-id='" + user.id + "'>" + (user.status === "active" ? "停用" : "啟用") + "</button>" +
        "<button type='button' data-action='delete' data-id='" + user.id + "'>刪除</button>" +
        "</td></tr>";
    }).join("") || "<tr><td colspan='6'>目前沒有符合條件的帳號。</td></tr>";
  }

  els.form.addEventListener("submit", function (event) {
    event.preventDefault();
    const role = els.role.value;
    const linkedId = els.linkedId.value || null;
    if ((role === "teacher" || role === "student") && !linkedId) return msg("請先選擇連結對象。");
    if ((role === "teacher" || role === "student") && hasActiveLinkedAccount(role, linkedId)) return msg("此對象已有啟用中的帳號。");
    const list = users();
    if (list.some(function (user) { return user.email.toLowerCase() === els.email.value.trim().toLowerCase(); })) return msg("Email 已存在。");
    const stamp = new Date().toISOString();
    const user = {
      id: Auth.generateUserId(),
      display_name: els.displayName.value.trim(),
      email: els.email.value.trim().toLowerCase(),
      role: role,
      linked_teacher_id: role === "teacher" ? linkedId : null,
      linked_student_id: role === "student" ? linkedId : null,
      status: "active",
      demo_pin: els.pin.value.trim(),
      last_login_at: null,
      created_at: stamp,
      updated_at: stamp
    };
    list.push(user);
    save(list);
    Auth.trackAuthEvent("account_created", { user_id: user.id, role: user.role });
    els.form.reset();
    fillLinkedOptions();
    render();
    msg("帳號已建立。");
  });

  els.table.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const list = users();
    const user = list.find(function (item) { return item.id === button.dataset.id; });
    if (!user) return;
    if (button.dataset.action === "toggle") {
      if (user.id === currentUser.id && user.status === "active") return msg("不能停用目前登入的帳號。");
      if (user.status !== "active" && (user.role === "teacher" || user.role === "student")) {
        const linkedId = user.role === "teacher" ? user.linked_teacher_id : user.linked_student_id;
        if (hasActiveLinkedAccount(user.role, linkedId, user.id)) return msg("此對象已有另一個啟用帳號。");
      }
      user.status = user.status === "active" ? "disabled" : "active";
      user.updated_at = new Date().toISOString();
      Auth.trackAuthEvent("account_disabled", { user_id: user.id, status: user.status });
    }
    if (button.dataset.action === "pin") {
      const value = window.prompt("請輸入新的 Demo PIN", user.demo_pin || "1111");
      if (!value) return;
      user.demo_pin = value.trim();
      user.updated_at = new Date().toISOString();
      Auth.trackAuthEvent("account_updated", { user_id: user.id, field: "demo_pin" });
    }
    if (button.dataset.action === "delete") {
      if (user.id === currentUser.id) return msg("不能刪除目前登入的帳號。");
      save(list.filter(function (item) { return item.id !== user.id; }));
      render();
      msg("帳號已刪除，老師或學生資料不會被刪除。");
      return;
    }
    save(list);
    render();
    msg("帳號已更新。");
  });

  els.table.addEventListener("change", function (event) {
    if (event.target.dataset.action !== "name") return;
    const list = users();
    const user = list.find(function (item) { return item.id === event.target.dataset.id; });
    if (!user) return;
    user.display_name = event.target.value.trim();
    user.updated_at = new Date().toISOString();
    save(list);
    Auth.trackAuthEvent("account_updated", { user_id: user.id, field: "display_name" });
    msg("顯示名稱已更新。");
  });

  els.search.addEventListener("input", render);
  els.roleFilter.addEventListener("change", render);
  els.role.addEventListener("change", fillLinkedOptions);
  els.refreshDemo.addEventListener("click", function () {
    Auth.createDemoAccounts();
    fillLinkedOptions();
    render();
    msg("Demo 帳號連結已刷新。");
  });
  els.menuToggle.addEventListener("click", function () {
    const open = els.sidebar.classList.toggle("is-open");
    els.menuToggle.setAttribute("aria-expanded", String(open));
  });

  Auth.createDemoAccounts();
  fillLinkedOptions();
  render();
})();
