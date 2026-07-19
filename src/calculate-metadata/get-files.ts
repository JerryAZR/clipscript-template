import { getStaticFiles } from "@remotion/studio";

export type PublicFolderFile = {
  filename: string;
  value: string;
};

// An episode is a folder under public/ - every file directly inside it
// is one step, ordered by file name (natural order: code2 before code10)
export const getFiles = async (episode: string) => {
  const files = getStaticFiles();
  const prefix = `${episode}/`;
  const codeFiles = files
    .filter((file) => {
      if (!file.name.startsWith(prefix)) {
        return false;
      }
      const rest = file.name.slice(prefix.length);
      return rest.length > 0 && !rest.includes("/");
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const contents = codeFiles.map(async (file): Promise<PublicFolderFile> => {
    const contents = await fetch(file.src);
    const text = await contents.text();

    return { filename: file.name.slice(prefix.length), value: text };
  });

  return Promise.all(contents);
};
