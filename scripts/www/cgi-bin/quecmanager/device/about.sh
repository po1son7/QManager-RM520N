#!/bin/sh
. /usr/lib/qmanager/cgi_base.sh
. /usr/lib/qmanager/cgi_at.sh
# =============================================================================
# about.sh -- CGI Endpoint: About Device (GET-only)
# =============================================================================
# Gathers device identity, network addresses, 3GPP release info, public IPs,
# and OpenWRT system info into a single JSON response.
#
# Data sources:
#   /tmp/qmanager_status.json       -> Poller cache (firmware, IMEI, WAN IPs)
#   AT+QNWCFG="3gpp_rel"           -> 3GPP release versions (LTE, NR5G)
#   SDX5x platform heuristic       -> Rel 15 when 3gpp_rel is missing (RG501Q/RM520N, sdx* host)
#   AT+QMAP="LANIP"                -> device_ip (CSV f2) and lan_gateway (CSV f4), own qcmd after gap
#   https://api-ipv4.ip.sb/ip / api.ipify.org / ident.me -> Public IPv4 (fallback chain)
#   https://api-ipv6.ip.sb/ip / api6.ipify.org / ipv6.icanhazip.com -> Public IPv6
#   /etc/openwrt_release            -> OpenWRT version
#   uname -r                       -> Linux kernel version
#
# Endpoint: GET /cgi-bin/quecmanager/device/about.sh
# Install location: /www/cgi-bin/quecmanager/device/about.sh
# =============================================================================

qlog_init "cgi_about"
cgi_headers
cgi_handle_options

CACHE_FILE="/tmp/qmanager_status.json"
CMD_GAP=0.2
PUB_IP_TIMEOUT=3

# --- Cleanup for temp files --------------------------------------------------
pub4_file="/tmp/qmanager_pub_ipv4.$$"
pub6_file="/tmp/qmanager_pub_ipv6.$$"
cleanup() {
    rm -f "$pub4_file" "$pub6_file"
}
trap cleanup EXIT INT TERM

# SDX5x family (RG501Q / RM520N, hostnames like sdxprairie): some firmware omits
# AT+QNWCFG="3gpp_rel" — use Rel-15 for About when the AT path yields nothing.
# Uses same Project Name source as install_rm520n.sh detect_modem_firmware / preflight.
is_sdx5x_platform() {
    _hn=$(cat /proc/sys/kernel/hostname 2>/dev/null | tr '[:upper:]' '[:lower:]')
    case "$_hn" in *sdx*) return 0 ;; esac

    if [ -f /etc/quectel-project-version ]; then
        _pn=$(grep -m1 '^Project Name:' /etc/quectel-project-version 2>/dev/null \
            | sed 's/^Project Name:[[:space:]]*//' | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
        case "$_pn" in RG501Q*|RM520N*) return 0 ;; esac
        if grep -qiE 'SDX5|SDXLEMUR|SDXPRAIRIE' /etc/quectel-project-version 2>/dev/null; then
            return 0
        fi
    fi

    _m=$(printf '%s' "$c_model" | tr '[:lower:]' '[:upper:]')
    case "$_m" in *RG501Q*|*RM520N*) return 0 ;; esac

    return 1
}

is_dotted_ipv4() {
    printf '%s' "$1" | grep -qE '^([0-9]{1,3}\.){3}[0-9]{1,3}$'
}

