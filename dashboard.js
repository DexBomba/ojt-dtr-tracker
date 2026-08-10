(function () {
  "use strict";

  // ---------- STATE ----------
  let shifts = [];
  let targetHours = 500;

  // ---------- DOM REFS ----------
  const userEmailSpan = document.getElementById("userEmail");
  const totalHoursEl = document.getElementById("totalHours");
  const targetHoursEl = document.getElementById("targetHours");
  const remainingHoursEl = document.getElementById("remainingHours");
  const progressPercentEl = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");

  const targetInput = document.getElementById("targetInput");
  const updateTargetBtn = document.getElementById("updateTargetBtn");

  const shiftForm = document.getElementById("shiftForm");
  const shiftDate = document.getElementById("shiftDate");
  const morningIn = document.getElementById("morningIn");
  const morningOut = document.getElementById("morningOut");
  const afternoonIn = document.getElementById("afternoonIn");
  const afternoonOut = document.getElementById("afternoonOut");
  const otStart = document.getElementById("otStart");
  const otEnd = document.getElementById("otEnd");
  const morningDurationSpan = document.getElementById("morningDuration");
  const afternoonDurationSpan = document.getElementById("afternoonDuration");
  const otDurationSpan = document.getElementById("otDuration");
  const totalShiftDurationSpan = document.getElementById("totalShiftDuration");

  const totalShiftsEl = document.getElementById("totalShifts");
  const avgHoursEl = document.getElementById("avgHours");
  const completionRateEl = document.getElementById("completionRate");
  const totalDaysEl = document.getElementById("totalDays");
  const historyBody = document.getElementById("historyBody");

  // Modal refs
  const modal = document.getElementById("dtrModal");
  const modalClose = document.getElementById("modalClose");
  const printBtn = document.getElementById("printBtn");
  const printPdfBtn = document.getElementById("printPdfBtn");
  const csvBtn = document.getElementById("csvBtn");
  const excelBtn = document.getElementById("excelBtn");

  // DTR form fields
  const dtrFullName = document.getElementById("dtrFullName");
  const dtrSchool = document.getElementById("dtrSchool");
  const dtrDepartment = document.getElementById("dtrDepartment");
  const dtrCompany = document.getElementById("dtrCompany");
  const dtrPosition = document.getElementById("dtrPosition");
  const includeSignature = document.getElementById("includeSignature");
  const dtrSupervisor = document.getElementById("dtrSupervisor");
  const dtrSupervisorTitle = document.getElementById("dtrSupervisorTitle");

  // ---------- LOAD FROM localStorage ----------
  function loadData() {
    const savedShifts = localStorage.getItem("ojt_shifts");
    if (savedShifts) {
      try {
        shifts = JSON.parse(savedShifts);
      } catch (e) {
        shifts = [];
      }
    } else {
      // Seed demo data
      shifts = [
        {
          id: 1,
          date: "2026-07-30",
          morning: { in: "08:00", out: "12:00" },
          afternoon: { in: "13:00", out: "17:00" },
          overtime: { in: null, out: null },
          total: 8.0,
        },
        {
          id: 2,
          date: "2026-07-30",
          morning: { in: "08:00", out: "12:00" },
          afternoon: { in: "13:00", out: "17:00" },
          overtime: { in: null, out: null },
          total: 8.0,
        },
      ];
    }

    const savedTarget = localStorage.getItem("ojt_target");
    if (savedTarget) {
      targetHours = parseFloat(savedTarget) || 500;
    }
    targetInput.value = targetHours;

    // Load DTR user info
    const savedDtr = localStorage.getItem("ojt_dtr_info");
    if (savedDtr) {
      try {
        const info = JSON.parse(savedDtr);
        dtrFullName.value = info.fullName || "";
        dtrSchool.value = info.school || "";
        dtrDepartment.value = info.department || "";
        dtrCompany.value = info.company || "";
        dtrPosition.value = info.position || "";
        includeSignature.checked =
          info.includeSignature !== undefined ? info.includeSignature : true;
        dtrSupervisor.value = info.supervisor || "";
        dtrSupervisorTitle.value = info.supervisorTitle || "";
      } catch (e) {}
    }
  }

  function saveDtrInfo() {
    const info = {
      fullName: dtrFullName.value,
      school: dtrSchool.value,
      department: dtrDepartment.value,
      company: dtrCompany.value,
      position: dtrPosition.value,
      includeSignature: includeSignature.checked,
      supervisor: dtrSupervisor.value,
      supervisorTitle: dtrSupervisorTitle.value,
    };
    localStorage.setItem("ojt_dtr_info", JSON.stringify(info));
  }

  function saveData() {
    localStorage.setItem("ojt_shifts", JSON.stringify(shifts));
    localStorage.setItem("ojt_target", String(targetHours));
    saveDtrInfo();
  }

  // ---------- HELPERS ----------
  function timeToHours(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    return parseFloat(parts[0]) + parseFloat(parts[1]) / 60;
  }

  function formatTime(timeStr) {
    if (!timeStr) return "--:-- --";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  function calcDuration(inTime, outTime) {
    if (!inTime || !outTime) return 0;
    const hIn = timeToHours(inTime);
    const hOut = timeToHours(outTime);
    let diff = hOut - hIn;
    if (diff < 0) diff += 24;
    return Math.round(diff * 100) / 100;
  }

  function getTotalHours() {
    return shifts.reduce((sum, s) => sum + s.total, 0);
  }

  function updateStats() {
    const total = getTotalHours();
    const remaining = Math.max(0, targetHours - total);
    const progress = targetHours > 0 ? (total / targetHours) * 100 : 0;
    const progressDisplay = Math.min(progress, 100);

    totalHoursEl.textContent = total.toFixed(1);
    targetHoursEl.textContent = targetHours;
    remainingHoursEl.textContent = remaining.toFixed(1);
    progressPercentEl.textContent = progressDisplay.toFixed(1) + "%";
    progressFill.style.width = Math.min(progressDisplay, 100) + "%";
    progressLabel.textContent = progressDisplay.toFixed(1) + "%";

    totalShiftsEl.textContent = shifts.length;
    const avg = shifts.length > 0 ? total / shifts.length : 0;
    avgHoursEl.textContent = avg.toFixed(2);
    completionRateEl.textContent = progressDisplay.toFixed(1) + "%";
    totalDaysEl.textContent = shifts.length;
  }

  // ---------- RENDER TABLE ----------
  function renderTable() {
    if (shifts.length === 0) {
      historyBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>No shifts logged yet. Start tracking!</p>
                        </div>
                    </td>
                </tr>
            `;
      return;
    }

    const sorted = [...shifts].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    let html = "";
    sorted.forEach((shift) => {
      const morningStr =
        shift.morning.in && shift.morning.out
          ? `${formatTime(shift.morning.in)} - ${formatTime(shift.morning.out)}<br>(${calcDuration(shift.morning.in, shift.morning.out).toFixed(2)} hrs)`
          : "-";
      const afternoonStr =
        shift.afternoon.in && shift.afternoon.out
          ? `${formatTime(shift.afternoon.in)} - ${formatTime(shift.afternoon.out)}<br>(${calcDuration(shift.afternoon.in, shift.afternoon.out).toFixed(2)} hrs)`
          : "-";
      const otStr =
        shift.overtime.in && shift.overtime.out
          ? `${formatTime(shift.overtime.in)} - ${formatTime(shift.overtime.out)}<br>(${calcDuration(shift.overtime.in, shift.overtime.out).toFixed(2)} hrs)`
          : "-";

      html += `
                <tr>
                    <td>${shift.date}</td>
                    <td>${morningStr}</td>
                    <td>${afternoonStr}</td>
                    <td>${otStr}</td>
                    <td>${shift.total.toFixed(2)} hrs</td>
                    <td>
                        <div class="actions no-print">
                            <button class="btn btn-primary btn-sm edit-btn" data-id="${shift.id}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${shift.id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
    });
    historyBody.innerHTML = html;

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = parseInt(this.dataset.id);
        if (confirm("Delete this shift?")) {
          shifts = shifts.filter((s) => s.id !== id);
          saveData();
          renderTable();
          updateStats();
        }
      });
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = parseInt(this.dataset.id);
        const shift = shifts.find((s) => s.id === id);
        if (shift) {
          shiftDate.value = shift.date;
          morningIn.value = shift.morning.in || "08:00";
          morningOut.value = shift.morning.out || "12:00";
          afternoonIn.value = shift.afternoon.in || "13:00";
          afternoonOut.value = shift.afternoon.out || "17:00";
          otStart.value = shift.overtime.in || "18:00";
          otEnd.value = shift.overtime.out || "20:00";
          shifts = shifts.filter((s) => s.id !== id);
          saveData();
          renderTable();
          updateStats();
          shiftForm.scrollIntoView({ behavior: "smooth" });
          calculateDurations();
        }
      });
    });
  }

  // ---------- CALCULATE DURATIONS ----------
  function calculateDurations() {
    const mDur = calcDuration(morningIn.value, morningOut.value);
    morningDurationSpan.textContent = mDur.toFixed(2);
    const aDur = calcDuration(afternoonIn.value, afternoonOut.value);
    afternoonDurationSpan.textContent = aDur.toFixed(2);
    const oDur = calcDuration(otStart.value, otEnd.value);
    otDurationSpan.textContent = oDur.toFixed(2);
    const total = mDur + aDur + oDur;
    totalShiftDurationSpan.textContent = total.toFixed(2);
  }

  // ---------- ADD SHIFT ----------
  function addShift(e) {
    e.preventDefault();

    const date = shiftDate.value;
    if (!date) {
      alert("Please select a date.");
      return;
    }

    const mIn = morningIn.value;
    const mOut = morningOut.value;
    const aIn = afternoonIn.value;
    const aOut = afternoonOut.value;
    const otIn = otStart.value;
    const otOut = otEnd.value;

    if (!mIn || !mOut || !aIn || !aOut) {
      alert("Please fill in morning and afternoon clock times.");
      return;
    }

    const mDur = calcDuration(mIn, mOut);
    const aDur = calcDuration(aIn, aOut);
    const oDur = calcDuration(otIn, otOut);
    const total = mDur + aDur + oDur;

    if (total === 0) {
      alert("Shift duration cannot be zero.");
      return;
    }

    const newShift = {
      id: Date.now(),
      date: date,
      morning: { in: mIn, out: mOut },
      afternoon: { in: aIn, out: aOut },
      overtime: { in: otIn || null, out: otOut || null },
      total: total,
    };

    shifts.push(newShift);
    saveData();
    renderTable();
    updateStats();
    calculateDurations();
    shiftDate.focus();
  }

  // ---------- EXPORT FUNCTIONS ----------
  function getDtrData() {
    const info = {
      fullName: dtrFullName.value || "N/A",
      school: dtrSchool.value || "N/A",
      department: dtrDepartment.value || "N/A",
      company: dtrCompany.value || "N/A",
      position: dtrPosition.value || "N/A",
      includeSignature: includeSignature.checked,
      supervisor: dtrSupervisor.value || "N/A",
      supervisorTitle: dtrSupervisorTitle.value || "N/A",
    };
    return info;
  }

  function printDtr() {
    saveDtrInfo();
    const info = getDtrData();
    const total = getTotalHours();
    const remaining = Math.max(0, targetHours - total);
    const progress = targetHours > 0 ? (total / targetHours) * 100 : 0;

    let printContent = `
            <div style="font-family: 'Quicksand', sans-serif; max-width: 1000px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="text-align:center; color:#2c3e50; font-family:'Fredoka One',cursive;">OJT DTR Tracker</h1>
                <p style="text-align:center; color:#5d6d7e;">Daily Time Record</p>
                <hr style="border:2px solid #e67e22; margin:20px 0;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:20px 0;">
                    <div><strong>Full Name:</strong> ${info.fullName}</div>
                    <div><strong>School/University:</strong> ${info.school}</div>
                    <div><strong>Department/Course:</strong> ${info.department}</div>
                    <div><strong>Company/Organization:</strong> ${info.company}</div>
                    <div><strong>Position/Role:</strong> ${info.position}</div>
                    <div><strong>Target Hours:</strong> ${targetHours} hrs</div>
                    <div><strong>Total Completed:</strong> ${total.toFixed(1)} hrs</div>
                    <div><strong>Remaining:</strong> ${remaining.toFixed(1)} hrs</div>
                    <div><strong>Progress:</strong> ${Math.min(progress, 100).toFixed(1)}%</div>
                </div>
                <hr style="margin:20px 0;">
                <h3 style="font-family:'Fredoka One',cursive; color:#2c3e50;">Shift History</h3>
                <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:0.9rem;">
                    <thead>
                        <tr style="background:#fdf6ec;">
                            <th style="padding:10px; border:1px solid #e8d5c4; text-align:left;">Date</th>
                            <th style="padding:10px; border:1px solid #e8d5c4; text-align:left;">Morning</th>
                            <th style="padding:10px; border:1px solid #e8d5c4; text-align:left;">Afternoon</th>
                            <th style="padding:10px; border:1px solid #e8d5c4; text-align:left;">Overtime</th>
                            <th style="padding:10px; border:1px solid #e8d5c4; text-align:left;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    shifts.forEach((shift) => {
      const morningStr =
        shift.morning.in && shift.morning.out
          ? `${formatTime(shift.morning.in)} - ${formatTime(shift.morning.out)} (${calcDuration(shift.morning.in, shift.morning.out).toFixed(2)} hrs)`
          : "-";
      const afternoonStr =
        shift.afternoon.in && shift.afternoon.out
          ? `${formatTime(shift.afternoon.in)} - ${formatTime(shift.afternoon.out)} (${calcDuration(shift.afternoon.in, shift.afternoon.out).toFixed(2)} hrs)`
          : "-";
      const otStr =
        shift.overtime.in && shift.overtime.out
          ? `${formatTime(shift.overtime.in)} - ${formatTime(shift.overtime.out)} (${calcDuration(shift.overtime.in, shift.overtime.out).toFixed(2)} hrs)`
          : "-";
      printContent += `
                <tr>
                    <td style="padding:8px 10px; border:1px solid #e8d5c4;">${shift.date}</td>
                    <td style="padding:8px 10px; border:1px solid #e8d5c4;">${morningStr}</td>
                    <td style="padding:8px 10px; border:1px solid #e8d5c4;">${afternoonStr}</td>
                    <td style="padding:8px 10px; border:1px solid #e8d5c4;">${otStr}</td>
                    <td style="padding:8px 10px; border:1px solid #e8d5c4; font-weight:bold;">${shift.total.toFixed(2)} hrs</td>
                </tr>
            `;
    });

    printContent += `
                    </tbody>
                </table>
                <div style="margin-top:20px; text-align:right;">
                    <strong>Total Hours: ${getTotalHours().toFixed(1)} hrs</strong>
                </div>
        `;

    if (info.includeSignature) {
      printContent += `
                <div style="margin-top:40px; display:flex; justify-content:space-between; border-top:2px dashed #e8d5c4; padding-top:30px;">
                    <div>
                        <p><strong>Intern:</strong> ${info.fullName}</p>
                        <p style="margin-top:20px;">Signature: _______________________</p>
                        <p style="margin-top:8px; font-size:0.85rem; color:#5d6d7e;">Date: _______________</p>
                    </div>
                    <div style="text-align:right;">
                        <p><strong>Supervisor:</strong> ${info.supervisor}</p>
                        <p><strong>Title:</strong> ${info.supervisorTitle}</p>
                        <p style="margin-top:20px;">Signature: _______________________</p>
                        <p style="margin-top:8px; font-size:0.85rem; color:#5d6d7e;">Date: _______________</p>
                    </div>
                </div>
            `;
    }

    printContent += `
                <div style="margin-top:30px; text-align:center; font-size:0.8rem; color:#5d6d7e; border-top:1px solid #e8d5c4; padding-top:20px;">
                    This is an official DTR generated from OJT DTR Tracker (Academic Project).
                    <br>© 2026 OJT DTR Tracker — For Student Use
                </div>
            </div>
        `;

    const win = window.open("", "_blank");
    win.document.write(`
            <html>
                <head>
                    <title>OJT DTR - Print</title>
                    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Fredoka+One&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; padding: 0; }
                        @media print {
                            body { margin: 0; padding: 0; }
                        }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
  }

  function exportCSV() {
    if (shifts.length === 0) {
      alert("No shifts to export.");
      return;
    }
    let csv =
      "Date,Morning In,Morning Out,Morning Duration,Afternoon In,Afternoon Out,Afternoon Duration,Overtime Start,Overtime End,Overtime Duration,Total Hours\n";
    shifts.forEach((shift) => {
      const mDur = calcDuration(shift.morning.in, shift.morning.out);
      const aDur = calcDuration(shift.afternoon.in, shift.afternoon.out);
      const oDur = calcDuration(shift.overtime.in, shift.overtime.out);
      csv += `${shift.date},${shift.morning.in || ""},${shift.morning.out || ""},${mDur.toFixed(2)},${shift.afternoon.in || ""},${shift.afternoon.out || ""},${aDur.toFixed(2)},${shift.overtime.in || ""},${shift.overtime.out || ""},${oDur.toFixed(2)},${shift.total.toFixed(2)}\n`;
    });
    const total = getTotalHours();
    csv += `\nSummary,Total Hours: ${total.toFixed(1)},Target: ${targetHours},Remaining: ${(targetHours - total).toFixed(1)},Progress: ${((total / targetHours) * 100).toFixed(1)}%\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `OJT_DTR_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportExcel() {
    if (shifts.length === 0) {
      alert("No shifts to export.");
      return;
    }
    let html = `<table>
            <tr><th>Date</th><th>Morning In</th><th>Morning Out</th><th>Morning Duration</th><th>Afternoon In</th><th>Afternoon Out</th><th>Afternoon Duration</th><th>Overtime Start</th><th>Overtime End</th><th>Overtime Duration</th><th>Total Hours</th></tr>`;
    shifts.forEach((shift) => {
      const mDur = calcDuration(shift.morning.in, shift.morning.out);
      const aDur = calcDuration(shift.afternoon.in, shift.afternoon.out);
      const oDur = calcDuration(shift.overtime.in, shift.overtime.out);
      html += `<tr><td>${shift.date}</td><td>${shift.morning.in || ""}</td><td>${shift.morning.out || ""}</td><td>${mDur.toFixed(2)}</td><td>${shift.afternoon.in || ""}</td><td>${shift.afternoon.out || ""}</td><td>${aDur.toFixed(2)}</td><td>${shift.overtime.in || ""}</td><td>${shift.overtime.out || ""}</td><td>${oDur.toFixed(2)}</td><td>${shift.total.toFixed(2)}</td></tr>`;
    });
    html += `</table>`;
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `OJT_DTR_${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function openModal() {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
    const savedDtr = localStorage.getItem("ojt_dtr_info");
    if (savedDtr) {
      try {
        const info = JSON.parse(savedDtr);
        dtrFullName.value = info.fullName || "";
        dtrSchool.value = info.school || "";
        dtrDepartment.value = info.department || "";
        dtrCompany.value = info.company || "";
        dtrPosition.value = info.position || "";
        includeSignature.checked =
          info.includeSignature !== undefined ? info.includeSignature : true;
        dtrSupervisor.value = info.supervisor || "";
        dtrSupervisorTitle.value = info.supervisorTitle || "";
      } catch (e) {}
    }
  }

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    saveDtrInfo();
  }

  printBtn.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  document
    .querySelectorAll("#dtrForm input, #dtrForm checkbox")
    .forEach((el) => {
      el.addEventListener("change", saveDtrInfo);
      el.addEventListener("input", saveDtrInfo);
    });

  printPdfBtn.addEventListener("click", function () {
    saveDtrInfo();
    printDtr();
  });

  csvBtn.addEventListener("click", function () {
    saveDtrInfo();
    exportCSV();
  });

  excelBtn.addEventListener("click", function () {
    saveDtrInfo();
    exportExcel();
  });

  function init() {
    loadData();
    const today = new Date().toISOString().split("T")[0];
    shiftDate.value = today;

    if (!morningIn.value) morningIn.value = "08:00";
    if (!morningOut.value) morningOut.value = "12:00";
    if (!afternoonIn.value) afternoonIn.value = "13:00";
    if (!afternoonOut.value) afternoonOut.value = "17:00";
    if (!otStart.value) otStart.value = "18:00";
    if (!otEnd.value) otEnd.value = "20:00";

    renderTable();
    updateStats();
    calculateDurations();

    shiftForm.addEventListener("submit", addShift);

    updateTargetBtn.addEventListener("click", function () {
      const val = parseFloat(targetInput.value);
      if (!val || val < 1) {
        alert("Please enter a valid target hours (minimum 1).");
        return;
      }
      targetHours = val;
      saveData();
      updateStats();
      targetHoursEl.textContent = targetHours;
      alert("Target hours updated!");
    });

    document
      .querySelectorAll('.shift-form input[type="time"]')
      .forEach((input) => {
        input.addEventListener("change", calculateDurations);
        input.addEventListener("input", calculateDurations);
      });

    const storedEmail = localStorage.getItem("ojt_user_email");
    if (storedEmail) {
      userEmailSpan.textContent = storedEmail;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
