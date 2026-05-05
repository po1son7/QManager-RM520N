# QManager

<div align="center">
  <img src="public/qmanager-logo.svg" alt="QManager Logo" width="120" />
  <h3>面向 Quectel 模组管理的现代化 Web 图形界面</h3>
  <p>用直观的网页界面查看、配置与优化蜂窝模组的运行表现</p>

  ![Version](https://img.shields.io/badge/version-v0.1.6-blue?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-green?style=flat-square)
  ![Platform](https://img.shields.io/badge/platform-RG501Q--EU-orange?style=flat-square)
  ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
  ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)
</div>

---

> **说明：** QManager 是 [SimpleAdmin](https://github.com/dr-dolomite/simpleadmin-mockup) 的继任者。本 **`cn/edition`** 分支面向 **Quectel RG501Q-EU**，在固件 **RG501QEUAAR13A01M4G_04.200.04.200** 上对照验证；代码由 RM520N-GL 版本移植而来，仍有大量共用逻辑。

---

## 功能概览

### 信号与网络监控
- **实时信号看板** — RSRP、RSRQ、SINR，支持 4×4 MIMO 分天线数值与约 30 分钟历史曲线  
- **天线统计** — 四个天线端口信号分解与质量指示  
- **天线对准** — 三位置记录与综合得分对比，辅助摆放天线  
- **网络事件** — 频段切换、小区重选、载波聚合变化、连接事件等自动记录  
- **时延监控** — 实时 ping、24 小时历史、抖动与丢包，多时间尺度汇总  
- **流量统计** — 实时速率（Mbps）与累计流量  

### 蜂窝参数与业务
- **频段锁定** — 选择/锁定 LTE/NR 频段，支持频段级故障转移  
- **小区锁定** — 按 PCI 锁定基站，支持自动转移与定时策略  
- **频点锁定** — 锁定指定 EARFCN/ARFCN  
- **APN 管理** — 增删改 APN，内置部分运营商预设（T-Mobile、AT&T、Verizon 等）  
- **自定义 SIM 配置** — 保存完整配置（APN、TTL/HL、可选 IMEI），换卡可自动套用  
- **连接场景** — 保存与恢复整网配置快照  
- **网络优先级** — 优选制式与选网模式  
- **小区扫描** — 当前/邻区扫描与信号对比  
- **频点换算** — EARFCN/ARFCN 与频率换算  
- **短信中心** — 在界面内收发短信  
- **IMEI** — 读取/备份/修改、生成与校验（Luhn）、TAC 预设、imei.info 查询等  
- **FPLMN** — 禁止注册 PLMN 列表管理  
- **MBN** — 宽带配置包选择与激活  

### 本地网络
- **TTL/HL** — IPv4 TTL 与 IPv6 跳限（基于 iptables）  
- **MTU** — rmnet 接口动态 MTU  
- **IP 透传** — 下游设备直出公网 IP  

### VPN 与远程
- **Tailscale** — 一键安装/连接/管理，节点表与健康提示，可持久化  
- **端口防火墙** — 默认仅允许信任接口访问 80/443，兼容 Tailscale  

### 可靠性
- **连接看门狗** — 四级自愈：AT+COPS 退网重登 → CFUN → 换卡 → 重启（带限速）  
- **邮件告警** — 通过 Gmail SMTP（msmtp）在恢复时附带中断时长  
- **短信告警** — 基于 `sms_tool` 的控制面短信告警与去重  
- **低功耗模式** — 基于 cron 的 CFUN 定时下电窗口  
- **软件更新** — 应用内检查、下载、校验、安装与回滚  
- **系统日志** — 集中查看与搜索  

### 界面与其他
- **深色/浅色** — OKLCH 配色体系  
- **响应式布局** — 适合桌面与平板现场操作  
- **Cookie 会话** — 鉴权与频率限制  
- **网页终端** — 内置 ttyd，支持全屏与深色主题  
- **AT 终端** — 直接下发 AT  
- **首次向导** — 首次部署引导  

---

## 前提条件

- **Quectel RG501Q-EU** 模组（参考验证固件：**RG501QEUAAR13A01M4G_04.200.04.200**），具备以太网调试/接入能力  
- **`/opt` 上的 Entware**（安装器可在联网时自动引导安装；当前脚本仍沿用 RM520 移植时的 **armv7sf-k3.2** Entware 架构，若与你的 RG501Q 镜像不符需自行调整 `install_rm520n.sh` 中的 `ENTWARE_ARCH`）  
- **ADB** 或 **SSH** 登录模组  

> **说明：** 参考固件环境下通常 **没有 `curl`**，文档与安装脚本均以 **`wget`** 下载；安装脚本内部下载同样 **优先 wget**（含 `/opt/bin/wget`），其次才尝试 `curl`。

---

## 快速安装

通过 ADB 或 SSH 登录模组后执行（**推荐 wget**，与本参考固件一致）：

```sh
wget -q -O /tmp/qmanager-installer.sh \
  "https://cdn.jsdelivr.net/gh/dr-dolomite/QManager-RM520N@main/qmanager-installer.sh" && \
  bash /tmp/qmanager-installer.sh
```

上述地址使用 **jsDelivr CDN** 读取仓库中的安装脚本，**浏览器侧域名不含 github.com**，适合 GitHub 无法直连的环境。

**备选：** 若 jsDelivr 不可用，可通过镜像前缀封装 Raw 地址：

```sh
wget -q -O /tmp/qmanager-installer.sh \
  "https://gh.llkk.cc/https://github.com/dr-dolomite/QManager-RM520N/raw/refs/heads/main/qmanager-installer.sh" && \
  bash /tmp/qmanager-installer.sh
```

安装脚本默认行为：

1. **解析版本号**：优先从 jsDelivr 拉取 **`main/package.json`** 中的 `"version"`（**不调用 GitHub Releases API**）。仅在失败时再回退到 GitHub Releases API（默认同样经过镜像前缀，避免直连 `api.github.com`）。  
   - 维护发布时请尽量保证 **`main` 分支的 `package.json` 版本号与 GitHub Release 标签一致**。  
   - 若希望始终用 Releases API 解析最新标签，可设置：`export QMANAGER_PREFER_GITHUB_RELEASES_API=1`。
2. **下载安装包**：从 `releases/download/<tag>/qmanager.tar.gz` 获取内容；默认对 `https://github.com/...` 与 `https://api.github.com/...` 使用镜像前缀 **`https://gh.llkk.cc/`**，实际 TLS 连接到加速端，而非直连 GitHub。
3. **传输工具**：安装脚本及运行时使用 **`wget`** 优先下载资源（参考固件无 `curl`）；安装 Entware 后亦可使用 `/opt/bin/wget`。  
4. **Entware**：默认引导地址为 **`http://mirror.nju.edu.cn/entware`**（路径与官方 `bin.entware.net/{arch}/installer` 一致）。

安装器会校验 SHA-256（若提供 `sha256sum.txt`）、按需引导 Entware、安装 lighttpd、部署前后端、配置 systemd，并可选安装 dropbear（SSH）。首次引导时 Web 管理密码会与 root SSH 密码对齐。完成后通常会重启模组。

### 强制直连 GitHub（取消镜像前缀）

```sh
export QMANAGER_DISABLE_MIRROR=1
wget -q -O /tmp/qmanager-installer.sh \
  https://github.com/dr-dolomite/QManager-RM520N/raw/refs/heads/main/qmanager-installer.sh && \
  bash /tmp/qmanager-installer.sh
```

### 使用官方 Entware 源（非南大镜像）

```sh
export ENTWARE_BIN_HOST="http://bin.entware.net"
bash /tmp/qmanager-installer.sh
```

（仅解压包手动安装时，也可在运行 `install_rm520n.sh` 前导出该变量。）

安装完成后，设备上 **`/etc/qmanager/qmanager.conf`** → `update` 段默认仍带 **`mirror_prefix`**，用于系统内 OTA 与 ttyd 等下载；可自行修改或调整 `github_repo`（例如使用你自己的 Release 仓库）。

**Speedtest CLI**：先尝试 `install.speedtest.net`，失败后再使用与 GitHub 相同的镜像前缀；也可用 `QMANAGER_SPEEDTEST_URL` 指向你可访问的完整包地址。

### 升级

自 v0.1.5 起，可在 **系统设置 → 软件更新** 中使用内置 OTA：下载、校验、安装；支持回滚。

> **注意：** 从 v0.1.4 升到 v0.1.5 仍需 ADB/SSH，因为旧版 CGI 缺少以 root 调用更新进程的 sudo 规则。v0.1.5 之后版本一般可在界面内完成升级。

### 卸载

```sh
# 通过 SSH 登录
bash /tmp/qmanager_install/uninstall_rm520n.sh

# 非交互（脚本/无人值守）
bash /tmp/qmanager_install/uninstall_rm520n.sh --force

# 卸载后不自动重启
bash /tmp/qmanager_install/uninstall_rm520n.sh --no-reboot

# 同时清理配置/配置档/密码/Tailscale 等
bash /tmp/qmanager_install/uninstall_rm520n.sh --purge
```

即便使用 `--purge`，**Entware（`/opt/`）仍会保留**；若需移除请手动操作。

---

## 额外依赖说明

- **安装器捆绑：** `atcli_smd11`（[atcli_rust](https://github.com/1alessandro1/atcli_rust) 衍生静态 ARM 二进制，`/dev/smd11` AT 传输）、`sms_tool`、`jq`（Entware 包）、`dropbear`（SSH）  
- **安装过程下载：** Speedtest CLI（官方域名优先，镜像前缀兜底；可用 `QMANAGER_SPEEDTEST_URL` 覆盖）  
- **来自 Entware：** `lighttpd` + `lighttpd-mod-openssl`、`sudo`、`coreutils-timeout`  
- **可选：** `msmtp`（邮件告警），可在应用内安装  

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Next.js 16、React 19、TypeScript 5 |
| **样式** | Tailwind CSS v4、OKLCH、本地 Euclid Circular B + 系统 UI 字体 |
| **组件** | shadcn/ui（40+）、Recharts、React Hook Form + Zod |
| **后端** | Bash CGI（lighttpd） |
| **AT** | `qcmd` + `atcli_smd11` → `/dev/smd11` |
| **初始化** | systemd |
| **包管理** | Bun（开发）、Entware opkg（设备） |

---

## 架构

```
Browser --- authFetch() --- lighttpd --- CGI Scripts --- qcmd --- atcli_smd11 --- /dev/smd11 --- Modem
                |                  |                       |
                |          Shell Libraries (12)      flock serialization
                |
        reads /tmp/qmanager_status.json
                |
         qmanager_poller
       (tiered polling: 2s/10s/30s)
```

前端为静态导出的 Next.js，由 lighttpd 从 `/usrdata/qmanager/www` 提供；后端在模组 Linux 上以 CGI 与 systemd 守护进程运行。

**数据流概要**

- **轮询守护进程** 每 2～30s（多级）查询模组 AT，写入 JSON 缓存  
- **CGI** 对 GET 读缓存，对 POST 执行 AT  
- **React Hooks** 轮询 CGI 并处理加载/错误/过期状态  
- **AT 传输** 直接使用 `/dev/smd11`，无需 socat PTY  

**平台要点（RG501Q-EU / RM520 衍生移植）**

| 项目 | 说明 |
|------|------|
| OS | Quectel 内置 Linux（具体内核以模组固件为准） |
| Init | systemd |
| 根文件系统 | 默认只读（必要时 remount rw） |
| 持久化 | `/usrdata/`（与 RM520 移植假设一致） |
| Web | Entware lighttpd |
| 防火墙 | iptables |
| 配置 | `/etc/qmanager/` 等 |

---

## 开发

### 环境要求

- [Bun](https://bun.sh/)（推荐）或 Node.js 18+  

### 上手

```bash
git clone https://github.com/dr-dolomite/qmanager.git
cd qmanager && git checkout dev-rm520

bun install
bun run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)（开发模式默认把 API 代理到 `192.168.225.1` 上的模组）。

### 生产构建

```bash
bun run build    # 静态导出到 out/
bun run package  # 打包含前端 + 后端脚本 + 依赖 + sha256sum，便于发 Release
```

---

## 目录结构（摘录）

```
QManager/
├── app/                   # Next.js 页面
├── components/            # React 组件
├── hooks/
├── types/
├── lib/
├── constants/
├── scripts/               # 设备端 Shell、systemd、CGI、安装/卸载脚本
├── dependencies/          # 预置 ARM 二进制与 ipk
├── docs/
└── build.sh
```

---

## 后端服务（systemd）

| 服务 | 作用 |
|------|------|
| `qmanager-firewall` | 在 lighttpd 前限制 80/443 仅信任接口 |
| `qmanager-setup` | 开机一次性目录与权限初始化 |
| `qmanager-poller` | 主轮询守护，写 JSON 缓存与事件检测 |
| `qmanager-ping` | 时延采集，NDJSON 约 24h 历史 |
| `qmanager-console` | ttyd 本地控制台，经 lighttpd 反代 |
| `qmanager-watchcat` | 连接看门狗状态机 |
| `qmanager-ttl` | 启动时下发 TTL/HL 规则 |
| `qmanager-mtu` | 启动时设置 MTU |
| `qmanager-imei-check` | IMEI 备份一致性检查 |
| `qmanager-tower-failover` | 小区锁失败回退（受配置开关控制） |

---

## 支持项目

<div align="center">
  <h3>支持 QManager 持续开发</h3>
  <p>捐助有助于硬件、多网络测试与长期维护。</p>
  <br/>
  <a href="https://github.com/sponsors/dr-dolomite" target="_blank">
    <img height="40" src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub" />
  </a>
  <br/><br/>
  <p><strong>GCash（Remitly）</strong><br/>姓名: Russel Yasol<br/>号码: +639544817486</p>
</div>

---

## 许可

本项目采用 [MIT License with Commons Clause](LICENSE)。

**允许：** 个人或非商业场景下使用、修改、二次分发与 Fork。  

**禁止：** 出售 QManager、将其嵌入商业产品或作为付费服务提供（包括 Fork 版本）。

### 商业授权

若在商业产品、OEM 或转售场景中使用，请联系作者 [DrDolomite](https://github.com/dr-dolomite) 洽谈授权。

---

<div align="center">
  <p>由 <a href="https://github.com/dr-dolomite">DrDolomite</a> 维护</p>
</div>
