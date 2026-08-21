const XLSX = require('xlsx');

const SHOP_PHONE_HEADERS = new Set(['店铺手机号', '店铺手机号码']);

function cellToText(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.round(value));
  }
  return String(value || '').trim();
}

function extractDigits(value) {
  return cellToText(value).replace(/\D/g, '');
}

function extractFullPhone(value) {
  const digits = extractDigits(value);
  return /^1\d{10}$/.test(digits) ? digits : '';
}

function extractMaskedPattern(value) {
  const text = cellToText(value).replace(/\s+/g, '');
  const fullPhone = extractFullPhone(text);
  if (fullPhone) {
    return {
      type: 'full',
      prefix: fullPhone.slice(0, 3),
      suffix: fullPhone.slice(-4),
      key: `${fullPhone.slice(0, 3)}${fullPhone.slice(-4)}`,
      phone: fullPhone,
    };
  }

  const matched = text.match(/^(\d{3})[*＊xX×]{2,}(\d{4})$/);
  if (!matched) return null;
  return {
    type: 'masked',
    prefix: matched[1],
    suffix: matched[2],
    key: `${matched[1]}${matched[2]}`,
  };
}

function buildPhoneIndex(phones) {
  const index = new Map();
  for (const item of phones) {
    const phone = extractFullPhone(item);
    if (!phone) continue;
    const key = `${phone.slice(0, 3)}${phone.slice(-4)}`;
    const current = index.get(key) || [];
    if (!current.includes(phone)) current.push(phone);
    index.set(key, current);
  }
  return index;
}

function matchShopPhone(original, phoneIndex) {
  const pattern = extractMaskedPattern(original);
  if (!pattern) {
    return { status: 'unrecognized', original, matched: '' };
  }
  if (pattern.type === 'full') {
    return { status: 'already-full', original, matched: pattern.phone };
  }

  const candidates = phoneIndex.get(pattern.key) || [];
  if (candidates.length === 1) {
    return { status: 'matched', original, matched: candidates[0] };
  }
  if (candidates.length > 1) {
    return { status: 'ambiguous', original, matched: '', candidates };
  }
  return { status: 'unmatched', original, matched: '' };
}

function normalizeHeader(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function findShopPhoneColumnIndex(headers = []) {
  const normalized = headers.map((item) => normalizeHeader(item));
  const exactIndex = normalized.findIndex((item) => SHOP_PHONE_HEADERS.has(item));
  if (exactIndex >= 0) return exactIndex;
  return normalized.findIndex((item) => item.includes('店铺手机号'));
}

function extractPhonesFromWorkbook(workbook) {
  const phones = [];
  const seen = new Set();
  for (const sheetName of workbook.SheetNames || []) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
    for (const row of rows) {
      for (const cell of row || []) {
        const phone = extractFullPhone(cell);
        if (!phone || seen.has(phone)) continue;
        seen.add(phone);
        phones.push(phone);
      }
    }
  }
  return phones;
}

function walkShopPhoneRows(workbook, onRow) {
  let foundColumn = false;
  for (const sheetName of workbook.SheetNames || []) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
    const columnIndex = findShopPhoneColumnIndex(rows[0] || []);
    if (columnIndex < 0) continue;
    foundColumn = true;
    const columnName = normalizeHeader((rows[0] || [])[columnIndex]) || '店铺手机号';
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const original = cellToText((rows[rowIndex] || [])[columnIndex]);
      if (!original) continue;
      onRow({
        sheet,
        sheetName,
        columnName,
        columnIndex,
        rowIndex,
        excelRow: rowIndex + 1,
        original,
      });
    }
  }
  return foundColumn;
}

