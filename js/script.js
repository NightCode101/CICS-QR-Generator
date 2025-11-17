// =======================================================================
// ---  1. SHARED FUNCTIONS & VARIABLES (Used by all pages)  ---
// =======================================================================

const templateImage = new Image();
templateImage.src = './assets/template-background.png';

/**
 * Displays a temporary "toast" message at the bottom of the screen.
 * @param {string} message The message to display.
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

/**
 * Calculates the appropriate font size for the canvas based on text length.
 * @param {string} name The text to measure.
 * @returns {number} The calculated font size.
 */
function getFontSize(name) {
  const baseSize = 96;
  if (name.length <= 10) return baseSize;
  if (name.length <= 20) return baseSize - 16;
  if (name.length <= 30) return baseSize - 28;
  return baseSize - 36;
}

/**
 * Hides the cookie consent banner and saves the user's choice.
 */
function acceptCookies() {
  localStorage.setItem("cookieConsent", "true");
  document.getElementById("cookieConsent").style.display = "none";
}

// =======================================================================
// ---  2. PAGE-SPECIFIC LOGIC (Runs based on body class)  ---
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --- THEME TOGGLE LOGIC ---
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Function to apply the theme
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      if(themeToggle) themeToggle.textContent = '☀️'; // Sun icon
    } else {
      body.classList.remove('dark-mode');
      if(themeToggle) themeToggle.textContent = '🌙'; // Moon icon
    }
  };

  // Check for saved theme in localStorage
  let currentTheme = localStorage.getItem('theme');

  // If no saved theme, check system preference
  if (!currentTheme) {
    currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply the determined theme on load
  applyTheme(currentTheme);

  // Add click event to the toggle button
  if(themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    });
  }
  
  // --- Cookie consent logic ---
  if (!localStorage.getItem("cookieConsent")) {
    const consentBanner = document.getElementById("cookieConsent");
    if (consentBanner) {
      consentBanner.style.display = "block";
    }
  }

  // --- SHARED MODAL LOGIC (for both pages) ---
  const modal = document.getElementById('qrPreviewModal');
  const modalImg = document.getElementById('modalQrImage');
  const modalName = document.getElementById('modalQrName');
  const closeModalBtn = document.querySelector('.modal-close');

  // Define functions in the wide scope
  const closeModal = () => {
    if(modal) modal.classList.remove('show');
  };

  const openModal = (imgSrc, nameText) => {
    if(modalImg) modalImg.src = imgSrc;
    if(modalName) modalName.textContent = nameText.toUpperCase();
    if(modal) modal.classList.add('show');
  };
  
  // Attach listeners *only if* the modal exists on the page
  if (modal) { 
    closeModalBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
  }


  // --- SINGLE PAGE LOGIC (index.html) ---
  if (document.body.classList.contains('page-single')) {
    
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    const historyListEl = document.getElementById('historyList');

    // --- Modal Open Event (using event delegation) ---
    if(historyListEl) {
      historyListEl.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        if (!historyItem) return; // Didn't click on an item

        const img = historyItem.querySelector('img');
        const name = historyItem.querySelector('p');

        if (!img || !name) return;
        
        // Use the global openModal function (which is now in scope)
        openModal(img.src, name.textContent);
      });
    }

    /**
     * Draws the complete QR code with background and text onto the canvas.
     */
    function safeDrawCanvas(name, qrImg) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      if (templateImage.complete && templateImage.naturalWidth !== 0) {
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw QR code
      const qrSize = 1300;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 360;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Draw text (Only the name)
      ctx.font = `bold ${getFontSize(name)}px ImpactCustom, sans-serif`;
      ctx.fillStyle = '#000'; // QR text is always black
      ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), canvas.width / 2, 1820);

      document.getElementById('downloadBtn').disabled = false;
      document.getElementById('resetBtn').disabled = false;

      const dataURL = canvas.toDataURL('image/png');
      addToHistory(name, dataURL);
    }
    
    /**
     * Generates a single QR code from the input field.
     */
    window.generateQR = function() {
      const id = document.getElementById('idInput').value.trim();
      const name = document.getElementById('nameInput').value.trim();
      
      if (!id || !name) {
        alert("Please enter both an ID and a Name.");
        return;
      }

      const qrData = `${id}|${name}`;

      document.getElementById('previewImage').style.display = 'none';
      document.getElementById('qrCanvas').style.display = 'block';

      QRCode.toDataURL(qrData, {
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
              templateImage.onerror = () => safeDrawCanvas(name, qrImg);
            }
          });
        };
      });
    }

    /**
     * Downloads the generated QR code as a PNG file.
     */
    window.downloadQR = function() {
      let name = document.getElementById('nameInput').value.trim();
      if (!name) {
        alert("Please generate a QR first.");
        return;
      }
      name = name.replace(/[^a-z0-9_\-]/gi, '_');
      const link = document.createElement('a');
      link.download = `${name}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }

    /**
     * Resets the QR generator interface.
     */
    window.resetQR = function() {
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

      document.getElementById('idInput').value = '';
      document.getElementById('nameInput').value = '';
      document.getElementById('downloadBtn').disabled = true;
      document.getElementById('resetBtn').disabled = true;
      document.getElementById('idInput').focus();
      showToast("Ready to generate another QR!");
    }

    /**
     * Adds a generated QR to the history list and localStorage.
     */
    function addToHistory(name, dataURL) {
      const historyList = document.getElementById('historyList');
      let saved = JSON.parse(localStorage.getItem('qrHistory')) || [];

      const exists = saved.find(item => item.name.toLowerCase() === name.toLowerCase());
      if (exists) return;

      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <img src="${dataURL}" alt="${name}">
        <p>${name}</p>
      `;
      historyList.prepend(item); 

      saved.push({ name, dataURL });
      localStorage.setItem('qrHistory', JSON.stringify(saved));
    }

    /**
     * Loads the QR history from localStorage on page load.
     */
    function loadHistory() {
      const historyList = document.getElementById('historyList');
      const saved = JSON.parse(localStorage.getItem('qrHistory')) || [];

      saved.reverse().forEach(({ name, dataURL }) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <img src="${dataURL}" alt="${name}">
          <p>${name}</p>
        `;
        historyList.appendChild(item);
      });
    }

    /**
     * Clears the QR history from the UI and localStorage.
     */
    window.clearHistory = function() {
      document.getElementById('historyList').innerHTML = '';
      localStorage.removeItem('qrHistory');
      showToast("QR history cleared!");
    }
    
    // Initial run for the single page
    loadHistory();
  }
  
  // --- BULK PAGE LOGIC (bulk.html) ---
  if (document.body.classList.contains('page-bulk')) {
    
    const bulkPreviewEl = document.getElementById('bulkPreview');

    // --- Modal Open Event (using event delegation) ---
    if(bulkPreviewEl) {
      bulkPreviewEl.addEventListener('click', (e) => {
        // Don't open modal if a checkbox was clicked
        if (e.target.matches('input[type="checkbox"]')) {
          return;
        }

        const previewItem = e.target.closest('.preview-item');
        if (!previewItem) return;

        const img = previewItem.querySelector('img');
        const label = previewItem.querySelector('label');
        
        // Get name from the label text, skipping the checkbox
        const name = label.textContent.trim();

        if (!img || !name) return;
        
        // Use the global openModal function (which is now in scope)
        openModal(img.src, name);
      });
    }

    /**
     * Toggles all preview checkboxes based on the master "Select All" checkbox.
     */
    window.toggleSelectAll = function(masterCheckbox) {
      const checkboxes = document.querySelectorAll('.qr-checkbox');
      checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
    }

    /**
     * Clears all generated bulk previews and localStorage.
     */
    window.clearSelection = function() {
      document.getElementById('bulkPreview').innerHTML = '';
      localStorage.removeItem('bulkQRData');
      document.getElementById('zipBtn').disabled = true;
      document.getElementById('selectAll').checked = false;
      showToast("All previews cleared.");
    }

    /**
     * Downloads all selected QR codes as a single ZIP file.
     */
    window.downloadSelectedZipped = function() {
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

    /**
     * Resets the bulk input text area.
     */
    window.resetBulkQR = function() {
      document.getElementById('bulkInput').value = '';
      document.querySelectorAll('.qr-checkbox').forEach(cb => cb.checked = false);
      document.getElementById('selectAll').checked = false;
      showToast("Ready to generate another QR!");
    }

    /**
     * Creates a preview item element for the bulk list.
     */
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
      label.append(" " + name); // Add name after checkbox

      item.appendChild(img);
      item.appendChild(label);
      return item;
    }

    /**
     * Generates QR codes for all names in the text area.
     */
    window.generateBulkQRs = function() {
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
      let errorCount = 0;

      function generateNext() {
        if (i >= lines.length) {
          loading.style.display = 'none';
          overlay.classList.remove('show');
          localStorage.setItem('bulkQRData', JSON.stringify(allData));
          document.getElementById('zipBtn').disabled = false;
          document.getElementById('resetBulkBtn').disabled = false;
          
          let successMessage = `✅ ${allData.length} QR codes complete!`;
          if (errorCount > 0) {
            successMessage += ` (${errorCount} lines failed due to incorrect format.)`;
          }
          showToast(successMessage);
          return;
        }

        const line = lines[i];
        const parts = line.split('|');

        if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
          console.warn(`Skipping line: "${line}". Incorrect format.`);
          errorCount++;
          i++;
          setTimeout(generateNext, 10);
          return;
        }

        const qrData = line.trim();
        const nameToDraw = parts[1].trim();

        QRCode.toDataURL(qrData, { width: 600, margin: 0 }, (err, url) => {
          if (err) {
            console.error(err);
            errorCount++;
            i++;
            setTimeout(generateNext, 10);
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = 2160;
          canvas.height = 2160;
          const ctx = canvas.getContext('2d');
          const qrImg = new Image();
          qrImg.src = url;

          qrImg.onload = () => {
            document.fonts.load('20px ImpactCustom').then(drawCanvasWithFallback);
          };
          
          function drawCanvasWithFallback() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const drawQR = () => {
              const qrSize = 1300;
              const qrX = (canvas.width - qrSize) / 2;
              const qrY = 360;
              ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

              ctx.font = `bold ${getFontSize(nameToDraw)}px ImpactCustom, sans-serif`;
              ctx.fillStyle = '#000';
              ctx.textAlign = 'center';
              ctx.fillText(nameToDraw.toUpperCase(), canvas.width / 2, 1820);

              const dataURL = canvas.toDataURL();
              allData.push({ name: nameToDraw, image: dataURL });

              const item = createPreviewItem(nameToDraw, dataURL);
              preview.appendChild(item);

              i++;
              setTimeout(generateNext, 50);
            };

            if (templateImage.complete && templateImage.naturalWidth > 0) {
              ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
              drawQR();
            } else {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              drawQR();
            }
          }
        });
      }
      generateNext();
    }
    
    // Listener for "Select All" checkbox logic
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('qr-checkbox')) {
        const all = document.querySelectorAll('.qr-checkbox');
        const checked = document.querySelectorAll('.qr-checkbox:checked');
        const selectAll = document.getElementById('selectAll');
        selectAll.checked = all.length > 0 && all.length === checked.length;
      }
    });

    // Load bulk data from localStorage on page load
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
  }
});

// =======================================================================
// ---  3. PWA SERVICE WORKER (Runs on all pages)  ---
// =======================================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('✅ Service Worker Registered'))
    .catch(err => console.error('Service Worker failed:', err));
}