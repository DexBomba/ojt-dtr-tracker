(function () {
  "use strict";
  const disclaimerOverlay = document.getElementById("disclaimerOverlay");
  const disclaimerBtn = document.getElementById("disclaimerBtn");

  // Check if user has already acknowledged the disclaimer
  const hasAcknowledged = localStorage.getItem("ojt_disclaimer_acknowledged");

  if (hasAcknowledged) {
    disclaimerOverlay.classList.add("hidden");
  }

  disclaimerBtn.addEventListener("click", function () {
    localStorage.setItem("ojt_disclaimer_acknowledged", "true");
    disclaimerOverlay.classList.add("hidden");
  });

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const loginNavBtn = document.getElementById("loginNavBtn");
  const registerNavBtn = document.getElementById("registerNavBtn");
  const heroGetStarted = document.getElementById("heroGetStarted");

  const authTabs = document.getElementById("authTabs");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const switchToRegister = document.getElementById("switchToRegister");
  const switchToLogin = document.getElementById("switchToLogin");
  const authCardTitle = document.getElementById("authCardTitle");
  const authCardSub = document.getElementById("authCardSub");

  navToggle.addEventListener("click", function () {
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
    });
  });

  function setActiveTab(tab) {
    const buttons = authTabs.querySelectorAll("button");
    buttons.forEach((btn) => btn.classList.remove("active"));

    if (tab === "login") {
      buttons[0].classList.add("active");
      loginForm.style.display = "flex";
      registerForm.style.display = "none";
      authCardTitle.textContent = "Welcome Back";
      authCardSub.textContent = "Login to your account";
    } else {
      buttons[1].classList.add("active");
      loginForm.style.display = "none";
      registerForm.style.display = "flex";
      authCardTitle.textContent = "Join Us";
      authCardSub.textContent = "Create your free account";
    }
  }

  authTabs.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const tab = btn.dataset.tab;
    setActiveTab(tab);
  });

  switchToRegister.addEventListener("click", function (e) {
    e.preventDefault();
    setActiveTab("register");
  });
  switchToLogin.addEventListener("click", function (e) {
    e.preventDefault();
    setActiveTab("login");
  });

  loginNavBtn.addEventListener("click", function (e) {
    e.preventDefault();
    setActiveTab("login");
    document.getElementById("hero").scrollIntoView({ behavior: "smooth" });
  });
  registerNavBtn.addEventListener("click", function (e) {
    e.preventDefault();
    setActiveTab("register");
    document.getElementById("hero").scrollIntoView({ behavior: "smooth" });
  });
  heroGetStarted.addEventListener("click", function (e) {
    e.preventDefault();
    setActiveTab("register");
    document.getElementById("hero").scrollIntoView({ behavior: "smooth" });
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    alert("✅ Login successful! (demo)\nWelcome back, " + email);
    // TODO: Redirect to dashboard when backend is ready
    // window.location.href = 'dashboard.html';
  });

  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPassword").value.trim();
    const confirm = document.getElementById("regConfirm").value.trim();

    if (!name || !email || !pass || !confirm) {
      alert("Please fill in all fields.");
      return;
    }
    if (pass !== confirm) {
      alert("Passwords do not match.");
      return;
    }
    if (pass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    alert("🎉 Account created! (demo)\nWelcome, " + name + "!");
    // TODO: Redirect to dashboard when backend is ready
    // window.location.href = 'dashboard.html';
  });

  document.querySelectorAll(".auth-social button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const provider = this.textContent.trim();
      alert("🔐 " + provider + " authentication (demo)");
    });
  });

  const sections = document.querySelectorAll("section[id]");
  const navAnchors = navLinks.querySelectorAll("a:not(.btn)");

  function highlightNav() {
    let current = "";
    sections.forEach((section) => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) {
        current = section.getAttribute("id");
      }
    });
    navAnchors.forEach((a) => {
      a.style.color = "";
      if (a.getAttribute("href") === "#" + current) {
        a.style.color = "var(--secondary)";
        a.style.fontWeight = "700";
      } else {
        a.style.fontWeight = "";
      }
    });
  }

  window.addEventListener("scroll", highlightNav);
  window.addEventListener("load", highlightNav);

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      navLinks.classList.remove("open");
    }
  });
})();
