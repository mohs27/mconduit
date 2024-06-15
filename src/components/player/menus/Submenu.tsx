import type { JSX } from "solid-js";

import { SubmenuButton } from "./SubmenuButton";

export function Submenu(props: SubmenuProps) {
  return (
    <media-menu>
      <SubmenuButton label={props.label}>{props.iconSlot}</SubmenuButton>
      <media-menu-items class="hidden w-full flex-col items-start justify-center outline-none data-[keyboard]:mt-[3px] data-[open]:inline-block data-[open]:mt-0">
        {props.children}
      </media-menu-items>
    </media-menu>
  );
}

export interface SubmenuProps {
  label: string;
  iconSlot: JSX.Element;
  children: JSX.Element;
}
