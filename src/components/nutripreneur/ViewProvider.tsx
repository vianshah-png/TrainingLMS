"use client";

import { createContext, useContext, useState } from "react";

interface ViewContextType {
    activeView: string;
    setActiveView: (v: string) => void;
}

const ViewContext = createContext<ViewContextType>({
    activeView: "home",
    setActiveView: () => {},
});

export function ViewProvider({ children }: { children: React.ReactNode }) {
    const [activeView, setActiveView] = useState("home");

    return (
        <ViewContext.Provider value={{ activeView, setActiveView }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    return useContext(ViewContext);
}
