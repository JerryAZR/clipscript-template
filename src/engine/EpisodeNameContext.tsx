import React from "react";

const EpisodeNameContext = React.createContext<string | null>(null);

export const EpisodeNameProvider = ({
  name,
  children,
}: {
  readonly name: string;
  readonly children: React.ReactNode;
}) => {
  return (
    <EpisodeNameContext.Provider value={name}>
      {children}
    </EpisodeNameContext.Provider>
  );
};

/** Name of the episode being rendered (folder under public/). */
export const useEpisodeName = (): string => {
  const name = React.useContext(EpisodeNameContext);
  if (!name) {
    throw new Error("EpisodeNameContext not found");
  }
  return name;
};
