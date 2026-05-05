"use client";

import React, { useState, useCallback } from "react";

import CustomProfileFormComponent from "@/components/cellular/custom-profiles/custom-profile-form";
import CustomProfileViewComponent from "@/components/cellular/custom-profiles/custom-profile-view";
import { ApplyProgressDialog } from "@/components/cellular/custom-profiles/apply-progress-dialog";
import { useSimProfiles, type ProfileFormData } from "@/hooks/use-sim-profiles";
import { useProfileApply } from "@/hooks/use-profile-apply";
import { useCurrentSettings } from "@/hooks/use-current-settings";
import { useModemStatus } from "@/hooks/use-modem-status";
import type { SimProfile } from "@/types/sim-profile";
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

// =============================================================================
// CustomProfileComponent — Page Layout & State Coordinator
// =============================================================================
// Owns all three hooks:
//   - useSimProfiles: CRUD operations
//   - useProfileApply: async apply lifecycle
//   - useCurrentSettings: modem query for form pre-fill
//
// Coordinates between form (left card) and view (right card).
// =============================================================================

const CustomProfileComponent = () => {
  const {
    profiles,
    activeProfileId,
    isLoading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    deactivateProfile,
    getProfile,
    refresh,
  } = useSimProfiles();

  const {
    applyState,
    applyProfile,
    reset: resetApply,
    error: applyError,
  } = useProfileApply();

  const { settings: currentSettings, refresh: refreshCurrentSettings } =
    useCurrentSettings(false);

  const { data: modemStatus } = useModemStatus();
  const currentIccid = modemStatus?.device?.iccid ?? null;

  const [editingProfile, setEditingProfile] = useState<SimProfile | null>(null);

  // Apply confirmation state
  const [activateTarget, setActivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showApplyProgress, setShowApplyProgress] = useState(false);

  // Deactivate confirmation state
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // ---------------------------------------------------------------------------
  // Handle Edit: fetch full profile, switch form to edit mode
  // ---------------------------------------------------------------------------
  const handleEdit = useCallback(
    async (id: string) => {
      const profile = await getProfile(id);
      if (profile) {
        setEditingProfile(profile);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [getProfile]
  );

  // ---------------------------------------------------------------------------
  // Handle 保存: create or update depending on edit state
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(
    async (data: ProfileFormData): Promise<string | null> => {
      if (editingProfile) {
        const success = await updateProfile(editingProfile.id, data);
        if (success) {
          setEditingProfile(null);
          return editingProfile.id;
        }
        return null;
      } else {
        return await createProfile(data);
      }
    },
    [editingProfile, createProfile, updateProfile]
  );

  // ---------------------------------------------------------------------------
  // Handle 取消 Edit
  // ---------------------------------------------------------------------------
  const handleCancelEdit = useCallback(() => {
    setEditingProfile(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Handle Delete
  // ---------------------------------------------------------------------------
  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      const success = await deleteProfile(id);
      if (success && editingProfile?.id === id) {
        setEditingProfile(null);
      }
      return success;
    },
    [deleteProfile, editingProfile]
  );

  // ---------------------------------------------------------------------------
  // Handle Activate: show confirmation → apply
  // ---------------------------------------------------------------------------
  const handleActivateRequest = useCallback(
    (id: string) => {
      const profile = profiles.find((p) => p.id === id);
      if (profile) {
        setActivateTarget({ id: profile.id, name: profile.name });
      }
    },
    [profiles]
  );

  const handleActivateConfirm = useCallback(async () => {
    if (!activateTarget) return;
    setActivateTarget(null);
    setShowApplyProgress(true);
    await applyProfile(activateTarget.id);
  }, [activateTarget, applyProfile]);

  const handleApplyProgressClose = useCallback(() => {
    setShowApplyProgress(false);
    resetApply();
    // Refresh profile list to pick up new active profile
    refresh();
  }, [resetApply, refresh]);

  // ---------------------------------------------------------------------------
  // Handle Deactivate: show confirmation → clear active marker
  // ---------------------------------------------------------------------------
  const handleDeactivateRequest = useCallback(() => {
    setShowDeactivateConfirm(true);
  }, []);

  const handleDeactivateConfirm = useCallback(async () => {
    setIsDeactivating(true);
    await deactivateProfile();
    setIsDeactivating(false);
    setShowDeactivateConfirm(false);
  }, [deactivateProfile]);

  // ---------------------------------------------------------------------------
  // Handle "Load Current Settings" from the form
  // ---------------------------------------------------------------------------
  const handleLoadCurrentSettings = useCallback(() => {
    refreshCurrentSettings();
  }, [refreshCurrentSettings]);

  return (
    <div className="@container/main mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">自定义 SIM 档案</h1>
        <p className="text-muted-foreground">
          将 APN、IMEI、TTL/HL 等设置打包为一键可用的 SIM 档案。
        </p>
      </div>
      <div className="grid grid-cols-1 @3xl/main:grid-cols-2 grid-flow-row gap-4">
        <CustomProfileFormComponent
          editingProfile={editingProfile}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          currentSettings={currentSettings}
          onLoadCurrentSettings={handleLoadCurrentSettings}
        />
        <CustomProfileViewComponent
          profiles={profiles}
          activeProfileId={activeProfileId}
          isLoading={isLoading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onActivate={handleActivateRequest}
          onDeactivate={handleDeactivateRequest}
          onRefresh={refresh}
          currentIccid={currentIccid}
        />
      </div>

      {/* Activate Confirmation Dialog */}
      <AlertDialog
        open={!!activateTarget}
        onOpenChange={(open) => !open && setActivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>激活档案</AlertDialogTitle>
            <AlertDialogDescription>
              是否将「{activateTarget?.name}」应用到模组？将按档案中的配置更新
              APN、TTL/HL 与 IMEI；已与当前一致的项将跳过。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivateConfirm}>
              激活
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog
        open={showDeactivateConfirm}
        onOpenChange={(open) => !open && !isDeactivating && setShowDeactivateConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>取消激活档案</AlertDialogTitle>
            <AlertDialogDescription>
              是否清除当前激活档案标记？模组现有的 APN、IMEI、TTL
              等配置不会被恢复为默认值，仅移除「已激活」标识。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              disabled={isDeactivating}
            >
              {isDeactivating ? "正在取消激活…" : "取消激活"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply Progress Dialog */}
      <ApplyProgressDialog
        open={showApplyProgress}
        onClose={handleApplyProgressClose}
        applyState={applyState}
        error={applyError}
      />
    </div>
  );
};

export default CustomProfileComponent;
