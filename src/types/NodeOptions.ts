/**
 * Options for an individual node.
 */
export default interface NodeOptions {
    /**
     * If set to a boolean, will override the global showChildIndicators option for
     * this specific node. Defaults to null.
     */
    showChildIndicator?: boolean | null;
    /**
     * If set to a function, will override the global focalAnchorTrunk option for
     * this specific node's child branch. Defaults to null.
     */
    anchorOffsetTrunk?: null | ((branchLength: number) => number);
    /**
     * If set to a function, will override the global focalAnchorBranch option for
     * this specific node. Defaults to null.
     */
    anchorOffsetBranch?: null | ((activeNodeSize: number) => number) ;
} 