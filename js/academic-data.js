(function () {
  "use strict";

  const TEACHERS_STORAGE_KEY = "yaosheng_demo_teachers_v1";
  const COURSES_STORAGE_KEY = "yaosheng_demo_courses_v1";
  const CLASSES_STORAGE_KEY = "yaosheng_demo_classes_v1";
  const ENROLLMENTS_STORAGE_KEY = "yaosheng_demo_class_enrollments_v1";
  const STUDENTS_STORAGE_KEY = "yaosheng_demo_students_v1";

  const LABELS = {
    specialties: {
      abacus_basic: "珠算基礎",
      mental_math: "心算訓練",
      focus_training: "專注力訓練",
      certification: "檢定輔導",
      competition: "競賽培訓",
      preschool: "幼兒啟蒙"
    },
    employment_status: { active: "在職", inactive: "停用", leave: "暫停授課" },
    category: {
      abacus: "珠算",
      mental_math: "心算",
      comprehensive: "珠心算綜合",
      certification: "檢定班",
      competition: "競賽班",
      preschool: "幼兒啟蒙"
    },
    level: {
      beginner: "初階",
      elementary: "基礎",
      intermediate: "進階",
      advanced: "高階",
      mixed: "混齡／依程度分班"
    },
    course_status: { draft: "草稿", active: "招生中", paused: "暫停招生", archived: "已封存" },
    learning_mode: { onsite: "實體", online: "線上", hybrid: "實體／線上混合" },
    schedule_days: { mon: "星期一", tue: "星期二", wed: "星期三", thu: "星期四", fri: "星期五", sat: "星期六", sun: "星期日" },
    class_status: { planned: "籌備中", open: "招生中", in_progress: "上課中", completed: "已結束", cancelled: "已取消" },
    enrollment_status: { active: "在班", paused: "暫停", completed: "完成課程", withdrawn: "已退班" },
    student_status: { active: "在學", paused: "暫停", graduated: "結業", withdrawn: "退班" }
  };

  function loadArray(key, label) {
    try {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) return [];
      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        console.warn("[Academic Demo] Stored " + label + " were not an array.");
        return [];
      }
      return parsedValue;
    } catch (error) {
      console.warn("[Academic Demo] Failed to parse " + label + ".", error);
      return [];
    }
  }

  function saveArray(key, values) {
    localStorage.setItem(key, JSON.stringify(values));
  }

  function stamp() {
    return new Date().toISOString();
  }

  function idDate() {
    const now = new Date();
    return String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  }

  function generateId(prefix, records) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const existing = new Set(records.map(function (item) { return item.id; }));
    let id = "";
    do {
      let suffix = "";
      for (let index = 0; index < 4; index += 1) suffix += chars[Math.floor(Math.random() * chars.length)];
      id = prefix + "-" + idDate() + "-" + suffix;
    } while (existing.has(id));
    return id;
  }

  function byId(records, id) {
    return records.find(function (item) { return item.id === id; }) || null;
  }

  function updateById(records, id, updates) {
    let updated = null;
    const next = records.map(function (item) {
      if (item.id !== id) return item;
      updated = Object.assign({}, item, updates, { updated_at: stamp() });
      return updated;
    });
    return { next, updated };
  }

  function activeEnrollmentCount(classId) {
    return loadEnrollments().filter(function (item) {
      return item.class_id === classId && item.enrollment_status === "active";
    }).length;
  }

  function hasActiveEnrollment(enrollments, classId, studentId) {
    return enrollments.some(function (item) {
      return item.class_id === classId && item.student_id === studentId && item.enrollment_status === "active";
    });
  }

  function getActiveEnrollment(classId, studentId) {
    return loadEnrollments().find(function (item) {
      return item.class_id === classId && item.student_id === studentId && item.enrollment_status === "active";
    }) || null;
  }

  function loadTeachers() { return loadArray(TEACHERS_STORAGE_KEY, "teachers"); }
  function saveTeachers(teachers) { saveArray(TEACHERS_STORAGE_KEY, teachers); }
  function getTeacherById(id) { return byId(loadTeachers(), id); }
  function generateTeacherId() { return generateId("TCH", loadTeachers()); }
  function createTeacher(payload) {
    const now = stamp();
    const teacher = Object.assign({ id: generateTeacherId(), employment_status: "active", specialties: [], created_at: now, updated_at: now }, payload);
    saveTeachers([teacher].concat(loadTeachers()));
    return teacher;
  }
  function updateTeacherById(id, updates) {
    const result = updateById(loadTeachers(), id, updates);
    if (result.updated) saveTeachers(result.next);
    return result.updated;
  }
  function deleteTeacherById(id) {
    if (loadClasses().some(function (item) { return item.teacher_id === id && item.class_status !== "cancelled"; })) return false;
    saveTeachers(loadTeachers().filter(function (item) { return item.id !== id; }));
    return true;
  }

  function loadCourses() { return loadArray(COURSES_STORAGE_KEY, "courses"); }
  function saveCourses(courses) { saveArray(COURSES_STORAGE_KEY, courses); }
  function getCourseById(id) { return byId(loadCourses(), id); }
  function generateCourseId() { return generateId("CRS", loadCourses()); }
  function createCourse(payload) {
    const now = stamp();
    const course = Object.assign({ id: generateCourseId(), suitable_grades: [], lesson_duration_minutes: 90, default_capacity: 12, course_status: "active", created_at: now, updated_at: now }, payload);
    saveCourses([course].concat(loadCourses()));
    return course;
  }
  function updateCourseById(id, updates) {
    const result = updateById(loadCourses(), id, updates);
    if (result.updated) saveCourses(result.next);
    return result.updated;
  }
  function deleteCourseById(id) {
    if (loadClasses().some(function (item) { return item.course_id === id; })) return false;
    saveCourses(loadCourses().filter(function (item) { return item.id !== id; }));
    return true;
  }

  function loadClasses() { return loadArray(CLASSES_STORAGE_KEY, "classes"); }
  function saveClasses(classes) { saveArray(CLASSES_STORAGE_KEY, classes); }
  function getClassById(id) { return byId(loadClasses(), id); }
  function generateClassId() { return generateId("CLS", loadClasses()); }
  function createClass(payload) {
    const now = stamp();
    const klass = Object.assign({ id: generateClassId(), branch_name: "Demo 教室", learning_mode: "onsite", schedule_days: [], capacity: 12, class_status: "planned", created_at: now, updated_at: now }, payload);
    saveClasses([klass].concat(loadClasses()));
    return klass;
  }
  function updateClassById(id, updates) {
    const result = updateById(loadClasses(), id, updates);
    if (result.updated) saveClasses(result.next);
    return result.updated;
  }
  function deleteClassById(id) {
    if (activeEnrollmentCount(id) > 0) return false;
    saveClasses(loadClasses().filter(function (item) { return item.id !== id; }));
    return true;
  }

  function loadEnrollments() { return loadArray(ENROLLMENTS_STORAGE_KEY, "enrollments"); }
  function saveEnrollments(enrollments) { saveArray(ENROLLMENTS_STORAGE_KEY, enrollments); }
  function getEnrollmentsByClassId(classId) { return loadEnrollments().filter(function (item) { return item.class_id === classId; }); }
  function getEnrollmentsByStudentId(studentId) { return loadEnrollments().filter(function (item) { return item.student_id === studentId; }); }
  function generateEnrollmentId() { return generateId("ENR", loadEnrollments()); }
  function createEnrollment(payload) {
    const enrollments = loadEnrollments();
    if (getActiveEnrollment(payload.class_id, payload.student_id)) throw new Error("duplicate_active_enrollment");
    const now = stamp();
    const enrollment = Object.assign({ id: generateEnrollmentId(), enrollment_status: "active", joined_at: now, created_at: now, updated_at: now }, payload);
    saveEnrollments([enrollment].concat(enrollments));
    return enrollment;
  }
  function addStudentToClass(classId, studentId) {
    if (!classId) return { success: false, reason: "missing_class_id", enrollment: null, reactivated: false };
    if (!studentId) return { success: false, reason: "missing_student_id", enrollment: null, reactivated: false };
    const classes = loadClasses();
    const students = loadStudents();
    const enrollments = loadEnrollments();
    const classItem = classes.find(function (item) { return item.id === classId; });
    const student = students.find(function (item) { return item.id === studentId; });

    if (!classItem) return { success: false, reason: "class_not_found", enrollment: null, reactivated: false };
    if (!student) return { success: false, reason: "student_not_found", enrollment: null, reactivated: false };
    if (student.student_status !== "active") return { success: false, reason: "student_not_active", enrollment: null, reactivated: false };

    const activeEnrollment = enrollments.find(function (item) {
      return item.class_id === classId && item.student_id === studentId && item.enrollment_status === "active";
    });
    if (activeEnrollment) return { success: false, reason: "already_active", enrollment: activeEnrollment, reactivated: false };

    const activeCount = enrollments.filter(function (item) {
      return item.class_id === classId && item.enrollment_status === "active";
    }).length;
    if (activeCount >= Number(classItem.capacity || 0)) return { success: false, reason: "class_full", enrollment: null, reactivated: false };

    const previousEnrollment = enrollments.find(function (item) {
      return item.class_id === classId && item.student_id === studentId && item.enrollment_status !== "active";
    });
    const now = stamp();
    if (previousEnrollment) {
      previousEnrollment.enrollment_status = "active";
      previousEnrollment.joined_at = now;
      previousEnrollment.rejoined_at = now;
      previousEnrollment.left_at = null;
      previousEnrollment.updated_at = now;
      saveEnrollments(enrollments);
      return { success: true, reason: "reactivated", enrollment: previousEnrollment, reactivated: true };
    }

    const newEnrollment = {
      id: generateEnrollmentId(),
      class_id: classId,
      student_id: studentId,
      enrollment_status: "active",
      joined_at: now,
      rejoined_at: null,
      left_at: null,
      note: "",
      created_at: now,
      updated_at: now
    };
    enrollments.unshift(newEnrollment);
    saveEnrollments(enrollments);
    return { success: true, reason: "created", enrollment: newEnrollment, reactivated: false };
  }
  function updateEnrollmentById(id, updates) {
    const result = updateById(loadEnrollments(), id, updates);
    if (result.updated) saveEnrollments(result.next);
    return result.updated;
  }
  function withdrawEnrollmentById(id) {
    const enrollment = byId(loadEnrollments(), id);
    if (!enrollment || enrollment.enrollment_status !== "active") return null;
    return updateEnrollmentById(id, { enrollment_status: "withdrawn", left_at: stamp() });
  }
  function deleteEnrollmentById(id) {
    saveEnrollments(loadEnrollments().filter(function (item) { return item.id !== id; }));
    return true;
  }

  function loadStudents() { return loadArray(STUDENTS_STORAGE_KEY, "students"); }
  function getStudentById(id) { return byId(loadStudents(), id); }
  function getAvailableStudentsForClass(classId) {
    const students = loadStudents();
    const enrollments = loadEnrollments();
    return students.filter(function (student) {
      return student.student_status === "active" && !hasActiveEnrollment(enrollments, classId, student.id);
    });
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    return (!aStart || !bEnd || aStart <= bEnd) && (!bStart || !aEnd || bStart <= aEnd);
  }

  function timesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function hasTeacherScheduleConflict(classPayload, existingClasses) {
    return existingClasses.some(function (item) {
      if (item.id === classPayload.id) return false;
      if (item.teacher_id !== classPayload.teacher_id) return false;
      if (item.class_status === "completed" || item.class_status === "cancelled") return false;
      const daysOverlap = (item.schedule_days || []).some(function (day) { return (classPayload.schedule_days || []).indexOf(day) >= 0; });
      return daysOverlap &&
        timesOverlap(classPayload.start_time, classPayload.end_time, item.start_time, item.end_time) &&
        rangesOverlap(classPayload.start_date, classPayload.end_date, item.start_date, item.end_date);
    });
  }

  function seedDemoData() {
    const seedKey = "yaosheng_demo_academic_seed_v1";
    if (localStorage.getItem(seedKey)) return false;
    const teacherA = createTeacher({ teacher_name: "陳老師", specialties: ["abacus_basic", "mental_math"], employment_status: "active" });
    const teacherB = createTeacher({ teacher_name: "林老師", specialties: ["certification", "competition"], employment_status: "active" });
    const courseA = createCourse({ course_name: "珠心算初階班", course_code: "ABACUS-BASIC", category: "comprehensive", level: "beginner", lesson_duration_minutes: 90, default_capacity: 12, course_status: "active" });
    createCourse({ course_name: "珠心算檢定培訓班", course_code: "ABACUS-TEST", category: "certification", level: "intermediate", lesson_duration_minutes: 120, default_capacity: 10, course_status: "active" });
    createClass({ class_name: "初階班－週六上午 A 班", course_id: courseA.id, teacher_id: teacherA.id, branch_name: "Demo 教室", learning_mode: "onsite", schedule_days: ["sat"], start_time: "09:00", end_time: "10:30", start_date: idDate().slice(0, 4) + "-" + idDate().slice(4, 6) + "-" + idDate().slice(6), capacity: 12, class_status: "open" });
    void teacherB;
    localStorage.setItem(seedKey, "1");
    return true;
  }

  window.AcademicDemo = {
    keys: { TEACHERS_STORAGE_KEY, COURSES_STORAGE_KEY, CLASSES_STORAGE_KEY, ENROLLMENTS_STORAGE_KEY, STUDENTS_STORAGE_KEY },
    labels: LABELS,
    stamp,
    loadTeachers, saveTeachers, getTeacherById, createTeacher, updateTeacherById, deleteTeacherById, generateTeacherId,
    loadCourses, saveCourses, getCourseById, createCourse, updateCourseById, deleteCourseById, generateCourseId,
    loadClasses, saveClasses, getClassById, createClass, updateClassById, deleteClassById, generateClassId,
    loadEnrollments, saveEnrollments, getEnrollmentsByClassId, getEnrollmentsByStudentId, hasActiveEnrollment, getActiveEnrollment, createEnrollment, addStudentToClass, updateEnrollmentById, withdrawEnrollmentById, deleteEnrollmentById, generateEnrollmentId,
    loadStudents, getStudentById, getAvailableStudentsForClass, activeEnrollmentCount, hasTeacherScheduleConflict, seedDemoData
  };
})();
