(function () {
  "use strict";

  const PROJECT_KEYS = [
    "yaosheng_demo_leads_v1",
    "yaosheng_demo_students_v1",
    "yaosheng_demo_teachers_v1",
    "yaosheng_demo_courses_v1",
    "yaosheng_demo_classes_v1",
    "yaosheng_demo_class_enrollments_v1",
    "yaosheng_demo_users_v1",
    "yaosheng_demo_session_v1",
    "yaosheng_demo_academic_seed_v1",
    "yaosheng_demo_reopen_class_id",
    "yaosheng_demo_reopen_class_message"
  ];
  const REQUIRED_KEYS = [
    "yaosheng_demo_users_v1",
    "yaosheng_demo_students_v1",
    "yaosheng_demo_teachers_v1",
    "yaosheng_demo_courses_v1",
    "yaosheng_demo_classes_v1",
    "yaosheng_demo_class_enrollments_v1"
  ];
  const ROLE_LOGIN = {
    admin: ["admin@demo.local", "1111", "dashboard.html"],
    admissions: ["admissions@demo.local", "2222", "dashboard.html"],
    teacher: ["teacher@demo.local", "3333", "teacher-portal.html"],
    student: ["student@demo.local", "4444", "student-portal.html"]
  };

  const els = {
    seedButton: document.getElementById("seedButton"),
    resetButton: document.getElementById("resetButton"),
    status: document.getElementById("demoStatus"),
    roleMessage: document.getElementById("roleMessage"),
    flowDialog: document.getElementById("flowMapDialog")
  };
  const flowSlides = Array.from(document.querySelectorAll("[data-flow-slide]"));
  const flowCounter = document.querySelector("[data-flow-counter]");
  let flowSlideIndex = 0;

  function now() {
    return new Date().toISOString();
  }

  function today() {
    const date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function json(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function makeUser(seed) {
    const stamp = now();
    return Object.assign({
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

  function clearProjectStorage() {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && key.indexOf("yaosheng_demo_") === 0) localStorage.removeItem(key);
    }
    PROJECT_KEYS.forEach(function (key) { localStorage.removeItem(key); });
    sessionStorage.removeItem("yaosheng_demo_session_v1");
  }

  function seedData() {
    const stamp = now();
    const startDate = today();
    const leadNew = {
      id: "DEMO-LEAD-001",
      contact_name: "林家長",
      phone: "0912-345-678",
      email: "lin-parent@example.local",
      contact_role: "家長",
      grade: "國小三年級",
      school: "Demo 國小",
      subjects: ["計算速度", "專注力"],
      program_interest: "珠心算初階班",
      learning_mode: "實體",
      contact_time: "平日晚上",
      preferred_contact_method: "電話",
      note: "希望先了解孩子是否適合珠心算。",
      status: "new",
      assigned_to: null,
      source: "website",
      internal_note: "",
      follow_up_at: null,
      converted_to_student: false,
      student_id: null,
      created_at: stamp,
      updated_at: stamp
    };
    const leadEnrolled = {
      id: "DEMO-LEAD-002",
      contact_name: "王家長",
      phone: "0922-779-100",
      email: "wang-parent@example.local",
      contact_role: "家長",
      grade: "國小五年級",
      school: "幸福國小",
      subjects: ["檢定準備"],
      program_interest: "珠心算初階班",
      learning_mode: "實體",
      contact_time: "週六上午",
      preferred_contact_method: "LINE",
      note: "已完成試聽並確認報名。",
      status: "enrolled",
      assigned_to: "陳招生顧問",
      source: "website",
      internal_note: "已轉為正式學生。",
      follow_up_at: null,
      converted_to_student: true,
      student_id: "DEMO-STU-001",
      converted_at: stamp,
      created_at: stamp,
      updated_at: stamp
    };
    const student = {
      id: "DEMO-STU-001",
      lead_id: "DEMO-LEAD-002",
      student_name: "小娟",
      guardian_name: "王家長",
      phone: "0922-779-100",
      email: "wang-parent@example.local",
      grade: "國小五年級",
      school: "幸福國小",
      learning_needs: ["檢定準備"],
      program_interest: "珠心算初階班",
      learning_mode: "實體",
      student_status: "active",
      enrollment_status: "enrolled",
      assigned_advisor: "陳招生顧問",
      internal_note: "Demo 預設學生。",
      source: "website",
      enrolled_at: stamp,
      created_at: stamp,
      updated_at: stamp
    };
    const teacher = {
      id: "DEMO-TCH-001",
      teacher_name: "陳老師",
      phone: "02-2779-1005",
      email: "teacher@example.local",
      specialties: ["abacus_basic", "mental_math"],
      employment_status: "active",
      introduction: "擅長珠算基礎與心算訓練，適合初階學生建立穩定計算習慣。",
      internal_note: "Demo 預設老師。",
      created_at: stamp,
      updated_at: stamp
    };
    const course = {
      id: "DEMO-CRS-001",
      course_name: "珠心算初階班",
      course_code: "ABACUS-DEMO-001",
      category: "comprehensive",
      level: "beginner",
      suitable_grades: ["國小三年級", "國小四年級", "國小五年級"],
      lesson_duration_minutes: 90,
      default_capacity: 12,
      course_status: "active",
      description: "以認珠、撥珠與心算基礎建立孩子的計算速度、專注力與學習自信。",
      created_at: stamp,
      updated_at: stamp
    };
    const klass = {
      id: "DEMO-CLS-001",
      class_name: "初階班－週六上午 A 班",
      course_id: "DEMO-CRS-001",
      teacher_id: "DEMO-TCH-001",
      branch_name: "Demo 校區",
      learning_mode: "onsite",
      schedule_days: ["sat"],
      start_time: "09:00",
      end_time: "10:30",
      start_date: startDate,
      end_date: "",
      capacity: 12,
      room_name: "A 教室",
      class_status: "in_progress",
      internal_note: "Demo 預設班級，小娟已在班。",
      created_at: stamp,
      updated_at: stamp
    };
    const enrollment = {
      id: "DEMO-ENR-001",
      class_id: "DEMO-CLS-001",
      student_id: "DEMO-STU-001",
      enrollment_status: "active",
      joined_at: stamp,
      rejoined_at: null,
      left_at: null,
      note: "Demo 預設分班。",
      created_at: stamp,
      updated_at: stamp
    };
    const users = [
      makeUser({ id: "DEMO-USR-ADMIN", display_name: "王管理員", email: "admin@demo.local", role: "admin", demo_pin: "1111" }),
      makeUser({ id: "DEMO-USR-ADMISSIONS", display_name: "陳招生顧問", email: "admissions@demo.local", role: "admissions", demo_pin: "2222" }),
      makeUser({ id: "DEMO-USR-TEACHER", display_name: "陳老師", email: "teacher@demo.local", role: "teacher", demo_pin: "3333", linked_teacher_id: "DEMO-TCH-001" }),
      makeUser({ id: "DEMO-USR-STUDENT", display_name: "小娟", email: "student@demo.local", role: "student", demo_pin: "4444", linked_student_id: "DEMO-STU-001" })
    ];

    json("yaosheng_demo_leads_v1", [leadEnrolled, leadNew]);
    json("yaosheng_demo_students_v1", [student]);
    json("yaosheng_demo_teachers_v1", [teacher]);
    json("yaosheng_demo_courses_v1", [course]);
    json("yaosheng_demo_classes_v1", [klass]);
    json("yaosheng_demo_class_enrollments_v1", [enrollment]);
    json("yaosheng_demo_users_v1", users);
    localStorage.setItem("yaosheng_demo_academic_seed_v1", "1");
    sessionStorage.removeItem("yaosheng_demo_session_v1");
    localStorage.removeItem("yaosheng_demo_session_v1");
  }

  function hasReadyData() {
    return REQUIRED_KEYS.every(function (key) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) && value.length > 0;
      } catch (error) {
        return false;
      }
    });
  }

  function updateStatus(message) {
    const ready = hasReadyData();
    els.status.className = "status-box " + (ready ? "is-ready" : "is-missing");
    els.status.textContent = message || (ready
      ? "Demo資料已準備完成，可以選擇角色開始體驗。"
      : "尚未建立Demo資料，請先點擊「一鍵建立完整Demo資料」。");
    document.querySelectorAll("[data-role-login]").forEach(function (button) {
      button.disabled = !ready;
      button.setAttribute("aria-disabled", String(!ready));
    });
  }

  function resetAndSeedDemoData(message) {
    clearProjectStorage();
    seedData();
    updateStatus(message || "Demo資料已準備完成");
  }

  function quickLogin(role) {
    if (!hasReadyData()) {
      els.roleMessage.textContent = "請先點擊「一鍵建立完整Demo資料」。";
      updateStatus();
      return;
    }
    const account = ROLE_LOGIN[role];
    if (!account || !window.YaoshengAuth) return;
    const result = window.YaoshengAuth.login(account[0], account[1]);
    if (!result.success) {
      els.roleMessage.textContent = "快速登入失敗，請先重置 Demo 資料後再試一次。";
      return;
    }
    location.href = account[2];
  }

  function updateFlowSlide(nextIndex) {
    if (!flowSlides.length) return;
    flowSlideIndex = (nextIndex + flowSlides.length) % flowSlides.length;
    flowSlides.forEach(function (slide, index) {
      slide.classList.toggle("is-active", index === flowSlideIndex);
    });
    if (flowCounter) {
      flowCounter.textContent = String(flowSlideIndex + 1) + " / " + String(flowSlides.length);
    }
  }

  els.seedButton.addEventListener("click", function () {
    resetAndSeedDemoData("Demo資料已準備完成");
    els.roleMessage.textContent = "Demo資料已準備完成，請選擇角色開始體驗。";
  });

  els.resetButton.addEventListener("click", function () {
    const confirmed = window.confirm("目前建立及修改過的Demo資料將被清除，並恢復為預設展示狀態。確定繼續嗎？");
    if (!confirmed) return;
    resetAndSeedDemoData("Demo資料已重置");
    els.roleMessage.textContent = "Demo資料已重置，已恢復為預設展示狀態。";
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-flow-open]")) {
      if (els.flowDialog && typeof els.flowDialog.showModal === "function") {
        els.flowDialog.showModal();
      }
      return;
    }
    if (event.target.closest("[data-flow-close]")) {
      if (els.flowDialog) els.flowDialog.close();
      return;
    }
    if (event.target.closest("[data-flow-prev]")) {
      updateFlowSlide(flowSlideIndex - 1);
      return;
    }
    if (event.target.closest("[data-flow-next]")) {
      updateFlowSlide(flowSlideIndex + 1);
      return;
    }
    const button = event.target.closest("[data-role-login]");
    if (!button) return;
    quickLogin(button.dataset.roleLogin);
  });

  if (els.flowDialog) {
    els.flowDialog.addEventListener("click", function (event) {
      if (event.target === els.flowDialog) els.flowDialog.close();
    });
  }

  window.resetAndSeedDemoData = resetAndSeedDemoData;
  updateFlowSlide(0);
  updateStatus();
})();
