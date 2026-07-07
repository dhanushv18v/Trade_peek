/**
 * Chart management module — CoinDCX INR Futures Journal
 */
let cumulativePnlChart = null;
let pnlDistributionChart = null;

const JournalCharts = {
  updateCharts(trades) {
    // trades = only Trade type (already filtered in app.js)
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    this.renderCumulativePnl(sorted);
    this.renderPnlDistribution(sorted);
  },

  renderCumulativePnl(trades) {
    const canvas = document.getElementById('chart-cumulative-pnl');
    if (!canvas) return;

    if (cumulativePnlChart) cumulativePnlChart.destroy();

    let cum = 0;
    const dataPoints = [0];
    const labels = ['Start'];

    trades.forEach(t => {
      cum += t.pnl;
      dataPoints.push(Number(cum.toFixed(2)));
      const d = new Date(t.date);
      const fmt = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      labels.push(`${fmt} · ${t.coin}`);
    });

    const ctx = canvas.getContext('2d');
    const finalPnl = dataPoints[dataPoints.length - 1] || 0;
    const isPositive = finalPnl >= 0;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 200);
    gradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    const lineColor = isPositive ? '#10b981' : '#ef4444';

    cumulativePnlChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Cumulative P&L (₹)',
          data: dataPoints,
          borderColor: lineColor,
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: lineColor,
          pointBorderColor: 'rgba(255,255,255,0.8)',
          pointBorderWidth: 1.5,
          pointRadius: trades.length > 25 ? 0 : 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a2235',
            titleFont: { family: 'Outfit', size: 12, weight: 'bold' },
            bodyFont: { family: 'Outfit', size: 12 },
            borderColor: '#2d3a56',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label(ctx) {
                const v = ctx.parsed.y;
                return `Total P&L: ${v >= 0 ? '+' : ''}₹${Math.abs(v).toLocaleString('en-IN')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#7a8ba8',
              font: { family: 'Outfit', size: 9 },
              maxRotation: 40,
              autoSkip: true,
              maxTicksLimit: 7
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: {
              color: '#7a8ba8',
              font: { family: 'Outfit', size: 10 },
              callback(v) {
                return (v >= 0 ? '₹' : '-₹') + Math.abs(v).toLocaleString('en-IN');
              }
            }
          }
        }
      }
    });
  },

  renderPnlDistribution(trades) {
    const canvas = document.getElementById('chart-pnl-distribution');
    if (!canvas) return;

    if (pnlDistributionChart) pnlDistributionChart.destroy();

    const wins   = trades.filter(t => t.pnl > 0).length;
    const losses = trades.filter(t => t.pnl < 0).length;
    const flat   = trades.filter(t => t.pnl === 0).length;

    const hasData = trades.length > 0;

    const ctx = canvas.getContext('2d');
    pnlDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: hasData ? ['Profits', 'Losses', 'Breakeven'] : ['No Trades'],
        datasets: [{
          data: hasData ? [wins, losses, flat] : [1],
          backgroundColor: hasData
            ? ['#10b981', '#ef4444', '#4b5563']
            : ['#2d3a56'],
          borderWidth: 2,
          borderColor: '#141c2e',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8b9bb4',
              padding: 14,
              font: { family: 'Outfit', size: 11, weight: '600' },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1a2235',
            titleFont: { family: 'Outfit', size: 12, weight: 'bold' },
            bodyFont: { family: 'Outfit', size: 12 },
            borderColor: '#2d3a56',
            borderWidth: 1,
            callbacks: {
              label(ctx) {
                if (!hasData) return ' No trades yet';
                const total = wins + losses + flat;
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
};
