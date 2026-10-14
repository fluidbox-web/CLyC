# Instrucciones: Sistema de Testimonios

Este documento explica paso a paso cómo configurar el sistema de testimonios para que las clientas puedan enviar su experiencia, la dueña los apruebe desde Google Sheets y el sitio se actualice automáticamente una vez al día.

---

## ¿Cómo funciona?

1. La clienta llena el formulario **"Comparte tu experiencia"** en la web.
2. El testimonio se guarda en una **hoja de Google Sheets**.
3. La dueña revisa la hoja y escribe **"Sí"** en la columna **Aprobado**.
4. Cada día, **GitHub Actions** le dice a **Netlify** que reconstruya el sitio.
5. Al reconstruirse, Astro lee solo los testimonios aprobados y los muestra en la web.

---

## Paso 1: Crear la hoja de Google Sheets

1. Ve a [Google Sheets](https://sheets.new) y crea una hoja en blanco.
2. En la **primera fila** escribe exactamente estos encabezados (respeta mayúsculas y acentos):

   ```
   Timestamp | Nombre | Tipo de asunto | Testimonio | Email | Aprobado | Iniciales
   ```

3. Guarda la hoja con un nombre fácil de recordar, por ejemplo: **"Testimonios CLyC"**.
4. A la pestaña actual cámbiale el nombre a **"Respuestas"** (clic derecho en la pestaña → Rename).

---

## Paso 2: Crear y publicar el Google Apps Script

1. Dentro de la hoja de Sheets, ve al menú **Extensions → Apps Script**.
2. Se abrirá una nueva pestaña. Borra el código que aparece por defecto.
3. Copia todo el contenido del archivo `scripts/google-apps-script.js` de este repositorio y pégalo en Apps Script.
4. *(Opcional)* En la línea `const EMAIL_NOTIFICACION = '';` escribe el correo de la dueña para que reciba una notificación cada vez que llegue un testimonio:

   ```js
   const EMAIL_NOTIFICACION = 'dueña@email.com';
   ```

5. Guarda el proyecto con **Ctrl+S** (o **Cmd+S** en Mac).
6. Haz clic en el botón **Deploy → New deployment**.
7. En el icono de engranaje (⚙️) selecciona **Web app**.
8. Configura así:
   - **Description**: "Testimonios CLyC"
   - **Execute as**: tu cuenta de Google
   - **Who has access**: **Anyone**
9. Haz clic en **Deploy**.
10. Google te pedirá autorizar permisos. Acepta todos.
11. Al final obtendrás una **Web App URL** similar a:

    ```
    https://script.google.com/macros/s/AKfycbxXXXXXXX/exec
    ```

12. **Copia esa URL**, la necesitarás en los siguientes pasos.

> **Importante**: si en el futuro cambias el código de Apps Script, debes hacer **Deploy → Manage deployments → Edit → Version → New version** y volver a publicar.

---

## Paso 3: Configurar variables de entorno en Netlify

1. Ve al panel de Netlify y entra al sitio.
2. Ve a **Site settings → Environment variables**.
3. Agrega una nueva variable:
   - **Key**: `PUBLIC_TESTIMONIALS_API_URL`
   - **Value**: la URL del Web App de Apps Script que copiaste en el paso anterior.
4. Guarda los cambios.

Esta variable es la que usa Astro para:
- Enviar el formulario desde el navegador.
- Leer los testimonios aprobados al compilar el sitio.

---

## Paso 4: Configurar el Build Hook de Netlify

1. En Netlify, ve a **Site settings → Build & deploy → Continuous deployment → Build hooks**.
2. Haz clic en **Add build hook**.
3. Ponle un nombre, por ejemplo: **"Daily testimonials rebuild"**.
4. Selecciona la rama **main**.
5. Copia la URL generada, que se verá así:

   ```
   https://api.netlify.com/build_hooks/XXXXXXXXXXXXXXXXXXXX
   ```

---

## Paso 5: Guardar el Build Hook en GitHub

1. Ve al repositorio en GitHub: `https://github.com/fluidbox-web/CLyC`.
2. Ve a **Settings → Secrets and variables → Actions**.
3. Haz clic en **New repository secret**.
4. Crea un secreto:
   - **Name**: `NETLIFY_BUILD_HOOK_URL`
   - **Secret**: la URL del build hook que copiaste en el paso anterior.
5. Guarda.

Con esto, el workflow `.github/workflows/daily-rebuild.yml` podrá disparar un rebuild todos los días.

---

## Paso 6: Desactivar el deploy automático continuo de Netlify (opcional pero recomendado)

Como ahora el rebuild lo controla GitHub Actions una vez al día, para evitar builds innecesarios cada vez que hagas push:

1. En Netlify ve a **Site settings → Build & deploy → Continuous deployment → Build settings**.
2. Haz clic en **Edit settings**.
3. Desmarca la opción **"Build command"** o desactiva **"Automatic deploys"** si Netlify lo permite.

Si no encuentras esa opción, no te preocupes: el sitio seguirá funcionando, solo que se reconstruirá tanto al hacer push como diariamente.

---

## Paso 7: Probar el flujo completo

1. Desde tu computadora local, crea un archivo `.env` en la raíz del proyecto (ya hay un `.env.example` como referencia) y pega la URL de Apps Script:

   ```env
   PUBLIC_TESTIMONIALS_API_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
   ```

2. Ejecuta en la terminal:

   ```bash
   npm run build
   ```

3. Si el build es exitoso, sube los cambios a GitHub:

   ```bash
   git add .
   git commit -m "Agrega sistema de testimonios con Google Sheets"
   git push origin main
   ```

4. Ve al sitio web, llena el formulario de testimonios y envía uno.
5. Revisa la hoja de Google Sheets: debe aparecer una nueva fila con **Aprobado** vacío.
6. Escribe **"Sí"** en la columna **Aprobado**.
7. En Netlify, ve a **Deploys** y haz clic en **Trigger deploy → Deploy site** (o espera al día siguiente para que GitHub Actions lo haga automáticamente).
8. Cuando termine el deploy, el testimonio aprobado debe aparecer en la sección de testimonios.

---

## Uso diario para la dueña

1. **Recibir testimonios**: cada vez que alguien envíe uno, aparecerá en la hoja de Google Sheets.
2. **Aprobar**: escribe **"Sí"** en la columna **Aprobado**.
3. **Esperar**: al día siguiente, el sitio se actualizará automáticamente.
4. **Urgente**: si quiere publicarlo antes, puede ir a Netlify → Deploys → **Trigger deploy**.

---

## Solución de problemas

### El formulario dice "Error de configuración"
Significa que la variable `PUBLIC_TESTIMONIALS_API_URL` no está configurada en Netlify. Revisa el Paso 3.

### Los testimonios no aparecen en la web
- Revisa que en la hoja de Google Sheets la columna **Aprobado** diga exactamente **"Sí"** (con tilde) o **"Si"**.
- Revisa que la URL de Apps Script esté bien escrita en Netlify.
- Revisa los logs del último deploy en Netlify para ver si hubo un error al hacer `fetch`.

### No llegan los testimonios a Google Sheets
- Abre Apps Script y haz clic en **Executions** para ver si hay errores.
- Asegúrate de que la hoja se llame exactamente **"Respuestas"**.
- Asegúrate de que el despliegue del Web App tenga acceso **"Anyone"**.

### El rebuild diario no funciona
- Verifica que el secreto `NETLIFY_BUILD_HOOK_URL` esté guardado en GitHub.
- Ve a **Actions** en el repositorio de GitHub y revisa si el workflow se ejecuta correctamente.

---

## Costos

Todo el sistema es **gratuito** para el volumen esperado:
- Google Sheets: gratis.
- Google Apps Script: gratis (dentro de las cuotas estándar).
- GitHub Actions: gratis para repositorios públicos (cron diario incluido).
- Netlify: el plan gratuito permite build hooks y deploys normales.

---

## Archivos modificados/agregados en este proyecto

- `src/components/Testimonials.astro` — ahora lee testimonios desde Apps Script.
- `src/components/TestimonialForm.astro` — formulario para enviar testimonios.
- `src/pages/index.astro` — incluye el nuevo formulario.
- `.github/workflows/daily-rebuild.yml` — rebuild diario en Netlify.
- `.env.example` — ejemplo de variable de entorno.
- `scripts/google-apps-script.js` — código para copiar en Google Apps Script.
- `INSTRUCCIONES_TESTIMONIOS.md` — este archivo.
