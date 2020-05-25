export as namespace Noodel;

export = Noodel;

/**
 * Represents the view model of a noodel. Has 2-way binding with the view.
 */
declare class Noodel {
    /**
     * Creates the view model of a noodel based on the given content tree.
     */
    constructor(root: NoodeDefinition | Element | string, options?: NoodelOptions);
    /**
     * Mounts the noodel's view at the target element, replacing it.
     */
    mount(el: string | Element);
    /**
     * Destroys the noodel's view and removes it from the DOM,
     * but keeping the current state of the view model.
     */
    unmount();
    /**
     * Changes the options of the noodel. Properties of the given object
     * will be merged into the current options.
     */
    setOptions(options: NoodelOptions);
    /**
     * Gets the current focal level.
     */
    getFocalLevel(): number;
    /**
     * Gets the total number of levels in the current active subtree.
     */
    getLevelCount(): number;
    /**
     * Gets the root noode. The root is an invisible noode
     * that serves as the parent of the topmost branch, and always exists.
     */
    getRoot(): Noode;
    /**
     * Gets the parent noode of the current focal branch.
     */
    getFocalParent(): Noode;
    /**
     * Gets the current focal noode.
     */
    getFocalNoode(): Noode;
    /**
     * Gets the noode at the given path, an array of 0-based indices
     * starting from the root (e.g [0, 2] gets the 3rd child of the first child
     * of the root). Returns null if no noode exists on that path.
     */
    findNoodeByPath(path: number[]): Noode;
    /**
     * Gets the noode with the given ID. Returns null if does not exist.
     */
    findNoodeById(id: string): Noode;
    /**
     * Navigates the noodel to focus on the branch at the given level of
     * the current active subtree. If the level is greater or smaller than
     * the possible limits, will navigate to the furthest level in that direction.
     */
    setFocalLevel(level: number);
    /**
     * Navigates towards the child branches of the current
     * focal noode.
     * @param levelCount number of levels to move, defaults to 1
     */
    moveIn(levelCount?: number);
    /**
     * Navigates towards the parent branches of the current
     * focal noode.
     * @param levelCount number of levels to move, defaults to 1
     */
    moveOut(levelCount?: number);
    /**
     * Navigates towards the next siblings of the current
     * focal noode.
     * @param noodeCount number of noodes to move, defaults to 1
     */
    moveForward(noodeCount?: number);
    /**
     * Navigates towards the previous siblings of the current
     * focal noode.
     * @param noodeCount number of noodes to move, defaults to 1
     */
    moveBack(noodeCount?: number);
    /**
     * Performs a navigational jump to focus on the given noode.
     * Cannot jump to the root.
     * @param noode the noode to jump to, must be a Noode instance obtained from the noodel
     */
    jumpTo(noode: Noode);
}

/**
 * Represents the view model of a noode. Has 2-way binding with the view.
 */
declare class Noode {

    private constructor();

