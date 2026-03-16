const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ['Title', 'Author', 'Class No', 'book no', 'Acc NO'],
  ['Book 1', 'Author A', '006.7', '2177BCA', '123'],
  ['Book 2', 'Author B', '005.13', '2178BCA', '124'],
  ['Book 3', 'Author C', 6.7, '300', '125']
]);
// Force string format for the numbers so they mock user input in Excel formatted as general vs string
// Actually aoa_to_sheet already treats strings as text cells.
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'test.xlsx');

const readWb = XLSX.readFile('test.xlsx');
const sheet = readWb.Sheets[readWb.SheetNames[0]];

console.log("DEFAULT (raw: true):");
console.log(XLSX.utils.sheet_to_json(sheet));

console.log("\nWITH raw: false:");
console.log(XLSX.utils.sheet_to_json(sheet, { raw: false }));

console.log("\nWITH defval: '', raw: false:");
console.log(XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }));

// What happens if we write actual number 006.7 in Excel? Excel stores it as 6.7. If the user typing it sees 6.7, they will complain it's 6.7. But the user said: "if it 006.7 so take 6.7". Wait, NO! The user said: "if it 006.7 so take 6.7". Oh my gosh, did they literally mean "if the user types 006.7, it SHOULD take 6.7"??? "and if 005.13 so 005.13. You see in the screenshot its not working fix the error."
// Yes, their spreadsheet screenshot shows `006.7` as the FIRST item? No, their screenshot shows `6.7` in the browser. And `005.13` ? Wait, let's look at their screenshots.
