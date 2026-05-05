"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
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
  FieldError,
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
  TooltipContent,
  TooltipTrigger,
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RotateCcwIcon, AlertTriangleIcon } from "lucide-react";

interface IMEISettingsCardProps {
  currentImei: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (imei: string) => Promise<boolean>;
  onReboot: () => Promise<boolean>;
}

const IMEISettingsCard = ({
  currentImei,
  isLoading,
  isSaving,
  onSave,
  onReboot,
}: IMEISettingsCardProps) => {
  const [imei, setImei] = useState<string>("");
  const [showRebootDialog, setShowRebootDialog] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);

  // Sync form state from fetched data
  useEffect(() => {
    if (currentImei !== null) {
      setImei(currentImei);
    }
  }, [currentImei]);

  const isValidImei = /^\d{15}$/.test(imei);
  const hasChanged = imei !== (currentImei ?? "");
  const showImeiError = imei.length > 0 && !isValidImei;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    if (!isValidImei) return;

    if (!hasChanged) {
      toast.info("没有需要保存的更改");
      return;
    }

    const success = await onSave(imei);
    if (success) {
      toast.success("IMEI 已保存，需重启生效");
      setShowRebootDialog(true);
    } else {
      toast.error("保存 IMEI 失败");
    }
  };

  const handleReset = () => {
    if (currentImei !== null) {
      setImei(currentImei);
    }
  };

  const handleReboot = async (e: React.MouseEvent) => {
    e.preventDefault(); // Keep dialog open to show rebooting state
    setIsRebooting(true);
    const sent = await onReboot();
    if (sent) {
      toast.success("设备正在重启…");
    } else {
      toast.error("重启失败，请手动重启设备");
      setIsRebooting(false);
    }
  };

  // Only allow digits in the input
  const handleImeiChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 15);
    setImei(value);
  };

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>IMEI 设置</CardTitle>
          <CardDescription>
            修改 IMEI 需谨慎，错误设置可能导致设备异常或合规问题。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-64" />
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
        <CardTitle>IMEI 设置</CardTitle>
        <CardDescription>
          更改设备 IMEI 标识，保存后需要重启生效。修改前请确认当地法规要求。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="w-full">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="device-imei-input">
                    设备 IMEI
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="device-imei-input"
                      placeholder="输入 15 位 IMEI"
                      value={imei}
                      onChange={handleImeiChange}
                      maxLength={15}
                      inputMode="numeric"
                      disabled={isSaving}
                      aria-invalid={showImeiError}
                      aria-describedby={showImeiError ? "imei-error" : undefined}
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
                  {showImeiError && (
                    <FieldError id="imei-error">
                      IMEI 必须为 15 位数字（当前 {imei.length}/15）
                    </FieldError>
                  )}
                  <FieldDescription>
                    更改 IMEI 后需重启设备方可生效。
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
          <div className="flex items-center gap-x-2">
            <Button
              type="submit"
              disabled={isSaving || !isValidImei || !hasChanged}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  保存中…
                </>
              ) : (
                "写入 IMEI"
              )}
            </Button>
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

        {/* Reboot confirmation dialog */}
        <AlertDialog open={showRebootDialog} onOpenChange={(open) => {
          if (!isRebooting) setShowRebootDialog(open);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>需要重启</AlertDialogTitle>
              <AlertDialogDescription>
                IMEI 更改需要重启后才能生效，是否立即重启设备？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRebooting}>
                稍后重启
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isRebooting}
                onClick={handleReboot}
              >
                {isRebooting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    正在重启…
                  </>
                ) : (
                  "立即重启"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default IMEISettingsCard;
