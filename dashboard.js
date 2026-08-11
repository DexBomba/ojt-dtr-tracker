(function() {
    'use strict';

    //const API_BASE_URL = 'http://localhost:5000/api';
    const API_BASE_URL = 'https://ojt-dtr-tracker-backend.onrender.com/api';

    // ---------- CUSTOM ALERT SYSTEM ----------
    function showAlert(message, type = 'info', title = '') {
        const existing = document.querySelector('.alert-overlay');
        if (existing) existing.remove();

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const titles = { success: 'Success!', error: 'Error!', warning: 'Warning!', info: 'Notice' };
        const btnClasses = { success: 'btn-success', error: 'btn-error', warning: 'btn-warning', info: 'btn-info' };

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

        overlay.addEventListener('click', function(e) {
            if (e.target === this) this.remove();
        });

        const closeHandler = function(e) {
            if (e.key === 'Escape') {
                const alert = document.querySelector('.alert-overlay');
                if (alert) { alert.remove(); document.removeEventListener('keydown', closeHandler); }
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    window.alert = function(message) { showAlert(message, 'info'); };

    // ---------- DOM REFS ----------
    const userEmailSpan = document.getElementById('userEmail');
    const totalHoursEl = document.getElementById('totalHours');
    const targetHoursEl = document.getElementById('targetHours');
    const remainingHoursEl = document.getElementById('remainingHours');
    const progressPercentEl = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    const progressLabel = document.getElementById('progressLabel');

    const targetInput = document.getElementById('targetInput');
    const updateTargetBtn = document.getElementById('updateTargetBtn');

    const shiftForm = document.getElementById('shiftForm');
    const shiftDate = document.getElementById('shiftDate');
    const morningIn = document.getElementById('morningIn');
    const morningOut = document.getElementById('morningOut');
    const afternoonIn = document.getElementById('afternoonIn');
    const afternoonOut = document.getElementById('afternoonOut');
    const otStart = document.getElementById('otStart');
    const otEnd = document.getElementById('otEnd');
    const morningDurationSpan = document.getElementById('morningDuration');
    const afternoonDurationSpan = document.getElementById('afternoonDuration');
    const otDurationSpan = document.getElementById('otDuration');
    const totalShiftDurationSpan = document.getElementById('totalShiftDuration');

    const totalShiftsEl = document.getElementById('totalShifts');
    const avgHoursEl = document.getElementById('avgHours');
    const completionRateEl = document.getElementById('completionRate');
    const totalDaysEl = document.getElementById('totalDays');
    const historyBody = document.getElementById('historyBody');

    // Modal refs
    const modal = document.getElementById('dtrModal');
    const modalClose = document.getElementById('modalClose');
    const printBtn = document.getElementById('printBtn');
    const printPdfBtn = document.getElementById('printPdfBtn');
    const csvBtn = document.getElementById('csvBtn');
    const excelBtn = document.getElementById('excelBtn');

    const dtrFullName = document.getElementById('dtrFullName');
    const dtrSchool = document.getElementById('dtrSchool');
    const dtrDepartment = document.getElementById('dtrDepartment');
    const dtrCompany = document.getElementById('dtrCompany');
    const dtrPosition = document.getElementById('dtrPosition');
    const includeSignature = document.getElementById('includeSignature');
    const dtrSupervisor = document.getElementById('dtrSupervisor');
    const dtrSupervisorTitle = document.getElementById('dtrSupervisorTitle');

    // ---------- AUTH HELPERS ----------
    function getToken() {
        return localStorage.getItem('ojt_token');
    }

    function getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        };
    }

    async function apiFetch(url, options = {}) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                ...getHeaders(),
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('ojt_token');
                localStorage.removeItem('ojt_user');
                showAlert('Session expired. Please login again.', 'warning');
                window.location.href = 'index.html';
            }
            throw new Error(data.message || 'Request failed');
        }
        return data;
    }

    // ---------- LOAD USER ----------
    function loadUser() {
        const userStr = localStorage.getItem('ojt_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            userEmailSpan.textContent = user.email || 'No email';
        }
    }

    // ---------- LOAD DATA ----------
    async function loadDashboardData() {
        try {
            // Load stats
            const stats = await apiFetch('/stats/summary');
            totalHoursEl.textContent = stats.totalHours.toFixed(1);
            targetHoursEl.textContent = stats.targetHours;
            remainingHoursEl.textContent = stats.remaining.toFixed(1);
            const progress = stats.progress || 0;
            progressPercentEl.textContent = progress.toFixed(1) + '%';
            progressFill.style.width = Math.min(progress, 100) + '%';
            progressLabel.textContent = progress.toFixed(1) + '%';

            totalShiftsEl.textContent = stats.totalShifts;
            avgHoursEl.textContent = stats.avgHours.toFixed(2);
            completionRateEl.textContent = stats.completionRate.toFixed(1) + '%';
            totalDaysEl.textContent = stats.totalDays;

            // Load target hours
            const settings = await apiFetch('/settings/target');
            targetInput.value = settings.targetHours;

            // Load shifts
            const shiftsData = await apiFetch('/shifts');
            renderTable(shiftsData.shifts);

            // Load DTR info
            const dtrInfo = await apiFetch('/settings/dtr-info');
            if (dtrInfo.dtrInfo) {
                dtrFullName.value = dtrInfo.dtrInfo.full_name || '';
                dtrSchool.value = dtrInfo.dtrInfo.school || '';
                dtrDepartment.value = dtrInfo.dtrInfo.department || '';
                dtrCompany.value = dtrInfo.dtrInfo.company || '';
                dtrPosition.value = dtrInfo.dtrInfo.position || '';
                dtrSupervisor.value = dtrInfo.dtrInfo.supervisor || '';
                dtrSupervisorTitle.value = dtrInfo.dtrInfo.supervisor_title || '';
            }

        } catch (error) {
            console.error('Load dashboard error:', error);
            showAlert('Failed to load dashboard data: ' + error.message, 'error');
        }
    }

    // ---------- RENDER TABLE ----------
    function renderTable(shifts) {
        if (!shifts || shifts.length === 0) {
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

        const sorted = [...shifts].sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = '';
        sorted.forEach(shift => {
            const total = parseFloat(shift.total) || 0;

            const morningStr = shift.morning_in && shift.morning_out ?
                `${formatTime(shift.morning_in)} - ${formatTime(shift.morning_out)}<br>(${calcDuration(shift.morning_in, shift.morning_out).toFixed(2)} hrs)` :
                '-';
            const afternoonStr = shift.afternoon_in && shift.afternoon_out ?
                `${formatTime(shift.afternoon_in)} - ${formatTime(shift.afternoon_out)}<br>(${calcDuration(shift.afternoon_in, shift.afternoon_out).toFixed(2)} hrs)` :
                '-';
            const otStr = shift.overtime_in && shift.overtime_out ?
                `${formatTime(shift.overtime_in)} - ${formatTime(shift.overtime_out)}<br>(${calcDuration(shift.overtime_in, shift.overtime_out).toFixed(2)} hrs)` :
                '-';

            html += `
                <tr>
                    <td>${formatDate(shift.date)}</td>
                    <td>${morningStr}</td>
                    <td>${afternoonStr}</td>
                    <td>${otStr}</td>
                    <td>${total.toFixed(2)} hrs</td>
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

        // Attach event listeners for Edit/Delete
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                if (confirm('Delete this shift?')) {
                    deleteShift(id);
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                loadShiftForEdit(id);
            });
        });
    }

    // ---------- HELPERS ----------
    function formatTime(timeStr) {
        if (!timeStr) return '--:-- --';
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '--:-- --';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function calcDuration(inTime, outTime) {
        if (!inTime || !outTime) return 0;
        const [h1, m1] = inTime.split(':').map(Number);
        const [h2, m2] = outTime.split(':').map(Number);
        let diff = (h2 + m2/60) - (h1 + m1/60);
        if (diff < 0) diff += 24;
        return Math.round(diff * 100) / 100;
    }

    // ---------- SHIFT CRUD ----------
    async function createShift(e) {
        e.preventDefault();

        const date = shiftDate.value;
        if (!date) {
            showAlert('Please select a date.', 'warning');
            return;
        }

        const mIn = morningIn.value;
        const mOut = morningOut.value;
        const aIn = afternoonIn.value;
        const aOut = afternoonOut.value;

        // Validate morning and afternoon (required)
        if (!mIn || !mOut || !aIn || !aOut) {
            showAlert('Please fill in morning and afternoon clock times.', 'warning');
            return;
        }

        // Calculate durations
        const mDur = calcDuration(mIn, mOut);
        const aDur = calcDuration(aIn, aOut);

        // Overtime is OPTIONAL – only calculate if BOTH times are entered
        let oDur = 0;
        let otIn = null;
        let otOut = null;

        if (otStart.value && otEnd.value) {
            otIn = otStart.value;
            otOut = otEnd.value;
            oDur = calcDuration(otIn, otOut);
        }

        const total = mDur + aDur + oDur;

        if (total === 0) {
            showAlert('Shift duration cannot be zero.', 'warning');
            return;
        }

        const payload = {
            date,
            morning_in: mIn,
            morning_out: mOut,
            afternoon_in: aIn,
            afternoon_out: aOut,
            overtime_in: otIn,
            overtime_out: otOut,
            total
        };

        try {
            await apiFetch('/shifts', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showAlert('Shift saved successfully!', 'success');
            loadDashboardData();
            // Reset form (keep date, reset times to defaults)
            morningIn.value = '08:00';
            morningOut.value = '12:00';
            afternoonIn.value = '13:00';
            afternoonOut.value = '17:00';
            otStart.value = '';
            otEnd.value = '';
            calculateDurations();
        } catch (error) {
            showAlert('Failed to save shift: ' + error.message, 'error');
        }
    }

    async function deleteShift(id) {
        try {
            await apiFetch(`/shifts/${id}`, { method: 'DELETE' });
            showAlert('Shift deleted successfully!', 'success');
            loadDashboardData();
        } catch (error) {
            showAlert('Failed to delete shift: ' + error.message, 'error');
        }
    }

    async function loadShiftForEdit(id) {
        try {
            const data = await apiFetch(`/shifts/${id}`);
            const shift = data.shift;
            if (!shift) return;

            shiftDate.value = shift.date;
            morningIn.value = shift.morning_in || '08:00';
            morningOut.value = shift.morning_out || '12:00';
            afternoonIn.value = shift.afternoon_in || '13:00';
            afternoonOut.value = shift.afternoon_out || '17:00';
            otStart.value = shift.overtime_in || '';
            otEnd.value = shift.overtime_out || '';
            calculateDurations();

            shiftForm.onsubmit = async function(e) {
                e.preventDefault();
                await updateShift(id);
                shiftForm.onsubmit = createShift;
            };

            shiftForm.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            showAlert('Failed to load shift: ' + error.message, 'error');
        }
    }

    async function updateShift(id) {
        const date = shiftDate.value;
        const mIn = morningIn.value;
        const mOut = morningOut.value;
        const aIn = afternoonIn.value;
        const aOut = afternoonOut.value;

        // Overtime is OPTIONAL – only calculate if BOTH times are entered
        let oDur = 0;
        let otIn = null;
        let otOut = null;

        if (otStart.value && otEnd.value) {
            otIn = otStart.value;
            otOut = otEnd.value;
            oDur = calcDuration(otIn, otOut);
        }

        const mDur = calcDuration(mIn, mOut);
        const aDur = calcDuration(aIn, aOut);
        const total = mDur + aDur + oDur;

        if (total === 0) {
            showAlert('Shift duration cannot be zero.', 'warning');
            return;
        }

        const payload = {
            date,
            morning_in: mIn,
            morning_out: mOut,
            afternoon_in: aIn,
            afternoon_out: aOut,
            overtime_in: otIn,
            overtime_out: otOut,
            total
        };

        try {
            await apiFetch(`/shifts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showAlert('Shift updated successfully!', 'success');
            loadDashboardData();
            // Reset form to default
            morningIn.value = '08:00';
            morningOut.value = '12:00';
            afternoonIn.value = '13:00';
            afternoonOut.value = '17:00';
            otStart.value = '';
            otEnd.value = '';
            calculateDurations();
        } catch (error) {
            showAlert('Failed to update shift: ' + error.message, 'error');
        }
    }

    // ---------- CALCULATE DURATIONS ----------
    function calculateDurations() {
        const mDur = calcDuration(morningIn.value, morningOut.value);
        morningDurationSpan.textContent = mDur.toFixed(2);

        const aDur = calcDuration(afternoonIn.value, afternoonOut.value);
        afternoonDurationSpan.textContent = aDur.toFixed(2);

        // Overtime – only calculate if BOTH times are entered
        let oDur = 0;
        if (otStart.value && otEnd.value) {
            oDur = calcDuration(otStart.value, otEnd.value);
        }
        otDurationSpan.textContent = oDur.toFixed(2);

        const total = mDur + aDur + oDur;
        totalShiftDurationSpan.textContent = total.toFixed(2);
    }

    // ---------- UPDATE TARGET HOURS ----------
    async function updateTarget() {
        const val = parseFloat(targetInput.value);
        if (!val || val < 1) {
            showAlert('Please enter a valid target hours (minimum 1).', 'warning');
            return;
        }
        try {
            await apiFetch('/settings/target', {
                method: 'PUT',
                body: JSON.stringify({ targetHours: val })
            });
            showAlert('Target hours updated!', 'success');
            loadDashboardData();
        } catch (error) {
            showAlert('Failed to update target: ' + error.message, 'error');
        }
    }

    // ---------- MODAL ----------
    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        apiFetch('/settings/dtr-info').then(data => {
            if (data.dtrInfo) {
                dtrFullName.value = data.dtrInfo.full_name || '';
                dtrSchool.value = data.dtrInfo.school || '';
                dtrDepartment.value = data.dtrInfo.department || '';
                dtrCompany.value = data.dtrInfo.company || '';
                dtrPosition.value = data.dtrInfo.position || '';
                dtrSupervisor.value = data.dtrInfo.supervisor || '';
                dtrSupervisorTitle.value = data.dtrInfo.supervisor_title || '';
            }
        }).catch(console.error);
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async function saveDtrInfo() {
        const payload = {
            fullName: dtrFullName.value,
            school: dtrSchool.value,
            department: dtrDepartment.value,
            company: dtrCompany.value,
            position: dtrPosition.value,
            supervisor: dtrSupervisor.value,
            supervisorTitle: dtrSupervisorTitle.value
        };
        try {
            await apiFetch('/settings/dtr-info', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Failed to save DTR info:', error);
        }
    }

    // ---------- EXPORT FUNCTIONS ----------
    async function downloadExport(endpoint, filename) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            showAlert('Failed to export: ' + error.message, 'error');
        }
    }

    // ---------- MODAL EVENT LISTENERS ----------
    printBtn.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    document.querySelectorAll('#dtrForm input, #dtrForm checkbox').forEach(el => {
        el.addEventListener('change', saveDtrInfo);
        el.addEventListener('input', saveDtrInfo);
    });

    // ---------- EXPORT BUTTONS ----------
    printPdfBtn.addEventListener('click', function() {
        saveDtrInfo();
        downloadExport('/export/pdf', `OJT_DTR_${new Date().toISOString().split('T')[0]}.html`);
    });

    csvBtn.addEventListener('click', function() {
        saveDtrInfo();
        downloadExport('/export/csv', `OJT_DTR_${new Date().toISOString().split('T')[0]}.csv`);
    });

    excelBtn.addEventListener('click', function() {
        saveDtrInfo();
        downloadExport('/export/excel', `OJT_DTR_${new Date().toISOString().split('T')[0]}.xls`);
    });

    // ---------- LOGOUT ----------
    async function logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('ojt_token');
            localStorage.removeItem('ojt_user');
            window.location.href = 'index.html';
        }
    }

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // ---------- INIT ----------
    async function init() {
        if (!getToken()) {
            showAlert('Please login first.', 'warning');
            window.location.href = 'index.html';
            return;
        }

        loadUser();

        const today = new Date().toISOString().split('T')[0];
        shiftDate.value = today;

        if (!morningIn.value) morningIn.value = '08:00';
        if (!morningOut.value) morningOut.value = '12:00';
        if (!afternoonIn.value) afternoonIn.value = '13:00';
        if (!afternoonOut.value) afternoonOut.value = '17:00';
        // Overtime fields start empty (optional)
        otStart.value = '';
        otEnd.value = '';

        shiftForm.addEventListener('submit', createShift);
        updateTargetBtn.addEventListener('click', updateTarget);

        document.querySelectorAll('.shift-form input[type="time"]').forEach(input => {
            input.addEventListener('change', calculateDurations);
            input.addEventListener('input', calculateDurations);
        });

        await loadDashboardData();
        calculateDurations();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();