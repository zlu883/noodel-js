export as namespace Noodel;

export = Noodel;

/**
 * The view model of a noodel. Has 2-way binding with the view.
 */
declare class Noodel {
    /**
     * A Vue component (in constructor form) for Noodel ready to be used in a Vue project.
     * Takes a single prop, 'noodel', which should be a Noodel instance registered as
     * data in your Vue instance. 
     */
    static VueComponent: Function;
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
     * Gets the container element of this noodel (i.e. nd-canvas), if mounted.
     */
    getEl(): HTMLDivElement;
    /**
     * Gets the current focal level (the level of the focal parent).
     */
    getFocalLevel(): number;
    /**
     * Gets the height (total number of levels) in the current active tree.
     */
    getActiveTreeHeight(): number;
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
     * the current active tree. If the level is greater or smaller than
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
    /**
     * Turns inspect mode on/off.
     */
    toggleInspectMode(on: boolean);
}

/**
 * The view model of a noode. Has 2-way binding with the view.
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
     * Gets the container element of this noode (i.e. nd-noode-box), if mounted.
     */
    getEl(): HTMLDivElement;
    /**
     * Gets the container element of the branch containing this noode's children
     * (i.e. nd-branch-box), if it has children and is mounted.
     */
    getChildBranchEl(): HTMLDivElement;
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
     * Gets the content of this noode.
     */
    getContent(): string | ComponentContent;
    /**
     * Gets the custom class names for this noode.
     */
    getClass(): string[];
    /**
     * Gets the custom styles for this noode.
     */
    getStyle(): object;
    /**
     * Gets the 0-based index (position among siblings) of this noode.
     */
    getIndex(): number;
    /**
     * Gets the level of this noode. The root has level 1.
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
     * Replaces the content of this noode.
     */
    setContent(content: string | ComponentContent);
    /**
     * Replaces the custom class names for this noode. Can be an array or a space-delimited string.
     */
    setClass(className: string | string[]);
    /**
     * Replaces the custom inline styles for this noode. Can be a string or an object of property-value
     * pairs.
     */
    setStyle(style: string | object);
    /**
     * Changes the options for this noode. Properties of the given object
     * will be merged into the existing options.
     */
    setOptions(options: NoodeOptions);
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
 * Object template used for noode creation and insertion.
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
     * Content of this noode.
     */
    content?: string | ComponentContent;
    /**
     * Custom class(es) for this noode. Either a string of class names delimited by spaces
     * or an array of class names.
     */
    className?: string | string[];
    /**
     * Custom styles for this noode. Either a style string in inline style format
     * or a style object in {"property": "value"} format.
     */
    style?: string | object;
    /**
     * Options for this noode.
     */
    options?: NoodeOptions;
}

/**
 * Global options for a noodel.
 */
