---
name: 统一前端建材清单 + HTML靶子组件小纸条工作法
description: 真前端阶段统一用 isdream-vue-admin(Element Plus)底座；各页面在HTML里写组件小纸条注释，真前端照样式+纸条快速套组件
type: project
---

# 统一前端建材 + 组件小纸条工作法

夏夏 2026-07-12 定。时间少，工作法要省力：**HTML先画好样子当靶子 → 每块地在自己HTML里写"该用哪个组件"的小纸条 → 真前端阶段只看样式+照纸条调组件，秒上手。**

## 统一建材（供应商统一，别各买各的）
选定 **isdream-vue-admin**（已下载到 `deliverables/isdream-vue-admin-main`）：Vue3+TS+Vite+Element Plus，1.4.0。比之前"vue-element-plus-admin+formily 两套拼"更省——一套全包，二次封装好、JSON配置即用。
- **UI底座**：Element Plus
- **表单**：isdream `Form` 组件（fields JSON配置自动渲染+校验，替代 formily）
- **表格**：isdream `Table`（多级表头 children 做三阶段漏斗横排、customRender 做勾选口/冻结、[key]-header 插槽）
- **弹窗**：`formDialog`（表单+弹窗合体，做详情/编辑弹窗）
- **上传预览**：`upload` + `v-viewer`(图片预览)；富文本 tinymce/vditor
- **图表**：echarts　**日历**：Element Plus el-calendar
- **CSS皮**：仍用美化版红金基准(Noto Serif SC + #B22222/#C8A45C)覆盖 Element Plus 默认皮

## 各房间按需选件（统一底座下，各领地挑自己需要的）
不是各挑各的库，是同一套 isdream 里挑自己用得上的组件。每块地巡检时给自己挑，写进本页HTML注释。

## 组件小纸条格式（写在每个页面HTML顶部注释区）
```
组件小纸条(真前端照此套 isdream 组件)：
- [某区块] → isdream 的 [某组件] + [关键配置/插槽]
例：候选人三阶段表 → Table(多级表头children做提名/正式/竞选，customRender做✓✕冻结)
   详情弹窗 → formDialog + upload + v-viewer(附件预览)
```

## 关键提醒（免回旋镖）
现 demo 是**静态HTML**，isdream 是**Vue3工程**。现在拿它当**样式靶子+组件对照**（HTML长成它组件的样子、注释写清对应组件），真正套组件是**工程化那一棒**的活。跟"HTML即设计稿靶子"一致。

**How to apply**：做/巡检任何页面时，在HTML顶部注释区写组件小纸条(该区块对应 isdream 哪个组件+配置)。真前端阶段照样式+纸条快速套，不用重新想选型。
