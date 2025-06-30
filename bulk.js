const templateImage = new Image();
templateImage.src = './assets/template-background.png';

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function getFontSize(name) {
  const baseSize = 96;
  if (name.length <= 10) return baseSize;
  if (name.length <= 20) return baseSize - 16;
  if (name.length <= 30) return baseSize - 28;
  return baseSize - 36;
}

function toggleSelectAll(masterCheckbox) {
  const checkboxes = document.querySelectorAll('.qr-checkbox');
  checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
}

function clearSelection() {
  document.getElementById('bulkPreview').innerHTML = '';
  localStorage.removeItem('bulkQRData');
  document.getElementById('zipBtn').disabled = true;
  document.getElementById('selectAll').checked = false;
  showToast("All previews cleared.");
}

function downloadSelectedZipped() {
  const zip = new JSZip();
  const checkboxes = document.querySelectorAll('.qr-checkbox:checked');
  if (!checkboxes.length) return showToast("No QR selected.");

  checkboxes.forEach(cb => {
    const data = cb.dataset.img;
    const name = cb.dataset.name.replace(/[^a-z0-9_\-]/gi, '_');
    zip.file(`${name}.png`, data.split(',')[1], { base64: true });
  });

  zip.generateAsync({ type: "blob" }).then(content => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = "qr_codes.zip";
    a.click();
  });
}

function resetBulkQR() {
  document.getElementById('bulkInput').value = '';
  document.querySelectorAll('.qr-checkbox').forEach(cb => cb.checked = false);
  document.getElementById('selectAll').checked = false;
  showToast("Ready to generate another QR!");
}

function createPreviewItem(name, dataURL) {
  const item = document.createElement('div');
  item.className = 'preview-item';

  const img = new Image();
  img.src = dataURL;

  const label = document.createElement('label');
  label.className = 'preview-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'qr-checkbox';
  checkbox.dataset.name = name;
  checkbox.dataset.img = dataURL;

  label.appendChild(checkbox);
  label.append(" " + name);

  item.appendChild(img);
  item.appendChild(label);

  return item;
}


function generateBulkQRs() {
  const input = document.getElementById('bulkInput').value.trim();
  if (!input) return showToast("Please paste some data.");

  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  const preview = document.getElementById('bulkPreview');
  const loading = document.getElementById('loadingIndicator');
  const overlay = document.getElementById('previewOverlay');

  preview.innerHTML = '';
  loading.style.display = 'block';
  overlay.classList.add('show');

  let allData = [];
  let i = 0;

  function generateNext() {
    if (i >= lines.length) {
      loading.style.display = 'none';
      overlay.classList.remove('show');
      localStorage.setItem('bulkQRData', JSON.stringify(allData));
      document.getElementById('zipBtn').disabled = false;
      document.getElementById('resetBulkBtn').disabled = false;
      showToast("✅ QR generation complete!");
      return;
    }

    const text = lines[i];
    QRCode.toDataURL(text, { width: 600, margin: 0 }, (err, url) => {
      if (err) return console.error(err);

      const canvas = document.createElement('canvas');
      canvas.width = 2160;
      canvas.height = 2160;
      const ctx = canvas.getContext('2d');

      const qrImg = new Image();
      qrImg.src = url;

      qrImg.onload = () => {
        document.fonts.load('20px ImpactCustom').then(() => {
          if (templateImage.complete) {
            drawCanvas();
          } else {
            templateImage.onload = drawCanvas;
          }

          function drawCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

            const qrSize = 1300;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 360;
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            ctx.font = `bold ${getFontSize(text)}px ImpactCustom, sans-serif`;
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText(text.toUpperCase(), canvas.width / 2, 1820);

            const dataURL = canvas.toDataURL();
            allData.push({ name: text, image: dataURL });

            const item = createPreviewItem(text, dataURL);
            preview.appendChild(item);

            i++;
            setTimeout(generateNext, 500);
          }
        });
      };
    });
  }

  generateNext();
}

document.addEventListener('change', (e) => {
  if (e.target.classList.contains('qr-checkbox')) {
    const all = document.querySelectorAll('.qr-checkbox');
    const checked = document.querySelectorAll('.qr-checkbox:checked');
    const selectAll = document.getElementById('selectAll');
    selectAll.checked = all.length > 0 && all.length === checked.length;
  }
});

window.addEventListener('load', () => {
  const stored = localStorage.getItem('bulkQRData');
  if (stored) {
    const preview = document.getElementById('bulkPreview');
    const dataList = JSON.parse(stored);
    dataList.forEach(({ name, image }) => {
      const item = createPreviewItem(name, image);
      preview.appendChild(item);
    });
    document.getElementById('zipBtn').disabled = false;
  }
});
