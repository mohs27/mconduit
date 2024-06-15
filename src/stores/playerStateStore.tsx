// type PlayerStateContextType = PlayerSto

import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { MediaState, MediaPlayer } from "vidstack";

const PlayerStateContext = createContext<
  Readonly<MediaState> | Partial<MediaState>
>({});

export const PlayerStateProvider = (props: { children: any }) => {
  const [playerState, setPlayerState] = createStore<
    Readonly<MediaState> | Partial<MediaState>
  >({});
  const [player, setPlayer] = createSignal<MediaPlayer | null>();

  createEffect(() => {
    if (!player()) {
      setPlayer(document.querySelector("media-player"));
    }
  });
  let unsubscribe: () => void | undefined;

  createEffect(() => {
    if (!player()) return;
      unsubscribe = player()!.subscribe(({ paused }) => {
        console.log("playerStateStore.tsx:39", paused);
        setPlayerState({ paused });
      });
  });

  onCleanup(() => {
    unsubscribe?.();
  });

  return (
    <PlayerStateContext.Provider value={playerState}>
      {props.children}
    </PlayerStateContext.Provider>
  );
};

export const usePlayerState = () => {
  const context = useContext(PlayerStateContext);
  return context;
};
