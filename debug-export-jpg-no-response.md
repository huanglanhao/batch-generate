# Debug Session: export-jpg-no-response
- **Status**: [OPEN]
- **Issue**: 选择 JPG 导出位置后界面无反应，未生成文件，也没有错误提示
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-export-jpg-no-response.ndjson

## Reproduction Steps
1. 打开工作台页面
2. 点击 `导出 JPG`
3. 在系统文件选择框中选择导出位置并确认
4. 观察界面无提示、无文件输出

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | 主进程 `showSaveDialog` 之后没有继续执行保存逻辑 | High | Low | Pending |
| B | 隐藏导出窗口未正确创建或未加载完成，导致截图阶段未启动 | High | Med | Rejected |
| C | 预加载或 `ipcRenderer` 暴露的导出接口在新导出链路里调用失败 | Med | Med | Confirmed |
| D | 截图返回空数据或写文件失败，但错误被吞掉，所以界面看起来无反应 | High | Med | Rejected |
| E | 渲染进程点击事件执行了，但 Promise 一直未 resolve，导致 UI 无反馈 | Med | Med | Rejected |

## Log Evidence
- 已在以下位置添加 `pre-fix` 埋点，等待复现：
- `src/renderer/stores/app-store.js`
- `src/main/main.js`
- `src/renderer/pages/CaptureExportPage.vue`
- 用户复现后出现弹窗：`导出 JPG 失败：An object could not be cloned.`
- 该错误发生在 Electron IPC 结构化克隆阶段，说明渲染层把 Pinia/Vue 响应式对象直接传给了 `ipcRenderer.invoke(...)`

## Verification Conclusion
- `pre-fix` 现象 1：弹窗报错 `An object could not be cloned.`，导出链路在 `capturePreviewPage` 前的 IPC 克隆阶段失败
- `fix` 1：将导出时传入 IPC 的 `template` / `stamp` 改为 `JSON` 纯对象
- `pre-fix` 现象 2：图片实际已导出，但最后仍弹 `An object could not be cloned.`
- `fix` 2：将 `persistConfig()` 传入主进程的 `template` / `stamp.box` 也改为 `JSON` 纯对象
- `post-fix` 结果：用户确认“导出正常无报错”
