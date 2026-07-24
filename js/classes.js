(function () {
  "use strict";

  if (window.YaoshengAuth && !window.YaoshengAuth.requireRoles(["admin"])) return;
  if (window.YaoshengAuth) window.YaoshengAuth.mountUserArea("classes");

  const A = window.AcademicDemo;
  const $ = (id) => document.getElementById(id);
  const REOPEN_CLASS_KEY = "yaosheng_demo_reopen_class_id";
  const REOPEN_MESSAGE_KEY = "yaosheng_demo_reopen_class_message";
  const els = {
    sidebar: $("sidebar"), menuToggle: $("menuToggle"), search: $("searchInput"), courseFilter: $("courseFilter"), teacherFilter: $("teacherFilter"), statusFilter: $("statusFilter"),
    table: $("tableBody"), empty: $("emptyState"), none: $("noResultState"), result: $("resultCount"), total: $("totalCount"), open: $("openCount"), progress: $("progressCount"), full: $("fullCount"),
    seed: $("seedDemo"), newItem: $("newItem"), exportCsv: $("exportCsv"), clear: $("clearFilters"),
    backdrop: $("drawerBackdrop"), drawer: $("drawer"), form: $("itemForm"), itemId: $("itemId"), close: $("closeDrawer"), cancel: $("cancelDrawer"),
    className: $("className"), courseId: $("courseId"), teacherId: $("teacherId"), branchName: $("branchName"), learningMode: $("learningMode"), dayChecks: $("dayChecks"),
    startTime: $("startTime"), endTime: $("endTime"), startDate: $("startDate"), endDate: $("endDate"), capacity: $("capacity"), roomName: $("roomName"), classStatus: $("classStatus"), note: $("internalNote"),
    error: $("formError"), enrollmentTable: $("enrollmentTable"), capacityHint: $("capacityHint"), addStudentButton: $("addStudentButton"),
    studentModalBackdrop: $("studentModalBackdrop"), studentModal: $("studentModal"), closeStudentModal: $("closeStudentModal"), studentSearch: $("studentSearch"), studentOptions: $("studentOptions"),
    live: $("liveMessage")
  };

  let filtered = [];
  let activeClass = null;
  let lastFocus = null;
  let currentManagingClassId = null;
  const pendingStudentAdds = new Set();

  function trackClassEvent(eventName, eventData = {}) {
    console.log("[Class Demo Tracking]", eventName, eventData);
  }

  function label(map, value) {
    return A.labels[map][value] || value || "未填寫";
  }

  function html(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function date(value) {
    return value ? new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "未填寫";
  }

  function msg(text) {
    els.live.textContent = text;
    els.live.classList.add("is-visible");
    clearTimeout(msg.t);
    msg.t = setTimeout(function () { els.live.classList.remove("is-visible"); }, 2400);
  }

  function courseName(id) {
    const course = A.getCourseById(id);
    return course ? course.course_name : "未指定課程";
  }

  function teacherName(id) {
    const teacher = A.getTeacherById(id);
    return teacher ? teacher.teacher_name : "未指定老師";
  }

  function daysText(days) {
    return (days || []).map(function (day) { return label("schedule_days", day); }).join("、") || "未填寫";
  }

  function activeCount(id) {
    return A.activeEnrollmentCount(id);
  }

  function getManagedClassId() {
    return els.studentModal.dataset.classId || currentManagingClassId || "";
  }

  function enableNativePicker(input) {
    if (!input || input.dataset.pickerEnabled === "true") return;
    input.dataset.pickerEnabled = "true";
    input.addEventListener("click", function () {
      if (typeof input.showPicker !== "function" || input.disabled || input.readOnly) return;
      try {
        input.showPicker();
      } catch (error) {
        console.debug("[Class Demo] Native picker could not be opened.", error);
      }
    });
  }

  function initNativePickers(scope) {
    (scope || document).querySelectorAll('input[type="date"], input[type="time"], input[type="datetime-local"]').forEach(enableNativePicker);
  }

  function selectedDays() {
    return Array.from(els.dayChecks.querySelectorAll("input:checked")).map(function (input) { return input.value; });
  }

  function setDays(values) {
    Array.from(els.dayChecks.querySelectorAll("input")).forEach(function (input) {
      input.checked = (values || []).indexOf(input.value) >= 0;
    });
  }

  function fillSelects() {
    const selectedCourseFilter = els.courseFilter.value;
    const selectedTeacherFilter = els.teacherFilter.value;
    const selectedStatusFilter = els.statusFilter.value;
    const selectedCourseId = els.courseId.value;
    const selectedTeacherId = els.teacherId.value;
    const selectedLearningMode = els.learningMode.value;
    const selectedClassStatus = els.classStatus.value;
    const selectedScheduleDays = selectedDays();
    const courses = A.loadCourses().filter(function (course) { return course.course_status !== "archived"; });
    const teachers = A.loadTeachers().filter(function (teacher) { return teacher.employment_status === "active" || teacher.employment_status === "leave"; });

    els.courseFilter.innerHTML = "<option value=''>全部課程</option>" + courses.map(function (course) {
      return "<option value='" + html(course.id) + "'>" + html(course.course_name) + "</option>";
    }).join("");
    els.courseId.innerHTML = "<option value=''>請選擇</option>" + courses.map(function (course) {
      return "<option value='" + html(course.id) + "'>" + html(course.course_name) + "</option>";
    }).join("");
    els.teacherFilter.innerHTML = "<option value=''>全部老師</option>" + teachers.map(function (teacher) {
      return "<option value='" + html(teacher.id) + "'>" + html(teacher.teacher_name) + "</option>";
    }).join("");
    els.teacherId.innerHTML = "<option value=''>請選擇</option>" + teachers.map(function (teacher) {
      return "<option value='" + html(teacher.id) + "'>" + html(teacher.teacher_name + (teacher.employment_status === "leave" ? "（暫停授課）" : "")) + "</option>";
    }).join("");
    els.statusFilter.innerHTML = "<option value=''>全部狀態</option>" + Object.keys(A.labels.class_status).map(function (key) {
      return "<option value='" + key + "'>" + label("class_status", key) + "</option>";
    }).join("");
    els.classStatus.innerHTML = Object.keys(A.labels.class_status).map(function (key) {
      return "<option value='" + key + "'>" + label("class_status", key) + "</option>";
    }).join("");
    els.learningMode.innerHTML = Object.keys(A.labels.learning_mode).map(function (key) {
      return "<option value='" + key + "'>" + label("learning_mode", key) + "</option>";
    }).join("");
    els.dayChecks.innerHTML = Object.keys(A.labels.schedule_days).map(function (key) {
      return "<label><input type='checkbox' value='" + key + "'> " + label("schedule_days", key) + "</label>";
    }).join("");

    els.courseFilter.value = selectedCourseFilter;
    els.teacherFilter.value = selectedTeacherFilter;
    els.statusFilter.value = selectedStatusFilter;
    els.courseId.value = selectedCourseId;
    els.teacherId.value = selectedTeacherId;
    els.learningMode.value = selectedLearningMode;
    els.classStatus.value = selectedClassStatus;
    setDays(selectedScheduleDays);
  }

  function render() {
    fillSelects();
    const query = els.search.value.trim().toLowerCase();
    const course = els.courseFilter.value;
    const teacher = els.teacherFilter.value;
    const status = els.statusFilter.value;
    const classes = A.loadClasses();

    filtered = classes.filter(function (klass) {
      const haystack = [klass.id, klass.class_name, courseName(klass.course_id), teacherName(klass.teacher_id), klass.room_name, klass.branch_name].join(" ").toLowerCase();
      return (!query || haystack.indexOf(query) >= 0) && (!course || klass.course_id === course) && (!teacher || klass.teacher_id === teacher) && (!status || klass.class_status === status);
    });

    els.total.textContent = classes.length;
    els.open.textContent = classes.filter(function (klass) { return klass.class_status === "open"; }).length;
    els.progress.textContent = classes.filter(function (klass) { return klass.class_status === "in_progress"; }).length;
    els.full.textContent = classes.filter(function (klass) { return activeCount(klass.id) >= Number(klass.capacity || 0); }).length;
    els.result.textContent = "目前顯示 " + filtered.length + " 筆，共 " + classes.length + " 筆";
    els.empty.hidden = classes.length !== 0;
    els.none.hidden = classes.length === 0 || filtered.length !== 0;
    els.table.innerHTML = "";

    filtered.forEach(function (klass) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td><strong>" + html(klass.id) + "</strong></td>" +
        "<td>" + html(klass.class_name) + "</td>" +
        "<td>" + html(courseName(klass.course_id)) + "</td>" +
        "<td>" + html(teacherName(klass.teacher_id)) + "</td>" +
        "<td>" + html(daysText(klass.schedule_days) + " " + klass.start_time + "～" + klass.end_time) + "</td>" +
        "<td>" + html(date(klass.start_date)) + "</td>" +
        "<td>" + activeCount(klass.id) + "／" + html(klass.capacity || 0) + "</td>" +
        "<td>" + html(klass.room_name || klass.branch_name || "未填寫") + "</td>" +
        "<td><span class='status-badge status-" + (klass.class_status === "open" ? "enrolled" : "pending_contact") + "'>" + label("class_status", klass.class_status) + "</span></td>" +
        "<td><div class='row-actions'><button type='button' data-action='view' data-id='" + html(klass.id) + "'>查看詳情</button><button type='button' class='danger' data-action='delete' data-id='" + html(klass.id) + "'>刪除</button></div></td>";
      els.table.appendChild(tr);
    });
  }

  function payload() {
    return {
      id: els.itemId.value || undefined,
      class_name: els.className.value.trim(),
      course_id: els.courseId.value,
      teacher_id: els.teacherId.value,
      branch_name: els.branchName.value.trim() || "Demo 教室",
      learning_mode: els.learningMode.value,
      schedule_days: selectedDays(),
      start_time: els.startTime.value,
      end_time: els.endTime.value,
      start_date: els.startDate.value,
      end_date: els.endDate.value,
      capacity: Number(els.capacity.value),
      room_name: els.roomName.value.trim(),
      class_status: els.classStatus.value,
      internal_note: els.note.value.trim()
    };
  }

  function validate(data) {
    if (!data.class_name) return "請填寫班級名稱。";
    if (!A.getCourseById(data.course_id)) return "請選擇有效課程。";
    if (!A.getTeacherById(data.teacher_id)) return "請選擇有效老師。";
    if (!data.schedule_days.length) return "請至少選擇一個上課星期。";
    if (!data.start_time || !data.end_time || data.end_time <= data.start_time) return "結束時間必須晚於開始時間。";
    if (!data.start_date) return "請填寫開課日期。";
    if (data.end_date && data.end_date < data.start_date) return "結束日期不可早於開課日期。";
    if (data.capacity < 1 || data.capacity > 100) return "容量需介於 1～100。";
    if (A.hasTeacherScheduleConflict(data, A.loadClasses())) {
      trackClassEvent("teacher_schedule_conflict", { teacher_id: data.teacher_id });
      return "此老師在相同時段已有其他班級。";
    }
    return "";
  }

  function open(id, trigger, options) {
    const klass = id ? A.getClassById(id) : null;
    lastFocus = trigger || document.activeElement;
    activeClass = klass;
    currentManagingClassId = klass ? klass.id : null;
    els.itemId.value = id || "";
    els.className.value = klass ? klass.class_name || "" : "";
    els.courseId.value = klass ? klass.course_id || "" : "";
    els.teacherId.value = klass ? klass.teacher_id || "" : "";
    els.branchName.value = klass ? klass.branch_name || "Demo 教室" : "Demo 教室";
    els.learningMode.value = klass ? klass.learning_mode || "onsite" : "onsite";
    setDays(klass ? klass.schedule_days : []);
    els.startTime.value = klass ? klass.start_time || "" : "";
    els.endTime.value = klass ? klass.end_time || "" : "";
    els.startDate.value = klass ? klass.start_date || "" : "";
    els.endDate.value = klass ? klass.end_date || "" : "";
    els.capacity.value = klass ? klass.capacity || 12 : 12;
    els.roomName.value = klass ? klass.room_name || "" : "";
    els.classStatus.value = klass ? klass.class_status || "planned" : "planned";
    els.note.value = klass ? klass.internal_note || "" : "";
    els.error.textContent = "";
    renderEnrollments();
    initNativePickers(els.drawer);
    els.backdrop.hidden = false;
    els.drawer.hidden = false;
    document.body.classList.add("drawer-open");
    if (!options || !options.skipInitialFocus) {
      setTimeout(function () { els.className.focus(); }, 0);
    }
  }

  function scrollToStudentList() {
    setTimeout(function () {
      els.addStudentButton.scrollIntoView({ block: "center" });
      els.addStudentButton.focus({ preventScroll: true });
    }, 60);
  }

  function close() {
    els.backdrop.hidden = true;
    els.drawer.hidden = true;
    document.body.classList.remove("drawer-open");
    if (lastFocus) lastFocus.focus();
  }

  function save(event) {
    event.preventDefault();
    const data = payload();
    const error = validate(data);
    if (error) {
      els.error.textContent = error;
      return;
    }
    const oldClass = data.id ? A.getClassById(data.id) : null;
    if (data.id) {
      A.updateClassById(data.id, data);
      trackClassEvent(oldClass && oldClass.teacher_id !== data.teacher_id ? "class_teacher_changed" : oldClass && oldClass.class_status !== data.class_status ? "class_status_changed" : "class_updated", { class_id: data.id });
    } else {
      delete data.id;
      const created = A.createClass(data);
      trackClassEvent("class_created", { class_id: created.id });
    }
    render();
    msg("班級資料已儲存");
    close();
  }

  function renderEnrollments() {
    const id = currentManagingClassId || els.itemId.value;
    const klass = id ? A.getClassById(id) : null;
    const count = id ? activeCount(id) : 0;
    els.capacityHint.textContent = klass ? "目前 " + count + " / " + klass.capacity + " 人" : "請先儲存班級後再加入學生。";
    els.addStudentButton.disabled = !klass || count >= Number(klass.capacity || 0);
    if (klass && count >= Number(klass.capacity || 0)) {
      els.capacityHint.textContent += "，班級人數已達上限";
      trackClassEvent("class_capacity_reached", { class_id: id });
    }
    els.enrollmentTable.innerHTML = "";
    if (!id) return;

    A.getEnrollmentsByClassId(id).filter(function (enrollment) {
      return enrollment.enrollment_status === "active";
    }).forEach(function (enrollment) {
      const student = A.getStudentById(enrollment.student_id) || {};
      const tr = document.createElement("tr");
      tr.innerHTML = "<td>" + html(student.id || enrollment.student_id) + "</td>" +
        "<td>" + html(student.student_name || "未填寫") + "</td>" +
        "<td>" + html(student.grade || "未填寫") + "</td>" +
        "<td>" + html(student.school || "未填寫") + "</td>" +
        "<td>" + date(enrollment.joined_at) + "</td>" +
        "<td>" + label("enrollment_status", enrollment.enrollment_status) + "</td>" +
        "<td><button type='button' class='danger' data-enrollment='" + html(enrollment.id) + "'>移出班級</button></td>";
      els.enrollmentTable.appendChild(tr);
    });
  }

  function openStudentModal() {
    const id = currentManagingClassId || els.itemId.value;
    const klass = A.getClassById(id);
    if (!klass) return msg("請先儲存班級後再加入學生。");
    if (activeCount(id) >= Number(klass.capacity || 0)) return msg("班級人數已達上限");
    currentManagingClassId = id;
    els.studentModal.dataset.classId = id;
    els.studentModalBackdrop.inert = false;
    els.studentModal.inert = false;
    els.studentModalBackdrop.removeAttribute("aria-hidden");
    els.studentModal.removeAttribute("aria-hidden");
    els.studentModalBackdrop.style.display = "";
    els.studentModal.style.display = "";
    els.studentModalBackdrop.hidden = false;
    els.studentModal.hidden = false;
    els.studentModal.classList.add("is-open");
    els.studentModalBackdrop.classList.add("is-open");
    renderStudentOptions();
    setTimeout(function () { els.studentSearch.focus(); }, 0);
  }

  function resetStudentOptionButtons() {
    els.studentOptions.querySelectorAll(".add-student-to-class-button").forEach(function (item) {
      item.removeAttribute("aria-busy");
      item.textContent = "加入";
    });
  }

  function closeStudentModal() {
    resetStudentOptionButtons();
    if (els.studentModal.contains(document.activeElement)) {
      (els.addStudentButton || document.body).focus({ preventScroll: true });
    }
    els.studentModal.classList.remove("is-open");
    els.studentModalBackdrop.classList.remove("is-open");
    els.studentModalBackdrop.hidden = true;
    els.studentModal.hidden = true;
    els.studentModalBackdrop.setAttribute("hidden", "");
    els.studentModal.setAttribute("hidden", "");
    els.studentModalBackdrop.setAttribute("aria-hidden", "true");
    els.studentModal.setAttribute("aria-hidden", "true");
    els.studentModalBackdrop.inert = true;
    els.studentModal.inert = true;
    els.studentModalBackdrop.style.display = "none";
    els.studentModal.style.display = "none";
    els.studentSearch.value = "";
    delete els.studentModal.dataset.classId;
  }

  function closeStudentModalAndEnsureFreshView() {
    closeStudentModal();
    setTimeout(function () {
      const modalStillVisible = els.studentModal &&
        !els.studentModal.hidden &&
        window.getComputedStyle(els.studentModal).display !== "none";
      const backdropStillVisible = els.studentModalBackdrop &&
        !els.studentModalBackdrop.hidden &&
        window.getComputedStyle(els.studentModalBackdrop).display !== "none";
      if (modalStillVisible || backdropStillVisible) {
        console.warn("[Class Demo] Student modal did not close after saving.");
      }
    }, 150);
  }

  function renderStudentOptions() {
    const classId = getManagedClassId();
    const query = els.studentSearch.value.trim().toLowerCase();
    if (!classId) {
      console.error("[Class Demo] Cannot render available students without classId.");
      els.studentOptions.innerHTML = "<p class='student-empty-state'>無法辨識目前班級，請關閉視窗後重新操作。</p>";
      return;
    }
    const students = A.getAvailableStudentsForClass(classId).filter(function (student) {
      return !query || [student.id, student.student_name, student.guardian_name, student.phone, student.school].join(" ").toLowerCase().indexOf(query) >= 0;
    });
    els.studentOptions.innerHTML = students.length ? students.map(function (student) {
      return "<div class='student-option'><div><strong>" + html(student.student_name) + "</strong><p>" + html(student.grade || "") + " " + html(student.school || "") + "｜" + html(student.phone || "") + "</p></div><button type='button' class='add-student-to-class-button' data-student-id='" + html(student.id) + "'>加入</button></div>";
    }).join("") : "<div class='student-empty-state'><strong>目前沒有可加入此班級的學生。</strong><p>可能是尚未建立正式學生、所有在學學生都已加入此班，或學生狀態不是在學。</p><a class='button-link' href='students.html'>前往學生管理</a></div>";
  }

  function refreshClassStudentViews(classId) {
    if (classId) currentManagingClassId = classId;
    renderEnrollments();
    render();
    if (!els.studentModal.hidden) renderStudentOptions();
  }

  function handleAddStudentFailure(reason) {
    const messages = {
      missing_class_id: "無法辨識目前班級，請關閉視窗後重新操作。",
      missing_student_id: "無法辨識學生資料，請重新開啟名單。",
      class_not_found: "找不到班級資料，請重新整理頁面。",
      student_not_found: "找不到學生資料，請重新整理頁面。",
      student_not_active: "此學生目前不是在學狀態。",
      already_active: "此學生目前已在此班級。",
      class_full: "班級人數已達上限。"
    };
    console.error("[Class Demo] Add student failed", { reason });
    msg(messages[reason] || "學生加入失敗，請查看 Console 詳細原因。");
  }

  function addStudent(studentId, button) {
    const classId = getManagedClassId();
    if (!classId) {
      console.error("[Class Demo] Missing classId while adding student.", { classId, studentId });
      handleAddStudentFailure("missing_class_id");
      return;
    }
    if (!studentId) {
      console.error("[Class Demo] Missing studentId while adding student.", { classId, studentId });
      handleAddStudentFailure("missing_student_id");
      return;
    }

    const pendingKey = classId + "::" + studentId;
    if (pendingStudentAdds.has(pendingKey)) return;
    pendingStudentAdds.add(pendingKey);

    if (typeof A.addStudentToClass !== "function") {
      console.error("[Class Demo] AcademicDemo.addStudentToClass is not available. The browser may be using an old cached script.");
      msg("班級分班程式尚未更新，請重新整理頁面後再試。");
      pendingStudentAdds.delete(pendingKey);
      return;
    }

    let result = null;
    try {
      console.log("[Class Demo] Adding student", { classId, studentId });
      console.log("[Class Demo] Existing enrollments", A.loadEnrollments());
      result = A.addStudentToClass(classId, studentId);
      console.log("[Class Demo] Add result", result);
    } catch (error) {
      console.error("[Class Demo] Student could not be added.", error);
      msg("學生加入失敗，請查看 Console 詳細原因。");
      pendingStudentAdds.delete(pendingKey);
      return;
    }

    if (!result || !result.success) {
      handleAddStudentFailure(result ? result.reason : "unknown");
      pendingStudentAdds.delete(pendingKey);
      return;
    }

    trackClassEvent(result.reactivated ? "student_rejoined_class" : "student_added_to_class", { class_id: classId, student_id: studentId });
    const successMessage = result.reactivated ? "學生已重新加入班級。" : "學生已加入班級。";
    msg(successMessage);
    pendingStudentAdds.delete(pendingKey);
    closeStudentModalAndEnsureFreshView();
    try {
      refreshClassStudentViews(classId);
    } catch (error) {
      console.error("[Class Demo] Student was saved, but the view refresh failed.", error);
      msg(result.reactivated ? "學生已重新加入班級，請重新整理查看最新畫面。" : "學生已加入班級，請重新整理查看最新畫面。");
    }
  }

  function handleAddStudentClick(event) {
    const button = event.target.closest(".add-student-to-class-button");
    if (!button || !els.studentModal.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    console.log("[Class Demo] Add student button clicked", {
      classId: getManagedClassId(),
      studentId: button.dataset.studentId || button.getAttribute("data-student-id")
    });
    addStudent(button.dataset.studentId || button.getAttribute("data-student-id"), button);
  }

  function removeStudent(enrollmentId, button) {
    if (!window.confirm("確定要將這位學生移出班級？")) return;
    if (button) {
      button.disabled = true;
      button.textContent = "處理中…";
    }
    const withdrawn = A.withdrawEnrollmentById(enrollmentId);
    if (!withdrawn) {
      if (button) {
        button.disabled = false;
        button.textContent = "移出班級";
      }
      msg("找不到可移出的分班紀錄。");
      return;
    }
    trackClassEvent("student_removed_from_class", { enrollment_id: enrollmentId, class_id: withdrawn.class_id, student_id: withdrawn.student_id });
    refreshClassStudentViews(withdrawn.class_id);
    msg("學生已移出班級。");
  }

  function exportCsv() {
    const rows = filtered.map(function (klass) {
      return [klass.id, klass.class_name, klass.course_id, courseName(klass.course_id), klass.teacher_id, teacherName(klass.teacher_id), klass.branch_name, label("learning_mode", klass.learning_mode), daysText(klass.schedule_days), klass.start_time, klass.end_time, klass.start_date, klass.end_date, klass.capacity, activeCount(klass.id), klass.room_name, label("class_status", klass.class_status), klass.created_at, klass.updated_at].map(function (value) {
        return '"' + String(value || "").replace(/"/g, '""') + '"';
      }).join(",");
    });
    const blob = new Blob(["\uFEFFid,class_name,course_id,course_name,teacher_id,teacher_name,branch_name,learning_mode,schedule_days,start_time,end_time,start_date,end_date,capacity,active_student_count,room_name,class_status,created_at,updated_at\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    const now = new Date();
    link.href = URL.createObjectURL(blob);
    link.download = "abacus-classes-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  fillSelects();
  initNativePickers(document);
  render();

  try {
    const reopenClassId = sessionStorage.getItem(REOPEN_CLASS_KEY);
    const reopenMessage = sessionStorage.getItem(REOPEN_MESSAGE_KEY);
    if (reopenClassId && A.getClassById(reopenClassId)) {
      sessionStorage.removeItem(REOPEN_CLASS_KEY);
      sessionStorage.removeItem(REOPEN_MESSAGE_KEY);
      setTimeout(function () {
        open(reopenClassId, null, { skipInitialFocus: true });
        scrollToStudentList();
        msg(reopenMessage || "學生已加入班級。");
      }, 0);
    }
  } catch (error) {
    console.debug("[Class Demo] Reopen class state could not be restored.", error);
  }

  [els.search, els.courseFilter, els.teacherFilter, els.statusFilter].forEach(function (input) {
    input.addEventListener("input", render);
    input.addEventListener("change", render);
  });
  els.clear.addEventListener("click", function () {
    els.search.value = "";
    els.courseFilter.value = "";
    els.teacherFilter.value = "";
    els.statusFilter.value = "";
    render();
  });
  els.newItem.addEventListener("click", function (event) { open("", event.target); });
  els.exportCsv.addEventListener("click", exportCsv);
  els.seed.addEventListener("click", function () {
    msg(A.seedDemoData() ? "Demo 範例資料已建立" : "Demo 範例資料已存在");
    render();
  });
  els.table.addEventListener("click", function (event) {
    const id = event.target.getAttribute("data-id");
    const action = event.target.getAttribute("data-action");
    if (action === "view") open(id, event.target);
    if (action === "delete") {
      if (!window.confirm("確定要刪除這個 Demo 班級？")) return;
      if (!A.deleteClassById(id)) return msg("此班級仍有在班學生，請先將學生移出班級或將分班狀態更新。");
      trackClassEvent("class_deleted", { class_id: id });
      render();
      msg("班級已刪除");
    }
  });
  els.form.addEventListener("submit", save);
  els.close.addEventListener("click", close);
  els.cancel.addEventListener("click", close);
  els.backdrop.addEventListener("click", close);
  els.addStudentButton.addEventListener("click", openStudentModal);
  els.closeStudentModal.addEventListener("click", closeStudentModal);
  els.studentModalBackdrop.addEventListener("click", closeStudentModal);
  els.studentSearch.addEventListener("input", renderStudentOptions);
  if (els.studentOptions.dataset.listenerBound !== "true") {
    els.studentOptions.addEventListener("click", handleAddStudentClick);
    els.studentOptions.dataset.listenerBound = "true";
  }
  els.enrollmentTable.addEventListener("click", function (event) {
    const button = event.target.closest("[data-enrollment]");
    if (button) removeStudent(button.getAttribute("data-enrollment"), button);
  });
  els.menuToggle.addEventListener("click", function () {
    const openMenu = els.sidebar.classList.toggle("is-open");
    els.menuToggle.setAttribute("aria-expanded", String(openMenu));
  });
  document.querySelectorAll("[data-coming-soon]").forEach(function (button) {
    button.addEventListener("click", function () { msg("此功能將於下一階段建立。"); });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (!els.studentModal.hidden) closeStudentModal();
      else if (!els.drawer.hidden) close();
    }
  });
})();
