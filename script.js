// ==========================================
// MEOW BUILD APP - CORE LOGIC & API BRIDGE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const consoleLogs = document.getElementById('consoleLogs');
// CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
const GITHUB_USERNAME = "galeedx"; // Ejemplo: galeed
const GITHUB_REPO = "meow-build-app";    // Ejemplo: meow-build-app
const GITHUB_BRANCH = "master";                  // O 'master' según corresponda

// TOKEN DE ACCESO (Personal Access Token con permisos de lectura/escritura en 'contents')
// Para producción pública se recomienda usar una GitHub App o un proxy backend intermedio.
const GITHUB_TOKEN = "ghp_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"; 

// Función helper para convertir archivos a Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

if (buildBtn) {
  buildBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!fileInput.files || fileInput.files.length === 0) {
      logMessage('Error: No has seleccionado ningún archivo .ZIP.', 'error');
      return;
    }

    if (consoleLogs) consoleLogs.innerHTML = '';

    buildBtn.disabled = true;
    buildBtn.style.opacity = '0.5';

    try {
      const zipFile = fileInput.files[0];
      logMessage(`Lectura de paquete local: ${zipFile.name}...`, 'info');

      // 1. Convertir .ZIP a Base64
      const base64Content = await fileToBase64(zipFile);
      logMessage('Archivo convertido con éxito. Preparando envío a la API de GitHub...', 'info');

      // 2. Obtener el SHA del archivo previo en uploads/project.zip (si existe) para poder sobrescribirlo
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
        logMessage('Creando nueva sesión de compilación...', 'system');
      }

      // 3. Subir/Sobrescribir el .ZIP en el repositorio
      const putFileUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/uploads/project.zip`;
      const bodyPayload = {
        message: `Compilación solicitada desde MEOW BUILD - ${new Date().toISOString()}`,
        content: base64Content,
        branch: GITHUB_BRANCH
      };

      if (sha) bodyPayload.sha = sha;

      logMessage('Enviando paquete al servidor de compilación en la nube...', 'warn');

      const uploadRes = await fetch(putFileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!uploadRes.ok) {
        throw new Error(`Error en el envío API (HTTP ${uploadRes.status})`);
      }

      logMessage('¡Paquete subido con éxito!', 'info');
      logMessage('Iniciando entorno de compilación en GitHub Actions...', 'system');
      logMessage('Procesando Android SDK, Java 17 y Gradle...', 'info');
      
      // Enlace donde el usuario puede ver la compilación en vivo y descargar el APK
      const actionsUrl = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/actions`;
      
      logMessage(`> [✓] ¡Proceso iniciado! Puedes ver el progreso y descargar tu APK en:`, 'system');
      logMessage(`<a href="${actionsUrl}" target="_blank" style="color: #00ff66; text-decoration: underline;">VER Y DESCARGAR APK EN GITHUB ACTIONS &rarr;</a>`, 'info');

    } catch (error) {
      logMessage(`Error durante la compilación: ${error.message}`, 'error');
    } finally {
      buildBtn.disabled = false;
      buildBtn.style.opacity = '1';
    }
  });
}  }
});
