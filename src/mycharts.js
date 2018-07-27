var waringSlider = new Slider("#waring");
var alarmSlider = new Slider("#alarm");
var waringLine = 30;
var alarmLine = 70;
waringSlider.on("slide", function(sliderValue) {
    document.getElementById("waringSliderVal").textContent = sliderValue;
    waringLine = sliderValue;
    refreshWaringLine();
});
alarmSlider.on("slide", function(sliderValue) {
    document.getElementById("alarmSliderVal").textContent = sliderValue;
    alarmLine = sliderValue;
    refreshAlarmLine();
});

var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var parseTime = d3.timeParse("%d-%b-%y");

var x = d3.scaleTime()
    .rangeRound([0, width]);
var y = d3.scaleLinear()
    .rangeRound([height, 0]);
var xAxis = d3.axisBottom()
    .scale(x);
var yAxis = d3.axisLeft(y)
    .tickSize(6);

var base_line = d3.line()
    .x(function(d) { return x(d.date);})
    .y(function(d) { return y(d.close);});
var waring_line = d3.line()
    .x(function(d) { return x(d.date);})
    .y(function(d) { return y(d.value);})
    .defined(function(d) { return isWaring(d);});
var alarm_line = d3.line()
    .x(function (d) { return x(d.date);})
    .y(function (d) { return y(d.value);})
    .defined(function(d) { return isAlarm(d);});
var line = d3.line()
    .x(function(d) { return x(d.date);})
    .y(function(d) { return y(d.value);})
    .defined(function(d) {return isNormal(d);});

var area_waring = d3.area()
    .x(function(d, i) { return x(d.date);})
    .y1(function(d) { return y(d.close + waringLine);})
    .y0(function(d) { return y(d.close - waringLine);});
var area_alarm = d3.area()
    .x(function(d, i) { return x(d.date);})
    .y1(function(d) { return y(d.close + alarmLine);})
    .y0(function(d) { return y(d.close - alarmLine);});

var legend = svg.append("g").attr("class", "legend");

d3.tsv("data/data.tsv", function(d) {
    d.date = parseTime(d.date);
    d.close = +d.close;
    d.value = +d.value
    return d;
}, function(error, data) {
    if (error) throw error;

    x.domain(d3.extent(data, function(d) { return d.date;}));
    y.domain([0, d3.max(data, function(d) { return Math.round(d.close * 1.2);})]);
    g.datum(data)

    g.append("path")
        .attr("class", "area alarm")
        .attr("d", area_alarm);
    g.append("path")
        .attr("class", "area waring")
        .attr("d", area_waring);

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x axis")
        .call(xAxis);
    g.append("g")
        .call(yAxis)
        .attr("class", "y axis")
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Price ($)");

    svg.append("text")
        .attr("class", "title")
        .attr("x", (width / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .text("Closing value of AAPL stock");
    
    g.append("path")
        .attr("fill", "none")
        .attr("class", "base_line")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", base_line);
    g.append("path")
        .attr("fill", "none")
        .attr("class", "waring_line")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", waring_line);
    g.append("path")
        .attr("fill", "none")
        .attr("class", "alarm_line")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", alarm_line);
    g.append("path")
        .attr("fill", "none")
        .attr("class", "line")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    legend.selectAll('text')
        .data(["#969696", "#808080","#646464","#0066FF","#FFCC33","#B22222"])
        .enter()
        .append("rect")
        .attr("x", width - margin.right)
        .attr("y", function(d, i) {
            return height - margin.top - i * 20;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function(d) {
            return d;
        })
    legend.selectAll('text')
        .data(["告警范围", "警戒范围","基线","实际轨迹","警戒轨迹","告警轨迹"])
        .enter()
        .append("text")
        .attr("x", width - margin.right + 25)
        .attr("y", function(d, i) {
            return height - margin.top - i * 20 + 9;
        })
        .text(function(d) {
            return d
        });

    

});

function refreshWaringLine() {  
    d3.select(".area.waring").attr("d", area_waring);
    d3.select(".waring_line").attr("d", waring_line);
    d3.select(".alarm_line").attr("d", alarm_line);
    d3.select(".line").attr("d", line);
}

function refreshAlarmLine() {
    d3.select(".area.alarm").attr("d", area_alarm);
    d3.select(".waring_line").attr("d", waring_line);
    d3.select(".alarm_line").attr("d", alarm_line);
    d3.select(".line").attr("d", line);
}

function isWaring(d) {
    var l = d.value < (d.close - waringLine) && d.value > (d.close - alarmLine);
    var u = d.value > (d.close + waringLine) && d.value < (d.close + alarmLine);
    if (l || u) {
        return true;
    }
    return false;
}

function isAlarm(d) {
    if (d.value < (d.close - alarmLine) || d.value > (d.close + alarmLine)) {
        return true;
    } 
    return false;  
}

function isNormal(d) {
    return !(isWaring(d) || isAlarm(d));
}

