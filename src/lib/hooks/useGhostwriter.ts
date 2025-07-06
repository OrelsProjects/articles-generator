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
} from "@/lib/features/ghostwriter/ghostwriterSlice";
import {
  MyGhostwriter,
  GhostwriterProfile,
  GhostwriterAccess,
  GhostwriterClient,
  CreateGhostwriterProfileData,
  AddGhostwriterAccessData,
  UpdateGhostwriterAccessData,
  StopGhostwritingData,
} from "@/types/ghost-writer";

export const useGhostwriter = () => {
  const dispatch = useAppDispatch();
  const ghostwriterState = useAppSelector(selectGhostwriter);

  // Fetch user's ghostwriter profile
  const fetchProfile = useCallback(async () => {
    try {
      dispatch(setProfileLoading(true));
      const response = await axiosInstance.get<GhostwriterProfile>("/api/ghost-writer/profile");
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
  const createOrUpdateProfile = useCallback(async (data: CreateGhostwriterProfileData) => {
    try {
      dispatch(setProfileLoading(true));
      const response = await axiosInstance.post<GhostwriterProfile>("/api/ghost-writer", data);
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
  }, [dispatch]);

  // Fetch ghostwriters with access to user's account
  const fetchAccessList = useCallback(async () => {
    try {
      dispatch(setAccessLoading(true));
      const response = await axiosInstance.get<MyGhostwriter[]>("/api/ghost-writer");
      dispatch(setAccessList(response.data));
    } catch (error: any) {
      Logger.error("Error fetching ghostwriter access list", { error });
      dispatch(setAccessError(error.message || "Failed to fetch access list"));
    } finally {
      dispatch(setAccessLoading(false));
    }
  }, [dispatch]);

  // Fetch clients the user is ghostwriting for
  const fetchClientList = useCallback(async () => {
    try {
      dispatch(setClientLoading(true));
      const response = await axiosInstance.get<GhostwriterClient[]>("/api/ghost-writer/clients");
      dispatch(setClientList(response.data));
    } catch (error: any) {
      Logger.error("Error fetching ghostwriter client list", { error });
      dispatch(setClientError(error.message || "Failed to fetch client list"));
    } finally {
      dispatch(setClientLoading(false));
    }
  }, [dispatch]);

  // Add ghostwriter access
  const addGhostwriterAccess = useCallback(async (data: AddGhostwriterAccessData) => {
    try {
      dispatch(setAccessLoading(true));
      const response = await axiosInstance.post<GhostwriterAccess>("/api/ghost-writer/access", data);
      
      // Convert to MyGhostwriter format
      const ghostwriter: MyGhostwriter = {
        id: response.data.ghostWriter.id,
        name: response.data.ghostWriter.name,
        image: response.data.ghostWriter.image,
        token: response.data.ghostWriter.token,
        accessLevel: response.data.accessLevel,
        isActive: response.data.isActive,
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
  }, [dispatch]);

  // Update ghostwriter access
  const updateGhostwriterAccess = useCallback(async (data: UpdateGhostwriterAccessData) => {
    try {
      dispatch(setAccessLoading(true));
      const response = await axiosInstance.patch<GhostwriterAccess>("/api/ghost-writer/access", data);
      
      // Convert to MyGhostwriter format
      const ghostwriter: MyGhostwriter = {
        id: response.data.ghostWriter.id,
        name: response.data.ghostWriter.name,
        image: response.data.ghostWriter.image,
        token: response.data.ghostWriter.token,
        accessLevel: response.data.accessLevel,
        isActive: response.data.isActive,
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
  }, [dispatch]);

  // Revoke ghostwriter access
  const revokeGhostwriterAccess = useCallback(async (ghostwriterId: string) => {
    try {
      dispatch(setAccessLoading(true));
      await axiosInstance.delete(`/api/ghost-writer/access?ghostwriterId=${ghostwriterId}`);
      dispatch(removeAccess(ghostwriterId));
    } catch (error: any) {
      Logger.error("Error revoking ghostwriter access", { error });
      dispatch(setAccessError(error.message || "Failed to revoke access"));
      throw error;
    } finally {
      dispatch(setAccessLoading(false));
    }
  }, [dispatch]);

  // Stop ghostwriting for a client
  const stopGhostwriting = useCallback(async (data: StopGhostwritingData) => {
    try {
      dispatch(setClientLoading(true));
      const response = await axiosInstance.patch<GhostwriterClient>("/api/ghost-writer/clients", data);
      dispatch(updateClient(response.data));
      return response.data;
    } catch (error: any) {
      Logger.error("Error stopping ghostwriting", { error });
      dispatch(setClientError(error.message || "Failed to stop ghostwriting"));
      throw error;
    } finally {
      dispatch(setClientLoading(false));
    }
  }, [dispatch]);

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

  const openEditAccessDialog = useCallback((ghostwriter: MyGhostwriter) => {
    dispatch(setEditingAccess(ghostwriter));
  }, [dispatch]);

  const closeEditAccessDialog = useCallback(() => {
    dispatch(setShowEditAccessDialog(false));
  }, [dispatch]);

  return {
    // State
    ...ghostwriterState,
    
    // Actions
    fetchProfile,
    createOrUpdateProfile,
    fetchAccessList,
    fetchClientList,
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
  };
}; 