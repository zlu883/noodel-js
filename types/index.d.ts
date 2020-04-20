export as namespace Noodel;

export = Noodel;

declare class Noodel {
    constructor(root: Noode | Element | string, options?: NoodelOptions);
    mount(el: string | Element);
}

declare interface Noode {
    id?: string;
    children?: Noode[];
    activeChildIndex?: number;
    content?: string;
}

declare interface NoodelOptions {
    initialPath?: number[]; 
    visibleSubtreeDepth?: number;
    maxNoodeHeight?: number | string;
    maxNoodeWidth?: number | string;
    minNoodeHeight?: number | string;
    minNoodeWidth?: number | string;
    absNoodeHeight?: number | string;
    absNoodeWidth?: number | string;
    mounted?: () => any;
}