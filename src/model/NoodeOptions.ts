import Noode from '@/main/Noode';

export default interface NoodeOptions {

    skipResizeDetection?: boolean;
    onMount?: (self: Noode) => any;
    onEnterFocus?: (self: Noode, from: Noode) => any;
    onExitFocus?: (self: Noode, to: Noode) => any;
    onChildrenEnterFocus?:  (self: Noode, from: Noode) => any;
    onChildrenExitFocus?:  (self: Noode, to: Noode) => any;
} 