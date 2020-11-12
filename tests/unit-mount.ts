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
                    assert.notExists(noodel.getRoot().getEl('branch'));
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
                    assert.isTrue(noodel.getRoot().getEl('branch').classList.contains('nd-branch'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should have noode element for a noode', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getFocalNoode().getEl().classList.contains('nd-noode'));
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
                    assert.isTrue(noodel.getFocalParent().getEl('branch').classList.contains('nd-branch-focal'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should have active class on active noode', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.isTrue(noodel.getFocalParent().getActiveChild().getEl().classList.contains('nd-noode-active'));
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });
        it('should render noode content inside content box', function (done) {
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
                    assert.isTrue(getComputedStyle(noodel.getFocalParent().getEl('branch')).display === 'flex');
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
                    assert.isTrue(getComputedStyle(noodel.getRoot().getChild(1).getEl('branch')).display === 'none');
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
            let def = noodel.getRoot().getDefinition();
            let focalNoode = noodel.getFocalNoode();

            noodel.on('mount', function () {
                try {
                    noodel.unmount();
                    setTimeout(() => {
                        try {
                            assert.deepStrictEqual(noodel.getRoot().getDefinition(), def);
                            assert.deepStrictEqual(noodel.getFocalNoode(), focalNoode);
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
                    noodel.getFocalNoode().setContent("aabbcc");
                    noodel.nextTick(() => {
                        try {
                            assert.strictEqual(noodel.getFocalNoode().getEl().querySelector('.nd-content-box').innerHTML, 'aabbcc');
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