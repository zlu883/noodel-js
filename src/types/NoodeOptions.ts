import Noode from '@/main/Noode';

export default interface NoodeOptions {

    skipResizeDetection?: boolean | null;
    showChildIndicator?: boolean | null;
    showBranchColumn?: boolean | null;
    onEnterFocus?: (self: Noode, prev: Noode) => any | null;
    onExitFocus?: (self: Noode, current: Noode) => any | null;
    onChildrenEnterFocus?:  (self: Noode, prev: Noode) => any | null;
    onChildrenExitFocus?:  (self: Noode, current: Noode) => any | null;
} 