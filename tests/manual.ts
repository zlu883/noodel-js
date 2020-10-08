import Noodel from "../src/main/Noodel";

let noodel = new Noodel("#template", {visibleSubtreeDepth: 1});

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

document.getElementById("deleteFocalNoode").addEventListener("click", () => {
    noodel.getFocalNoode().removeSelf();
});

document.getElementById("deleteFocalBranch").addEventListener("click", () => {
    noodel.getFocalParent().removeChildren(0, Number.MAX_SAFE_INTEGER);
});

document.getElementById("deleteNoodeBefore").addEventListener("click", () => {
    noodel.getFocalNoode().removeBefore(1);
});

document.getElementById("deleteNoodeAfter").addEventListener("click", () => {
    noodel.getFocalNoode().removeAfter(1);
});

document.getElementById("deleteActiveChild").addEventListener("click", () => {
    let c = noodel.getFocalNoode().getActiveChild();
    if (c) c.removeSelf();
});