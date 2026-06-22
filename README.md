# WizCloud

WebDAV 云盘空间分析器 — 在浏览器中扫描远程云盘的文件占用，并导出为 WizTree 兼容的 CSV 文件。

<p align="center">

  <img src="https://img.shields.io/badge/HTML5-Single%20File-orange?logo=html5" alt="Single File">

  <img src="https://img.shields.io/badge/Dependencies-Zero-brightgreen" alt="Zero Dependencies">

  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License">

</p>

## 这是什么

一个纯前端的 WebDAV 空间分析工具。连接任意 WebDAV 服务器后，它会递归扫描所有目录和文件，生成交互式的 Treemap 可视化，并能将扫描结果导出为 [WizTree](https://www.diskanalyzer.com/) 可直接导入的 CSV 文件。

**典型用途：** 你的 NAS 或云盘通过 WebDAV 对外提供服务，想快速了解哪些文件/目录占用了最多空间，又希望借助 WizTree 的桌面端分析能力做进一步探索。

## 功能特性

| 功能 | 说明 |

|---|---|

| **Treemap 可视化** | 基于 Squarified Treemap 算法，鼠标悬停查看文件名、大小、类型，点击进入子目录 |

| **文件列表** | 支持按名称/大小/文件数排序，双击目录可下钻，点击展开按钮可展开树 |

| **实时进度** | 显示扫描目录数、文件数、总大小、队列长度、扫描速度、耗时、重试次数 |

| **WizTree CSV 导出** | 生成与 WizTree 原生导出格式一致的 CSV（UTF-8 BOM、目录路径带尾部 `\`、无引号包裹） |

| **CSV 预览** | 导出前可预览完整 CSV 内容，支持一键复制 |

| **文件类型分类** | 图片、视频、音频、文档、压缩包、代码、数据文件分别着色 |

| **CORS 代理** | 内置代理开关，配合本地代理脚本解决浏览器跨域限制 |

| **配置持久化** | 自动保存服务器地址、用户名、代理设置到 localStorage |

## 快速开始

### 1. 直接使用

下载 `wizcloud.html`，用浏览器打开即可。无需安装任何依赖。

### 2. 连接 WebDAV

1. 填入 WebDAV 服务器地址（如 `https://dav.example.com/dav/`）

2. 填入用户名和密码（如有）

3. 点击 **扫描**

### 3. 导出 CSV

扫描完成后点击 **导出 CSV**，将生成的 `.csv` 文件导入 WizTree 即可。

## CORS 跨域问题

浏览器直接请求 WebDAV 服务器通常会遇到跨域限制。以下几种方案任选其一：

### 方案一：本地代理（推荐）

项目提供了一个简单的代理脚本，将浏览器请求转发到 WebDAV 服务器，绕过 CORS 限制。

**Node.js 版：**

```bash

# 保存为 proxy.js，然后运行

node proxy.js

```

**Python 版：**

```bash

# 保存为 proxy.py，然后运行

python proxy.py

```

运行后在页面中开启「CORS 代理」开关，代理地址填 `http://localhost:8066`，点击「测试连接」确认就绪即可。

### 方案二：服务器端配置 CORS 头

在 WebDAV 服务器的响应中添加：

```

Access-Control-Allow-Origin: *

Access-Control-Allow-Methods: PROPFIND, OPTIONS

Access-Control-Allow-Headers: Content-Type, Depth, Authorization

```

### 方案三：浏览器扩展

安装 [CORS Unblock](https://chromewebstore.google.com/detail/cors-unblock/lfhmfnemoclhfdclpnkagbjcmainiiik) 等扩展临时禁用 CORS 检查。

### 方案四：启动参数（仅限开发）

```bash

# macOS

open -n -a "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome-dev

# Windows

chrome.exe --disable-web-security --user-data-dir=C:\tmp\chrome-dev

```

## WizTree CSV 导入说明

导出的 CSV 文件兼容 WizTree 的导入格式（`文件 → 导入 CSV 文件`）：

- **编码：** UTF-8 with BOM

- **列头：** `File Name,Size,Allocated,Modified,Attributes,Files`

- **路径格式：** `Z:\Documents\Work\`（目录带尾部反斜杠）

- **无引号包裹：** 所有字段均为纯文本，以逗号分隔

- **日期格式：** `YYYY/M/D HH:MM:SS`（与 WizTree 原生导出一致）

> 如果导入时仍然报错，请先点击「预览」按钮检查 CSV 内容，确认格式无误后使用「复制全部内容」手动粘贴到记事本保存。

## 技术细节

- **纯前端：** 单个 HTML 文件，零依赖，无构建步骤

- **Treemap 算法：** Squarified Treemap（Bruls et al., 2000），追求尽可能接近正方形的区块比例

- **WebDAV 协议：** 使用 `PROPFIND` + `Depth: 1` 递归遍历目录树

- **并发控制：** 默认 4 路并发扫描，避免对服务器造成过大压力

- **错误恢复：** 单个目录扫描失败时自动跳过，支持自动重试（最多 3 次），失败目录不阻塞整体扫描

- **浏览器兼容：** 依赖 `fetch`、`Promise.allSettled`、`DOMParser`、`ResizeObserver` 等现代 API，建议使用 Chrome 80+ / Firefox 78+ / Safari 14+

## 项目结构

```

wizcloud.html          # 完整应用（单文件）

README.md              # 本文件

proxy.js               # CORS 代理脚本（Node.js，可选）

proxy.py               # CORS 代理脚本（Python，可选）

```

## 截图

### 主界面 — 扫描中

扫描过程中实时显示进度、文件数量和扫描速度。

### 主界面 — Treemap

扫描完成后，Treemap 展示空间分布，不同文件类型以不同颜色区分。鼠标悬停查看详情，点击进入子目录。

### CSV 预览

导出前可预览 CSV 内容，确认格式正确后再下载。

## 许可证

MIT License
