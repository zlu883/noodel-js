import Noodel from "../src/main/Noodel";

const assert = chai.assert;

// Tests routing binding

describe('Routing', function () {

    afterEach(function() {
        window.history.replaceState(null, '', window.location.href.split("#")[0]);
    });

    describe('when enabled during init', function () {

        it('should focus on current hash', function () {
            window.location.hash = "customId";

            let noodel = new Noodel("#template", { useRouting : true });

            assert.strictEqual(noodel.getFocalNode().getId(), "customId");
        });
        it('should change focus if hash changes', function (done) {
            let noodel = new Noodel("#template", { useRouting : true });

            window.location.hash = "#customId";
            setTimeout(() => {
                try {
                    assert.strictEqual(noodel.getFocalNode().getId(), "customId");
                    done();
                }
                catch (err) {
                    done(err);
                }
            }, 60);
        });
        it('should change hash if focus changes', function () {
            let noodel = new Noodel("#template", { useRouting : true });

            noodel.findNodeById("customId").jumpToFocus();
            assert.strictEqual(window.location.hash, "#customId");
        });
    });

    describe('when disabled during init', function () {

        it('should not focus on current hash', function () {
            window.location.hash = "customId";

            let noodel = new Noodel("#template", { useRouting : false });

            assert.notStrictEqual(noodel.getFocalNode().getId(), "customId");
        });
        it('should not change focus if hash changes', function (done) {
            let noodel = new Noodel("#template", { useRouting : false });

            window.location.hash = "#customId";
            setTimeout(() => {
                try {
                    assert.notStrictEqual(noodel.getFocalNode().getId(), "customId");
                    done();
                }
                catch (err) {
                    done(err);
                }
            }, 60);
        });
        it('should not change hash if focus changes', function () {
            let noodel = new Noodel("#template", { useRouting : false });

            noodel.findNodeById("customId").jumpToFocus();
            assert.notStrictEqual(window.location.hash, "#customId");
        });
    });

    describe('when dynamically enabled', function () {

        it('should focus on current hash', function (done) {
            let noodel = new Noodel("#template", { useRouting : false });

            window.location.hash = "#customId";
            noodel.setOptions({useRouting: true});
            setTimeout(() => {
                try {
                    assert.strictEqual(noodel.getFocalNode().getId(), "customId");
                    done();
                }
                catch (err) {
                    done(err);
                }
            }, 60);
        });
    });
});