    /**
     * Gets the parent of this noode. All noodes should have a parent
     * except the root, which will return null.
     */
    getParent(): Noode;
    /**
     * Gets the path (an array of zero-based indices counting from the root) of this noode.
     */
    getPath(): number[];
    /**
     * Extracts the definition tree of this noode (including its descendents).
     * Useful if you want to perform your own operations on the content tree.
     */
    getDefinition(): NoodeDefinition;
    /**
     * Gets the child at the given index. Returns null if does not exist.
     */
    getChild(index: number): Noode;
    /**
     * Gets the current active child. Returns null if does not exist.
     */
    getActiveChild(): Noode;
    /**
     * Gets a mapped array of this noode's list of children.
     */
    getChildren(): Noode[];
    /**
     * Gets the ID of this noode.
     */
    getId(): string;
    /**
     * Gets the content (innerHTML) of this noode.
     */
    getContent(): string;
    /**
     * Gets the index (position among siblings) of this noode.
     */
    getIndex(): number;
    /**
     * Gets the level of this noode. The root has level 0.
     */
    getLevel(): number;
    /**
     * Gets the active child index. Returns null if there's no active child.
     */
    getActiveChildIndex(): number;
    /**
     * Sets the ID of this noode.
     */
    setId(id: string);
    /**
     * Replaces the content of this noode. This will
     * remove the old content from the DOM.
     */
    setContent(content: string);
    /**
     * Changes the active child of this noode. If doing so will toggle
     * the visibility of the focal branch (i.e this noode is an ancestor
     * of the focal branch), a jump to the new active child will be triggered.
     */
    setActiveChild(index: number);
    /**
     * Inserts a child noode (and its descendents) at the given index.
     * Will always preserve the current active child. Returns the inserted
     * child.
     * @param childDef definition tree of the child
     * @param index if not provided, will append to the end of the children
     */
    addChild(childDef: NoodeDefinition, index?: number): Noode;
    /**
     * Inserts a list of child noodes (and their descendents) at the given index.
     * Will always preserve the current active child. Returns the inserted
     * children.
     * @param childDefs definition trees of the children
     * @param index if not provided, will append to the end of the children
     */
    addChildren(childDefs: NoodeDefinition[], index?: number): Noode;
    /**
     * Removes a child noode (and its descendents) at the given index.
     * If the active child is removed, will set the next child active,
     * unless the child is the last in the list, where the previous child
     * will be set active. If the focal branch is deleted, will jump
     * to the nearest ancestor branch. Returns the definition of the deleted noode.
     */
    removeChild(index: number): NoodeDefinition;
    /**
     * Removes children noodes (and their descendents) at the given index.
     * If the active child is removed, will set the next child active,
     * unless the child is the last in the list, where the previous child
     * will be set active. If the focal branch is deleted, will jump
     * to the nearest ancestor branch. Returns the definitions of the deleted noodes.
     * @param count number of children to remove
     */
    removeChildren(index: number, count: number): NoodeDefinition[];
}

/**
 * Defines the template for a noode. Used for noode creation and insertion.
 */
declare interface NoodeDefinition {
    /**
     * ID of this noode. If provided, must be unique and should NOT start with "_" .
     */
    id?: string;
    /**
     * Children noodes of this noode. Defaults to an empty array.
     */
    children?: NoodeDefinition[];
    /**
     * The index of the initial active child of this noode. Defaults to 0 (the first child),
     * or null if the noode has no children.
     */
    activeChildIndex?: number;
    /**
     * Content of this noode. Will be injected as innerHTML of the noode's container.
     */
    content?: string;
}

/**
 * Defines the options for a noodel.
 */
declare interface NoodelOptions {
    /**
     * The number of levels of descendent branches to show
     * after the current focal branch. Defaults to 1.
     */
    visibleSubtreeDepth?: number;
    /**
     * A number between 0 and 1 that affects the amount of movement when swiping in the branch axis.
     * For every pixel swiped, the movement will be (1 - friction) pixels. Defaults to 0.7.
     */
    swipeFrictionBranch?: number;
    /**
     * A number between 0 and 1 that affects the amount of movement when swiping in the trunk axis.
     * For every pixel swiped, the movement will be (1 - friction) pixels. Defaults to 0.2.
     */
    swipeFrictionTrunk?: number;
    /**
     * A positive non-zero number that affects how many noodes to snap across after a swipe is released
     * in the branch axis. The final number is calculated as a function of the swipe velocity
     * multiplied by (100 / weight). Defaults to 100.
     */
    swipeWeightBranch?: number;
    /**
     * A positive non-zero number that affects how many levels to snap across after a swipe is released
     * in the trunk axis. The final number is calculated as a function of the swipe velocity
     * multiplied by (100 / weight). Defaults to 100.
     */
    swipeWeightTrunk?: number;
    /**
     * Callback after the view has been mounted and properly aligned
     * after the first render. Changes to the view model from here onward
     * will sync with the view and trigger animation effects.
     */
    mounted?: () => any;
}