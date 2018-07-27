import * as d3 from "d3";
import Topology from "./chart/topology/topology";

// tslint:disable-next-line:class-name
export default class webgateVI {

    public static init(dom: Element): WebGateVI {
        const id = this.idStart++;
        const chart = new WebGateVI(id, dom);
        this.instances.set(id, chart);
        return chart;
    }

    private static instances: Map<number, WebGateVI> = new Map();
    private static idStart = new Date().getTime();
}

// tslint:disable-next-line:max-classes-per-file
class WebGateVI {

    private id: number;
    private svg: d3.Selection<d3.BaseType, {}, null, undefined>
    constructor(id: number, dom: Element) {
        this.id = id;
        this.svg = d3.select(dom).html(null).append("svg").attr("id", id)
            .attr("width", "100%").attr("height", "100%");
    }

    public topology(data: any): Topology {
        const topo = new Topology(this.svg);
        topo.render(data);
        return topo;
    }
}
