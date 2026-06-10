export function renderDocumentText(template, name) {
  return String(template || '').replaceAll('{{name}}', name || '');
}

export function sanitizeExportBaseName(name) {
  return (
    String(name || '')
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-') || '未命名'
  );
}

function normalizeExportExtension(format = 'jpg') {
  const normalized = String(format || 'jpg').trim().toLowerCase();
  return normalized === 'png' ? 'png' : 'jpg';
}

export function buildExportFileName(name, format = 'jpg') {
  return `${sanitizeExportBaseName(name)}.${normalizeExportExtension(format)}`;
}

export function buildUniqueExportFileName(name, usedNameMap, format = 'jpg') {
  const baseName = sanitizeExportBaseName(name);
  const extension = normalizeExportExtension(format);
  const nextCount = (usedNameMap.get(baseName) || 0) + 1;
  usedNameMap.set(baseName, nextCount);
  if (nextCount === 1) {
    return `${baseName}.${extension}`;
  }
  return `${baseName}(${nextCount}).${extension}`;
}
