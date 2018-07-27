import * as d3 from 'd3';

class CommonUtil {
    public static calculateFontWidth(fontsize: string, text: string): number {
        const font = d3.select('#font-test-area');
        if (!font.size()) {
            d3.select('body').append('text').attr('id','font-test-area').attr('style', 'color:black;line-height:1.2;white-space:nowrap;top:0px;left:0px;position:fixed;display:block;visibility:hidden;');
        }
        return d3.select('#font-test-area').style('font-size', fontsize).text(text).property('clientWidth');
    }
}
export default CommonUtil;