function collectMatchPreview(workbook, phoneIndex) {
  const rows = [];
  const foundColumn = walkShopPhoneRows(workbook, (item) => {
    const result = matchShopPhone(item.original, phoneIndex);
    rows.push({
      sheetName: item.sheetName,
      columnName: item.columnName,
      rowIndex: item.excelRow,
      original: item.original,
      matched: result.matched,
      status: result.status,
    });
  });
  if (!foundColumn) {
    throw new Error('未找到「店铺手机号」列，请导入包含该字段的匹配表格');
  }
  return rows;
}

function applyMatchesToWorkbook(workbook, phoneIndex) {
  const preview = [];
  const foundColumn = walkShopPhoneRows(workbook, (item) => {
    const result = matchShopPhone(item.original, phoneIndex);
    preview.push({
      sheetName: item.sheetName,
      columnName: item.columnName,
      rowIndex: item.excelRow,
      original: item.original,
      matched: result.matched,
      status: result.status,
    });
    if (result.status !== 'matched') return;
    const cellAddress = XLSX.utils.encode_cell({ r: item.rowIndex, c: item.columnIndex });
    item.sheet[cellAddress] = {
      t: 's',
      v: result.matched,
    };
  });
  if (!foundColumn) {
    throw new Error('未找到「店铺手机号」列，请导入包含该字段的匹配表格');
  }
  return preview;
}

function summarizeMatchRows(rows = []) {
  return rows.reduce((summary, item) => {
    if (item.status === 'matched') summary.matched += 1;
    else if (item.status === 'already-full') summary.alreadyFull += 1;
    else if (item.status === 'ambiguous') summary.ambiguous += 1;
    else if (item.status === 'unmatched') summary.unmatched += 1;
    else summary.unrecognized += 1;
    return summary;
  }, {
    total: rows.length,
    matched: 0,
    alreadyFull: 0,
    unmatched: 0,
    ambiguous: 0,
    unrecognized: 0,
  });
}

function parsePhoneSourceWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const phones = extractPhonesFromWorkbook(workbook);
  if (!phones.length) {
    throw new Error('未识别到有效手机号，请导入 11 位完整手机号表格');
  }
  return {
    filePath,
    phones,
    count: phones.length,
  };
}

function parsePhoneTargetWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const preview = collectMatchPreview(workbook, new Map());
  if (!preview.length) {
    throw new Error('匹配表格中没有可识别的店铺手机号');
  }
  return {
    filePath,
    sheetName: preview[0].sheetName,
    columnName: preview[0].columnName,
    rows: preview,
    count: preview.length,
  };
}

function analyzePhoneMatch(sourceFilePath, targetFilePath) {
  const source = parsePhoneSourceWorkbook(sourceFilePath);
  const workbook = XLSX.readFile(targetFilePath);
  const phoneIndex = buildPhoneIndex(source.phones);
  const rows = collectMatchPreview(workbook, phoneIndex);
  return {
    source,
    target: {
      filePath: targetFilePath,
      sheetName: rows[0]?.sheetName || '',
      columnName: rows[0]?.columnName || '店铺手机号',
      count: rows.length,
    },
    rows,
    summary: summarizeMatchRows(rows),
  };
}

function exportMatchedWorkbook(sourceFilePath, targetFilePath, outputPath) {
  const source = parsePhoneSourceWorkbook(sourceFilePath);
  const workbook = XLSX.readFile(targetFilePath);
  const phoneIndex = buildPhoneIndex(source.phones);
  const rows = applyMatchesToWorkbook(workbook, phoneIndex);
  XLSX.writeFile(workbook, outputPath);
  return {
    filePath: outputPath,
    rows,
    summary: summarizeMatchRows(rows),
  };
}

module.exports = {
  cellToText,
  extractFullPhone,
  extractMaskedPattern,
  buildPhoneIndex,
  matchShopPhone,
  findShopPhoneColumnIndex,
  extractPhonesFromWorkbook,
  collectMatchPreview,
  applyMatchesToWorkbook,
  summarizeMatchRows,
  parsePhoneSourceWorkbook,
  parsePhoneTargetWorkbook,
  analyzePhoneMatch,
  exportMatchedWorkbook,
};
