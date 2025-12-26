# OOAD 数独乐乐

基于 Svelte + Tailwind CSS 构建的数独项目，运行链接为 [Play Sudoku](https://lwshu0.github.io/sudoku-app/)

## 📋 环境要求

| 工具/环境     | 版本要求   | 说明                 |
| ------------- | ---------- | -------------------- |
| Node.js       | v20.19.6   | 项目运行核心环境     |
| NVM (Windows) | 最新稳定版 | Node.js 版本管理工具 |
| VS Code       | 最新稳定版 | 推荐集成开发环境     |

## 🔌 VS Code 推荐插件

为保证开发体验和代码规范性，建议安装以下插件：

| 插件名称                  | 插件功能                                                    | 插件ID（快速搜索安装）      |
| ------------------------- | ----------------------------------------------------------- | --------------------------- |
| Svelte for VS Code        | 提供 Svelte 语言完整支持（语法高亮、智能提示、格式化等）    | `svelte.svelte-vscode`      |
| Tailwind CSS IntelliSense | Tailwind CSS 智能工具（类名自动补全、悬停预览、语法高亮等） | `bradlc.vscode-tailwindcss` |
| Prettier - Code formatter | 代码格式化工具，保证团队代码风格统一                        | `esbenp.prettier-vscode`    |

## 🛠 环境配置步骤

### 1. 安装 NVM (Windows)

用于灵活管理 Node.js 版本，避免版本冲突问题：

- 下载地址：[nvm-windows 发布页](https://github.com/coreybutler/nvm-windows/releases)
- 推荐下载 `nvm-setup.exe` 安装包，按照默认向导完成安装

### 2. 通过 NVM 安装 Node.js v20

打开 **管理员权限** 的命令提示符（CMD）或 PowerShell，执行以下命令：

```bash
# 安装 Node.js 20 系列（自动匹配 20.19.6 最新稳定版）
nvm install 20

# 切换使用 Node.js 20 版本
nvm use 20

# 验证安装是否成功
node -v  # 输出 v20.19.6 即为成功
npm -v   # 验证 npm 配套版本
```

### 3. 克隆项目仓库

```bash
# 替换为实际项目仓库地址（SSH 示例）
git clone git@github.com:LWshu0/sudoku-app.git

# 进入项目根目录
cd 项目文件夹名称
```

### 4. 安装项目依赖

```bash
# 使用 npm 安装所有 package.json 声明的依赖
npm install
```

### 5. 构建项目（验证配置有效性）

```bash
# 执行项目构建命令
npm run build
```

- 构建过程无报错，说明环境配置和项目依赖均正常
- 构建成功后，项目根目录会生成 `dist` 或对应构建输出目录

### 6. 启动开发环境

```bash
# 运行开发服务，支持热更新
npm run dev
```

- 命令执行成功后，终端会输出本地访问地址（通常为 `http://localhost:5173` 或对应端口）
- 打开浏览器访问该地址，即可进行项目开发
- 开发环境启动后，修改 Svelte 组件或 Tailwind 样式，浏览器会自动热更新，无需手动刷新
