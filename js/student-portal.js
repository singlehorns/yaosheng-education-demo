(function () {
  "use strict";
  const Auth = window.YaoshengAuth;
  const user = Auth.requireRoles(["student"]);
  if (!user) return;
  Auth.mountUserArea("student");
  Auth.trackAuthEvent("student_portal_viewed", { user_id: user.id, student_id: user.linked_student_id });

  const A = window.AcademicDemo;
  const root = document.getElementById("portalContent");
  const student = A.getStudentById(user.linked_student_id);

  function html(value) { return Auth.escapeHtml(value); }
  function mask(value) {
    const text = String(value || "");
    if (!text) return "未提供";
    if (text.indexOf("@") >= 0) return text.replace(/^(.{2}).*(@.*)$/, "$1***$2");
    return text.length > 4 ? text.slice(0, 3) + "****" + text.slice(-2) : "****";
  }
  function date(value) { return value ? new Intl.DateTimeFormat("zh-TW").format(new Date(value)) : "未設定"; }

  if (!student) {
    root.innerHTML = '<section class="portal-card"><h2>尚未連結學生資料</h2><p>請使用管理員帳號到帳號權限頁刷新或重新設定 Demo 學生帳號。</p></section>';
    return;
  }

  const enrollments = A.getEnrollmentsByStudentId(student.id).filter(function (item) { return item.enrollment_status === "active"; });
  root.innerHTML = '<section class="portal-card student-welcome"><div><span class="eyebrow">WELCOME BACK</span><h2>' + html(student.student_name) + '，今天也一起練習珠心算</h2><p>' + html(student.grade || "年級未填") + "｜" + html(student.school || "學校未填") + '</p><p>電話：' + html(mask(student.phone)) + '｜Email：' + html(mask(student.email)) + '</p></div></section>' +
    '<section class="portal-card portal-kpi-grid"><div><strong>' + enrollments.length + '</strong><span>目前班級</span></div><div><strong>初階</strong><span>學習階段</span></div><div><strong>Demo</strong><span>學習平台</span></div></section>' +
    '<section class="portal-card"><h2>我的課程 / 我的班級</h2><div class="portal-list">' +
    (enrollments.length ? enrollments.map(function (enrollment) {
      const klass = A.getClassById(enrollment.class_id) || {};
      const course = A.getCourseById(klass.course_id) || {};
      const teacher = A.getTeacherById(klass.teacher_id) || {};
      return '<article class="portal-row"><strong>' + html(klass.class_name || "未命名班級") + '</strong><span>' + html(course.course_name || "未指定課程") + "｜" + html(teacher.teacher_name || "未指定老師") + "｜" + date(klass.start_date) + " - " + date(klass.end_date) + "</span></article>";
    }).join("") : '<div class="portal-row">目前尚未安排班級，請等待中心老師通知。</div>') +
    "</div></section>" +
    '<section class="portal-card"><h2>學習概況</h2><div class="portal-list"><div class="portal-row"><strong>本月摘要</strong><span>已安排課程後，可在這裡延伸顯示出席、練習與課堂回饋。</span></div><div class="portal-row"><strong>學習里程碑</strong><span>認珠、撥珠、心算與應用四階段可作為後續正式平台的進度模組。</span></div></div></section>' +
    '<section class="portal-card"><h2>公告</h2><div class="portal-row"><strong>Demo 提醒</strong><span>此頁僅顯示自己的資料，其他學生資料不會出現在學生入口。</span></div></section>';

  document.getElementById("menuToggle").addEventListener("click", function () {
    const sidebar = document.getElementById("sidebar");
    const open = sidebar.classList.toggle("is-open");
    this.setAttribute("aria-expanded", String(open));
  });
})();
