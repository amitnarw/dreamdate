import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

export interface TabBlurTargets {
  index: React.RefObject<View | null>;
  history: React.RefObject<View | null>;
  profile: React.RefObject<View | null>;
}

interface TabBlurContextType {
  targets: TabBlurTargets;
  tabVersion: number;
  notifyTargetMounted: () => void;
}

const defaultRef: React.RefObject<View | null> = { current: null };

export const TabBlurContext = createContext<TabBlurContextType>({
  targets: {
    index: defaultRef,
    history: defaultRef,
    profile: defaultRef,
  },
  tabVersion: 0,
  notifyTargetMounted: () => {},
});

export function TabBlurProvider({ children }: { children: React.ReactNode }) {
  const indexRef = useRef<View | null>(null);
  const historyRef = useRef<View | null>(null);
  const profileRef = useRef<View | null>(null);
  const [tabVersion, setTabVersion] = useState(0);

  const targets = useMemo<TabBlurTargets>(() => ({
    index: indexRef,
    history: historyRef,
    profile: profileRef,
  }), []);

  const notifyTargetMounted = () => {
    setTabVersion((v) => v + 1);
  };

  return (
    <TabBlurContext.Provider value={{ targets, tabVersion, notifyTargetMounted }}>
      {children}
    </TabBlurContext.Provider>
  );
}

export function useTabBlur() {
  return useContext(TabBlurContext);
}
