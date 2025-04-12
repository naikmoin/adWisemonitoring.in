// Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize QR Scanner
    window.qrScanner = new QRScanner();
    
    // Initialize mode sections
    const operatorSection = document.getElementById('operatorSection');
    const supervisorSection = document.getElementById('supervisorSection');
    
    // Check localStorage for saved mode
    const savedMode = localStorage.getItem('selectedMode');
    if (savedMode === 'operator') {
      operatorSection.classList.remove('hidden');
    } else if (savedMode === 'supervisor') {
      supervisorSection.classList.remove('hidden');
    } else {
      operatorSection.classList.add('hidden');
      supervisorSection.classList.add('hidden');
    }
  
    // Start cycle time tracking for operator mode
    startCycleTime();
  
    // Initialize tables
    updateOperatorTable();
    updateSupervisorTable();
    updateAnalyticsDashboard();
  
    // Initialize date filter with today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
  
    // Initialize event listeners for mode switching
    document.getElementById('operatorModeBtn').addEventListener('click', () => {
      operatorSection.classList.remove('hidden');
      supervisorSection.classList.add('hidden');
      localStorage.setItem('selectedMode', 'operator');
      startCycleTime();
    });
  
    document.getElementById('supervisorModeBtn').addEventListener('click', () => {
      supervisorSection.classList.remove('hidden');
      operatorSection.classList.add('hidden');
      localStorage.setItem('selectedMode', 'supervisor');
      stopCycleTime();
    });
  });