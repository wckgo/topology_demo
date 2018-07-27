import Topology from './topology';
import * as d3 from 'd3';
import storage from './storage';

class FlatTopology extends Topology {

    private randomNormal = d3.randomNormal(150, 10);

    draw(data: Array<storage.NodeEntity>): void {
        // const disperseNodeEntities: Array<storage.NodeEntity> = [];
        // const connectedNodeEntities: Array<storage.NodeEntity> = [];
        // data.map((item) => {
        //     if (item.connected) {
        //         connectedNodeEntities.push(item);
        //     } else {
        //         disperseNodeEntities.push(item);
        //     }
        // });
        // if (disperseNodeEntities.length) {
        //     this.circularDispersion(disperseNodeEntities);
        // }
        // if (connectedNodeEntities.length) {
        //     this.simulatedDispersion(connectedNodeEntities);
        // }
        this.simulatedDispersionV2(data);
    }

    private simulatedDispersionV2(data: Array<storage.NodeEntity>): void {
        const width = this.svg.property('clientWidth');
        const height = this.svg.property('clientHeight');
        const links = [];
        data.forEach(item => {
            if (item.target && item.target.length > 0) {
                const sourceId = item.id;
                item.target.forEach((item: any) => {
                    const link = {
                        source: sourceId,
                        target: item
                    };
                    links.push(link);
                });
            }
        });

        const isolate = (force, filter) => {
            var initialize = force.initialize;
            force.initialize = function () { initialize.call(force, data.filter(filter)); };
            return force;
        }
        const forceRadial = d3.forceRadial(height / 2).x(width / 2).y(height / 2)
        //.strength(353 / (300 * 300));
        const g = this.creatNode(data);
        const force = d3.forceSimulation(data)
            .force('link', d3.forceLink(links).id((d: any) => { return d.id; }).distance(() => { return this.randomNormal() }))
            .force("charge", d3.forceManyBody().strength((d: any) => { return d.connected ? -300 : -30 }))
            .force('charge2', d3.forceCollide(50))
            .force("center", d3.forceCenter(width / 2, height / 2))
            //.force('r', isolate(forceRadial, (d) => {return !d.connected}))
            .force('y', d3.forceY(height / 2).strength((d: any) => { return d.connected ? 0.05 : 0.01 }))
            .force('x', d3.forceX(width / 2).strength((d: any) => { return d.connected ? 0.05 : 0.01 }))
            .on('tick', () => { g.attr('transform', d => { return `translate(${d.x}, ${d.y})`; }) })
            .on('end', () => { this.creatNodeLinks(data, 'common'); })
        //force.tick();

        // while(force.alpha() >= force.alphaMin()) {
        //     force.tick();

        // }

        // for (let i = 0, n = Math.ceil(Math.log(force.alphaMin()) / Math.log(1 - force.alphaDecay())); i < n; ++i) {
        //     force.tick();
        // }
        links.forEach((link, index) => {
            if (index == 0) {
                link.source.source = [];
                link.source.target = [];
                link.target.target = [];
                link.target.source = [];
            }
            link.source.target.push(link.target);
            link.target.source.push(link.source);
        });


    }

    private simulatedDispersion(data: Array<storage.NodeEntity>): void {
        const width = this.svg.property('clientWidth');
        const height = this.svg.property('clientHeight');
        const links = [];
        data.forEach(item => {
            if (item.target && item.target.length > 0) {
                const sourceId = item.id;
                item.target.forEach((item: any) => {
                    const link = {
                        source: sourceId,
                        target: item
                    };
                    links.push(link);
                });
            }
        });
        const force = d3.forceSimulation(data)
            .force('link', d3.forceLink(links).id((d: any) => { return d.id; }).distance(() => { return this.randomNormal() }))
            .force("charge", d3.forceManyBody().strength((d: any) => { return d.connected ? -30 : -600 }))
            .force('charge', d3.forceCollide(110))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force('x', d3.forceX())
            .force('y', d3.forceY())
            .stop();
        for (let i = 0, n = Math.ceil(Math.log(force.alphaMin()) / Math.log(1 - force.alphaDecay())); i < n; ++i) {
            force.tick();
        }
        links.forEach((link, index) => {
            if (index == 0) {
                link.source.source = [];
                link.source.target = [];
                link.target.target = [];
                link.target.source = [];
            }
            link.source.target.push(link.target);
            link.target.source.push(link.source);
        });
        this.creatNodeLinks(data, 'common');
        this.creatNode(data);

    }

    private circularDispersion(data: Array<storage.NodeEntity>): void {
        const perRadian = 2 * Math.PI / data.length;
        const width = this.svg.property('clientWidth');
        const height = this.svg.property('clientHeight');
        const xAxisOffset = width / 2;
        const yAxisOffset = height / 2;
        let radius = width < height ? width * 0.4 : height * 0.4;
        if (radius < 45 * data.length / Math.PI) {
            radius = 45 * data.length / Math.PI;
        }
        for (let i = 0; i < data.length; i++) {
            const alpha = perRadian * i;
            data[i].x = (Math.cos(alpha) * radius) + xAxisOffset;
            data[i].y = (Math.sin(alpha) * radius) + yAxisOffset;
        }
        this.creatNode(data);
    }
}
export default FlatTopology;