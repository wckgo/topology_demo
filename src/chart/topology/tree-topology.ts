import Topology from './topology';
import * as d3 from 'd3';
import storage from './storage';

class TreeTopology extends Topology {

    draw(data: any): void {
        const map = new Map();
        for (let key in data.node2Group) {
            map.set(key, data.node2Group[key]);
        }
        data.node2Group = map;
        this.hierarchicalDispersion(data.data, data.node2Group);
    }

    private hierarchicalDispersion(data: Array<Array<storage.NodeEntity>>, node2Group: Map<string, string>): void {
        const width = this.svg.property('clientWidth');
        const height = this.svg.property('clientHeight');
        const perHeight = height / data.length;
        const nodesGroup = [];
        let allNodes = [];
        data.forEach((groups, index) => {
            const nodes = [];
            const groupY = perHeight * index + perHeight / 2;
            groups.forEach((group, index) => {
                if (group.totalCount > 1) {
                    if (group.expand) {
                        group.childNodes.forEach((node, index) => {
                            node.y = perHeight;
                            this.calculatePostion(nodes, node, index == 1 ? 55 : 10, width);
                            nodes.push(node);
                        });
                        group.x = group.childNodes[0].x;
                        group.y = groupY;
                        nodesGroup.push(group);
                    } else {
                        let sourceSet = new Array<string>();
                        let targetSet = new Array<string>();
                        group.childNodes.forEach((node) => {
                            if(node.source) {
                               sourceSet = sourceSet.concat(node.source);
                            }
                            if(node.target) {
                                targetSet = targetSet.concat(node.target);
                            }
                        });
                        group.source = Array.from(new Set(sourceSet));
                        group.target = Array.from(new Set(targetSet));
                        group.y = groupY;
                        this.calculatePostion(nodes, group, 55, width);
                        nodes.push(group);
                    }
                } else if (group.totalCount == 1) {
                    group.childNodes[0].y = groupY;
                    this.calculatePostion(nodes, group.childNodes[0], 55, width);
                    nodes.push(group.childNodes[0])
                }

            });

            allNodes = allNodes.concat(nodes);
        });
        this.calculateLinks(allNodes, node2Group);
        this.creatNode(allNodes);
        this.creatNodeLinks(allNodes,'vertical');
    }


    private calculateLinks(nodes: Array<storage.NodeEntity>, node2Group: Map<string, string>) {
        const map = new Map();
        nodes.forEach((node) => {
            map.set(node.id, node);
        });
        nodes.forEach((node) => {
            const sources = [];
            const targets = [];
            node.source && node.source.forEach((item) => {
                map.has(item) ? sources.push(map.get(item)) : sources.push(map.get(node2Group.get(item)));
            });
            node.target && node.target.forEach((item) => {
                map.has(item) ? targets.push(map.get(item)) : targets.push(map.get(node2Group.get(item)));
            });
            node.source = sources;
            node.target = targets;
        });
    }

    private calculatePostion(nodes: Array<storage.NodeEntity>, node: storage.NodeEntity, offset: number, width: number) {
        if (nodes.length == 0) {
            node.x = width / 2;
        } else {
            node.x = nodes[nodes.length - 1].x + offset;
            nodes.forEach(node => {
                node.x -= offset;
            });
        }
    }

    private creatNodeGroup(group: storage.NodeEntity) {
        console.log('to creat a group', group);
    }

}
export default TreeTopology;