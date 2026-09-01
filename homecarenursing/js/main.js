/* Home Care Nursing — vanilla JS, no dependencies. */
(function () {
  "use strict";

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

    fetch(form.action, { method: "POST", body: new FormData(form) })
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
