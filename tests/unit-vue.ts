import HelloWorldComponent from './HelloWorld.vue';
import Noodel from "../src/main/Noodel";

const assert = chai.assert;

// Tests noodel initialization and getters

describe('Vue content', function () {

    describe('Vue component as content', function () {

        let noodel: Noodel;
        let content = {
            component: HelloWorldComponent,
            props: {
                'text': 'world'
            },
            eventListeners: {
                'click': () => console.log('clicked')
            }
        };

        before(() => {
            noodel = new Noodel([
                {
                    content: content
                }
            ]);
            
            noodel.mount('#noodel');
        })

        it('should render properly', function (done) {
            noodel.on('mount', function () {
                try {
                    assert.strictEqual(
                        noodel.getRoot().getChild(0).getEl().querySelector('.nd-content-box').innerHTML,
                        '<div>Hello world</div>'
                    );
                    done();
                }
                catch (err) {
                    done(err);
                }                    
            });
        });

        it('should respond to prop change', function (done) {
            content.props.text = 'noodel';
            noodel.getRoot().getChild(0).setContent(content);

            noodel.nextTick(() => {
                try {
                    assert.strictEqual(
                        noodel.getRoot().getChild(0).getEl().querySelector('.nd-content-box').innerHTML,
                        '<div>Hello noodel</div>'
                    );
                    done();
                }
                catch (err) {
                    done(err);
                }  
            });
        });

        after(() => {
            noodel.unmount();
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });
    });
});