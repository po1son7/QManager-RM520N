#!/bin/bash
# ==============================================================================
# QManager — Installer Bootstrap for Quectel RG501Q-EU
# （参考验证固件：RG501QEUAAR13A01M4G_04.200.04.200）
#
# 下载本脚本（RG501Q 该固件通常无 curl，请用 wget）
#   wget -q -O /tmp/qmanager-installer.sh \
#     "https://cdn.jsdelivr.net/gh/dr-dolomite/QManager-RM520N@main/qmanager-installer.sh" && \
#     bash /tmp/qmanager-installer.sh
#
# 备选（镜像封装 GitHub Raw）
#   wget -q -O /tmp/qmanager-installer.sh \
#     "https://gh.llkk.cc/https://github.com/dr-dolomite/QManager-RM520N/raw/refs/heads/main/qmanager-installer.sh" && \
#     bash /tmp/qmanager-installer.sh
#
# 版本解析默认顺序：① jsDelivr 上的 main/package.json（不经 GitHub API）
#                   ② 失败时再请求 GitHub Releases API（默认仍走镜像前缀，非直连 github）
#
# Environment variables:
#   QMANAGER_VERSION               Pin release tag (skip automatic resolution)
#   QMANAGER_GITHUB_REPO           owner/repo for Releases URLs + API fallback (default: dr-dolomite/QManager-RM520N)
#   QMANAGER_MIRROR_PREFIX         Prepended to GitHub API/asset HTTPS URLs when unset defaults (see resolve fn)
#   QMANAGER_DISABLE_MIRROR=1      Use direct api.github.com / github.com URLs (no prefix)
#   QMANAGER_PREFER_GITHUB_RELEASES_API=1   Resolve latest tag via Releases API before jsDelivr package.json
#
# 中国大陆 / Gitee Release（资源在国内，可不走路径 gh.llkk.cc）：
#   QMANAGER_USE_GITEE=1           从 Gitee Release 下载 qmanager.tar.gz / sha256sum.txt（不走镜像前缀）
#   QMANAGER_GITEE_REPO=owner/repo  必填，例如 aowu2048/qmanager-rm520n
#   QMANAGER_GITEE_REF=分支名       可选，用于从 Gitee  raw 读取 package.json 解析版本（默认 main）
#
# 模组上一键示例（脚本与安装包均来自 Gitee）：
#   wget -q -O /tmp/qmanager-installer.sh \
#     "https://gitee.com/aowu2048/qmanager-rm520n/raw/cn/edition/qmanager-installer.sh" && \
#   QMANAGER_USE_GITEE=1 QMANAGER_GITEE_REPO=aowu2048/qmanager-rm520n QMANAGER_GITEE_REF=cn/edition \
#     bash /tmp/qmanager-installer.sh
#
# ==============================================================================

# --- Configuration -----------------------------------------------------------

GITHUB_REPO="${QMANAGER_GITHUB_REPO:-dr-dolomite/QManager-RM520N}"
GITHUB_API_BASE="https://api.github.com/repos/${GITHUB_REPO}/releases"
GITEE_API_BASE="" # set by qm_gitee_resolve_api_base

qm_use_gitee() {
    case "${QMANAGER_USE_GITEE:-}" in 1|yes|YES|true|TRUE) return 0 ;; *) return 1 ;; esac
}

qm_gitee_require_repo() {
    if [ -z "${QMANAGER_GITEE_REPO:-}" ]; then
        die "QMANAGER_GITEE_REPO is required when QMANAGER_USE_GITEE=1 (e.g. aowu2048/qmanager-rm520n)"
    fi
}

qm_gitee_owner() { printf '%s' "${QMANAGER_GITEE_REPO%%/*}"; }
qm_gitee_name() { printf '%s' "${QMANAGER_GITEE_REPO#*/}"; }

qm_gitee_resolve_api_base() {
    qm_gitee_require_repo
    GITEE_API_BASE="https://gitee.com/api/v5/repos/$(qm_gitee_owner)/$(qm_gitee_name)"
}

qm_install_mirror_prefix_resolve() {
    if [ -n "${QMANAGER_DISABLE_MIRROR:-}" ]; then
        printf ''
        return 0
    fi
    if [ -n "${QMANAGER_MIRROR_PREFIX+x}" ]; then
        printf '%s' "${QMANAGER_MIRROR_PREFIX}"
        return 0
    fi
    printf '%s' 'https://gh.llkk.cc/'
}

