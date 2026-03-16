const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ['Title', 'Author', 'Class No', 'book no', 'Acc NO'],
  ['Book 1', 'Author A', '006.7', '2177BCA', '123'],
  ['Book 2', 'Author B', '005.13', '2178BCA', '124'],
  ['Book 3', 'Author C', 6.7, '300', '125']
]);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

let out = "";
const sheet = wb.Sheets[wb.SheetNames[0]];

out += "DEFAULT:\n" + JSON.stringify(XLSX.utils.sheet_to_json(sheet), null, 2);
out += "\n\nRAW: FALSE:\n" + JSON.stringify(XLSX.utils.sheet_to_json(sheet, { raw: false }), null, 2);
out += "\n\nRAW: STRING (defval: ''):\n" + JSON.stringify(XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' }), null, 2);
// What about rawNumbers? 
out += "\n\nHEADER mapping: \n";
out += JSON.stringify(XLSX.utils.sheet_to_json(sheet, { header: 1 }), null, 2);

fs.writeFileSync('test-output.log', out, 'utf8');
