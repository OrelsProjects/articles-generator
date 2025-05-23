import { useCallback, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { AutoDM } from "@/types/auto-dm";
import {
  selectAutoDM,
  setAutoDMs as setAutoDMsAction,
  addAutoDM as addAutoDMAction,
  updateAutoDM as updateAutoDMAction,
  deleteAutoDM as deleteAutoDMAction,
  setAutoDMs,
} from "@/lib/features/auto-dm/auto-dm-slice";
import axiosInstance from "@/lib/axios-instance";

export function useAutoDM() {
  const { autoDMs } = useAppSelector(selectAutoDM);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(loading);
  const dispatch = useAppDispatch();

  const createAutoDM = useCallback(
    async (autoDM: Pick<AutoDM, "noteId" | "message">) => {
      if (loadingRef.current) return;
      try {
        loadingRef.current = true;
        setLoading(true);
        const autoDMResponse = await axiosInstance.post<AutoDM>(
          "/api/v1/auto-dm",
          {
            noteId: autoDM.noteId,
            message: autoDM.message,
          },
        );
        const newAutoDM = autoDMResponse.data;
        dispatch(addAutoDMAction(newAutoDM));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [dispatch],
  );

  const updateAutoDM = useCallback(
    async (autoDM: AutoDM) => {
      if (loadingRef.current) return;
      try {
        loadingRef.current = true;
        setLoading(true);
        const autoDMResponse = await axiosInstance.put<AutoDM>(
          `/api/v1/auto-dm/${autoDM.id}`,
          {
            message: autoDM.message,
          },
        );
        const updatedAutoDM = autoDMResponse.data;
        dispatch(updateAutoDMAction(updatedAutoDM));
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [dispatch],
  );

  const deleteAutoDM = useCallback(
    async (id: string) => {
      if (loadingRef.current) return;
      try {
        loadingRef.current = true;
        setLoading(true);
        await axiosInstance.delete(`/api/v1/auto-dm/${id}`);
        dispatch(deleteAutoDMAction(id));
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [dispatch],
  );

  return { autoDMs, createAutoDM, updateAutoDM, deleteAutoDM, loading };
}
