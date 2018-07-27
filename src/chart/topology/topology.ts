import * as d3 from "d3";
import CommonUtil from "../../util/common-util";
import { ForceCluster, LinkEntity, MetaData, Node, NodeEntity } from "./storage";

class Topology {

    private static NODE_SIZE_INCREASE_THRESHOLD_MIN: number = 40;
    private static NODE_SIZE_MIN: number = 20;

    private svg: d3.Selection<d3.BaseType, {}, null, undefined>;
    private context: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private currentNode: d3.Selection<d3.BaseType, {}, null, undefined>;
    private nades: Array<d3.HierarchyNode<NodeEntity>>;
    private layoutModle: d3.Simulation<{}, undefined>;
    private staticForceLayout: boolean = false;
    private root: d3.HierarchyNode<NodeEntity>;
    private forceMap: Map<number, any> = new Map();
    // private static colorBaseSet: Array<string> = ['#60acfc', '#32d3eb', '#5bc49f', '#feb64d', '#ff7c7c', '#9287e7'];

    constructor(svg: d3.Selection<d3.BaseType, {}, null, undefined>) {
        this.svg = svg;
        this.init();
    }

    public render(data: MetaData) {
        const root: Node = d3.stratify<NodeEntity>()(data.nodes);
        this.root = root;
        const leaves = root.leaves();
        if (leaves.length > 1000) {
            this.staticForceLayout = true;
        }
        const linkNest = d3.nest<{ source, target }>().key(d => d.source).entries(data.links);
        linkNest.forEach(d => {
            d.values.forEach(element => {
                element.source = leaves.find(node => element.source == node.data.id);
                element.target = leaves.find(node => element.target == node.data.id);
            });
        });
        leaves.forEach(node => {
            const link = linkNest.find(linkGroup => {
                return linkGroup.key == node.data.id;
            });
            node.data.links = link ? link.values : null;
        });
        root.count();
        const width = this.svg.property("clientWidth");
        const height = this.svg.property("clientHeight");
        root.x = width / 2;
        root.y = height / 2;
        for (let i = 1; i <= root.height; i++) {
            this.forceMap.set(i, null);
        }
        this.test();
        // this.layout();
    }

    public test() {
        const max = d3.max(this.nades, d => d.value);
        const base = max > Topology.NODE_SIZE_INCREASE_THRESHOLD_MIN ? Math.floor(max * 2 / 3) : Topology.NODE_SIZE_INCREASE_THRESHOLD_MIN;
        const result = [];
        const map = new Map<number, any>();
        const pack = (data: Node[]) => {
            data.forEach((d: any) => {
                if (!d.x) { d.x = d.parent.x; }
                if (!d.y) { d.y = d.parent.y; }
                if (!d.children || !d.extend) {
                    d.r = this.calculateSize(d.value ? d.value : 1, base);
                    result.push(d);
                } else {
                    pack(d.children);
                    const siblings = d3.packSiblings(d.children);
                    const enclose = d3.packEnclose(siblings);
                    siblings.forEach((c: any) => { c.x = c.parent.x; c.y = c.parent.y; });
                    d.r = enclose.r;
                }
                map.get(d.depth) ? map.get(d.depth).push(d) : map.set(d.depth, [d]);
            });
        };
        const forceLayoutFactory = (nodes: any) => {
            const force = d3.forceSimulation().nodes(nodes).alphaDecay(1 - Math.pow(0.001, 1 / 300))
                .force("cluster", this.cluster())
                .force("manyBody", d3.forceManyBody().strength((d: any) => d.height * -10))
                .force("collide", d3.forceCollide().radius((d: any) => d.data.size + 10))
                .stop();
            force.on("tick", this.updataLinkAndNode);
            return force;
        };

        const createCircle = (arr: any) => {
            const nodeAll = this.context.selectAll("g.node").data(arr, (d: any) => d.data.id);
            const g = nodeAll.enter().append("g").classed("node", true)
                .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
            const circle = g.append("circle").attr("cx", 0).attr("cy", 0).attr("r", (d: any) => d.data.size)
                .attr("stroke", "#000").attr("stroke-width", "1.5").attr("fill-opacity", 0);
            circle.filter(d => d.children).on("click", d => { d.extend = true; this.test(); });
        };
        // layout
        const links = this.rollUpLinks(result);
        let arr = [];
        map.forEach(v => {
            arr = arr.concat(v);
        });
        const f = forceLayoutFactory(result);
        createCircle(arr);
        f.restart();
    }

