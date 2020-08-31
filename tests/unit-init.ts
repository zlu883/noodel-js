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
        it('should parse custom classes (string) of a noode', function () {
            assert.deepStrictEqual(noodel.getRoot().getChild(2).getClass(), ['super', 'great', 'awesome']);
        });
        it('should parse custom style (string) of a noode', function () {
            assert.deepStrictEqual(noodel.getRoot().getChild(2).getStyle(), {'color': 'red', 'border': 'solid blue 2px'});
        });
    });

    describe('from object', function () {
        let noodel: Noodel;

        beforeEach(function () {
            noodel = new Noodel([
                {
                    content: "<h3>1</h3>",
                    className: ["super", "great", "awesome"],
                    style: { color: 'red', border: 'solid blue 2px' }
                }, 
                {
                    id: "#2",
                    content: "<h3>2</h3>",
                    activeChildIndex: 1,
                    children: [
                        {
                            content: "<h3>2/1</h3>"
                        },
                        {
                            content: "<h3>2/2</h3>"
                        }
                    ]
                }, 
                {
                    content: "<h3>3</h3>",
                    className: "super great awesome",
                    style: "color: red; border: solid blue 2px"
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
        it('should parse custom classes (string) of a noode', function () {
            assert.deepStrictEqual(noodel.getRoot().getChild(2).getClass(), ['super', 'great', 'awesome']);
        });
        it('should parse custom style (string) of a noode', function () {
            assert.deepStrictEqual(noodel.getRoot().getChild(2).getStyle(), {'color': 'red', 'border': 'solid blue 2px'});
        });
        it('should parse custom classes (array) of a noode', function () {
            assert.deepStrictEqual(noodel.getRoot().getChild(0).getClass(), ['super', 'great', 'awesome']);
        });
        it('should parse custom style (object) of a noode', function () {
            assert.deepStrictEqual(noodel.getRoot().getChild(0).getStyle(), {'color': 'red', 'border': 'solid blue 2px'});
        });
    });
});