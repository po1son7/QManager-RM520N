"use client";

import React, { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TbInfoCircleFilled } from "react-icons/tb";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

import type {
  TowerLockConfig,
  TowerModemState,
  NrSaLockCell,
} from "@/types/tower-locking";
import type { ModemStatus, NetworkType } from "@/types/modem-status";
import { SCS_OPTIONS } from "@/types/tower-locking";
import {
  nrCarriersFromQcainfo,
  defaultScsForBand,
  compositeValue,
  parseCompositeValue,
  type CarrierOption,
} from "./simple-mode-utils";
import { CarrierLabel } from "./carrier-label";

interface NRSALockingProps {
  config: TowerLockConfig | null;
  modemState: TowerModemState | null;
  modemData: ModemStatus | null;
  networkType: NetworkType | string;
  isLoading: boolean;
  isLocking: boolean;
  isWatcherRunning: boolean;
  onLock: (cell: NrSaLockCell) => Promise<boolean>;
  onUnlock: () => Promise<boolean>;
}

const STORAGE_KEY_NR_SIMPLE_MODE = "qmanager_tower_nr_simple_mode";

type ScsSource = "manual" | "band_default" | "servingcell";

const NRSALockingComponent = ({
  config,
  modemState,
  modemData,
  networkType,
  isLoading,
  isLocking,
  isWatcherRunning,
  onLock,
  onUnlock,
}: NRSALockingProps) => {
  // Local form state
  const [arfcn, setArfcn] = useState("");
  const [pci, setPci] = useState("");
  const [band, setBand] = useState("");
  const [scs, setScs] = useState("");
  const [prevNrSa, setPrevNrSa] = useState(config?.nr_sa);

  // Simple Mode state (persisted to localStorage)
  const [simpleMode, setSimpleMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY_NR_SIMPLE_MODE) === "true";
  });

  const [scsSource, setScsSource] = useState<ScsSource>("manual");

  const handleSimpleModeToggle = (on: boolean) => {
    setSimpleMode(on);
    setScsSource("manual");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY_NR_SIMPLE_MODE, String(on));
    }
  };

  // Confirmation dialog state
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [pendingCell, setPendingCell] = useState<NrSaLockCell | null>(null);

  // Sync form from config when data loads (render-time update avoids effect cascade)
  if (config?.nr_sa !== prevNrSa) {
    setPrevNrSa(config?.nr_sa);
    if (config?.nr_sa) {
      if (config.nr_sa.arfcn !== null) setArfcn(String(config.nr_sa.arfcn));
      if (config.nr_sa.pci !== null) setPci(String(config.nr_sa.pci));
      if (config.nr_sa.band !== null) setBand(String(config.nr_sa.band));
      if (config.nr_sa.scs !== null) setScs(String(config.nr_sa.scs));
    }
  }

  // Derive carrier options for Simple Mode
  const carrierOptions = useMemo<CarrierOption[]>(
    () => (modemData ? nrCarriersFromQcainfo(modemData) : []),
    [modemData],
  );
  const hasOptions = carrierOptions.length > 0;

  const handleCarrierPick = (value: string) => {
    const parsed = parseCompositeValue(value);
    if (!parsed) return;
    const opt = carrierOptions.find(
      (o) => o.earfcn === parsed.earfcn && o.pci === parsed.pci,
    );
    if (!opt) return;

    setArfcn(String(opt.earfcn));
    setPci(String(opt.pci));
    if (opt.bandNumber != null) setBand(String(opt.bandNumber));

    // SCS resolution: trust live serving cell when picking the PCC.
    const liveScs = modemData?.nr?.scs ?? null;
    const liveArfcn = modemData?.nr?.arfcn ?? null;
    const livePci = modemData?.nr?.pci ?? null;
    const isLiveServingCell =
      liveArfcn === opt.earfcn && livePci === opt.pci && liveScs !== null;

    if (isLiveServingCell) {
      setScs(String(liveScs));
      setScsSource("servingcell");
    } else {
      const fallback = defaultScsForBand(opt.bandNumber);
      setScs(fallback !== null ? String(fallback) : "");
      setScsSource("band_default");
    }
  };

  const currentArfcnComposite = useMemo(() => {
    const aNum = parseInt(arfcn, 10);
    const pNum = parseInt(pci, 10);
    if (Number.isNaN(aNum) || Number.isNaN(pNum)) return "";
    return compositeValue(aNum, pNum);
  }, [arfcn, pci]);

  const arfcnInList = useMemo(
    () =>
      carrierOptions.find(
        (o) => compositeValue(o.earfcn, o.pci) === currentArfcnComposite,
      ),
    [carrierOptions, currentArfcnComposite],
  );

  // Derive enabled state from modem state or config
  const isEnabled = modemState?.nr_locked ?? config?.nr_sa?.enabled ?? false;

  // NSA mode gating — NR-SA locking not available in NSA or LTE-only mode
  const isNsaMode = networkType === "5G-NSA";
  const isLteOnly = networkType === "LTE";
  const isCardDisabled = isNsaMode || isLteOnly;
  const isDisabled = isCardDisabled || isLocking;

  const handleToggle = (checked: boolean) => {
    if (checked && isWatcherRunning) {
      toast.warning("正在进行故障转移检查", {
        description: "正在进行信号质量检测，请稍候。",
      });
      return;
    }
    if (checked) {
      const parsedArfcn = parseInt(arfcn, 10);
      const parsedPci = parseInt(pci, 10);
      const parsedBand = parseInt(band, 10);
      const parsedScs = parseInt(scs, 10);

      if (
        Number.isNaN(parsedArfcn) ||
        Number.isNaN(parsedPci) ||
        Number.isNaN(parsedBand) ||
        Number.isNaN(parsedScs)
      ) {
        toast.warning("字段不完整", {
          description: "锁定前请填写所有必填的小区字段。",
        });
        return;
      }

      const cell: NrSaLockCell = {
        arfcn: parsedArfcn,
        pci: parsedPci,
        band: parsedBand,
        scs: parsedScs,
      };
      setPendingCell(cell);
      setShowLockDialog(true);
    } else {
      setShowUnlockDialog(true);
    }
  };

  const confirmLock = async () => {
    setShowLockDialog(false);
    if (pendingCell) {
      const success = await onLock(pendingCell);
      if (success) {
        toast.success("已应用 NR-SA 基站锁");
      } else {
        toast.error("锁定基站失败，请检查模组连接");
      }
    }
  };

  const confirmUnlock = async () => {
    setShowUnlockDialog(false);
    const success = await onUnlock();
    if (success) {
      toast.success("已清除 NR-SA 基站锁");
    } else {
      toast.error("解除基站锁定失败");
    }
  };

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>NR-SA 基站锁定</CardTitle>
          <CardDescription>
            通过信道（ARFCN）、小区 ID（PCI）、NR Band 与子载波间距（SCS）锁定指定 5G SA 基站。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
            <Separator />
            <div className="grid gap-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`@container/card ${isCardDisabled ? "opacity-60" : ""}`}>
        <CardHeader>
          <CardTitle>NR-SA 基站锁定</CardTitle>
          <CardDescription>
            通过信道（ARFCN）、小区 ID（PCI）、NR Band 与子载波间距（SCS）锁定指定 5G SA 基站。
            {isNsaMode && " NR5G-NSA 模式下不可用。"}
            {isLteOnly && " 当前无 NR 连接。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Separator />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <TbInfoCircleFilled className="size-4 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {hasOptions
                        ? "从当前可见 5G 载波中选择（QCAINFO 中的 PCC + SCC）。频段与 SCS 将自动填充。"
                        : "当前 QCAINFO 中无可见 5G 载波。请关闭简易模式后手动填写。"}
                    </TooltipContent>
                  </Tooltip>
                  <p className="font-medium text-muted-foreground text-sm">
                    简易模式
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="nr-sa-simple-mode"
                    aria-label="切换 NR 简易模式"
                    checked={simpleMode && hasOptions}
                    onCheckedChange={handleSimpleModeToggle}
                    disabled={!hasOptions || isDisabled}
                  />
                  <Label htmlFor="nr-sa-simple-mode">
                    {simpleMode && hasOptions ? "开" : "关"}
                  </Label>
                </div>
              </div>
              {!hasOptions && (
                <p className="text-xs text-muted-foreground">
                  当前 QCAINFO 中看不到 5G 载波。
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TbInfoCircleFilled className="size-5 text-info" />
                <p className="font-semibold text-muted-foreground text-sm">
                  NR-SA 基站锁定
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isLocking ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : null}
                <Switch
                  id="nr-sa-tower-locking"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isDisabled}
                />
                <Label htmlFor="nr-sa-tower-locking">
                  {isEnabled ? "已启用" : "已关闭"}
                </Label>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 mt-6">
              <div className="w-full">
                <FieldSet>
                  <FieldGroup>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="nrarfcn1">信道（ARFCN）</FieldLabel>
                        {simpleMode && hasOptions ? (
                          <Select
                            value={arfcnInList ? currentArfcnComposite : ""}
                            onValueChange={handleCarrierPick}
                            disabled={isDisabled}
                          >
                            <SelectTrigger id="nrarfcn1" className="w-full">
                              {arfcnInList ? (
                                <SelectValue />
                              ) : arfcn && pci ? (
                                <span
                                  className="min-w-0 italic text-muted-foreground line-clamp-1"
                                  title={`自定义: ARFCN ${arfcn}, PCI ${pci}`}
                                >
                                  {`自定义: ARFCN ${arfcn}, PCI ${pci}`}
                                </span>
                              ) : (
                                <SelectValue placeholder="选择 5G 运营商" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {carrierOptions.map((opt) => {
                                const value = compositeValue(opt.earfcn, opt.pci);
                                return (
                                  <SelectItem key={value} value={value}>
                                    <CarrierLabel opt={opt} />
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="nrarfcn1"
                            type="text"
                            placeholder="输入 ARFCN"
                            value={arfcn}
                            onChange={(e) => setArfcn(e.target.value)}
                            disabled={isDisabled}
                          />
                        )}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="nrpci">小区 ID（PCI）</FieldLabel>
                        <Input
                          id="nrpci"
                          type="text"
                          placeholder="输入 PCI"
                          value={pci}
                          onChange={(e) => setPci(e.target.value)}
                          disabled={isDisabled}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="nr-band">NR Band</FieldLabel>
                        <Input
                          id="nr-band"
                          type="text"
                          placeholder="输入 NR Band"
                          value={band}
                          onChange={(e) => setBand(e.target.value)}
                          disabled={isDisabled}
                        />
                      </Field>
                      <Field>
                        <div className="flex items-center justify-between gap-2">
                          <FieldLabel htmlFor="scs">子载波间距（SCS）</FieldLabel>
                          {simpleMode && scsSource === "band_default" && band && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <AlertTriangle className="size-3.5 text-warning" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                {`已按 N${band} 默认填入 SCS；若锁定失败请与基站配置核对。`}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <Select
                          value={scs}
                          onValueChange={(v) => {
                            setScs(v);
                            setScsSource("manual");
                          }}
                          disabled={isDisabled}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择 SCS" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCS_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={String(opt.value)}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </FieldGroup>
                </FieldSet>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lock confirmation dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>锁定 NR-SA 基站？</AlertDialogTitle>
            <AlertDialogDescription>
              将把模组锁定到 NR ARFCN {pendingCell?.arfcn}，PCI{" "}
              {pendingCell?.pci}（频段 {pendingCell?.band}）。仅连接该基站，切换期间可能短暂断网。
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

      {/* Unlock confirmation dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>解除 NR-SA 基站锁定？</AlertDialogTitle>
            <AlertDialogDescription>
              将移除 NR-SA 基站锁定，模组可自由选择可用基站，切换期间可能短暂断网。
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

export default NRSALockingComponent;
