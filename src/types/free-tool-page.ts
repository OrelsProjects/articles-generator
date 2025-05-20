import { Byline } from "./article";

export interface FreeToolPage<T> {
  handleBylineSelect: (byline: Byline, forceAnalyze?: boolean) => Promise<void>;
  isLoading: boolean;
  hasData: boolean;
  authorName: string;
  authorImage: string;
  isInputDisabled: boolean;
  data: T | null;
  showLoginDialog: boolean;
  handleCloseLoginDialog: (open: boolean) => void;
  getLoginRedirect: () => string;
  selectedByline: Byline | null;
  [key: string]: any;
}
