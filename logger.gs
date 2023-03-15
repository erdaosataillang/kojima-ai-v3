
function log(message) {
  const logss = SpreadsheetApp.getActive();
  let logsh = logss.getSheetByName('log');
  if (logsh == null) {
    logsh = logss.insertSheet();
    logsh.setName('log');
  }

  logsh.appendRow([
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
    message
  ]);
}
