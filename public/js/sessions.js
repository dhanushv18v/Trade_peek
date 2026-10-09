/**
 * Sessions — Live IST Market Sessions page controller
 */

// ── Session definitions (all times in IST minutes from midnight) ─────────────
const SESSIONS = [
  {
    id: 'sydney',
    name: 'Sydney',
    code: 'SYD',
    start: 3 * 60 + 30,   // 3:30 AM  = 210 min
    end:  12 * 60 + 30,   // 12:30 PM = 750 min
    color: '#a855f7',     // purple
    overlap: false
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    code: 'TYO',
    start: 4 * 60 + 30,   // 4:30 AM  = 270 min
    end:  13 * 60 + 30,   // 1:30 PM  = 810 min
    color: '#f97316',     // orange
    overlap: false
  },
  {
    id: 'london',
    name: 'London',
    code: 'LDN',
    start: 12 * 60 + 30,  // 12:30 PM = 750 min
    end:  21 * 60 + 30,   // 9:30 PM  = 1290 min
    color: '#00cfff',     // cyan
    overlap: false
  },
  {
    id: 'newyork',
    name: 'New York',
    code: 'NY',
    start: 18 * 60 + 30,  // 6:30 PM  = 1110 min
    end:   3 * 60 + 30,   // 3:30 AM next day = 210 min (wraps midnight)
    color: '#e63957',     // red
    overlap: false,
    wraps: true
  }
];

// ── Volatility data: representative waveform across 24h (IST) ────────────────
// 145 points, one every ~10 minutes. Index 0 = midnight IST.
function buildVolatilityData() {
  const pts = [];
  for (let m = 0; m < 1440; m += 10) {
    let v = 0.1 + 0.08 * Math.sin(m / 60 * Math.PI * 0.4);

    // Sydney low-moderate hump 210-750 min
    if (m >= 210 && m <= 750) {
      const t = (m - 210) / 540;
      v += 0.18 * Math.sin(t * Math.PI) + 0.06 * Math.random();
    }
    // Tokyo moderate hump 270-810 min
    if (m >= 270 && m <= 810) {
      const t = (m - 270) / 540;
      v += 0.25 * Math.sin(t * Math.PI) + 0.07 * Math.random();
    }
    // London high spike 750-1290 min
    if (m >= 750 && m <= 1290) {
      const t = (m - 750) / 540;
      v += 0.42 * Math.sin(t * Math.PI) + 0.09 * Math.random();
    }
    // NY very high spike 1110-1290 min (overlap) + 1290-1440 + 0-210
    if (m >= 1110 && m <= 1290) {
      const t = (m - 1110) / 180;
      v += 0.55 * Math.sin(t * Math.PI) + 0.1 * Math.random();
    }
    if (m >= 1290 && m <= 1440) {
      const t = (m - 1290) / 150;
      v += 0.28 * (1 - t) + 0.08 * Math.random();
    }
    if (m >= 0 && m < 210) {
      const t = m / 210;
      v += 0.18 * (1 - t) + 0.06 * Math.random();
    }

    pts.push(Math.min(Math.max(v, 0.05), 1));
  }
  return pts;
}

// ── Colour each point by dominant session ────────────────────────────────────
function buildSegmentColors(dataLen) {
  const colors = [];
  for (let i = 0; i < dataLen; i++) {
    const m = i * 10;
    // Priority: overlap > NY > London > Tokyo > Sydney > grey
    const inLondon  = m >= 750  && m <= 1290;
    const inNY      = (m >= 1110 && m <= 1440) || m < 210;
    const inTokyo   = m >= 270  && m <= 810;
    const inSydney  = m >= 210  && m <= 750;

    if (inLondon && inNY) { colors.push('#e63957'); }       // overlap = very high
    else if (inNY)         { colors.push('#e63957'); }
    else if (inLondon)     { colors.push('#00cfff'); }
    else if (inTokyo)      { colors.push('#f97316'); }
    else if (inSydney)     { colors.push('#a855f7'); }
    else                   { colors.push('#22d27f'); }
  }
  return colors;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getISTMinutes() {
  const now = new Date();
  // Convert local JS Date to IST (UTC+5:30)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 5.5 * 3600 * 1000);
  return ist.getHours() * 60 + ist.getMinutes();
}

function getISTDate() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5.5 * 3600 * 1000);
}

