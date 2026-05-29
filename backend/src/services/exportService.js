const PDFDocument = require('pdfkit');

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

function toPdfBuffer(title, rows) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.fontSize(18).text(title);
    doc.moveDown();
    rows.forEach((row, index) => {
      doc.fontSize(11).text(`${index + 1}. ${Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(' | ')}`);
      doc.moveDown(0.5);
    });
    doc.end();
  });
}

module.exports = { toCsv, toPdfBuffer };
