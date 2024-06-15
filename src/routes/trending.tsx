import { createQuery, isServer } from "@tanstack/solid-query";
import { FaSolidCheck, FaSolidSort } from "solid-icons/fa";
import { Match, Show, Suspense, createEffect } from "solid-js";
import { For, Switch, createSignal } from "solid-js";
import { ErrorComponent } from "~/components/Error";
import { useAppState } from "~/stores/appStateStore";
import { usePreferences } from "~/stores/preferencesStore";
import { useSyncStore } from "~/stores/syncStore";
import type { TrendingStream } from "~/types";
import { TRENDING_REGIONS } from "~/config/constants";
import { Select as KobalteSelect } from "@kobalte/core";
import VideoCard from "~/components/content/stream/VideoCard";
import { Title } from "@solidjs/meta";

export default function Trending() {
  const sync = useSyncStore();
  const [preferences] = usePreferences();
  const [region, setRegion] = createSignal("US");
  const query = createQuery(() => ({
    queryKey: ["trending", preferences.instance.api_url, region()],
    queryFn: async (): Promise<TrendingStream[]> => {
      const res = await fetch(
        preferences.instance.api_url + "/trending?region=" + region()
      );
      if (!res.ok) {
        throw new Error("Error fetching trending");
      }
      return await res.json();
    },
    enabled: preferences.instance?.api_url ? true : false,
    placeholderData: Array(40).fill(undefined),
  }));
  const [, setAppState] = useAppState();
  createEffect(() => {
    setAppState(
      "loading",
      query.isFetching || query.isRefetching || query.isInitialLoading
    );
  });

  return (
    <div class="flex min-h-full flex-wrap justify-center bg-bg1">
      <Title>Trending | Conduit</Title>
      <div class="flex flex-col w-full mt-2">
        <KobalteSelect.Root
          defaultValue={TRENDING_REGIONS.find((r) => r.value === region())}
          optionValue="value"
          optionTextValue="label"
          onChange={(v) => setRegion(v.value)}
          placeholder="Select a region"
          options={TRENDING_REGIONS}
          itemComponent={(props) => {
            return (
              <KobalteSelect.Item
                class="cursor-pointer w-full border-bg3 flex relative items-center px-7 py-2 rounded border-b hover:bg-bg3 focus-visible:bg-bg3 focus-visible:ring-4 focus-visible:ring-highlight focus-visible:outline-none"
                item={props.item}
              >
                <KobalteSelect.Label>
                  {props.item.rawValue.flag} {props.item.rawValue.label}
                </KobalteSelect.Label>
                <KobalteSelect.ItemIndicator class="inline-flex absolute left-0">
                  <FaSolidCheck
                    fill="currentColor"
                    class="h-4 w-4 mx-1 text-text1"
                  />
                </KobalteSelect.ItemIndicator>
              </KobalteSelect.Item>
            );
          }}
          class="relative"
        >
          <KobalteSelect.Trigger class=" p-1 outline-none bg-bg3 ring-1 ring-bg2 inline-flex items-center justify-between py-2 px-3 focus-visible:ring-2 focus-visible:ring-primary rounded-md">
            <KobalteSelect.Value<{
              value: string;
              label: string;
              flag: string;
            }>>
              {(state) =>
                state.selectedOption().flag + " " + state.selectedOption().label
              }
            </KobalteSelect.Value>
            <KobalteSelect.Icon>
              <FaSolidSort
                fill="currentColor"
                class="h-3 w-3 text-text1 relative left-1"
              />
            </KobalteSelect.Icon>
          </KobalteSelect.Trigger>
          <KobalteSelect.Portal>
            <KobalteSelect.Content
              class="bg-bg2 rounded-md z-50
                animate-in
                fade-in
                slide-in-from-top-10
                duration-200
              "
            >
              <KobalteSelect.Arrow />
              <KobalteSelect.Listbox class="max-h-[40vh] p-2 overflow-y-auto scrollbar" />
            </KobalteSelect.Content>
          </KobalteSelect.Portal>
        </KobalteSelect.Root>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <Show when={query.error}>{(query.error as Error).message}</Show>
        <Show when={!Array.isArray(query.data)}>
          <ErrorComponent error={query.data} />
        </Show>
        <div class="flex flex-wrap justify-center">
          <Show when={query.data} keyed>
            {(videos) =>
              videos && (
                <For
                  each={videos
                    // blocklist
                    .filter(
                      (item) =>
                        !sync.store.blocklist[
                          item?.uploaderUrl?.split("/").pop()!
                        ]
                    )}
                >
                  {(video) => <VideoCard v={video} layout="sm:grid" />}
                </For>
              )
            }
          </Show>
        </div>
      </Suspense>
    </div>
  );
}
