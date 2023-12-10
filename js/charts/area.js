"use strict";

function area(data, metadata, colors, settings, language, chartContainer) {
    
    // setting
    let setting = settings[metadata.chart.type];


    // consts
    const yAxisHeight = setting.dimension.height - (setting.padding.top + setting.padding.bottom + setting.xTicks.row1Margin + setting.xTicks.fontHeight),
          xAxisWidth = setting.dimension.width*(setting.distribution.plotRatio/100) - (setting.padding.left + setting.padding.legend + setting.yAxis.width + setting.yAxis.labelMargin + setting.yAxis.labelHeight + setting.yAxis.lineWidth + setting.yTicks.rowMargin);



    // attributes
    let attrList = Object.keys(data[0]).filter(e => (e != metadata.chart.level_1));
    let level_1 = data.map(d => d[metadata.chart.level_1]);
    level_1 = level_1.filter(function(item, pos) {
        return level_1.indexOf(item) == pos;
    });



    // data conversion and re arrange
    /* **************************************************** */
    dataCoversion_area(data, metadata, attrList, level_1);
    /* **************************************************** */



    // data re arrange by aggregation attrList
    let data_ = [];
    attrList.forEach(e => {
        data_.push(new Array());
    });
    data_.forEach((g, i) => {
        data.forEach(r => {
            g.push({
                [attrList[i]]: r[attrList[i]],
                [metadata.chart.level_1]: r[metadata.chart.level_1]

            })
        })
    })



    // map the colors
    /* **************************************************** */
    let color = mapColor(colors, attrList);
    let colorList = color.map(x => x.color);
    /* **************************************************** */




    // map the xLabel and yLabel
    /* **************************************************** */
    let axis = [metadata.chart.xLabel, metadata.chart.yLabel];
    let axisList = mapColor(colors, axis);
    /* **************************************************** */

    


    // scale for color
    let scaleColor = d3.scaleOrdinal()
    .domain(attrList)
    .range(colorList);



    // scale for label
    let scaleLabel = d3.scaleOrdinal()
    .domain(attrList)
    .range(color.map(x => x[language]));




    // scale for axis
    let scaleAxis = d3.scaleOrdinal()
    .domain(axis)
    .range(axisList.map(function(x,i) {
        if(x) {
            return x[language];
        } else {
            return axis[i];
        }
    }));




    // initialize
    /* **************************************************** */
    let chart = initChart(data_, setting, attrList, chartContainer);
    /* **************************************************** */

    


    // legend
    const maxLegend = setting.dimension.width*(setting.distribution.legendRatio/100) - (setting.padding.right + setting.legend.colorBoxWidth + setting.legend.boxToText);
    let attrListLegend = attrList.map(x => x).reverse();
    /* **************************************************** */
    legend(chart, maxLegend, attrListLegend, setting, scaleColor, scaleLabel);
    /* **************************************************** */
    chart.select("g.legend")
    .attr("transform", `translate(${setting.dimension.width*(setting.distribution.plotRatio/100)}, ${setting.padding.top})`);




    let stackedData = d3.stack().keys(attrList)(data);
    let	area = d3.area()
    .x(d => scaleX(d.data[metadata.chart.level_1]))
    .y0(d => scaleY(d[0]))
    .y1(d => scaleY(d[1]));




    // scale for Y
    /* **************************************************** */
    let scaleY = scaleY_area(stackedData, yAxisHeight);
    /* **************************************************** */



    // y axis + label
    /* **************************************************** */
    yAxisInit_bar(chart, scaleY, scaleAxis(metadata.chart.yLabel));
    /* **************************************************** */
    let yAxisLabelWidth = chart.select("g.y_axis > .text").node().getBBox().width;
    chart.select("g.y_axis > .text")
    .attr("transform", `translate(${-1 * (setting.yAxis.labelMargin + setting.yAxis.width + setting.yTicks.rowMargin)}, ${(yAxisHeight) / 2 + yAxisLabelWidth / 2}) rotate(-90)`);
    chart.select("g.y_axis")
    .attr("transform", `translate(${setting.padding.left + setting.yAxis.width + setting.yAxis.labelMargin + setting.yAxis.labelHeight + setting.yTicks.rowMargin}, ${setting.padding.top})`);



    //scale for X
    /* **************************************************** */
    let scaleX = scaleX_area(data, metadata, level_1, xAxisWidth);
    /* **************************************************** */



    // x axis
    chart.append("g")
    .attr("transform", `translate(${setting.padding.left + setting.yAxis.labelHeight + setting.yAxis.labelMargin + setting.yAxis.width + setting.yTicks.rowMargin}, ${setting.padding.top + yAxisHeight})`)
    .attr("class", "x_axis")
    .call(d3.axisBottom(scaleX).ticks(0));


    
        
    // add grid lines for y axis
    /* **************************************************** */
    yAxisGrid_bar(chart, xAxisWidth, scaleY, setting, language);
    /* **************************************************** */  
    chart.select("g.yGrid")
    .attr("transform", `translate(${setting.padding.left + setting.yAxis.labelHeight + setting.yAxis.labelMargin + setting.yAxis.width + setting.yTicks.rowMargin}, ${setting.padding.top})`);



    // add grid lines for x axis
    /* **************************************************** */
    xAxisGrid_area(chart, level_1, yAxisHeight, scaleX, setting);
    /* **************************************************** */
    chart.select("g.xGrid")
    .attr("transform", `translate(${setting.padding.left + setting.yAxis.labelHeight + setting.yAxis.labelMargin + setting.yAxis.width + setting.yTicks.rowMargin}, ${setting.padding.top + yAxisHeight})`);

    // create a tooltip
    var Tooltip = d3.select(chartContainer)
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
    Tooltip
        .style("opacity", 1)
    d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
    }
    var mousemove = function(d) {
    Tooltip
        .html(d.key + "")
        .style("left", (d3.mouse(document.body)[0]+5) + "px")
        .style("top", (d3.mouse(document.body)[1]) + "px")
    }
    var mouseleave = function(d) {
    Tooltip
        .style("opacity", 0)
    d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
    }

    //drawing area
    chart.selectAll("g.bar_groups")
    .each(function(d, i) {
    d3.select(this)
    .attr("class", "")
    .attr("class", "area")
    .append("path")
    .datum(stackedData[i])
    .attr("d", d => area(d))
    .attr("fill", d => scaleColor(d.key))
    .attr("stroke", d => scaleColor(d.key))
    .attr("transform", `translate(${setting.padding.left + setting.yAxis.width + setting.yAxis.labelMargin + setting.yAxis.labelHeight + setting.yAxis.lineWidth + setting.yTicks.rowMargin}, ${setting.padding.top})`)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    });
}