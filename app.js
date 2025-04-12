// Initialize app
// Hide sections on load
document.getElementById('operatorSection').classList.add('hidden');
document.getElementById('supervisorSection').classList.add('hidden');

// Timer variables
let isTimerRunning = false;
let startTime;
let interval;

// Timer functions
function updateTimerDisplay() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  document.getElementById('timerDisplay').textContent = 
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
  if (!isTimerRunning) {
    isTimerRunning = true;
    startTime = Date.now();
    interval = setInterval(updateTimerDisplay, 1000);
    document.querySelector('.start-btn').classList.add('hidden');
    document.querySelector('.stop-btn').classList.remove('hidden');
    document.getElementById('unitsProduced').disabled = true;
    document.getElementById('cycleTime').value = '0.00';
    startCycleTime(); // Start cycle time tracking when timer starts
  }
}

function stopTimer() {
  if (!isTimerRunning) return;
  
  isTimerRunning = false;
  clearInterval(interval);
  document.querySelector('.start-btn').classList.remove('hidden');
  document.querySelector('.stop-btn').classList.add('hidden');
  
  // Calculate total time in minutes
  const endTime = Date.now();
  const totalMinutes = ((endTime - startTime) / (1000 * 60)).toFixed(2);
  
  // Stop cycle time tracking and update the display
  clearInterval(cycleTimeInterval);
  const cycleTimeElement = document.getElementById('cycleTime');
  cycleTimeElement.value = totalMinutes;
  
  // Enable and focus on units produced input
  const unitsInput = document.getElementById('unitsProduced');
  unitsInput.disabled = false;
  unitsInput.focus();
  
  // Reset startTime to ensure next timer starts fresh
  startTime = null;
}

// Event listeners
document.getElementById('operatorModeBtn').addEventListener('click', function() {
  document.getElementById('operatorSection').classList.toggle('hidden');
  document.getElementById('supervisorSection').classList.add('hidden');
});
document.getElementById('supervisorModeBtn').addEventListener('click', function() {
  document.getElementById('supervisorSection').classList.toggle('hidden');
  document.getElementById('operatorSection').classList.add('hidden');
});

  document.querySelector('.start-btn').addEventListener('click', startTimer);
  document.querySelector('.stop-btn').addEventListener('click', stopTimer);

  // State management
let logs = JSON.parse(localStorage.getItem('productionLogs') || '[]');
let cycleTimeStart = null;
let cycleTimeInterval = null;

// DOM Elements
const operatorSection = document.getElementById('operatorSection');
const supervisorSection = document.getElementById('supervisorSection');
const operatorForm = document.getElementById('operatorForm');
const toast = document.getElementById('toast');

// Mode switching
document.getElementById('operatorModeBtn').addEventListener('click', () => {
  operatorSection.classList.remove('hidden');
  supervisorSection.classList.add('hidden');
  startCycleTime();
  // Hide QR scanner when switching to operator mode
  document.getElementById('qr-reader').classList.add('hidden');
  // Update operator table
  updateOperatorTable();
});

document.getElementById('supervisorModeBtn').addEventListener('click', () => {
  supervisorSection.classList.remove('hidden');
  operatorSection.classList.add('hidden');
  // Stop QR scanner and hide it when switching to supervisor mode
  qrScanner.stop();
  document.getElementById('qr-reader').classList.add('hidden');
  // Update supervisor table and analytics
  updateSupervisorTable();
  updateAnalyticsDashboard();
});

// Add event listeners for filter changes
document.getElementById('filterDate').addEventListener('change', () => {
  updateSupervisorTable();
  updateAnalyticsDashboard();
});

document.getElementById('filterShift').addEventListener('change', () => {
  updateSupervisorTable();
  updateAnalyticsDashboard();
});

// Cycle time tracking
function startCycleTime() {
  cycleTimeStart = Date.now();
  cycleTimeInterval = setInterval(() => {
    if (isTimerRunning && startTime) {
      const elapsed = ((Date.now() - startTime) / (1000 * 60)).toFixed(2);
      document.getElementById('cycleTime').value = elapsed;
    }
  }, 100);
}

function stopCycleTime() {
  if (cycleTimeInterval) {
    clearInterval(cycleTimeInterval);
    cycleTimeInterval = null;
  }
  const finalTime = cycleTimeStart ? ((Date.now() - cycleTimeStart) / 1000).toFixed(1) : '0.0';
  document.getElementById('cycleTime').textContent = finalTime;
  cycleTimeStart = null; // Reset cycle time start
  return finalTime;
}

