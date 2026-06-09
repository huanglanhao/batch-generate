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

export function buildExportFileName(name) {
  return `${sanitizeExportBaseName(name)}.jpg`;
}

export function buildUniqueExportFileName(name, usedNameMap) {
  const baseName = sanitizeExportBaseName(name);
  const nextCount = (usedNameMap.get(baseName) || 0) + 1;
  usedNameMap.set(baseName, nextCount);
  if (nextCount === 1) {
    return `${baseName}.jpg`;
  }
  return `${baseName}(${nextCount}).jpg`;
}
