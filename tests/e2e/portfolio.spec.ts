import { expect, test, type Page } from '@playwright/test';

const RESUME_FILE_NAME = '\u675c\u65ed\u5609_AI\u5e94\u7528\u5de5\u7a0b\u5e08_15035925107.pdf';
const RESUME_FILE_PATH = `/${encodeURIComponent(RESUME_FILE_NAME)}`;
const EN_RESUME_FILE_NAME = 'du-xujia-ai-application-engineer.pdf';
const ENGINEERING_TRIGGER_NAME = /Engineering|工程实力中枢|工程中枢/i;

const openMobileMenuIfNeeded = async (page: Page) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 768) return;

    const localeSwitchLink = page
        .getByRole('link', { name: /English|中文|switch to chinese|switch to english/i })
        .first();

    if (await localeSwitchLink.isVisible().catch(() => false)) {
        return;
    }

    const openMenuButton = page.getByRole('button', { name: /打开菜单|open menu/i }).first();
    await expect(openMenuButton).toBeVisible({ timeout: 5000 });
    await expect(openMenuButton).toBeEnabled();
    await openMenuButton.click();
};

const scrollSectionIntoView = async (page: Page, selector: string) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const section = page.locator(selector).first();
            await expect(section).toBeVisible({ timeout: 5000 });
            await section.evaluate((element: HTMLElement) => {
                const sectionId = element.id;
                if (sectionId) {
                    (window as Window & { __portfolioRequestedSection?: string }).__portfolioRequestedSection =
                        sectionId;
                    window.dispatchEvent(
                        new CustomEvent('portfolio:section-request', {
                            detail: { id: sectionId },
                        }),
                    );
                }
                element.scrollIntoView({ behavior: 'auto', block: 'start' });
            });
            await waitForSectionToReachViewport(page, selector, 8000);
            return;
        } catch (error) {
            if (attempt === 2) {
                throw error;
            }
            await page.waitForTimeout(240);
        }
    }
};

const isLowPerformanceEnvironment = async (page: Page) =>
    page.evaluate(() => {
        const nav = navigator as Navigator & {
            deviceMemory?: number;
            connection?: { saveData?: boolean };
        };

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const noHover = window.matchMedia('(hover: none)').matches;
        const lowCoreCount = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
        const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
        const saveDataEnabled = Boolean(nav.connection?.saveData);

        return prefersReducedMotion || saveDataEnabled || lowCoreCount || lowMemory || (coarsePointer && noHover);
    });

const gotoHomePage = async (page: Page) => {
    const homeHeading = page.getByRole('heading', { level: 1, name: 'AI 应用工程师' });

    for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto('/');

        try {
            await expect(homeHeading).toBeVisible({ timeout: 8000 });
            return;
        } catch (error) {
            const notFoundHeading = page.getByRole('heading', { level: 1, name: '404' });
            if (attempt === 2 || !(await notFoundHeading.isVisible().catch(() => false))) {
                throw error;
            }
            await page.waitForTimeout(400);
        }
    }
};

const gotoLocalizedHomePage = async (page: Page, path: '/zh' | '/en') => {
    await page.goto(path);
    const heading =
        path === '/en'
            ? page.getByRole('heading', { level: 1, name: /AI Application Engineer/i })
            : page.getByRole('heading', { level: 1, name: 'AI 应用工程师' });
    await expect(heading).toBeVisible({ timeout: 8000 });
};

const waitForSectionToReachViewport = async (
    page: Page,
    selector: string,
    timeout = 10000,
) => {
    await expect
        .poll(
            async () =>
                page.evaluate((targetSelector) => {
                    const section = document.querySelector<HTMLElement>(targetSelector);
                    if (!section) return false;

                    const rect = section.getBoundingClientRect();
                    return rect.top < window.innerHeight && rect.bottom > 0;
                }, selector),
            {
                timeout,
                interval: 150,
            },
        )
        .toBe(true);
};

const revealDeferredDock = async (page: Page) => {
    await page.evaluate(() => window.scrollTo(0, 720));
    await expect(
        page.getByRole('button', { name: ENGINEERING_TRIGGER_NAME }).first(),
    ).toBeVisible({ timeout: 12000 });
};

