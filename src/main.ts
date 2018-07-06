
import * as $ from 'jquery';
import * as d3 from 'd3';

class Initializer {
    topoDrawer: TopologyDrawer;
    constructor(drawer: TopologyDrawer) {
        this.topoDrawer = drawer;
    }
    initSideBar(): void {
        $('#left').children().click((e) => {
            $('#left').children().removeClass('dzB-a dbj-m');
            const input = $(e.currentTarget).addClass('dzB-a dbj-m').find('input');
            const name = input.attr('name');
            $.getJSON(`public/data/${name}.json`, (data) => {
                const entities = CommonUtil.handleData(data);
                this.topoDrawer.draw(entities);
            });

        });
    }
}

class TopologyDrawer {

    private svg: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private context: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private cardContext: any;

    constructor() {
        this.initBoard();
    }

    BREAK_POINT: number = 110;

    draw(data: Array<NodeEntity>): void {
        const disperseNodeEntities: Array<NodeEntity> = [];
        const connectedNodeEntities: Array<NodeEntity> = [];
        data.map((item) => {
            if (item.connected) {
                connectedNodeEntities.push(item);
            } else {
                disperseNodeEntities.push(item);
            }
        });
        if (this.context) {
            this.destoryContext();
        }
        this.creatContext();
        if (disperseNodeEntities.length > 0) {
            this.circularDispersion(disperseNodeEntities);
        }

    }

    private circularDispersion(data: Array<NodeEntity>): void {
        const perRadian = Constants.RADIAN_MAX / data.length;
        const width = this.svg.property('clientWidth');
        const height = this.svg.property('clientHeight');
        const xAxisOffset = width / 2;
        const yAxisOffset = height / 2;
        const radius = width < height ? width * 0.4 : height * 0.4;
        for (let i = 0; i < data.length; i++) {
            const alpha = perRadian * i;
            const coordinate: Coordinate = {
                xAxis: (Math.cos(alpha) * radius) + xAxisOffset,
                yAxis: (Math.sin(alpha) * radius) + yAxisOffset
            }
            this.creatNode(coordinate, data[i]);
        }

    }

    private creatNodeCard(coordinate: Coordinate, data: NodeEntity): void {
        if (this.cardContext) {
            this.destoryCardContext();
        }
        const translate = `translate(${coordinate.xAxis}, ${coordinate.yAxis})`;
        this.cardContext = this.context.append('g').attr('cursor', 'pointer');
        const cardGroup = this.cardContext.append('g').attr('transform', translate).attr('class', 'dic-y dic-a dic-q');

        let font = data.name.length > data.type.length ? data.name : data.type;
        const fontWidth = ToPologyUtil.calculateFontWidth('13px', font);
        let width = fontWidth + 80;
        if (font.length > 100) { width = 100 }

        const pathA = `M -27 0 a 27 27 0 1 0 54 0 a 27 27 0 1 0 -54 0 z M 0 29 A 29 29 0 1 1 0 -29 h ${width} v 51 a 7 7 0 0 1 -7 7 z`;
        const pathB = d3.path();
        pathB.arc(0, 0, 27, 0, 2 * Math.PI);
        cardGroup.append('path').attr('d', pathA).attr('class', 'dic-I');
        cardGroup.append('path').attr('d', pathB.toString()).attr('class', 'dic-J');
        cardGroup.append('text').style('font-size', '13px').attr('x', '35px').attr('y', '-9px').text(data.name);
        cardGroup.append('text').style('font-size', '10px').attr('x', '35px').attr('y', '13px').text(data.type);
        const gotoTranslate = `translate(${coordinate.xAxis + width}, ${coordinate.yAxis - 29})`;
        const goto = this.cardContext.append('g').attr('transform', gotoTranslate).attr('class', 'dic-z dic-q');
        goto.append('path').attr('d', 'M 0 0 v 51 a 7 7 0 0 1 -7 7 h -25 v -58 z').attr('class', 'dic-s');
        d3.svg('public/icon/goToIcon.svg').then(
            (data) => {
                const node = data.firstElementChild;
                node.setAttribute('width', '16px');
                node.setAttribute('height', '16px');
                node.setAttribute('fill', '#454646');
                node.setAttribute('viewBox', '0 0 512 512');
                goto.append('g').attr('transform', 'translate(-21 9)').attr('class', 'dic-i').append(() => { return node; });
            }
        );

        if (data.count) {
            this.creatCountCard(cardGroup, data.count, `wg-node-${data.id}`);
            this.cardContext.on('mouseleave ', () => {
                this.destoryCardContext();
                this.creatCountCard(d3.select(`wg-node-${data.id}`), data.count, `wg-node-${data.id}`);
            });
        } else {
            this.cardContext.on('mouseleave ', () => {
                this.destoryCardContext();
            });
        }
    }

