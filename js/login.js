(function () {
  "use strict";

  const Auth = window.YaoshengAuth;
  const form = document.getElementById("loginForm");
  const email = document.getElementById("email");
  const pin = document.getElementById("demoPin");
  const error = document.getElementById("loginError");
  const accountCards = document.getElementById("accountCards");
  const sessionBox = document.getElementById("sessionBox");
  const sessionText = document.getElementById("sessionText");
  const continueButton = document.getElementById("continueButton");
  const logoutButton = document.getElementById("logoutButton");

  function nextUrl(user) {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    if (next && /^[\w.-]+\.html$/.test(next)) return next;
    return Auth.redirectForRole(user.role);
  }

  function showError(message) {
    error.textContent = message;
  }

  function renderCards() {
    const users = Auth.createDemoAccounts();
    const cards = [
      ["admin@demo.local", "1111", "管理員", "查看完整營運、招生、師資、課程、班級與帳號管理。"],
      ["admissions@demo.local", "2222", "招生人員", "處理招生名單、家長聯繫與轉正式學生。"],
      ["teacher@demo.local", "3333", "老師", "查看自己授課班級與班內學生。"],
      ["student@demo.local", "4444", "學生", "查看自己的資料與已安排班級。"]
    ];
    accountCards.innerHTML = cards.map(function (card) {
      const user = users.find(function (item) { return item.email === card[0]; });
      const disabledReason = card[0] === "teacher@demo.local" ? "請先建立老師資料。" : "請先建立正式學生。";
      const disabled = !user;
      return '<article class="account-card' + (disabled ? " is-disabled" : "") + '">' +
        "<h2>" + card[2] + "</h2>" +
        "<p>" + (disabled ? disabledReason : card[3]) + "</p>" +
        '<button type="button" data-email="' + card[0] + '" data-pin="' + card[1] + '"' + (disabled ? " disabled" : "") + ">使用 Demo 帳號</button>" +
      "</article>";
    }).join("");
  }

  function renderSession() {
    const user = Auth.getCurrentUser();
    sessionBox.classList.toggle("is-visible", !!user);
    if (!user) return;
    sessionText.textContent = "目前登入：" + (user.display_name || user.email) + "（" + Auth.getRoleLabel(user.role) + "）";
    continueButton.onclick = function () { location.href = nextUrl(user); };
    logoutButton.onclick = function () {
      Auth.logout();
      renderSession();
      showError("");
    };
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const result = Auth.login(email.value, pin.value);
    if (!result.success) {
      showError("帳號或 Demo PIN 不正確，請改用頁面上的 Demo 帳號。");
      return;
    }
    location.href = nextUrl(result.user);
  });

  accountCards.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-email]");
    if (!button) return;
    email.value = button.dataset.email;
    pin.value = button.dataset.pin;
    form.requestSubmit();
  });

  renderCards();
  renderSession();
})();
