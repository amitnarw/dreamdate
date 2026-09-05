import React, { createContext, useContext, useMemo, useState } from 'react';
import { View } from 'react-native';

interface TabBlurContextType {
  tabTargetRef: React.RefObject<View | null>;
  blurTargetKey: number;
}

export const TabBlurContext = createContext<TabBlurContextType>({
  tabTargetRef: { current: null },
  blurTargetKey: 0,
});

export function TabBlurProvider({ children }: { children: React.ReactNode }) {
  const [blurTargetKey, setBlurTargetKey] = useState(0);

  const tabTargetRef = useMemo<React.RefObject<View | null>>(() => {
    let inner: View | null = null;
    return {
      get current() {
        return inner;
      },
      set current(node: View | null) {
        if (node && node !== inner) {
          inner = node;
          setBlurTargetKey((k) => k + 1);
        } else if (!node) {
          inner = null;
        }
      },
    };
  }, []);

  return (
    <TabBlurContext.Provider value={{ tabTargetRef, blurTargetKey }}>
      {children}
    </TabBlurContext.Provider>
  );
}

export function useTabBlur() {
  return useContext(TabBlurContext);
}
