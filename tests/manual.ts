import Noodel from "../src/main/Noodel";

let noodel = new Noodel("#template");

noodel.mount("#noodel");

document.getElementById("setRtl").addEventListener("click", () => {
    noodel.setOptions({
        orientation: 'rtl'
    })
});

document.getElementById("setLtr").addEventListener("click", () => {
    noodel.setOptions({
        orientation: 'ltr'
    })
});

document.getElementById("setTtb").addEventListener("click", () => {
    noodel.setOptions({
        orientation: 'ttb'
    })
});

document.getElementById("setBtt").addEventListener("click", () => {
    noodel.setOptions({
        orientation: 'btt'
    })
});

document.getElementById("setNormal").addEventListener("click", () => {
    noodel.setOptions({
        branchDirection: 'normal'
    })
});

document.getElementById("setReversed").addEventListener("click", () => {
    noodel.setOptions({
        branchDirection: 'reversed'
    })
});