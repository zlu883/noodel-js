import NoodeView from '@/model/NoodeView';

export default class IdRegister {

    idCount = 0;
    idMap: Map<string, NoodeView> = new Map([]);

    generateNoodeId() {
        this.idCount++;
        return '_' + this.idCount.toString();
    }

    registerNoode(id: string, noode: NoodeView) {
        if (this.idMap.has(id)) {
            throw new Error("Cannot register new noode: duplicate ID");
        }

        this.idMap.set(id, noode);
    }

    unregisterNoode(id: string) {
        this.idMap.delete(id);
    }

    findNoode(id: string) {
        return this.idMap.get(id);
    }
}