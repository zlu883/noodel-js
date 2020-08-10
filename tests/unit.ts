import "../node_modules/mocha/mocha.css";
import "./unit.css";
import mocha from 'mocha';
import { assert } from 'chai';
import Noodel from '../src/main/Noodel';

mocha.setup('bdd');

describe('Noodel init', function () {
    describe('from template', function () {
        it('should parse template and create noodel', function () {
            assert.isOk(new Noodel("#template").getRoot());
        });
    });

    describe('from object', function () {
        it('should parse object and create noodel', function () {
            assert.isOk(new Noodel({
                children: [{}, {}]
            }).getRoot());
        });
    });
});

mocha.run();


