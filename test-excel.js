const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

// Create sheet with some string values ("006.7"), and numeric values (6.7)
const ws = XLSX.utils.aoa_to_sheet([
  ['title', 'author', 'class no', 'book no', 'acc no '],
  ['Book 1', 'Author A', '006.7', '2177BCA', '123'],
  ['Book 2', 'Author B', '005.13', '2178BCA', '124'],
  ['Book 3', 'Author C', 6.7, '300', '125']
]);
// format the class no column as text
ws['C2'].t = 's';
ws['C3'].t = 's';
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'test.xlsx');
console.log('Created test.xlsx');
