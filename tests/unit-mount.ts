import Noodel from "../src/main/Noodel";

const assert = chai.assert;

describe('Lifecycle', function () {

    describe('mount with invalid selector', function () {
        it('should fail with error', function () {
            assert.throw(function() { new Noodel().mount("wrong") });
        });
    });

    describe('mount empty noodel', function () {
        let noodel: Noodel;

        beforeEach(function() {
            noodel = new Noodel();
            noodel.mount("#noodel");
        });

        afterEach(function() {
            noodel.unmount();
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });

        it('should create canvas element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getEl().classList.contains('nd-canvas'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should have no branch element on root', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.notExists(noodel.getRoot().getBranchEl());
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
    });

    describe('mount non-empty noodel', function () {
        let noodel: Noodel;

        beforeEach(function() {
            noodel = new Noodel("#template");
            noodel.mount("#noodel");
        });

        afterEach(function() {
            noodel.unmount();
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });

        it('should create canvas element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getEl().classList.contains('nd-canvas'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should have layout classes on canvas element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getEl().classList.contains('nd-canvas-ltr'));
                    assert.isTrue(noodel.getEl().classList.contains('nd-canvas-normal'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should have branch element on root', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getRoot().getBranchEl().classList.contains('nd-branch'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should have node element for a node', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getFocalNode().getEl().classList.contains('nd-node'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });

        it('should have focal class on focal branch', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getFocalParent().getBranchEl().classList.contains('nd-branch-focal'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should have active class on active node', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getFocalParent().getActiveChild().getEl().classList.contains('nd-node-active'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should render node content inside content box', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(noodel.getRoot().getChild(0).getEl().querySelector(".nd-content-box").innerHTML.trim(), "<h2>Heading</h2>Some text node");
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should show visible branch', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getFocalParent().isChildrenVisible());
                    assert.isTrue(getComputedStyle(noodel.getFocalParent().getBranchEl()).display === 'flex');
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should not show hidden branch', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isFalse(noodel.getRoot().getChild(1).isChildrenVisible());
                    assert.isTrue(getComputedStyle(noodel.getRoot().getChild(1).getBranchEl()).display === 'none');
                    done();
                }
                catch (err) {
                    done(err);
                }                    
            });
        });
    });

    describe('unmount', function () {
        let noodel: Noodel;

        beforeEach(function() {
            noodel = new Noodel("#template");
            noodel.mount("#noodel");
        });

        afterEach(function() {
            noodel.unmount();
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });

        it('should keep state after unmount', function (done) {
            let def = noodel.getRoot().extractDefinition(true);
            let focalNode = noodel.getFocalNode();

            noodel.on('mount', function () {
                try {
                    noodel.unmount();
                    setTimeout(() => {
                        try {
                            assert.deepStrictEqual(noodel.getRoot().extractDefinition(true), def);
                            assert.deepStrictEqual(noodel.getFocalNode(), focalNode);
                            done();
                        }
                        catch (err) {
                            done(err);
                        }
                    });
                }
                catch (err) {
                    done(err);
                }
            });
        });
    });

    describe('next tick', function () {
        let noodel: Noodel;

        beforeEach(function() {
            noodel = new Noodel('#template');
            noodel.mount("#noodel");
        });

        afterEach(function() {
            noodel.unmount();
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });

        it('should obtain updated DOM on nextTick', function (done) {
            noodel.on('mount', function () {
                try {
                    noodel.getFocalNode().setContent("aabbcc");
                    noodel.nextTick(() => {
                        try {
                            assert.strictEqual(noodel.getFocalNode().getEl().querySelector('.nd-content-box').innerHTML, 'aabbcc');
                            done();
                        }
                        catch(err) {
                            done(err);
                        }
                    });
                }
                catch (err) {
                    done(err);
                }
            });
        });
    });
});