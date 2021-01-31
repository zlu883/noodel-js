import Noodel from "../src/main/Noodel";
import '../src/styles/noodel.css';
import '../src/styles/noodel-default.css';

let noodel = new Noodel("#template", {
    visibleSubtreeDepth: 4,
    useFlipAnimation: true
});

let sizeChangeNode = noodel.findNodeById("sizeChange");
let sizeChangeTriggerNode = noodel.findNodeById("sizeChangeTrigger");

sizeChangeTriggerNode.on("enterFocus", () => {
    sizeChangeNode.setStyles({
        contentBox: "height: 200px; width: 200px"
    });
    sizeChangeNode.realign();
    sizeChangeNode.getParent().realignBranch();
});
sizeChangeTriggerNode.on("exitFocus", () => {
    sizeChangeNode.setStyles({
        contentBox: "height: 150px; width: 150px"
    });
    sizeChangeNode.realign();
    sizeChangeNode.getParent().realignBranch();
});

noodel.mount("#noodel");

let x = true;

document.getElementById("changeElSize").addEventListener("click", () => {
    if (x) {
        sizeChangeNode.getEl().style.height = "200px";
        sizeChangeNode.getEl().style.width = "200px";
        x = false;
        sizeChangeNode.realign();
        sizeChangeNode.getParent().realignBranch();
    }
    else {
        sizeChangeNode.getEl().style.height = "150px";
        sizeChangeNode.getEl().style.width = "150px";
        sizeChangeNode.realign();
        sizeChangeNode.getParent().realignBranch();
        x = true;
    }
});

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

document.getElementById("setFocalOffset").addEventListener("click", () => {
    if (fp === 0.25) {
        fp = 0.75;
    }
    else {
        fp = 0.25;
    }

    noodel.setOptions({
        focalOffsetTrunk: (s) => s * fp,
        focalOffsetBranch: (s) => s * fp
    });
});

let fa = 0.1;

document.getElementById("setAnchorOffset").addEventListener("click", () => {
    if (fa === 0.1) {
        fa = 0.9;
    }
    else {
        fa = 0.1;
    }

    noodel.setOptions({
        anchorOffsetTrunk: (s) => s * fa,
        anchorOffsetBranch: (s) => s * fa
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

document.getElementById("deleteNode2").addEventListener("click", () => {
    let c = noodel.findNodeById("2");
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
    noodel.getFocalNode().deleteChildren(0, 1);
    noodel.getFocalNode().deleteChildren(0, 1);
    noodel.getFocalNode().deleteChildren(0, 1);
    //noodel.getFocalNode().deleteChildren(1, 3);
});

document.getElementById("appendMultipleChild").addEventListener("click", () => {
    noodel.getFocalNode().insertChildren([{}, {}, {}]);
});

document.getElementById("insertMultipleChild").addEventListener("click", () => {
    noodel.getFocalNode().insertChildren([{}, {}, {}], 2);
});

document.getElementById("insertBefore").addEventListener("click", () => {
    noodel.getFocalNode().insertBefore([{}]);
    noodel.nextTick(() => noodel.moveBack(1))
});

document.getElementById("insertAfter").addEventListener("click", () => {
    noodel.getFocalNode().insertAfter([{}]);
    noodel.nextTick(() => noodel.moveForward(1))
});

document.getElementById("setStyle").addEventListener("click", () => {
    noodel.findNodeById("setStyle").setStyles({
        branch: "background-color: green" 
    });
});

document.getElementById("reorder").addEventListener("click", () => {
    noodel.getFocalParent().reorderChildren(children => {
        for (let i = children.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [children[i], children[j]] = [children[j], children[i]];
        }

        return children;
    });
});