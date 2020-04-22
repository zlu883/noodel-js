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
    snapDuration?: number;
    mounted?: () => any;
}