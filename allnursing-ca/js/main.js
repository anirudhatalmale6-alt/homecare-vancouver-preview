/* All Nursing Health Services — site interactions (vanilla JS, no dependencies) */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     FORM DELIVERY SETUP (one-time, ~5 minutes)
     All 5 forms on this site (General Inquiry, Free Consultation,
     Service Inquiry, Free Assessment, Career Application) POST here
     and are routed to Info@allnursing.ca.

     To activate:
     1. Go to https://formspree.io and sign up FREE using Info@allnursing.ca
     2. Create a new form, confirm the verification email Formspree sends
        to Info@allnursing.ca
     3. Copy the endpoint it gives you (looks like
        "https://formspree.io/f/abcdwxyz") and paste it below,
        replacing YOUR_FORM_ID.
     Until this is set, submissions will fail and show the visitor an
     error message asking them to call instead — no messages are lost
     silently, but none will arrive by email either.
     ------------------------------------------------------------------ */
  var FORM_ENDPOINT = "send-mail.php";

  /* Sticky header shadow on scroll */
  var header = document.querySelector(".site-header");
  var floatingCta = document.querySelector(".floating-cta");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
    if (floatingCta) floatingCta.classList.toggle("is-visible", window.scrollY > 480);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Caption in the empty gap above the homepage hero photo, styled to
     match the site's existing "guided by nurses" italic treatment */
  var heroMedia = document.querySelector(".hero .hero-media");
  var heroFrame = document.querySelector(".hero .hero-media-frame");
  if (heroMedia && heroFrame && !heroMedia.querySelector(".hero-media-caption")) {
    var caption = document.createElement("p");
    caption.className = "hero-media-caption";
    caption.textContent = "HOME CARE SERVICES";
    heroMedia.insertBefore(caption, heroFrame);
  }

  /* Mobile nav toggle */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  function closeMobileNav() {
    if (!navToggle || !mainNav) return;
    navToggle.classList.remove("is-open");
    mainNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.querySelectorAll(".nav-item.open").forEach(function (i) { i.classList.remove("open"); });
  }
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.classList.toggle("is-open");
      mainNav.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
      if (!isOpen) {
        document.querySelectorAll(".nav-item.open").forEach(function (i) { i.classList.remove("open"); });
      }
    });

    /* Close the mobile menu when tapping outside it, pressing Escape,
       or resizing back up to desktop width — keeps it from ever being
       left open and overflowing the screen. */
    document.addEventListener("click", function (e) {
      if (!navToggle.classList.contains("is-open")) return;
      if (mainNav.contains(e.target) || navToggle.contains(e.target)) return;
      closeMobileNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMobileNav();
    });
  }

  /* Mega menu (desktop hover / mobile tap) */
  document.querySelectorAll(".nav-item.has-mega").forEach(function (item) {
    var link = item.querySelector(".nav-link");
    link.addEventListener("click", function (e) {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        var wasOpen = item.classList.contains("open");
        document.querySelectorAll(".nav-item.open").forEach(function (i) { i.classList.remove("open"); });
        if (!wasOpen) item.classList.add("open");
      }
    });
    item.addEventListener("mouseenter", function () {
      if (window.innerWidth > 860) item.classList.add("open");
    });
    item.addEventListener("mouseleave", function () {
      if (window.innerWidth > 860) item.classList.remove("open");
    });
  });

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("is-open"); });
      if (!isOpen) item.classList.add("is-open");
    });
  });

  /* Testimonial carousel */
  var track = document.querySelector(".testimonial-slides");
  if (track) {
    var slides = track.querySelectorAll(".testimonial-slide");
    var dotsWrap = document.querySelector(".testimonial-controls");
    var current = 0;
    var timer;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.className = "dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", "Show testimonial " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + current * 100 + "%)";
      dotsWrap.querySelectorAll(".dot").forEach(function (d, idx) {
        d.classList.toggle("is-active", idx === current);
      });
    }
    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(function () { goTo(current + 1); }, 6500);
    }
    resetTimer();
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Form tab switching (contact page) */
  document.querySelectorAll(".form-tabs").forEach(function (tabs) {
    var buttons = tabs.querySelectorAll(".form-tab");
    var forms = document.querySelectorAll(".care-form");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        forms.forEach(function (f) { f.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var target = document.getElementById(btn.dataset.target);
        if (target) target.classList.add("is-active");
      });
    });
  });

  /* Simple client-side form validation (progressive enhancement) */
  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      var valid = true;
      form.querySelectorAll("[required], input[type=email], input[type=tel]").forEach(function (field) {
        var group = field.closest(".field");
        var empty = field.hasAttribute("required") && !field.value.trim();
        var invalid = field.value.trim() && typeof field.checkValidity === "function" && !field.checkValidity();
        if (empty || invalid) {
          valid = false;
          if (group) group.classList.add("has-error");
        } else if (group) {
          group.classList.remove("has-error");
        }
      });
      if (!valid) {
        e.preventDefault();
        var firstError = form.querySelector(".has-error input, .has-error textarea, .has-error select");
        if (firstError) firstError.focus();
        return;
      }
      e.preventDefault();

      /* All forms submit to Info@allnursing.ca via Formspree.
         FORM_ENDPOINT must be set to the site's Formspree endpoint
         (see setup note below) before this goes live. */
      var status = form.querySelector(".form-status");
      var submitBtn = form.querySelector("button[type=submit]");
      var data = new FormData(form);
      if (form.dataset.subject) data.append("_subject", form.dataset.subject);

      if (submitBtn) submitBtn.disabled = true;

      fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          if (status) {
            var message = form.dataset.successMsg || "Thank you — a member of our care team will call you back shortly.";
            status.textContent = message;
            status.classList.remove("is-error");
            status.classList.add("is-success");
          }
          form.reset();
        })
        .catch(function () {
          if (status) {
            status.textContent = "Sorry, something went wrong sending your message. Please call us at 604 488 9323 instead.";
            status.classList.remove("is-success");
            status.classList.add("is-error");
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  });
})();
