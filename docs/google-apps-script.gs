/**
 * Vishnu IT — Google Sheet lead receiver (Apps Script web app)
 *
 * Setup (2 minutes):
 * 1. Open your Google Sheet → Extensions → Apps Script → paste this file → Save.
 * 2. Change SECRET below to any random string (same value as GSHEET_SECRET in Vercel env).
 * 3. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * 4. Copy the Web app URL into GSHEET_WEBHOOK_URL (Vercel env) and redeploy the site.
 * Tabs are created automatically (default "LP Leads" and "Website Leads") with a header row.
 */
const SECRET = "change-me";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json({ ok: false, error: "unauthorized" });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(body.tab);
    if (!sheet) sheet = ss.insertSheet(body.tab);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(body.headers);
      sheet.getRange(1, 1, 1, body.headers.length).setFontWeight("bold").setBackground("#0a0f1f").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(body.row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
