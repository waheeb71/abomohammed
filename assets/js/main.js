/* ==========================================================================
   تفاعلات الموقع — JavaScript خفيف بدون أي مكتبات خارجية.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var header = doc.querySelector(".site-header");
  var navToggle = doc.querySelector(".nav-toggle");
  var mobileNav = doc.getElementById("mobile-nav");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- الهيدر عند التمرير ---------- */
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    lastY = y;
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- قائمة الجوال ---------- */
  var menuTimer = null;
  function setMenu(open) {
    if (!mobileNav || !navToggle) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    doc.body.classList.toggle("is-locked", open);

    if (open) {
      if (menuTimer) {
        window.clearTimeout(menuTimer);
        menuTimer = null;
      }
      mobileNav.hidden = false;
      // إجبار المتصفح على حساب التخطيط قبل إضافة الصنف حتى تعمل الحركة
      // من دون الاعتماد على requestAnimationFrame (قد يتأخر في بعض الحالات).
      void mobileNav.offsetHeight;
      mobileNav.classList.add("is-open");
      var first = mobileNav.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    } else {
      mobileNav.classList.remove("is-open");
      menuTimer = window.setTimeout(function () {
        mobileNav.hidden = true;
        menuTimer = null;
      }, prefersReduced ? 0 : 380);
    }
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setMenu(false);
      });
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) setMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080 && mobileNav.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ---------- ظهور تدريجي للعناصر ---------- */
  var revealItems = doc.querySelectorAll("[data-reveal]");
  if (revealItems.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealItems.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ---------- السنة في التذييل ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- فلترة المعرض ---------- */
  var gallery = doc.querySelector(".gallery");
  if (gallery) {
    var filterBar = doc.querySelector(".gallery-filters");
    var items = Array.prototype.slice.call(gallery.querySelectorAll(".gallery__item"));

    if (filterBar) {
      filterBar.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-filter]");
        if (!btn) return;
        var filter = btn.getAttribute("data-filter");

        filterBar.querySelectorAll("button[data-filter]").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });

        items.forEach(function (item) {
          var show = filter === "all" || item.getAttribute("data-cat") === filter;
          item.classList.toggle("is-hidden", !show);
        });
      });
    }

    /* ---------- عارض الصور ---------- */
    var lightbox = doc.getElementById("lightbox");
    if (lightbox) {
      var lbImg = lightbox.querySelector("img");
      var lbCaption = lightbox.querySelector("[data-lb-caption]");
      var lbCount = lightbox.querySelector("[data-lb-count]");
      var lbLink = lightbox.querySelector("[data-lb-link]");
      var btnClose = lightbox.querySelector(".lightbox__close");
      var btnPrev = lightbox.querySelector(".lightbox__nav--prev");
      var btnNext = lightbox.querySelector(".lightbox__nav--next");
      var index = 0;
      var visible = [];
      var lastFocus = null;
      var touchX = null;

      function collectVisible() {
        visible = items.filter(function (i) {
          return !i.classList.contains("is-hidden");
        });
      }

      function show(i) {
        if (!visible.length) return;
        index = (i + visible.length) % visible.length;
        var el = visible[index];
        var img = el.querySelector("img");
        lbImg.src = el.getAttribute("data-full");
        lbImg.alt = img ? img.alt : "";
        if (lbCaption) lbCaption.textContent = el.getAttribute("data-caption") || "";
        if (lbCount) lbCount.textContent = index + 1 + " / " + visible.length;
        if (lbLink) {
          lbLink.href = "contact.html";
        }
      }

      function open(el) {
        collectVisible();
        lastFocus = doc.activeElement;
        var i = visible.indexOf(el);
        show(i < 0 ? 0 : i);
        lightbox.classList.add("is-open");
        lightbox.removeAttribute("aria-hidden");
        doc.body.classList.add("is-locked");
        if (btnClose) btnClose.focus({ preventScroll: true });
      }

      function close() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        doc.body.classList.remove("is-locked");
        if (lastFocus) lastFocus.focus({ preventScroll: true });
      }

      items.forEach(function (item) {
        item.addEventListener("click", function () {
          open(item);
        });
      });

      if (btnClose) btnClose.addEventListener("click", close);
      if (btnPrev) btnPrev.addEventListener("click", function () { show(index - 1); });
      if (btnNext) btnNext.addEventListener("click", function () { show(index + 1); });
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox || e.target.classList.contains("lightbox__stage")) close();
      });

      doc.addEventListener("keydown", function (e) {
        if (!lightbox.classList.contains("is-open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") show(index - 1);
        if (e.key === "ArrowLeft") show(index + 1);
        if (e.key === "Tab") {
          e.preventDefault();
          (e.shiftKey ? btnPrev : btnNext).focus();
        }
      });

      lightbox.addEventListener("touchstart", function (e) {
        touchX = e.changedTouches[0].clientX;
      }, { passive: true });

      lightbox.addEventListener("touchend", function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) show(dx > 0 ? index - 1 : index + 1);
        touchX = null;
      }, { passive: true });
    }
  }

  /* ---------- نموذج عرض السعر → واتساب ---------- */
  var form = doc.getElementById("quote-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var name = form.elements.namedItem("name");
      var phone = form.elements.namedItem("phone");
      var service = form.elements.namedItem("service");
      var district = form.elements.namedItem("district");
      var details = form.elements.namedItem("details");

      var phoneValue = (phone.value || "").replace(/[\s-]/g, "");
      var validPhone = /^(?:\+?966|0)?5\d{8}$/.test(phoneValue);

      if (!name.value.trim() || !validPhone) {
        if (status) {
          status.textContent = "فضلًا اكتب الاسم ورقم جوال صحيح يبدأ بـ 05.";
          status.classList.add("is-visible");
        }
        if (!validPhone) phone.focus();
        else name.focus();
        return;
      }

      var lines = [
        "طلب عرض سعر — " + "زجاج/ألمنيوم الرياض",
        "الاسم: " + name.value.trim(),
        "الجوال: " + phone.value.trim(),
        "الخدمة: " + (service.value || "غير محدد"),
        "الحي: " + (district.value.trim() || "غير محدد"),
      ];
      if (details.value.trim()) lines.push("التفاصيل: " + details.value.trim());

      var number = form.getAttribute("data-wa") || "";
      var url = "https://wa.me/" + number + "?text=" + encodeURIComponent(lines.join("\n"));

      if (status) {
        status.textContent = "تم تجهيز الطلب… سيُفتح واتساب لإرساله.";
        status.classList.add("is-visible");
      }
      var opened = window.open(url, "_blank", "noopener");
      if (!opened) window.location.href = url;
    });
  }

  /* ---------- تحميل الخريطة عند الطلب ---------- */
  doc.querySelectorAll("[data-map]").forEach(function (wrap) {
    var btn = wrap.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var src = wrap.getAttribute("data-map");
      if (!src) return;
      var iframe = doc.createElement("iframe");
      iframe.src = src;
      iframe.loading = "lazy";
      iframe.title = "موقع العمل على خرائط جوجل";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.setAttribute("allowfullscreen", "");
      wrap.innerHTML = "";
      wrap.appendChild(iframe);
    });
  });
})();
