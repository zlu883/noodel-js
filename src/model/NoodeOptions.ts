import Noode from '@/main/Noode';

export default interface NoodeOptions {

    skipResizeDetection?: boolean;
    onMount?: (self: Noode) => any;
    onEnterFocus?: (self: Noode, prev: Noode) => any;
    onExitFocus?: (self: Noode, current: Noode) => any;
    onChildrenEnterFocus?:  (self: Noode, prev: Noode) => any;
    onChildrenExitFocus?:  (self: Noode, current: Noode) => any;
} 