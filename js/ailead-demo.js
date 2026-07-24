(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("aos-animate");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll("[data-aos]").forEach(function (element) {
      observer.observe(element);
    });

    window.requestAnimationFrame(revealAosElements);
    window.addEventListener("scroll", revealAosElements, { passive: true });
  } else {
    document.querySelectorAll("[data-aos]").forEach(function (element) {
      element.classList.add("aos-animate");
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = link.getAttribute("href");
      var element = target && document.querySelector(target);
      if (!element) return;
      event.preventDefault();
      element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

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

  var carousel = document.querySelector(".subject-carousel");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".subject-slide"));
    var dotsWrap = carousel.querySelector(".carousel-dots");
    var prevButton = carousel.querySelector(".prev");
    var nextButton = carousel.querySelector(".next");
    var featureLabel = document.querySelector(".feature-label");
    var featureTitle = document.querySelector(".feature-heading h2");
    var current = 0;

    slides.forEach(function (_, index) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.textContent = String(index + 1);
      dot.setAttribute("aria-label", "Show slide " + (index + 1));
      if (index === 0) dot.classList.add("is-active");
      dot.addEventListener("click", function () {
        showSlide(index);
      });
      dotsWrap.appendChild(dot);
    });

    function showSlide(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === current;
        slide.hidden = !active;
        slide.classList.toggle("is-active", active);
      });

      dotsWrap.querySelectorAll("button").forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });

      updateFeatureHeading(slides[current]);
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

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        showSlide(current - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        showSlide(current + 1);
      });
    }

    carousel.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(current - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(current + 1);
      }
    });
  }

  var backTop = document.querySelector(".back-top");
  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
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

  var leadForm = document.querySelector("#aileadLeadForm");
  if (leadForm) {
    var note = leadForm.querySelector("#aileadNote");
    var noteCount = leadForm.querySelector("#aileadNoteCount");
    var formError = leadForm.querySelector("#aileadFormError");

    function updateNoteCount() {
      if (!note || !noteCount) return;
      noteCount.textContent = note.value.length + " / " + note.maxLength;
    }

    if (note) {
      note.addEventListener("input", updateNoteCount);
      updateNoteCount();
    }

    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var invalid = Array.prototype.slice.call(leadForm.querySelectorAll("[required]")).some(function (field) {
        return !field.checkValidity();
      });

      if (invalid) {
        if (formError) formError.textContent = "請先填寫必填欄位，專人才能協助安排珠心算體驗。";
        leadForm.reportValidity();
        return;
      }

      if (formError) formError.textContent = "";
      var button = leadForm.querySelector(".form-submit");
      if (button) button.textContent = "已送出，專人將與您聯繫";
    });
  }
})();