# Parse +QMAP: "LANIP",<host_or_start>,<mid>,<gateway> — field 2 = device LAN IP, 4 = gateway.
parse_qmap_lanip_line() {
    _line=$1
    [ -z "$_line" ] && return 1
    _ip2=$(printf '%s' "$_line" | cut -d',' -f2 | tr -d '"' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    _ip4=$(printf '%s' "$_line" | cut -d',' -f4 | tr -d '"' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    is_dotted_ipv4 "$_ip2" || return 1
    is_dotted_ipv4 "$_ip4" || return 1
    lan_ip=$_ip2
    lan_gateway=$_ip4
    return 0
}

# --- GET only ----------------------------------------------------------------
if [ "$REQUEST_METHOD" != "GET" ]; then
    cgi_method_not_allowed
    exit 0
fi

# =============================================================================
# 1. Fire off public IP fetches FIRST (background, non-blocking).
#    RG501Q-EU reference firmware has wget but no curl — prefer wget (Entware first).
# =============================================================================
QM_WGET=""
if [ -x /opt/bin/wget ]; then
    QM_WGET=/opt/bin/wget
elif command -v wget >/dev/null 2>&1; then
    QM_WGET=$(command -v wget)
fi

if [ -n "$QM_WGET" ]; then
    (
        _ok=0
        for url in "https://api-ipv4.ip.sb/ip" "https://api.ipify.org" "https://ident.me"; do
            if "$QM_WGET" -qO- -T "$PUB_IP_TIMEOUT" "$url" > "$pub4_file" 2>/dev/null \
                && grep -qE '^([0-9]{1,3}\.){3}[0-9]{1,3}([[:space:]]|$)' "$pub4_file"; then
                _ok=1
                break
            fi
        done
        [ "$_ok" != 1 ] && rm -f "$pub4_file"
    ) &
    pid4=$!
    (
        _ok=0
        for url in "https://api-ipv6.ip.sb/ip" "https://api6.ipify.org" "https://ipv6.icanhazip.com"; do
            if "$QM_WGET" -qO- -T "$PUB_IP_TIMEOUT" "$url" > "$pub6_file" 2>/dev/null \
                && grep -q ':' "$pub6_file"; then
                _ok=1
                break
            fi
        done
        [ "$_ok" != 1 ] && rm -f "$pub6_file"
    ) &
    pid6=$!
elif command -v curl >/dev/null 2>&1; then
    (
        _ok=0
        for url in "https://api-ipv4.ip.sb/ip" "https://api.ipify.org" "https://ident.me"; do
            if curl -sLk --max-time "$PUB_IP_TIMEOUT" "$url" > "$pub4_file" 2>/dev/null \
                && grep -qE '^([0-9]{1,3}\.){3}[0-9]{1,3}([[:space:]]|$)' "$pub4_file"; then
                _ok=1
                break
            fi
        done
        [ "$_ok" != 1 ] && rm -f "$pub4_file"
    ) &
    pid4=$!
    (
        _ok=0
        for url in "https://api-ipv6.ip.sb/ip" "https://api6.ipify.org" "https://ipv6.icanhazip.com"; do
            if curl -sLk --max-time "$PUB_IP_TIMEOUT" "$url" > "$pub6_file" 2>/dev/null \
                && grep -q ':' "$pub6_file"; then
                _ok=1
                break
            fi
        done
        [ "$_ok" != 1 ] && rm -f "$pub6_file"
    ) &
    pid6=$!
else
    pid4=""
    pid6=""
fi

# =============================================================================
# 2. Read poller cache (single jq call)
# =============================================================================
c_firmware=""
c_build_date=""
c_manufacturer=""
c_model=""
c_imei=""
c_wan_ipv4=""
c_wan_ipv6=""

if [ -f "$CACHE_FILE" ]; then
    eval "$(jq -r '
        @sh "c_firmware=\(.device.firmware // "")",
        @sh "c_build_date=\(.device.build_date // "")",
        @sh "c_manufacturer=\(.device.manufacturer // "")",
        @sh "c_model=\(.device.model // "")",
        @sh "c_imei=\(.device.imei // "")",
        @sh "c_wan_ipv4=\(.network.wan_ipv4 // "")",
        @sh "c_wan_ipv6=\(.network.wan_ipv6 // "")"
    ' "$CACHE_FILE" 2>/dev/null)"
fi

# =============================================================================
# 3. AT commands for data not in the poller cache
# =============================================================================
rel_lte=""
rel_nr5g=""
lan_ip=""
lan_gateway=""

# 3GPP release — dedicated AT (compound replies can drop / reorder lines on some builds).
# Typical: +QNWCFG: "3gpp_rel",15,15  or  +QNWCFG: "3gpp_rel","R15","R17"
raw_rel=$(qcmd 'AT+QNWCFG="3gpp_rel"' 2>/dev/null)
line=$(printf '%s\n' "$raw_rel" | grep -Fi '3gpp_rel' | head -1 | tr -d '\r')
if [ -n "$line" ]; then
    payload=$(printf '%s' "$line" | sed 's/.*3gpp_rel//; s/^[^,]*,//')
    rel_lte=$(printf '%s' "$payload" | cut -d',' -f1 | tr -d '"' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    rel_nr5g=$(printf '%s' "$payload" | cut -d',' -f2 | tr -d '"' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    # Prefer numeric release for display (15 from R15 / Rel15 / "15")
    if [ -n "$rel_lte" ]; then
        _n=$(printf '%s' "$rel_lte" | grep -o '[0-9][0-9]*' | head -1)
        [ -n "$_n" ] && rel_lte="$_n"
    fi
    if [ -n "$rel_nr5g" ]; then
        _n=$(printf '%s' "$rel_nr5g" | grep -o '[0-9][0-9]*' | head -1)
        [ -n "$_n" ] && rel_nr5g="$_n"
    fi
fi

# No 3gpp_rel on some SDX5x builds — documented Rel-15 class for About display.
if [ -z "$rel_lte" ] && [ -z "$rel_nr5g" ] && is_sdx5x_platform; then
    rel_lte=15
    rel_nr5g=15
fi

# LAN IP and gateway — dedicated AT only (do not compound with QNWCFG).
# Typical: +QMAP: "LANIP",192.168.225.20,192.168.227.99,192.168.225.1  (f2=device, f4=gateway)
sleep "$CMD_GAP" 2>/dev/null || true
raw_map=$(qcmd 'AT+QMAP="LANIP"' 2>/dev/null)
line=$(printf '%s\n' "$raw_map" | grep -E '[+]QMAP:.*LANIP' | head -1 | tr -d '\r')
if [ -n "$line" ]; then
    parse_qmap_lanip_line "$line" || line=""
fi
if [ -z "$lan_ip" ] || [ -z "$lan_gateway" ]; then
    sleep "$CMD_GAP" 2>/dev/null || true
    raw_map=$(qcmd 'AT+QMAP="LANIP"' 2>/dev/null)
    line=$(printf '%s\n' "$raw_map" | grep -E '[+]QMAP:.*LANIP' | head -1 | tr -d '\r')
    [ -n "$line" ] && parse_qmap_lanip_line "$line" || true
fi

# =============================================================================
# 4. OpenWRT system info
# =============================================================================
sys_hostname=$(cat /proc/sys/kernel/hostname 2>/dev/null || echo "")
sys_kernel=$(uname -r 2>/dev/null || echo "")
sys_openwrt=""
if [ -f /etc/openwrt_release ]; then
    sys_openwrt=$(. /etc/openwrt_release && echo "$DISTRIB_RELEASE")
elif [ -f /etc/quectel-project-version ]; then
    sys_openwrt=$(grep 'Project Rev' /etc/quectel-project-version 2>/dev/null | sed 's/.*: *//' | tr -d ' \r')
fi

# =============================================================================
# 5. Collect public IP results (wait for background jobs, bounded by timeout)
# =============================================================================
public_ipv4=""
public_ipv6=""

[ -n "$pid4" ] && wait "$pid4" 2>/dev/null
[ -n "$pid6" ] && wait "$pid6" 2>/dev/null

# Read and validate (basic sanity: no HTML, no error pages)
if [ -f "$pub4_file" ]; then
    raw=$(cat "$pub4_file" 2>/dev/null | tr -d '\n\r ')
    case "$raw" in
        *"<"*|"") ;;  # HTML or empty — skip
        *) public_ipv4="$raw" ;;
    esac
fi
if [ -f "$pub6_file" ]; then
    raw=$(cat "$pub6_file" 2>/dev/null | tr -d '\n\r ')
    case "$raw" in
        *"<"*|"") ;;
        *) public_ipv6="$raw" ;;
    esac
