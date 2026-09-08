// ==========================================
// MEOW BUILD APP - CORE LOGIC & API BRIDGE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const consoleLogs = document.getElementById('consoleLogs');
  const buildBtn = document.getElementById('buildBtn');

  // Referencias para Carga de Icono
  const iconInput = document.getElementById('iconInput');
  const iconPreview = document.getElementById('iconPreview');

  // Helper para escribir en la consola terminal
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

  // 1. Manejo de Selección y Arrastre de Archivos (.ZIP)
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
        fileInput.files = files;
        handleFileSelect(files[0]);
      } else {
        logMessage('Error: Por favor selecciona un archivo con formato .ZIP válido.', 'error');
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    const dropZoneText = dropZone.querySelector('strong');
    if (dropZoneText) {
      dropZoneText.innerText = file.name;
    }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    logMessage(`Archivo ZIP cargado con éxito: ${file.name} (${sizeMB} MB)`, 'system');
  }

  // 2. Manejo de Carga de Icono (.PNG / .JPG)
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
        logMessage(`Icono cargado con éxito: ${file.name}`, 'system');
      }
    });
  }

  // 3. Sincronización de Pickers de Color
  const syncColor = (pickerId, hexId) => {
    const picker = document.getElementById(pickerId);
    const hex = document.getElementById(hexId);

    if (picker && hex) {
      picker.addEventListener('input', (e) => hex.value = e.target.value.toUpperCase());
      hex.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          picker.value = e.target.value;
        }
      });
    }
  };

  syncColor('statusBarColor', 'statusBarHex');
  syncColor('navBarColor', 'navBarHex');

  // Toggle Pantalla Completa (Immersive)
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  const systemBarsContainer = document.getElementById('systemBarsContainer');

  if (fullscreenToggle && systemBarsContainer) {
    fullscreenToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        systemBarsContainer.style.opacity = '0.3';
        systemBarsContainer.style.pointerEvents = 'none';
        logMessage('Modo Pantalla Completa (Immersive) activado.', 'system');
      } else {
        systemBarsContainer.style.opacity = '1';
        systemBarsContainer.style.pointerEvents = 'auto';
        logMessage('Modo Pantalla Completa desactivado. Barras personalizadas activas.', 'system');
      }
    });
  }

  // 4. Obtener lista de Native Plugins seleccionados
  const getSelectedPlugins = () => {
    const pluginCheckboxes = document.querySelectorAll('.cell.full-width input[type="checkbox"]:not(#fullscreenToggle)');
    const activePlugins = [];

    pluginCheckboxes.forEach(cb => {
      if (cb.checked) {
        const labelText = cb.parentElement.textContent.trim();
        activePlugins.push(labelText);
      }
    });

    return activePlugins;
  };

  // 5. Proceso de Compilación / Envío a la API
  if (buildBtn) {
    buildBtn.addEventListener('click', async () => {

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }

      if (!fileInput.files || fileInput.files.length === 0) {
        logMessage('Error: No has seleccionado ningún proyecto .ZIP.', 'error');
        return;
      }

      buildBtn.disabled = true;
      buildBtn.style.opacity = '0.5';

      // Captura de datos
      const appName = document.getElementById('appNameInput')?.value || 'Meow App';
      const packageId = document.getElementById('packageIdInput')?.value || 'com.meow.app';
      const versionName = document.getElementById('versionNameInput')?.value || '1.0.0';
      const buildNumber = document.getElementById('buildNumberInput')?.value || '1';

      const orientation = document.getElementById('orientationSelect')?.value || 'portrait';
      
      // Control Modo Offline y Permisos de Red
      const isOfflineMode = document.getElementById('offlineSelect')?.value === 'true';

      const isFullscreen = document.getElementById('fullscreenToggle')?.checked;
      const statusBarIcons = document.getElementById('statusBarIcons')?.value;
      const navBarIcons = document.getElementById('navBarIcons')?.value;

      const activePlugins = getSelectedPlugins();

      logMessage('Iniciando secuencia de compilación...', 'warn');
      logMessage(`Configuración: [App: ${appName}] | [ID: ${packageId}] | [v${versionName} (${buildNumber})]`, 'system');

      // Preparar FormData
      const formData = new FormData();
      formData.append('zipFile', fileInput.files[0]);
      formData.append('appName', appName);
      formData.append('packageId', packageId);
      formData.append('versionName', versionName);
      formData.append('buildNumber', buildNumber);
      formData.append('orientation', orientation);

      // Si el modo offline está ACTIVADO, se otorgan permisos de Internet para caché y peticiones externas.
      formData.append('offlineMode', isOfflineMode ? 'true' : 'false');
      formData.append('internetPermission', isOfflineMode ? 'true' : 'false');

      formData.append('fullscreenMode', isFullscreen ? 'true' : 'false');

      // Manejo de barras según la elección de Immersive / Default
      if (isFullscreen || statusBarIcons === 'none') {
        formData.append('statusBarColor', 'default');
        formData.append('statusBarIcons', 'default');
      } else {
        formData.append('statusBarColor', document.getElementById('statusBarHex')?.value || '#000000');
        formData.append('statusBarIcons', statusBarIcons);
      }

      if (isFullscreen || navBarIcons === 'none') {
        formData.append('navBarColor', 'default');
        formData.append('navBarIcons', 'default');
      } else {
        formData.append('navBarColor', document.getElementById('navBarHex')?.value || '#000000');
        formData.append('navBarIcons', navBarIcons);
      }

      formData.append('plugins', JSON.stringify(activePlugins));

      if (iconInput && iconInput.files.length > 0) {
        formData.append('appIcon', iconInput.files[0]);
      }

      try {
        logMessage('Enviando paquete .ZIP al servidor de compilación...', 'info');

        /* 
        // CONEXIÓN REAL CON LA API DE COMPILACIÓN
        const response = await fetch('https://api.tu-servicio-empaquetador.dev/v1/build', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Falló la respuesta del servidor de compilación.');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        logMessage('¡Compilación exitosa! Descargando APK...', 'info');
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-release.apk`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        */

        // Simulación de consola
        setTimeout(() => logMessage('Descomprimiendo estructura HTML5 y assets...', 'info'), 1000);
        setTimeout(() => logMessage('Inyectando contenedor nativo Android y JS Bridge...', 'info'), 2200);
        setTimeout(() => logMessage('Configurando Status Bar y Navigation Bar...', 'info'), 3200);
        setTimeout(() => logMessage('Generando y firmando paquete APK final...', 'info'), 4200);
        setTimeout(() => {
          logMessage('¡Proceso completado! (Conecta el endpoint final para la descarga automática).', 'system');
          buildBtn.disabled = false;
          buildBtn.style.opacity = '1';
        }, 5200);

      } catch (error) {
        logMessage(`Error en el proceso: ${error.message}`, 'error');
        buildBtn.disabled = false;
        buildBtn.style.opacity = '1';
      }
    });
  }
});