    public cluster() {
        let nodes;
        let s = 0.618;
        // tslint:disable-next-line:only-arrow-functions
        const force = function (alpha) {
            // scale + curve alpha value
            alpha *= s * alpha;
            nodes.forEach(d => {
                const cluster = d.parent;
                let x = d.x - cluster.x;
                let y = d.y - cluster.y;
                if (x == 0 || y == 0) {
                    return;
                }
                let l = Math.sqrt(x * x + y * y);
                const r = d.parent.data.size ? d.parent.data.size : d.parent.r - d.data.size * 2;
                if (l > r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    cluster.x += x;
                    cluster.y += y;
                } else {
                    l = alpha * 0.0618;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    cluster.x += x;
                    cluster.y += y;
                }
            });
        } as ForceCluster;

        force.initialize = _ => {
            nodes = _;
        };
        force.strength = strength => {
            s = strength == null ? s : strength;
            return force;
        };

        return force;
    }

    private layout(): void {
        const max = d3.max(this.nades, d => d.value);
        const base = max > Topology.NODE_SIZE_INCREASE_THRESHOLD_MIN ? Math.floor(max * 2 / 3) : Topology.NODE_SIZE_INCREASE_THRESHOLD_MIN;
        const result = new Array<d3.HierarchyNode<NodeEntity>>();
        // const result = this.root.descendants();
        this.rollUpNodes(base, result, this.nades);
        const links = this.rollUpLinks(result);
        if (!this.layoutModle) {
            this.initLayoutModle();
        }
        if (this.staticForceLayout) {
            this.layoutModle.alphaDecay(1 - Math.pow(0.001, 1 / 100)).velocityDecay(0.4 * 2 / 3).on("end", () => {
                this.creatNode(result);
                this.createLinks(links);
                this.updataLinkAndNode();
            });
        } else {
            this.creatNode(result);
            this.createLinks(links);
        }
        // const linkForce = this.layoutModle.force("link") as d3.ForceLink<{}, d3.SimulationLinkDatum<{}>>;
        // linkForce.links(links);
        this.layoutModle.nodes(result).alpha(1).restart();

    }

