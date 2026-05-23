import { create } from "zustand";

type Language = "en" | "hi";
type SidebarState = "expanded" | "collapsed";

interface UiState {
  language: Language;
  sidebar: SidebarState;
  isMobile: boolean;
  currentPageTitle: string;
  setLanguage: (lang: Language) => void;
  toggleSidebar: () => void;
  setSidebar: (state: SidebarState) => void;
  setMobile: (mobile: boolean) => void;
  setPageTitle: (title: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  language: "hi",
  sidebar: "expanded",
  isMobile: false,
  currentPageTitle: "",

  setLanguage: (language: Language) => set({ language }),
  toggleSidebar: () => set((s) => ({ sidebar: s.sidebar === "expanded" ? "collapsed" : "expanded" })),
  setSidebar: (sidebar: SidebarState) => set({ sidebar }),
  setMobile: (isMobile: boolean) => set({ isMobile, sidebar: isMobile ? "collapsed" : "expanded" }),
  setPageTitle: (currentPageTitle: string) => set({ currentPageTitle }),
}));
