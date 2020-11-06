import Noodel from "../src/main/Noodel";

const assert = chai.assert;

describe('Noodel init', function () {

    describe('from no param', function () {
        it('should create empty noodel with root', function () {
            assert.strictEqual(new Noodel().getRoot().getChildren().length, 0);
        });
    });

    describe('from invalid selector', function () {
        it('should fail with error', function () {
            assert.throw(function() { new Noodel("wrong") }, "Cannot create noodel: invalid root param");
        });
    });

    describe('from template', function () {
        let noodel: Noodel;

        beforeEach(function () {
            noodel = new Noodel("#template");
        });

        it('should create root with level 0', function () {
            assert.strictEqual(noodel.getRoot().getLevel(), 0);
        });
        it('should parse children of root', function () {
            assert.strictEqual(noodel.getRoot().getChildren().length, 3);
        });
        it('should parse grandchildren of root', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChildren().length, 2);
        });
        it('should create grandchildren with level 2', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChild(0).getLevel(), 2);
        });
        it('should parse specific ID of a noode', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getId(), '#2');
        });
        it('should parse content of a noode', function () {
            assert.strictEqual((noodel.getRoot().getChild(2).getContent() as string).trim(), '<h3>3</h3>');
        });
        it('should parse specified active child of noode', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getActiveChildIndex(), 1);
        });
        it('should parse custom classes of a noode', function () {
            let classNames = noodel.getRoot().getChild(2).getClassNames();
            assert.strictEqual(classNames.contentBox, 'super great awesome');
            assert.strictEqual(classNames.branch, 'super great fancy');
            assert.strictEqual(classNames.childIndicator, 'super great nice');
        });
        it('should parse custom styles of a noode', function () {
            let styles = noodel.getRoot().getChild(2).getStyles();
            assert.strictEqual(styles.contentBox, "color: red; border: solid blue 2px");
            assert.strictEqual(styles.branch, "color: blue; border: solid red 2px");
            assert.strictEqual(styles.childIndicator, "color: green; border: solid green 2px");
        });
    });

    describe('from object', function () {
        let noodel: Noodel;

        beforeEach(function () {
            noodel = new Noodel([
                {
                    content: "<h3>1</h3>",
                    classNames: {
                        contentBox: 'super great awesome'
                    },
                    styles: {
                        contentBox: 'color: red; border: solid blue 2px'
                    }
                }, 
                {
                    id: "#2",
                    content: "<h3>2</h3>",
                    children: [
                        {
                            content: "<h3>2/1</h3>",
                        },
                        {
                            content: "<h3>2/2</h3>",
                            isActive: true
                        }
                    ]
                }, 
                {
                    content: "<h3>3</h3>",
                    classNames: {
                        contentBox: "super great awesome",
                        branch: "super great fancy",
                        childIndicator: "super great nice"
                    },
                    styles: {
                        contentBox: "color: red; border: solid blue 2px",
                        branch: "color: blue; border: solid red 2px",
                        childIndicator: "color: green; border: solid green 2px"
                    } 
                }
            ]);
        });

        it('should create root with level 0', function () {
            assert.strictEqual(noodel.getRoot().getLevel(), 0);
        });
        it('should parse children of root', function () {
            assert.strictEqual(noodel.getRoot().getChildren().length, 3);
        });
        it('should parse grandchildren of root', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChildren().length, 2);
        });
        it('should create grandchildren with level 2', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getChild(0).getLevel(), 2);
        });
        it('should parse specific ID of a noode', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getId(), '#2');
        });
        it('should parse content of a noode"', function () {
            assert.strictEqual((noodel.getRoot().getChild(2).getContent() as string).trim(), '<h3>3</h3>');
        });
        it('should parse specified active child of noode', function () {
            assert.strictEqual(noodel.getRoot().getChild(1).getActiveChildIndex(), 1);
        });
        it('should parse custom classes of a noode', function () {
            let classNames = noodel.getRoot().getChild(2).getClassNames();
            assert.strictEqual(classNames.contentBox, 'super great awesome');
            assert.strictEqual(classNames.branch, 'super great fancy');
            assert.strictEqual(classNames.childIndicator, 'super great nice');
        });
        it('should parse custom styles of a noode', function () {
            let styles = noodel.getRoot().getChild(2).getStyles();
            assert.strictEqual(styles.contentBox, "color: red; border: solid blue 2px");
            assert.strictEqual(styles.branch, "color: blue; border: solid red 2px");
            assert.strictEqual(styles.childIndicator, "color: green; border: solid green 2px");
        });
    });
});