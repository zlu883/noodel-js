import NoodeView from '@/model/NoodeView';
import NoodeDefinition from '@/model/NoodeDefinition';
import Noodel from './Noodel';
import { setActiveChild as _setActiveChild, setActiveSubtreeVisibility, setActiveChild, setFocalParent } from '../controllers/noodel-mutate';
import { buildNoodeView, extractNoodeDefinition } from '@/controllers/noodel-setup';
import { isRoot, getPath as _getPath } from '@/util/getters';
import { alignBranchToIndex } from '@/controllers/noodel-align';
import { forceReflow, setSiblingInvertOnNoodeSizeChange } from '@/controllers/noodel-animate';
import Vue from 'vue';

export default class Noode {

    view: NoodeView;
    noodel: Noodel;

    constructor(view: NoodeView, noodel: Noodel) {
        this.view = view;
        this.noodel = noodel;
    }

    getParent(): Noode {
        if (!this.view.parent) return null;
        return new Noode(this.view.parent, this.noodel);
    }

    getPath(): number[] {
        return _getPath(this.view);
    }

    getDefinition(): NoodeDefinition {
        return extractNoodeDefinition(this.view);
    }

    getChild(index: number): Noode {
        if (typeof index !== "number" || index < 0 || index >= this.view.children.length) {
            return null;
        }

        return new Noode(this.view.children[index], this.noodel);
    }

    getChildren(): Noode[] {
        return this.view.children.map(c => new Noode(c, this.noodel));
    }

    getId(): string {
        return this.view.id;
    }

    setId(id: string) {
        if (id === this.view.id) return;
        this.noodel.idRegister.registerNoode(id, this.view);
        this.noodel.idRegister.unregisterNoode(this.view.id);
        this.view.id = id;
    }

    getContent(): string {
        return this.view.content;
    }

    setContent(content: string) {
        this.view.content = content;
    }

    getIndex(): number {
        return this.view.index;
    }

    getLevel(): number {
        return this.view.level;
    }

    getActiveChildIndex(): number {
        return this.view.activeChildIndex;
    }

    getActiveChild(): Noode {
        if (this.view.activeChildIndex === null) return null;
        return new Noode(this.view.children[this.view.activeChildIndex], this.noodel);
    }

    setActiveChild(index: number) {
        if (typeof index !== "number" || index < 0 || index >= this.view.children.length) {
            console.warn("Cannot set active child: noode has no children or invalid index");
            return;
        }
        
        _setActiveChild(this.view, index);
        alignBranchToIndex(this.view, index);
        forceReflow();
    }

    addChild(childDef: NoodeDefinition, index?: number): Noode {
        return this.addChildren([childDef], index)[0] || null;
    }

    addChildren(childDefs: NoodeDefinition[], index?: number): Noode[] {
        if (typeof index === "number" && (index < 0 || index > this.view.children.length)) {
            console.warn("Cannot add child: invalid index");
            return [];
        }

        if (typeof index !== "number") {
            index = this.view.children.length;
        }

        let children = childDefs.map((def, pos) => {
            let child = buildNoodeView(
                this.noodel.idRegister,
                def,
                this.view.level + 1,
                index + pos,
                this.view
            )

            child.trunkRelativeOffset = this.view.trunkRelativeOffset + this.view.branchSize;
            child.branchRelativeOffset = index > 0 ? 
                this.view.children[index - 1].branchRelativeOffset + this.view.children[index - 1].size :
                0;

            return child;
        });

        if (typeof index !== 'number') {
            this.view.children.push(...children);
        }
        else {
            this.view.children.splice(index, 0, ...children);

            if (this.view.activeChildIndex !== null && index <= this.view.activeChildIndex) {
                this.view.activeChildIndex += children.length;
            }

            for (let i = index + childDefs.length; i < this.view.children.length; i++) {
                this.view.children[i].index += children.length;
            }
        }

        if (this.view.children.length === childDefs.length) {
            _setActiveChild(this.view, 0);
        }

        if (this.view.isActive && (isRoot(this.view) || this.view.parent.isChildrenVisible)) {
            setActiveSubtreeVisibility(this.noodel.getFocalParent().view, true, this.noodel.store.options.visibleSubtreeDepth);
        }

        return children.map(c => new Noode(c, this.noodel));
    }

    removeChild(index: number): NoodeDefinition {
        return this.removeChildren(index, 1)[0] || null;
    }

    removeChildren(index: number, count: number): NoodeDefinition[] {
        if (typeof index !== "number" || typeof count !== "number" || index < 0 || index >= this.view.children.length) {
            console.warn("Cannot remove child noode(s): invalid index or count");
            return [];
        }

        let deletedNoodes = this.view.children.splice(index, count);

        if (index + count <= this.view.activeChildIndex) { // deletion before active child
            this.view.activeChildIndex -= count;
        }
        else if (index <= this.view.activeChildIndex) { // deletion includes active child
            if (this.view.children.length === count) {
                _setActiveChild(this.view, null);
            }
            else if (index + count < this.view.children.length) {
                _setActiveChild(this.view, this.view.activeChildIndex);
            }
            else {
                _setActiveChild(this.view, index - 1);
            }

            if (this.view.isChildrenVisible) {
                if (this.view.level <= this.noodel.store.focalLevel && this.view.children.length === 0) {
                    //setFocalParent(this.view.level - 1);
                }
                else if (this.view.level < this.noodel.store.focalLevel) {
                    //moveToTargetLevel = this.view.level;
                }
            }
        }
        else { // deletion after active child
            // do nothing
        }

        // update sibling indices
        for (let i = index; i < this.view.children.length; i++) {
            this.view.children[i].index -= count;
        }

        if (this.view.activeChildIndex !== null) {
            // if there are still children, align branch
            let targetOffset = 0;

            for (let i = 0; i < this.view.activeChildIndex; i++) {
                targetOffset -= this.view.children[i].size;
            }

            targetOffset -= this.view.children[this.view.activeChildIndex].size / 2;
            this.view.childBranchOffset = targetOffset;
            this.view.childBranchOffsetAligned = this.view.children[this.view.activeChildIndex].size / 2;
        }
        else {
            // if no more children, clear branch position and size values
            this.view.childBranchOffset = 0;
            this.view.childBranchOffsetAligned = 0;
            this.view.branchSize = 0;            
        }

        // if (moveToTargetLevel !== null) {
        //     let targetOffset = 0;
        //     let currentBranch = this.noodel.store.root;

        //     for (let i = 0; i < moveToTargetLevel; i++) {
        //         targetOffset -= currentBranch.branchSize;
        //         currentBranch = currentBranch.children[currentBranch.activeChildIndex];
        //     }

        //     targetOffset -= currentBranch.branchSize / 2;

        //     this.noodel.store.trunkOffset = targetOffset;
        //     this.noodel.store.panOffsetOrigin = targetOffset;
        //     this.noodel.store.trunkOffsetAligned = currentBranch.branchSize / 2;
        //     this.noodel.store.focalParent.isFocalParent = false;
        //     this.noodel.store.focalParent = currentBranch;
        //     this.noodel.store.focalParent.isFocalParent = true;
        //     setActiveSubtreeVisibility(currentBranch, true, this.noodel.store.options.visibleSubtreeDepth);
        // }

        return deletedNoodes.map(n => extractNoodeDefinition(n));
    }
}