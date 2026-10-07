/**
 * FarmaFest — Publicar precios desde Google Sheets
 *
 * Agrega un menú "FarmaFest" a la planilla con dos acciones:
 *   • Publicar precios  → dispara el pipeline (GitHub Action → ingesta →
 *                          deploy en Cloudflare Pages). En 2–3 min está online.
 *   • Chequear planilla → pre-chequeo rápido de errores, sin publicar.
 *
 * El pre-chequeo NO reemplaza la validación autoritativa de la ingesta
 * (scripts/lib/ingesta.ts): es una ayuda para cazar errores obvios antes de
 * publicar. La verdad final la tiene la ingesta, cuyo reporte queda en el
 * resumen del Action (pestaña Actions del repo).
 *
 * Configuración (una sola vez): ver apps-script/README.md.
 */

var EVENT_TYPE = 'publicar-precios';
var HOJA_PRODUCTOS = 'Productos';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('FarmaFest')
    .addItem('Publicar precios', 'publicarPrecios')
    .addItem('Chequear planilla', 'chequearPlanilla')
    .addToUi();
}

function publicarPrecios() {
  var ui = SpreadsheetApp.getUi();
  var problemas = validar_();
  if (problemas.length) {
    var resp = ui.alert(
      'Se encontraron ' + problemas.length + ' posibles problemas',
      problemas.slice(0, 12).join('\n') +
        (problemas.length > 12 ? '\n… y ' + (problemas.length - 12) + ' más' : '') +
        '\n\n¿Publicar igual? Las filas con error se descartan; el resto se publica.',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GITHUB_TOKEN');
  var repo = props.getProperty('GITHUB_REPO');
  if (!token || !repo) {
    ui.alert(
      'Falta configuración',
      'Configurá GITHUB_TOKEN y GITHUB_REPO en Propiedades del script (ver apps-script/README.md).',
      ui.ButtonSet.OK
    );
    return;
  }

  var res = UrlFetchApp.fetch(
    'https://api.github.com/repos/' + repo + '/dispatches',
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
      },
      payload: JSON.stringify({ event_type: EVENT_TYPE }),
      muteHttpExceptions: true,
    }
  );

  var code = res.getResponseCode();
  if (code === 204) {
    ui.alert(
      '¡Listo! 🚀',
      'Los precios se están publicando. En 2–3 minutos estarán online en la app.\n\n' +
        'Podés seguir el detalle en la pestaña Actions del repositorio.',
      ui.ButtonSet.OK
    );
  } else {
    ui.alert(
      'No se pudo publicar (HTTP ' + code + ')',
      String(res.getContentText()).slice(0, 300),
      ui.ButtonSet.OK
    );
  }
}

function chequearPlanilla() {
  var problemas = validar_();
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    problemas.length ? problemas.length + ' posibles problemas' : 'Todo OK ✓',
    problemas.length
      ? problemas.slice(0, 30).join('\n') +
          (problemas.length > 30 ? '\n… y ' + (problemas.length - 30) + ' más' : '')
      : 'No se detectaron problemas obvios. Igual la ingesta hace la validación final.',
    ui.ButtonSet.OK
  );
}

/** Normaliza un encabezado: minúsculas, sin acentos, solo letras/números. */
function normHead_(h) {
  return String(h)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Pre-chequeo de la pestaña Productos. Detecta el formato:
 *  - POSBerry (tiene columna CUIT): valida por CUIT + descuento en "Familia".
 *  - Propio (tiene columna Stand): valida por Stand.
 * Espejo liviano de la ingesta (la validación final la hace la ingesta).
 */
function validar_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA_PRODUCTOS);
  if (!sh) return ['No existe la pestaña "' + HOJA_PRODUCTOS + '".'];
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return ['La pestaña "' + HOJA_PRODUCTOS + '" está vacía.'];

  var head = data[0].map(normHead_);
  var idxOf = function (variantes) {
    for (var i = 0; i < head.length; i++)
      if (variantes.indexOf(head[i]) >= 0) return i;
    return -1;
  };

  var iCuit = idxOf(['cuitproveedor', 'cuit', 'cuitprov']);
  var posberry = iCuit >= 0;

  // El EAN es "Codigo de Barras" (no "*Codigo" interno).
  var iCod = idxOf(['codigodebarras', 'codigobarras', 'ean', 'codbarras']);
  if (iCod < 0 && !posberry) iCod = idxOf(['codigo']); // formato propio
  var iDesc = idxOf(['descripcion', 'producto', 'nombre', 'detalle']);
  var iPrecio = idxOf(['preciodeventa', 'precio', 'precioventa', 'pvp']);
  var iStand = idxOf(['stand', 'numerodestand', 'nrostand']);

  var faltan = [];
  if (iCod < 0) faltan.push('código de barras');
  if (iDesc < 0) faltan.push('descripción');
  if (iPrecio < 0) faltan.push(posberry ? 'precio de venta' : 'precio');
  if (posberry) {
    if (iCuit < 0) faltan.push('CUIT Proveedor');
  } else if (iStand < 0) {
    faltan.push('stand');
  }
  if (faltan.length) return ['Faltan columnas: ' + faltan.join(', ')];

  var problemas = [];
  var vistos = {};
  for (var r = 1; r < data.length; r++) {
    var fila = r + 1;
    var cod = String(data[r][iCod] || '').trim();
    var desc = String(data[r][iDesc] || '').trim();
    var precio = String(data[r][iPrecio] || '').trim();
    var stand = iStand >= 0 ? String(data[r][iStand] || '').trim() : '';
    var cuit = iCuit >= 0 ? String(data[r][iCuit] || '').replace(/\D/g, '') : '';
    if (!cod && !desc && !precio && !stand && !cuit) continue; // fila vacía

    if (!cod) problemas.push('Fila ' + fila + ': falta código de barras');
    else if (!/^\d{6,14}$/.test(cod))
      problemas.push('Fila ' + fila + ': código inválido «' + cod + '»');
    else if (vistos[cod])
      problemas.push('Fila ' + fila + ': código ' + cod + ' duplicado (fila ' + vistos[cod] + ')');
    else vistos[cod] = fila;

    if (!desc) problemas.push('Fila ' + fila + ': falta descripción');

    var num = Number(precio.replace(/[$\s.]/g, '').replace(',', '.'));
    if (precio && (!isFinite(num) || num <= 0))
      problemas.push('Fila ' + fila + ': precio inválido «' + precio + '»');

    if (posberry && !cuit)
      problemas.push('Fila ' + fila + ': falta CUIT (no se puede asignar el stand)');

    // Nota: la columna "Familia" lleva el NOMBRE de la familia (ej. "40%",
    // "2X1", "2DO70%"), no un número. La mecánica de cada familia se define en
    // la tabla de familias (data-src/familias.csv); la ingesta valida que cada
    // familia usada exista allí, así que acá no se chequea su contenido.
  }
  return problemas;
}
