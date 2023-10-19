import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: Record<string, never>;
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type PhotoBoothProps = typeof __propDef.props;
export type PhotoBoothEvents = typeof __propDef.events;
export type PhotoBoothSlots = typeof __propDef.slots;
export default class PhotoBooth extends SvelteComponent<PhotoBoothProps, PhotoBoothEvents, PhotoBoothSlots> {
}
export {};
