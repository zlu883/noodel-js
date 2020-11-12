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
            assert.throw(function(){noodel.getRoot().insertChildren([{}], 6)});
        });
    });

    describe('insert single at active index', function () {  
        it('should insert properly', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 1);

            assert.strictEqual(noodel.getRoot().getChild(1).getId(), "insert");
            assert.strictEqual(noodel.getRoot().getChildCount(), 4);
        });
        it('should shift indices appropriately', function () {

            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 1);

            assert.strictEqual(firstNode.getIndex(), 0);
            assert.strictEqual(secondNode.getIndex(), 2);
            assert.strictEqual(thirdNode.getIndex(), 3);
        });
        it('should retain focal node', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 1);

            assert.strictEqual(secondNode, noodel.getFocalNode());
        });
    });

    describe('insert single before active index', function () {   

        it('should insert properly', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 0);
            assert.strictEqual(noodel.getRoot().getChild(0).getId(), "insert");
            assert.strictEqual(noodel.getRoot().getChildCount(), 4);
        });
        it('should shift indices appropriately', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 0);
            assert.strictEqual(firstNode.getIndex(), 1);
            assert.strictEqual(secondNode.getIndex(), 2);
            assert.strictEqual(thirdNode.getIndex(), 3);
        });
        it('should retain focal node', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 0);
            assert.strictEqual(secondNode, noodel.getFocalNode());
        });
    });

    describe('insert single after active index', function () {   

        it('should insert properly', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 3);
            assert.strictEqual(noodel.getRoot().getChild(3).getId(), "insert");
            assert.strictEqual(noodel.getRoot().getChildCount(), 4);
        });
        it('should shift indices appropriately', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 3);
            assert.strictEqual(firstNode.getIndex(), 0);
            assert.strictEqual(secondNode.getIndex(), 1);
            assert.strictEqual(thirdNode.getIndex(), 2);
        });
        it('should retain focal node', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 3);
            assert.strictEqual(secondNode, noodel.getFocalNode());
        });
    });
});