/**
 * Apex Journal — CoinDCX INR Futures Tracker
 * Main application controller
 */

// ─── State ────────────────────────────────────────────────────────────────────
let currentTab = 'dashboard';
let allTrades = [];
let activeDeleteId = null;

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const views = {
  dashboard: document.getElementById('view-dashboard'),
  trades:    document.getElementById('view-trades')
};

const navBtns       = document.querySelectorAll('.nav-btn, .bottom-nav-btn');
const pageTitle     = document.getElementById('page-title');
const pageSubtitle  = document.getElementById('page-subtitle');

// Modal
const tradeModal    = document.getElementById('trade-modal');
const deleteModal   = document.getElementById('delete-modal');
const tradeForm     = document.getElementById('trade-form');
const modalTitle    = document.getElementById('modal-title');

// Form inputs
const inputId       = document.getElementById('trade-id');
const inputDate     = document.getElementById('trade-date');
const inputCoin     = document.getElementById('trade-coin');
const inputPnl      = document.getElementById('trade-pnl');
const inputNotes    = document.getElementById('trade-notes');
const inputType     = document.getElementById('trade-type');
const coinRow       = document.getElementById('coin-row');
const pnlLabel      = document.getElementById('pnl-label');
const pnlHint       = document.getElementById('pnl-hint');
const quickPnlRow   = document.getElementById('quick-pnl-row');
const typeTabs      = document.querySelectorAll('.type-tab');

// Filters
const filterCoin    = document.getElementById('filter-coin');
const filterType    = document.getElementById('filter-type');
const filterOutcome = document.getElementById('filter-outcome');
const filterSort    = document.getElementById('filter-sort');
const btnReset      = document.getElementById('btn-reset-filters');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupModal();
  setupTypeTabs();
  setupQuickPnl();
  setupFilters();
  fetchAndRender();
});

// ─── Navigation ───────────────────────────────────────────────────────────────
function setupNavigation() {
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab === currentTab) return;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;

  navBtns.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tab);
  });

  Object.entries(views).forEach(([name, el]) => {
    el.classList.toggle('active', name === tab);
  });

  if (tab === 'dashboard') {
    pageTitle.textContent = 'Dashboard';
    pageSubtitle.textContent = 'CoinDCX INR Futures Tracker';
    renderDashboard();
  } else {
    pageTitle.textContent = 'Trade History';
    pageSubtitle.textContent = 'All transactions & trades';
    renderTradesList();
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function setupModal() {
  const openAdd = () => openAddModal();

  document.getElementById('btn-add-desktop').addEventListener('click', openAdd);
  document.getElementById('btn-fab').addEventListener('click', openAdd);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  tradeForm.addEventListener('submit', handleSubmit);

  tradeModal.addEventListener('click', e => { if (e.target === tradeModal) closeModal(); });
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });
  document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);
  document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete);
}

function openAddModal() {
  tradeForm.reset();
  inputId.value = '';
  modalTitle.textContent = 'Log Trade';

  // Set current datetime
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  inputDate.value = new Date(now - offset).toISOString().slice(0, 16);

  // Reset to Trade tab
  setTypeTab('Trade');
  tradeModal.classList.add('active');
}

function closeModal() {
  tradeModal.classList.remove('active');
}

function openDeleteModal(id) {
  activeDeleteId = id;
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  activeDeleteId = null;
}

// ─── Type Tabs ────────────────────────────────────────────────────────────────
function setupTypeTabs() {
  typeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-type');
      setTypeTab(type);
    });
  });
}

function setTypeTab(type) {
  inputType.value = type;

  typeTabs.forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-type') === type);
  });

  if (type === 'Trade') {
    coinRow.style.display = 'block';
    inputCoin.required = true;
    pnlLabel.textContent = 'Profit / Loss (₹)';
    pnlHint.textContent = 'Positive for profit, negative for loss';
    quickPnlRow.style.display = 'flex';
  } else if (type === 'Deposit') {
    coinRow.style.display = 'none';
    inputCoin.required = false;
    inputCoin.value = 'ACCOUNT';
    pnlLabel.textContent = 'Deposit Amount (₹)';
    pnlHint.textContent = 'Enter the amount you deposited to CoinDCX';
    quickPnlRow.style.display = 'none';
    // Force positive
    if (parseFloat(inputPnl.value) < 0) inputPnl.value = '';
  } else if (type === 'Withdraw') {
    coinRow.style.display = 'none';
    inputCoin.required = false;
    inputCoin.value = 'ACCOUNT';
    pnlLabel.textContent = 'Withdraw Amount (₹)';
    pnlHint.textContent = 'Enter the amount you withdrew from CoinDCX';
    quickPnlRow.style.display = 'none';
  }
}