// Form validation and submission
operatorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Reset error states
  document.querySelectorAll('.error-message').forEach(msg => msg.style.display = 'none');
  let hasError = false;

  // Validate required fields
  const requiredFields = ['operatorName', 'machineName', 'unitsProduced', 'shift'];
  requiredFields.forEach(field => {
    const input = document.getElementById(field);
    const errorMsg = input.nextElementSibling;
    if (!input.value.trim()) {
      errorMsg.style.display = 'block';
      hasError = true;
    }
  });

  // Validate units produced is a positive number
  const unitsProduced = document.getElementById('unitsProduced');
  if (!unitsProduced.value || parseInt(unitsProduced.value) <= 0) {
    unitsProduced.nextElementSibling.textContent = 'Please enter a positive number';
    unitsProduced.nextElementSibling.style.display = 'block';
    hasError = true;
  }

  if (hasError) return;

  // Show loading state
  const submitBtn = operatorForm.querySelector('button[type="submit"]');
  submitBtn.classList.add('loading');

  try {
    // Get the final cycle time from the input
    const finalCycleTime = parseFloat(document.getElementById('cycleTime').value) || 0;

    // Create log entry
    const currentCycleTime = finalCycleTime;
    const currentUnits = parseInt(document.getElementById('unitsProduced').value);
    
    const logEntry = {
      id: Date.now(),
      name: document.getElementById('operatorName').value,
      machine: document.getElementById('machineName').value,
      cycleTime: currentCycleTime,
      units: currentUnits,
      avgTimePerUnit: (currentCycleTime / currentUnits).toFixed(2),
      remarks: document.getElementById('remarks').value,
      shift: document.getElementById('shift').value,
      timestamp: new Date().toISOString()
    };

    // Save to local storage
    logs.push(logEntry);
    localStorage.setItem('productionLogs', JSON.stringify(logs));

    // Update tables
    updateOperatorTable();
    updateSupervisorTable();
    updateAnalyticsDashboard();

    // Reset form and start new cycle
    operatorForm.reset();
    document.getElementById('cycleTime').textContent = '0.0';
    cycleTimeStart = null;
    startCycleTime();
    showToast('Log entry saved successfully');
  } catch (error) {
    showToast('Error saving log entry', true);
    console.error('Error:', error);
  } finally {
    submitBtn.classList.remove('loading');
  }
});

// Update operator table with today's logs
function updateOperatorTable() {
  const tbody = document.querySelector('#operatorLogs tbody');
  const today = new Date().toDateString();
  
  const todayLogs = logs.filter(log => 
    new Date(log.timestamp).toDateString() === today
  );

  tbody.innerHTML = todayLogs.map(log => `
    <tr>
      <td>${log.name}</td>
      <td>${log.machine}</td>
      <td>${log.cycleTime}</td>
      <td>${log.units}</td>
      <td>${log.avgTimePerUnit}</td>
      <td>${log.remarks}</td>
    </tr>
  `).join('');
}

// Update supervisor table with filtered logs
function updateSupervisorTable() {
  const tbody = document.querySelector('#supervisorLogs tbody');
  const filterDate = document.getElementById('filterDate').value;
  const filterShift = document.getElementById('filterShift').value;

  let filteredLogs = [...logs];

  if (filterDate) {
    filteredLogs = filteredLogs.filter(log => 
      log.timestamp.startsWith(filterDate)
    );
  }

  if (filterShift) {
    filteredLogs = filteredLogs.filter(log => 
      log.shift === filterShift
    );
  }

  tbody.innerHTML = filteredLogs.map(log => `
    <tr>
      <td>${log.name}</td>
      <td>${log.machine}</td>
      <td>${log.cycleTime}</td>
      <td>${log.units}</td>
      <td>${log.avgTimePerUnit}</td>
      <td>${log.remarks}</td>
    </tr>
  `).join('');
}

// Analytics dashboard
function updateAnalyticsDashboard() {
  const filterDate = document.getElementById('filterDate').value;
  const filterShift = document.getElementById('filterShift').value;

  let filteredLogs = [...logs];

  if (filterDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp).toISOString().split('T')[0] === filterDate
    );
  }

  if (filterShift) {
    filteredLogs = filteredLogs.filter(log => 
      log.shift === filterShift
    );
  }

  // Update analytics summary elements
  document.getElementById('totalUnits').textContent = filteredLogs.reduce((sum, log) => sum + log.units, 0);
  document.getElementById('averageCycleTime').textContent = filteredLogs.length ? 
    (filteredLogs.reduce((sum, log) => sum + log.cycleTime, 0) / filteredLogs.length).toFixed(2) : '0.00';
  document.getElementById('bestCycleTime').textContent = filteredLogs.length ? 
    Math.min(...filteredLogs.map(log => log.cycleTime)).toFixed(2) : '0.00';

  // Calculate metrics
  const totalUnits = filteredLogs.reduce((sum, log) => sum + log.units, 0);
  const avgCycleTime = filteredLogs.length ? 
    (filteredLogs.reduce((sum, log) => sum + log.cycleTime, 0) / filteredLogs.length).toFixed(2) : 0;
  const bestCycleTime = filteredLogs.length ? 
    Math.min(...filteredLogs.map(log => log.cycleTime)) : 0;

  // Find top operator
  const operatorStats = {};
  filteredLogs.forEach(log => {
    if (!operatorStats[log.name]) {
      operatorStats[log.name] = { units: 0, cycleTime: 0 };
    }
    operatorStats[log.name].units += log.units;
    operatorStats[log.name].cycleTime += log.cycleTime;
  });

  const topOperator = Object.entries(operatorStats).sort((a, b) => 
    b[1].units - a[1].units
  )[0];

  // Update metrics display
  document.getElementById('totalUnits').textContent = totalUnits;
  document.getElementById('averageCycleTime').textContent = avgCycleTime;
  document.getElementById('bestCycleTime').textContent = bestCycleTime;
  document.getElementById('topOperator').textContent = topOperator ? 
    `${topOperator[0]} (${topOperator[1].units} units)` : '-';

  // Update charts
  updateCharts(filteredLogs);
}

