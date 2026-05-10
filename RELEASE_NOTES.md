# 🚀 QManager RM520N — Release Notes

## v0.1.8-cn（cn/edition，**与主线 v0.1.8 对齐**)

同一 **0.1.8** 功能代际；cn/edition 面向 **RG501Q** / 中文界面，并在脚本中保留 **`wget` 备选下载**（参考固件常无 `curl`）。Release 标签 **`v0.1.8-cn`**（不采用高于主线的次要版本号）。

### cn/edition 相对主线构建的附加说明

- **安装器 / OTA / 部分 CGI**：在**优先 `curl`** 的前提下保留 **`wget`** / **`uclient-fetch`** 回退（与主线「curl-only」叙述不完全一致，属有意为之）。
- **Tailscale 按需安装**：无 **curl** 时用 **`wget`**（`/opt/bin/wget` 或 Busybox `wget`）。
- **Speedtest 下载**：**镜像 / 直连多源**，`wget` 与 `curl` 皆可触发。
- **系统健康检查**：HTTP 下载项 **`bin.http_fetch`** — **curl 或 wget** 任一可用即通过。

---

# 🚀 QManager RM520N BETA v0.1.8

The connectivity engine got a real fix: it now uses a primary-then-fallback probe with configurable URLs, defaults to Cloudflare so installs in regions that block Google still come up clean, and finally speaks HTTPS. Also fixes Network Priority on Quectel x6x firmwares.

> One-click OTA from **System Settings → Software Update** if you're on v0.1.5 or newer. SSH/ADB is not required.

## ✨ New Features

- **Configurable connectivity probe targets with HTTPS.** System Settings → Connectivity Sensitivity now exposes Primary and Secondary URLs — paste anything from `youtube.com` to `https://example.com/health` and it just works. Defaults are Cloudflare primary, Google secondary, and the probe falls through to the secondary when the primary fails so a single blocked endpoint can never lock the device on "failed" again.

## 🛠️ Improvements

- **Network Priority Settings now populate on RM521F-GL (x65).** The card was rendering blank on x6x-series modems because their firmware echoes the RAT order under the key `rat_order_pref` instead of the `rat_acq_order` x5x firmwares use — same value, different label. The parser now accepts either key, so the three RAT entries (NR5G / LTE / WCDMA) load and reorder correctly across both firmware generations.

## 📥 Installation

### Upgrading from v0.1.7

**System Settings → Software Update** — Download, then Install. No SSH/ADB needed. All settings preserved. Rollback available if needed.

### Fresh Install

ADB or SSH into the modem and run:

```sh
curl -fsSL -o /tmp/qmanager-installer.sh \
  https://github.com/po1son7/QManager-RM520N/raw/refs/heads/cn/edition/qmanager-installer.sh && \
  bash /tmp/qmanager-installer.sh
```

If your modem has `wget` but not `curl` (common on x5x/x6x firmwares like RM502/RM520/RM521), just use `wget` to fetch the installer — preflight auto-installs `curl` from Entware so future OTA updates work (Entware must already be bootstrapped):

```sh
wget -O /tmp/qmanager-installer.sh \
  https://github.com/po1son7/QManager-RM520N/raw/refs/heads/cn/edition/qmanager-installer.sh && \
  bash /tmp/qmanager-installer.sh
```

## 💙 Thank You!

Bug reports and feature requests welcome on [GitHub Issues](https://github.com/po1son7/QManager-RM520N/issues).

If QManager saves you time, consider tipping with [GitHub](https://github.com/sponsors/dr-dolomite) or [PayPal](https://paypal.me/iamrusss).

<div align="center">
  <a href="https://github.com/sponsors/dr-dolomite" target="_blank">
    <img height="40" src="https://img.shields.io/badge/GitHub%20Tip-%E2%9D%A4-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Tip on GitHub" />
  </a>
  <a href="https://paypal.me/iamrusss" target="_blank">
    <img height="40" src="https://img.shields.io/badge/PayPal%20Tip-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="Tip via PayPal" />
  </a>
</div>

GCash via Remitly remains available to **Russel Yasol** (+639544817486).

**License:** MIT + Commons Clause — **Happy connecting!**

---
