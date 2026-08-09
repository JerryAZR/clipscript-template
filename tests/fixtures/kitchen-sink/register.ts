import { registerInternalEpisode } from "../../../src/episodes/registry";
import { storyboard } from "./storyboard";

// The smoke suite's kitchen-sink fixture: one clip of every type, a code
// chain, scrolling, a fence. Loadable by name ("kitchen-sink") but never
// listed in Studio. Assets live in public/kitchen-sink/.
registerInternalEpisode("kitchen-sink", { storyboard });
