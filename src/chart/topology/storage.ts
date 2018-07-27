namespace storage {
    export interface NodeEntity extends d3.SimulationNodeDatum {
        id: string;
        name: string;
        type: string;
        active: boolean;
        connected: boolean;
        source?: Array<any>;
        target?: Array<any>;
        totalCount?: number;
        layerIndex?: number;
        childNodes?: Array<NodeEntity>;
        expand?: boolean;
    }
    export function isNodeEntity(object): object is NodeEntity {
        return object && object.connected !== undefined;
    }
}
export default storage;
