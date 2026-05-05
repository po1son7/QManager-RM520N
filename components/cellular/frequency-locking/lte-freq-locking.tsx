"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TbInfoCircleFilled, TbAlertTriangleFilled } from "react-icons/tb";

import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

import type { FreqLockModemState } from "@/types/frequency-locking";
import type { ModemStatus } from "@/types/modem-status";
import { findAllMatchingLTEBands, type LTEBandEntry } from "@/lib/earfcn";
import { BandMatchDisplay } from "./band-match-display";

interface LteFreqLockingProps {
  modemState: FreqLockModemState | null;
  modemData: ModemStatus | null;
  isLoading: boolean;
  isLocking: boolean;
  error: string | null;
  towerLockActive: boolean;
  onLock: (earfcns: number[]) => Promise<boolean>;
  onUnlock: () => Promise<boolean>;
  onRefresh: () => void;
}

const LteFreqLockingComponent = ({
  modemState,
  modemData,
  isLoading,
  isLocking,
  error,
  towerLockActive,
  onLock,
  onUnlock,
  onRefresh,
}: LteFreqLockingProps) => {
  // Local form state for the 2 EARFCN inputs
  const [earfcn1, setEarfcn1] = useState("");
  const [earfcn2, setEarfcn2] = useState("");

  // Confirmation dialog state
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [showUnsupportedWarning, setShowUnsupportedWarning] = useState(false);
  const [pendingEarfcns, setPendingEarfcns] = useState<number[]>([]);

  // Sync form from modem state when data loads
  useEffect(() => {
    if (modemState?.lte_entries && modemState.lte_entries.length > 0) {
      setEarfcn1(String(modemState.lte_entries[0].earfcn));
      if (modemState.lte_entries[1]) {
        setEarfcn2(String(modemState.lte_entries[1].earfcn));
      }
    }
  }, [modemState?.lte_entries]);

  // Derive enabled state from modem state
  const isEnabled = modemState?.lte_locked ?? false;
  const isDisabled = towerLockActive || isLocking;

  // Band matching for display
  const matchedBands1 = useMemo((): LTEBandEntry[] => {
    const val = parseInt(earfcn1, 10);
    return isNaN(val) ? [] : findAllMatchingLTEBands(val);
  }, [earfcn1]);

  const matchedBands2 = useMemo((): LTEBandEntry[] => {
    const val = parseInt(earfcn2, 10);
    return isNaN(val) ? [] : findAllMatchingLTEBands(val);
  }, [earfcn2]);

  // Parse supported bands from modem data
  const supportedBands = useMemo((): number[] => {
    const raw = modemData?.device?.supported_lte_bands;
    if (!raw) return [];
    return raw
      .split(":")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }, [modemData?.device?.supported_lte_bands]);

  // Build earfcns array from form inputs
  const buildEarfcns = (): number[] => {
    const earfcns: number[] = [];
    const e1 = parseInt(earfcn1, 10);
    if (!isNaN(e1)) earfcns.push(e1);
    const e2 = parseInt(earfcn2, 10);
    if (!isNaN(e2)) earfcns.push(e2);
    return earfcns;
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      const earfcns = buildEarfcns();
      if (earfcns.length === 0) {
        toast.warning("未输入频率", {
          description: "启用前请至少填写一个信道号（EARFCN）。",
        });
        return;
      }

      // Check if any matched band is in supported bands
      const allMatched = [...matchedBands1, ...matchedBands2];
      const anySupported =
        allMatched.length === 0 ||
        allMatched.some((b) => supportedBands.includes(b.band));

      setPendingEarfcns(earfcns);

      if (!anySupported && supportedBands.length > 0) {
        // No matched band is supported — show stern warning
        setShowUnsupportedWarning(true);
      } else {
        // Normal confirmation
        setShowLockDialog(true);
      }
    } else {
      setShowUnlockDialog(true);
    }
  };

  const confirmLock = async () => {
    setShowLockDialog(false);
    setShowUnsupportedWarning(false);
    const success = await onLock(pendingEarfcns);
    if (success) {
      toast.success("已应用 LTE 频率锁");
    } else {
      toast.error("应用 LTE 频率锁失败");
    }
  };

  const confirmUnlock = async () => {
    setShowUnlockDialog(false);
    const success = await onUnlock();
    if (success) {
      toast.success("已清除 LTE 频率锁");
    } else {
      toast.error("清除 LTE 频率锁失败");
    }
  };

  // "Use Current" — copy active PCell EARFCN into slot 1
  const handleUseCurrent = () => {
    const earfcn = modemData?.lte?.earfcn;
    if (earfcn != null) {
      setEarfcn1(String(earfcn));
      toast.info("已从当前连接的基站填充");
    } else {
      toast.warning("无活动 LTE 连接");
    }
  };

  const hasActiveLteCell = modemData?.lte?.earfcn != null;

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>LTE 频率锁定</CardTitle>
          <CardDescription>
            锁定到指定 LTE 频点（EARFCN）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Separator />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Separator />
            <div className="grid gap-4 mt-6">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Error state (fetch failed, no data) ----------------------------------
  if (error && !modemState) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>LTE 频率锁定</CardTitle>
          <CardDescription>
            锁定到指定 LTE 频点（EARFCN）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="alert"
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <AlertCircleIcon className="size-8 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium">无法加载频率锁定状态</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="@container/card"
        aria-disabled={towerLockActive || undefined}
      >
        <CardHeader>
          <CardTitle>LTE 频率锁定</CardTitle>
          <CardDescription>
            锁定到指定 LTE 频点（EARFCN），最多 2 个信道。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {/* Tower lock active warning */}
            {towerLockActive ? (
              <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <TbAlertTriangleFilled className="size-5 mt-0.5 shrink-0" />
                <p className="font-semibold">
                  已启用 LTE 基站锁定，请先关闭后再使用频率锁定。
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 border border-warning/30 text-warning text-sm">
                <TbAlertTriangleFilled className="size-5 mt-0.5 shrink-0" />
                <p className="font-semibold">实验性功能</p>
              </div>
            )}

            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex" aria-label="更多信息">
                      <TbInfoCircleFilled className="size-5 text-info" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      锁定到不支持的频点可能导致模组异常重启。
                      <br />
                      启用基站锁定时不可使用本功能。
                    </p>
                  </TooltipContent>
                </Tooltip>
                <p className="font-semibold text-muted-foreground text-sm">
                  LTE 频率锁定
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isLocking ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : null}
                <Switch
                  id="lte-freq-locking"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isDisabled}
                />
                <Label htmlFor="lte-freq-locking">
                  {isEnabled ? "已启用" : "已关闭"}
                </Label>
              </div>
            </div>
            <Separator />

            <form
              className="grid gap-4 mt-6"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-full">
                <FieldSet>
                  <FieldGroup>
                    {/* EARFCN 1 */}
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="freq-earfcn1">信道（EARFCN）</FieldLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUseCurrent}
                          disabled={isDisabled || !hasActiveLteCell}
                        >
                          使用当前小区
                        </Button>
                      </div>
                      <Input
                        id="freq-earfcn1"
                        type="text"
                        placeholder="输入 EARFCN"
                                                value={earfcn1}
                        onChange={(e) => setEarfcn1(e.target.value)}
                        disabled={isDisabled}
                      />
                      <BandMatchDisplay
                        bands={matchedBands1}
                        hasInput={earfcn1.length > 0}
                        supportedBands={supportedBands}
                        prefix="B"
                        noMatchLabel="此 EARFCN"
                      />
                    </Field>

                    {/* EARFCN 2 */}
                    <Field>
                      <FieldLabel htmlFor="freq-earfcn2">
                        第二信道（可选）
                      </FieldLabel>
                      <Input
                        id="freq-earfcn2"
                        type="text"
                        placeholder="输入第二个 EARFCN"
                                                value={earfcn2}
                        onChange={(e) => setEarfcn2(e.target.value)}
                        disabled={isDisabled}
                      />
                      <BandMatchDisplay
                        bands={matchedBands2}
                        hasInput={earfcn2.length > 0}
                        supportedBands={supportedBands}
                        prefix="B"
                        noMatchLabel="此 EARFCN"
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Normal lock confirmation dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>锁定 LTE 频率？</AlertDialogTitle>
            <AlertDialogDescription>
              将把模组锁定到{" "}
              {pendingEarfcns.length === 1
                ? `EARFCN ${pendingEarfcns[0]}`
                : `EARFCN ${pendingEarfcns.join("、")}`}
              ，仅使用该
              {pendingEarfcns.length === 1 ? "频点" : "频点组合"}
              ，过程中可能短暂断网。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLock}>
              确认锁定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsupported band warning dialog */}
      <AlertDialog
        open={showUnsupportedWarning}
        onOpenChange={setShowUnsupportedWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              不支持的频段警告
            </AlertDialogTitle>
            <AlertDialogDescription>
              您输入的频点对应模组不支持的频段，锁定后可能导致模组异常重启。
              <br />
              <br />
              <strong>解析到的频段：</strong>{" "}
              {[...matchedBands1, ...matchedBands2]
                .map((b) => `B${b.band}`)
                .join("、") || "未知"}
              <br />
              <strong>模组支持的频段：</strong>{" "}
              {supportedBands.map((b) => `B${b}`).join("、")}
              <br />
              <br />
              确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              仍要锁定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlock confirmation dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>解除 LTE 频率锁定？</AlertDialogTitle>
            <AlertDialogDescription>
              将移除 LTE 频率锁定，模组可重新选择任意可用频点，过程中可能短暂断网。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlock}>
              解除锁定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LteFreqLockingComponent;
