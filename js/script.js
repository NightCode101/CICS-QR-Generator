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
 * Hides the cookie consent banner and saves the user's choice as ACCEPTED.
 */
function acceptCookies() {
  localStorage.setItem("cookieConsent", "accepted");
  const consentEl = document.getElementById("cookieConsent");
  if (consentEl) consentEl.style.display = "none";
}

/**
 * Hides the cookie consent banner and saves the user's choice as DISMISSED (Opt-out).
 */
function dismissCookies() {
  localStorage.setItem("cookieConsent", "dismissed");
  const consentEl = document.getElementById("cookieConsent");
  if (consentEl) consentEl.style.display = "none";
}


// =======================================================================
// ---  2. PAGE-SPECIFIC LOGIC (Runs based on body class)  ---
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --- GLOBAL STATE & ELEMENTS ---
  let dataToGenerate = null;
  let isBulkGeneration = false;
  
  // FIXED: Placeholders are only needed for the Confirmation Logic
  let startSingleGeneration = null;
  let startBulkGeneration = null; 

  const alertModal = document.getElementById('customAlert');
  const alertMessageEl = document.getElementById('alertMessage');
  const alertOkBtn = document.querySelector('.alert-ok-button'); // Fixed selector if class is used

  const confirmModal = document.getElementById('confirmModal');
  const confirmIDEl = document.getElementById('confirmID');
  const confirmNameEl = document.getElementById('confirmName');
  
  const confirmBtn = document.getElementById('confirmBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  // --- THEME TOGGLE LOGIC (UNCHANGED) ---
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Function to apply the theme
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      if(themeToggle) themeToggle.textContent = '☀️ Light'; // Sun icon
    } else {
      body.classList.remove('dark-mode');
      if(themeToggle) themeToggle.textContent = '🌙 Dark'; // Moon icon
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
  
  // --- Cookie consent logic (UNCHANGED) ---
  if (!localStorage.getItem("cookieConsent")) {
    const consentBanner = document.getElementById("cookieConsent");
    if (consentBanner) {
      consentBanner.style.display = "block";
    }
  }

  // =======================================================
  // --- CUSTOM ALERT LOGIC (Replaces native alert()) ---
  // =======================================================

  const dismissAlert = () => {
    if(alertModal) alertModal.classList.remove('show');
  };

  const showAlert = (message) => {
    if(alertMessageEl) alertMessageEl.textContent = message;
    if(alertModal) alertModal.classList.add('show');
  };
  
  // Attach listeners if the alert modal exists
  if (alertModal) { 
    if (alertOkBtn) alertOkBtn.onclick = dismissAlert; 
    document.addEventListener('keydown', (e) => {
      if (e.key === "Escape" && alertModal.classList.contains('show')) {
        dismissAlert();
      }
    });
    window.showAlert = showAlert;
  }

  // --- SHARED MODAL LOGIC (UNCHANGED) ---
  const modal = document.getElementById('qrPreviewModal');
  const modalImg = document.getElementById('modalQrImage');
  const modalName = document.getElementById('modalQrName');
  const closeModalBtn = document.querySelector('.modal-close');

  const closeModal = () => {
    if(modal) modal.classList.remove('show');
  };

  const openModal = (imgSrc, nameText) => {
    if(modalImg) modalImg.src = imgSrc;
    if(modalName) modalName.textContent = nameText.toUpperCase();
    if(modal) modal.classList.add('show');
  };
  
  // Attach listeners if the modal exists
  if (modal) { 
    closeModalBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
  }
  
  // =======================================================
  // --- CONFIRMATION MODAL LOGIC ---
  // =======================================================
  
  /**
   * Opens the confirmation modal, displaying data separately or as bulk info.
   */
  const openConfirmModal = (dataString, bulkMode = false) => {
    isBulkGeneration = bulkMode;
    dataToGenerate = dataString;

    if (!confirmModal) return;

    // Get headers for dynamic text update
    const h4 = confirmModal.querySelector('h4');
    const p = confirmModal.querySelector('p');

    if (bulkMode) {
      // BULK MODE (Kept simple as it's not strictly necessary)
      h4.textContent = "Confirm Bulk Generation";
      p.innerHTML = `You are processing ${dataString.length} items. The QR codes will contain data formatted as <code>ID|NAME</code>. Proceed?`;
      if (confirmIDEl) confirmIDEl.textContent = '---';
      if (confirmNameEl) confirmNameEl.textContent = 'Bulk Job: See console for raw data.';
      
      console.log('Bulk Data to be Processed:', dataString);

    } else {
      // SINGLE MODE: Parse and display ID and Name separately
      const parts = dataString.split('|');
      const id = parts[0].trim();
      const name = parts[1].trim();

      h4.textContent = "Confirm Single QR Generation";
      p.innerHTML = `Please verify the data below. This exact string will be encoded in the QR code:`;
      if (confirmIDEl) confirmIDEl.textContent = id;
      if (confirmNameEl) confirmNameEl.textContent = name;
    }

    confirmModal.classList.add('show');
  };

  const closeConfirmModal = () => {
    if(confirmModal) confirmModal.classList.remove('show');
  };

  // The central function that executes the action after user confirmation
  const proceedGeneration = () => {
    if (isBulkGeneration) {
        // FIXED: Calls the generation function directly 
        if (startBulkGeneration) startBulkGeneration(dataToGenerate);
    } else {
        if (startSingleGeneration) startSingleGeneration(dataToGenerate);
    }
  };

  if (confirmModal) {
    if (cancelBtn) cancelBtn.onclick = closeConfirmModal;
    if (confirmBtn) confirmBtn.onclick = () => {
      closeConfirmModal();
      proceedGeneration();
    };
  }
  // =======================================================


  // --- SINGLE PAGE LOGIC (index.html) ---
  if (document.body.classList.contains('page-single')) {
    
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    const historyListEl = document.getElementById('historyList');
    // NEW: Get the overlay element
    const singlePreviewOverlay = document.getElementById('singlePreviewOverlay');

    // FIXED: Assign function to the global placeholder
    startSingleGeneration = (qrData) => {
      // Extract name from the validated data (ID|Name)
      const name = qrData.split('|')[1].trim(); 
      
      // NEW: 1. Show the overlay immediately
      if (singlePreviewOverlay) {
          singlePreviewOverlay.classList.add('show');
      }

      // Hide the template image and prepare the canvas for drawing
      document.getElementById('previewImage').style.display = 'none';
      document.getElementById('qrCanvas').style.display = 'block';

      // NEW: 2. Implement a 1-second delay before starting the heavy lifting
      setTimeout(() => {
        // The rest of the original logic goes inside here

        QRCode.toDataURL(qrData, {
          width: 600,
          margin: 0,
          errorCorrectionLevel: 'H',
          type: 'image/png'
        }, function (err, url) {
          if (err) {
              console.error(err);
              // Hide overlay on error
              if (singlePreviewOverlay) singlePreviewOverlay.classList.remove('show');
              return;
          }

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
              // NEW: 3. Hide the overlay after the canvas is drawn
              if (singlePreviewOverlay) singlePreviewOverlay.classList.remove('show');
            });
          };
          // Handle image load failure (e.g., corrupted image or network)
          qrImg.onerror = () => {
              console.error("Failed to load QR image for drawing.");
              if (singlePreviewOverlay) singlePreviewOverlay.classList.remove('show');
          };
        });
      }, 1000); // 1000 milliseconds = 1 second delay
    };
    
    // --- Modal Open Event (using event delegation) ---
    if(historyListEl) {
      historyListEl.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        if (!historyItem) return;

        const img = historyItem.querySelector('img');
        const name = historyItem.querySelector('p');

        if (!img || !name) return;
        
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
        ctx.fillStyle = '#f3ede2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw QR code
      const qrSize = 1300;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 360;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Draw text (Only the name)
      ctx.font = `bold ${getFontSize(name)}px ImpactCustom, sans-serif`;
      ctx.fillStyle = '#e59e02'; // QR text is always black
      ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), canvas.width / 2, 1820);

      document.getElementById('downloadBtn').disabled = false;
      document.getElementById('resetBtn').disabled = false;

      const dataURL = canvas.toDataURL('image/png');
      addToHistory(name, dataURL);
    }
    
    /**
     * Intercepts click, validates, and shows confirmation modal.
     */
    window.generateQR = function() {
      const id = document.getElementById('idInput').value.trim();
      const name = document.getElementById('nameInput').value.trim();
      
      if (!id || !name) {
        showAlert("Please enter both an ID and a Name."); 
        return;
      }

      const qrData = `${id}|${name}`;
      openConfirmModal(qrData, false); // Open confirmation for single generation
    };

    /**
     * Downloads the generated QR code as a PNG file.
     */
    window.downloadQR = function() {
      let name = document.getElementById('nameInput').value.trim();
      if (!name) {
        showAlert("Please generate a QR first."); 
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

    // FIXED: Assign function to the global placeholder
    startBulkGeneration = (lines) => {
      
      const preview = document.getElementById('bulkPreview');
      const loading = document.getElementById('loadingIndicator');
      const overlay = document.getElementById('previewOverlay');
      
      // Re-initialize state elements needed for the loop
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
          
          let successMessage = `${allData.length} QR codes complete!`;
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

              // FIX: Multiply font size by 2.4 to match the high-res canvas
              const fontSize = getFontSize(nameToDraw) * 2.4; 
              ctx.font = `bold ${fontSize}px ImpactCustom, sans-serif`;
              
              ctx.fillStyle = '#e59e02';
              ctx.textAlign = 'center';
              
              // FIX: Adjusted Y position to 1950 (was 1820) to make room for larger text
              ctx.fillText(nameToDraw.toUpperCase(), canvas.width / 2, 1950);

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
              ctx.fillStyle = "#f3ede2";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              drawQR();
            }
          }
        });
      }
      generateNext();
    };


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
        
        openModal(img.src, name);
      });
    }

    /**
     * Toggles all preview checkboxes based on the master "Select All" checkbox.
     */
    window.toggleSelectAll = function(masterCheckbox) {
      const checkboxes = document.querySelectorAll('.qr-checkbox');
      checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
      
      // FIX: Enable download button if at least one item is checked
      const count = document.querySelectorAll('.qr-checkbox:checked').length;
      document.getElementById('zipBtn').disabled = count === 0;
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
     * UPDATED: Now fetches images from DOM to prevent memory errors.
     */
    window.downloadSelectedZipped = function() {
      // Check if JSZip is loaded
      if (typeof JSZip === 'undefined') {
        showAlert("Error: JSZip library not loaded. Please refresh.");
        return;
      }

      const zip = new JSZip();
      const checkboxes = document.querySelectorAll('.qr-checkbox:checked');
      if (!checkboxes.length) return showToast("No QR selected.");

      let count = 0;

      checkboxes.forEach(cb => {
        // Find the preview item container associated with this checkbox
        const item = cb.closest('.preview-item');
        // Find the image tag within that container
        const img = item ? item.querySelector('img') : null;

        if (img && img.src) {
            const data = img.src;
            const name = cb.dataset.name.replace(/[^a-z0-9_\-]/gi, '_');
            
            // Extract the base64 data correctly (after "base64,")
            const base64Data = data.split(',')[1];
            if (base64Data) {
                zip.file(`${name}.png`, base64Data, { base64: true });
                count++;
            }
        }
      });

      if (count === 0) {
        showToast("Error: Could not retrieve image data.");
        return;
      }

      showToast(`Zipping ${count} files...`);

      zip.generateAsync({ type: "blob" }).then(content => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = "CICS_QR_Codes.zip";
        document.body.appendChild(a); // Required for Firefox
        a.click();
        document.body.removeChild(a);
      });
    }

    /**
     * Resets the bulk input text area.
     */
    window.resetBulkQR = function() {
      // Clear the input field
      document.getElementById('bulkInput').value = '';
      
      // Uncheck all boxes
      document.querySelectorAll('.qr-checkbox').forEach(cb => cb.checked = false);
      document.getElementById('selectAll').checked = false;
      
      // Disable the buttons again (since we are resetting)
      document.getElementById('zipBtn').disabled = true;
      document.getElementById('resetBulkBtn').disabled = true; // <-- ADD THIS TO DISABLE SELF
      
      showToast("Ready to generate another QR!");
    }

    /**
     * Creates a preview item element for the bulk list.
     * UPDATED: Removed heavy data from checkbox dataset.
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
      // dataset.img REMOVED to save memory

      label.appendChild(checkbox);
      label.append(" " + name); // Add name after checkbox

      item.appendChild(img);
      item.appendChild(label);
      return item;
    }

    /**
     * Intercepts click, validates, and starts generation directly.
     */
    window.generateBulkQRs = function() {
      const input = document.getElementById('bulkInput').value.trim();
      if (!input) return showToast("Please paste some data.");

      const lines = input.split('\n').map(l => l.trim()).filter(l => l);
      
      let validCount = 0;

      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
          validCount++;
        }
      });

      if (validCount === 0) {
        return showAlert("No valid ID|Name data found in the input. Please check the format.");
      }

      // FIXED: Call the generation function directly, bypassing the confirmation modal
      if (startBulkGeneration) startBulkGeneration(lines);
    }
    
    // Listener for "Select All" checkbox logic
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('qr-checkbox')) {
        const all = document.querySelectorAll('.qr-checkbox');
        const checked = document.querySelectorAll('.qr-checkbox:checked');
        const selectAll = document.getElementById('selectAll');
        
        // Update the "Select All" box visual state
        selectAll.checked = all.length > 0 && all.length === checked.length;
        
        // FIX: Enable/Disable Download button based on selection
        document.getElementById('zipBtn').disabled = checked.length === 0;
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
      
      // FIX: Enable BOTH buttons when data is loaded
      document.getElementById('zipBtn').disabled = false; 
      document.getElementById('resetBulkBtn').disabled = false; // <-- ADD THIS LINE
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