# 🚀 QManager RM520N — Release Notes

## v0.1.6-cn (cn/edition，**与主线 v0.1.6 对齐**)

同一 **0.1.6** 功能代际；cn/edition 为 RG501Q / 中文界面与脚本差异。Release 使用标签 **`v0.1.6-cn`**（不采用高于主线的次要版本号）。

### cn/edition 附加修复（相对主线构建）

- **Tailscale 按需安装**：无 **curl** 时用 **`wget`**（`/opt/bin/wget` 或 Busybox `wget`）。
- **安装器 Speedtest 下载**：仅在 PATH 中存在 **curl** 时才调用。
- **系统健康检查**：HTTP 下载工具项 **`bin.http_fetch`** — **curl 或 wget** 任一可用即通过。

### v0.1.6 主线：TTL / Hop Limit（RM520N-GL）

A focused hotfix for **TTL & Hop Limit Configuration** on RM520N-GL. Saving TTL/HL now reflects correctly in the UI and survives a page refresh — and disabling actually disables.

> One-click OTA from **System Settings → Software Update** if you're on v0.1.5. SSH/ADB is no longer required.

## 🛠️ Fixes（主线 v0.1.6）

- **TTL/HL save no longer resets to disabled after refresh.** The live-state reader was passing a duplicate flag that legacy iptables on RM520N-GL rejects, so the form mistakenly reported "disabled" right after a successful save. The form now mirrors the actual kernel state.
- **TTL/HL disable now fully clears the rules.** The apply path used to remove only one rule per save, so duplicate or stale rules from past changes could survive a disable and silently re-appear in the UI. The chain is now drained completely on every apply, with a hard cap to prevent runaway loops.

## 📥 Installation

### Upgrading from v0.1.5

**System Settings → Software Update.** Click Download, then Install. No SSH/ADB needed. All settings preserved.

### Fresh Install

ADB or SSH into the modem and run:

```sh
curl -fsSL -o /tmp/qmanager-installer.sh \
  https://github.com/po1son7/QManager-RM520N/raw/refs/heads/cn/edition/qmanager-installer.sh && \
  bash /tmp/qmanager-installer.sh
```

### Upgrading from v0.1.4

**This one-time hop requires ADB or SSH** — the v0.1.4 update CGI lacks the sudo elevation needed to install v0.1.5+ cleanly. Run the same fresh-install command above; your settings, profiles, and password are preserved.

## 💙 Thank You

Bug reports and feature requests welcome on [GitHub Issues](https://github.com/po1son7/QManager-RM520N/issues).

If QManager saves you time, consider [sponsoring on GitHub](https://github.com/sponsors/dr-dolomite) or sending GCash via Remitly to **Russel Yasol** (+639544817486).

**License:** MIT + Commons Clause — **Happy connecting!**

---
