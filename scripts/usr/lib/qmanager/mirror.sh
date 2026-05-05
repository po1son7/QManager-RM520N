#!/bin/sh
# GitHub / HTTPS mirror prefix: ${prefix}${canonical_url}
# Default targets mainland-China-friendly acceleration unless overridden.

[ -n "$_QM_MIRROR_SH_LOADED" ] && return 0
_QM_MIRROR_SH_LOADED=1

# Prepended to api.github.com / github.com release URLs when no config/env override.
QM_CN_MIRROR_PREFIX_DEFAULT="https://gh.llkk.cc/"

qm_mirror_wrap() {
    url="$1"
    prefix="$2"
    if [ -n "$prefix" ]; then
        printf '%s%s' "$prefix" "$url"
    else
        printf '%s' "$url"
    fi
}

# Resolve mirror prefix: env QMANAGER_MIRROR_PREFIX if set (may be empty); else default CN mirror.
# QMANAGER_DISABLE_MIRROR=1 forces direct HTTPS (no prefix).
qm_mirror_prefix_resolve() {
    if [ -n "${QMANAGER_DISABLE_MIRROR:-}" ]; then
        printf ""
        return
    fi
    if [ -n "${QMANAGER_MIRROR_PREFIX+x}" ]; then
        printf '%s' "${QMANAGER_MIRROR_PREFIX}"
        return
    fi
    printf '%s' "$QM_CN_MIRROR_PREFIX_DEFAULT"
}
