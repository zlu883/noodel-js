import NoodelNode from '../main/NoodelNode';

/**
 * Options for an individual node.
 */
export default interface NodeOptions {
    /**
     * If set to a boolean, will override the global useResizeDetection option for 
     * resizes of this specific node (on the branch axis). Defaults to null.
     */
    useResizeDetection?: boolean | null;
    /**
     * If set to a boolean, will override the global useResizeDetection option for 
     * resizes of this specific node's child branch (on the trunk axis). Defaults to null.
     */
    useBranchResizeDetection?: boolean | null;
    /**
     * If set to a boolean, will override the global useOverflowDetection for this
     * specific node. Defaults to null.
     */
    useOverflowDetection?: boolean | null;
    /**
     * If set to a boolean, will override the global showChildIndicators option for
     * this specific node. Defaults to null.
     */
    showChildIndicator?: boolean | null;
    /**
     * If set to a boolean, will override showOverflowIndicators in the global options
     * for this specific node. Defaults to null.
     */
    showOverflowIndicators?: boolean | null;
    /**
     * If set to a boolean, will override the global showBranchBackdrops option for
     * the child branch of this specific node. Defaults to null.
     */
    showBranchBackdrop?: boolean | null;
} 