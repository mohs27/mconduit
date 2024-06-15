export function MenuRadio() {
  return (
    <media-radio class="ring-primary group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 outline-none data-[hocus]:bg-white/10 data-[focus]:ring-[3px]">
      <media-icon
        class="h-4 w-4 text-white group-data-[checked]:hidden"
        type="radio-button"
      />
      <media-icon
        class="text-primary hidden h-4 w-4 group-data-[checked]:block"
        type="radio-button-selected"
      />
      <span class="ml-2" data-part="label"></span>
      <span class="ml-auto text-white/50 text-xs" data-part="bitrate"></span>
    </media-radio>
  );
}