qm_install_mirror_url() {
    local prefix url="$1"
    prefix=$(qm_install_mirror_prefix_resolve)
    if [ -n "$prefix" ]; then
        printf '%s%s' "$prefix" "$url"
    else
        printf '%s' "$url"
    fi
}
ARCHIVE_PATH="/tmp/qmanager.tar.gz"
CHECKSUM_PATH="/tmp/qmanager_sha256sum.txt"
EXTRACT_DIR="/tmp/qmanager_install"

# Device paths (must match install_rm520n.sh / uninstall_rm520n.sh)
WWW_ROOT="/usrdata/qmanager/www"
CGI_DIR="/usrdata/qmanager/www/cgi-bin/quecmanager"
LIB_DIR="/usr/lib/qmanager"
BIN_DIR="/usr/bin"
SYSTEMD_DIR="/lib/systemd/system"
CONF_DIR="/etc/qmanager"

# --- Colors & Formatting -----------------------------------------------------

if [ -t 1 ]; then
    BOLD='\033[1m'
    DIM='\033[2m'
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    CYAN='\033[0;36m'
    NC='\033[0m'
else
    BOLD='' DIM='' RED='' GREEN='' YELLOW='' CYAN='' NC=''
fi

# --- Helpers -----------------------------------------------------------------

info()  { printf "  ${GREEN}*${NC}  %s\n" "$1"; }
warn()  { printf "  ${YELLOW}!${NC}  %s\n" "$1"; }
err()   { printf "  ${RED}x${NC}  %s\n" "$1"; }
step()  { printf "\n  ${CYAN}>${NC}  ${BOLD}%s${NC}\n" "$1"; }

die() {
    err "$1"
    exit 1
}

# --- Checks ------------------------------------------------------------------

check_root() {
    [ "$(id -u)" -eq 0 ] || die "This script must be run as root"
}

check_platform() {
    # RG501Q-EU internal Linux — expect persistent /usrdata (align with RM5xx layout)
    if [ ! -d /usrdata ]; then
        die "RG501Q-EU platform not detected (/usrdata missing)"
    fi
}

is_installed() {
    [ -d "$LIB_DIR" ] || [ -d "$CGI_DIR" ] || [ -f "$SYSTEMD_DIR/qmanager-poller.service" ]
}

# --- Download Helper ---------------------------------------------------------

download_file() {
    local url="$1" dest="$2"

    # RG501Q stock firmware: wget present, curl often missing — prefer Entware then system wget.
    if [ -x /opt/bin/wget ]; then
        /opt/bin/wget -q -O "$dest" "$url" 2>/dev/null && return 0
    fi

    if command -v wget >/dev/null 2>&1; then
        wget -q -O "$dest" "$url" 2>/dev/null && return 0
    fi

    if command -v curl >/dev/null 2>&1; then
        curl -fsSL -o "$dest" "$url" 2>/dev/null && return 0
    fi

    return 1
}

# --- GitHub API Helper -------------------------------------------------------

fetch_release_info() {
    local api_url_raw="$1"
    local api_url
    api_url="$(qm_install_mirror_url "$api_url_raw")"
    local tmp_file="/tmp/qm_installer_api.json"
    local is_list=false
    rm -f "$tmp_file"

    # Detect if we're querying the list endpoint (array) vs a single release (object)
    case "$api_url_raw" in */releases|*/releases\?*) is_list=true ;; esac

    if ! download_file "$api_url" "$tmp_file"; then
        return 1
    fi

    # Parse with jq if available, otherwise fallback to grep
    if command -v jq >/dev/null 2>&1; then
        if $is_list; then
            RELEASE_TAG=$(jq -r '.[0].tag_name // empty' "$tmp_file" 2>/dev/null)
        else
            RELEASE_TAG=$(jq -r '.tag_name // empty' "$tmp_file" 2>/dev/null)
        fi
    else
        # Fallback: grep for tag_name in JSON (first match)
        RELEASE_TAG=$(grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' "$tmp_file" | head -1 | cut -d'"' -f4)
    fi

    rm -f "$tmp_file"
    [ -n "$RELEASE_TAG" ]
}

# Resolve release tag from jsDelivr — reads main/package.json ".version" (no github.com / GitHub API).
fetch_release_tag_pkg_json() {
    RELEASE_TAG=""
    local owner="${GITHUB_REPO%%/*}"
    local repo="${GITHUB_REPO#*/}"
    local url="https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/package.json"
    local tmp_file="/tmp/qm_installer_pkg.json"
    rm -f "$tmp_file"

    if ! download_file "$url" "$tmp_file"; then
        return 1
    fi

    if command -v jq >/dev/null 2>&1; then
        RELEASE_TAG=$(jq -r '.version // empty' "$tmp_file" 2>/dev/null)
    else
        RELEASE_TAG=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$tmp_file" | head -1 | cut -d'"' -f4)
    fi

    rm -f "$tmp_file"
    [ -n "$RELEASE_TAG" ]
}

