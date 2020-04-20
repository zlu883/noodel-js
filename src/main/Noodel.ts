import Noode from '@/model/Noode';
import NoodelOptions from '@/model/NoodelOptions';
import { setupNoodel, parseHTMLToNoode } from '@/controllers/noodel-setup';
import NoodelTrunk from '@/view/NoodelTrunk.vue';
import Vue from 'vue';
import NoodelView from '@/model/NoodelView';

export default class Noodel {

    private store: NoodelView;
    private idCounter = {n: 0};

    constructor(root: Noode | Element | string, options?: NoodelOptions) {
        if (typeof root === "string") {
            root = document.querySelector(root);
        }

        if (typeof root !== "object") {
            throw new Error("Cannot render noodel: invalid root object or element");
        }

        if (root instanceof Element) {
            root = parseHTMLToNoode(root);
        }

        this.store = setupNoodel(this.idCounter, root, options);
    }

    mount(el: string | Element) {
        if (this.store.root.children.length === 0) {
            throw new Error("Cannot render noodel: root has no children");
        }

        Vue.config.productionTip = false;
    
        new Vue({
            render: h => h(NoodelTrunk, { props: { noodel: this }})
        }).$mount(el);
    }
}