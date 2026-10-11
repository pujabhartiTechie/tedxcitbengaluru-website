/**
 * TEDxCITBengaluru recruitment: saves applications into this Google Sheet.
 *
 * This file does NOT run on the website. Paste it into the Apps Script editor
 * of the Google Sheet (Extensions > Apps Script), then deploy it as a web app.
 * The website sends each finished application to that web app link.
 *
 * Setup, in short:
 *   1. Project Settings > Script Properties > add  SECRET = <a long password>
 *   2. Deploy > New deployment > Web app
 *        Execute as: Me          Who has access: Anyone
 *   3. Put the web app link and the same password into the website settings:
 *        APPS_SCRIPT_URL=...     APPS_SCRIPT_SECRET=...
 *
 * After editing this file you must deploy a NEW VERSION
 * (Deploy > Manage deployments > edit > Version: New version).
 */

var USN_COLUMN = 3; // column C

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse(e.postData.contents);

    var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || data.secret !== secret) {
      return reply({ ok: false, error: 'unauthorized' });
    }
    if (!data.sheetName || !Array.isArray(data.headers) || !Array.isArray(data.row)) {
      return reply({ ok: false, error: 'bad-request' });
    }

    // One application at a time, so two people submitting in the same
    // second can't both pass the duplicate check.
    lock.waitLock(20000);

    var book = SpreadsheetApp.getActiveSpreadsheet();

    if (data.usn && usnExists(book, String(data.usn))) {
      return reply({ ok: false, error: 'duplicate' });
    }

    var sheet = book.getSheetByName(data.sheetName);
    if (!sheet) {
      sheet = book.insertSheet(data.sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(data.headers);
      sheet.getRange(1, 1, 1, data.headers.length).setFontWeight('bold').setBackground('#e6e6e6');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow(data.row);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignored) {}
  }
}

/** Looks for the USN in column C of every tab. */
function usnExists(book, usn) {
  var wanted = usn.trim().toUpperCase();
  var sheets = book.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var lastRow = sheets[i].getLastRow();
    if (lastRow < 2) continue;
    var values = sheets[i].getRange(2, USN_COLUMN, lastRow - 1, 1).getValues();
    for (var r = 0; r < values.length; r++) {
      if (String(values[r][0]).trim().toUpperCase() === wanted) return true;
    }
  }
  return false;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Opening the web app link in a browser shows this, which confirms it is deployed. */
function doGet() {
  return reply({ ok: true, message: 'TEDx recruitment endpoint is running.' });
}