test.describe('Portfolio E2E', () => {
    test.beforeEach(async ({ page }) => {
        await gotoHomePage(page);
    });

    test('home page should render key structure', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('#impact')).toBeVisible();
        await expect(page.locator('#experience')).toBeVisible();
        await expect(page.locator('#featured-projects')).toBeVisible();
        await expect(page.locator('#capability-summary')).toBeVisible();
        await expect(page.locator('#projects')).toBeVisible();
        await expect(page.locator('#contact')).toBeVisible();
    });

    test('layout should avoid horizontal overflow', async ({ page }) => {
        const hasOverflow = await page.evaluate(() => {
            const root = document.documentElement;
            return root.scrollWidth - root.clientWidth > 1;
        });

        expect(hasOverflow).toBeFalsy();
    });

    test('hero should present positioning and quantified outcomes', async ({ page }) => {
        await expect(page.getByRole('heading', { level: 1, name: 'AI 应用工程师' })).toBeVisible();
        await expect(page.getByText('RAG / Agent')).toBeVisible();
        await expect(page.getByText('混合检索 + LangGraph 运行时').first()).toBeVisible();
        await expect(page.getByText('文本 / 语音 / RTC 三通道接入').first()).toBeVisible();
        await expect(page.getByText('5x 提速与 40% 成本下降').first()).toBeVisible();
        await expect(page.getByRole('button', { name: /查看项目证据|project evidence/i })).toBeVisible();
        await expect(page.getByText('以上指标均可在项目详情与仓库中复核。')).toBeVisible();
    });

    test('resume download link should be valid', async ({ page }) => {
        const downloadLink = page.getByRole('link', { name: /下载|简历|resume|pdf/i }).first();
        await expect(downloadLink).toBeVisible();
        await expect(downloadLink).toHaveAttribute('download', RESUME_FILE_NAME);

        const href = await downloadLink.getAttribute('href');
        expect(href === '/api/resume' || href === RESUME_FILE_PATH).toBeTruthy();
    });

    test('localized home pages should render zh and en content', async ({ page }) => {
        await gotoLocalizedHomePage(page, '/zh');
        await expect(page.getByText('混合检索 + LangGraph 运行时').first()).toBeVisible();

        await gotoLocalizedHomePage(page, '/en');
        await expect(page.getByText('Hybrid retrieval').first()).toBeVisible();
        await expect(page.getByRole('link', { name: /download resume/i }).first()).toHaveAttribute(
            'download',
            EN_RESUME_FILE_NAME,
        );
    });

    test('language switch should preserve context via explicit locale routes', async ({ page }) => {
        await gotoLocalizedHomePage(page, '/zh');
        await openMobileMenuIfNeeded(page);
        const switchToEnglish = page.locator('nav').getByRole('link', { name: /English/i }).first();
        await expect(switchToEnglish).toBeVisible();
        await switchToEnglish.click();
        await expect(page).toHaveURL(/\/en(?:[#?].*)?$/);

        await openMobileMenuIfNeeded(page);
        const switchToChinese = page
            .locator('nav')
            .getByRole('link', { name: /switch to chinese|中文/i })
            .first();
        await expect(switchToChinese).toBeVisible();
        await switchToChinese.click();
        await expect(page).toHaveURL(/\/zh(?:[#?].*)?$/);
    });

    test('experience section should render independent developer projects inline under the parent entry', async ({ page }) => {
        await scrollSectionIntoView(page, '#experience');

        const experienceSection = page.locator('#experience');
        await expect(experienceSection.getByText('独立开发者').first()).toBeVisible();
        await expect(experienceSection.getByText('项目名称/实践场景：中软国际')).toBeVisible();
        await expect(
            experienceSection.getByText('技术栈：FastAPI / LangGraph / PostgreSQL / Qdrant'),
        ).toBeVisible();
        await expect(experienceSection.getByText('RentBox 共享擦窗宝小程序')).toBeVisible();
        await expect(experienceSection.getByText('论文检索任务平台')).toBeVisible();
        await expect(experienceSection.getByText('智能客服运行时')).toBeVisible();
        await expect(experienceSection.getByText('微信智能助手')).toBeVisible();
        await expect(
            experienceSection.locator('a[href="/experiences/exp-rentbox"]'),
        ).toHaveCount(0);
        await expect(
            experienceSection.locator('a[href="/experiences/exp-paper-retrieval-platform"]'),
        ).toHaveCount(0);
        await expect(
            experienceSection.locator('a[href="/experiences/exp-customer-ai-runtime"]'),
        ).toHaveCount(0);
        await expect(
            experienceSection.locator('a[href="/experiences/exp-wechat-bot"]'),
        ).toHaveCount(0);
    });

    test('hero project evidence cta should scroll to projects section', async ({ page }) => {
        const projectsSection = page.locator('#projects');
        await expect(projectsSection).not.toBeInViewport();

        const projectEvidenceButton = page.getByRole('button', { name: /查看项目证据|project evidence/i }).first();
        await expect(projectEvidenceButton).toBeVisible();
        await projectEvidenceButton.click();

        await waitForSectionToReachViewport(page, '#projects', 9000);
    });

    test('experience should appear before impact and projects in document order', async ({ page }) => {
        const sectionOffsets = await page.evaluate(() => {
            const ids = ['experience', 'impact', 'featured-projects', 'projects'] as const;
            return Object.fromEntries(
                ids.map((id) => [
                    id,
                    document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
                ]),
            );
        });

        expect(sectionOffsets.experience).toBeLessThan(sectionOffsets.impact);
        expect(sectionOffsets.impact).toBeLessThan(sectionOffsets['featured-projects']);
        expect(sectionOffsets['featured-projects']).toBeLessThan(sectionOffsets.projects);
    });

    test('evidence strip should provide quick jumps into full sections', async ({ page }) => {
        const impactEntry = page.getByRole('link', { name: /量化结果.*查看全部指标/i }).first();
        await expect(impactEntry).toBeVisible();
        await impactEntry.click();
        await waitForSectionToReachViewport(page, '#impact', 8000);

        await page.goto('/');
        const capabilityEntry = page.getByRole('link', { name: /工程能力.*查看能力结构/i }).first();
        await expect(capabilityEntry).toBeVisible();
        await capabilityEntry.click();
        await waitForSectionToReachViewport(page, '#skills', 10000);
    });

    test('about and audience quick-entry sections should not render', async ({ page }) => {
        await expect(page.locator('#about')).toHaveCount(0);
        await expect(page.locator('#audience')).toHaveCount(0);
        await expect(page.getByRole('heading', { name: '你可以快速怎么读我' })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: '按角色快速进入' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: /HR\s*快速路径/i })).toHaveCount(0);
        await expect(page.getByRole('button', { name: /客户\s*快速路径/i })).toHaveCount(0);
    });

    test('legacy editor entry points should not exist', async ({ page }) => {
        await expect(page.getByText(/导入\s*JSON|导出\s*JSON|编辑模式|Demo 模式|editor/i)).toHaveCount(0);
        await expect(page.locator('button', { hasText: /编辑|editor/i })).toHaveCount(0);
    });

    test.describe('Engineering Command Center', () => {
        test('should open and close with escape, and trap focus', async ({ page }) => {
            await revealDeferredDock(page);
            const openButton = page.getByRole('button', { name: ENGINEERING_TRIGGER_NAME });
            await expect(openButton).toBeVisible();

            await openButton.click();
            const panelTitle = page.getByRole('heading', { name: /工程实力中枢|Engineering Command Center/i });
            await expect(panelTitle).toBeVisible();
            await expect(page.getByRole('heading', { name: /页面性能|实时性能指标|Runtime Metrics/i })).toBeVisible();
            await expect(page.getByRole('heading', { name: /开源数据|开源数据看板|Open Source Telemetry/i })).toBeVisible();
            await expect(page.getByRole('heading', { name: /构建信息|工程指纹|Engineering Fingerprint/i })).toBeVisible();

            const closeButton = page.getByRole('button', { name: /关闭工程实力中枢|close/i });
            await expect(closeButton).toBeVisible();
            await expect(closeButton).toBeFocused();

            await page.keyboard.press('Escape');
            await expect(panelTitle).not.toBeVisible();
        });

        test('should render telemetry from github api response', async ({ page }) => {
            await page.route('**/api/github', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        followers: 42,
                        public_repos: 7,
                        totalStars: 123,
                        source: 'github-api',
                        isPartial: false,
                        message: '已通过 GitHub 接口获取实时数据。',
                        specificRepos: [
                            {
                                name: 'wechat-bot',
                                stars: 5,
                                url: 'https://github.com/byteD-x/wechat-bot',
                            },
                        ],
                    }),
                });
            });

            await revealDeferredDock(page);
            await page.getByRole('button', { name: ENGINEERING_TRIGGER_NAME }).click();
            await expect(page.getByText('123', { exact: true })).toBeVisible();
            await expect(page.getByText('wechat-bot')).toBeVisible();
            await expect(page.getByText('★ 5')).toBeVisible();
        });

        test('should degrade gracefully when github api fails', async ({ page }) => {
            await page.route('**/api/github', async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'fail' }),
                });
            });

            await revealDeferredDock(page);
            await page.getByRole('button', { name: ENGINEERING_TRIGGER_NAME }).click();
            await expect(page.getByRole('heading', { name: /工程实力中枢|Engineering Command Center/i })).toBeVisible();
            await expect(page.getByText(/GitHub 数据请求失败|GitHub 数据暂不可用|telemetry.*unavailable/i)).toBeVisible();
        });
    });

    test('impact card should not auto-jump, and jump only when explicitly requested', async ({ page }) => {
        await scrollSectionIntoView(page, '#impact');
        await page.waitForTimeout(150);

        const firstCard = page.locator('#impact button[aria-label]').first();
        await expect(firstCard).toBeVisible();
        await firstCard.click();

        const drawer = page.getByRole('dialog').first();
        await expect(drawer).toBeVisible();
        const closeButton = drawer.getByRole('button', { name: /关闭.*面板|关闭/i }).first();
        await expect(closeButton).toBeVisible();
        await expect(closeButton).toBeFocused();

        const jumpButton = page.getByRole('button', { name: /定位到对应经历/i });
        await expect(jumpButton).toBeVisible();

        await jumpButton.evaluate((el: HTMLButtonElement) => el.click());
        await page.waitForTimeout(400);
        const experienceSection = page.locator('#experience');
        await expect(experienceSection).toBeInViewport();
    });

    test('navigation should scroll to target section', async ({ page }) => {
        await openMobileMenuIfNeeded(page);

        const navRoot = page.locator('nav').first();
        const contactNav = navRoot
            .getByRole('button', { name: /联系|contact/i })
            .or(navRoot.getByRole('link', { name: /联系|contact/i }))
            .first();

        await expect(contactNav).toBeVisible();
        await expect(contactNav).toBeEnabled();

        await contactNav.click();
        try {
            await waitForSectionToReachViewport(page, '#contact', 10000);
        } catch {
            await contactNav.click();
            await waitForSectionToReachViewport(page, '#contact', 12000);
        }
    });

    test('contact private channels should be reveal-on-demand', async ({ page }) => {
        await scrollSectionIntoView(page, '#contact');

        await expect(page.getByText('15035925107')).toHaveCount(0);
        const revealButton = page.getByRole('button', { name: /展开更多联系方式/i });
        await expect(revealButton).toBeVisible();
        await revealButton.click();

        try {
            await expect(page.getByText('15035925107')).toBeVisible({ timeout: 3000 });
        } catch {
            await revealButton.evaluate((el: HTMLButtonElement) => el.click());
            await expect(page.getByText('15035925107')).toBeVisible({ timeout: 5000 });
        }
        await expect(page.getByText('w2041487752')).toBeVisible();
    });

    test('featured projects should present content, capability and technical structure', async ({ page }) => {
        await scrollSectionIntoView(page, '#featured-projects');

        await expect(page.getByText('内容定位').first()).toBeVisible();
        await expect(page.getByText('功能描述').first()).toBeVisible();
        await expect(page.getByText('技术描述').first()).toBeVisible();
        await expect(page.getByRole('link', { name: /查看案例拆解/i }).first()).toBeVisible();
    });

    test('featured projects should render story sections inline without collapsing', async ({ page }) => {
        await scrollSectionIntoView(page, '#featured-projects');

        const firstProjectCard = page.locator('#featured-projects article').first();
        await expect(
            firstProjectCard.getByText(/功能描述|Capability breakdown/i).first(),
        ).toBeVisible();
        await expect(
            firstProjectCard.getByText('设计渠道接入', { exact: false }).first(),
        ).toBeVisible();
    });

    test('mobile deferred dock should stay compact after scroll', async ({ page }) => {
        const viewport = page.viewportSize();
        test.skip(!viewport || viewport.width >= 768, 'mobile only');

        await revealDeferredDock(page);

        const mobileDock = page.locator('div.fixed.inset-x-0.bottom-0.z-50').first();
        const engineeringButton = mobileDock.getByRole('button', { name: ENGINEERING_TRIGGER_NAME }).first();

        await expect(mobileDock).toBeVisible();
        await expect(engineeringButton).toBeVisible();

        const dockBox = await mobileDock.boundingBox();
        expect(dockBox).not.toBeNull();
        expect(dockBox!.height).toBeLessThanOrEqual(96);
    });

    test('scroll progress dock should support back to top (desktop)', async ({ page }) => {
        const viewport = page.viewportSize();
        test.skip(!viewport || viewport.width < 768, 'desktop only');

        const lowPerformanceMode = await isLowPerformanceEnvironment(page);
        if (lowPerformanceMode) {
            await expect(page.locator('[role="progressbar"]')).toHaveCount(0);
            return;
        }

        await page.evaluate(() => window.scrollTo(0, 600));
        await expect(
            page.getByRole('button', { name: ENGINEERING_TRIGGER_NAME }).first(),
        ).toBeVisible({ timeout: 12000 });
        await expect
            .poll(async () => page.locator('[role="progressbar"]').count(), {
                timeout: 4000,
                interval: 200,
            })
            .toBeGreaterThan(0);
        await expect(page.locator('[role="progressbar"]').first()).toBeVisible();
        const backToTopButton = page.getByRole('button', { name: /回到顶部/i }).first();
        await expect(backToTopButton).toBeVisible();
        await backToTopButton.click();
        await expect
            .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
            .toBeLessThan(40);
    });
});