function isSessionActive(session, minutesIST) {
  if (session.wraps) {
    return minutesIST >= session.start || minutesIST < session.end;
  }
  return minutesIST >= session.start && minutesIST < session.end;
}

function minutesToPercent(min) {
  return (min / 1440) * 100;
}

// ── State ─────────────────────────────────────────────────────────────────────
let volatilityChartInstance = null;
let sessionsInited = false;

// ── Init (called when tab is activated) ──────────────────────────────────────
window.initSessionsPage = function () {
  if (!sessionsInited) {
    buildVolatilityChart();
    initHoverCursor();
    window.addEventListener('resize', tick);
    // Live clock — update every second
    setInterval(tick, 1000);
    sessionsInited = true;
  }
  tick();
};

// ── Tick: updates clock + active session state ────────────────────────────────
function tick() {
  const ist   = getISTDate();
  const mins  = ist.getHours() * 60 + ist.getMinutes();
  const secs  = ist.getSeconds();

  // Format time 12h
  let h = ist.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mm = String(ist.getMinutes()).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const timeStr = `${h}:${mm}:${ss} ${ampm}`;

  const timeEl = document.getElementById('ist-time-display');
  if (timeEl) timeEl.textContent = timeStr;

  // Determine active sessions
  const activeSessions = SESSIONS.filter(s => isSessionActive(s, mins));
  const activeEl = document.getElementById('ist-active-session');

  if (activeEl) {
    if (activeSessions.length === 0) {
      activeEl.textContent = 'Market Closed';
      activeEl.style.color = 'var(--text-muted)';
    } else if (activeSessions.length === 1) {
      activeEl.textContent = `${activeSessions[0].name} (${activeSessions[0].code})`;
      activeEl.style.color = activeSessions[0].color;
    } else {
      // Overlap
      activeEl.textContent = activeSessions.map(s => s.code).join(' + ') + ' Overlap';
      activeEl.style.color = '#e63957';
    }
  }

  // Update session card glows
  SESSIONS.forEach(s => {
    const card = document.getElementById(`scard-${s.id}`);
    const dot  = document.getElementById(`dot-${s.id}`);
    const active = isSessionActive(s, mins);
    if (card) card.classList.toggle('session-card--active', active);
    if (dot)  dot.classList.toggle('dot--live', active);
  });

  // ── Now-line + unified indicator positioning ──────────────────
  const nowPct    = minutesToPercent(mins + secs / 60); // 0..100
  const combined  = document.getElementById('session-combined-block');
  const nowLine   = document.getElementById('tl-now-line');
  const indicator = document.getElementById('now-indicator');
  const timeInline = document.getElementById('now-time-inline');

  if (combined) {
    const firstTrack = combined.querySelector('.tl-track');
    const rulerRow   = combined.querySelector('.tl-ruler-row');
    if (firstTrack && rulerRow) {
      const blockRect = combined.getBoundingClientRect();
      const trackRect = firstTrack.getBoundingClientRect();
      const rulerTop  = rulerRow.getBoundingClientRect().top - blockRect.top;

      // Center the 2px line on xPx (subtract 1)
      const xPx = (trackRect.left - blockRect.left) + (nowPct / 100) * trackRect.width - 1;

      if (nowLine) nowLine.style.left = xPx + 'px';

      // Inline time label inside indicator
      if (timeInline) timeInline.textContent = `${h}:${mm} ${ampm}`;

      if (indicator) {
        indicator.style.left = (xPx + 1) + 'px';
        // Indicator height ~32px (time label + gap + diamond);
        // position bottom 18px above ruler so rings never cover ruler labels
        indicator.style.top = Math.max(4, rulerTop - 50) + 'px';
      }
    }
  }
}

