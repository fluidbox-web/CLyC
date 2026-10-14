/**
 * Google Apps Script para gestionar testimonios de CL&C DE LA RIVIERA.
 *
 * Funciones:
 * - doPost: recibe un nuevo testimonio enviado desde la web y lo guarda en Google Sheets.
 * - doGet: devuelve en formato JSON todos los testimonios marcados como "Sí" en la columna Aprobado.
 *
 * Instrucciones de instalación:
 * 1. Crea una hoja de Google Sheets.
 * 2. En la primera fila (encabezados) escribe exactamente:
 *    Timestamp | Nombre | Tipo de asunto | Testimonio | Email | Aprobado | Iniciales
 * 3. Abre Extensions > Apps Script.
 * 4. Borra el código por defecto y pega TODO este archivo.
 * 5. Cambia el valor de EMAIL_NOTIFICACION si quieres recibir un aviso por cada testimonio nuevo.
 * 6. Guarda el proyecto (Ctrl+S / Cmd+S).
 * 7. Haz clic en Deploy > New deployment.
 * 8. Selecciona "Web app".
 * 9. En "Execute as" elige tu cuenta.
 * 10. En "Who has access" elige "Anyone".
 * 11. Copia la URL generada y úsala en el .env del proyecto Astro.
 */

// Opcional: correo para recibir notificación cuando llegue un nuevo testimonio.
// Deja vacío ('') si no quieres notificaciones.
const EMAIL_NOTIFICACION = '';

// Nombre exacto de la pestaña de la hoja de cálculo.
const SHEET_NAME = 'Respuestas';

/**
 * Maneja peticiones GET. Devuelve JSON con testimonios aprobados.
 */
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ error: `No se encontró la hoja "${SHEET_NAME}"` }, 500);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return jsonResponse([]);
  }

  const headers = data[0].map((h) => String(h).trim());
  const aprobados = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = row[j];
    }

    if (estaAprobado(rowObj['Aprobado'])) {
      aprobados.push({
        nombre: String(rowObj['Nombre'] || ''),
        tipo: String(rowObj['Tipo de asunto'] || ''),
        testimonio: String(rowObj['Testimonio'] || ''),
        iniciales: String(rowObj['Iniciales'] || ''),
      });
    }
  }

  return jsonResponse(aprobados);
}

/**
 * Maneja peticiones POST. Guarda un nuevo testimonio en la hoja.
 */
function doPost(e) {
  let payload = {};
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: 'JSON inválido' }, 400);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ success: false, message: `No se encontró la hoja "${SHEET_NAME}"` }, 500);
  }

  const nombre = String(payload.nombre || '').trim();
  const tipo = String(payload.tipo || '').trim();
  const testimonio = String(payload.testimonio || '').trim();
  const email = String(payload.email || '').trim();

  if (!nombre || !tipo || !testimonio) {
    return jsonResponse({ success: false, message: 'Faltan campos obligatorios' }, 400);
  }

  sheet.appendRow([
    new Date(),   // Timestamp
    nombre,       // Nombre
    tipo,         // Tipo de asunto
    testimonio,   // Testimonio
    email,        // Email
    '',           // Aprobado (vacío por defecto)
    '',           // Iniciales (vacío por defecto, se genera en el sitio)
  ]);

  if (EMAIL_NOTIFICACION) {
    try {
      MailApp.sendEmail({
        to: EMAIL_NOTIFICACION,
        subject: 'Nuevo testimonio pendiente de aprobación',
        body: [
          'Ha llegado un nuevo testimonio al sitio web.',
          '',
          `Nombre: ${nombre}`,
          `Tipo de asunto: ${tipo}`,
          `Email: ${email || '(no proporcionado)'}`,
          '',
          'Testimonio:',
          testimonio,
          '',
          'Para aprobarlo, abre la hoja de Google Sheets y escribe "Sí" en la columna Aprobado.',
        ].join('\n'),
      });
    } catch (err) {
      console.error('No se pudo enviar el email de notificación:', err);
    }
  }

  return jsonResponse({ success: true, message: 'Testimonio recibido' });
}

/**
 * Responde a peticiones OPTIONS para permitir CORS desde el navegador.
 */
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Determina si una celda de aprobación contiene "Sí".
 */
function estaAprobado(valor) {
  const texto = String(valor || '').toLowerCase().trim();
  return texto === 'sí' || texto === 'si' || texto === 's' || texto === 'yes' || texto === 'y';
}

/**
 * Crea una respuesta JSON con CORS habilitado.
 */
function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  // Nota: Apps Script no siempre respeta setHeader en ContentService,
  // pero la publicación como Web App con acceso "Anyone" suele funcionar correctamente.
  return output;
}
