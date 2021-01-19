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
     * If set to a function, will override the global focalOffsetTrunk option for
     * this specific node's child branch. Defaults to null.
     */
    focalOffsetTrunk?: (canvasLengthTrunk: number) => number;
    /**
     * If set to a function, will override the global focalOffsetBranch option for
     * this specific node. Defaults to null.
     */
    focalOffsetBranch?: (canvasLengthBranch: number) => number;
    /**
     * If set to a function, will override the global anchorOffsetTrunk option for
     * this specific node's child branch. Defaults to null.
     */
    anchorOffsetTrunk?: null | ((branchLength: number) => number);
    /**
     * If set to a function, will override the global anchorOffsetBranch option for
     * this specific node. Defaults to null.
     */
    anchorOffsetBranch?: null | ((activeNodeSize: number) => number) ;
} 