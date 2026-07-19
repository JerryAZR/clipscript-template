import type { HighlightedCode } from "codehike/code";
import React from "react";

const HighlightContext = React.createContext<Record<
  string,
  HighlightedCode
> | null>(null);

export const HighlightProvider = ({
  highlightedCode,
  children,
}: {
  readonly highlightedCode: Record<string, HighlightedCode>;
  readonly children: React.ReactNode;
}) => {
  return (
    <HighlightContext.Provider value={highlightedCode}>
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlightedCode = () => {
  const highlightedCode = React.useContext(HighlightContext);
  if (!highlightedCode) {
    throw new Error("HighlightContext not found");
  }
  return highlightedCode;
};
