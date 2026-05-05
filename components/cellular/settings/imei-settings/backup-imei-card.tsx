"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { SaveButton, useSaveFlash } from "@/components/ui/save-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TbInfoCircleFilled } from "react-icons/tb";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcwIcon, AlertTriangleIcon } from "lucide-react";
import type { BackupImeiConfig } from "@/types/imei-settings";

interface BackupIMEICardProps {
  backupEnabled: boolean | null;
  backupImei: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (config: BackupImeiConfig) => Promise<boolean>;
}

const BackupIMEICard = ({
  backupEnabled,
  backupImei,
  isLoading,
  isSaving,
  onSave,
}: BackupIMEICardProps) => {
  const { saved, markSaved } = useSaveFlash();
  const [localEnabled, setLocalEnabled] = useState(false);
  const [localImei, setLocalImei] = useState("");
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // Sync form state from fetched data
  useEffect(() => {
    if (backupEnabled !== null) {
      setLocalEnabled(backupEnabled);
    }
    if (backupImei !== null) {
      setLocalImei(backupImei);
    }
  }, [backupEnabled, backupImei]);

  const isValidImei = /^\d{15}$/.test(localImei);

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      // Show informational dialog before enabling
      setShowInfoDialog(true);
    } else {
      setLocalEnabled(false);
    }
  };

  const handleInfoConfirm = () => {
    setLocalEnabled(true);
    setShowInfoDialog(false);
  };

  const handleInfoCancel = () => {
    setShowInfoDialog(false);
    // Switch stays OFF
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    if (localEnabled && !isValidImei) {
      toast.error("备份 IMEI 须为 15 位数字");
      return;
    }

    // Check for changes
    const enabledChanged = localEnabled !== (backupEnabled ?? false);
    const imeiChanged = localImei !== (backupImei ?? "");

    if (!enabledChanged && !imeiChanged) {
      toast.info("没有需要保存的更改");
      return;
    }

    const success = await onSave({ enabled: localEnabled, imei: localImei });
    if (success) {
      markSaved();
      toast.success("备份 IMEI 配置已保存");
    } else {
      toast.error("保存备份 IMEI 配置失败");
    }
  };

  const handleReset = () => {
    if (backupEnabled !== null) {
      setLocalEnabled(backupEnabled);
    }
    if (backupImei !== null) {
      setLocalImei(backupImei);
    }
  };

  // Only allow digits in the input
  const handleImeiChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 15);
    setLocalImei(value);
  };

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>设备备份 IMEI</CardTitle>
          <CardDescription>
            当主 IMEI 异常时自动切换到备份 IMEI，保障联网能力。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>设备备份 IMEI</CardTitle>
        <CardDescription>
          若重启后网络拒绝当前 IMEI，设备可自动切换到备份 IMEI 并再次重启。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSave}>
          <FieldSet>
            <FieldGroup>
              <div className="grid gap-2">
                <Field orientation="horizontal" className="w-fit">
                  <FieldLabel htmlFor="backup-imei-toggle">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-flex" aria-label="更多信息">
                          <TbInfoCircleFilled className="size-5 text-info" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          当主 IMEI 被网络拒绝时，切换到备份 IMEI。
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    启用备份 IMEI
                  </FieldLabel>
                  <Switch
                    id="backup-imei-toggle"
                    checked={localEnabled}
                    onCheckedChange={handleSwitchChange}
                    disabled={isSaving}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="backup-imei-input">
                  备份 IMEI
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="backup-imei-input"
                    placeholder="输入备份 IMEI"
                    value={localImei}
                    onChange={handleImeiChange}
                    maxLength={15}
                    inputMode="numeric"
                    disabled={isSaving || !localEnabled}
                  />
                  <InputGroupAddon align="inline-start">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="pl-1.5 inline-flex items-center"
                          aria-label="IMEI 合规提示"
                        >
                          <AlertTriangleIcon className="text-muted-foreground size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          各国对 IMEI 修改的监管不同，
                          <br />
                          更改前请查阅当地法律法规。
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  切换到备份 IMEI 后需要重启设备方可生效。
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
          <div className="flex items-center gap-x-2">
            <SaveButton
              type="submit"
              isSaving={isSaving}
              saved={saved}
              disabled={localEnabled && !isValidImei}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
              aria-label="恢复已保存的值"
            >
              <RotateCcwIcon />
            </Button>
          </div>
        </form>

        {/* Informational dialog when enabling backup IMEI */}
        <AlertDialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>备份 IMEI 自动恢复</AlertDialogTitle>
              <AlertDialogDescription>
                启用备份 IMEI 后，每次因更改 IMEI 而重启时，设备会自动检测主 IMEI
                是否被网络拒绝；若被拒绝，将切换到备份 IMEI 并自动再次重启。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleInfoCancel}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleInfoConfirm}>
                启用备份
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default BackupIMEICard;
