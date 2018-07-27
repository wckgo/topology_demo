export interface NodeEntity {
    id: string;
    name: string;
    type: string;
    totalCount?: number;
    colorIndex?: number;
    extend?: boolean;
    size?: number;
    links?: LinkEntity[];

}

export interface Node extends d3.HierarchyNode<NodeEntity>, d3.SimulationNodeDatum {
    r?: number;
    extend?: boolean;
}

export interface MetaData {
    nodes: NodeEntity[];
    links: Array<{ source, target }>;
}

export interface LinkEntity {
    source: d3.HierarchyNode<NodeEntity>;
    target: d3.HierarchyNode<NodeEntity>;
}

export interface ForceCluster extends d3.Force<d3.SimulationNodeDatum, null> {
    strength(strength: number): this;
}
