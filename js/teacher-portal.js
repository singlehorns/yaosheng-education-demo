(function () {
  "use strict";
  const Auth = window.YaoshengAuth;
  const user = Auth.requireRoles(["teacher"]);
  if (!user) return;
  Auth.mountUserArea("teacher");
  Auth.trackAuthEvent("teacher_portal_viewed", { user_id: user.id, teacher_id: user.linked_teacher_id });

  const A = window.AcademicDemo;
  const root = document.getElementById("portalContent");
  const teacher = A.getTeacherById(user.linked_teacher_id);

  function html(value) { return Auth.escapeHtml(value); }
  function date(value) { return value ? new Intl.DateTimeFormat("zh-TW").format(new Date(value)) : "未設定"; }
  function studentRows(classId) {
    const enrollments = A.getEnrollmentsByClassId(classId).filter(function (item) { return item.enrollment_status === "active"; });
    if (!enrollments.length) return '<div class="portal-row">目前沒有學生加入此班級。</div>';
    return enrollments.map(function (enrollment) {
      const student = A.getStudentById(enrollment.student_id) || {};
      return '<div class="portal-row"><strong>' + html(student.student_name || student.id || "未命名學生") + '</strong><span>' + html(student.grade || "年級未填") + "｜" + html(student.school || "學校未填") + "</span></div>";
    }).join("");
  }

  if (!teacher) {
    root.innerHTML = '<section class="portal-card"><h2>尚未連結老師資料</h2><p>請使用管理員帳號到帳號權限頁刷新或重新設定 Demo 老師帳號。</p></section>';
    return;
  }

  const classes = A.loadClasses().filter(function (item) {
    return item.teacher_id === teacher.id && item.class_status !== "cancelled";
  });

  root.innerHTML = '<section class="portal-card"><h2>' + html(teacher.teacher_name) + '</h2><p>' + html(teacher.email || "Email 未填") + "｜" + html(teacher.phone || "電話未填") + '</p></section>' +
    '<section class="portal-card portal-kpi-grid"><div><strong>' + classes.length + '</strong><span>負責班級</span></div><div><strong>' + classes.reduce(function (sum, item) { return sum + A.getEnrollmentsByClassId(item.id).filter(function (enrollment) { return enrollment.enrollment_status === "active"; }).length; }, 0) + '</strong><span>在班學生</span></div><div><strong>Demo</strong><span>教學工作台</span></div></section>' +
    '<section class="portal-card"><h2>今日課程／近期課程</h2><div class="portal-list">' +
    (classes.length ? classes.slice(0, 3).map(function (item) { return '<div class="portal-row"><strong>' + html(item.class_name) + '</strong><span>' + html((item.schedule_days || []).join(", ") || "未設定星期") + "｜" + html(item.start_time || "未設定") + " - " + html(item.end_time || "未設定") + '</span></div>'; }).join("") : '<div class="portal-row">目前沒有近期課程。</div>') +
    '</div></section>' +
    '<section class="portal-card"><h2>我的班級學生</h2><div class="portal-list">' +
    (classes.length ? classes.map(function (item) {
      const course = A.getCourseById(item.course_id) || {};
      return '<article class="portal-row"><strong>' + html(item.class_name) + '</strong><span>' + html(course.course_name || "未指定課程") + "｜" + date(item.start_date) + " - " + date(item.end_date) + '</span><div class="portal-list">' + studentRows(item.id) + '</div></article>';
    }).join("") : '<div class="portal-row">目前沒有指派給您的班級。</div>') +
    "</div></section>" +
    '<section class="portal-card"><h2>可延伸功能</h2><div class="portal-list"><div class="portal-row"><strong>出缺勤、作業與課堂紀錄</strong><span>目前為求職 Demo，後續可接正式資料庫與老師課堂紀錄流程。</span></div></div></section>';

  document.getElementById("menuToggle").addEventListener("click", function () {
    const sidebar = document.getElementById("sidebar");
    const open = sidebar.classList.toggle("is-open");
    this.setAttribute("aria-expanded", String(open));
  });
})();
