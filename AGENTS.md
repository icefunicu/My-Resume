# AGENTS.md

> 本文件由仓库扫描自动生成，默认覆盖旧内容。面向自动化 Agent 与人工协作者。

## 1. 目标与适用范围
- 在最小改动前提下，保持变更可回滚、可验证、可审计。
- 对所有协作者统一生效：自动化 Agent、开发者、审阅者。
- 遇到高风险或需求不清时先收敛范围，再实施。

## 2. 仓库画像（扫描结果）
- 项目标识：`portfolio`
- 包管理器：`npm`
- 主要语言：TypeScript、JavaScript / MJS、YAML、CSS
- 技术栈：Next.js 16、React 19、Tailwind CSS 4、TypeScript 5、Framer Motion、Vitest、Playwright、GitHub Pages
- 关键路径：
  - `README.md`
  - `package.json`
  - `next.config.ts`
  - `tsconfig.json`
  - `src/app/page.tsx`
  - `src/app`
  - `src/components`
  - `src/lib`
  - `src/hooks`
  - `src/data.ts`
  - `src/app/api`
  - `scripts`
  - `tests`
  - `playwright.config.ts`
  - `.github/workflows`
- CI 工作流：
  - `pages.yml`
- 部署关注点：
  - 检测到 Next.js，发布前至少验证一次标准构建以覆盖服务端模式。
  - 检测到 GitHub Pages 相关配置，发布前验证静态导出链路。
  - 检测到三端发布场景：保持 Vercel、GitHub Pages 与自托管服务器说明同时可验证。
  - 检测到静态导出信号：改动 API、headers、rewrite、redirect 时必须提供降级或兼容实现。

## 3. 协作原则
- 先读后改：先定位受影响文件与边界，再写代码。
- 小步提交：单次改动只解决一个问题，不混入无关重构。
- 优先复用：优先沿用现有组件、工具函数与约定。
- 禁止猜测：结论必须有可复现命令或测试结果支撑。

## 4. 实施规范
- 保持命名、目录结构、错误处理风格与现有代码一致。
- 对外接口和边界输入做校验（空值、类型、范围）。
- 避免明显性能问题（N+1、无界循环、全量扫描）；无法避免时写明上限与原因。
- 不在日志中输出敏感信息，不提交密钥、令牌、私密配置。
- 构建、导出、数据抓取脚本正常产生的时间戳、快照或遥测文件更新，默认按实际结果保留；除非用户明确要求或确认是无关噪声，不要在收尾阶段手动回退这类变更。

### 4.1 作品集内容更新规则
- 涉及 `src/data.ts` 的 `timeline`、`projects`、`impact` 更新时，必须先审阅对应项目源码，再写技术亮点。
- PDF 简历只用于校对公司、项目名、时间、角色、职责等事实，不单独作为技术实现或工程亮点扩写依据。
- 若项目无源码可审，允许保留 PDF / 人工材料能直接支撑的事实，但不得补写推断性技术细节。
- `verification.sourceType=repo` 仅用于源码、README、docs、tests、scripts 等仓库证据；PDF / 人工材料应使用 `manual` 或 `experience`。
- 相关维护细则见 `docs/content-evidence-policy.md`。

## 5. 安全红线
- 禁止执行破坏性操作（例如清库、覆盖生产配置、强推受保护分支）。
- 禁止运行来源不明脚本或未审计下载命令。
- 涉及权限、支付、用户数据时，先说明威胁模型与防护措施。

## 6. 质量门禁
- 按顺序执行以下命令并确保成功：
  1. `npm run lint`
  2. `npm run test:unit`
  3. `npm run test:e2e`
  4. `npm run build`
  5. `npm run build:pages`
  6. `npm run check:links`
  7. `npm run check:performance`
  8. `npm run verify:public`
- 检测到可用脚本：
  - `analyze`
  - `build`
  - `build:data`
  - `build:pages`
  - `check:links`
  - `check:performance`
  - `dev`
  - `dev:external`
  - `dev:external:trace`
  - `dev:external:webpack`
  - `dev:trace`
  - `dev:webpack`
  - `deploy:server`
  - `deploy:server:status`
  - `format`
  - `format:check`
  - `lint`
  - `lint:fix`
  - `optimize:images`
  - `push:all`
  - `setup:fast-dev-cache`
  - `setup:server:ci`
  - `setup:server:https`
  - `start`
  - `test:e2e`
  - `test:e2e:ui`
  - `test:unit`
  - `verify:public`

## 7. 提交与评审
- Commit message 使用 Conventional Commits：`feat|fix|refactor|docs|test|chore|ci`。
- 提交说明包含 What、Why、How to verify（命令 + 预期结果）。
- 评审优先关注行为回归风险、边界条件、测试覆盖与部署兼容性。

## 8. Agent 执行清单
开始前：
- 明确需求边界、影响文件、回滚方案。
- 标记是否影响构建、测试、部署或外部接口。
修改中：
- 每修完一个问题立即做最小验证，不累计风险。
- 发现异常变更时立即停下并与用户确认。
结束前：
- 汇总改动文件、验证命令与结果。
- 明确说明构建是否通过、测试是否通过、部署基线是否通过。
- 若 `build` / `build:pages` / 数据脚本更新了仓库内快照或时间戳文件，按正常逻辑保留，并在最终说明里明确这是构建副产物而非异常改动。
- 列出剩余风险与可选后续优化。
