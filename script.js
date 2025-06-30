const canvas = document.getElementById('qrCanvas');
const ctx = canvas.getContext('2d');
const templateImage = new Image();
templateImage.src = './assets/template-background.png';

function generateQR() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    alert("Please enter a name.");
    return;
  }

  document.getElementById('previewImage').style.display = 'none';
  document.getElementById('qrCanvas').style.display = 'block';

  QRCode.toDataURL(name, {
    width: 600,
    margin: 0,
    errorCorrectionLevel: 'H',
    type: 'image/png'
  }, function (err, url) {
    if (err) return console.error(err);

    const qrImg = new Image();
    qrImg.src = url;

    qrImg.onload = () => {
      document.fonts.load('20px ImpactCustom').then(() => {
        if (templateImage.complete || templateImage.naturalWidth !== 0) {
          safeDrawCanvas(name, qrImg);
        } else {
          templateImage.onload = () => safeDrawCanvas(name, qrImg);
          templateImage.onerror = () => safeDrawCanvas(name, qrImg); // fallback if image fails to load
        }
      });
    };
  });
}

function safeDrawCanvas(name, qrImg) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background if available, fallback to white
  if (templateImage.complete && templateImage.naturalWidth !== 0) {
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const qrSize = 1300;
  const qrX = (canvas.width - qrSize) / 2;
  const qrY = 360;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.font = `bold ${getFontSize(name)}px ImpactCustom, sans-serif`;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), canvas.width / 2, 1820);

  document.getElementById('downloadBtn').disabled = false;
  document.getElementById('resetBtn').disabled = false;

  const dataURL = canvas.toDataURL('image/png');
  addToHistory(name, dataURL);
}

function downloadQR() {
  let name = document.getElementById('nameInput').value.trim();
  if (!name) {
    alert("Please enter a name before downloading.");
    return;
  }

  name = name.replace(/[^a-z0-9_\-]/gi, '_');
  const link = document.createElement('a');
  link.download = `${name}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

function resetQR() {
  const canvasEl = document.getElementById('qrCanvas');
  const previewEl = document.getElementById('previewImage');

  canvasEl.classList.add('fade-out');
  setTimeout(() => {
    canvasEl.style.display = 'none';
    canvasEl.classList.remove('fade-out');

    previewEl.style.display = 'block';
    previewEl.classList.add('fade-in');

    setTimeout(() => previewEl.classList.remove('fade-in'), 400);
  }, 400);

  document.getElementById('nameInput').value = '';
  document.getElementById('downloadBtn').disabled = true;
  document.getElementById('resetBtn').disabled = true;
  document.getElementById('nameInput').focus();

  showToast("Ready to generate another QR!");
}

function getFontSize(name) {
  const baseSize = 96;
  if (name.length <= 10) return baseSize;
  if (name.length <= 20) return baseSize - 16;
  if (name.length <= 30) return baseSize - 28;
  return baseSize - 36;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function addToHistory(name, dataURL) {
  const historyList = document.getElementById('historyList');
  let saved = JSON.parse(localStorage.getItem('qrHistory')) || [];

  const exists = saved.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (exists) return;

  const item = document.createElement('div');
  item.className = 'history-item';

  const img = document.createElement('img');
  img.src = dataURL;
  img.alt = name;

  const label = document.createElement('p');
  label.textContent = name;

  item.appendChild(img);
  item.appendChild(label);
  historyList.appendChild(item);

  saved.push({ name, dataURL });
  localStorage.setItem('qrHistory', JSON.stringify(saved));
}

function loadHistory() {
  const historyList = document.getElementById('historyList');
  const saved = JSON.parse(localStorage.getItem('qrHistory')) || [];

  saved.forEach(({ name, dataURL }) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const img = document.createElement('img');
    img.src = dataURL;
    img.alt = name;

    const label = document.createElement('p');
    label.textContent = name;

    item.appendChild(img);
    item.appendChild(label);
    historyList.appendChild(item);
  });
}

function clearHistory() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  localStorage.removeItem('qrHistory');
  showToast("QR history cleared!");
}

window.addEventListener('DOMContentLoaded', loadHistory);
