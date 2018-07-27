
import * as $ from 'jquery';
import wgcharts from './wgcharts';
import * as d3 from 'd3';

class Initializer {
    public static initSideBar(): void {
        $('#left').children().click((e) => {
            $('#left').children().removeClass('dzB-a dbj-m');
            const input = $(e.currentTarget).addClass('dzB-a dbj-m').find('input');
            const name = input.attr('name');
            $.getJSON(`public/data/${name}.json`, (data) => {
                const chart = wgcharts.init(document.getElementById('drawing-board'));
                const flat = chart.flatTopology(data);
                flat.onNodeClick((d) => {
                    $.getJSON('public/data/topo.json', (data) => {
                        chart.treeTopology(data);
                    });
                });
                flat.onNodeOutLink(() => {
                    console.log('node out link')
                });
            });
        });
    }
}
Initializer.initSideBar();