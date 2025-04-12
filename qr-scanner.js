// QR Scanner Implementation (Refined)
class QRScanner {
    constructor() {
      this.video = document.createElement('video');
      this.canvasElement = document.getElementById('qr-canvas');
      this.canvas = this.canvasElement.getContext('2d');
      this.loadingMessage = document.getElementById('loadingMessage');
      this.outputContainer = document.getElementById('output');
      this.outputMessage = document.getElementById('outputMessage');
      this.outputData = document.getElementById('outputData');
      this.currentStream = null;
      this.currentCamera = 'environment';
    }
  
    async start() {
      console.log("🔍 Starting QR scanner...");
  
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("❌ Camera API not supported.");
        this.loadingMessage.textContent = "Camera API not supported by this browser.";
        return;
      }
  
      try {
        this.currentStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: this.currentCamera }
        });
  
        console.log("📸 Camera stream started.");
        this.video.srcObject = this.currentStream;
        this.video.setAttribute('playsinline', true);
        await this.video.play();
  
        const qrReader = document.getElementById('qr-reader');
        if (!qrReader.contains(this.video)) {
          qrReader.appendChild(this.video);
        }
  
        requestAnimationFrame(() => this.tick());
      } catch (err) {
        console.error("⚠️ Error accessing camera:", err);
        this.loadingMessage.textContent = `Error accessing camera: ${err.message}`;
      }
    }
  
    async switchCamera() {
      this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
      console.log("🔄 Switching camera to:", this.currentCamera);
  
      this.stop();
      await this.start();
    }
  
    drawLine(begin, end, color) {
      this.canvas.beginPath();
      this.canvas.moveTo(begin.x, begin.y);
      this.canvas.lineTo(end.x, end.y);
      this.canvas.lineWidth = 4;
      this.canvas.strokeStyle = color;
      this.canvas.stroke();
    }
  
    tick() {
      if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
        this.loadingMessage.hidden = true;
        this.canvasElement.hidden = false;
        this.outputContainer.hidden = false;
  
        this.canvasElement.height = this.video.videoHeight;
        this.canvasElement.width = this.video.videoWidth;
        this.canvas.drawImage(this.video, 0, 0, this.canvasElement.width, this.canvasElement.height);
  
        const imageData = this.canvas.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
  
        if (code) {
          this.drawLine(code.location.topLeftCorner, code.location.topRightCorner, '#FF3B58');
          this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner, '#FF3B58');
          this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, '#FF3B58');
          this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, '#FF3B58');
  
          this.outputMessage.hidden = true;
          this.outputData.parentElement.hidden = false;
  
          try {
            const machineData = JSON.parse(code.data);
            if (machineData.name) {
              console.log("✅ QR code recognized:", machineData.name);
              document.getElementById('machineName').value = machineData.name;
              this.stop();
            }
          } catch (e) {
            console.warn('⚠️ Invalid QR code format:', e);
          }
        } else {
          this.outputMessage.hidden = false;
          this.outputData.parentElement.hidden = true;
        }
      }
  
      requestAnimationFrame(() => this.tick());
    }
  
    stop() {
      if (this.currentStream) {
        console.log("⛔ Stopping camera stream.");
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
    }
  }
  
  // Initialize on DOM load
  let qrScanner;
  document.addEventListener('DOMContentLoaded', () => {
    qrScanner = new QRScanner();
  
    const scanBtn = document.getElementById('scanQRBtn');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        const qrReader = document.getElementById('qr-reader');
        qrReader.classList.remove('hidden');
        qrScanner.start();
      });
    }
  
    // Make available globally
    window.qrScanner = qrScanner;
  });
  