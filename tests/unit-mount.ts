import Noodel from "../src/main/Noodel";

const assert = chai.assert;

describe('Noodel lifecycle', function () {

    describe('mount with invalid selector', function () {
        it('should fail with error', function () {
            assert.throw(function() { new Noodel().mount("wrong") });
        });
    });

    describe('mount empty noodel', function () {
        let noodel: Noodel;

        beforeEach(function() {
            noodel = new Noodel();
        });

        afterEach(function() {
            noodel.unmount();
            let div = document.createElement('div');
            div.id = 'noodel';
            document.getElementById("mocha").before(div);
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });

        it('should create canvas element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-canvas").length, 1);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should have no noode element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-noode").length, 0);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should have no branch element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-branch").length, 0);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
    });

    describe('mount non-empty noodel', function () {
        let noodel: Noodel;

        beforeEach(function() {
            noodel = new Noodel("#template");
        });

        afterEach(function() {
            noodel.unmount();
            let div = document.createElement('div');
            div.id = 'noodel';
            document.getElementById("mocha").before(div);
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });

        it('should create canvas element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-canvas").length, 1);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should have 7 noode elements', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-noode").length, 7);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should have 4 branch elements', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-branch").length, 4);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should have 1 focal branch element', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-branch-focal").length, 1);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should have 4 active noode elements', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelectorAll(".nd-noode-active").length, 4);
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should render noode content', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(document.querySelector(".nd-noode").innerHTML.trim(), "<h2>1</h2>");
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should show visible branch', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.notStrictEqual(getComputedStyle(document.querySelectorAll(".nd-branch")[0]).display, 'none');
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
            noodel.mount("#noodel");
        });
        it('should not show hidden branch', function (done) {
            noodel.on('mount', function () {
                try {
                    // at this moment in time the hidden branches are actually in "disappear" transition due to initial render
                    // so actually does not have display: none - maybe improve this behaviour in future
                    assert.strictEqual(getComputedStyle(noodel.findNoodeById("#2").getEl('branch')).opacity, '0');
                    done();
                }
                catch (err) {
                    done(err);
                }                    
            });
            noodel.mount("#noodel");
        });
    });

    describe('unmount/remount noodel', function () {
        let noodel: Noodel;

        beforeEach(function() {
            noodel = new Noodel("#template");
        });

        afterEach(function() {
            noodel.unmount();
            let div = document.createElement('div');
            div.id = 'noodel';
            document.getElementById("mocha").before(div);
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });

        it('should unmount and remount while keeping state', function (done) {
            let isRemount = false;

            noodel.on('mount', function () {
                if (isRemount) {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-canvas").length, 1);
                        assert.strictEqual(noodel.getFocalNoode().getId(), "#2");
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
                else {
                    try {
                        noodel.findNoodeById("#2").jumpToFocus();
                        noodel.unmount();
                        assert.strictEqual(document.querySelectorAll(".nd-canvas").length, 0);
                        
                        let div = document.createElement('div');
                        div.id = 'noodel';
                        document.getElementById("mocha").before(div);
                        
                        isRemount = true;
                        noodel.mount("#noodel");
                    }
                    catch (err) {
                        done(err);
                    }
                }
            });
            noodel.mount("#noodel");
        });
    });
});