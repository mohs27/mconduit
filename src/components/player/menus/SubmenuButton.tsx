import type { JSX } from "solid-js";

export function SubmenuButton(props: SubmenuButtonProps) {
  return (
    <media-menu-button class="ring-primary parent left-0 z-10 flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 bg-black/95 outline-none ring-inset data-[open]:sticky data-[open]:top-0 data-[hocus]:bg-neutral-800/80 data-[focus]:ring-[3px] aria-hidden:hidden">
      <media-icon
        class="parent-data-[open]:block -ml-0.5 mr-1.5 hidden h-[18px] w-[18px]"
        type="chevron-left"
      />
      <div class="contents parent-data-[open]:hidden">{props.children}</div>
      <span class="ml-1.5 parent-data-[open]:ml-0">{props.label}</span>
      <span class="ml-auto text-sm text-white/50" data-part="hint"></span>
      <media-icon
        class="parent-data-[open]:hidden ml-0.5 h-[18px] w-[18px] text-sm text-white/50"
        type="chevron-right"
      />
    </media-menu-button>
  );
}

export interface SubmenuButtonProps {
  label: string;
  children: JSX.Element;
}