# --- Gitee API / raw package.json (中国大陆 Release 直连) ------------------------

fetch_release_info_gitee_latest() {
    RELEASE_TAG=""
    qm_gitee_resolve_api_base
    local tmp_file="/tmp/qm_gitee_release.json"
    rm -f "$tmp_file"
    if ! download_file "${GITEE_API_BASE}/releases/latest" "$tmp_file"; then
        rm -f "$tmp_file"
        return 1
    fi
    if command -v jq >/dev/null 2>&1; then
        RELEASE_TAG=$(jq -r '.tag_name // empty' "$tmp_file" 2>/dev/null)
    else
        RELEASE_TAG=$(grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' "$tmp_file" | head -1 | cut -d'"' -f4)
    fi
    rm -f "$tmp_file"
    [ -n "$RELEASE_TAG" ]
}

fetch_release_tag_gitee_pkg_json() {
    RELEASE_TAG=""
    qm_gitee_require_repo
    local ref="${QMANAGER_GITEE_REF:-main}"
    local owner repo url tmp_file
    owner=$(qm_gitee_owner)
    repo=$(qm_gitee_name)
    url="https://gitee.com/${owner}/${repo}/raw/${ref}/package.json"
    tmp_file="/tmp/qm_gitee_pkg.json"
    rm -f "$tmp_file"
    if ! download_file "$url" "$tmp_file"; then
        return 1
    fi
    if command -v jq >/dev/null 2>&1; then
        RELEASE_TAG=$(jq -r '.version // empty' "$tmp_file" 2>/dev/null)
    else
        RELEASE_TAG=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$tmp_file" | head -1 | cut -d'"' -f4)
    fi
    rm -f "$tmp_file"
    [ -n "$RELEASE_TAG" ]
}

# Sets tarball_url / checksum_url for the active release host (GitHub mirror vs Gitee direct).
qm_release_tarball_and_checksum_urls() {
    local tr cr o r
    if qm_use_gitee; then
        qm_gitee_require_repo
        o=$(qm_gitee_owner)
        r=$(qm_gitee_name)
        tr="https://gitee.com/${o}/${r}/releases/download/${RELEASE_TAG}/qmanager.tar.gz"
        cr="https://gitee.com/${o}/${r}/releases/download/${RELEASE_TAG}/sha256sum.txt"
        tarball_url="$tr"
        checksum_url="$cr"
    else
        tr="https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/qmanager.tar.gz"
        cr="https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/sha256sum.txt"
        tarball_url="$(qm_install_mirror_url "$tr")"
        checksum_url="$(qm_install_mirror_url "$cr")"
    fi
}

verify_pinned_release_tag() {
    [ -n "${QMANAGER_VERSION:-}" ] || return 0
    if qm_use_gitee; then
        qm_gitee_resolve_api_base
        local tmp="/tmp/qm_gitee_tag_verify.json"
        rm -f "$tmp"
        if download_file "${GITEE_API_BASE}/releases/tags/${RELEASE_TAG}" "$tmp" && [ -s "$tmp" ]; then
            rm -f "$tmp"
            return 0
        fi
        rm -f "$tmp"
        warn "Could not verify tag via Gitee API — continuing anyway (pinned version)."
        return 0
    fi
    if ! fetch_release_info "${GITHUB_API_BASE}/tags/${RELEASE_TAG}"; then
        warn "Could not verify tag via Releases API — continuing anyway (pinned version)."
    fi
}

# Prefer jsDelivr (GitHub) or Gitee raw/API when QMANAGER_USE_GITEE=1.
resolve_release_tag() {
    RELEASE_TAG=""
    if [ -n "${QMANAGER_VERSION:-}" ]; then
        RELEASE_TAG="$QMANAGER_VERSION"
        info "Pinned version: $RELEASE_TAG"
        return 0
    fi

    if qm_use_gitee; then
        qm_gitee_require_repo
        if [ -n "${QMANAGER_PREFER_GITHUB_RELEASES_API:-}" ]; then
            if fetch_release_info_gitee_latest; then
                info "Resolved version from Gitee Releases API: $RELEASE_TAG"
                return 0
            fi
            warn "Gitee Releases API unavailable, trying Gitee raw package.json..."
            if fetch_release_tag_gitee_pkg_json; then
                info "Resolved version from Gitee raw package.json (${QMANAGER_GITEE_REF:-main}): $RELEASE_TAG"
                return 0
            fi
            return 1
        fi
        if fetch_release_tag_gitee_pkg_json; then
            info "Resolved version from Gitee raw package.json (${QMANAGER_GITEE_REF:-main}): $RELEASE_TAG"
            return 0
        fi
        warn "Gitee package.json unreadable, trying Gitee Releases API..."
        if fetch_release_info_gitee_latest; then
            info "Resolved version from Gitee Releases API: $RELEASE_TAG"
            return 0
        fi
        return 1
    fi

    if [ -n "${QMANAGER_PREFER_GITHUB_RELEASES_API:-}" ]; then
        if fetch_release_info "${GITHUB_API_BASE}?per_page=1"; then
            info "Resolved version from Releases API: $RELEASE_TAG"
            return 0
        fi
        warn "Releases API unavailable, trying jsDelivr package.json..."
        if fetch_release_tag_pkg_json; then
            info "Resolved version from jsDelivr (main/package.json): $RELEASE_TAG"
            return 0
        fi
        return 1
    fi

    if fetch_release_tag_pkg_json; then
        info "Resolved version from jsDelivr (main/package.json): $RELEASE_TAG"
        return 0
    fi

    warn "jsDelivr package.json unreadable, falling back to GitHub Releases API..."
    if fetch_release_info "${GITHUB_API_BASE}?per_page=1"; then
        info "Resolved version from Releases API: $RELEASE_TAG"
        return 0
    fi
    return 1
}

# ==============================================================================
# Option 1 — Install
# ==============================================================================

do_install() {
    check_root
    check_platform

    printf "\n"
    if is_installed; then
        warn "QManager is already installed. This will upgrade it."
        printf "\n  Continue? [y/N] "
        read -r ans
        case "$ans" in y|Y|yes|YES) ;; *) printf "\n  Aborted.\n\n"; return ;; esac
    fi

    # Resolve release version (prefer jsDelivr; see resolve_release_tag)
    step "Checking latest release..."
    if ! resolve_release_tag; then
        if qm_use_gitee; then
            die "Could not resolve release version (Gitee raw package.json + Releases API failed)."
        fi
        die "Could not resolve latest release version (jsDelivr + GitHub API both failed)."
    fi

    verify_pinned_release_tag

    info "Release: $RELEASE_TAG"

    local tarball_url checksum_url
    qm_release_tarball_and_checksum_urls

    # Download tarball
    step "Downloading QManager ${RELEASE_TAG}..."
    printf "     %s\n" "$tarball_url"

    rm -f "$ARCHIVE_PATH"
    if ! download_file "$tarball_url" "$ARCHIVE_PATH"; then
        printf "\n"
        if qm_use_gitee; then
            die "Download failed (Gitee). Check network and that Release assets exist for tag ${RELEASE_TAG}."
        fi
        die "Download failed. Check your internet connection."
    fi
    [ -f "$ARCHIVE_PATH" ] || die "Download failed — archive not found"

    local size
    size=$(du -k "$ARCHIVE_PATH" 2>/dev/null | awk '{print $1 "K"}')
    info "Downloaded qmanager.tar.gz ($size)"

    # Download and verify checksum
    rm -f "$CHECKSUM_PATH"
    if download_file "$checksum_url" "$CHECKSUM_PATH" && [ -s "$CHECKSUM_PATH" ]; then
        local expected_sha256 actual_sha256
        expected_sha256=$(awk '{print $1}' "$CHECKSUM_PATH")
        actual_sha256=$(sha256sum "$ARCHIVE_PATH" 2>/dev/null | awk '{print $1}')

        if [ -z "$actual_sha256" ]; then
            warn "sha256sum not available — skipping integrity check"
        elif [ "$actual_sha256" != "$expected_sha256" ]; then
            err "SHA-256 mismatch!"
            err "  Expected: $expected_sha256"
            err "  Got:      $actual_sha256"
            rm -f "$ARCHIVE_PATH" "$CHECKSUM_PATH"
            die "Archive integrity check failed — download may be corrupt or tampered"
        else
            info "SHA-256 verified"
        fi
    else
        warn "Checksum file not available — skipping integrity check"
    fi
    rm -f "$CHECKSUM_PATH"

    # Extract
    step "Extracting archive..."
    rm -rf "$EXTRACT_DIR"
    tar xzf "$ARCHIVE_PATH" -C /tmp/ 2>/dev/null || die "Extraction failed — archive may be corrupt"
    [ -d "$EXTRACT_DIR" ] || die "Extraction failed — $EXTRACT_DIR not found"
    info "Extracted to $EXTRACT_DIR"

    # Run install_rm520n.sh from the archive
    step "Running QManager installer..."
    printf "\n"
    if [ -f "$EXTRACT_DIR/install_rm520n.sh" ]; then
        chmod +x "$EXTRACT_DIR/install_rm520n.sh"
        bash "$EXTRACT_DIR/install_rm520n.sh"
    else
        die "install_rm520n.sh not found inside archive"
    fi

    # Cleanup
    step "Cleaning up..."
    rm -f "$ARCHIVE_PATH"
    info "Temporary files removed"
}

