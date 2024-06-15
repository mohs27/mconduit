import { Signal, createContext, createSignal, useContext } from "solid-js";
import { Playlist } from "~/types";


const PlaylistContext = createContext<Signal<Playlist |undefined>| null>(null);

export function PlaylistProvider(props: { children: any }) {
    const list = createSignal<Playlist>();
    return (
        <PlaylistContext.Provider value={list}>
            {props.children}
        </PlaylistContext.Provider>
    );
}

export const usePlaylist = () => {
    const context = useContext(PlaylistContext);
    if (!context) {
        throw new Error("usePlaylist must be used within a PlaylistProvider");
    }
    return context;
}
