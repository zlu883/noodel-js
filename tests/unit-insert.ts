import Noode from "../src/main/Noode";
import Noodel from "../src/main/Noodel";

const assert = chai.assert;

describe('Noode insert', function () {

    let noodel: Noodel;
    let firstNoode: Noode;
    let secondNoode: Noode;
    let thirdNoode: Noode;

    beforeEach(function() {
        noodel = new Noodel("#template");
        noodel.getRoot().setActiveChild(1);
        firstNoode = noodel.getRoot().getChild(0);
        secondNoode = noodel.getRoot().getChild(1);
        thirdNoode = noodel.getRoot().getChild(2);
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

            assert.strictEqual(firstNoode.getIndex(), 0);
            assert.strictEqual(secondNoode.getIndex(), 2);
            assert.strictEqual(thirdNoode.getIndex(), 3);
        });
        it('should retain focal noode', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 1);

            assert.strictEqual(secondNoode, noodel.getFocalNoode());
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
            assert.strictEqual(firstNoode.getIndex(), 1);
            assert.strictEqual(secondNoode.getIndex(), 2);
            assert.strictEqual(thirdNoode.getIndex(), 3);
        });
        it('should retain focal noode', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 0);
            assert.strictEqual(secondNoode, noodel.getFocalNoode());
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
            assert.strictEqual(firstNoode.getIndex(), 0);
            assert.strictEqual(secondNoode.getIndex(), 1);
            assert.strictEqual(thirdNoode.getIndex(), 2);
        });
        it('should retain focal noode', function () {
            noodel.getRoot().insertChildren([{
                id: "insert"
            }], 3);
            assert.strictEqual(secondNoode, noodel.getFocalNoode());
        });
    });
});