# ==============================================================================
# Option 2 — Uninstall
# ==============================================================================

do_uninstall() {
    check_root
    check_platform

    printf "\n"
    if ! is_installed; then
        warn "QManager does not appear to be installed."
        printf "\n  Continue anyway? [y/N] "
        read -r ans
        case "$ans" in y|Y|yes|YES) ;; *) printf "\n  Aborted.\n\n"; return ;; esac
    fi

    if [ -f "$EXTRACT_DIR/uninstall_rm520n.sh" ]; then
        step "Running QManager uninstaller..."
        printf "\n"
        bash "$EXTRACT_DIR/uninstall_rm520n.sh"
    else
        warn "Uninstall script not found at $EXTRACT_DIR/uninstall_rm520n.sh"
        warn "If you installed from a previous release, SSH in and run:"
        printf "\n     bash /tmp/qmanager_install/uninstall_rm520n.sh\n\n"
    fi
}

# ==============================================================================
# Option 3 — Download Only
# ==============================================================================

do_download_only() {
    printf "\n"

    # Resolve release version
    step "Checking latest release..."
    if ! resolve_release_tag; then
        if qm_use_gitee; then
            die "Could not resolve release version (Gitee)."
        fi
        die "Could not resolve release version."
    fi

    verify_pinned_release_tag

    local tarball_url checksum_url
    qm_release_tarball_and_checksum_urls

    step "Downloading QManager ${RELEASE_TAG}..."
    printf "     %s\n" "$tarball_url"

    rm -f "$ARCHIVE_PATH"
    if ! download_file "$tarball_url" "$ARCHIVE_PATH"; then
        printf "\n"
        if qm_use_gitee; then
            die "Download failed (Gitee). Check Release assets for tag ${RELEASE_TAG}."
        fi
        die "Download failed. Check your internet connection."
    fi

    if [ -f "$ARCHIVE_PATH" ]; then
        local size
        size=$(du -k "$ARCHIVE_PATH" 2>/dev/null | awk '{print $1 "K"}')
        info "Downloaded to $ARCHIVE_PATH ($size)"
        printf "\n"
        printf "  To install later:\n\n"
        printf "     cd /tmp && tar xzf qmanager.tar.gz\n"
        printf "     cd qmanager_install && bash install_rm520n.sh\n\n"
    else
        die "Download failed"
    fi
}