    private initLayoutModle() {
        const width = this.svg.property("clientWidth");
        const height = this.svg.property("clientHeight");
        // const links = this.root.links();
        const force = d3.forceSimulation()
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength((d: any) => d.height * -10))
            .force("charge2", d3.forceCollide().radius((d: any) => d.data.size + 3))
            // .force("link", d3.forceLink().distance(200))
            .force("x", d3.forceX().strength(0.00618))
            .force("y", d3.forceY().strength(0.00618))
            // .force("cluster", this.cluster())
            .stop();
        if (!this.staticForceLayout) {
            force.on("tick", this.updataLinkAndNode);
        }
        this.layoutModle = force;
    }

    private updataLinkAndNode = () => {
        this.context.selectAll("g.node").attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
        this.context.select("#node-link-group").selectAll("path").attr("d", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            return `M ${d.source.x} ${d.source.y} , A ${dr} , ${dr} 0 0, 1 ${d.target.x} , ${d.target.y}`;
        });
    }

    private rollUpLinks(nodes: Array<d3.HierarchyNode<NodeEntity>>) {
        const links = [];
        const handle = (node, link) => {
            const target = link.target.ancestors().find(d => nodes.includes(d));
            links.push({
                source: node,
                target,
            });
        };
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.leaves().forEach(child => {
                    child.data.links && child.data.links.forEach(link => {
                        if (!node.leaves().includes(link.target)) {
                            handle(node, link);
                        }
                    });
                });
            } else {
                node.data.links && node.data.links.forEach(link => { handle(node, link); });
            }
        });
        return links;
    }

    private rollUpNodes(base: number, result: Array<d3.HierarchyNode<NodeEntity>>, data: Array<d3.HierarchyNode<NodeEntity>>) {
        data.forEach((e, i) => {
            if (!e.children) {
                e.data.size = this.calculateSize(1, base);
                e.data.colorIndex = e.parent.data.colorIndex;
                result.push(e);
            } else {
                if (e.depth == 1) {
                    const l = data.length;
                    e.data.colorIndex = (2 * i + 1) / (2 * l);
                } else {
                    e.data.colorIndex = e.parent.data.colorIndex;
                }
                e.data.size = this.calculateSize(e.value, base);
                if (e.data.extend) {
                    this.rollUpNodes(base, result, e.children);
                } else {
                    result.push(e);
                }
            }
        });
    }

    private calculateSize(count, base): number {
        if (count > base) {
            count = base;
        }
        const size = Topology.NODE_SIZE_MIN * (Math.sqrt(1 - Math.pow(((count - 1) / base - 1), 2)) + 1);
        return Math.floor(size);
    }

    private creatNode(data: Node[]): d3.Selection<d3.BaseType, {}, d3.BaseType, {}> {
        const nodeAll = this.context.selectAll("g.node").data(data, (d: any) => d.data.id);
        nodeAll.exit().remove();
        const g = nodeAll.enter().append("g").classed("node", true)
            .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
        g.append("circle").attr("cx", 0).attr("cy", 0).attr("r", (d: any) => d.data.size)
            .attr("stroke", "#ffffff").attr("stroke-width", "1.5")
            .attr("fill", (d: any) => d3.interpolateRainbow(d.data.colorIndex));
        g.append("text").attr("dy", ".35em").attr("text-anchor", "middle")
            .style("font-size", d => `${d.data.size}px`).text(d => d.data.name.charAt(0));
        const countCard = g.filter(d => d.children && d.children.length > 0).append("g").attr("cursor", "pointer");
        countCard.append("rect").attr("rx", 3).attr("ry", 3).attr("height", 16)
            .attr("y", d => d.data.size - 10)
            .attr("width", d => CommonUtil.calculateFontWidth("14", d.value.toString()) + 10)
            .attr("x", d => CommonUtil.calculateFontWidth("14", d.value.toString()) / -2 - 5)
            .attr("fill-opacity", 0.8).attr("fill", "#cccccc").attr("stroke", "#333333");
        countCard.append("text").attr("font-size", "14").attr("display", "inline").style("fill", "black")
            .attr("y", d => d.data.size + 3.25)
            .attr("x", d => CommonUtil.calculateFontWidth("14", d.value.toString()) / -2)
            .text(d => d.value);
        g.on("mouseenter", (d, i, group) => {
            d3.select(group[i]).select("circle").attr("r", (node: any) => node.data.size + 2).attr("filter", "url(#shadow)");
            this.currentNode = d3.select(group[i]);
            const hasLinkNodeIds = new Set<string>();
            this.context.select("#node-link-group").selectAll("path")
                .each((link: any, index, links) => {
                    if (link.source.data.id == d.data.id || link.target.data.id == d.data.id) {
                        hasLinkNodeIds.add(link.source.data.id);
                        hasLinkNodeIds.add(link.target.data.id);
                        d3.select(links[index]).attr("stroke", (l: any) => d3.interpolateRainbow(l.source.data.colorIndex)).attr("stroke-width", 4);
                    } else {
                        d3.select(links[index]).attr("stroke-opacity", 0.1);
                    }
                });
            this.context.selectAll("g.node").each((node: any, index, nodes) => {
                if (!hasLinkNodeIds.has(node.data.id)) {
                    d3.select(nodes[index]).attr("fill-opacity", 0.1).attr("stroke-opacity", 0.1);
                }
            });
            this.creatNodeCard(d);
        });
        return g;
    }

    private creatNodeCard(node: Node): void {
        if (this.context.selectAll("#nodeCardContext").size()) {
            this.context.selectAll("#nodeCardContext").remove();
        }
        const translate = `translate(${node.x}, ${node.y})`;
        const cardContext = this.context.append("g")
            .attr("cursor", "pointer").attr("id", "nodeCardContext").attr("fill-opacity", 0.8)
            .attr("transform", translate);
        cardContext.on("mouseleave ", () => {
            this.currentNode.select("circle").attr("r", (d: any) => d.data.size).attr("filter", null);
            cardContext.remove();
            this.context.select("#node-link-group").selectAll("path")
                .filter((link: any) => link.source.data.id == node.data.id || link.target.data.id == node.data.id)
                .attr("stroke", "#dddddd").attr("stroke-width", 2);
            this.context.select("#node-link-group").selectAll("path").attr("stroke-opacity", null);
            this.context.selectAll("g.node").attr("fill-opacity", null).attr("stroke-opacity", null);
        });
        // cardContext.transition().duration(200).delay(200).ease(d3.easeCubicInOut).attr('fill-opacity', 0.8);
        const cardGroup = cardContext.append("g");
        const font = node.data.name.length > node.data.type.length ? node.data.name : node.data.type;
        const fontWidth = CommonUtil.calculateFontWidth("13px", font);
        let width = fontWidth + 80;
        if (font.length > 100) { width = 500; }
        if (width < 200) { width = 200; }
        const pathA = `M 0 ${node.data.size + 4} A ${node.data.size + 2} ${node.data.size + 2} 0 0 0 0 ${-(node.data.size + 4)} h ${width} v ${(node.data.size + 4) * 2 - 7} a 7 7 0 0 1 -7 7 z `;
        const pathB = d3.path();
        pathB.arc(0, 0, node.data.size + 2, 0, 2 * Math.PI);
        cardGroup.append("path").attr("d", pathA).attr("fill", "#333333");
        const circlePath = cardGroup.append("path").attr("d", pathB.toString()).attr("fill", "rgba(0, 0, 0, 0)").attr("stroke", "rgba(0, 0, 0, 0)");
        cardGroup.append("text").style("font-size", `${Math.floor(node.data.size * 0.5)}px`).attr("fill", "#fff")
            .attr("x", `${node.data.size + 8}`).attr("y", `${-(0.25 * node.data.size + 0.25)}`).text(node.data.name);
        cardGroup.append("text").style("font-size", `${Math.floor(node.data.size * 0.35)}px`).attr("fill", "#fff")
            .attr("x", `${node.data.size + 8}`).attr("y", `${0.4 * node.data.size + 0.25}`).text(node.data.type);
        const gotoTranslate = `translate(${width}, ${-(node.data.size + 4)})`;
        const goto = cardContext.append("g").attr("transform", gotoTranslate);
        goto.append("path").attr("d", `M 0 0 v ${(node.data.size + 4) * 2 - 7} a 7 7 0 0 1 -7 7 h -25 v ${-(node.data.size + 4) * 2} z`).attr("fill", "#fff");
        goto.append("g").attr("transform", "translate(-21 9)").append("use").attr("xlink:href", "#gotoIcon");
        if (node.depth > 1) {
            const mini = cardContext.append("g").attr("transform", `translate(-${node.data.size + 21.7} -6.35)`);
            mini.append("path").attr("d", `M 0 -${node.data.size} h 21.27 v ${(node.data.size + 4) * 2} h -21.27`).attr("fill", "rgba(0, 0, 0, 0)").attr("stroke", "rgba(0, 0, 0, 0)");
            mini.append("use").attr("xlink:href", "#minimizeIcon")
                .on("click", () => {
                    cardContext.remove();
                    this.currentNode.remove();
                    this.context.select("#node-link-group").selectAll("path")
                        .filter((link: any) => link.source.data.id == node.data.id || link.target.data.id == node.data.id)
                        .attr("stroke", "#dddddd").attr("stroke-width", 2);
                    this.context.select("#node-link-group").selectAll("path").attr("stroke-opacity", null);
                    this.context.selectAll("g.node").attr("fill-opacity", null).attr("stroke-opacity", null);
                    node.parent.data.extend = false;
                    this.layout();
                }, true);
        }

        if (node.children) {
            circlePath.on("click", () => {
                cardContext.remove();
                this.currentNode.remove();
                this.context.select("#node-link-group").selectAll("path")
                    .filter((link: any) => link.source.data.id == node.data.id || link.target.data.id == node.data.id)
                    .attr("stroke", "#dddddd").attr("stroke-width", 2);
                this.context.select("#node-link-group").selectAll("path").attr("stroke-opacity", null);
                this.context.selectAll("g.node").attr("fill-opacity", null).attr("stroke-opacity", null);
                node.data.extend = true;
                this.layout();
            });
        }
    }

    private createLinks(links: LinkEntity[]) {
        let g = this.context.select("#node-link-group");
        if (!g.size()) {
            g = this.context.insert("g", ":first-child").attr("id", "node-link-group");
        }
        const all = g.selectAll("path").data(links, (d: any) => `${d.source.data.id}->${d.target.data.id}`);
        all.exit().remove();
        all.enter().append("path").attr("stroke", "#dddddd").attr("stroke-width", 2).attr("fill", "none");
    }

    private init(): void {
        this.svg.call(d3.zoom().scaleExtent([1 / 8, 4]).on("zoom", () => {
            this.context.attr("transform", d3.event.transform.toString());
        }));
        this.context = this.svg.html(null).append("g").attr("id", "context");
        const defs = this.svg.append("defs");
        d3.svg("public/icon/goToIcon.svg").then(data => {
            const node = data.firstElementChild;
            node.setAttribute("width", "16px");
            node.setAttribute("height", "16px");
            node.setAttribute("viewBox", "0 0 512 512");
            node.setAttribute("id", "gotoIcon");
            defs.append(() => node);
        });
        d3.svg("public/icon/minimize.svg").then(data => {
            const node = data.firstElementChild;
            node.setAttribute("width", "16px");
            node.setAttribute("height", "16px");
            node.setAttribute("viewBox", "0 0 512 512");
            node.setAttribute("id", "minimizeIcon");
            defs.append(() => node);
        });
        const shadow = defs.append("filter").attr("id", "shadow");
        shadow.append("feGaussianBlur").attr("result", "blurOut").attr("in", "SourceAlpha").attr("stdDeviation", "3");
        shadow.append("feBlend").attr("in", "SourceGraphic").attr("in2", "blurOut").attr("mode", "normal");
        defs.append("marker").attr("id", "wg-marker").attr("viewBox", "0 -5 10 10")
            .attr("refX", 15).attr("refY", -1.5).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
            .append("svg:path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#00a0f2");
    }
}

export default Topology;
