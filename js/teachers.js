(function () {
  "use strict";
  if (window.YaoshengAuth && !window.YaoshengAuth.requireRoles(["admin"])) return;
  if (window.YaoshengAuth) window.YaoshengAuth.mountUserArea("teachers");
  const A = window.AcademicDemo;
  const $ = (id) => document.getElementById(id);
  const els = {
    sidebar: $("sidebar"), menuToggle: $("menuToggle"), search: $("searchInput"), specialty: $("specialtyFilter"), status: $("statusFilter"),
    table: $("tableBody"), empty: $("emptyState"), none: $("noResultState"), result: $("resultCount"),
    total: $("totalCount"), active: $("activeCount"), leave: $("leaveCount"), unassigned: $("unassignedCount"),
    seed: $("seedDemo"), newItem: $("newItem"), exportCsv: $("exportCsv"), clear: $("clearFilters"),
    backdrop: $("drawerBackdrop"), drawer: $("drawer"), form: $("itemForm"), itemId: $("itemId"), close: $("closeDrawer"), cancel: $("cancelDrawer"),
    name: $("teacherName"), phone: $("phone"), email: $("email"), emp: $("employmentStatus"), checks: $("specialtyChecks"),
    intro: $("introduction"), introCount: $("introCount"), note: $("internalNote"), noteCount: $("noteCount"), error: $("formError"), classes: $("classList"), live: $("liveMessage")
  };
  let filtered = [], lastFocus = null;
  function trackTeacherEvent(eventName, eventData = {}) { console.log("[Teacher Demo Tracking]", eventName, eventData); }
  function label(map, value) { return A.labels[map][value] || value || "未填寫"; }
  function html(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function date(value) { return value ? new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "未填寫"; }
  function msg(text) { els.live.textContent = text; els.live.classList.add("is-visible"); clearTimeout(msg.t); msg.t = setTimeout(() => els.live.classList.remove("is-visible"), 2400); }
  function assignedClasses(id) { return A.loadClasses().filter((c) => c.teacher_id === id && c.class_status !== "cancelled"); }
  function activeClassCount(id) { return assignedClasses(id).length; }
  function fillOptions() {
    els.status.innerHTML = "<option value=''>全部狀態</option>" + Object.keys(A.labels.employment_status).map((k) => "<option value='" + k + "'>" + A.labels.employment_status[k] + "</option>").join("");
    els.emp.innerHTML = Object.keys(A.labels.employment_status).map((k) => "<option value='" + k + "'>" + A.labels.employment_status[k] + "</option>").join("");
    els.specialty.innerHTML = "<option value=''>全部專長</option>" + Object.keys(A.labels.specialties).map((k) => "<option value='" + k + "'>" + A.labels.specialties[k] + "</option>").join("");
    els.checks.innerHTML = Object.keys(A.labels.specialties).map((k) => "<label><input type='checkbox' value='" + k + "'> " + A.labels.specialties[k] + "</label>").join("");
  }
  function selectedSpecialties() { return Array.from(els.checks.querySelectorAll("input:checked")).map((i) => i.value); }
  function setSelected(values) { Array.from(els.checks.querySelectorAll("input")).forEach((i) => { i.checked = (values || []).indexOf(i.value) >= 0; }); }
  function render() {
    const q = els.search.value.trim().toLowerCase(), sp = els.specialty.value, st = els.status.value;
    const teachers = A.loadTeachers();
    filtered = teachers.filter((t) => {
      const hay = [t.id, t.teacher_name, t.phone, t.email].join(" ").toLowerCase();
      return (!q || hay.indexOf(q) >= 0) && (!sp || (t.specialties || []).indexOf(sp) >= 0) && (!st || t.employment_status === st);
    });
    els.total.textContent = teachers.length;
    els.active.textContent = teachers.filter((t) => t.employment_status === "active").length;
    els.leave.textContent = teachers.filter((t) => t.employment_status === "leave").length;
    els.unassigned.textContent = teachers.filter((t) => activeClassCount(t.id) === 0).length;
    els.result.textContent = "目前顯示 " + filtered.length + " 筆，共 " + teachers.length + " 筆";
    els.empty.hidden = teachers.length !== 0; els.none.hidden = teachers.length === 0 || filtered.length !== 0; els.table.innerHTML = "";
    filtered.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td><strong>" + html(t.id) + "</strong></td><td>" + html(t.teacher_name) + "</td><td>" + html(t.phone || "未填寫") + "</td><td>" + html(t.email || "未填寫") + "</td><td>" + html((t.specialties || []).map((v) => label("specialties", v)).join("、") || "未填寫") + "</td><td>" + activeClassCount(t.id) + "</td><td><span class='status-badge status-" + (t.employment_status === "active" ? "enrolled" : "pending_contact") + "'>" + label("employment_status", t.employment_status) + "</span></td><td>" + date(t.created_at) + "</td><td><div class='row-actions'><button data-action='view' data-id='" + html(t.id) + "'>查看詳情</button><button class='danger' data-action='delete' data-id='" + html(t.id) + "'>刪除</button></div></td>";
      els.table.appendChild(tr);
    });
  }
  function open(id, trigger) {
    const t = id ? A.getTeacherById(id) : null; lastFocus = trigger || document.activeElement; els.itemId.value = id || "";
    els.name.value = t ? t.teacher_name || "" : ""; els.phone.value = t ? t.phone || "" : ""; els.email.value = t ? t.email || "" : ""; els.emp.value = t ? t.employment_status || "active" : "active"; setSelected(t ? t.specialties : []);
    els.intro.value = t ? t.introduction || "" : ""; els.note.value = t ? t.internal_note || "" : ""; els.introCount.textContent = els.intro.value.length; els.noteCount.textContent = els.note.value.length; els.error.textContent = "";
    const classes = t ? assignedClasses(t.id) : [];
    els.classes.innerHTML = classes.length ? classes.map((c) => "<div><dt>" + html(c.class_name) + "</dt><dd>" + html((c.schedule_days || []).map((d) => label("schedule_days", d)).join("、") + " " + c.start_time + "～" + c.end_time + "，學生 " + A.activeEnrollmentCount(c.id) + " 人") + "</dd></div>").join("") : "<p>尚未指派班級。</p>";
    els.backdrop.hidden = false; els.drawer.hidden = false; document.body.classList.add("drawer-open"); setTimeout(() => els.name.focus(), 0);
  }
  function close() { els.backdrop.hidden = true; els.drawer.hidden = true; document.body.classList.remove("drawer-open"); if (lastFocus) lastFocus.focus(); }
  function save(e) {
    e.preventDefault(); if (!els.name.value.trim()) { els.error.textContent = "請填寫老師姓名。"; return; }
    const payload = { teacher_name: els.name.value.trim(), phone: els.phone.value.trim(), email: els.email.value.trim(), specialties: selectedSpecialties(), introduction: els.intro.value.trim(), employment_status: els.emp.value, internal_note: els.note.value.trim() };
    const old = els.itemId.value ? A.getTeacherById(els.itemId.value) : null;
    if (els.itemId.value) { A.updateTeacherById(els.itemId.value, payload); trackTeacherEvent(old && old.employment_status !== payload.employment_status ? "teacher_status_changed" : "teacher_updated", { teacher_id: els.itemId.value }); }
    else { const created = A.createTeacher(payload); trackTeacherEvent("teacher_created", { teacher_id: created.id }); }
    render(); msg("老師資料已儲存"); close();
  }
  function exportCsv() {
    const rows = filtered.map((t) => [t.id, t.teacher_name, t.phone, t.email, (t.specialties || []).map((v) => label("specialties", v)).join("、"), label("employment_status", t.employment_status), t.introduction, t.internal_note, t.created_at, t.updated_at].map((v) => '"' + String(v || "").replace(/"/g, '""') + '"').join(","));
    const blob = new Blob(["\uFEFF" + ["id", "teacher_name", "phone", "email", "specialties", "employment_status", "introduction", "internal_note", "created_at", "updated_at"].join(",") + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"), now = new Date(); a.href = URL.createObjectURL(blob); a.download = "yaosheng-teachers-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + ".csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  }
  fillOptions(); render();
  [els.search, els.specialty, els.status].forEach((i) => { i.addEventListener("input", render); i.addEventListener("change", render); });
  els.clear.addEventListener("click", () => { els.search.value = ""; els.specialty.value = ""; els.status.value = ""; render(); });
  els.newItem.addEventListener("click", (e) => open("", e.target)); els.exportCsv.addEventListener("click", exportCsv); els.seed.addEventListener("click", () => msg(A.seedDemoData() ? "Demo 範例資料已建立" : "Demo 範例資料已存在"));
  els.table.addEventListener("click", (e) => { const id = e.target.getAttribute("data-id"); if (e.target.getAttribute("data-action") === "view") open(id, e.target); if (e.target.getAttribute("data-action") === "delete") { if (!window.confirm("確定要刪除這位 Demo 老師？")) return; if (!A.deleteTeacherById(id)) { msg("此老師仍負責班級，請先重新指派班級老師。"); return; } trackTeacherEvent("teacher_deleted", { teacher_id: id }); render(); msg("老師已刪除"); } });
  els.form.addEventListener("submit", save); els.close.addEventListener("click", close); els.cancel.addEventListener("click", close); els.backdrop.addEventListener("click", close); els.intro.addEventListener("input", () => els.introCount.textContent = els.intro.value.length); els.note.addEventListener("input", () => els.noteCount.textContent = els.note.value.length);
  els.menuToggle.addEventListener("click", () => { const openMenu = els.sidebar.classList.toggle("is-open"); els.menuToggle.setAttribute("aria-expanded", String(openMenu)); });
  document.querySelectorAll("[data-coming-soon]").forEach((b) => b.addEventListener("click", () => msg("此功能將於下一階段建立。")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !els.drawer.hidden) close(); });
})();
