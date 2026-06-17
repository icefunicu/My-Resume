# 本地开发性能指南

这份说明专门面向“仓库源码放在外置盘，但希望开发性能仍尽可能高”的场景。

## 结论先说

外置盘场景下，最成熟、最稳妥的做法不是强行让 Next.js 把构建目录写到项目目录之外，因为官方明确要求 `distDir` 不能离开项目目录。更可行的办法是：

1. 让 Next.js 继续写项目内的相对目录。
2. 把这个相对目录做成 Windows junction。
3. 让 junction 的真实目标落在本地 SSD 或本地 Dev Drive。

这样做的结果是：

- 源码和 Git 仓库仍然保留在外置盘。
- 高频写入的开发缓存落在本地快盘。
- 对 Next.js、Playwright、ESLint、构建脚本都保持兼容。

## 仓库内已提供的能力

### 开发脚本

- `npm run dev`
  - 标准开发命令，使用 `next dev`。
- `npm run dev:webpack`
  - 用于和 Turbopack 做短时对照。
- `npm run dev:trace`
  - 仅排障时使用，开启 `NEXT_TURBOPACK_TRACING=1`。
- `npm run setup:fast-dev-cache`
  - 创建 `.next-dev-cache` 链接目录，真实缓存写入本地 SSD。
- `npm run dev:external`
  - 外置盘友好模式，使用 `.next-dev-cache` 作为开发缓存目录，并启用更轻的开发背景效果。
- `npm run dev:external:webpack`
  - 外置盘友好模式下的 webpack 对照命令。
- `npm run dev:external:trace`
  - 外置盘友好模式下的 tracing 排障命令。

### 配置约束

- `next.config.ts` 会校验 `NEXT_DIST_DIR`：如果设置了该变量，最终解析路径必须仍在项目目录内。
- 外置盘友好模式使用项目内 `.next-dev-cache` 作为 `NEXT_DIST_DIR`，再由 `scripts/setup-fast-dev-cache.mjs` 把这个目录链接到本地快盘。
- 因此不要把 `NEXT_DIST_DIR` 直接指向项目外路径；如需迁移 I/O，请通过 `.next-dev-cache` 链接目录完成。

## 推荐使用方式

### 方案 A：直接使用本地系统盘缓存

第一次执行：

```bash
npm run setup:fast-dev-cache
```

默认会把 `.next-dev-cache` 指到：

```text
%LOCALAPPDATA%\\portfolio-dev-cache\\portfolio\\next
```

之后开发时直接使用：

```bash
npm run dev:external
```

### 方案 B：缓存放到你自己的本地 Dev Drive / 独立 SSD 目录

如果你已经有本地 `D:`、`C:` SSD，或者专门的 Windows Dev Drive，可以自定义目标目录：

```bash
node scripts/setup-fast-dev-cache.mjs D:\\dev-cache\\portfolio\\.next-dev
```

然后仍然运行：

```bash
npm run dev:external
```

## 为什么这条路有效

外置盘场景最慢的通常不是“单次读一个源码文件”，而是：

- 开发期频繁写 `.next`
- 大量小文件缓存更新
- 文件系统监控和杀毒扫描
- 首页首次访问时客户端增强与装饰性绘制同时叠加

因此当前仓库做了两类处理：

1. I/O 迁移
   - 外置盘友好模式把 Next 开发缓存写到 `.next-dev-cache`
   - `.next-dev-cache` 可以是项目内链接，真实落到本地 SSD

2. 开发态降载
   - 首页的大型运行时增强已经延后到“页面稳定后 + 用户滚动后”
   - 外置盘友好模式会使用更轻的开发背景效果，减少无意义的首屏绘制负担

## 仍然建议保留的系统级设置

- 把项目目录加入 Windows Defender exclusion
- 把缓存目标目录也加入 Windows Defender exclusion
- tracing 和详细 fetch logging 只在单次排障时开启
- 如果 `npm run build:pages` 提示 `.next` 或 `out` 被锁定，先停止 `npm run dev`、Playwright webServer 或其他文件监听进程后再重试。

## 官方依据

- Next.js Local Development
  - https://nextjs.org/docs/app/guides/local-development
- Next.js `distDir`
  - https://nextjs.org/docs/pages/api-reference/config/next-config-js/distDir
- Next.js Lazy Loading
  - https://nextjs.org/docs/app/guides/lazy-loading
- Windows Dev Drive
  - https://learn.microsoft.com/en-us/windows/dev-drive/
