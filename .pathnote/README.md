# 同路志发布包作者说明

同路志只读取 `publications/<slug>/` 下显式创建的发布包。仓库中的其他项目文档、脚本、素材和输出不会自动进入网站。

## 创建发布包

从 `.pathnote/templates/publication/` 复制模板，并把目标目录命名为稳定的英文 slug。slug 只能包含小写英文字母、数字和连字符，内容公开后不再修改。

Windows PowerShell：

```powershell
Copy-Item -Recurse .pathnote/templates/publication publications/<slug>
```

Linux：

```bash
cp -R .pathnote/templates/publication publications/<slug>
```

复制以后需要同步修改目录名和 `publication.json.slug`，并补全标题、摘要、实际发生日期、主题、权利和验证信息。`index.mdx` 不重复一级标题，正文从二级标题开始。

不要在 `publications/` 根目录放置 `README.md`、`.gitkeep` 或模板目录。每个一级子目录都会被当作真实发布包检查。

## 本地检查

检查当前仓库中的发布包：

```text
pnpm pathnote:check
```

准备提交以前，先暂存本次变更，再检查暂存内容：

```text
git add publications/<slug> .pathnote package.json
pnpm pathnote:check:staged
```

计算准备审核的暂存快照摘要：

```text
node .pathnote/pathnote-source-check.mjs \
  --source daily-work \
  --staged \
  --digest <slug>
```

命令会输出 `<slug>: sha256:...`。审核人员应当针对这个暂存快照完成内容、权利和敏感信息审核，再把其中的 `sha256:...` 原样写入 `reviews.subjectDigest`。相关内容发生变化以后，需要重新计算摘要并重新审核。

检查包含 Schema、MDX、资源路径、公开链接、敏感信息和历史状态。检查通过只说明文件满足发布契约，不代表内容、权利或敏感信息审核已经完成。

共享校验器由同路志网站工程生成，并由 `.pathnote/contract-lock.json` 固定版本和 SHA-256。不要在本仓库中单独修改 bundle、锁文件或发布模板。

## 共享校验器受控升级

Pull Request 校验由目标分支中的 `pull_request_target` workflow 定义。工作流先检出 base 仓库和固定 SHA，从中提取校验器和锁文件，再获取 head 的 Git 对象进行只读检查。`origin` 始终指向 base 仓库，工作流绝不执行 head 中的脚本。这个信任边界必须保留：workflow 继续使用只读权限，检出代码时不保留凭证。

升级共享校验器时，管理员按照以下顺序操作：

1. 从同路志网站工程取得新的完整分发，独立核对 bundle、模板哈希和 `.pathnote/contract-lock.json` 中的 `distributionSha256`。
2. 把核对后的 64 位 `distributionSha256` 临时写入仓库变量 `PATHNOTE_CHECKER_UPGRADE_SHA256`。
3. 建立一个只包含本次 `.pathnote` 工具分发文件的 Pull Request。这个 Pull Request 不混入发布包、workflow 或其他仓库改动。
4. 等待受保护的 PathNote 校验通过并合并，然后立即清空 `PATHNOTE_CHECKER_UPGRADE_SHA256`。

必须用 branch protection 或 ruleset 保护 `main`，把 PathNote 校验设为必需检查，要求 Pull Request 在合并前与目标分支保持最新，并要求维护者审核 `.github/workflows/pathnote-publications.yml` 的改动。普通内容 Pull Request 不能修改或绕过这条信任链。

## 状态与审核

发布包按照 `draft → reviewed → published` 推进：

- `draft` 不进入网站，可以继续整理正文、资源和审核项。
- `reviewed` 需要内容、权利和敏感信息三项审核全部通过，并提供与当前内容一致的 `reviews.subjectDigest`。
- `published` 只能在同路志发布候选版本通过以后设置，同时填写 `publishedAt`。已经发布的 slug、`publishedAt` 和状态不能回退。

来源仓库是公开仓库。`draft` 和 `reviewed` 只控制同路志是否收录内容，不能保护已经提交的文件。密钥、Cookie、个人信息、授权原件和内部资料不得写入发布包或 Git 历史。

实践和项目进入 `reviewed` 以前，需要记录真实的验证命令、环境、固定 revision、结果和限制。外部媒体副本应当在同路志正式页面上线以后发布，再把实际地址写入 `syndication`。

## CI 和网站触发

PathNote workflow 会检查每个 Pull Request、`main` 更新和手动运行。Pull Request 使用目标分支中受信任的校验器对比 base/head，不会调用部署入口。`main` 校验通过后，校验器还会判断发布包或它引用的仓库文件是否确实发生变化。

预览构建目前保持关闭。部署入口准备完成以后，需要建立受保护的 `pathnote-preview` environment，添加 secret `PATHNOTE_PREVIEW_DEPLOY_HOOK_URL`，再把仓库变量 `PATHNOTE_PREVIEW_TRIGGER_ENABLED` 设为 `true`。工作流只在相关内容发生变化，或者维护者手动明确要求时调用 Hook。Hook 泄漏以后，应当先在部署平台撤销旧地址，再更新 secret；关闭仓库变量可以立即停止新的请求。
