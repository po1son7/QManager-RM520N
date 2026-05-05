#!/bin/sh
# Ephemeral helper: pushed to modem via adb for unattended Gitee install.
# Uses release tag from cn/edition package.json; runs install_rm520n.sh --force (non-interactive SSH skip).
set -eu

GITEE_OWNER=aowu2048
GITEE_REPO=qmanager-rm520n
REF=cn/edition

PKG_URL="https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/raw/${REF}/package.json"
echo "[qm] Reading version from ${PKG_URL}"
VER=$(wget -qO- "$PKG_URL" | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$VER" ] || { echo "[qm] ERROR: could not parse version"; exit 1; }
echo "[qm] Release tag: ${VER}"

TAR_URL="https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/releases/download/${VER}/qmanager.tar.gz"
SUM_URL="https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/releases/download/${VER}/sha256sum.txt"

echo "[qm] Downloading tarball..."
wget -qO /tmp/qmanager.tar.gz "$TAR_URL" || { echo "[qm] ERROR: tarball download failed"; exit 1; }

echo "[qm] Downloading checksum..."
rm -f /tmp/sha256sum.txt
wget -qO /tmp/sha256sum.txt "$SUM_URL" || true

if [ -s /tmp/sha256sum.txt ] && command -v sha256sum >/dev/null 2>&1; then
  echo "[qm] Verifying SHA-256..."
  (cd /tmp && sha256sum -c sha256sum.txt) || { echo "[qm] ERROR: checksum mismatch"; exit 1; }
  echo "[qm] Checksum OK"
else
  echo "[qm] WARN: skipping checksum (file or sha256sum missing)"
fi

rm -rf /tmp/qmanager_install
echo "[qm] Extracting..."
tar xzf /tmp/qmanager.tar.gz -C /tmp/ || { echo "[qm] ERROR: extract failed"; exit 1; }

[ -f /tmp/qmanager_install/install_rm520n.sh ] || { echo "[qm] ERROR: install_rm520n.sh missing"; exit 1; }

echo "[qm] Running install_rm520n.sh --force (answer y => enable dropbear SSH when prompted)..."
chmod +x /tmp/qmanager_install/install_rm520n.sh
printf 'y\n' | /bin/bash /tmp/qmanager_install/install_rm520n.sh --force

echo "[qm] Done."
