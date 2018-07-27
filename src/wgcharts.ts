import * as d3 from 'd3';
import guid from './util/guid';
import FlatTopology from './chart/topology/flat-topology';
import TreeTopology from './chart/topology/tree-topology';
export default class wgcharts {
    private static instances: Map<number, WGChart> = new Map();

    public static init(dom: Element): WGChart {
        const id = guid();
        const chart = new WGChart(id, dom);
        this.instances.set(id, chart);
        return chart;
    }
}

class WGChart {

    private id: number;
    private svg: d3.Selection<d3.BaseType, {}, null, undefined>
    constructor(id: number, dom: Element) {
        this.id = id;
        this.svg = d3.select(dom).html(null).append('svg').attr('id', id)
            .attr('width', '100%').attr('height', '100%');
    }

    public flatTopology(data: any): FlatTopology {
        const chart = new FlatTopology(this.svg);
        chart.draw(data);
        return chart;
    }

    public treeTopology(data: any): TreeTopology {
        const chart = new TreeTopology(this.svg);
        chart.draw(data);
        return chart;
    }
}