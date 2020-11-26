import Noodel from "../src/main/Noodel";
import '../src/styles/noodel.css';
import '../src/styles/noodel-default.css';

let noodel = new Noodel("#template", {
    visibleSubtreeDepth: 1,
});

let sizeChangeNode = noodel.findNodeById("sizeChange");

sizeChangeNode.on("enterFocus", () => {
    console.log("enter");
    sizeChangeNode.setStyles({
        contentBox: "height: 200px; width: 200px"
    });
});
sizeChangeNode.on("exitFocus", () => sizeChangeNode.setStyles({
    contentBox: "height: 150px; width: 150px"
}));

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

let fp = 0.25;

document.getElementById("setFocalPosition").addEventListener("click", () => {
    if (fp === 0.25) {
        fp = 0.75;
    }
    else {
        fp = 0.25;
    }

    noodel.setOptions({
        focalPositionTrunk: (s) => s * fp,
        focalPositionBranch: (s) => s * fp
    });
});

let fa = 0.1;

document.getElementById("setFocalAnchor").addEventListener("click", () => {
    if (fa === 0.1) {
        fa = 0.9;
    }
    else {
        fa = 0.1;
    }

    noodel.setOptions({
        focalAnchorTrunk: (s) => s * fa,
        focalAnchorBranch: (s) => s * fa
    });
});

document.getElementById("deleteFocalNode").addEventListener("click", () => {
    noodel.getFocalNode().deleteSelf();
});

document.getElementById("deleteFocalBranch").addEventListener("click", () => {
    noodel.getFocalParent().deleteChildren(0, Number.MAX_SAFE_INTEGER);
});

document.getElementById("deleteNodeBefore").addEventListener("click", () => {
    noodel.getFocalNode().deleteBefore(1);
});

document.getElementById("deleteNodeAfter").addEventListener("click", () => {
    noodel.getFocalNode().deleteAfter(1);
});

document.getElementById("deleteActiveChild").addEventListener("click", () => {
    let c = noodel.getFocalNode().getActiveChild();
    if (c) c.deleteSelf();
});

document.getElementById("deleteMultipleBefore").addEventListener("click", () => {
    noodel.getFocalNode().deleteBefore(3);
});

document.getElementById("deleteMultipleAfter").addEventListener("click", () => {
    noodel.getFocalNode().deleteAfter(3);
});

// animation behaviour for deleting multiple items is slightly different depending on
// whether the call is singular or broken down into multiple calls
// due to the fact that branchRelativeOffset cannot be adjusted for deleted items
document.getElementById("deleteMultipleChild").addEventListener("click", () => {
    // let c = noodel.getFocalNode().getActiveChild();
    // c.removeAfter(2);
    // if (c) c.removeSelf();
    noodel.getFocalNode().deleteChildren(0, 3);
});

document.getElementById("appendMultipleChild").addEventListener("click", () => {
    noodel.getFocalNode().insertChildren([{}, {}, {}]);
});

document.getElementById("insertMultipleChild").addEventListener("click", () => {
    noodel.getFocalNode().insertChildren([{}, {}, {}], 2);
});