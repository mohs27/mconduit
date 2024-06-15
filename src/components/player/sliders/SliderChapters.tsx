export function SliderChapters() {
  return (
    <media-slider-chapters class="relative flex h-full w-full items-center rounded-[1px]">
      <template>
        <SliderChapter />
      </template>
    </media-slider-chapters>
  );
}

function SliderChapter() {
  return (
    <div
      class="last-child:mr-0 relative mr-0.5 flex h-full w-full items-center rounded-[1px]"
      style={{ contain: "layout style" }}
    >
      {/* Track */}
      <div class="ring-primary relative z-0 h-[5px] w-full rounded-sm bg-white/30 group-data-[focus]:ring-[3px]">
        <div class="bg-primary z-10 absolute h-full w-[var(--chapter-fill)] rounded-sm will-change-[width]" />
        <div class="absolute z-0 h-full w-[var(--chapter-progress)] rounded-sm bg-white/50 will-change-[width]" />
      </div>
    </div>
  );
}
