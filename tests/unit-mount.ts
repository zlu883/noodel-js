import Noodel from "../src/main/Noodel";

const assert = chai.assert;

describe('Noodel mount and unmount', function () {

    describe('mount with invalid selector', function () {
        it('should fail with error', function () {
            assert.throw(function() { new Noodel().mount("wrong") });
        });
    });

    describe('mount empty noodel', function () {
        let noodel;

        beforeEach(function() {
            noodel = new Noodel();
        });

        afterEach(function() {
            noodel.unmount();
            let div = document.createElement('div');
            div.id = 'noodel';
            document.getElementById("mocha").before(div);
        });

        it('should create canvas element', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-canvas").length, 1);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should have no noode element', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-noode").length, 0);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should have no branch element', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-branch-box").length, 0);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
    });

    describe('mount non-empty noodel', function () {
        let noodel;

        beforeEach(function() {
            noodel = new Noodel("#template");
        });

        afterEach(function() {
            noodel.unmount();
            let div = document.createElement('div');
            div.id = 'noodel';
            document.getElementById("mocha").before(div);
        });

        it('should create canvas element', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-canvas").length, 1);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should have 5 noode elements', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-noode").length, 5);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should have 2 branch elements', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-branch-box").length, 2);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should have 1 focal branch element', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-branch-box-focal").length, 1);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should have 2 active noode elements', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelectorAll(".nd-noode-active").length, 2);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should render noode content', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.strictEqual(document.querySelector(".nd-noode").innerHTML.trim(), "<h2>1</h2>");
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should show visible branch', function (done) {
            noodel.setOptions({
                onMount: function () {
                    try {
                        assert.notStrictEqual(getComputedStyle(document.querySelectorAll(".nd-branch-box")[0]).display, 'none');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            })
            noodel.mount("#noodel");
        });
        it('should not show hidden branch', function (done) {
            noodel.setOptions({
                
                onMount: function () {
                    try {
                        // at this moment in time the hidden branches are actually in "disappear" transition due to initial render
                        // so actually does not have display: none - maybe "correct" this behaviour in future
                        assert.strictEqual(getComputedStyle(document.querySelectorAll(".nd-branch-box")[1]).opacity, '0');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }                    
                }
            })
            noodel.mount("#noodel");
        });
    });
});