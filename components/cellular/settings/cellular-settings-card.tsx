"use client";

import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton, useSaveFlash } from "@/components/ui/save-button";
import { RotateCcwIcon } from "lucide-react";
import type { CellularSettings } from "@/types/cellular-settings";

interface CellularSettingsCardProps {
  settings: CellularSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (changes: Partial<CellularSettings>) => Promise<boolean>;
}

const CellularSettingsCard = ({
  settings,
  isLoading,
  isSaving,
  onSave,
}: CellularSettingsCardProps) => {
  const { saved, markSaved } = useSaveFlash();
  const [simSlot, setSimSlot] = useState<string>("");
  const [cfun, setCfun] = useState<string>("");
  const [modePref, setModePref] = useState<string>("");
  const [nr5gMode, setNr5gMode] = useState<string>("");
  const [roamPref, setRoamPref] = useState<string>("");

  // Sync form state from fetched settings
  useEffect(() => {
    if (settings) {
      setSimSlot(String(settings.sim_slot));
      setCfun(String(settings.cfun));
      setModePref(settings.mode_pref);
      setNr5gMode(String(settings.nr5g_mode));
      setRoamPref(String(settings.roam_pref));
    }
  }, [settings]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const changes: Partial<CellularSettings> = {};

    if (Number(simSlot) !== settings.sim_slot) {
      changes.sim_slot = Number(simSlot);
    }
    if (Number(cfun) !== settings.cfun) {
      changes.cfun = Number(cfun);
    }
    if (modePref !== settings.mode_pref) {
      changes.mode_pref = modePref;
    }
    if (Number(nr5gMode) !== settings.nr5g_mode) {
      changes.nr5g_mode = Number(nr5gMode);
    }
    if (Number(roamPref) !== settings.roam_pref) {
      changes.roam_pref = Number(roamPref);
    }

    if (Object.keys(changes).length === 0) {
      toast.info("没有需要保存的更改");
      return;
    }

    const success = await onSave(changes);
    if (success) {
      markSaved();
      toast.success("模组设置已保存");
    } else {
      toast.error("保存模组设置失败");
    }
  };

  const handleReset = () => {
    if (settings) {
      setSimSlot(String(settings.sim_slot));
      setCfun(String(settings.cfun));
      setModePref(settings.mode_pref);
      setNr5gMode(String(settings.nr5g_mode));
      setRoamPref(String(settings.roam_pref));
    }
  };

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>模组射频设置</CardTitle>
          <CardDescription>
            配置 SIM 卡槽、射频电源、网络类型与漫游偏好。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid @md/card:grid-cols-2 grid-cols-1 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="grid @md/card:grid-cols-2 grid-cols-1 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="grid @md/card:grid-cols-2 grid-cols-1 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-9 w-full" />
              </div>
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
        <CardTitle>模组射频设置</CardTitle>
        <CardDescription>
          配置 SIM 卡槽、射频电源、网络类型与漫游偏好。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="w-full">
            <FieldSet>
              <FieldGroup>
                <div className="grid @md/card:grid-cols-2 grid-cols-1 grid-flow-row gap-4">
                  <Field>
                    <FieldLabel>SIM 卡槽</FieldLabel>
                    <Select
                      value={simSlot || (settings ? String(settings.sim_slot) : "")}
                      onValueChange={setSimSlot}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择 SIM 卡槽" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">SIM 1</SelectItem>
                        <SelectItem value="2">SIM 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>射频电源</FieldLabel>
                    <Select
                      value={cfun || (settings ? String(settings.cfun) : "")}
                      onValueChange={setCfun}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择射频电源模式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">射频关闭（低功耗）</SelectItem>
                        <SelectItem value="1">正常工作</SelectItem>
                        <SelectItem value="4">
                          飞行模式（射频关闭）
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid @md/card:grid-cols-2 grid-cols-1 grid-flow-row gap-4">
                  <Field>
                    <FieldLabel>首选网络类型</FieldLabel>
                    <Select
                      value={modePref || (settings ? settings.mode_pref : "")}
                      onValueChange={setModePref}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择网络类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">自动</SelectItem>
                        <SelectItem value="LTE">仅 LTE</SelectItem>
                        <SelectItem value="NR5G">仅 5G</SelectItem>
                        <SelectItem value="LTE:NR5G">LTE + 5G</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>5G 组网架构</FieldLabel>
                    <Select
                      value={nr5gMode || (settings ? String(settings.nr5g_mode) : "")}
                      onValueChange={setNr5gMode}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择 5G 模式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">自动（SA + NSA）</SelectItem>
                        <SelectItem value="1">仅 NSA (5G via LTE)</SelectItem>
                        <SelectItem value="2">仅 SA (Standalone)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid @md/card:grid-cols-2 grid-cols-1 grid-flow-row gap-4">
                  <Field>
                    <FieldLabel>漫游偏好</FieldLabel>
                    <Select
                      value={roamPref || (settings ? String(settings.roam_pref) : "")}
                      onValueChange={setRoamPref}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择漫游偏好" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="255">任意网络</SelectItem>
                        <SelectItem value="1">仅归属网络</SelectItem>
                        <SelectItem value="3">合作伙伴网络</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
          </div>
          <div className="flex items-center gap-x-2">
            <SaveButton type="submit" isSaving={isSaving} saved={saved} />
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
      </CardContent>
    </Card>
  );
};

export default CellularSettingsCard;
