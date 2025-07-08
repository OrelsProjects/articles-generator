import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import axiosInstance from "@/lib/axios-instance";
import { Logger } from "@/logger";
import {
  selectGhostwriter,
  setProfile,
  setProfileLoading,
  setProfileError,
  setAccessList,
  setAccessLoading,
  setAccessError,
  setClientList,
  setClientLoading,
  setClientError,
  addAccess,
  updateAccess,
  removeAccess,
  updateClient,
  setShowCreateProfileDialog,
  setShowAddAccessDialog,
  setShowEditAccessDialog,
  setEditingAccess,
  setSelectedClientId,
  setClientNotes,
  setClientNotesLoading,
} from "@/lib/features/ghostwriter/ghostwriterSlice";
import {
  GhostwriterProfile,
  GhostwriterAccess,
  GhostwriterClient,
  CreateGhostwriterProfileData,
  AddGhostwriterAccessData,
  UpdateGhostwriterAccessData,
  StopGhostwritingData,
} from "@/types/ghost-writer";
import { NoteDraft } from "@/types/note";

export const useGhostwriter = () => {
  const dispatch = useAppDispatch();
  const ghostwriterState = useAppSelector(selectGhostwriter);

  // Fetch user's ghostwriter profile
  const fetchProfile = useCallback(async () => {
    if (ghostwriterState.profile) return;
    if (ghostwriterState.profileLoading) return;
    try {
      dispatch(setProfileLoading(true));
      const response = await axiosInstance.get<GhostwriterProfile>(
        "/api/ghost-writer/profile",
      );
      dispatch(setProfile(response.data));
    } catch (error: any) {
      if (error.response?.status === 404) {
        // User doesn't have a profile yet
        dispatch(setProfile(null));
      } else {
        Logger.error("Error fetching ghostwriter profile", { error });
        dispatch(setProfileError(error.message || "Failed to fetch profile"));
      }
    } finally {
      dispatch(setProfileLoading(false));
    }
  }, [dispatch]);

  // Create or update ghostwriter profile
  const createOrUpdateProfile = useCallback(
    async (data: CreateGhostwriterProfileData) => {
      if (ghostwriterState.profile) return;
      if (ghostwriterState.profileLoading) return;
      try {
        dispatch(setProfileLoading(true));
        const response = await axiosInstance.post<GhostwriterProfile>(
          "/api/ghost-writer",
          data,
        );
        dispatch(setProfile(response.data));
        dispatch(setShowCreateProfileDialog(false));
        return response.data;
      } catch (error: any) {
        Logger.error("Error creating/updating ghostwriter profile", { error });
        dispatch(setProfileError(error.message || "Failed to save profile"));
        throw error;
      } finally {
        dispatch(setProfileLoading(false));
      }
    },
    [dispatch],
  );

  // Fetch ghostwriters with access to user's account
  const fetchAccessList = useCallback(async () => {
    if (ghostwriterState.accessList && ghostwriterState.accessList.length > 0) {
      return;
    }
    if (ghostwriterState.accessLoading) {
      return;
    }
    try {
      dispatch(setAccessLoading(true));
      const response = await axiosInstance.get<GhostwriterAccess[]>(
        "/api/ghost-writer/access",
      );
      dispatch(setAccessList(response.data));
    } catch (error: any) {
      Logger.error("Error fetching ghostwriter access list", { error });
      dispatch(setAccessError(error.message || "Failed to fetch access list"));
    } finally {
      dispatch(setAccessLoading(false));
    }
  }, [dispatch]);

  const fetchClientNotes = useCallback(
    async (clientId: string) => {
      if (
        ghostwriterState.clientNotes[clientId] &&
        ghostwriterState.clientNotes[clientId].length > 0
      ) {
        return;
      }
      if (ghostwriterState.clientNotesLoading) {
        return;
      }
      try {
        dispatch(setClientNotesLoading(true));
        const response = await axiosInstance.get<NoteDraft[]>(
          `/api/ghost-writer/client/notes`,
          {
            params: {
              clientId,
            },
          },
        );
        dispatch(
          setClientNotes({
            clientId,
            notes: response.data,
          }),
        );
      } catch (error: any) {
        Logger.error("Error fetching ghostwriter client notes", { error });
      } finally {
        dispatch(setClientNotesLoading(false));
      }
    },
    [dispatch],
  );

  // Fetch clients the user is ghostwriting for
  const fetchClientList = useCallback(async () => {
    try {
      dispatch(setClientLoading(true));
      const response = await axiosInstance.get<GhostwriterClient[]>(
        "/api/ghost-writer/clients",
      );
      dispatch(setClientList(response.data));
      if (!ghostwriterState.selectedClientId && response.data.length > 0) {
        const activeList = response.data.filter(client => client.isActive);
        if (activeList.length > 0) {
          dispatch(setSelectedClientId(activeList[0].accountUserId));
        }
      }
    } catch (error: any) {
      Logger.error("Error fetching ghostwriter client list", { error });
      dispatch(setClientError(error.message || "Failed to fetch client list"));
    } finally {
      dispatch(setClientLoading(false));
    }
  }, [dispatch]);

  // Add ghostwriter access
  const addGhostwriterAccess = useCallback(
    async (data: AddGhostwriterAccessData) => {
      try {
        dispatch(setAccessError(null));
        dispatch(setAccessLoading(true));
        const response = await axiosInstance.post<GhostwriterAccess>(
          "/api/ghost-writer/access",
          data,
        );

        const ghostwriter: GhostwriterAccess = {
          id: response.data.id,
          ghostwriter: response.data.ghostwriter,
          accessLevel: response.data.accessLevel,
          isActive: response.data.isActive,
          accountUserId: response.data.accountUserId,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };

        dispatch(addAccess(ghostwriter));
        dispatch(setShowAddAccessDialog(false));
        return response.data;
      } catch (error: any) {
        Logger.error("Error adding ghostwriter access", { error });
        dispatch(setAccessError(error.message || "Failed to add access"));
        throw error;
      } finally {
        dispatch(setAccessLoading(false));
      }
    },
    [dispatch],
  );

  // Update ghostwriter access
  const updateGhostwriterAccess = useCallback(
    async (data: UpdateGhostwriterAccessData) => {
      try {
        dispatch(setAccessError(null));
        dispatch(setAccessLoading(true));
        const response = await axiosInstance.patch<GhostwriterAccess>(
          "/api/ghost-writer/access",
          data,
        );

        const ghostwriter: GhostwriterAccess = {
          id: response.data.id,
          ghostwriter: response.data.ghostwriter,
          accessLevel: response.data.accessLevel,
          isActive: response.data.isActive,
          accountUserId: response.data.accountUserId,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };

        dispatch(updateAccess(ghostwriter));
        dispatch(setShowEditAccessDialog(false));
        return response.data;
      } catch (error: any) {
        Logger.error("Error updating ghostwriter access", { error });
        dispatch(setAccessError(error.message || "Failed to update access"));
        throw error;
      } finally {
        dispatch(setAccessLoading(false));
      }
    },
    [dispatch],
  );

  // Revoke ghostwriter access
  const revokeGhostwriterAccess = useCallback(
    async (accessId: string) => {
      try {
        dispatch(setAccessError(null));
        dispatch(setAccessLoading(true));
        await axiosInstance.delete(
          `/api/ghost-writer/access?accessId=${accessId}`,
        );
        debugger;
        dispatch(removeAccess(accessId));
      } catch (error: any) {
        Logger.error("Error revoking ghostwriter access", { error });
        dispatch(setAccessError(error.message || "Failed to revoke access"));
        throw error;
      } finally {
        dispatch(setAccessLoading(false));
      }
    },
    [dispatch],
  );

  // Stop ghostwriting for a client
  const stopGhostwriting = useCallback(
    async (data: StopGhostwritingData) => {
      try {
        dispatch(setClientError(null));
        dispatch(setClientLoading(true));
        const response = await axiosInstance.patch<GhostwriterClient>(
          "/api/ghost-writer/clients",
          data,
        );
        dispatch(updateClient(response.data));
        return response.data;
      } catch (error: any) {
        Logger.error("Error stopping ghostwriting", { error });
        dispatch(
          setClientError(error.message || "Failed to stop ghostwriting"),
        );
        throw error;
      } finally {
        dispatch(setClientLoading(false));
      }
    },
    [dispatch],
  );

  // UI actions
  const openCreateProfileDialog = useCallback(() => {
    dispatch(setShowCreateProfileDialog(true));
  }, [dispatch]);

  const closeCreateProfileDialog = useCallback(() => {
    dispatch(setShowCreateProfileDialog(false));
  }, [dispatch]);

  const openAddAccessDialog = useCallback(() => {
    dispatch(setShowAddAccessDialog(true));
  }, [dispatch]);

  const closeAddAccessDialog = useCallback(() => {
    dispatch(setShowAddAccessDialog(false));
  }, [dispatch]);

  const openEditAccessDialog = useCallback(
    (ghostwriter: GhostwriterAccess) => {
      dispatch(setEditingAccess(ghostwriter));
    },
    [dispatch],
  );

  const closeEditAccessDialog = useCallback(() => {
    dispatch(setShowEditAccessDialog(false));
  }, [dispatch]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchAccessList(), fetchClientList()]);
  }, [fetchProfile, fetchAccessList, fetchClientList]);

  return {
    // State
    ...ghostwriterState,

    // Actions
    fetchProfile,
    createOrUpdateProfile,
    fetchAccessList,
    fetchClientList,
    fetchClientNotes,
    addGhostwriterAccess,
    updateGhostwriterAccess,
    revokeGhostwriterAccess,
    stopGhostwriting,

    // UI Actions
    openCreateProfileDialog,
    closeCreateProfileDialog,
    openAddAccessDialog,
    closeAddAccessDialog,
    openEditAccessDialog,
    closeEditAccessDialog,

    // Fetch all
    fetchAll,
  };
};
