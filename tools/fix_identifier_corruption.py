#!/usr/bin/env python3
"""Fix substring replacements that corrupted TS identifiers and mixed UI strings."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REPLACEMENTS = [
    ("Tailscale连接CardProps", "TailscaleConnectionCardProps"),
    ("连接ScenariosComponent", "ConnectionScenariosComponent"),
    ("连接ScenariosCard", "ConnectionScenariosCard"),
    ("render连接StateBadge", "renderConnectionStateBadge"),
    ("use连接Scenarios", "useConnectionScenarios"),
    ("连接ScenariosPage", "ConnectionScenariosPage"),
    ("Tailscale连接Card", "TailscaleConnectionCard"),
    ("自定义ProfileFormComponent", "CustomProfileFormComponent"),
    ("自定义ProfileViewComponent", "CustomProfileViewComponent"),
    ("自定义ProfileComponent", "CustomProfileComponent"),
    ("自定义ProfileFormProps", "CustomProfileFormProps"),
    ("自定义ProfileViewProps", "CustomProfileViewProps"),
    ("自定义ProfilePage", "CustomProfilePage"),
    ("save自定义Scenario", "saveCustomScenario"),
    ("delete自定义Scenario", "deleteCustomScenario"),
    ("save自定义Commands", "saveCustomCommands"),
    ("load自定义Commands", "loadCustomCommands"),
    ("handle自定义PrefixChange", "handleCustomPrefixChange"),
    ("set自定义Commands", "setCustomCommands"),
    ("set自定义Prefix", "setCustomPrefix"),
    ("handle取消Warning", "handleCancelWarning"),
    ("handle取消Edit", "handleCancelEdit"),
    ("on取消", "onCancel"),
    ("on重新连接", "onReconnect"),
    ("连接State", "ConnectionState"),
    ("保存SettingsPayload", "SaveSettingsPayload"),
    ("Watchdog保存Payload", "WatchdogSavePayload"),
    ("SmsAlerts保存Payload", "SmsAlertsSavePayload"),
    ("EmailAlerts保存Payload", "EmailAlertsSavePayload"),
    ("保存ScheduledRebootPayload", "SaveScheduledRebootPayload"),
    ("Mbn保存Request", "MbnSaveRequest"),
    ("Apn保存Request", "ApnSaveRequest"),
    ("debouncedReboot保存", "debouncedRebootSave"),
    ("reboot保存TimerRef", "rebootSaveTimerRef"),
    ("handleThreshold保存", "handleThresholdSave"),
    ("handleName保存", "handleNameSave"),
    ("handle保存Edit", "handleSaveEdit"),
    ("debounced保存", "debouncedSave"),
    ("handle保存", "handleSave"),
    ("can保存", "canSave"),
    ("on保存", "onSave"),
    ("保存 your changes before sending a test SMS.", "发送测试短信前请先保存更改。"),
    ("保存 your changes before sending a test email.", "发送测试邮件前请先保存更改。"),
    ("保存d Profiles", "已保存的场景"),
    ("保存 Settings", "保存设置"),
    ("保存 Changes", "保存更改"),
    ("threshold保存d", "thresholdSaved"),
    ("markThreshold保存d", "markThresholdSaved"),
    ("handleInfo取消", "handleInfoCancel"),
    ("AlertDialog取消", "AlertDialogCancel"),
    ("保存Button", "SaveButton"),
    ("use保存Flash", "useSaveFlash"),
    ("mark保存d", "markSaved"),
    ("set保存d", "setSaved"),
    ("登录Component", "LoginComponent"),
]

REPLACEMENTS.sort(key=lambda x: -len(x[0]))


def main() -> None:
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in (".tsx", ".ts"):
            continue
        if "node_modules" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        orig = text
        for a, b in REPLACEMENTS:
            text = text.replace(a, b)
        if text != orig:
            path.write_text(text, encoding="utf-8")
            print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
