import CommonUtil from '../../util/common-util';
import Chart from '../chart';
import storage from './storage';
import * as d3 from 'd3';
abstract class Topology extends Chart {

    protected svg: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    protected context: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    protected nodeClickListener: (date?, index?, group?) => void;
    protected nodeOutLinkListener: (date?, index?, group?) => void;
    protected height: number;
    protected width: number;

    constructor(svg: d3.Selection<d3.BaseType, {}, HTMLElement, any>) {
        super();
        this.svg = svg;
        this.initBoard();
    }

    onNodeClick(listener: (date?, index?, group?) => void): void {
        this.nodeClickListener = listener;
    }

    onNodeOutLink(listener: (date?, index?, group?) => void): void {
        this.nodeOutLinkListener = listener;
    }


    protected creatNodeLinks(nodes: Array<storage.NodeEntity>, type: string): void {
        const g = this.context.insert('g', ':first-child');
        nodes.forEach((node) => {
            node.target && node.target.forEach((item) => {
                let path
                switch (type) {
                    case 'common':
                        path = g.append('path').attr('class', 'dhc-e').attr('id', `wg-node-link-${node.id}-${item.id}`).attr('d', this.link({ source: node, target: item }));
                        break;
                    case 'vertical':
                        const link = d3.linkVertical()({
                            source: [node.x, node.y],
                            target: [item.x, item.y]
                        });
                        path = g.append('path').attr('class', 'dhc-e').attr('id', `wg-node-link-${node.id}-${item.id}`).attr('d', link.toString());
                        break;
                }
                if (!item.active) {
                    path.classed('dhc-p', true);
                }
            });
        });
    }

