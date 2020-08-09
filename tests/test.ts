import { describe, it } from 'mocha';
import { assert } from 'chai';
import Noodel from '../src/main/Noodel';

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(new Noodel({}).getRoot().getId(), "_9");
        });
    });
});