    private creatNode(coordinate: Coordinate, data: NodeEntity): d3.Selection<d3.BaseType, {}, HTMLElement, any> {
        const translate = `translate(${coordinate.xAxis}, ${coordinate.yAxis})`;
        const g = this.context.append('g').attr('transform', translate).attr('id', `wg-node-${data.id}`);
        g.append('circle').attr('fill-opacity', 1.0).attr('r', 20).attr('cx', 0).attr('cy', 0).attr('stroke', '#607d8b')
            .attr('fill', '#cccccc');
        d3.svg('/public/icon/icon.svg').then(
            (date) => {
                const node = date.firstElementChild;
                node.setAttribute('width', '20px');
                node.setAttribute('height', '20px');
                node.setAttribute('fill', '#454646');
                node.setAttribute('viewBox', '0 0 512 512');
                g.append('g').attr('transform', 'translate(-10, -10)').append(() => {
                    return node;
                })
            }
        );

        if (data.count) {
            this.creatCountCard(g, data.count, `wg-node-${data.id}`);
            g.on('mouseover', (e) => {
                d3.select(`#wg-node-${data.id}-countCard`).remove();
                this.creatNodeCard(coordinate, data);
            });
        } else {
            g.on('mouseover', (e) => {
                this.creatNodeCard(coordinate, data);
            });
        }
        return g;
    }

    private creatCountCard(context: d3.Selection<d3.BaseType, {}, HTMLElement, any>, count: number, id: string): void {
        const countGroup = context.append('g').attr('cursor', 'pointer').attr('id', `${id}-countCard`);
        const fontWidth = ToPologyUtil.calculateFontWidth('14', count.toString());
        countGroup.append('rect').attr('rx', 3).attr('ry', 3).attr('width', fontWidth + 5).attr('height', 16).attr('x', -10.08).attr('y', 19)
            .attr('fill-opacity', '1.0').attr('fill', '#cccccc').attr('stroke', '#607d8b');
        countGroup.append('text').attr('font-size', '14').attr('x', - fontWidth / 2).attr('y', '32.25')
            .attr('display', 'inline').style('fill', 'black').text(count);
    }

    private initBoard(): void {
        this.svg = d3.select('#drawing-board').html(null).append('svg').attr('width', '100%').attr('height', '100%');
    }

    private creatContext(): void {
        this.context = this.svg.append('g').attr('id', 'context');
    }

    private destoryContext(): void {
        this.context.remove();
    }

    private destoryCardContext(): void {
        this.cardContext.remove();
    }

    public test(): void {
        $("#processes").addClass('mdui-progress-indeterminate');
        this.creatContext();
        const data1: NodeEntity = {
            id: '0',
            name: 'Hello, World',
            type: 'WebGate',
            active: true,
            connected: false
        }
        const data2: NodeEntity = {
            id: '1',
            name: 'Hello, World',
            type: 'WebGate',
            active: true,
            connected: false
        }
        const links = [{
            source: '0',
            target: '1'
        }];
        const nodes = [data1, data2];
        const width = this.svg.property('clientWidth');
        const height = this.svg.property('clientHeight')
        const force = d3.forceSimulation().nodes(nodes)
            .force('link', d3.forceLink(links).id((d: any) => { return d.id; }).distance(300))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height))
            .stop();
        this.svg.append("defs").append("marker")
            .attr("id", 'wg-marker')
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");
        d3.timeout(() => {
            $("#processes").removeClass('mdui-progress-indeterminate');
            for (let i = 0, n = Math.ceil(Math.log(force.alphaMin()) / Math.log(1 - force.alphaDecay())); i < n; ++i) {
                force.tick();
            }
            links.forEach(item => {
                const source: any = item.source;
                const targer: any = item.target;
                const links1 = [{
                    source: [source.x, source.y],
                    target: [targer.x, targer.y],
                }];

                this.context.append('g').selectAll('path').data(links1).enter()
                    .append('path').attr('d', (d) => { return this.link(d)} ).attr('class', 'dhc-e dhc-p').attr('marker-mid', 'url(#wg-marker)');
            });
            nodes.forEach((item: any) => {
                const coordinate: Coordinate = {
                    xAxis: item.x,
                    yAxis: item.y
                };
                this.creatNode(coordinate, item);
            });
            

        });
    }

    public link(link: any):string {
        const dx = link.target[0] - link.source[0];
        const dy = link.target[1] - link.source[1];
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M ${link.source[0]} ${link.source[1]} , A ${dr} , ${dr} 0 0, 1 ${link.target[0]} , ${link.target[1]}`;
    }
}

interface NodeEntity {
    id: string;
    name: string;
    type: string;
    active?: boolean;
    connected?: boolean;
    outgoingConnections?: Array<object>;
    count?: number;
}

interface Coordinate {
    xAxis: number;
    yAxis: number;
}

class ToPologyUtil {

    public static calculateFontWidth(fontsize: string, text: string): number {
        return d3.select('#font-test-area').style('font-size', fontsize).text(text).property('clientWidth');
    }
}

class CommonUtil {

    public static handleData(data: any): Array<NodeEntity> {
        const nodeEntities: Array<NodeEntity> = [];
        data.entities.map((item) => {
            const nodeEntity: NodeEntity = {
                id: item.id,
                name: item.name,
                type: item.type,
                active: item.active,
                connected: item.connected,
                outgoingConnections: item.outgoingConnections
            };
            nodeEntities.push(nodeEntity);
        });
        return nodeEntities;
    }
}

class Constants {
    public static RADIAN_MAX: number = 2 * Math.PI;
}

const drawer = new TopologyDrawer();
const initializer = new Initializer(drawer);
initializer.initSideBar();
drawer.test();