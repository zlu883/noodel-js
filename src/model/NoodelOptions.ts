export default interface NoodelOptions {

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