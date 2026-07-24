(function () {
  "use strict";

  if (window.YaoshengAuth && !window.YaoshengAuth.requireRoles(["admin", "admissions"])) return;
  if (window.YaoshengAuth) window.YaoshengAuth.mountUserArea("students");

  const STUDENTS_STORAGE_KEY = "yaosheng_demo_students_v1";
  const LEADS_STORAGE_KEY = "yaosheng_demo_leads_v1";
  const STUDENT_STATUS_OPTIONS = [
    { value: "active", label: "在學" },
    { value: "paused", label: "暫停" },
    { value: "graduated", label: "結業" },
    { value: "withdrawn", label: "退班" }
  ];
  const ADVISOR_OPTIONS = ["", "陳招生顧問", "林招生顧問", "王管理員"];

  const elements = {
    sidebar: document.getElementById("sidebar"),
    menuToggle: document.getElementById("menuToggle"),
    searchInput: document.getElementById("searchInput"),
    gradeFilter: document.getElementById("gradeFilter"),
    statusFilter: document.getElementById("statusFilter"),
    advisorFilter: document.getElementById("advisorFilter"),
    clearFilters: document.getElementById("clearFilters"),
    refreshButton: document.getElementById("refreshButton"),
    exportCsv: document.getElementById("exportCsv"),
    resultCount: document.getElementById("resultCount"),
    studentTable: document.getElementById("studentTable"),
    emptyState: document.getElementById("emptyState"),
    noResultState: document.getElementById("noResultState"),
    totalStudents: document.getElementById("totalStudents"),
    activeStudents: document.getElementById("activeStudents"),
    newThisMonth: document.getElementById("newThisMonth"),
    unassignedClass: document.getElementById("unassignedClass"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    studentDrawer: document.getElementById("studentDrawer"),
    studentForm: document.getElementById("studentForm"),
    drawerStudentId: document.getElementById("drawerStudentId"),
    drawerStudentName: document.getElementById("drawerStudentName"),
    drawerGuardianName: document.getElementById("drawerGuardianName"),
    drawerPhone: document.getElementById("drawerPhone"),
    drawerEmail: document.getElementById("drawerEmail"),
    drawerGrade: document.getElementById("drawerGrade"),
    drawerSchool: document.getElementById("drawerSchool"),
    drawerAdvisor: document.getElementById("drawerAdvisor"),
    drawerStudentStatus: document.getElementById("drawerStudentStatus"),
    drawerInternalNote: document.getElementById("drawerInternalNote"),
    internalNoteCount: document.getElementById("internalNoteCount"),
    studentDetailList: document.getElementById("studentDetailList"),
    studentClassList: document.getElementById("studentClassList"),
    formError: document.getElementById("formError"),
    closeDrawer: document.getElementById("closeDrawer"),
    cancelDrawer: document.getElementById("cancelDrawer"),
    liveMessage: document.getElementById("liveMessage")
  };

  let currentStudents = [];
  let filteredStudents = [];
  let lastFocusedElement = null;

  function trackStudentEvent(eventName, eventData = {}) {
    console.log("[Student Demo Tracking]", eventName, eventData);
  }

  function loadStudents() {
    try {
      const storedValue = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (!storedValue) return [];
      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        console.warn("[Student Demo] Stored students were not an array.");
        showMessage("學生資料格式異常，已暫時顯示空資料。");
        return [];
      }
      return parsedValue.slice().sort(function (a, b) {
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      });
    } catch (error) {
      console.warn("[Student Demo] Failed to parse stored students.", error);
      showMessage("學生資料讀取失敗，已暫時顯示空資料。");
      return [];
    }
  }

  function saveStudents(students) {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  }

  function getStudentById(id) {
    return loadStudents().find(function (student) {
      return student.id === id;
    }) || null;
  }

  function getStudentByLeadId(leadId) {
    return loadStudents().find(function (student) {
      return student.lead_id === leadId;
    }) || null;
  }

  function createStudent(studentPayload) {
    const students = loadStudents();
    if (students.some(function (student) { return student.lead_id === studentPayload.lead_id; })) {
      throw new Error("This lead has already been converted.");
    }
    students.unshift(studentPayload);
    saveStudents(students);
    return studentPayload;
  }

  function updateStudentById(id, updates) {
    const students = loadStudents();
    let updatedStudent = null;
    const nextStudents = students.map(function (student) {
      if (student.id !== id) return student;
      updatedStudent = Object.assign({}, student, updates, { updated_at: new Date().toISOString() });
      return updatedStudent;
    });
    if (!updatedStudent) return null;
    saveStudents(nextStudents);
    return updatedStudent;
  }

  function deleteStudentById(id) {
    const students = loadStudents();
    const removedStudent = students.find(function (student) { return student.id === id; }) || null;
    const nextStudents = students.filter(function (student) {
      return student.id !== id;
    });
    saveStudents(nextStudents);
    return removedStudent;
  }

  function loadLeads() {
    try {
      const storedValue = localStorage.getItem(LEADS_STORAGE_KEY);
      if (!storedValue) return [];
      const parsedValue = JSON.parse(storedValue);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (error) {
      console.warn("[Student Demo] Failed to parse leads while syncing conversion state.", error);
      return [];
    }
  }

  function saveLeads(leads) {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  }

  function clearLeadConversion(student) {
    if (!student || !student.lead_id) return;
    const leads = loadLeads();
    const nextLeads = leads.map(function (lead) {
      if (lead.id !== student.lead_id) return lead;
      const nextLead = Object.assign({}, lead, {
        converted_to_student: false,
        student_id: null,
        converted_at: null,
        updated_at: new Date().toISOString()
      });
      return nextLead;
    });
    saveLeads(nextLeads);
  }

  function getStudentStatusLabel(value) {
    const status = STUDENT_STATUS_OPTIONS.find(function (item) { return item.value === value; });
    return status ? status.label : "在學";
  }

  function getStudentStatusValue(student) {
    const value = student.student_status || "active";
    if (STUDENT_STATUS_OPTIONS.some(function (item) { return item.value === value; })) return value;
    const matched = STUDENT_STATUS_OPTIONS.find(function (item) { return item.label === value; });
    return matched ? matched.value : "active";
  }

  function getAdvisorLabel(value) {
    return value || "尚未指派";
  }

  function getLearningNeedsText(student) {
    return Array.isArray(student.learning_needs) && student.learning_needs.length ? student.learning_needs.join("、") : "未填寫";
  }

  function getClassText(student) {
    return getActiveClassNames(student).length ? "已分班" : "尚未分班";
  }

  function getAcademic() {
    return window.AcademicDemo || null;
  }

  function getActiveEnrollments(student) {
    var academic = getAcademic();
    if (!academic || !student || !student.id) return [];
    return academic.getEnrollmentsByStudentId(student.id).filter(function (enrollment) {
      return enrollment.enrollment_status === "active";
    });
  }

  function getActiveClassNames(student) {
    var academic = getAcademic();
    if (!academic) return [];
    return getActiveEnrollments(student).map(function (enrollment) {
      var klass = academic.getClassById(enrollment.class_id);
      return klass ? klass.class_name : "";
    }).filter(Boolean);
  }

  function formatClassSchedule(klass) {
    var academic = getAcademic();
    if (!klass || !academic) return "未填寫";
    return (klass.schedule_days || []).map(function (day) {
      return academic.labels.schedule_days[day] || day;
    }).join("、") + " " + (klass.start_time || "") + "～" + (klass.end_time || "");
  }

  function formatDateTime(value) {
    if (!value) return "未填寫";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未填寫";
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function escapeCsv(value) {
    return "\"" + String(value == null ? "" : value).replace(/"/g, "\"\"") + "\"";
  }

  function showMessage(message) {
    elements.liveMessage.textContent = message;
    elements.liveMessage.classList.add("is-visible");
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(function () {
      elements.liveMessage.classList.remove("is-visible");
    }, 2600);
  }

  function fillStaticSelects() {
    elements.statusFilter.innerHTML = "<option value=\"\">全部狀態</option>" + STUDENT_STATUS_OPTIONS.map(function (status) {
      return "<option value=\"" + status.value + "\">" + status.label + "</option>";
    }).join("");
    elements.drawerStudentStatus.innerHTML = STUDENT_STATUS_OPTIONS.map(function (status) {
      return "<option value=\"" + status.value + "\">" + status.label + "</option>";
    }).join("");

    const advisorOptions = ADVISOR_OPTIONS.map(function (advisor) {
      return "<option value=\"" + escapeAttribute(advisor) + "\">" + getAdvisorLabel(advisor) + "</option>";
    }).join("");
    elements.drawerAdvisor.innerHTML = advisorOptions;
    elements.advisorFilter.innerHTML = "<option value=\"\">全部顧問</option>" + ADVISOR_OPTIONS.slice(1).map(function (advisor) {
      return "<option value=\"" + escapeAttribute(advisor) + "\">" + advisor + "</option>";
    }).join("") + "<option value=\"__unassigned\">尚未指派</option>";
  }

  function updateDynamicFilters(students) {
    const currentGrade = elements.gradeFilter.value;
    const grades = Array.from(new Set(students.map(function (student) {
      return student.grade || "";
    }).filter(Boolean))).sort();
    elements.gradeFilter.innerHTML = "<option value=\"\">全部年級</option>" + grades.map(function (grade) {
      return "<option value=\"" + escapeAttribute(grade) + "\">" + escapeHtml(grade) + "</option>";
    }).join("");
    if (grades.indexOf(currentGrade) >= 0) elements.gradeFilter.value = currentGrade;
  }

  function getFilteredStudents(students) {
    const query = elements.searchInput.value.trim().toLowerCase();
    const grade = elements.gradeFilter.value;
    const status = elements.statusFilter.value;
    const advisor = elements.advisorFilter.value;

    trackStudentEvent("students_filtered", { query, grade, status, advisor });

    return students.filter(function (student) {
      const haystack = [
        student.id,
        student.student_name,
        student.guardian_name,
        student.phone,
        student.email,
        student.school,
        student.lead_id
      ].join(" ").toLowerCase();
      const advisorValue = student.assigned_advisor || "";

      return (!query || haystack.indexOf(query) !== -1) &&
        (!grade || student.grade === grade) &&
        (!status || getStudentStatusValue(student) === status) &&
        (!advisor || (advisor === "__unassigned" ? !advisorValue : advisorValue === advisor));
    });
  }

  function renderMetrics(students) {
    const now = new Date();
    const monthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    elements.totalStudents.textContent = students.length;
    elements.activeStudents.textContent = students.filter(function (student) {
      return getStudentStatusValue(student) === "active";
    }).length;
    elements.newThisMonth.textContent = students.filter(function (student) {
      return String(student.created_at || "").slice(0, 7) === monthKey;
    }).length;
    elements.unassignedClass.textContent = students.filter(function (student) {
      return getActiveEnrollments(student).length === 0;
    }).length;
  }

  function renderTable(students) {
    elements.studentTable.innerHTML = "";
    students.forEach(function (student) {
      const tr = document.createElement("tr");
      const statusOptions = STUDENT_STATUS_OPTIONS.map(function (status) {
        return "<option value=\"" + status.value + "\"" + (status.value === getStudentStatusValue(student) ? " selected" : "") + ">" + status.label + "</option>";
      }).join("");
      tr.innerHTML =
        "<td><strong>" + escapeHtml(student.id || "") + "</strong></td>" +
        "<td>" + escapeHtml(formatDateTime(student.created_at)) + "</td>" +
        "<td>" + escapeHtml(student.student_name || "未填寫") + "</td>" +
        "<td>" + escapeHtml(student.guardian_name || "未填寫") + "</td>" +
        "<td>" + escapeHtml(student.grade || "未填寫") + "</td>" +
        "<td>" + escapeHtml(student.school || "未填寫") + "</td>" +
        "<td>" + escapeHtml(student.phone || "未填寫") + "</td>" +
        "<td>" + escapeHtml(getAdvisorLabel(student.assigned_advisor)) + "</td>" +
        "<td>" + escapeHtml(getActiveClassNames(student).join("、") || "尚未安排班級") + "</td>" +
        "<td><span class=\"class-pill\">" + escapeHtml(getClassText(student)) + "</span></td>" +
        "<td><span class=\"status-badge student-status-" + escapeAttribute(getStudentStatusValue(student)) + "\">" + getStudentStatusLabel(getStudentStatusValue(student)) + "</span></td>" +
        "<td>" +
          "<div class=\"row-actions student-row-actions\">" +
            "<button type=\"button\" data-action=\"view\" data-id=\"" + escapeAttribute(student.id) + "\">查看詳情</button>" +
            "<label class=\"sr-only\" for=\"student-status-" + escapeAttribute(student.id) + "\">修改狀態</label>" +
            "<select id=\"student-status-" + escapeAttribute(student.id) + "\" data-action=\"quick-status\" data-id=\"" + escapeAttribute(student.id) + "\">" + statusOptions + "</select>" +
            "<button type=\"button\" class=\"danger\" data-action=\"delete\" data-id=\"" + escapeAttribute(student.id) + "\">刪除Demo學生</button>" +
          "</div>" +
        "</td>";
      elements.studentTable.appendChild(tr);
    });
  }

  function renderEmptyStates(allStudents, visibleStudents) {
    const hasStudents = allStudents.length > 0;
    elements.emptyState.hidden = hasStudents;
    elements.noResultState.hidden = !hasStudents || visibleStudents.length > 0;
    elements.resultCount.textContent = "目前顯示 " + visibleStudents.length + " 筆，共 " + allStudents.length + " 筆";
  }

  function render() {
    currentStudents = loadStudents();
    updateDynamicFilters(currentStudents);
    filteredStudents = getFilteredStudents(currentStudents);
    renderMetrics(currentStudents);
    renderTable(filteredStudents);
    renderEmptyStates(currentStudents, filteredStudents);
  }

  function renderDetailList(student) {
    const rows = [
      ["學生編號", student.id],
      ["原招生名單編號", student.lead_id],
      ["學生姓名", student.student_name],
      ["家長或聯絡人", student.guardian_name],
      ["電話", student.phone],
      ["Email", student.email],
      ["年級", student.grade],
      ["學校", student.school],
      ["想培養的能力", getLearningNeedsText(student)],
      ["想了解的級段", student.program_interest],
      ["學習方式", student.learning_mode],
      ["招生顧問", getAdvisorLabel(student.assigned_advisor)],
      ["內部備註", student.internal_note],
      ["學生狀態", getStudentStatusLabel(getStudentStatusValue(student))],
      ["報名時間", formatDateTime(student.enrolled_at)],
      ["建立時間", formatDateTime(student.created_at)],
      ["更新時間", formatDateTime(student.updated_at)],
      ["招生來源", student.source],
      ["UTM 來源", student.utm_source],
      ["UTM 媒介", student.utm_medium],
      ["UTM 活動", student.utm_campaign]
    ];
    elements.studentDetailList.innerHTML = rows.map(function (row) {
      return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1] || "未填寫") + "</dd></div>";
    }).join("");
    renderStudentClasses(student);
  }

  function renderStudentClasses(student) {
    var academic = getAcademic();
    var enrollments = getActiveEnrollments(student);
    if (!academic || !enrollments.length) {
      elements.studentClassList.innerHTML = "<p>尚未安排班級。</p>";
      return;
    }
    elements.studentClassList.innerHTML = enrollments.map(function (enrollment) {
      var klass = academic.getClassById(enrollment.class_id);
      var course = klass ? academic.getCourseById(klass.course_id) : null;
      var teacher = klass ? academic.getTeacherById(klass.teacher_id) : null;
      return "<div><dt>" + escapeHtml(course ? course.course_name : "未指定課程") + "</dt><dd>" +
        escapeHtml(klass ? klass.class_name : "未指定班級") + "<br>" +
        "授課老師：" + escapeHtml(teacher ? teacher.teacher_name : "未指定") + "<br>" +
        "上課時間：" + escapeHtml(formatClassSchedule(klass)) + "<br>" +
        "班級狀態：" + escapeHtml(klass && academic.labels.class_status[klass.class_status] ? academic.labels.class_status[klass.class_status] : "未填寫") + "<br>" +
        "加入日期：" + escapeHtml(formatDateTime(enrollment.joined_at)) +
      "</dd></div>";
    }).join("");
  }

  function openDrawer(id, trigger) {
    const student = getStudentById(id);
    if (!student) {
      showMessage("找不到這筆學生資料。");
      return;
    }
    trackStudentEvent("student_detail_opened", { student_id: id });
    lastFocusedElement = trigger || document.activeElement;
    renderDetailList(student);
    elements.drawerStudentId.value = student.id;
    elements.drawerStudentName.value = student.student_name || "";
    elements.drawerGuardianName.value = student.guardian_name || "";
    elements.drawerPhone.value = student.phone || "";
    elements.drawerEmail.value = student.email || "";
    elements.drawerGrade.value = student.grade || "";
    elements.drawerSchool.value = student.school || "";
    elements.drawerAdvisor.value = student.assigned_advisor || "";
    elements.drawerStudentStatus.value = getStudentStatusValue(student);
    elements.drawerInternalNote.value = student.internal_note || "";
    elements.internalNoteCount.textContent = String(elements.drawerInternalNote.value.length);
    elements.formError.textContent = "";

    elements.drawerBackdrop.hidden = false;
    elements.studentDrawer.hidden = false;
    document.body.classList.add("drawer-open");
    window.setTimeout(function () {
      elements.drawerStudentName.focus();
    }, 0);
  }

  function closeDrawer() {
    elements.drawerBackdrop.hidden = true;
    elements.studentDrawer.hidden = true;
    document.body.classList.remove("drawer-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
  }

  function validateStudentForm() {
    if (!elements.drawerStudentName.value.trim()) return "請填寫學生姓名。";
    if (!elements.drawerGuardianName.value.trim()) return "請填寫家長或聯絡人。";
    if (!elements.drawerPhone.value.trim()) return "請填寫電話。";
    if (!elements.drawerGrade.value.trim()) return "請填寫年級。";
    return "";
  }

  function handleStudentSubmit(event) {
    event.preventDefault();
    const message = validateStudentForm();
    if (message) {
      elements.formError.textContent = message;
      return;
    }
    const id = elements.drawerStudentId.value;
    const originalStudent = getStudentById(id);
    const updatedStudent = updateStudentById(id, {
      student_name: elements.drawerStudentName.value.trim(),
      guardian_name: elements.drawerGuardianName.value.trim(),
      phone: elements.drawerPhone.value.trim(),
      email: elements.drawerEmail.value.trim(),
      grade: elements.drawerGrade.value.trim(),
      school: elements.drawerSchool.value.trim(),
      assigned_advisor: elements.drawerAdvisor.value,
      internal_note: elements.drawerInternalNote.value.trim(),
      student_status: elements.drawerStudentStatus.value
    });
    if (!updatedStudent) {
      elements.formError.textContent = "找不到這筆學生資料，無法更新。";
      return;
    }
    if (originalStudent && getStudentStatusValue(originalStudent) !== getStudentStatusValue(updatedStudent)) {
      trackStudentEvent("student_status_changed", { student_id: id, status: updatedStudent.student_status });
    }
    trackStudentEvent("student_updated", { student_id: id });
    render();
    showMessage("學生資料已更新");
    closeDrawer();
  }

  function exportCsv() {
    const header = [
      "id",
      "lead_id",
      "student_name",
      "guardian_name",
      "phone",
      "email",
      "grade",
      "school",
      "learning_needs",
      "program_interest",
      "learning_mode",
      "student_status",
      "assigned_advisor",
      "internal_note",
      "enrolled_at",
      "created_at",
      "updated_at",
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign"
    ];
    const rows = filteredStudents.map(function (student) {
      return [
        student.id,
        student.lead_id,
        student.student_name,
        student.guardian_name,
        student.phone,
        student.email,
        student.grade,
        student.school,
        getLearningNeedsText(student),
        student.program_interest,
        student.learning_mode,
        getStudentStatusLabel(getStudentStatusValue(student)),
        getAdvisorLabel(student.assigned_advisor),
        student.internal_note,
        student.enrolled_at,
        student.created_at,
        student.updated_at,
        student.source,
        student.utm_source,
        student.utm_medium,
        student.utm_campaign
      ].map(escapeCsv).join(",");
    });
    const csv = "\uFEFF" + header.map(escapeCsv).join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const fileStamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "-" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");
    link.href = url;
    link.download = "abacus-students-" + fileStamp + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    trackStudentEvent("students_exported", { count: filteredStudents.length });
    showMessage("學生 CSV 已匯出");
  }

  function clearFilters() {
    elements.searchInput.value = "";
    elements.gradeFilter.value = "";
    elements.statusFilter.value = "";
    elements.advisorFilter.value = "";
    render();
    showMessage("篩選條件已清除");
  }

  function toggleMobileMenu(forceOpen) {
    const willOpen = typeof forceOpen === "boolean" ? forceOpen : !elements.sidebar.classList.contains("is-open");
    elements.sidebar.classList.toggle("is-open", willOpen);
    elements.menuToggle.setAttribute("aria-expanded", String(willOpen));
  }

  function bindEvents() {
    [elements.searchInput, elements.gradeFilter, elements.statusFilter, elements.advisorFilter].forEach(function (input) {
      input.addEventListener("input", render);
      input.addEventListener("change", render);
    });
    elements.clearFilters.addEventListener("click", clearFilters);
    elements.refreshButton.addEventListener("click", function () {
      render();
      showMessage("學生資料已重新整理");
    });
    elements.exportCsv.addEventListener("click", exportCsv);
    elements.studentTable.addEventListener("click", function (event) {
      const target = event.target;
      const action = target.getAttribute("data-action");
      const id = target.getAttribute("data-id");
      if (action === "view") openDrawer(id, target);
      if (action === "delete") {
        if (!window.confirm("確定要刪除這筆 Demo 學生資料？原招生名單不會刪除。")) return;
        const removedStudent = deleteStudentById(id);
        if (removedStudent) {
          clearLeadConversion(removedStudent);
          trackStudentEvent("student_deleted", { student_id: id, lead_id: removedStudent.lead_id });
          render();
          showMessage("Demo 學生已刪除，原招生名單可重新轉換");
        }
      }
    });
    elements.studentTable.addEventListener("change", function (event) {
      const target = event.target;
      if (target.getAttribute("data-action") !== "quick-status") return;
      const id = target.getAttribute("data-id");
      const updatedStudent = updateStudentById(id, { student_status: target.value });
      if (updatedStudent) {
        trackStudentEvent("student_status_changed", { student_id: id, status: target.value });
        render();
        showMessage("學生狀態已更新");
      }
    });
    elements.studentForm.addEventListener("submit", handleStudentSubmit);
    elements.closeDrawer.addEventListener("click", closeDrawer);
    elements.cancelDrawer.addEventListener("click", closeDrawer);
    elements.drawerBackdrop.addEventListener("click", closeDrawer);
    elements.drawerInternalNote.addEventListener("input", function () {
      elements.internalNoteCount.textContent = String(elements.drawerInternalNote.value.length);
    });
    elements.menuToggle.addEventListener("click", function () {
      toggleMobileMenu();
    });
    document.querySelectorAll("[data-coming-soon]").forEach(function (button) {
      button.addEventListener("click", function () {
        showMessage("此功能將於下一階段建立。");
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !elements.studentDrawer.hidden) closeDrawer();
      if (event.key === "Tab" && !elements.studentDrawer.hidden) {
        const focusable = Array.prototype.slice.call(elements.studentDrawer.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
          .filter(function (item) { return !item.disabled; });
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  fillStaticSelects();
  bindEvents();
  render();
})();
