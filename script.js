/* ==========================================================================
   Portfolio behaviour

   1  Small helpers
   2  Footer year
   3  Mobile menu
   4  Header background and current-section highlight
   5  Project list (open and close)
   6  Live local time
   7  Copy email button

   You normally don't need to change anything in this file.
   ========================================================================== */

(function () {
  "use strict";

  /* 1. Small helpers
     ---------------------------------------------------------------------- */
  var root = document.documentElement;

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }
  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }


  /* 2. Footer year
     ---------------------------------------------------------------------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* 3. Mobile menu
     ---------------------------------------------------------------------- */
  var MENU_BREAKPOINT = 900; // must match the 900px value in style.css
  var menuBtn = $(".menu-toggle");
  var nav = $("#site-nav");
  var pageParts = [$("main"), $(".site-footer")];

  function setMenu(open) {
    if (!menuBtn) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    root.classList.toggle("menu-open", open);
    // While the menu is open, keep keyboard focus away from the page behind it
    pageParts.forEach(function (part) {
      if (part) part.inert = open;
    });
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });

    // Close after choosing a link
    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });

    // Close with the Escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && root.classList.contains("menu-open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });

    // Close if the window grows to desktop size
    window.addEventListener("resize", function () {
      if (window.innerWidth > MENU_BREAKPOINT && root.classList.contains("menu-open")) {
        setMenu(false);
      }
    });
  }


  /* 4. Header background and current-section highlight
     ---------------------------------------------------------------------- */
  var header = $(".site-header");

  if (header) {
    var ticking = false;
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeader);
      }
    }, { passive: true });
    updateHeader();
  }

  // Only links that point to a section on this page (#projects, #about, ...)
  var navLinks = $$(".nav__link").filter(function (link) {
    return (link.getAttribute("href") || "").charAt(0) === "#";
  });
  var sections = navLinks
    .map(function (link) { return $(link.getAttribute("href")); })
    .filter(Boolean);

  function setCurrent(id) {
    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === "#" + id) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
      if (window.scrollY < 120) {
        navLinks.forEach(function (link) { link.removeAttribute("aria-current"); });
      }
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (section) { observer.observe(section); });
  }


  /* 5. Project list (open and close)
     ---------------------------------------------------------------------- */
  $$(".project").forEach(function (project) {
    var trigger = $(".project__trigger", project);
    if (!trigger) return;

    trigger.addEventListener("click", function () {
      var willOpen = !project.classList.contains("is-open");
      project.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
  });


  /* 6. Live local time
     Shows the time in the timezone set in index.html (data-timezone).
     ---------------------------------------------------------------------- */
  var clock = $("#local-time");

  if (clock && window.Intl && Intl.DateTimeFormat) {
    var options = { hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" };
    var formatter;

    try {
      formatter = new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: clock.dataset.timezone }, options));
    } catch (e) {
      // Unknown timezone name: fall back to the visitor's own time
      formatter = new Intl.DateTimeFormat("en-GB", options);
    }

    var tick = function () {
      clock.textContent = formatter.format(new Date());
    };
    tick();
    window.setInterval(tick, 15000);
  }


  /* 7. Copy email button
     ---------------------------------------------------------------------- */
  var copyBtn = $("#copy-email");
  var emailLink = $("#email-link");
  var copyStatus = $("#copy-status");

  function legacyCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(field);
    return ok;
  }

  if (copyBtn && emailLink) {
    var resetTimer;

    copyBtn.addEventListener("click", function () {
      var email = emailLink.textContent.trim();
      var done = function (ok) {
        copyBtn.textContent = ok ? "Copied" : "Copy failed, select it above";
        if (copyStatus) copyStatus.textContent = ok ? "Email address copied" : "Could not copy the email address";
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          copyBtn.textContent = "Copy email";
          if (copyStatus) copyStatus.textContent = "";
        }, 2200);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(
          function () { done(true); },
          function () { done(legacyCopy(email)); }
        );
      } else {
        done(legacyCopy(email));
      }
    });
  }


  /* 8. Back to top smooth scroll
     ---------------------------------------------------------------------- */
  $$('a[href="#top"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });


  /* 9. Interactive Resume Modal
     ---------------------------------------------------------------------- */
  var resumeModal = $("#resume-modal");
  var resumeCloseBtn = $("#resume-close-btn");
  var resumePrintBtn = $("#resume-print-btn");
  var resumeTriggers = [
    $("#nav-resume-btn"),
    $("#contact-resume-btn")
  ].concat($$('a[href="#resume"]'));

  function openResume() {
    if (!resumeModal) return;
    if (typeof setMenu === "function") setMenu(false);
    if (typeof resumeModal.showModal === "function") {
      resumeModal.showModal();
    } else {
      resumeModal.setAttribute("open", "");
    }
    root.style.overflow = "hidden";
  }

  function closeResume() {
    if (!resumeModal) return;
    if (typeof resumeModal.close === "function") {
      resumeModal.close();
    } else {
      resumeModal.removeAttribute("open");
    }
    root.style.overflow = "";
  }

  resumeTriggers.forEach(function (btn) {
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openResume();
    });
  });

  if (resumeCloseBtn) {
    resumeCloseBtn.addEventListener("click", closeResume);
  }

  if (resumePrintBtn) {
    resumePrintBtn.addEventListener("click", function () {
      window.print();
    });
  }

  if (resumeModal) {
    // Close on clicking backdrop outside modal content
    resumeModal.addEventListener("click", function (e) {
      var rect = resumeModal.getBoundingClientRect();
      var isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (e.target === resumeModal) {
        closeResume();
      }
    });

    resumeModal.addEventListener("cancel", function () {
      root.style.overflow = "";
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && resumeModal.hasAttribute("open")) {
        closeResume();
      }
    });
  }


  /* 9. Scroll-triggered fade-in animation for sections
     ---------------------------------------------------------------------- */
  var revealSections = $$(".section");
  if ("IntersectionObserver" in window) {
    var sectionRevealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.05
    });

    revealSections.forEach(function (section) {
      sectionRevealObserver.observe(section);
    });
  } else {
    revealSections.forEach(function (section) {
      section.classList.add("is-visible");
    });
  }
})();
