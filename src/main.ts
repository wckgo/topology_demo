import * as d3 from "d3";
import * as $ from "jquery";
import webgateVI from "./webgate-vi";
const chart = webgateVI.init(document.getElementById("topo"));
// $.getJSON("public/data/topo.v2.json",
//     data => {
//         chart.topology(data);
//     });
// randowNode();
function randowNode() {
    let count = 0;
    const arr = [];
    for (let i = 0; i < 30; i++) {
        const i1 = {
            id: `root-${i}`,
            name: `#root-${i}-test`,
            parentId: "root",
            type: "test-#1",
        };
        arr.push(i1);
        for (let j = 0; j < 20; j++) {
            const j1 = {
                id: `${i}-${j}`,
                name: `#${i}-${j}-test`,
                parentId: `root-${i}`,
                type: "test-#2",
            };
            arr.push(j1);
            for (let k = 0; k < 10; k++) {
                const k1 = {
                    id: `${count++}`,
                    name: `#${i}-${j}-${k}-test`,
                    parentId: `${i}-${j}`,
                    type: "test-#3",
                };
                arr.push(k1);
            }
        }
    }
    arr.push({
        id: "root",
        name: "root",
        parentId: "",
        type: "root",
    });
    const arr2 = [];
    for (let i = 0; i < 1000; i++) {
        const s = Math.random() * 6000;
        const t = Math.random() * 6000;
        const link = {
            source: Math.floor(s),
            target: Math.floor(t),
        };
        arr2.push(link);
    }
    const data = {
        links: arr2,
        nodes: arr,
    };
    chart.topology(data);
}
function test() {
    const arr = [];
    for (let i = 0; i < 20; i++) {
        arr.push({ r: 30 + Math.random() * 50 });
    }
    const a = d3.packSiblings(arr);
    const c = d3.packEnclose(a);
    console.log(c);
    a.push(c);
    const b = d3.select("svg").append("g").attr("transform", "translate(500, 500)");
    b.selectAll("circle").data(a).enter().append("circle")
        .attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y).attr("r", (d: any) => d.r - 10)
        .attr("stroke", "#000").attr("stroke-width", "1.5").attr("fill-opacity", 0);
}
test();