fi

# =============================================================================
# 6. Build JSON response
# =============================================================================
jq -n \
    --arg model "$c_model" \
    --arg mfr "$c_manufacturer" \
    --arg firmware "$c_firmware" \
    --arg build_date "$c_build_date" \
    --arg imei "$c_imei" \
    --arg rel_lte "$rel_lte" \
    --arg rel_nr5g "$rel_nr5g" \
    --arg device_ip "$lan_ip" \
    --arg lan_gw "$lan_gateway" \
    --arg wan4 "$c_wan_ipv4" \
    --arg wan6 "$c_wan_ipv6" \
    --arg pub4 "$public_ipv4" \
    --arg pub6 "$public_ipv6" \
    --arg hostname "$sys_hostname" \
    --arg kernel "$sys_kernel" \
    --arg owrt "$sys_openwrt" \
    '{
        success: true,
        device: {
            model: $model,
            manufacturer: $mfr,
            firmware: $firmware,
            build_date: $build_date,
            imei: $imei
        },
        "3gpp_release": {
            lte: $rel_lte,
            nr5g: $rel_nr5g
        },
        network: {
            device_ip: $device_ip,
            lan_gateway: $lan_gw,
            wan_ipv4: $wan4,
            wan_ipv6: $wan6,
            public_ipv4: $pub4,
            public_ipv6: $pub6
        },
        system: {
            hostname: $hostname,
            kernel_version: $kernel,
            openwrt_version: $owrt
        }
    }'
