import Noodel from "../src/main/Noodel";
import '../src/styles/noodel.css';
import '../src/styles/noodel-default.css';

let noodel = new Noodel("#template", {
    visibleSubtreeDepth: 3,
    showOverflowIndicators: true,
    showBranchBackdrops: true
});

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
        branchDirection: 'reverse'
    })
});

document.getElementById("deleteFocalNoode").addEventListener("click", () => {
    noodel.getFocalNoode().deleteSelf();
});

document.getElementById("deleteFocalBranch").addEventListener("click", () => {
    noodel.getFocalParent().deleteChildren(0, Number.MAX_SAFE_INTEGER);
});

document.getElementById("deleteNoodeBefore").addEventListener("click", () => {
    noodel.getFocalNoode().deleteBefore(1);
});

document.getElementById("deleteNoodeAfter").addEventListener("click", () => {
    noodel.getFocalNoode().deleteAfter(1);
});

document.getElementById("deleteActiveChild").addEventListener("click", () => {
    let c = noodel.getFocalNoode().getActiveChild();
    if (c) c.deleteSelf();
});

document.getElementById("deleteMultipleBefore").addEventListener("click", () => {
    noodel.getFocalNoode().deleteBefore(3);
});

document.getElementById("deleteMultipleAfter").addEventListener("click", () => {
    noodel.getFocalNoode().deleteAfter(3);
});

// animation behaviour for deleting multiple items is slightly different depending on
// whether the call is singular or broken down into multiple calls
// due to the fact that branchRelativeOffset cannot be adjusted for deleted items
document.getElementById("deleteMultipleChild").addEventListener("click", () => {
    // let c = noodel.getFocalNoode().getActiveChild();
    // c.removeAfter(2);
    // if (c) c.removeSelf();
    noodel.getFocalNoode().deleteChildren(0, 3);
});

document.getElementById("appendMultipleChild").addEventListener("click", () => {
    noodel.getFocalNoode().insertChildren([{}, {}, {}]);
});

document.getElementById("insertMultipleChild").addEventListener("click", () => {
    noodel.getFocalNoode().insertChildren([{}, {}, {}], 2);
});