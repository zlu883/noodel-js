import NoodelNode from "../src/main/NoodelNode";
import Noodel from "../src/main/Noodel";

const assert = chai.assert;

describe('Node insert', function () {

    let noodel: Noodel;
    let firstNode: NoodelNode;
    let secondNode: NoodelNode;
    let thirdNode: NoodelNode;

    beforeEach(function() {
        noodel = new Noodel("#template");
        noodel.getRoot().setActiveChild(1);
        firstNode = noodel.getRoot().getChild(0);
        secondNode = noodel.getRoot().getChild(1);
        thirdNode = noodel.getRoot().getChild(2);
    });

    afterEach(function() {
        window.history.replaceState(null, '', window.location.href.split("#")[0]);
    });

    describe('insert at invalid index', function () {  
        it('should fail with error', function () {
            assert.throw(function(){noodel.getRoot().insertChildren([{}], 999)});
        });
    });

    describe('insert duplicate ID', function () {  
        it('should fail with error', function () {
            assert.throw(function(){noodel.getRoot().insertChildren([{id: "customId"}], 1)});
        });
    });

    describe('append nodes', function () {  
        it('should add to end of branch', function () {
            let inserted = noodel.getRoot().insertChildren([{}, {}, {}]);
            assert.strictEqual(inserted[2], noodel.getRoot().getChild(noodel.getRoot().getChildCount() - 1));
            assert.strictEqual(inserted[1], noodel.getRoot().getChild(noodel.getRoot().getChildCount() - 2));
            assert.strictEqual(inserted[0], noodel.getRoot().getChild(noodel.getRoot().getChildCount() - 3));
        });
    });

    describe('insert at active index', function () {  
        it('should insert properly', function () {
            let childCount = noodel.getRoot().getChildCount();
            let inserted = noodel.getRoot().insertChildren([{
                id: "insert1"
            }, {
                id: "insert2"
            }, {
                id: "insert3"
            }], 1);

            assert.strictEqual(noodel.getRoot().getChild(1), inserted[0]);
            assert.strictEqual(noodel.getRoot().getChild(2), inserted[1]);
            assert.strictEqual(noodel.getRoot().getChild(3), inserted[2]);

            assert.strictEqual(noodel.findNodeById("insert1"), inserted[0]);
            assert.strictEqual(noodel.findNodeById("insert2"), inserted[1]);
            assert.strictEqual(noodel.findNodeById("insert3"), inserted[2]);

            assert.strictEqual(noodel.getRoot().getChildCount(), childCount + 3);
        });
        it('should shift indices appropriately', function () {
            noodel.getRoot().insertChildren([{
                id: "insert1"
            }, {
                id: "insert2"
            }, {
                id: "insert3"
            }], 1);

            assert.strictEqual(firstNode.getIndex(), 0);
            assert.strictEqual(secondNode.getIndex(), 4);
            assert.strictEqual(thirdNode.getIndex(), 5);
        });
        it('should retain focal node', function () {
            noodel.getRoot().insertChildren([{
                id: "insert1"
            }, {
                id: "insert2"
            }, {
                id: "insert3"
            }], 1);

            assert.strictEqual(secondNode, noodel.getFocalNode());
        });
    });

    describe('insert before', function () {  
        it('should insert properly', function () {
            let childCount = noodel.getRoot().getChildCount();
            let inserted = secondNode.insertBefore([{
                id: "insert1"
            }, {
                id: "insert2"
            }, {
                id: "insert3"
            }]);

            assert.strictEqual(noodel.getRoot().getChild(1), inserted[0]);
            assert.strictEqual(noodel.getRoot().getChild(2), inserted[1]);
            assert.strictEqual(noodel.getRoot().getChild(3), inserted[2]);

            assert.strictEqual(noodel.findNodeById("insert1"), inserted[0]);
            assert.strictEqual(noodel.findNodeById("insert2"), inserted[1]);
            assert.strictEqual(noodel.findNodeById("insert3"), inserted[2]);

            assert.strictEqual(noodel.getRoot().getChildCount(), childCount + 3);
        });
    });

    describe('insert after', function () {  
        it('should insert properly', function () {
            let childCount = noodel.getRoot().getChildCount();
            let inserted = secondNode.insertAfter([{
                id: "insert1"
            }, {
                id: "insert2"
            }, {
                id: "insert3"
            }]);

            assert.strictEqual(noodel.getRoot().getChild(2), inserted[0]);
            assert.strictEqual(noodel.getRoot().getChild(3), inserted[1]);
            assert.strictEqual(noodel.getRoot().getChild(4), inserted[2]);

            assert.strictEqual(noodel.findNodeById("insert1"), inserted[0]);
            assert.strictEqual(noodel.findNodeById("insert2"), inserted[1]);
            assert.strictEqual(noodel.findNodeById("insert3"), inserted[2]);

            assert.strictEqual(noodel.getRoot().getChildCount(), childCount + 3);
        });
    });

    describe('insert deep tree', function () {  
        it('should insert properly', function () {
            let nodeCount = noodel.getNodeCount();
            let inserted = secondNode.insertAfter([{
                children: [{}, {
                    children: [{}, {}, {}]
                }, {}]
            }, {
                children: [{}, {
                    children: [{}, {}, {}]
                }, {}]
            }, {
                children: [{}, {
                    children: [{}, {}, {}]
                }, {}]
            }]);

            assert.strictEqual(inserted[0].getChildCount(), 3);
            assert.strictEqual(inserted[0].getChild(1).getChildCount(), 3);
            assert.strictEqual(inserted[1].getChildCount(), 3);
            assert.strictEqual(inserted[1].getChild(1).getChildCount(), 3);
            assert.strictEqual(inserted[2].getChildCount(), 3);
            assert.strictEqual(inserted[2].getChild(1).getChildCount(), 3);

            assert.strictEqual(noodel.getNodeCount(), nodeCount + 21);
        });
    });
});