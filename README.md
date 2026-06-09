# 批量申请书生成器

基于 `Electron + Vue 3 + Vite + electron-builder` 的桌面项目骨架，面向批量申请书批量生成、固定位置盖章和 JPG 导出场景。

## 交接文档

- 项目需求功能、实现边界、后续改动注意事项见 `docs/交接文档.md`

## 开发命令

```bash
pnpm install
pnpm dev
```

## 构建 Windows 安装包

```bash
pnpm build:win
```

## 当前已完成

- Electron 主进程、预加载、Vue 渲染层基础工程
- Windows NSIS 打包配置
- Excel 名单导入基础能力
- 文案模板、盖章配置、本地持久化骨架
- 导出记录页面骨架
