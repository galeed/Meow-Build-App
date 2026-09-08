// ==========================================
// MEOW BUILD APP - CORE LOGIC & API BRIDGE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const consoleLogs = document.getElementById('consoleLogs');
  const buildBtn = document.getElementById('buildBtn');

  // Helper para escribir en la consola terminal
  const logMessage = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let colorStyle = 'color: #00ff66;'; // Verde por defecto

    if (type === 'error') colorStyle = 'color: #ff3333;';
    if (type === 'warn')  colorStyle = 'color: #ffff00;';
    if (type === 'system') colorStyle = 'color: #ffffff;';

    consoleLogs.innerHTML += `<br><span style="${colorStyle}">[${time}] > ${message}</span>`;
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  };

  // 1. Manejo de Selección y Arrastre de Archivos (ZIP)
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    // Eventos Drag & Drop
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
    logMessage(`Archivo cargado con éxito: ${file.name} (${sizeMB} MB)`, 'system');
  }

  // 2. Obtener lista de Native Plugins seleccionados (JS Bridge)
  const getSelectedPlugins = () => {
    const pluginCheckboxes = document.querySelectorAll('.cell.full-width input[type="checkbox"]');
    const activePlugins = [];

    pluginCheckboxes.forEach(cb => {
      if (cb.checked) {
        const labelText = cb.parentElement.textContent.trim();
        activePlugins.push(labelText);
      }
    });

    return activePlugins;
  };

    // 3. Proceso de Compilación / Envió a la API
  if (buildBtn) {
    buildBtn.addEventListener('click', async () => {

      // Vibración de respuesta al tocar el botón (40 milisegundos)
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }

      if (!fileInput.files || fileInput.files.length === 0) {
        logMessage('Error: No has seleccionado ningún proyecto .ZIP.', 'error');
        return;
      }

      // Deshabilitar botón durante el proceso
      buildBtn.disabled = true;
      buildBtn.style.opacity = '0.5';

    

      const appNameInput = document.querySelector('input[placeholder="Mi App Web"]');
      const packageIdInput = document.querySelector('input[placeholder="com.ejemplo.app"]');
      const orientationSelect = document.querySelectorAll('select')[0];
      const offlineSelect = document.querySelectorAll('select')[1];

      const appName = appNameInput ? appNameInput.value : 'Meow App';
      const packageId = packageIdInput ? packageIdInput.value : 'com.meow.app';
      const orientation = orientationSelect ? orientationSelect.value : 'portrait';
      const isOffline = offlineSelect ? offlineSelect.value : 'true';
      const activePlugins = getSelectedPlugins();

      logMessage('Iniciando secuencia de compilación...', 'warn');
      logMessage(`Configuración: [App: ${appName}] | [ID: ${packageId}] | [Orientación: ${orientation}]`, 'system');
      logMessage(`JS Bridge Plugins activos: ${activePlugins.join(', ') || 'Ninguno'}`, 'system');

      // Preparar FormData para la petición HTTP
      const formData = new FormData();
      formData.append('zipFile', fileInput.files[0]);
      formData.append('appName', appName);
      formData.append('packageId', packageId);
      formData.append('orientation', orientation);
      formData.append('offlineMode', isOffline);
      formData.append('plugins', JSON.stringify(activePlugins));

      try {
        logMessage('Enviando paquete .ZIP al servidor de compilación...', 'info');

        /* 
        // ==========================================
        // CONEXIÓN REAL CON LA API DE COMPILACIÓN
        // ==========================================
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

        // Simulación de respuesta de consola para pruebas en local / GitHub Pages
        setTimeout(() => logMessage('Descomprimiendo estructura HTML5 y assets...', 'info'), 1000);
        setTimeout(() => logMessage('Inyectando contenedor nativo Android y JS Bridge...', 'info'), 2200);
        setTimeout(() => logMessage('Generando y firmando paquete APK final...', 'info'), 3500);
        setTimeout(() => {
          logMessage('¡Proceso completado! (Conecta la URL final de la API para iniciar la descarga automática).', 'system');
          buildBtn.disabled = false;
          buildBtn.style.opacity = '1';
        }, 4500);

      } catch (error) {
        logMessage(`Error en el proceso: ${error.message}`, 'error');
        buildBtn.disabled = false;
        buildBtn.style.opacity = '1';
      }
    });
  }
});
