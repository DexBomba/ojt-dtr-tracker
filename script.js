//const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'https://ojt-dtr-tracker-backend.onrender.com/api';
// ---------- CUSTOM ALERT SYSTEM ----------
function showAlert(message, type = 'info', title = '') {
    // Remove existing alert if any
    const existing = document.querySelector('.alert-overlay');
    if (existing) {
        existing.remove();
    }

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const titles = {
        success: 'Success!',
        error: 'Error!',
        warning: 'Warning!',
        info: 'Notice'
    };

    const btnClasses = {
        success: 'btn-success',
        error: 'btn-error',
        warning: 'btn-warning',
        info: 'btn-info'
    };

    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay active';
    overlay.innerHTML = `
        <div class="alert-modal">
            <div class="alert-icon ${type}">${icons[type] || 'ℹ️'}</div>
            <h3>${title || titles[type] || 'Notice'}</h3>
            <p>${message}</p>
            <button class="btn ${btnClasses[type] || 'btn-info'}" onclick="this.closest('.alert-overlay').remove()">
                <i class="fas fa-check"></i> OK
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });

    // Close on Escape key
    const closeHandler = function(e) {
        if (e.key === 'Escape') {
            const alert = document.querySelector('.alert-overlay');
            if (alert) {
                alert.remove();
                document.removeEventListener('keydown', closeHandler);
            }
        }
    };
    document.addEventListener('keydown', closeHandler);
}

// Override the default alert
window.alert = function(message) {
    showAlert(message, 'info');
};

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

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        showAlert('Please fill in all fields.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Save token and user
        localStorage.setItem('ojt_token', data.token);
        localStorage.setItem('ojt_user', JSON.stringify(data.user));

        showAlert('Welcome back, ' + data.user.name + '!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        showAlert(error.message, 'error');
    }
  });

  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirm = document.getElementById('regConfirm').value.trim();

    if (!name || !email || !password || !confirm) {
        showAlert('Please fill in all fields.', 'warning');
        return;
    }
    if (password !== confirm) {
        showAlert('Passwords do not match.', 'warning');
        return;
    }
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Save token and user
        localStorage.setItem('ojt_token', data.token);
        localStorage.setItem('ojt_user', JSON.stringify(data.user));

        showAlert('Welcome, ' + data.user.name + '! Your account has been created.', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        showAlert(error.message, 'error');
    }
  });

  document.querySelectorAll(".auth-social button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const provider = this.textContent.trim();
      showAlert(provider + ' authentication (demo)', 'info');
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