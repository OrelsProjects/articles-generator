import { setUsages } from "@/lib/features/settings/settingsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import axios from "axios";

export const useSettings = () => {
  const dispatch = useAppDispatch();

  const init = async () => {
    try {
      const response = await axios.get("/api/user/settings");
      const { usages } = response.data;
      dispatch(setUsages(usages));
    } catch (error) {}
  };

  return { init };
};
