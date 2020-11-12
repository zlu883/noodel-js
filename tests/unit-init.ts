import Noodel from "../src/main/Noodel";
import NoodeCss from "../src/types/NoodeCss";
import NoodeOptions from "../src/types/NoodeOptions";

const assert = chai.assert;

// Tests noodel initialization and getters

describe('Init', function () {

    describe('with no content tree', function () {
        it('should create empty noodel with 0 noodes', function () {
            assert.strictEqual(new Noodel().getNoodeCount(), 0);
        });
        it('should create empty noodel with root', function () {
            assert.isObject(new Noodel().getRoot());
        });
    });

    describe('with invalid selector', function () {
        it('should fail with error', function () {
            assert.throw(() => new Noodel("invalid selector"));
        });
    });

    describe('from valid selector', function () {
        let noodel: Noodel;

        beforeEach(function () {
            noodel = new Noodel("#template");
        });

        it('should parse all noodes', function () {
            assert.strictEqual(noodel.getNoodeCount(), 14);
        });
        it('should parse all noodes on a level', function () {
            assert.strictEqual(noodel.getRoot().getChildCount(), 8);
        });
        it('should parse children noodes', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChildCount(), 3);
        });
        it('should parse deep children noodes', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChild(2).getChildCount(), 3);
        });
        it('should parse noode content from inner HTML', function () {
            assert.strictEqual((noodel.getRoot().getChild(0).getContent() as string).trim(), '<h2>Heading</h2>Some text node');
        });
        it('should parse custom class names', function () {
            let classNames = noodel.getRoot().getChild(2).getClassNames();
            let expected: NoodeCss = {
                noode: "custom noode", 
                contentBox: "custom content box",
                branch: "custom branch", 
                branchBackdrop: "custom branch backdrop",
                childIndicator: "custom child indicator",
                overflowIndicatorLeft: "custom overflow indicator left",
                overflowIndicatorRight: "custom overflow indicator right",
                overflowIndicatorTop: "custom overflow indicator top",
                overflowIndicatorBottom: "custom child indicator bottom"
            }
            assert.deepStrictEqual(classNames, expected);
        });
        it('should parse custom styles', function () {
            let styles = noodel.getRoot().getChild(3).getStyles();
            let expected: NoodeCss = {
                noode: "color: red; border: solid blue 0px", 
                contentBox: "color: red; border: solid blue 1px",
                branch: "color: red; border: solid blue 2px", 
                branchBackdrop: "color: red; border: solid blue 3px",
                childIndicator: "color: red; border: solid blue 4px",
                overflowIndicatorLeft: "color: red; border: solid blue 5px",
                overflowIndicatorRight: "color: red; border: solid blue 6px",
                overflowIndicatorTop: "color: red; border: solid blue 7px",
                overflowIndicatorBottom: "color: red; border: solid blue 8px"
            }
            assert.deepStrictEqual(styles, expected);
        });
        it('should parse custom ID', function () {
            assert.strictEqual(noodel.getRoot().getChild(6).getId(), 'customId');
        });
        it('should parse custom active child on first come basis', function () {
            assert.strictEqual(noodel.getRoot().getActiveChildIndex(), 4);
            assert.strictEqual(noodel.getRoot().getActiveChild().getIndex(), 4);
            assert.isTrue(noodel.getRoot().getChild(4).isActive());
            assert.isFalse(noodel.getRoot().getChild(5).isActive());
        });
        it('should default active child to 0 for noode with children', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getActiveChildIndex(), 0);
            assert.strictEqual(noodel.getRoot().getChild(1).getActiveChild().getIndex(), 0);
            assert.isTrue(noodel.getRoot().getChild(1).getChild(0).isActive());
        });
        it('should default active child to null for noode without children', function () {
            assert.strictEqual(noodel.getRoot().getChild(0).getActiveChildIndex(), null);
            assert.strictEqual(noodel.getRoot().getChild(0).getActiveChild(), null);
        });
        it('should return null for non-existent child', function () {
            assert.strictEqual(noodel.getRoot().getChild(12), null);
        });
        it('should focus on active noode of first level', function () {
            assert.strictEqual(noodel.getFocalNoode(), noodel.getRoot().getActiveChild());
            assert.strictEqual(noodel.getFocalParent(), noodel.getRoot());
        });
        it('should parse noode options', function () {
            let expected: NoodeOptions = {
                useResizeDetection: true,
                useBranchResizeDetection: false,
                useOverflowDetection: true,
                showBranchBackdrop: false,
                showChildIndicator: true,
                showOverflowIndicators: false
            };

            assert.deepStrictEqual(noodel.getRoot().getChild(7).getOptions(), expected);
        });
    });

    describe('from valid element', function () {
        it('should parse all noodes', function () {
            let noodel = new Noodel(document.getElementById("template"));
            assert.strictEqual(noodel.getNoodeCount(), 14);
        });
    });

    describe('from object', function () {
        let noodel: Noodel;

        beforeEach(function () {
            noodel = new Noodel([
                {
                    content: "<h2>Heading</h2>Some text node",
                }, 
                {
                    children: [
                        {},
                        {},
                        {
                            children: [{}, {}, {}]
                        }
                    ]
                }, 
                {
                    classNames: {
                        noode: "custom noode", 
                        contentBox: "custom content box",
                        branch: "custom branch", 
                        branchBackdrop: "custom branch backdrop",
                        childIndicator: "custom child indicator",
                        overflowIndicatorLeft: "custom overflow indicator left",
                        overflowIndicatorRight: "custom overflow indicator right",
                        overflowIndicatorTop: "custom overflow indicator top",
                        overflowIndicatorBottom: "custom child indicator bottom"
                    }
                },
                {
                    styles: {
                        noode: "color: red; border: solid blue 0px", 
                        contentBox: "color: red; border: solid blue 1px",
                        branch: "color: red; border: solid blue 2px", 
                        branchBackdrop: "color: red; border: solid blue 3px",
                        childIndicator: "color: red; border: solid blue 4px",
                        overflowIndicatorLeft: "color: red; border: solid blue 5px",
                        overflowIndicatorRight: "color: red; border: solid blue 6px",
                        overflowIndicatorTop: "color: red; border: solid blue 7px",
                        overflowIndicatorBottom: "color: red; border: solid blue 8px"
                    }
                },
                {
                    isActive: true
                },
                {
                    isActive: true
                },
                {
                    id: 'customId'
                },
                {
                    options: {
                        useResizeDetection: true,
                        useBranchResizeDetection: false,
                        useOverflowDetection: true,
                        showBranchBackdrop: false,
                        showChildIndicator: true,
                        showOverflowIndicators: false
                    }
                }
            ]);
        });

        it('should parse all noodes', function () {
            assert.strictEqual(noodel.getNoodeCount(), 14);
        });
        it('should parse all noodes on a level', function () {
            assert.strictEqual(noodel.getRoot().getChildCount(), 8);
        });
        it('should parse children noodes', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChildCount(), 3);
        });
        it('should parse deep children noodes', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChild(2).getChildCount(), 3);
        });
        it('should parse noode content from inner HTML', function () {
            assert.strictEqual((noodel.getRoot().getChild(0).getContent() as string).trim(), '<h2>Heading</h2>Some text node');
        });
        it('should parse custom class names', function () {
            let classNames = noodel.getRoot().getChild(2).getClassNames();
            let expected: NoodeCss = {
                noode: "custom noode", 
                contentBox: "custom content box",
                branch: "custom branch", 
                branchBackdrop: "custom branch backdrop",
                childIndicator: "custom child indicator",
                overflowIndicatorLeft: "custom overflow indicator left",
                overflowIndicatorRight: "custom overflow indicator right",
                overflowIndicatorTop: "custom overflow indicator top",
                overflowIndicatorBottom: "custom child indicator bottom"
            }
            assert.deepStrictEqual(classNames, expected);
        });
        it('should parse custom styles', function () {
            let styles = noodel.getRoot().getChild(3).getStyles();
            let expected: NoodeCss = {
                noode: "color: red; border: solid blue 0px", 
                contentBox: "color: red; border: solid blue 1px",
                branch: "color: red; border: solid blue 2px", 
                branchBackdrop: "color: red; border: solid blue 3px",
                childIndicator: "color: red; border: solid blue 4px",
                overflowIndicatorLeft: "color: red; border: solid blue 5px",
                overflowIndicatorRight: "color: red; border: solid blue 6px",
                overflowIndicatorTop: "color: red; border: solid blue 7px",
                overflowIndicatorBottom: "color: red; border: solid blue 8px"
            }
            assert.deepStrictEqual(styles, expected);
        });
        it('should parse custom ID', function () {
            assert.strictEqual(noodel.getRoot().getChild(6).getId(), 'customId');
        });
        it('should parse custom active child on first come basis', function () {
            assert.strictEqual(noodel.getRoot().getActiveChildIndex(), 4);
            assert.isTrue(noodel.getRoot().getChild(4).isActive());
            assert.isFalse(noodel.getRoot().getChild(5).isActive());
        });
        it('should default active child to 0 for noode with children', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getActiveChildIndex(), 0);
            assert.strictEqual(noodel.getRoot().getChild(1).getActiveChild().getIndex(), 0);
            assert.isTrue(noodel.getRoot().getChild(1).getChild(0).isActive());
        });
        it('should default active child to null for noode without children', function () {
            assert.strictEqual(noodel.getRoot().getChild(0).getActiveChildIndex(), null);
            assert.strictEqual(noodel.getRoot().getChild(0).getActiveChild(), null);
        });
        it('should return null for non-existent child', function () {
            assert.strictEqual(noodel.getRoot().getChild(12), null);
        });
        it('should focus on active noode of first level', function () {
            assert.strictEqual(noodel.getFocalNoode(), noodel.getRoot().getActiveChild());
            assert.strictEqual(noodel.getFocalParent(), noodel.getRoot());
        });
        it('should parse noode options', function () {
            let expected: NoodeOptions = {
                useResizeDetection: true,
                useBranchResizeDetection: false,
                useOverflowDetection: true,
                showBranchBackdrop: false,
                showChildIndicator: true,
                showOverflowIndicators: false
            };

            assert.deepStrictEqual(noodel.getRoot().getChild(7).getOptions(), expected);
        });
    });

    describe('without options', function () {
        it('should have default options', function () {
            let noodel = new Noodel([]);
            assert.deepStrictEqual(noodel.getOptions(), {
                visibleSubtreeDepth: 1,
                retainDepthOnTapNavigation: false,
                swipeMultiplierBranch: 1,
                swipeMultiplierTrunk: 1,
                snapMultiplierBranch: 1,
                snapMultiplierTrunk: 1,
                subtreeDebounceInterval: 360,
                useRouting: true,
                useKeyNavigation: true,
                useWheelNavigation: true,
                useSwipeNavigation: true,
                useTapNavigation: true,
                useInspectModeKey: true,
                useInspectModeDoubleTap: true,
                useResizeDetection: true,
                useOverflowDetection: false,
                showLimitIndicators: true,
                showBranchBackdrops: false,
                showChildIndicators: true,
                orientation: "ltr",
                branchDirection: "normal"
            });
        });
    });

    describe('with options', function () {
        it('should override default options', function () {
            let noodel = new Noodel([], {
                visibleSubtreeDepth: 2,
                retainDepthOnTapNavigation: true,
                swipeMultiplierBranch: 2,
                swipeMultiplierTrunk: 2,
                snapMultiplierBranch: 2,
                snapMultiplierTrunk: 2,
                subtreeDebounceInterval: 460,
                useRouting: false,
                useKeyNavigation: false,
                useWheelNavigation: false,
                useSwipeNavigation: false,
                useTapNavigation: false,
                useInspectModeKey: false,
                useInspectModeDoubleTap: false,
                useResizeDetection: false,
                useOverflowDetection: true,
                showLimitIndicators: false,
                showBranchBackdrops: true,
                showChildIndicators: false,
                orientation: "rtl",
                branchDirection: "reverse"
            });

            assert.deepStrictEqual(noodel.getOptions(), {
                visibleSubtreeDepth: 2,
                retainDepthOnTapNavigation: true,
                swipeMultiplierBranch: 2,
                swipeMultiplierTrunk: 2,
                snapMultiplierBranch: 2,
                snapMultiplierTrunk: 2,
                subtreeDebounceInterval: 460,
                useRouting: false,
                useKeyNavigation: false,
                useWheelNavigation: false,
                useSwipeNavigation: false,
                useTapNavigation: false,
                useInspectModeKey: false,
                useInspectModeDoubleTap: false,
                useResizeDetection: false,
                useOverflowDetection: true,
                showLimitIndicators: false,
                showBranchBackdrops: true,
                showChildIndicators: false,
                orientation: "rtl",
                branchDirection: "reverse"
            });
        });
    });
});