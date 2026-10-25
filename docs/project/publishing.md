# 本地预览与 GitHub Pages 发布

源码仓库：[cuimingle/embodied-ai-notes](https://github.com/cuimingle/embodied-ai-notes)。在线阅读地址：[具身智能学习笔记](https://cuimingle.github.io/embodied-ai-notes/)。

日常更新可在本地编辑并推送 `main`，由 GitHub Actions 构建和发布。下文也保留了在其他仓库部署的完整步骤。

## 本地预览

在仓库根目录执行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-docs.txt
python -m mkdocs serve
```

浏览器访问 `http://127.0.0.1:8000/`。修改 `docs/` 中的 Markdown 即可刷新预览。Windows 可使用 `.venv\Scripts\activate` 激活虚拟环境。

## 创建远程开源仓库

若要在自己的账号下部署副本，可以使用仓库名 `embodied-ai-notes`，描述可用“从强化学习出发的具身智能知识梳理：推导、实验与学习路线”。

在 GitHub 创建空的公开仓库后，检查本地准备提交的内容：

```bash
git status --short
git add README.md LICENSE .gitignore requirements-docs.txt mkdocs.yml CONTRIBUTING.md docs examples tests templates scripts .github
git diff --cached --stat
git commit -m "Initialize embodied AI notes and reinforcement learning track"
```

显式添加本项目文件，个人写作材料是否公开由作者另行决定。然后添加创建页面给出的真实远程地址并推送：

```bash
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

将 `YOUR_REPOSITORY_URL` 替换为实际地址；若已有 `origin`，先用 `git remote -v` 检查并使用现有正确地址。若远程已有 README 或提交，先拉取并处理历史，避免强制推送。

## 启用 Pages

1. 在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中，将 Source 设为 **GitHub Actions**。
2. 到 **Actions → Publish documentation → Run workflow** 手动运行一次，或在启用后推送新的 `main` 提交。
3. 检查构建与部署均成功后，从工作流 environment 的链接打开网站。

仓库已提供 `.github/workflows/pages.yml`。它先运行测试、链接检查和严格文档构建，再上传 Pages artifact 并部署；PR 只运行 `.github/workflows/ci.yml` 的校验。

若默认分支不是 `main`，先修改两个工作流的分支配置。Pages 权限、组织策略和环境保护设置以仓库实际配置为准。检查部署工作流成功后，再访问在线地址。

## 首次发布后

在其他账号或仓库部署时，将 `mkdocs.yml` 中的网站 URL、仓库 URL 与编辑链接，以及 README 中的在线地址改成实际值。当前配置使用相对资源路径，支持常见的 `/仓库名/` 项目站点路径；实际 Pages 构建会通过环境变量设置 `site_url`。

日常修改后运行：

```bash
python3 -m unittest discover -s tests -v
python3 scripts/check_links.py
python -m mkdocs build --strict
```

`site/` 为生成内容，不手工维护。中文搜索索引随构建生成；MathJax 通过 CDN 加载，离线时公式渲染可能不可用。

部署步骤参考 [GitHub 官方自定义工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
