(function () {
  "use strict";

  const LEADS_STORAGE_KEY = "yaosheng_demo_leads_v1";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function trackEvent(eventName, eventData) {
    console.log("[Demo Tracking]", eventName, eventData || {});
  }
  window.trackEvent = trackEvent;

  function smoothGo(target) {
    var element = document.querySelector(target);
    if (!element) return;
    element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  var header = document.getElementById("siteHeader");
  var menuToggle = document.getElementById("menuToggle");
  var navMenu = document.getElementById("navMenu");
  var backTop = document.getElementById("backTop");
  var year = document.getElementById("year");
  var form = document.getElementById("leadForm") || document.getElementById("aileadLeadForm");
  var note = document.getElementById("note") || document.getElementById("aileadNote");
  var noteCount = document.getElementById("noteCount") || document.getElementById("aileadNoteCount");
  var submitButton = document.getElementById("leadSubmitButton") || (form ? form.querySelector(".form-submit") : null);
  var formError = document.getElementById("formError") || document.getElementById("aileadFormError");
  var successCard = document.getElementById("successCard");
  var demoSummary = document.getElementById("demoSummary");

  if (year) year.textContent = new Date().getFullYear();

  window.addEventListener("scroll", function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
    if (backTop) backTop.classList.toggle("show", window.scrollY > 520);
  }, { passive: true });

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = link.getAttribute("href");
      if (target && target.length > 1) {
        event.preventDefault();
        smoothGo(target);
        if (navMenu) navMenu.classList.remove("open");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.querySelectorAll("[data-track]").forEach(function (element) {
    element.addEventListener("click", function () {
      var type = element.getAttribute("data-track");
      if (type === "phone") trackEvent("click_phone", { source: "mobile_cta" });
      if (type === "line") trackEvent("click_line", { source: "mobile_cta" });
      if (type === "hero_primary" || type === "nav_cta" || type === "mobile_booking") {
        trackEvent("click_main_cta", { source: type });
      }
    });
  });

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  var floatingBackTop = document.querySelector(".back-top");
  if (floatingBackTop && floatingBackTop !== backTop) {
    floatingBackTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  if ("IntersectionObserver" in window && !reducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  function getUtmParameters() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "direct",
      utm_medium: params.get("utm_medium") || "direct",
      utm_campaign: params.get("utm_campaign") || "direct",
      utm_content: params.get("utm_content") || "direct"
    };
  }

  function generateLeadId() {
    var now = new Date();
    var y = String(now.getFullYear());
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var suffix = "";
    for (var i = 0; i < 4; i += 1) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return "LEAD-" + y + m + d + "-" + suffix;
  }

  function getField(formElement, name) {
    return formElement.querySelector('[name="' + name + '"]');
  }

  function getValue(formElement, name) {
    var field = getField(formElement, name);
    return field ? String(field.value || "").trim() : "";
  }

  function validateLeadForm(formElement) {
    var errors = {};
    var contactName = getValue(formElement, "contact_name");
    var phone = getValue(formElement, "phone");
    var email = getValue(formElement, "email");
    var noteValue = getValue(formElement, "note");
    var formData = new FormData(formElement);
    var subjects = formData.getAll("subjects");
    var phonePattern = /^(09\d{2}[-\s]?\d{3}[-\s]?\d{3}|0\d{1,2}[-\s]?\d{6,8}(#\d{1,6})?)$/;

    if (!contactName) errors.contact_name = "請填寫家長或學生姓名。";
    else if (contactName.length < 2) errors.contact_name = "姓名至少需要 2 個字元。";
    if (!phone) errors.phone = "請填寫聯絡電話。";
    else if (!phonePattern.test(phone)) errors.phone = "請填寫有效的台灣手機或市話格式。";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "電子郵件格式不正確。";
    if (!getValue(formElement, "contact_role")) errors.contact_role = "請選擇填寫者身分。";
    if (!getValue(formElement, "grade")) errors.grade = "請選擇目前年級。";
    if (!subjects.length) errors.subjects = "請至少選擇一個想培養的能力。";
    if (!getValue(formElement, "program_interest")) errors.program_interest = "請選擇想了解的級段。";
    if (!getValue(formElement, "learning_mode")) errors.learning_mode = "請選擇希望上課方式。";
    if (!getValue(formElement, "contact_time")) errors.contact_time = "請選擇方便聯絡時段。";
    if (!getValue(formElement, "preferred_contact_method")) errors.preferred_contact_method = "請選擇希望聯絡方式。";
    if (noteValue.length > 500) errors.note = "備註最多 500 字。";
    var privacyConsent = getField(formElement, "privacy_consent");
    if (!privacyConsent || !privacyConsent.checked) errors.privacy_consent = "請勾選 Demo 資料暫存同意。";

    return errors;
  }

  function buildLeadPayload(formElement) {
    var formData = new FormData(formElement);
    var utm = getUtmParameters();
    var now = new Date().toISOString();
    var privacyConsent = getField(formElement, "privacy_consent");
    var leadPayload = {
      id: generateLeadId(),
      contact_name: String(formData.get("contact_name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      contact_role: String(formData.get("contact_role") || "").trim(),
      grade: String(formData.get("grade") || "").trim(),
      school: String(formData.get("school") || "").trim(),
      subjects: formData.getAll("subjects"),
      program_interest: String(formData.get("program_interest") || "").trim(),
      learning_mode: String(formData.get("learning_mode") || "").trim(),
      contact_time: String(formData.get("contact_time") || "").trim(),
      preferred_contact_method: String(formData.get("preferred_contact_method") || "").trim(),
      note: String(formData.get("note") || "").trim(),
      privacy_consent: Boolean(privacyConsent && privacyConsent.checked),
      status: "new",
      assigned_to: null,
      source: "website",
      source_page: window.location.pathname,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      created_at: now,
      updated_at: now
    };
    return leadPayload;
  }

  function readDemoLeads() {
    try {
      var parsed = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Demo lead storage was reset because stored data is invalid.", error);
      return [];
    }
  }

  function saveLeadToDemoStorage(leadPayload) {
    var leads = [];

    try {
      var storedValue = localStorage.getItem(LEADS_STORAGE_KEY);

      if (storedValue) {
        var parsedValue = JSON.parse(storedValue);

        if (Array.isArray(parsedValue)) {
          leads = parsedValue;
        } else {
          console.warn("[Lead Demo] Stored leads were not an array.");
        }
      }
    } catch (error) {
      console.warn("[Lead Demo] Failed to parse stored leads.", error);
      leads = [];
    }

    var existingIndex = leads.findIndex(function (lead) {
      return lead.id === leadPayload.id;
    });

    if (existingIndex >= 0) {
      leads[existingIndex] = leadPayload;
    } else {
      leads.unshift(leadPayload);
    }

    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));

    var verification = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || "[]");

    if (!Array.isArray(verification) || !verification.some(function (lead) {
      return lead.id === leadPayload.id;
    })) {
      throw new Error("Lead was not successfully saved to localStorage.");
    }

    return leadPayload;
  }

  async function submitLead(leadPayload) {
    // Future integration point:
    // Replace demo localStorage storage with Supabase or backend API.
    console.log("[Lead Demo] saving lead");
    var savedLead = saveLeadToDemoStorage(leadPayload);
    console.log("[Lead Demo] saved successfully");
    return savedLead;
  }

  function clearFormErrors(formElement) {
    if (!formElement) return;
    formElement.querySelectorAll("[aria-invalid]").forEach(function (field) {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    });
    formElement.querySelectorAll(".field-error").forEach(function (error) {
      error.textContent = "";
    });
    if (formError) formError.textContent = "";
  }

  function showFormErrors(errors) {
    clearFormErrors(form);
    var keys = Object.keys(errors);
    keys.forEach(function (key) {
      var errorElement = document.getElementById(key + "_error");
      var field = key === "subjects" ? document.getElementById("subjectsGroup") : getField(form, key);
      if (errorElement) errorElement.textContent = errors[key];
      if (field) {
        field.setAttribute("aria-invalid", "true");
        if (errorElement) field.setAttribute("aria-describedby", errorElement.id);
      }
    });
    if (formError) formError.textContent = "請確認欄位內容後再送出。";
    if (keys.length) {
      var firstKey = keys[0];
      var firstField = firstKey === "subjects" ? form.querySelector('input[name="subjects"]') : getField(form, firstKey);
      if (firstField && typeof firstField.focus === "function") firstField.focus();
    }
  }

  function formatDateTime(isoString) {
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(isoString));
  }

  function maskPhone(phone) {
    return phone.length >= 7 ? phone.slice(0, 4) + "***" + phone.slice(-3) : "***";
  }

  function maskEmail(email) {
    if (!email) return "未填寫";
    var parts = email.split("@");
    if (parts.length !== 2) return "***";
    return parts[0].slice(0, 2) + "***@" + parts[1];
  }

  function showDemoSummary(leadPayload) {
    if (!demoSummary) return;
    demoSummary.hidden = false;
    demoSummary.innerHTML = "" +
      "<h3>預約資料摘要</h3>" +
      "<div class=\"summary-list\">" +
      "<div><strong>預約編號</strong><span>" + leadPayload.id + "</span></div>" +
      "<div><strong>姓名</strong><span>" + leadPayload.contact_name + "</span></div>" +
      "<div><strong>年級</strong><span>" + leadPayload.grade + "</span></div>" +
      "<div><strong>想了解</strong><span>" + leadPayload.program_interest + "</span></div>" +
      "<div><strong>狀態</strong><span>已收到預約</span></div>" +
      "<div><strong>送出時間</strong><span>" + formatDateTime(leadPayload.created_at) + "</span></div>" +
      "<div><strong>電話</strong><span>" + maskPhone(leadPayload.phone) + "</span></div>" +
      "<div><strong>Email</strong><span>" + maskEmail(leadPayload.email) + "</span></div>" +
      "</div>";
  }

  function showSubmitSuccess(leadPayload) {
    if (!successCard) return;
    successCard.hidden = false;
    successCard.innerHTML = "" +
      "<h3>預約資料已送出</h3>" +
      "<p>預約編號：<strong>" + leadPayload.id + "</strong></p>" +
      "<p>我們已收到您的資料，將由專人與您聯繫，協助安排珠心算體驗與級段建議。</p>" +
      "<p>送出時間：" + formatDateTime(leadPayload.created_at) + "</p>" +
      "<div class=\"success-actions\">" +
      "<button class=\"btn btn-secondary\" type=\"button\" id=\"createAnotherLead\">再送出一筆預約</button>" +
      "<button class=\"btn btn-primary\" type=\"button\" id=\"viewDemoLead\">查看預約摘要</button>" +
      "<a class=\"btn btn-primary\" href=\"leads.html\">查看預約管理</a>" +
      "</div>";
    var createAnotherButton = document.getElementById("createAnotherLead");
    var viewButton = document.getElementById("viewDemoLead");
    if (createAnotherButton) createAnotherButton.addEventListener("click", function () {
      if (successCard) {
        successCard.hidden = true;
        successCard.innerHTML = "";
      }
      if (demoSummary) {
        demoSummary.hidden = true;
        demoSummary.innerHTML = "";
      }
      resetLeadForm(form);
    });
    if (viewButton) viewButton.addEventListener("click", function () { showDemoSummary(leadPayload); });
  }

  function resetLeadForm(formElement) {
    if (!formElement) return;
    formElement.reset();
    clearFormErrors(formElement);
    if (noteCount) noteCount.textContent = "0 / 500";
    var firstField = getField(formElement, "contact_name");
    if (firstField) firstField.focus();
  }

  function showSubmitError(message) {
    if (formError) formError.textContent = message;
  }

  function setSubmitState(state) {
    if (!submitButton || !form) return;
    var isSubmitting = state === "submitting";
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? "資料處理中…" : "送出預約資料";
    form.classList.toggle("is-submitting", isSubmitting);
  }

  var formStarted = false;
  if (form) {
    form.addEventListener("input", function () {
      if (!formStarted) {
        formStarted = true;
        trackEvent("lead_form_started", { form: "lead_consultation" });
      }
    });

    form.addEventListener("change", function () {
      if (!formStarted) {
        formStarted = true;
        trackEvent("lead_form_started", { form: "lead_consultation" });
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      console.log("[Lead Demo] submit started");
      clearFormErrors(form);
      if (demoSummary) demoSummary.hidden = true;
      trackEvent("lead_form_submitted", { form: "lead_consultation" });

      var errors = validateLeadForm(form);
      if (Object.keys(errors).length) {
        trackEvent("lead_form_validation_failed", { fields: Object.keys(errors) });
        showFormErrors(errors);
        return;
      }

      try {
        setSubmitState("submitting");
        var leadPayload = buildLeadPayload(form);
        console.log("[Lead Demo] payload", leadPayload);
        await submitLead(leadPayload);
        showSubmitSuccess(leadPayload);
        resetLeadForm(form);
        trackEvent("lead_form_submit_success", { lead_id: leadPayload.id });
      } catch (error) {
        console.error("[Lead Demo] Submit failed.", error);
        trackEvent("lead_form_submit_error", { message: error && error.message ? error.message : "unknown" });
        showSubmitError("資料暫時無法儲存，請稍後再試。");
      } finally {
        setSubmitState("idle");
      }
    });
  }

  if (note && noteCount) {
    note.addEventListener("input", function () {
      if (note.value.length > 500) note.value = note.value.slice(0, 500);
      noteCount.textContent = note.value.length + " / 500";
    });
  }

  document.querySelectorAll("[data-aos-delay]").forEach(function (element) {
    element.style.setProperty("--aos-delay", element.getAttribute("data-aos-delay") + "ms");
  });

  function revealAosElements() {
    document.querySelectorAll("[data-aos]").forEach(function (element) {
      var rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        element.classList.add("aos-animate");
      }
    });
  }

  if (reducedMotion) {
    document.querySelectorAll("[data-aos]").forEach(function (element) {
      element.classList.add("aos-animate");
    });
  } else if ("IntersectionObserver" in window) {
    var aosObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("aos-animate");
          aosObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll("[data-aos]").forEach(function (element) {
      aosObserver.observe(element);
    });

    window.requestAnimationFrame(revealAosElements);
    window.addEventListener("scroll", revealAosElements, { passive: true });
  } else {
    document.querySelectorAll("[data-aos]").forEach(function (element) {
      element.classList.add("aos-animate");
    });
  }

  var featureSection = document.querySelector(".feature-section");
  var featurePopPlayed = false;

  function restartFeatureImagePop() {
    if (!featureSection || reducedMotion) return;
    featureSection.classList.remove("image-pop-in");
    void featureSection.offsetWidth;
    featureSection.classList.add("image-pop-in");
  }

  function updateFeatureImagePop() {
    if (!featureSection || reducedMotion) return;

    var rect = featureSection.getBoundingClientRect();
    var hasReachedTrigger = rect.top < window.innerHeight * 0.72 && rect.bottom > window.innerHeight * 0.2;
    var hasScrolledBackAbove = rect.top > window.innerHeight * 0.88;

    if (hasScrolledBackAbove) {
      featurePopPlayed = false;
      featureSection.classList.remove("image-pop-in");
      return;
    }

    if (hasReachedTrigger && !featurePopPlayed) {
      featurePopPlayed = true;
      restartFeatureImagePop();
    }
  }

  if (featureSection && !reducedMotion) {
    featureSection.classList.add("image-pop-ready");
    window.addEventListener("scroll", updateFeatureImagePop, { passive: true });
    window.addEventListener("resize", updateFeatureImagePop);
    window.requestAnimationFrame(updateFeatureImagePop);
  } else if (featureSection) {
    featureSection.classList.add("image-pop-in");
  }

  var buyButton = document.querySelector(".buy-btn");
  var buyButtonPlayed = false;

  function restartBuyButtonSlide() {
    if (!buyButton || reducedMotion) return;
    buyButton.classList.remove("slide-in");
    void buyButton.offsetWidth;
    buyButton.classList.add("slide-in");
  }

  function updateBuyButtonSlide() {
    if (!buyButton || reducedMotion) return;

    var rect = buyButton.getBoundingClientRect();
    var hasReachedTrigger = rect.top < window.innerHeight * 0.84 && rect.bottom > 0;
    var hasScrolledBackAbove = rect.top > window.innerHeight * 0.94;

    if (hasScrolledBackAbove) {
      buyButtonPlayed = false;
      buyButton.classList.remove("slide-in");
      return;
    }

    if (hasReachedTrigger && !buyButtonPlayed) {
      buyButtonPlayed = true;
      restartBuyButtonSlide();
    }
  }

  if (buyButton && !reducedMotion) {
    buyButton.classList.add("slide-ready");
    window.addEventListener("scroll", updateBuyButtonSlide, { passive: true });
    window.addEventListener("resize", updateBuyButtonSlide);
    window.requestAnimationFrame(updateBuyButtonSlide);
  } else if (buyButton) {
    buyButton.classList.add("slide-in");
  }

  var productItems = document.querySelector(".product-items");
  var productItemsPlayed = false;

  function restartProductItemsReveal() {
    if (!productItems || reducedMotion) return;
    productItems.classList.remove("reveal-in");
    void productItems.offsetWidth;
    productItems.classList.add("reveal-in");
  }

  function updateProductItemsReveal() {
    if (!productItems || reducedMotion) return;

    var rect = productItems.getBoundingClientRect();
    var hasReachedTrigger = rect.top < window.innerHeight * 0.82 && rect.bottom > 0;
    var hasScrolledBackAbove = rect.top > window.innerHeight * 0.94;

    if (hasScrolledBackAbove) {
      productItemsPlayed = false;
      productItems.classList.remove("reveal-in");
      return;
    }

    if (hasReachedTrigger && !productItemsPlayed) {
      productItemsPlayed = true;
      restartProductItemsReveal();
    }
  }

  if (productItems && !reducedMotion) {
    Array.prototype.slice.call(productItems.querySelectorAll("p")).forEach(function (item, index) {
      item.style.setProperty("--product-delay", (index * 120) + "ms");
    });
    productItems.classList.add("reveal-ready");
    window.addEventListener("scroll", updateProductItemsReveal, { passive: true });
    window.addEventListener("resize", updateProductItemsReveal);
    window.requestAnimationFrame(updateProductItemsReveal);
  } else if (productItems) {
    productItems.classList.add("reveal-in");
  }

  var subjectCarousel = document.querySelector(".subject-carousel");
  if (subjectCarousel) {
    var subjectSlides = Array.prototype.slice.call(subjectCarousel.querySelectorAll(".subject-slide"));
    var dotsWrap = subjectCarousel.querySelector(".carousel-dots");
    var subjectPrevButton = subjectCarousel.querySelector(".prev");
    var subjectNextButton = subjectCarousel.querySelector(".next");
    var featureLabel = document.querySelector(".feature-label");
    var featureTitle = document.querySelector(".feature-heading h2");
    var currentSubjectSlide = 0;

    subjectSlides.forEach(function (_, index) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.textContent = String(index + 1);
      dot.setAttribute("aria-label", "切換第 " + (index + 1) + " 張級段特色");
      if (index === 0) dot.classList.add("is-active");
      dot.addEventListener("click", function () {
        showSubjectSlide(index);
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
    });

    function showSubjectSlide(index) {
      currentSubjectSlide = (index + subjectSlides.length) % subjectSlides.length;

      subjectSlides.forEach(function (slide, slideIndex) {
        var active = slideIndex === currentSubjectSlide;
        slide.hidden = !active;
        slide.classList.toggle("is-active", active);
      });

      if (dotsWrap) {
        dotsWrap.querySelectorAll("button").forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === currentSubjectSlide);
        });
      }

      updateFeatureHeading(subjectSlides[currentSubjectSlide]);
      if (featureSection && featureSection.classList.contains("image-pop-in")) {
        restartFeatureImagePop();
      }
    }

    function updateFeatureHeading(slide) {
      if (!slide || !featureLabel || !featureTitle) return;
      var title = slide.getAttribute("data-title") || "";
      var tag = slide.getAttribute("data-tag") || "";
      var copy = (slide.getAttribute("data-copy") || "").split("|");

      featureLabel.innerHTML = "<b>" + title + "</b><span>&#8250;</span><em>" + tag + "</em>";
      featureTitle.innerHTML = copy.map(function (line) {
        return line.trim();
      }).filter(Boolean).join("<br>");
    }

    if (subjectPrevButton) {
      subjectPrevButton.addEventListener("click", function () {
        showSubjectSlide(currentSubjectSlide - 1);
      });
    }

    if (subjectNextButton) {
      subjectNextButton.addEventListener("click", function () {
        showSubjectSlide(currentSubjectSlide + 1);
      });
    }

    subjectCarousel.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSubjectSlide(currentSubjectSlide - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showSubjectSlide(currentSubjectSlide + 1);
      }
    });
  }

  var videoPanel = document.querySelector(".youtube-panel");
  var videoButtons = Array.prototype.slice.call(document.querySelectorAll(".subject-tables button[data-video]"));
  if (videoPanel && videoButtons.length) {
    var videoImage = videoPanel.querySelector("img");

    function setTrialVideo(button) {
      var videoId = button.getAttribute("data-video");
      var title = button.getAttribute("data-title") || button.textContent.trim();
      if (!videoId) return;

      videoPanel.href = "https://www.youtube.com/watch?v=" + videoId;
      videoPanel.setAttribute("aria-label", "前往 YouTube 觀看" + title + "課程試聽影片");
      if (videoImage) {
        videoImage.src = "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg";
        videoImage.alt = title + "課程試聽 YouTube 影片預覽";
      }

      videoButtons.forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
    }

    videoButtons.forEach(function (button, index) {
      if (index === 0) button.classList.add("is-active");
      button.addEventListener("click", function () {
        setTrialVideo(button);
      });
    });
  }

  var carousel = document.querySelector(".system-carousel");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-dots button"));
    var prevButton = carousel.querySelector(".carousel-prev");
    var nextButton = carousel.querySelector(".carousel-next");
    var carouselIndex = 0;

    function showCarouselSlide(index) {
      if (!slides.length) return;
      carouselIndex = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === carouselIndex;
        if (active) {
          slide.hidden = false;
          slide.classList.remove("is-active");
          void slide.offsetWidth;
          slide.classList.add("is-active");
        } else {
          slide.classList.remove("is-active");
          slide.hidden = true;
        }
      });

      dots.forEach(function (dot, dotIndex) {
        var active = dotIndex === carouselIndex;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
      });

      trackEvent("aiot_system_slide_changed", { index: carouselIndex });
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        showCarouselSlide(carouselIndex - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        showCarouselSlide(carouselIndex + 1);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        showCarouselSlide(dotIndex);
      });
    });

    carousel.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showCarouselSlide(carouselIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showCarouselSlide(carouselIndex + 1);
      }
    });
  }
})();
