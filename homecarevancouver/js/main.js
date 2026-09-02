/* Home Care Vancouver — vanilla JS, no dependencies. */
(function () {
  "use strict";

  /* --- reCAPTCHA v3 -------------------------------------------------------
     Off until a site key is set in the page head. When it is off the form
     still works: the honeypot, the time check, the per-IP limit and the
     hard-coded recipient in send-mail.php are all independent of this. */
  var CAPTCHA_KEY = (window.RECAPTCHA_SITE_KEY || "").trim();
  var captchaReady = null;

  function loadCaptcha() {
    if (captchaReady) return captchaReady;
    captchaReady = new Promise(function (resolve) {
      if (!CAPTCHA_KEY) return resolve(false);
      var s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(CAPTCHA_KEY);
      s.async = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };   // Google blocked/offline: carry on
      document.head.appendChild(s);
    });
    return captchaReady;
  }
  if (CAPTCHA_KEY) loadCaptcha();

  function withCaptcha(fd) {
    return loadCaptcha().then(function (ok) {
      if (!ok || !window.grecaptcha || !window.grecaptcha.execute) return fd;
      return new Promise(function (resolve) {
        window.grecaptcha.ready(function () {
          window.grecaptcha.execute(CAPTCHA_KEY, { action: "enquiry" })
            .then(function (t) { fd.append("g-recaptcha-response", t); resolve(fd); })
            .catch(function () { resolve(fd); });
        });
      });
    });
  }

  /* Stamped at page load; send-mail.php rejects anything posted in under
     three seconds, which no human can do and every bot does. */
  var PAGE_LOADED = Date.now();

  /* --- mobile menu -------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      }
    });
  }

  /* --- enquiry form -------------------------------------------------- */
  var form = document.getElementById("enquiry");
  var msg = document.getElementById("formmsg");
  if (!form || !msg) return;

  function show(kind, text) {
    msg.className = "formmsg " + kind;
    msg.textContent = text;
    msg.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Preview builds carry data-preview and never contact the server.
    if (form.getAttribute("data-preview")) {
      show("ok", "Preview only — on your own hosting this sends the enquiry to info@allnursing.ca.");
      return;
    }

    var name = form.querySelector('[name="name"]');
    var phone = form.querySelector('[name="phone"]');
    if (!name.value.trim() || !phone.value.trim()) {
      show("err", "Please give us a name and a phone number so we can call you back.");
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    var label = button.textContent;
    button.disabled = true;
    button.textContent = "Sending…";

    var fd = new FormData(form);
    fd.append("started", PAGE_LOADED);

    withCaptcha(fd)
      .then(function (payload) { return fetch(form.action, { method: "POST", body: payload }); })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (body) {
        // The mailer answers with OK on success and ERR: ... on failure.
        if (body.trim().indexOf("OK") !== 0) throw new Error(body);
        form.reset();
        show("ok", "Thank you — that has reached us. We will call you back shortly.");
      })
      .catch(function () {
        show("err",
          "Sorry, something went wrong sending that. Please call us on 604 488 9323 " +
          "and we will pick it up straight away.");
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = label;
      });
  });
})();
