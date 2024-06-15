import numeral from "numeral";
import type { PipedVideo } from "../types";
import {
  For,
  Match,
  Show,
  Suspense,
  Switch,
  createEffect,
  createSignal,
} from "solid-js";
import { usePreferences } from "~/stores/preferencesStore";
import {
  FaSolidArrowsRotate,
  FaSolidBookmark,
  FaSolidBug,
  FaSolidChevronDown,
  FaSolidChevronRight,
  FaSolidCopy,
  FaSolidDownload,
  FaSolidShare,
  FaSolidThumbsDown,
  FaSolidThumbsUp,
  FaSolidTrashCan,
} from "solid-icons/fa";
import Modal from "./Modal";
import { createQuery } from "@tanstack/solid-query";
import { MediaPlayerElement } from "vidstack/elements";
import { createDate, createTimeAgo } from "@solid-primitives/date";
import DownloadModal from "./DownloadModal";
import { getVideoId, isMobile } from "~/utils/helpers";
import api from "~/utils/api";
import { isServer } from "solid-js/web";
import SubscribeButton from "./SubscribeButton";
import { Tooltip } from "./Tooltip";
import Button from "./Button";
import {
  TbThumbDown,
  TbThumbDownFilled,
  TbThumbUp,
  TbThumbUpFilled,
} from "solid-icons/tb";
import { toast } from "./Toast";
import { useSearchParams } from "@solidjs/router";
import Link from "./Link";
import { useVideoContext } from "~/stores/VideoContext";
import ShareModal from "./ShareModal";
import { usePlayerState } from "~/stores/playerStateStore";

function handleTimestamp(videoId: string, t: string, extraQueryParams: string) {
  const player = document.querySelector("media-player") as MediaPlayerElement;
  player.currentTime = parseInt(t, 10);
  player.focus();

  const newUrl = new URL(`/watch?v=${videoId}`, window.location.origin);
  const searchParams = new URLSearchParams(extraQueryParams);

  searchParams.set("t", t);

  newUrl.search = searchParams.toString();

  history.pushState({}, "", newUrl.toString());
}

(globalThis as any).handleTimestamp = handleTimestamp;

export async function sanitizeText(text: string) {
  const dompurify = await import("dompurify");
  const sanitize = dompurify.default().sanitize;
  const t = sanitize(text)
    .replaceAll(
      /(?:http(?:s)?:\/\/)?(?:www\.)?youtube\.com(\/[/a-zA-Z0-9_?=&-]*)/gm,
      "$1"
    )
    .replaceAll(
      /(?:http(?:s)?:\/\/)?(?:www\.)?youtu\.be\/(?:watch\?v=)?([/a-zA-Z0-9_?=&-]*)/gm,
      "/watch?v=$1"
    )
    .replaceAll("\n", "<br>")
    .replace(
      /<a href="\/watch\?v=([a-zA-Z0-9_?=&-]*)&amp;([^"]*)">([a-zA-Z0-9_?=&-:]*)<\/a>/gm,
      (_, videoId, params, textContent) => {
        const url = new URL(`https://youtube.com/watch?v=${videoId}`);
        const searchParams = new URLSearchParams(params);
        const existingParams = new URLSearchParams(window.location.search);

        const timestamp = searchParams.get("t") || "0";

        const allParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
          allParams.set(key, value);
        });
        existingParams.forEach((value, key) => {
          allParams.set(key, value);
        });

        allParams.forEach((value, key) => {
          url.searchParams.set(key, value);
        });

        return `<button class="link" onclick="handleTimestamp('${videoId}','${timestamp}', '${url.search}')">${textContent}</button>`;
      }
    )
    .replaceAll(/<a href/gm, '<a class="link" href');
  return t;
}

