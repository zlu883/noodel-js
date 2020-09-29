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
})