// Chart management
let unitChart, cycleChart;

function updateCharts(filteredLogs) {
  const ctx1 = document.getElementById('unitChart');
  const ctx2 = document.getElementById('cycleChart');

  if (!ctx1 || !ctx2) return; // Guard against missing canvas elements

  // Destroy existing charts
  if (unitChart) unitChart.destroy();
  if (cycleChart) cycleChart.destroy();

  // Prepare data
  const chartData = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { units: 0, cycleTimes: [] };
    }
    acc[date].units += log.units;
    acc[date].cycleTimes.push(log.cycleTime);
    return acc;
  }, {});

  const labels = Object.keys(chartData).sort((a, b) => new Date(a) - new Date(b));
  const unitData = labels.map(date => chartData[date].units);
  const cycleTimeData = labels.map(date => {
    const times = chartData[date].cycleTimes;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  });

  // Create new charts
  unitChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Units Produced',
        data: unitData,
        backgroundColor: '#3498db'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Daily Production Units'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  cycleChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Average Cycle Time',
        data: cycleTimeData,
        borderColor: '#2ecc71',
        tension: 0.1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Daily Average Cycle Time'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Chart visibility toggle
function toggleChart(chartId) {
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  
  canvas.classList.toggle('hidden');
  // Force chart resize after toggling visibility
  const chart = chartId === 'unitChart' ? unitChart : cycleChart;
  if (chart && !canvas.classList.contains('hidden')) {
    chart.resize();
  }
}

// Toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Export to Excel
function exportLogsToExcel() {
  const filterDate = document.getElementById('filterDate').value;
  const filterShift = document.getElementById('filterShift').value;

  let filteredLogs = [...logs];

  if (filterDate) {
    filteredLogs = filteredLogs.filter(log => 
      log.timestamp.startsWith(filterDate)
    );
  }

  if (filterShift) {
    filteredLogs = filteredLogs.filter(log => 
      log.shift === filterShift
    );
  }

  // Create CSV content
  const headers = ['Date', 'Shift', 'Name', 'Machine', 'Cycle Time', 'Units', 'Avg Time/Unit', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleDateString(),
      log.shift,
      log.name,
      log.machine,
      log.cycleTime,
      log.units,
      log.avgTimePerUnit,
      `"${log.remarks}"`
    ].join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `production_logs_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Initial setup
updateOperatorTable();
updateSupervisorTable();
updateAnalyticsDashboard();
startCycleTime();

// QR Scanner event handlers
document.getElementById('machineName').addEventListener('change', () => {
  // Save machine name to local storage when manually entered
  const machineName = document.getElementById('machineName').value;
  if (machineName) {
    localStorage.setItem('lastMachineName', machineName);
  }
});

// Load last used machine name
const lastMachineName = localStorage.getItem('lastMachineName');
if (lastMachineName) {
  document.getElementById('machineName').value = lastMachineName;
}
document.getElementById('filterDate').valueAsDate = new Date();


function resetForm() {
  // Stop and reset timer
  isTimerRunning = false;
  clearInterval(interval);
  clearInterval(cycleTimeInterval);
  document.getElementById('timerDisplay').textContent = '00:00:00';
  cycleTimeStart = null;
  startTime = null;
  
  // Reset button states
  document.querySelector('.start-btn').classList.remove('hidden');
  document.querySelector('.stop-btn').classList.add('hidden');
  
  // Clear form inputs
  document.getElementById('operatorName').value = '';
  document.getElementById('machineName').value = '';
  document.getElementById('unitsProduced').value = '';
  document.getElementById('shift').selectedIndex = 0;
  document.getElementById('remarks').value = '';
  document.getElementById('cycleTime').value = '0.00';
  
  // Enable inputs
  document.getElementById('unitsProduced').disabled = false;
  
  // Update tables
  updateOperatorTable();
  updateSupervisorTable();
  updateAnalyticsDashboard();
}
document.getElementById('filterDate').valueAsDate = new Date();