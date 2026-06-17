# Content Evidence Policy

本文件约束 `src/data.ts` 中时间线、项目经历、Impact 指标等内容的更新方式，目标是让作品集里的技术信息可复核、可追溯、可解释。

## 1. 适用范围

适用于以下内容更新：

- `timeline`
- `projects`
- `impact`
- 与 `verification`、`expandedDetails`、`techTags`、`keyOutcomes` 相关的补充或改写
- `docs/resume-*.md` 中与作品集项目、经历和指标口径有关的文案同步

## 2. 证据优先级

按可信度和可复核性排序：

1. `repo`
   - 项目源码
   - README / docs
   - tests
   - scripts
   - 配置、迁移、接口、构建产物
2. `manual`
   - 本地 PDF 简历
   - 已归档的人工说明材料
3. `experience`
   - 项目证明、验收记录、人工交付记录

说明：

- 技术亮点、架构拆解、性能优化、工程治理等表述，默认必须以 `repo` 证据为主。
- `manual` 证据只适合确认公司、项目名、起止时间、角色、职责、业务背景等事实骨架。
- 如果只有 `manual` 没有 `repo`，可以写事实，不应补写无法从源码验证的技术细节。

## 3. 更新规则

### 3.1 时间线与项目经历

- 更新 `summary`、`keyOutcomes`、`expandedDetails`、`techTags` 前，必须先审阅相关项目源码。
- 技术栈必须能在源码、依赖、配置或文档中找到落点。
- 性能数据、规模数据、自动化能力、治理能力等指标，必须能说明来源。
- 当前网站允许用父级条目承载一组独立开发者项目，例如 `独立开发者｜AI 应用 / 全栈项目` 作为父项，RentBox、论文检索任务平台、智能客服运行时、微信智能助手作为子项继续保留独立 slug 和详情页。
- 简历文档可以按投递场景拆开父级项目，但拆分后的 bullet 仍必须复用对应子项目的证据来源和置信度，不得因为拆分而升级证据等级。

### 3.2 PDF 的使用边界

PDF 简历只用于：

- 公司名称
- 项目名称
- 时间范围
- 岗位/角色
- 已明确写出的职责和结果

PDF 简历不单独用于：

- 扩写架构设计
- 推断技术选型原因
- 编造性能优化手段
- 放大未在源码或文档中出现的工程亮点

### 3.3 无源码项目的写法

如果项目没有可审阅源码：

- 只保留可由 PDF / 人工材料直接支撑的表述
- `verification.sourceType` 使用 `manual` 或 `experience`
- 文案保持保守，不写“实现了某架构/某治理体系”这类无法复核的技术表述

## 4. 推荐工作流

更新单个项目时，建议按以下顺序进行：

1. 定位事实来源
   - PDF / 简历 / 已有条目
2. 审阅源码
   - README
   - 目录结构
   - 关键路由、模型、服务、脚本、测试
3. 抽取可验证亮点
   - 功能闭环
   - 技术栈
   - 架构设计
   - 工程化能力
   - 指标或规模
4. 写回 `src/data.ts`
   - 区分事实骨架和源码亮点
5. 补 `verification`
   - 明确来源类型和验证时间
6. 同步相关文档
   - README 项目概览
   - `docs/resume-writing-kit.md`
   - `docs/resume-experience-copy.md`
   - `docs/resume-star-bank.md`
   - `docs/resume-metrics-checklist.md`

## 5. 写作约束

- 不把推断写成事实
- 不把简历措辞自动升级为源码级亮点
- 不混合不同项目的证据
- 不在 `sourceLabel` 中模糊写“项目材料”或“项目记录”，应尽量指出具体证据类型

## 6. 验证输出要求

每次更新后，至少说明：

- 改了哪些条目
- 证据来自源码还是 PDF
- 哪些是源码已审后的技术亮点
- 哪些仅是人工材料支撑的事实表述
- 网站父子分组、简历拆分条目和详情页 slug 是否仍保持一致

## 7. 与当前仓库的关系

- 主数据文件：`src/data.ts`
- 类型定义：`src/types.ts`
- 展示入口：`src/app/page.tsx`、`src/app/[locale]/page.tsx`、`src/app/experiences/[slug]/page.tsx`、`src/components/*`
- 简历素材：`docs/resume-ai-main.md`、`docs/resume-experience-copy.md`、`docs/resume-star-bank.md`、`docs/resume-writing-kit.md`、`docs/resume-metrics-checklist.md`

如果规则与口头约定冲突，以“源码优先、PDF 只校对事实骨架”的原则为准。