// ── Hover cursor: shows time badge at cursor position on timeline ──────────────
function initHoverCursor() {
  const combined    = document.getElementById('session-combined-block');
  const cursorLine  = document.getElementById('tl-cursor-line');
  const cursorBadge = document.getElementById('tl-cursor-badge');
  if (!combined || !cursorLine || !cursorBadge) return;

  function formatMinutes(m) {
    const total = Math.max(0, Math.min(1439, Math.round(m)));
    const h24   = Math.floor(total / 60) % 24;
    const min   = total % 60;
    const ampm  = h24 >= 12 ? 'PM' : 'AM';
    const h12   = (h24 % 12) || 12;
    return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
  }

  combined.addEventListener('mousemove', (e) => {
    const firstTrack = combined.querySelector('.tl-track');
    if (!firstTrack) return;

    const blockRect = combined.getBoundingClientRect();
    const trackRect = firstTrack.getBoundingClientRect();

    // x of cursor relative to the block
    const xInBlock = e.clientX - blockRect.left;

    // time at cursor: x relative to track start → percentage → minutes
    const xInTrack = e.clientX - trackRect.left;
    const pct      = Math.max(0, Math.min(1, xInTrack / trackRect.width));
    const minutes  = pct * 1440;

    // Ghost cursor line: spans full block height
    cursorLine.style.left    = xInBlock + 'px';
    cursorLine.style.display = 'block';

    // Time badge: floats ABOVE the ruler labels (CSS translateY(-100%) handles this)
    const rulerRow = combined.querySelector('.tl-ruler-row');
    const badgeTop = rulerRow
      ? (rulerRow.getBoundingClientRect().top - blockRect.top)
      : 44;

    cursorBadge.textContent   = formatMinutes(minutes);
    cursorBadge.style.left    = xInBlock + 'px';
    cursorBadge.style.top     = badgeTop + 'px';
    cursorBadge.style.display = 'block';
  });

  combined.addEventListener('mouseleave', () => {
    cursorLine.style.display  = 'none';
    cursorBadge.style.display = 'none';
  });
}

// ── Volatility Chart ──────────────────────────────────────────────────────────
function buildVolatilityChart() {
  const canvas = document.getElementById('volatility-chart');
  if (!canvas) return;
  if (volatilityChartInstance) {
    volatilityChartInstance.destroy();
    volatilityChartInstance = null;
  }

  const data   = buildVolatilityData();
  const colors = buildSegmentColors(data.length);

  // X labels: midnight to midnight
  const labels = [];
  for (let i = 0; i < data.length; i++) {
    const m = i * 10;
    if (m % 120 === 0) {
      const h = (m / 60) % 24;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const disp = (h % 12 || 12) + (h % 60 === 0 ? '' : ':30') + ' ' + ampm;
      labels.push(h === 0 ? '12 AM' : h === 12 ? '12 PM' : disp);
    } else {
      labels.push('');
    }
  }

  volatilityChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: colors,
        borderWidth: 2.2,
        pointRadius: 0,
        fill: false,
        tension: 0.45,
        segment: {
          borderColor: ctx => colors[ctx.p0DataIndex] || '#22d27f'
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              if (v > 0.7) return 'Very High';
              if (v > 0.45) return 'High';
              if (v > 0.25) return 'Moderate';
              return 'Low';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'hsla(222,22%,22%,0.4)', lineWidth: 1 },
          ticks: {
            color: 'hsl(210,10%,46%)',
            font: { size: 9, family: "'Outfit', sans-serif" },
            maxRotation: 0
          }
        },
        y: {
          min: 0,
          max: 1,
          display: false   /* y-axis labels are now HTML in .vol-y-axis */
        }
      }
    }
  });
}
