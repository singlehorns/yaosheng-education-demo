(function () {
  "use strict";

  if (window.YaoshengAuth && !window.YaoshengAuth.requireRoles(["admin", "admissions"])) return;
  if (window.YaoshengAuth) window.YaoshengAuth.mountUserArea("leads");

  const LEADS_STORAGE_KEY = "yaosheng_demo_leads_v1";
  const STUDENTS_STORAGE_KEY = "yaosheng_demo_students_v1";
  const STATUS_OPTIONS = [
    { value: "new", label: "新名單" },
    { value: "pending_contact", label: "待聯絡" },
    { value: "contacted", label: "已聯絡" },
    { value: "trial_booked", label: "已預約體驗" },
    { value: "enrolled", label: "已報名" },
    { value: "not_interested", label: "暫不考慮" }
  ];
  const FOLLOW_STATUSES = ["pending_contact", "contacted", "trial_booked"];
  const ASSIGNEE_OPTIONS = ["", "陳招生顧問", "林招生顧問", "王管理員"];

  const elements = {
    sidebar: document.getElementById("sidebar"),
    menuToggle: document.getElementById("menuToggle"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    programFilter: document.getElementById("programFilter"),
    assigneeFilter: document.getElementById("assigneeFilter"),
    clearFilters: document.getElementById("clearFilters"),
    refreshButton: document.getElementById("refreshButton"),
    exportCsv: document.getElementById("exportCsv"),
    resultCount: document.getElementById("resultCount"),
    leadTable: document.getElementById("leadTable"),
    emptyState: document.getElementById("emptyState"),
    noResultState: document.getElementById("noResultState"),
    totalCount: document.getElementById("totalCount"),
    newCount: document.getElementById("newCount"),
    followCount: document.getElementById("followCount"),
    enrolledCount: document.getElementById("enrolledCount"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    leadDrawer: document.getElementById("leadDrawer"),
    drawerForm: document.getElementById("drawerForm"),
    drawerLeadId: document.getElementById("drawerLeadId"),
    drawerStatus: document.getElementById("drawerStatus"),
    drawerAssignee: document.getElementById("drawerAssignee"),
    drawerFollowUpAt: document.getElementById("drawerFollowUpAt"),
    drawerInternalNote: document.getElementById("drawerInternalNote"),
    internalNoteCount: document.getElementById("internalNoteCount"),
    leadDetailList: document.getElementById("leadDetailList"),
    closeDrawer: document.getElementById("closeDrawer"),
    cancelDrawer: document.getElementById("cancelDrawer"),
    convertStudentButton: document.getElementById("convertStudentButton"),
    conversionHint: document.getElementById("conversionHint"),
    conversionBackdrop: document.getElementById("conversionBackdrop"),
    conversionModal: document.getElementById("conversionModal"),
    conversionForm: document.getElementById("conversionForm"),
    conversionLeadId: document.getElementById("conversionLeadId"),
    studentName: document.getElementById("studentName"),
    guardianName: document.getElementById("guardianName"),
    studentPhone: document.getElementById("studentPhone"),
    studentEmail: document.getElementById("studentEmail"),
    studentGrade: document.getElementById("studentGrade"),
    studentSchool: document.getElementById("studentSchool"),
    studentAdvisor: document.getElementById("studentAdvisor"),
    studentInternalNote: document.getElementById("studentInternalNote"),
    studentInternalNoteCount: document.getElementById("studentInternalNoteCount"),
    conversionError: document.getElementById("conversionError"),
    conversionSuccess: document.getElementById("conversionSuccess"),
    closeConversionModal: document.getElementById("closeConversionModal"),
    cancelConversion: document.getElementById("cancelConversion"),
    liveMessage: document.getElementById("liveMessage")
  };

  let currentLeads = [];
  let filteredLeads = [];
  let lastFocusedElement = null;
  let lastConversionFocusedElement = null;

  function trackStudentEvent(eventName, eventData = {}) {
    console.log("[Student Demo Tracking]", eventName, eventData);
  }

  function loadLeads() {
    try {
      const storedValue = localStorage.getItem(LEADS_STORAGE_KEY);
      if (!storedValue) return [];

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        console.warn("[Lead Admin] Stored leads were not an array.");
        showMessage("名單資料格式異常，已暫時顯示空資料。");
        return [];
      }

      return parsedValue.slice().sort(function (a, b) {
        return new Date(getCreatedAt(b)).getTime() - new Date(getCreatedAt(a)).getTime();
      });
    } catch (error) {
      console.warn("[Lead Admin] Failed to parse stored leads.", error);
      showMessage("名單資料讀取失敗，已暫時顯示空資料。");
      return [];
    }
  }

  function saveLeads(leads) {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  }

  function getLeadById(id) {
    return loadLeads().find(function (lead) {
      return lead.id === id;
    }) || null;
  }

  function updateLeadById(id, updates) {
    const leads = loadLeads();
    let updatedLead = null;
    const nextLeads = leads.map(function (lead) {
      if (lead.id !== id) return lead;
      updatedLead = Object.assign({}, lead, updates, { updated_at: new Date().toISOString() });
      return updatedLead;
    });

    if (!updatedLead) return null;
    saveLeads(nextLeads);
    return updatedLead;
  }

  function deleteLeadById(id) {
    const leads = loadLeads();
    const nextLeads = leads.filter(function (lead) {
      return lead.id !== id;
    });
    saveLeads(nextLeads);
    return nextLeads.length !== leads.length;
  }

  function loadStudents() {
    try {
      const storedValue = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (!storedValue) return [];

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        console.warn("[Student Demo] Stored students were not an array.");
        return [];
      }

      return parsedValue;
    } catch (error) {
      console.warn("[Student Demo] Failed to parse stored students.", error);
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
      trackStudentEvent("duplicate_conversion_blocked", { lead_id: studentPayload.lead_id });
      throw new Error("This lead has already been converted.");
    }
    students.unshift(studentPayload);
    saveStudents(students);

    const verification = getStudentById(studentPayload.id);
    if (!verification) throw new Error("Student was not successfully saved.");
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
    const nextStudents = students.filter(function (student) {
      return student.id !== id;
    });
    saveStudents(nextStudents);
    return nextStudents.length !== students.length;
  }

  function generateStudentId() {
    const students = loadStudents();
    const existingIds = new Set(students.map(function (student) { return student.id; }));
    const now = new Date();
    const datePart = String(now.getFullYear()) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";

    do {
      let suffix = "";
      for (let index = 0; index < 4; index += 1) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
      }
      id = "STU-" + datePart + "-" + suffix;
    } while (existingIds.has(id));

    return id;
  }

  function getCreatedAt(lead) {
    return lead.created_at || "";
  }

  function getUpdatedAt(lead) {
    return lead.updated_at || lead.created_at || "";
  }

  function getStatusLabel(value) {
    const status = STATUS_OPTIONS.find(function (item) {
      return item.value === value;
    });
    return status ? status.label : "新名單";
  }

  function getStatusValue(lead) {
    const storedStatus = lead.status || "new";
    if (STATUS_OPTIONS.some(function (item) { return item.value === storedStatus; })) return storedStatus;
    const matchedStatus = STATUS_OPTIONS.find(function (item) {
      return item.label === storedStatus;
    });
    return matchedStatus ? matchedStatus.value : "new";
  }

  function getAssigneeLabel(value) {
    return value || "尚未指派";
  }

  function getSubjects(lead) {
    return Array.isArray(lead.subjects) ? lead.subjects : [];
  }

  function getSubjectsText(lead) {
    const subjects = getSubjects(lead);
    return subjects.length ? subjects.join("、") : "未填寫";
  }

  function getProgram(lead) {
    return lead.program_interest || "未填寫";
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

  function toDatetimeLocalValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function fromDatetimeLocalValue(value) {
    return value ? new Date(value).toISOString() : "";
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
    elements.statusFilter.innerHTML = "<option value=\"\">全部狀態</option>" + STATUS_OPTIONS.map(function (status) {
      return "<option value=\"" + status.value + "\">" + status.label + "</option>";
    }).join("");

    elements.drawerStatus.innerHTML = STATUS_OPTIONS.map(function (status) {
      return "<option value=\"" + status.value + "\">" + status.label + "</option>";
    }).join("");

    const assigneeOptionsHtml = ASSIGNEE_OPTIONS.map(function (assignee) {
      return "<option value=\"" + escapeAttribute(assignee) + "\">" + getAssigneeLabel(assignee) + "</option>";
    }).join("");
    elements.assigneeFilter.innerHTML = "<option value=\"\">全部負責人</option>" + ASSIGNEE_OPTIONS.slice(1).map(function (assignee) {
      return "<option value=\"" + escapeAttribute(assignee) + "\">" + assignee + "</option>";
    }).join("") + "<option value=\"__unassigned\">尚未指派</option>";
    elements.drawerAssignee.innerHTML = assigneeOptionsHtml;
    elements.studentAdvisor.innerHTML = assigneeOptionsHtml;
  }

  function updateProgramFilter(leads) {
    const currentValue = elements.programFilter.value;
    const programs = Array.from(new Set(leads.map(getProgram).filter(function (value) {
      return value && value !== "未填寫";
    }))).sort();

    elements.programFilter.innerHTML = "<option value=\"\">全部級段</option>" + programs.map(function (program) {
      return "<option value=\"" + escapeAttribute(program) + "\">" + escapeHtml(program) + "</option>";
    }).join("");
    if (programs.indexOf(currentValue) >= 0) elements.programFilter.value = currentValue;
  }

  function getFilteredLeads(leads) {
    const query = elements.searchInput.value.trim().toLowerCase();
    const status = elements.statusFilter.value;
    const program = elements.programFilter.value;
    const assignee = elements.assigneeFilter.value;

    return leads.filter(function (lead) {
      const haystack = [
        lead.id,
        lead.contact_name,
        lead.phone,
        lead.email,
        lead.school
      ].join(" ").toLowerCase();

      const assigneeValue = lead.assigned_to || "";

      return (!query || haystack.indexOf(query) !== -1) &&
        (!status || getStatusValue(lead) === status) &&
        (!program || getProgram(lead) === program) &&
        (!assignee ||
          (assignee === "__unassigned" ? !assigneeValue : assigneeValue === assignee));
    });
  }

  function renderMetrics(leads) {
    elements.totalCount.textContent = leads.length;
    elements.newCount.textContent = leads.filter(function (lead) {
      return getStatusValue(lead) === "new";
    }).length;
    elements.followCount.textContent = leads.filter(function (lead) {
      return FOLLOW_STATUSES.indexOf(getStatusValue(lead)) >= 0;
    }).length;
    elements.enrolledCount.textContent = leads.filter(function (lead) {
      return getStatusValue(lead) === "enrolled";
    }).length;
  }

  function renderLeadTable(leads) {
    elements.leadTable.innerHTML = "";

    leads.forEach(function (lead) {
      const tr = document.createElement("tr");
      const statusOptions = STATUS_OPTIONS.map(function (status) {
        return "<option value=\"" + status.value + "\"" + (status.value === getStatusValue(lead) ? " selected" : "") + ">" + status.label + "</option>";
      }).join("");

      tr.innerHTML =
        "<td><strong>" + escapeHtml(lead.id || "") + "</strong></td>" +
        "<td>" + escapeHtml(formatDateTime(getCreatedAt(lead))) + "</td>" +
        "<td>" + escapeHtml(lead.contact_name || "未填寫") + "</td>" +
        "<td>" + escapeHtml(lead.grade || "未填寫") + "</td>" +
        "<td>" + escapeHtml(getSubjectsText(lead)) + "</td>" +
        "<td>" + escapeHtml(getProgram(lead)) + "</td>" +
        "<td>" + escapeHtml(lead.phone || "未填寫") + "</td>" +
        "<td>" + escapeHtml(getAssigneeLabel(lead.assigned_to)) + "</td>" +
        "<td><span class=\"status-badge status-" + escapeAttribute(getStatusValue(lead)) + "\">" + getStatusLabel(getStatusValue(lead)) + "</span></td>" +
        "<td>" +
          "<div class=\"row-actions\">" +
            "<button type=\"button\" data-action=\"view\" data-id=\"" + escapeAttribute(lead.id) + "\">查看詳情</button>" +
            "<label class=\"sr-only\" for=\"quick-" + escapeAttribute(lead.id) + "\">快速修改狀態</label>" +
            "<select id=\"quick-" + escapeAttribute(lead.id) + "\" data-action=\"quick-status\" data-id=\"" + escapeAttribute(lead.id) + "\">" + statusOptions + "</select>" +
            "<button type=\"button\" class=\"danger\" data-action=\"delete\" data-id=\"" + escapeAttribute(lead.id) + "\">刪除</button>" +
          "</div>" +
        "</td>";
      elements.leadTable.appendChild(tr);
    });
  }

  function renderEmptyStates(allLeads, visibleLeads) {
    const hasLeads = allLeads.length > 0;
    elements.emptyState.hidden = hasLeads;
    elements.noResultState.hidden = !hasLeads || visibleLeads.length > 0;
    elements.resultCount.textContent = "目前顯示 " + visibleLeads.length + " 筆，共 " + allLeads.length + " 筆";
  }

  function render() {
    currentLeads = loadLeads();
    updateProgramFilter(currentLeads);
    filteredLeads = getFilteredLeads(currentLeads);
    renderMetrics(currentLeads);
    renderLeadTable(filteredLeads);
    renderEmptyStates(currentLeads, filteredLeads);
  }

  function renderDetailList(lead) {
    const detailRows = [
      ["名單編號", lead.id],
      ["姓名", lead.contact_name],
      ["電話", lead.phone],
      ["Email", lead.email],
      ["聯絡人身分", lead.contact_role],
      ["年級", lead.grade],
      ["學校", lead.school],
      ["想培養的能力", getSubjectsText(lead)],
      ["想了解的級段", getProgram(lead)],
      ["學習方式", lead.learning_mode],
      ["聯絡時段", lead.contact_time],
      ["聯絡方式", lead.preferred_contact_method],
      ["使用者備註", lead.note],
      ["建立時間", formatDateTime(getCreatedAt(lead))],
      ["更新時間", formatDateTime(getUpdatedAt(lead))],
      ["UTM 來源", lead.utm_source],
      ["UTM 媒介", lead.utm_medium],
      ["UTM 活動", lead.utm_campaign],
      ["目前狀態", getStatusLabel(getStatusValue(lead))]
    ];

    elements.leadDetailList.innerHTML = detailRows.map(function (row) {
      return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1] || "未填寫") + "</dd></div>";
    }).join("");
  }

  function isStudentSelfRole(contactRole) {
    return String(contactRole || "").trim() === "學生";
  }

  function isGuardianRole(contactRole) {
    const role = String(contactRole || "").trim();
    return role === "家長" || role === "父親" || role === "母親" || role === "親屬";
  }

  function renderConversionState(lead) {
    const existingStudent = getStudentByLeadId(lead.id);
    const isEnrolled = getStatusValue(lead) === "enrolled";

    elements.convertStudentButton.disabled = true;
    elements.convertStudentButton.textContent = "轉為正式學生";

    if (existingStudent) {
      elements.convertStudentButton.textContent = "已建立學生資料";
      elements.conversionHint.innerHTML = "學生編號：<strong>" + escapeHtml(existingStudent.id) + "</strong>。可前往學生管理查看。";
      return;
    }

    if (!isEnrolled) {
      elements.conversionHint.textContent = "請先將招生狀態更新為「已報名」。";
      return;
    }

    elements.convertStudentButton.disabled = false;
    elements.conversionHint.textContent = "此名單已報名，可建立正式學生資料。";
  }

  function clearConversionFeedback() {
    elements.conversionError.textContent = "";
    elements.conversionSuccess.hidden = true;
    elements.conversionSuccess.innerHTML = "";
  }

  function prefillConversionForm(lead) {
    elements.conversionLeadId.value = lead.id;
    elements.studentName.value = isStudentSelfRole(lead.contact_role) ? (lead.contact_name || "") : "";
    elements.guardianName.value = isGuardianRole(lead.contact_role) ? (lead.contact_name || "") : "";
    elements.studentPhone.value = lead.phone || "";
    elements.studentEmail.value = lead.email || "";
    elements.studentGrade.value = lead.grade || "";
    elements.studentSchool.value = lead.school || "";
    elements.studentAdvisor.value = lead.assigned_to || "";
    elements.studentInternalNote.value = lead.internal_note || "";
    elements.studentInternalNoteCount.textContent = String(elements.studentInternalNote.value.length);
    clearConversionFeedback();
  }

  function openConversionModal(leadId, trigger) {
    const lead = getLeadById(leadId);
    if (!lead) {
      showMessage("找不到這筆名單。");
      return;
    }

    if (getStatusValue(lead) !== "enrolled") {
      elements.conversionHint.textContent = "請先將招生狀態更新為「已報名」。";
      return;
    }

    if (getStudentByLeadId(lead.id)) {
      trackStudentEvent("duplicate_conversion_blocked", { lead_id: lead.id });
      showMessage("這筆名單已建立學生資料，不能重複轉換。");
      renderConversionState(lead);
      return;
    }

    trackStudentEvent("lead_conversion_started", { lead_id: lead.id });
    lastConversionFocusedElement = trigger || document.activeElement;
    prefillConversionForm(lead);
    elements.conversionBackdrop.hidden = false;
    elements.conversionModal.hidden = false;
    document.body.classList.add("drawer-open");
    window.setTimeout(function () {
      elements.studentName.focus();
    }, 0);
  }

  function closeConversionModal() {
    elements.conversionBackdrop.hidden = true;
    elements.conversionModal.hidden = true;
    clearConversionFeedback();
    document.body.classList.toggle("drawer-open", !elements.leadDrawer.hidden);
    if (lastConversionFocusedElement && typeof lastConversionFocusedElement.focus === "function") {
      lastConversionFocusedElement.focus();
    }
  }

  function buildStudentPayload(lead) {
    const now = new Date().toISOString();
    return {
      id: generateStudentId(),
      lead_id: lead.id,
      student_name: elements.studentName.value.trim(),
      guardian_name: elements.guardianName.value.trim(),
      phone: elements.studentPhone.value.trim(),
      email: elements.studentEmail.value.trim(),
      grade: elements.studentGrade.value.trim(),
      school: elements.studentSchool.value.trim(),
      learning_needs: getSubjects(lead),
      program_interest: lead.program_interest || "",
      learning_mode: lead.learning_mode || "",
      student_status: "active",
      enrollment_status: "enrolled",
      assigned_advisor: elements.studentAdvisor.value || "",
      internal_note: elements.studentInternalNote.value.trim(),
      source: lead.source || "website",
      utm_source: lead.utm_source || "direct",
      utm_medium: lead.utm_medium || "direct",
      utm_campaign: lead.utm_campaign || "direct",
      enrolled_at: now,
      created_at: now,
      updated_at: now
    };
  }

  function validateConversionForm() {
    if (!elements.studentName.value.trim()) return "請填寫學生姓名。";
    if (!elements.guardianName.value.trim()) return "請填寫家長或主要聯絡人。";
    if (!elements.studentPhone.value.trim()) return "請填寫聯絡電話。";
    if (!elements.studentGrade.value.trim()) return "請填寫年級。";
    return "";
  }

  function handleConversionSubmit(event) {
    event.preventDefault();
    clearConversionFeedback();

    const message = validateConversionForm();
    if (message) {
      elements.conversionError.textContent = message;
      return;
    }

    const leadId = elements.conversionLeadId.value;
    const lead = getLeadById(leadId);
    if (!lead) {
      elements.conversionError.textContent = "找不到原招生名單，無法建立學生資料。";
      return;
    }

    if (getStudentByLeadId(leadId)) {
      trackStudentEvent("duplicate_conversion_blocked", { lead_id: leadId });
      elements.conversionError.textContent = "這筆名單已建立學生資料，不能重複轉換。";
      renderConversionState(lead);
      return;
    }

    try {
      const studentPayload = buildStudentPayload(lead);
      const createdStudent = createStudent(studentPayload);
      const now = new Date().toISOString();
      const updatedLead = updateLeadById(leadId, {
        status: "enrolled",
        converted_to_student: true,
        student_id: createdStudent.id,
        converted_at: now
      });

      if (!updatedLead) {
        deleteStudentById(createdStudent.id);
        throw new Error("Lead was not updated after student creation.");
      }

      trackStudentEvent("lead_converted_to_student", { lead_id: leadId, student_id: createdStudent.id });
      elements.conversionSuccess.hidden = false;
      elements.conversionSuccess.innerHTML = "" +
        "<h3>正式學生資料已建立。</h3>" +
        "<p>學生編號：<strong>" + escapeHtml(createdStudent.id) + "</strong></p>" +
        "<a class=\"button-link\" href=\"students.html\">前往學生管理</a>";
      render();
      renderConversionState(updatedLead);
      showMessage("正式學生資料已建立。");
    } catch (error) {
      console.error("[Student Demo] Conversion failed.", error);
      elements.conversionError.textContent = "學生資料暫時無法建立，請稍後再試。";
    }
  }

  function openDrawer(id, trigger) {
    const lead = getLeadById(id);
    if (!lead) {
      showMessage("找不到這筆名單。");
      return;
    }

    lastFocusedElement = trigger || document.activeElement;
    renderDetailList(lead);
    elements.drawerLeadId.value = lead.id;
    elements.drawerStatus.value = getStatusValue(lead);
    elements.drawerAssignee.value = lead.assigned_to || "";
    elements.drawerFollowUpAt.value = toDatetimeLocalValue(lead.follow_up_at);
    elements.drawerInternalNote.value = lead.internal_note || "";
    elements.internalNoteCount.textContent = String(elements.drawerInternalNote.value.length);
    renderConversionState(lead);

    elements.drawerBackdrop.hidden = false;
    elements.leadDrawer.hidden = false;
    document.body.classList.add("drawer-open");
    window.setTimeout(function () {
      elements.drawerStatus.focus();
    }, 0);
  }

  function closeDrawer() {
    elements.drawerBackdrop.hidden = true;
    elements.leadDrawer.hidden = true;
    document.body.classList.remove("drawer-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function handleDrawerSubmit(event) {
    event.preventDefault();
    const id = elements.drawerLeadId.value;
    const updatedLead = updateLeadById(id, {
      status: elements.drawerStatus.value,
      assigned_to: elements.drawerAssignee.value || null,
      internal_note: elements.drawerInternalNote.value.trim(),
      follow_up_at: fromDatetimeLocalValue(elements.drawerFollowUpAt.value)
    });

    if (!updatedLead) {
      showMessage("找不到這筆名單，無法更新。");
      return;
    }

    render();
    showMessage("名單資料已更新");
    closeDrawer();
  }

  function exportCsv() {
    const header = [
      "id",
      "created_at",
      "updated_at",
      "contact_name",
      "phone",
      "email",
      "contact_role",
      "grade",
      "school",
      "subjects",
      "program_interest",
      "learning_mode",
      "contact_time",
      "preferred_contact_method",
      "note",
      "status",
      "assigned_to",
      "internal_note",
      "follow_up_at",
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign"
    ];

    const rows = filteredLeads.map(function (lead) {
      return [
        lead.id,
        lead.created_at,
        lead.updated_at,
        lead.contact_name,
        lead.phone,
        lead.email,
        lead.contact_role,
        lead.grade,
        lead.school,
        getSubjectsText(lead),
        lead.program_interest,
        lead.learning_mode,
        lead.contact_time,
        lead.preferred_contact_method,
        lead.note,
        getStatusLabel(getStatusValue(lead)),
        getAssigneeLabel(lead.assigned_to),
        lead.internal_note,
        lead.follow_up_at,
        lead.source,
        lead.utm_source,
        lead.utm_medium,
        lead.utm_campaign
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
    link.download = "abacus-leads-" + fileStamp + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showMessage("CSV 已匯出");
  }

  function clearFilters() {
    elements.searchInput.value = "";
    elements.statusFilter.value = "";
    elements.programFilter.value = "";
    elements.assigneeFilter.value = "";
    render();
    showMessage("篩選條件已清除");
  }

  function toggleMobileMenu(forceOpen) {
    const willOpen = typeof forceOpen === "boolean" ? forceOpen : !elements.sidebar.classList.contains("is-open");
    elements.sidebar.classList.toggle("is-open", willOpen);
    elements.menuToggle.setAttribute("aria-expanded", String(willOpen));
  }

  function bindEvents() {
    [elements.searchInput, elements.statusFilter, elements.programFilter, elements.assigneeFilter].forEach(function (input) {
      input.addEventListener("input", render);
      input.addEventListener("change", render);
    });

    elements.clearFilters.addEventListener("click", clearFilters);
    elements.refreshButton.addEventListener("click", function () {
      render();
      showMessage("名單資料已重新整理");
    });
    elements.exportCsv.addEventListener("click", exportCsv);

    elements.leadTable.addEventListener("click", function (event) {
      const target = event.target;
      const action = target.getAttribute("data-action");
      const id = target.getAttribute("data-id");

      if (action === "view") {
        openDrawer(id, target);
      }

      if (action === "delete") {
        if (!window.confirm("確定要刪除這筆招生名單？此動作無法復原。")) return;
        if (deleteLeadById(id)) {
          render();
          showMessage("名單已刪除");
        }
      }
    });

    elements.leadTable.addEventListener("change", function (event) {
      const target = event.target;
      if (target.getAttribute("data-action") !== "quick-status") return;
      const id = target.getAttribute("data-id");
      const updatedLead = updateLeadById(id, { status: target.value });
      if (updatedLead) {
        render();
        showMessage("名單狀態已更新");
      }
    });

    elements.drawerForm.addEventListener("submit", handleDrawerSubmit);
    elements.closeDrawer.addEventListener("click", closeDrawer);
    elements.cancelDrawer.addEventListener("click", closeDrawer);
    elements.drawerBackdrop.addEventListener("click", closeDrawer);
    elements.convertStudentButton.addEventListener("click", function () {
      openConversionModal(elements.drawerLeadId.value, elements.convertStudentButton);
    });
    elements.conversionForm.addEventListener("submit", handleConversionSubmit);
    elements.closeConversionModal.addEventListener("click", closeConversionModal);
    elements.cancelConversion.addEventListener("click", closeConversionModal);
    elements.conversionBackdrop.addEventListener("click", closeConversionModal);
    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!target) return;
      if (target.id === "closeConversionModal" || target.id === "cancelConversion" || target.id === "conversionBackdrop") {
        event.preventDefault();
        closeConversionModal();
      }
    });
    elements.drawerInternalNote.addEventListener("input", function () {
      elements.internalNoteCount.textContent = String(elements.drawerInternalNote.value.length);
    });
    elements.studentInternalNote.addEventListener("input", function () {
      elements.studentInternalNoteCount.textContent = String(elements.studentInternalNote.value.length);
    });

    elements.menuToggle.addEventListener("click", function () {
      toggleMobileMenu();
    });

    const closeDemoAlert = document.getElementById("closeDemoAlert");
    const demoAlert = document.getElementById("demoAlert");
    if (closeDemoAlert && demoAlert) {
      closeDemoAlert.addEventListener("click", function () {
        demoAlert.hidden = true;
      });
    }

    document.querySelectorAll("[data-coming-soon]").forEach(function (button) {
      button.addEventListener("click", function () {
        showMessage("此功能將於下一階段建立。");
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (!elements.conversionModal.hidden) {
          closeConversionModal();
          return;
        }
        if (!elements.leadDrawer.hidden) closeDrawer();
      }

      if (event.key === "Tab" && (!elements.leadDrawer.hidden || !elements.conversionModal.hidden)) {
        const activeLayer = elements.conversionModal.hidden ? elements.leadDrawer : elements.conversionModal;
        const focusable = Array.prototype.slice.call(activeLayer.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
          .filter(function (item) {
            return !item.disabled;
          });
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