// ─── Quick P&L Buttons ────────────────────────────────────────────────────────
function setupQuickPnl() {
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      inputPnl.value = val;
    });
  });
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function setupFilters() {
  const triggerFilter = debounce(fetchAndRender, 300);
  filterCoin.addEventListener('input', triggerFilter);
  filterType.addEventListener('change', fetchAndRender);
  filterOutcome.addEventListener('change', fetchAndRender);
  filterSort.addEventListener('change', fetchAndRender);

  btnReset.addEventListener('click', () => {
    filterCoin.value = '';
    filterType.value = '';
    filterOutcome.value = '';
    filterSort.value = 'date-desc';
    fetchAndRender();
  });
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// ─── Data Fetching ────────────────────────────────────────────────────────────
async function fetchAndRender() {
  try {
    const filters = {};
    if (currentTab === 'trades') {
      filters.coin   = filterCoin.value;
      filters.type   = filterType.value;
      const sort     = filterSort.value.split('-');
      filters.sortBy    = sort[0];
      filters.sortOrder = sort[1];
    } else {
      filters.sortBy    = 'date';
      filters.sortOrder = 'asc';
    }

    allTrades = await ApiService.getTrades(filters);

    if (currentTab === 'dashboard') {
      renderDashboard();
    } else {
      renderTradesList();
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Error loading data', 'error');
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboard() {
  // Separate trades vs account transactions
  const trades    = allTrades.filter(t => t.type === 'Trade');
  const deposits  = allTrades.filter(t => t.type === 'Deposit');
  const withdraws = allTrades.filter(t => t.type === 'Withdraw');

  const totalDeposited  = deposits.reduce((s, t) => s + Math.abs(t.pnl), 0);
  const totalWithdrawn  = withdraws.reduce((s, t) => s + Math.abs(t.pnl), 0);
  const totalTradePnl   = trades.reduce((s, t) => s + t.pnl, 0);
  const accountBalance  = totalDeposited - totalWithdrawn + totalTradePnl;

  // Account banner
  document.getElementById('stat-deposited').textContent  = formatINR(totalDeposited);
  document.getElementById('stat-withdrawn').textContent  = formatINR(totalWithdrawn);
  document.getElementById('stat-balance').textContent    = formatINR(accountBalance);

  // Trade stats
  const wins   = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const winRate = trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(1) : '0.0';

  const pnlEl = document.getElementById('stat-total-pnl');
  pnlEl.textContent = (totalTradePnl >= 0 ? '+' : '') + formatINR(totalTradePnl);
  pnlEl.className = 'stat-value ' + (totalTradePnl > 0 ? 'text-green' : totalTradePnl < 0 ? 'text-red' : '');
  document.getElementById('stat-pnl-trend').textContent = `${trades.length} trade${trades.length !== 1 ? 's' : ''}`;

  document.getElementById('stat-win-rate').textContent = winRate + '%';
  document.getElementById('stat-win-loss').textContent = `${wins.length} W / ${losses.length} L`;

  // Best / Worst
  const bestTrade  = trades.reduce((best, t) => (!best || t.pnl > best.pnl) ? t : best, null);
  const worstTrade = trades.reduce((worst, t) => (!worst || t.pnl < worst.pnl) ? t : worst, null);

  const bestEl  = document.getElementById('stat-best');
  const worstEl = document.getElementById('stat-worst');

  if (bestTrade) {
    bestEl.textContent = '+' + formatINR(bestTrade.pnl);
    document.getElementById('stat-best-coin').textContent = bestTrade.coin;
  } else {
    bestEl.textContent = '₹0';
    document.getElementById('stat-best-coin').textContent = '--';
  }

  if (worstTrade) {
    worstEl.textContent = formatINR(worstTrade.pnl);
    document.getElementById('stat-worst-coin').textContent = worstTrade.coin;
  } else {
    worstEl.textContent = '₹0';
    document.getElementById('stat-worst-coin').textContent = '--';
  }

  // Apply outcome filter for chart (only closed trades = trades with pnl)
  // We need all trades for cumulative chart — re-fetch without filters
  JournalCharts.updateCharts(trades);
}

// ─── Trade History List ───────────────────────────────────────────────────────
function renderTradesList() {
  const container = document.getElementById('trades-list-container');
  if (!container) return;

  // Apply outcome filter client-side
  let filtered = [...allTrades];
  if (filterOutcome.value === 'win') {
    filtered = filtered.filter(t => t.type === 'Trade' && t.pnl > 0);
  } else if (filterOutcome.value === 'loss') {
    filtered = filtered.filter(t => t.type === 'Trade' && t.pnl < 0);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>No transactions found.</p>
      </div>`;
    return;
  }

  container.innerHTML = '';

  filtered.forEach(trade => {
    const card = document.createElement('div');
    card.className = 'trade-row-card';

    const dateStr = new Date(trade.date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    let iconClass, iconEmoji, pnlClass, amountStr, typeBadgeClass;

    if (trade.type === 'Deposit') {
      iconClass = 'deposit'; iconEmoji = '💰';
      pnlClass = 'deposit';
      amountStr = '+' + formatINR(Math.abs(trade.pnl));
      typeBadgeClass = 'deposit';
    } else if (trade.type === 'Withdraw') {
      iconClass = 'withdraw'; iconEmoji = '🏧';
      pnlClass = 'withdraw';
      amountStr = '-' + formatINR(Math.abs(trade.pnl));
      typeBadgeClass = 'withdraw';
    } else {
      // Trade
      if (trade.pnl > 0) {
        iconClass = 'profit'; iconEmoji = '📈'; pnlClass = 'profit';
        amountStr = '+' + formatINR(trade.pnl);
      } else if (trade.pnl < 0) {
        iconClass = 'loss'; iconEmoji = '📉'; pnlClass = 'loss';
        amountStr = formatINR(trade.pnl);
      } else {
        iconClass = 'deposit'; iconEmoji = '➖'; pnlClass = '';
        amountStr = formatINR(trade.pnl);
      }
      typeBadgeClass = 'trade';
    }

    const noteStr = trade.notes ? `· ${trade.notes}` : '';

    card.innerHTML = `
      <div class="trade-card-icon ${iconClass}">${iconEmoji}</div>
      <div class="trade-card-info">
        <div class="trade-card-top">
          <span class="coin-name">${trade.type === 'Deposit' || trade.type === 'Withdraw' ? trade.type : trade.coin}</span>
          <span class="type-badge ${typeBadgeClass}">${trade.type === 'Trade' ? '⚡ Futures' : trade.type}</span>
        </div>
        <div class="trade-date-note">${dateStr}${noteStr ? ' ' + noteStr : ''}</div>
      </div>
      <div class="trade-card-pnl">
        <span class="pnl-amount ${pnlClass}">${amountStr}</span>
      </div>
      <button class="card-delete-btn" data-id="${trade.id}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    `;

    // Click card = edit (but not delete btn)
    card.addEventListener('click', e => {
      if (e.target.closest('.card-delete-btn')) return;
      openEditModal(trade.id);
    });

    card.querySelector('.card-delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      openDeleteModal(trade.id);
    });

    container.appendChild(card);
  });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();

  const type = inputType.value;
  const pnlVal = parseFloat(inputPnl.value);

  if (isNaN(pnlVal)) {
    showToast('Please enter a valid amount', 'error');
    return;
  }

  // For deposit/withdraw, amount must be positive, stored as-is (positive=deposit) or negative (withdraw)
  let finalPnl = pnlVal;
  if (type === 'Deposit') finalPnl = Math.abs(pnlVal);
  if (type === 'Withdraw') finalPnl = -Math.abs(pnlVal); // store as negative for calc

  // Actually let's keep deposit positive and withdraw as stored amount (positive shown as withdrawn)
  // But our dashboard uses abs(pnl) for deposits and abs(pnl) for withdrawals
  // So store both as positive, differentiate by type
  finalPnl = Math.abs(pnlVal);
  // For trades: keep sign as entered
  if (type === 'Trade') finalPnl = pnlVal;

  const coinValue = type === 'Trade'
    ? (inputCoin.value.trim().toUpperCase() || 'UNKNOWN')
    : 'ACCOUNT';

  const data = {
    date: new Date(inputDate.value).toISOString(),
    coin: coinValue,
    pnl: finalPnl,
    type,
    notes: inputNotes.value.trim()
  };

  const id = inputId.value;
  try {
    if (id) {
      await ApiService.updateTrade(id, data);
      showToast('Updated!', 'success');
    } else {
      await ApiService.createTrade(data);
      showToast('Saved!', 'success');
    }
    closeModal();
    fetchAndRender();
  } catch (err) {
    showToast(err.message || 'Save failed', 'error');
  }
}

async function openEditModal(id) {
  try {
    const trade = await ApiService.getTrade(id);
    inputId.value = trade.id;

    const d = new Date(trade.date);
    inputDate.value = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setTypeTab(trade.type);
    if (trade.type === 'Trade') {
      inputCoin.value = trade.coin;
    }
    inputPnl.value = trade.pnl;
    inputNotes.value = trade.notes || '';

    modalTitle.textContent = 'Edit Entry';
    tradeModal.classList.add('active');
  } catch (err) {
    showToast('Failed to load entry', 'error');
  }
}

async function confirmDelete() {
  if (!activeDeleteId) return;
  try {
    await ApiService.deleteTrade(activeDeleteId);
    closeDeleteModal();
    showToast('Deleted', 'success');
    fetchAndRender();
  } catch (err) {
    showToast(err.message || 'Delete failed', 'error');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatINR(amount) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return (amount < 0 ? '-' : '') + '₹' + formatted;
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: ${type === 'error' ? 'hsl(354,78%,57%)' : type === 'success' ? 'hsl(142,76%,38%)' : 'hsl(222,25%,20%)'};
    color: #fff;
    padding: 10px 20px;
    border-radius: 24px;
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    transition: opacity 0.3s, transform 0.3s;
    opacity: 0;
    font-family: var(--font-main);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}