const Description = (props: { downloaded: boolean }) => {
  const [expanded, setExpanded] = createSignal(false);
  const video = useVideoContext();

  const [downloadModalOpen, setDownloadModalOpen] = createSignal(false);

  async function deleteVideo(id: string) {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(id, { recursive: true });
    } catch (e) {
      console.error(`Failed to delete ${id}`, e);
    }
  }
  const [debugInfoOpen, setDebugInfoOpen] = createSignal(false);
  const [date, setDate] = createDate(video.data?.uploadDate ?? new Date());

  const [shareModalOpen, setShareModalOpen] = createSignal(false);

  createEffect(() => {
    setDate(video.data?.uploadDate ?? new Date());
  });

  const [sanitizedDescription, setSanitizedDescription] = createSignal<
    string | undefined
  >(undefined);

  async function handleSetSanitizedDescription() {
    setSanitizedDescription(await sanitizeText(video.data!.description));
  }
  createEffect(() => {
    if (!video.data) return;
    handleSetSanitizedDescription();
  });
  const [currentTime, setCurrentTime] = createSignal<number | undefined>(
    undefined
  );
  function handleSetShareModalOpen(open: boolean) {
    if (open) {
      const player = document.querySelector("media-player");
      if (player) {
        setCurrentTime(player.currentTime);
      }
      setShareModalOpen(true);
    } else {
      setShareModalOpen(false);
    }
  }

  return (
    <>
      <Modal
        isOpen={debugInfoOpen()}
        setIsOpen={setDebugInfoOpen}
        title="Debug info"
      >
        <Tooltip
          contentSlot="Copy to clipboard"
          triggerSlot={
            <Button
              as="div"
              appearance="subtle"
              icon={<FaSolidCopy class="w-4 h-4" />}
            />
          }
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(video.data, null, 2));
          }}
        />
        <Show
          when={video.data}
          fallback={<div class="w-full h-96 bg-bg1 animate-pulse" />}
        >
          <div class="max-w-screen-sm max-h-[80vh] overflow-auto">
            <JSONViewer data={video.data} folded={false} />
          </div>
        </Show>
      </Modal>
      <Suspense>
        <DownloadModal
          id={getVideoId(video.data)!}
          isOpen={downloadModalOpen()}
          setIsOpen={setDownloadModalOpen}
        />
      </Suspense>
      <Show when={video.data}>
        <ShareModal
          isOpen={shareModalOpen()}
          setIsOpen={handleSetShareModalOpen}
          thumbnail={video.data!.thumbnailUrl}
          id={getVideoId(video.data)!}
          title={video.data!.title}
          t={currentTime()}
        />
      </Show>
      <div class="bg-bg1 w-[clamp(250px,100%,98vw)] mx-auto p-4 @container">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-2 ">
            <div class="flex items-start justify-between h-full">
              <Show
                when={video.data}
                fallback={
                  <div class="w-full h-6 bg-bg2 rounded animate-pulse" />
                }
              >
                <h1 class="text-lg leading-tight font-bold sm:text-xl ">
                  {video.data!.title}
                </h1>
              </Show>
            </div>
            <Show
              when={video.data}
              fallback={
                <div class="w-full h-12 flex sm:justify-start justify-between gap-2">
                  <div class="w-44 flex items-center gap-2">
                    <div class="w-12 h-12 aspect-square bg-bg2 animate-pulse rounded-full" />
                    <div class="flex flex-col justify-between py-1 gap-1 h-full w-full ">
                      <div class="w-full h-4  bg-bg2 animate-pulse rounded" />
                      <div class="w-3/4 h-4 bg-bg2 animate-pulse rounded" />
                    </div>
                  </div>
                  <div class="w-32 h-10  bg-bg2 animate-pulse rounded-full" />
                </div>
              }
            >
              <div class="my-1 flex justify-between items-center gap-4 sm:justify-start ">
                <div class="flex max-w-max items-center gap-2 text-sm sm:text-base">
                  <Link class="link" href={`${video.data!.uploaderUrl}`}>
                    <img
                      src={video.data!.uploaderAvatar}
                      width={42}
                      height={42}
                      alt={video.data!.uploader}
                      class="rounded-full"
                    />
                  </Link>
                  <div class="flex flex-col items-start justify-start">
                    <Link
                      href={`${video.data!.uploaderUrl}`}
                      class="link flex w-fit items-center gap-2"
                    >
                      {video.data!.uploader}{" "}
                      {video.data!.uploaderVerified && <Checkmark />}
                    </Link>
                    <div
                      title={`${
                        video.data!.uploaderSubscriberCount
                      } subscribers`}
                      class="flex w-full items-center text-start text-xs text-text2 sm:text-sm"
                    >
                      {numeral(video.data!.uploaderSubscriberCount)
                        .format("0a")
                        .toUpperCase()}{" "}
                      subscribers
                    </div>
                  </div>
                </div>

                <SubscribeButton
                  name={video.data!.uploader}
                  id={
                    (() => video.data?.uploaderUrl?.split("/channel/")[1])() ??
                    ""
                  }
                />
              </div>
            </Show>
          </div>
          <Show when={video.data} fallback={<ActionsContainerFallback />}>
            <ActionsContainer
              downloaded={props.downloaded}
              deleteVideo={() => deleteVideo(getVideoId(video.data)!)}
              setDownloadModalOpen={() => setDownloadModalOpen(true)}
              refetch={() => {
                console.dir(window);
              }}
              setDebugInfoOpen={() => setDebugInfoOpen(true)}
              setShareModalOpen={() => handleSetShareModalOpen(true)}
            />
          </Show>
          <Show
            when={video.data}
            fallback={
              <div class="w-full h-8 flex flex-wrap gap-2 mb-2 items-end justify-between ">
                <div class="w-64 h-4 bg-bg2 animate-pulse rounded-lg" />
                <div class="w-full @sm:w-36 h-4 bg-bg2 animate-pulse rounded-lg" />
              </div>
            }
          >
            <div
              title={`Published ${(() => {
                const substr = date().toString().split(":")[0];
                return substr.slice(0, substr.length - 3);
              })()} • ${numeral(video.data!.views).format("0,0")} views`}
              class="flex flex-col @sm:flex-row items-start @sm:items-center justify-between gap-1 my-1 text-sm "
            >
              <div class="flex items-center gap-1 @sm:max-w-[16rem] @md:max-w-full">
                <p class="truncate">
                  {(() => {
                    const substr = date().toString().split(":")[0];
                    const time = date().toString().split(" ")[4];
                    return `${substr.slice(0, substr.length - 3)} ${time.slice(0, time.length - 3)}`;
                  })()}
                </p>
                •
                <p class="truncate">
                  {video.data!.views > 10000
                    ? numeral(video.data!.views).format("0.00a").toUpperCase()
                    : numeral(video.data!.views)
                        .format("0,0")
                        .toUpperCase()}{" "}
                  views
                </p>
              </div>
              <div class="flex flex-col w-full @sm:w-36 ">
                <div class="flex items-center justify-between">
                  <span
                    title={`${numeral(video.data!.likes).format("0,0")} likes`}
                    class="flex items-center gap-1 "
                  >
                    <TbThumbUpFilled class="w-5 h-5 text-text2" />
                    {video.data!.likes > 1000
                      ? numeral(video.data!.likes).format("0.0a").toUpperCase()
                      : numeral(video.data!.likes).format("0,0").toUpperCase()}
                  </span>
                  <span
                    title={`${numeral(video.data!.dislikes).format(
                      "0,0"
                    )} likes`}
                    class="flex items-center gap-1"
                  >
                    <TbThumbDownFilled
                      class="h-5 w-5 text-text2 "
                      fill="currentColor"
                    />
                    {video.data!.dislikes > 1000
                      ? numeral(video.data!.dislikes)
                          .format("0.0a")
                          .toUpperCase()
                      : numeral(video.data!.dislikes)
                          .format("0,0")
                          .toUpperCase()}
                  </span>
                </div>
                <div class="w-full h-1 bg-primary rounded mt-2 flex justify-end">
                  <div
                    class="h-full bg-bg3 rounded-r"
                    style={{
                      width: `${
                        (video.data!.dislikes /
                          (video.data!.likes + video.data!.dislikes)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Show>
        </div>
        <Show
          when={video.data}
          fallback={
            <div class="mt-1 rounded-lg w-full h-24 bg-bg2 animate-pulse" />
          }
        >
          <div class="mt-1 flex flex-col rounded-lg bg-bg2 p-2">
            <div
              tabIndex={0}
              id="description"
              aria-expanded={expanded()}
              class={`min-w-0 max-w-full overflow-hidden ${
                expanded() ? "" : "max-h-20"
              }`}
              innerHTML={sanitizedDescription()!}
            />
            <div classList={{ hidden: expanded() }} class="w-full h-0 relative">
              <div class="absolute bottom-full w-full h-5 bg-gradient-to-t from-bg2 to-transparent pointer-events-none" />
            </div>
            <button
              aria-controls="description"
              onClick={() => {
                setExpanded(!expanded());
              }}
              class="text-center text-sm text-accent1 hover:underline "
            >
              Show {expanded() ? "less" : "more"}
            </button>
          </div>
        </Show>
      </div>
    </>
  );
};

export const Checkmark = () => (
  <svg
    class="h-4 w-4 "
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.857-7.5 7.643z" />
  </svg>
);

type JSONViewerProps = {
  data: any;
  folded: boolean;
  level?: number;
};

const JSONViewer: any = (props: JSONViewerProps) => {
  const [folded, setFolded] = createSignal(props.folded);
  const isObject = typeof props.data === "object" && props.data !== null;

  return (
    <div class={`pl-${props.level || 1} flex text-xs font-mono`}>
      {isObject ? (
        <div class="flex gap-2 justify-between">
          <span class="cursor-pointer" onClick={() => setFolded(!folded())}>
            {folded() ? <FaSolidChevronRight /> : <FaSolidChevronDown />}
          </span>
          <span>{Array.isArray(props.data) ? "[" : "{"}</span>
          {!folded() ? (
            <pre>
              {Object.entries(props.data).map(([key, value], index) => (
                <pre class="flex gap-2">
                  <span class="font-bold">{key}:</span>{" "}
                  <JSONViewer
                    data={value}
                    level={(props.level || 0) + 1}
                    folded={true}
                  />
                </pre>
              ))}
            </pre>
          ) : (
            "..."
          )}
          <span>{Array.isArray(props.data) ? "]" : "}"}</span>
        </div>
      ) : (
        <span>{props.data}</span>
      )}
    </div>
  );
};

export default Description;

const ActionsContainer = (props: {
  downloaded: boolean;
  deleteVideo: () => void;
  setDownloadModalOpen: () => void;
  refetch: () => void;
  setDebugInfoOpen: () => void;
  setShareModalOpen: () => void;
}) => {
  return (
    <div class="flex items-center justify-evenly rounded-full p-2 bg-bg2">
      <Switch>
        <Match when={props.downloaded}>
          <Tooltip
            as="div"
            contentSlot="Delete"
            triggerSlot={
              <Button
                icon={<FaSolidTrashCan class="h-6 w-6" />}
                appearance="subtle"
                onClick={props.deleteVideo}
              />
            }
          />
        </Match>
        <Match when={!props.downloaded}>
          <Tooltip
            as="div"
            contentSlot="Download"
            triggerSlot={
              <Button
                icon={<FaSolidDownload class="h-6 w-6" />}
                appearance="subtle"
                onClick={props.setDownloadModalOpen}
              />
            }
          />
        </Match>
      </Switch>
      <Tooltip
        as="div"
        contentSlot={"Share"}
        triggerSlot={
          <Button
            icon={<FaSolidShare class="h-6 w-6" />}
            appearance="subtle"
            onClick={props.setShareModalOpen}
          />
        }
      />
      <Tooltip
        as="div"
        contentSlot="Save"
        triggerSlot={
          <Button
            icon={<FaSolidBookmark class="h-6 w-6" />}
            appearance="subtle"
            onClick={() => {
              toast.show("Not implemented");
            }}
          />
        }
      />
      <Tooltip
        as="div"
        contentSlot="Debug info"
        triggerSlot={
          <Button
            icon={<FaSolidBug class="h-6 w-6" />}
            appearance="subtle"
            onClick={props.setDebugInfoOpen}
          />
        }
      />
      <Tooltip
        as="div"
        contentSlot="Soft Refresh (Shift+R)"
        triggerSlot={
          <Button
            icon={<FaSolidArrowsRotate class="h-6 w-6" />}
            appearance="subtle"
            onClick={props.refetch}
          />
        }
      />
    </div>
  );
};

const ActionsContainerFallback = () => (
  <div class="flex items-center bg-bg2 justify-evenly rounded-full p-2 ">
    <div class="w-10 h-10 bg-bg1 rounded-full animate-pulse" />
    <div class="w-10 h-10 bg-bg1 rounded-full animate-pulse" />
    <div class="w-10 h-10 bg-bg1 rounded-full animate-pulse" />
    <div class="w-10 h-10 bg-bg1 rounded-full animate-pulse" />
    <div class="w-10 h-10 bg-bg1 rounded-full animate-pulse" />
  </div>
);