# ==============================================================================
# Menu
# ==============================================================================

show_menu() {
    clear 2>/dev/null || true
    printf "\n"
    printf "  ${CYAN}==========================================${NC}\n"
    printf "  ${BOLD}       QManager — Setup Wizard${NC}\n"
    printf "  ${DIM}   Quectel RG501Q-EU Modem Manager${NC}\n"
    printf "  ${CYAN}==========================================${NC}\n"
    printf "\n"

    # Show install status
    if is_installed; then
        printf "  Status: ${GREEN}Installed${NC}\n"
    else
        printf "  Status: ${DIM}Not installed${NC}\n"
    fi
    printf "\n"

    printf "  ${BOLD}[1]${NC}  Install QManager\n"
    printf "  ${BOLD}[2]${NC}  Uninstall QManager\n"
    printf "  ${BOLD}[3]${NC}  Download Only\n"
    printf "\n"
    printf "  ${DIM}[0]  Exit${NC}\n"
    printf "\n"
    printf "  Select an option: "
}

# ==============================================================================
# Entrypoint
# ==============================================================================

main() {
    show_menu
    read -r choice

    case "$choice" in
        1) do_install ;;
        2) do_uninstall ;;
        3) do_download_only ;;
        0) printf "\n  Goodbye.\n\n"; exit 0 ;;
        *)
            printf "\n"
            err "Invalid option: $choice"
            printf "\n"
            exit 1
            ;;
    esac
}

main
