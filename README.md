# 答题小程序

基于 Taro 4.x + React 的跨端答题小程序，支持微信小程序和 H5 平台分离构建。

## 项目信息

- **框架**：Taro 4.x
- **前端框架**：React + TypeScript
- **样式**：Sass/Scss
- **多端支持**：微信小程序、H5（分离构建）

## 数据存储

本项目**无数据库**，所有数据存储在微信小程序本地缓存中。

### 存储方式
- **Taro Storage API** - 使用 `Taro.setStorageSync` / `Taro.getStorageSync` 进行本地持久化
- **存储位置** - 微信小程序的本地缓存（可通过「微信开发者工具」→「详情」→「存储」查看）

### 存储内容
| 数据 | Key | 说明 |
|------|-----|------|
| 测试会话 | `quiz-store` | 当前答题进度、答案、模式 |
| 错题本 | `mistakes-store` | 错题记录、用户答案、添加时间 |

### 清理数据
如需重置数据，可在微信开发者工具中：
1. 打开「详情」→「存储」
2. 点击「清空缓存」或「删除指定数据」

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