declare interface NoodelOptions {
    /**
     * The number of levels of descendent branches to show
     * after the current focal branch. Defaults to 1.
     */
    visibleSubtreeDepth?: number;
    /**
     * If true, will keep the current branch depth (if possible) when
     * tapping on the sibling of an ancestor. Useful to create an effect similar to conventional
     * navigation menus. Defaults to false.
     */
    retainDepthOnTapNavigation?: boolean;
    /**
     * Amount of time to wait in ms (until no more consecutive hits) before showing the 
     * subtree of the focal noode, when moving the focal branch. Mainly a performance hack
     * to prevent rapid toggling of subtree elements. Defaults to 360.
     */
    subtreeDebounceInterval?: number;
    /**
     * Whether to apply the default keyboard navigation. Defaults to true.
     */
    useKeyNavigation?: boolean;
    /**
     * Whether to apply the default wheel navigation. Defaults to true.
     */
    useWheelNavigation?: boolean;
    /**
     * Whether to apply the default swipe navigation. Defaults to true.
     */
    useSwipeNavigation?: boolean;
    /**
     * Whether to apply the default tap navigation. Defaults to true.
     */
    useTapNavigation?: boolean;
    /**
     * Whether to allow toggling inspect mode via the Enter key. Defaults to true.
     */
    useInspectModeKey?: boolean;
    /**
     * Whether to allow toggling inspect mode via the double tap. Defaults to true.
     */
    useInspectModeDoubleTap?: boolean;
    /**
     * If true, will not attach resize detectors on ALL noodes, which may give 
     * a slight performance boost. Set this if you know that
     * the size of ALL noodes will never change after creation. Defaults to false.
     */
    skipResizeDetection?: boolean;
    /**
     * Number of pixels to move for every pixel swiped in the branch axis. Defaults to 1.
     */
    swipeMultiplierBranch?: number;
    /**
     * Number of pixels to move for every pixel swiped in the trunk axis. Defaults to 1.
     */
    swipeMultiplierTrunk?: number;
    /**
     * Number of noodes (per unit of velocity) to snap across after a swipe is released.
     * Defaults to 1.
     */
    snapMultiplierBranch?: number;
    /**
     * Number of levels (per unit of velocity) to snap across after a swipe is released.
     * Defaults to 1.
     */
    snapMultiplierTrunk?: number;
    /**
     * Determines whether routing should be enabled for this noodel. Defaults to true.
     */
    useRouting?: boolean;
    /**
     * Callback after the view has been mounted and properly aligned
     * after the first render. Changes to the view model from here onward
     * will sync with the view and trigger animation effects.
     */
    onMount?: () => any;
    /**
     * Handler called once after noodel creation, and whenever the focal noode
     * has changed. 
     * @param current the current focal noode
     * @param prev the previous focal noode, null on initial call
     */
    onFocalNoodeChange?: (current: Noode, prev: Noode) => any;
    /**
     * Handler called once after noodel creation, and whenever the focal parent
     * has changed.
     * @param current the current focal parent
     * @param prev the previous focal parent, null on initial call
     */
    onFocalParentChange?: (current: Noode, prev: Noode) => any;
    /**
     * Handler called when entered inspect mode.
     * @param noode the current focal noode
     */
    onEnterInspectMode?: (noode: Noode) => any;
    /**
     * Handler called when exited inspect mode.
     * @param noode the current focal noode
     */
    onExitInspectMode?: (noode: Noode) => any;
}

/**
 * Options for an individual noode.
 */
declare interface NoodeOptions {
    /**
     * If true, will not attach resize detectors on this noode, which may give 
     * a slight performance boost. Set this if you know that
     * the size of this noode will never change after creation. Defaults to false.
     */
    skipResizeDetection?: boolean;
    /**
     * Handler called whenever this noode entered focus. Will be called once after noodel creation
     * if this is the focal noode.
     * @param self the current focal noode (i.e. this noode)
     * @param prev the previous focal noode, null on initial call
     */
    onEnterFocus?: (self: Noode, prev: Noode) => any;
    /**
     * Handler called whenever this noode exited focus.
     * @param self the previous focal noode (i.e. this noode)
     * @param current the current focal noode
     */
    onExitFocus?: (self: Noode, current: Noode) => any;
    /**
     * Handler called whenever this noode's child branch entered focus. Will be called once after noodel creation
     * if this is the focal parent.
     * @param self the current focal parent (i.e. this noode)
     * @param prev the previous focal parent, null on initial call
     */
    onChildrenEnterFocus?:  (self: Noode, prev: Noode) => any;
    /**
     * Handler called whenever this noode's child branch exited focus.
     * @param self the previous focal parent (i.e. this noode)
     * @param current the current focal parent
     */
    onChildrenExitFocus?:  (self: Noode, current: Noode) => any;
}

/**
 * Object template used for passing a Vue component as noode content.
 */
declare interface ComponentContent {
    /**
     * Vue component to be rendered using Vue's <component> tag. Can be name or component reference.
     */
    component: string | object | Function;
    /**
     * Name-value pairs of props to pass to this component.
     */
    props?: object;
    /**
     * Name-value pairs of event listeners to pass to this component.
     */
    eventListeners?: object;
}