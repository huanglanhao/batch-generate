const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');

const DEFAULT_CONFIG = {
  template: {
    title: '登录手机号码修改申请书',
    fontFamily: '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif',
    fontSize: 18,
    textColor: '#111111',
    contentHtml: '{{name}}',
    textBox: {
      x: 160,
      y: 220,
      width: 320,
      height: 56,
    },
  },
  stamp: {
    imagePath: '',
    box: {
      x: 379,
      y: 269,
      width: 284,
      height: 284,
    },
  },
  outputDir: '',
  exportHistory: [],
};

const storeRoot = app.isPackaged
  ? app.getPath('userData')
  : path.join(app.getAppPath(), '.runtime-data');

fs.mkdirSync(storeRoot, { recursive: true });

const store = new Store({
  cwd: storeRoot,
  name: 'application-form-config',
  defaults: DEFAULT_CONFIG,
});

function getConfig() {
  const storedTemplate = store.get('template') || {};
  const storedStamp = store.get('stamp') || {};
  return {
    template: {
      ...DEFAULT_CONFIG.template,
      textBox: {
        ...DEFAULT_CONFIG.template.textBox,
        ...(storedTemplate.textBox || {}),
      },
    },
    stamp: {
      ...DEFAULT_CONFIG.stamp,
      ...storedStamp,
      box: {
        ...DEFAULT_CONFIG.stamp.box,
        ...(storedStamp.box || {}),
      },
    },
    outputDir: store.get('outputDir') || '',
    exportHistory: Array.isArray(store.get('exportHistory')) ? store.get('exportHistory') : [],
  };
}

function saveConfig(payload = {}) {
  const current = getConfig();
  const next = {
    template: {
      textBox: {
        ...current.template.textBox,
        ...((payload.template || {}).textBox || {}),
      },
    },
    stamp: {
      imagePath: payload.stamp?.imagePath ?? current.stamp.imagePath,
      box: {
        ...current.stamp.box,
        ...((payload.stamp || {}).box || {}),
      },
    },
    outputDir: payload.outputDir ?? current.outputDir,
    exportHistory: current.exportHistory,
  };
  store.set('template', { textBox: next.template.textBox });
  store.set('stamp', next.stamp);
  store.set('outputDir', next.outputDir);
  return getConfig();
}

function pushExportHistory(item) {
  const current = getConfig();
  const history = [item, ...current.exportHistory].slice(0, 30);
  store.set('exportHistory', history);
  return history;
}

module.exports = {
  DEFAULT_CONFIG,
  getConfig,
  saveConfig,
  pushExportHistory,
};
