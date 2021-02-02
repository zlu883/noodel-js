import HelloWorldComponent from './HelloWorld.vue';
import Noodel from "../src/main/Noodel";
import { createApp, defineComponent, h } from 'vue';

const assert = chai.assert;

// Tests using Vue components as node content

describe('Vue usage', function () {

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
            noodel.nextTick(function () {
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

    describe('Using noodel in Vue app', function () {

        let content = {
            component: HelloWorldComponent,
            props: {
                'text': 'world'
            },
            eventListeners: {
                'click': () => console.log('clicked')
            }
        };
        let noodel = new Noodel([
            {
                content: content
            }
        ]);
        let app;

        it('should render properly', function (done) {

            let App = defineComponent({
                render() {
                    return h(Noodel.VueComponent, {noodel: noodel.getState()})
                },
                mounted() {
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
                }
            });

            app = createApp(App)
            app.mount('#noodel');
        });

        after(() => {
            app.unmount('#noodel');
            window.history.replaceState(null, '', window.location.href.split("#")[0]);
        });
    });
});