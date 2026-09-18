// ==========================================
// MEOW BUILD APP - CORE LOGIC & API BRIDGE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------------------
  // 1. CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
  // ----------------------------------------
  const GITHUB_USERNAME = "galeedx";
const GITHUB_REPO = "Meow-Build-App";
const GITHUB_BRANCH = "main";
const GITHUB_TOKEN = "ghp_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";

  
  // Elementos del DOM
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const consoleLogs = document.getElementById('consoleLogs');
  const buildBtn = document.getElementById('buildBtn');

  const iconInput = document.getElementById('iconInput');
  const iconPreview = document.getElementById('iconPreview');

  const fullscreenToggle = document.getElementById('fullscreenToggle');
  const systemBarsContainer = document.getElementById('systemBarsContainer');

  // ----------------------------------------
  // 2. HELPER DE LOGS Y CONSOLA
  // ----------------------------------------
  const logMessage = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let colorStyle = 'color: #00ff66;'; // Verde por defecto

    if (type === 'error') colorStyle = 'color: #ff3333;';
    if (type === 'warn')  colorStyle = 'color: #ffff00;';
    if (type === 'system') colorStyle = 'color: #ffffff;';

    if (consoleLogs) {
      consoleLogs.innerHTML += `<br><span style="${colorStyle}">[${time}] > ${message}</span>`;
      consoleLogs.scrollTop = consoleLogs.scrollHeight;
    }
  };

  // Helper para convertir archivos a Base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

  // ----------------------------------------
  // 3. MANEJO DE ARCHIVOS (.ZIP) Y DROPZONE
  // ----------------------------------------
  function handleFileSelect(file) {
    const dropZoneText = dropZone.querySelector('strong');
    if (dropZoneText) {
      dropZoneText.innerText = file.name;
    }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    logMessage(`Archivo ZIP cargado: ${file.name} (${sizeMB} MB)`, 'system');
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0 && files[0].name.endsWith('.zip')) {
        // Asignación segura con DataTransfer para compatibilidad WebKit/iOS
        const dtTransfer = new DataTransfer();
        dtTransfer.items.add(files[0]);
        fileInput.files = dtTransfer.files;

        handleFileSelect(files[0]);
      } else {
        logMessage('Error: Por favor selecciona un archivo .ZIP válido.', 'error');
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  // ----------------------------------------
  // 4. CARGA DE ICONO DE LA APP
  // ----------------------------------------
  if (iconInput) {
    iconInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          if (iconPreview) {
            iconPreview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
          }
        };

        reader.readAsDataURL(file);
        logMessage(`Icono cargado: ${file.name}`, 'system');
      }
    });
  }

  // ----------------------------------------
  // 5. SINCRONIZACIÓN DE COLOR PICKERS (CON FIX PARA HEX SIN #)
  // ----------------------------------------
  const syncColor = (pickerId, hexId) => {
    const picker = document.getElementById(pickerId);
    const hex = document.getElementById(hexId);

    if (picker && hex) {
      picker.addEventListener('input', (e) => hex.value = e.target.value.toUpperCase());
      hex.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (val && !val.startsWith('#')) val = '#' + val;

        if (/^#[0-9A-F]{6}$/i.test(val)) {
          picker.value = val;
        }
      });
    }
  };

  syncColor('statusBarColor', 'statusBarHex');
  syncColor('navBarColor', 'navBarHex');

  // ----------------------------------------
  // 6. MODO PANTALLA COMPLETA (IMMERSIVE)
  // ----------------------------------------
  if (fullscreenToggle && systemBarsContainer) {
    fullscreenToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        systemBarsContainer.style.opacity = '0.3';
        systemBarsContainer.style.pointerEvents = 'none';
        logMessage('Modo Pantalla Completa (Immersive) activado.', 'system');
      } else {
        systemBarsContainer.style.opacity = '1';
        systemBarsContainer.style.pointerEvents = 'auto';
        logMessage('Modo Pantalla Completa desactivado.', 'system');
      }
    });
  }

  // ----------------------------------------
  // 7. PROCESO DE COMPILACIÓN / ENVÍO A GITHUB API
  // ----------------------------------------
  if (buildBtn) {
    buildBtn.addEventListener('click', async (e) => {
      e.preventDefault(); // Evita que la página se recargue en móviles

      if (!fileInput.files || fileInput.files.length === 0) {
        logMessage('Error: No has seleccionado ningún archivo .ZIP.', 'error');
        return;
      }

      // Reiniciar consola visual
      if (consoleLogs) consoleLogs.innerHTML = '';

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }

      buildBtn.disabled = true;
      buildBtn.style.opacity = '0.5';

      try {
        // Captura de valores del formulario
        const appName = document.getElementById('appNameInput')?.value || 'Mi App Web';
        const packageId = document.getElementById('packageIdInput')?.value || 'com.meow.app';
        const versionName = document.getElementById('versionNameInput')?.value || '1.0.0';
        const buildNumber = document.getElementById('buildNumberInput')?.value || '1';

        const isOfflineMode = document.getElementById('offlineSelect')?.value === 'true';
        const zipFile = fileInput.files[0];

        logMessage('Iniciando secuencia de empaquetado...', 'warn');
        logMessage(`Configuración: [App: ${appName}] | [ID: ${packageId}] | [v${versionName} (${buildNumber})]`, 'system');
        logMessage(`Modo Offline: ${isOfflineMode ? 'ACTIVADO (Con acceso a red para caché)' : 'DESACTIVADO (Sin acceso a red)'}`, 'system');

        // 1. Convertir .ZIP a Base64
        logMessage('Procesando paquete .ZIP local...', 'info');
        const base64Content = await fileToBase64(zipFile);

        // 2. Consultar si existe un archivo previo en uploads/project.zip para obtener su SHA (sobrescritura)
        let sha = '';
        const getFileUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/uploads/project.zip?ref=${GITHUB_BRANCH}`;

        try {
          const getRes = await fetch(getFileUrl, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
          });
          if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
          }
        } catch (err) {
          logMessage('Creando registro de sesión...', 'system');
        }

        // 3. Subir el paquete mediante la API de GitHub
        logMessage('Enviando paquete al motor de compilación en la nube...', 'warn');

        const putFileUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/uploads/project.zip`;
        const bodyPayload = {
          message: `Compilación ${appName} v${versionName} - ${new Date().toISOString()}`,
          content: base64Content,
          branch: GITHUB_BRANCH
        };

        if (sha) bodyPayload.sha = sha;

        const uploadRes = await fetch(putFileUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyPayload)
        });

        if (!uploadRes.ok) {
          throw new Error(`Error en la API de GitHub (HTTP ${uploadRes.status})`);
        }

        logMessage('¡Paquete recibido en la nube con éxito!', 'info');
        logMessage('Iniciando entorno de compilación (Android SDK, Java 17, Gradle)...', 'system');

        // Enlace directo a GitHub Actions para monitoreo y descarga
        const actionsUrl = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/actions`;

        logMessage(`> [✓] ¡Proceso iniciado correctamente!`, 'system');
        logMessage(`Monitorea y descarga tu APK en: <a href="${actionsUrl}" target="_blank" style="color: #00ff66; text-decoration: underline;">VER Y DESCARGAR APK EN GITHUB ACTIONS &rarr;</a>`, 'info');

      } catch (error) {
        logMessage(`Error durante la compilación: ${error.message}`, 'error');
      } finally {
        buildBtn.disabled = false;
        buildBtn.style.opacity = '1';
      }
    });
  }
});
