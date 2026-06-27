# 答题小程序

基于 Taro 4.x + React 的跨端答题小程序，支持微信小程序和 H5 平台分离构建。

## 项目信息

- **框架**：Taro 4.x
- **前端框架**：React + TypeScript
- **样式**：Sass/Scss
- **多端支持**：微信小程序、H5（分离构建）

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Taro 4.1.9 |
| 语言 | TypeScript |
| UI | React |
| 样式 | SCSS Modules |
| 状态管理 | Zundo |

## 预览与发布

### 云预览（推荐）
在 Trae AI 中输入：
```
启动小程序预览服务生成二维码
```
或
```
用小程序云预览
```
AI就会自动
- 调用 generate-mini-app skill 的 preview-server.js 脚本
- 启动云预览服务并打开预览页面（含二维码）

**预览地址**（服务启动后有效）：
```
https://trae.mobile.volcapp.com/preview/?ws=ws://localhost:50228
```
> 提示：如需刷新预览效果，先重新编译（`npm run build:weapp`），然后直接刷新此地址即可，无需重新启动服务。

### 编译构建

**微信小程序**
```bash
npm run build:weapp
```

**H5**
```bash
npm run build:h5
```

**其他平台**
```bash
npm run build:alipay   # 支付宝小程序
npm run build:tt       # 抖音小程序
npm run build:swan     # 百度小程序
npm run build:qq       # QQ 小程序
```

### 本地预览

**微信开发者工具**
1. 打开微信开发者工具
2. 导入项目目录 `/Users/caojuan/Desktop/code/exam`
3. AppID 填写你的小程序 AppID

**H5 本地开发**
```bash
npm run dev:h5
```
然后访问 `http://localhost:10086`