    protected link(link: any): string {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M ${link.source.x} ${link.source.y} , A ${dr} , ${dr} 0 0, 1 ${link.target.x} , ${link.target.y}`;
    }

    protected creatNodeCard(data: storage.NodeEntity): void {
        if (this.context.select('#nodeCardContext').size()) {
            this.context.select('#nodeCardContext').remove();
        }
        const translate = `translate(${data.x}, ${data.y})`;
        const cardContext = this.context.append('g').datum(data).attr('cursor', 'pointer').attr('id', 'nodeCardContext');
        const cardGroup = cardContext.append('g').attr('transform', translate).attr('class', 'dic-y dic-a dic-q');
        let font = data.name.length > data.type.length ? data.name : data.type;
        const fontWidth = CommonUtil.calculateFontWidth('13px', font);
        let width = fontWidth + 80;
        if (font.length > 100) { width = 100 }
        const pathA = `M -27 0 a 27 27 0 1 0 54 0 a 27 27 0 1 0 -54 0 z M 0 29 A 29 29 0 1 1 0 -29 h ${width} v 51 a 7 7 0 0 1 -7 7 z`;
        const pathB = d3.path();
        pathB.arc(0, 0, 27, 0, 2 * Math.PI);
        cardGroup.append('path').attr('d', pathA).attr('class', 'dic-I');
        const card = cardGroup.append('path').attr('d', pathB.toString()).attr('class', 'dic-J');
        cardGroup.append('text').style('font-size', '13px').attr('x', '35px').attr('y', '-9px').text(data.name);
        cardGroup.append('text').style('font-size', '10px').attr('x', '35px').attr('y', '13px').text(data.type);
        const gotoTranslate = `translate(${data.x + width}, ${data.y - 29})`;
        const goto = cardContext.append('g').attr('transform', gotoTranslate).attr('class', 'dic-z dic-q');
        goto.append('path').attr('d', 'M 0 0 v 51 a 7 7 0 0 1 -7 7 h -25 v -58 z').attr('class', 'dic-s');
        goto.append('g').attr('transform', 'translate(-21 9)').attr('class', 'dic-i').append('use').attr('xlink:href', '#gotoIcon');
        if (data.totalCount) {
            this.creatCountCard(cardGroup, data.totalCount, `wg-node-${data.id}`);
        }
        cardContext.on('mouseleave ', () => {
            this.context.select('#nodeCardContext').remove();
            if (data.source && data.source.length > 0) {
                data.source.forEach(item => {
                    this.context.select(`#wg-node-${item.id}`).select('circle').attr('stroke', '#607d8b');
                    this.context.select(`#wg-node-link-${item.id}-${data.id}`).classed('dhc-n dhc-q', false).attr('marker-mid', null);
                });
            }
            if (data.target && data.target.length > 0) {
                data.target.forEach(item => {
                    this.context.select(`#wg-node-${item.id}`).select('circle').attr('stroke', '#607d8b');
                    this.context.select(`#wg-node-link-${data.id}-${item.id}`).classed('dhc-n dhc-q', false).attr('marker-mid', null);
                });
            }
            if (data.totalCount) {
                this.creatCountCard(d3.select(`wg-node-${data.id}`), data.totalCount, `wg-node-${data.id}`);
            }
        });
        if (this.nodeClickListener) {
            d3.selectAll(cardGroup.nodes()).on('click', this.nodeClickListener);
        }
        if (this.nodeOutLinkListener) {
            goto.on('click', this.nodeOutLinkListener);
        }
        card.on('click', null);
        card.on('clcik', (data, index, node) => {
            const nodeCoordinate:any = (<Element>node[index]).getBoundingClientRect();
            const offsetX = this.width / 2 - nodeCoordinate.x;
            const offsetY = this.height / 2 - nodeCoordinate.y;
            const t = d3.zoomIdentity.translate(offsetX, offsetY).scale(1.5);
            this.context.attr("transform", t.toString());
        })
    }

    protected creatNode(data: storage.NodeEntity[]): d3.Selection<d3.BaseType, storage.NodeEntity, d3.BaseType, {}> {
        const g = this.context.selectAll('g').data(data, (d: any, i) => { return d == undefined || d.id == undefined ? i : d.id })
            .enter().append('g');
        g.transition()
        //.duration(200).delay(100).ease(d3.easeLinear)
            .attr('transform', d => { return `translate(${d.x}, ${d.y})`; })
            .attr('id', d => { return `wg-node-${d.id}` });
        g.append('circle').attr('fill-opacity', 1.0)
            .attr('cx', 0).attr('cy', 0).attr('r', (d) => { return d.totalCount ? 27 : 20 })
            .attr('stroke', '#607d8b').attr('fill', '#cccccc').attr('stroke-width', '1.5');
        g.append('g').attr('transform', 'translate(-10, -10)').append('use').attr('xlink:href', '#icon');
        

        g.each((d, i, g) => {
            if (d.totalCount) {
                this.creatCountCard(d3.select(g[i]), d.totalCount, d.id);
            }
        })
        g.on('mouseover', (data, index, node) => {
            if (data.totalCount) {
                d3.select(`#wg-node-${data.id}-countCard`).remove();
            }
            if (data.source && data.source.length > 0) {
                data.source.forEach(item => {
                    this.context.select(`#wg-node-${item.id}`).select('circle').attr('stroke', '#00a0f2');
                    this.context.select(`#wg-node-link-${item.id}-${data.id}`).classed('dhc-n dhc-q', true).attr('marker-mid', 'url(#wg-marker)');
                });
            }
            if (data.target && data.target.length > 0) {
                data.target.forEach(item => {
                    this.context.select(`#wg-node-${item.id}`).select('circle').attr('stroke', '#00a0f2');
                    this.context.select(`#wg-node-link-${data.id}-${item.id}`).classed('dhc-n dhc-q', true).attr('marker-mid', 'url(#wg-marker)');
                });
            }
            this.creatNodeCard(data);
        });
       
        return g;
    }

    protected creatCountCard(context: d3.Selection<d3.BaseType, {}, HTMLElement, any>, count: number, id: string): void {
        const countGroup = context.append('g').attr('cursor', 'pointer').attr('id', `${id}-countCard`);
        const fontWidth = CommonUtil.calculateFontWidth('14', count.toString());
        countGroup.append('rect').attr('rx', 3).attr('ry', 3).attr('width', fontWidth + 10).attr('height', 16).attr('x', - fontWidth / 2 - 5).attr('y', 19)
            .attr('fill-opacity', '1.0').attr('fill', '#cccccc').attr('stroke', '#607d8b');
        countGroup.append('text').attr('font-size', '14').attr('x', - fontWidth / 2).attr('y', '32.25')
            .attr('display', 'inline').style('fill', 'black').text(count);
    }

    protected initBoard(): void {
        this.context = this.svg.html(null).append('g').attr('id', 'context');
        this.svg.call(d3.zoom().scaleExtent([1 / 2, 4]).on('zoom', () => {
            this.context.attr("transform", d3.event.transform.toString());
        }));
        this.width = this.svg.property('clientWidth');
        this.height = this.svg.property('clientHeight');
        this.svg.append("defs").append("marker").attr("id", 'wg-marker').attr("viewBox", "0 -5 10 10")
            .attr("refX", 15).attr("refY", -1.5).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
            .append("svg:path").attr("d", "M0,-5L10,0L0,5").attr('fill', '#00a0f2');
        d3.svg('public/icon/icon.svg').then(
            (date) => {
                const node = date.firstElementChild;
                node.setAttribute('width', '20px');
                node.setAttribute('height', '20px');
                node.setAttribute('fill', '#454646');
                node.setAttribute('viewBox', '0 0 512 512');
                node.setAttribute('id', 'icon');
                this.svg.select('defs').append(() => { return node });
            }
        );
        d3.svg('public/icon/goToIcon.svg').then(
            (data) => {
                const node = data.firstElementChild;
                node.setAttribute('width', '16px');
                node.setAttribute('height', '16px');
                node.setAttribute('viewBox', '0 0 512 512');
                node.setAttribute('id', 'gotoIcon');
                this.svg.select('defs').append(() => { return node; });
            }
        );
    }
	
	
	protected creatNodev2(data: any): void {
        const g = this.context.append('g').attr('transform', d => { return `translate(100, 300)`; });
        g.append('circle').attr('fill-opacity', 1.0).attr('cx', 0).attr('cy', 0).attr('r', 27)
            .attr('stroke', '#ffffff').attr('fill', '#60acfc').attr('stroke-width', '1.5');
        g.on('mouseover', () => {
            this.creatNodeCardv2();
        });
    }

    protected creatNodeCardv2(): void {
        // if (this.context.select('#nodeCardContext').size()) {
        //     this.context.select('#nodeCardContext').remove();
        // }
        const translate = `translate(100, 300)`;
        const cardContext = this.context.append('g')
            .attr('cursor', 'pointer').attr('id', 'nodeCardContext').attr('transform', translate);
        const cardGroup = cardContext.append('g');
        //let font = data.name.length > data.type.length ? data.name : data.type;
        //const fontWidth = CommonUtil.calculateFontWidth('13px', font);
        //let width = fontWidth + 80;
        //if (font.length > 100) { width = 100 }
        const pathA = `M 0 -54 h 200 v 108 h -200  M 0 29 A 27 27 0 0 0 0 -29`;
        const pathB = d3.path();
        pathB.arc(0, 0, 27, 0, 2 * Math.PI);
        cardGroup.append('path').attr('d', pathA).attr('fill', '#01a6f3').attr('fill-opacity', 0.5);
        const card = cardGroup.append('path').attr('d', pathB.toString()).attr('fill', 'rgba(0, 0, 0, 0)').attr('stroke', 'rgba(0, 0, 0, 0)');
        //cardGroup.append('text').style('font-size', '13px').attr('x', '35px').attr('y', '-9px').text(data.name);
        //cardGroup.append('text').style('font-size', '10px').attr('x', '35px').attr('y', '13px').text(data.type);
        //const gotoTranslate = `translate(100, ${-29})`;
        //const goto = cardContext.append('g').attr('transform', gotoTranslate);
        //goto.append('path').attr('d', 'M 0 0 v 51 a 7 7 0 0 1 -7 7 h -25 v -58 z').attr('class', 'dic-s');
        //goto.append('g').attr('transform', 'translate(-21 9)').attr('class', 'dic-i').append('use').attr('xlink:href', '#gotoIcon');

        cardContext.on('mouseleave ', () => {
            // this.context.select('#nodeCardContext').remove();

        });
    }

}

export default Topology;