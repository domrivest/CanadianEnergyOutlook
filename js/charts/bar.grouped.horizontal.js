"use strict";

function bar_grouped_horizontal(data, metadata, colors, settings, language, chartContainer) {

    // setting
    let setting = settings[metadata.chart.type];



    // consts
    const yAxisHeight = setting.dimension.height - (setting.padding.top + setting.padding.bottom + setting.xAxis.lineHeight + setting.xAxis.height + setting.xAxis.labelMargin + setting.xAxis.labelHeight + setting.xTicks.rowMargin),
          xAxisWidth = setting.dimension.width*(setting.distribution.plotRatio/100) - (setting.padding.left + setting.padding.legend + setting.yTicks.row1Margin + setting.yTicks.lineSeparatorMargin + setting.yTicks.fontHeight);

    
          


    // attributes
    let attrList = Object.keys(data[0]).filter(e => (e != metadata.chart.level_1) && (e != metadata.chart.level_2));
    let level_1 = data.map(d => d[metadata.chart.level_1]);
    let level_2 = data.map(d => d[metadata.chart.level_2]);
    level_1 = level_1.filter(function(item, pos) {
        return level_1.indexOf(item) == pos;
    });
    level_2 = level_2.filter(function(item, pos) {
        return level_2.indexOf(item) == pos;
    });



    // data conversion and re arrange
    /* **************************************************** */
    dataCoversion(data, attrList);
    /* **************************************************** */



    // data re arrange by aggregation level 2
    let data_ = [];
    level_2.forEach(e => {
        data_.push(data.filter(g => g[metadata.chart.level_2] == e))
    });
    


    // map the colors
    /* **************************************************** */
    let color = mapColor(colors, level_1);
    let colorList = color.map(x => x.color);
    /* **************************************************** */




    // map the xLabel and yLabel
    /* **************************************************** */
    let axis = [metadata.chart.xLabel, metadata.chart.yLabel];
    let axisList = mapColor(colors, axis);
    /* **************************************************** */



    

    // scale for color
    let scaleColor = d3.scaleOrdinal()
    .domain(level_1)
    .range(colorList);



    // scale for label
    let scaleLabel = d3.scaleOrdinal()
    .domain(level_1)
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
    let chart = initChart(data_, setting, level_2, chartContainer);
    /* **************************************************** */



    // legend
    const maxLegend = setting.dimension.width*(setting.distribution.legendRatio/100) - (setting.padding.right + setting.legend.colorBoxWidth + setting.legend.boxToText);
    let attrListLegend = level_1.map(x => x);
    /* **************************************************** */
    legend(chart, maxLegend, attrListLegend, setting, scaleColor, scaleLabel);
    /* **************************************************** */
    chart.select("g.legend")
    .attr("transform", `translate(${setting.dimension.width*(setting.distribution.plotRatio/100)}, ${setting.padding.top})`);



    // scale for X
    /* **************************************************** */
    let scaleX = scaleX_bar(data, xAxisWidth);
    /* **************************************************** */



    // X axis + label
    /* **************************************************** */
    xAxisInit_bar(chart, scaleX, scaleAxis(metadata.chart.xLabel));
    /* **************************************************** */
    let xAxisLabelWidth = chart.select("g.x_axis > .text").node().getBBox().width;
    chart.select("g.x_axis > .text")
    .attr("transform", `translate(${xAxisWidth / 2 - xAxisLabelWidth / 2},${setting.xTicks.rowMargin + setting.xAxis.height + setting.xAxis.lineHeight + setting.xAxis.labelMargin})`);
    chart.select("g.x_axis")
    .attr("transform", `translate(${setting.padding.left + setting.yTicks.fontHeight + setting.yTicks.lineSeparatorMargin + setting.yTicks.lineSeparatorExtra + setting.yTicks.row1Margin},${setting.padding.top + yAxisHeight})`);



    //scale for Y
    let scaleY = d3.scaleLinear()
    .domain([0, yAxisHeight])
    .range([0, yAxisHeight]);



    // add the y axis
    chart.append("g")
    .attr("transform", `translate(${setting.padding.left + setting.yTicks.row1Margin + setting.yTicks.lineSeparatorMargin + setting.yTicks.lineSeparatorExtra + setting.yTicks.fontHeight}, ${setting.padding.top})`)
    .attr("class", "y_axis")
    .call(d3.axisLeft(scaleY).ticks(0));



    // bar distribution calculations
    let distribution = {
        barSpace: null,
        groupSpace: null,
        barWidth: null,
        groupSpaceNumber: data_.length - 1,
        barSpaceNumber: 0,
        barNumber: data.length,
        preSpace: yAxisHeight * (setting.distribution.preSpacePercent/100)
    }
    /* **************************************************** */
    distributionCalculation_bar(distribution, data_, yAxisHeight, setting);
    /* **************************************************** */

    
        
    // add grid lines for x axis
    /* **************************************************** */
    xAxisGrid_bar(chart, yAxisHeight, scaleX, setting);
    /* **************************************************** */  
    chart.select("g.grid")
    .attr("transform", `translate(${setting.padding.left + setting.yTicks.row1Margin + setting.yTicks.lineSeparatorMargin + setting.yTicks.lineSeparatorExtra + setting.yTicks.fontHeight}, ${setting.padding.top + yAxisHeight})`);

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
    var mousemove = function(d, i, barData) {
        Tooltip
            .html(scaleLabel(d) + ":<br>" + Math.round(barData[d]))
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

    //drawing bars
    chart.selectAll("g.bar_groups")
    .each(function(d, i) {
        d3.select(this)
        .selectAll("g")
        .data(data_[i])
        .enter()
        .append("g")
        .each(function(d, j) {
            var barData = d;
            let x = 0;
            let xPositive = 0;
            let xNegative = 0;
            d3.select(this)
            .attr("data-content", d[metadata.chart.level_1])
            .attr("class", "bar")
            .attr("transform", `translate(0, ${(distribution.barSpace + distribution.barWidth) * j})`);
            d3.select(this)
            .selectAll("rect")
            .data(attrList)
            .enter()
            .append("rect")
            .attr("y", 0)
            .attr("height", distribution.barWidth)
            .attr("width", cat => Math.abs(scaleX(0) - scaleX(d[cat])))
            .attr("fill", cat => scaleColor(d[metadata.chart.level_1]))
            .attr("data-field", cat => cat)
            // adjusting bar positions
            .each(function(_, k) {
                // if(d[attrList[k]] > 0) {
                //     xPositive = xPositive + scaleX(0) - scaleX(d[attrList[k]]);
                //     x = xPositive;
                // }
                // else {
                //     xNegative = xNegative + scaleX(0) - scaleX(d[attrList[k]]);
                //     x = xNegative;
                // }
                
                d3.select(this)
                .attr("x",  () => {
                    if(d[attrList[k]] > 0) {
                        return scaleX(0) - x + setting.padding.left + setting.yTicks.row1Margin + setting.yTicks.lineSeparatorMargin + setting.yTicks.lineSeparatorExtra + setting.yTicks.fontHeight;
                    }
                    else {
                        return 2*scaleX(0) - x - scaleX(d[attrList[k]]) + setting.padding.left + setting.yTicks.row1Margin + setting.yTicks.lineSeparatorMargin + setting.yTicks.lineSeparatorExtra + setting.yTicks.fontHeight;
                    }
                });
            })
            .on("mouseover", mouseover)
            .on("mousemove", function (d) {return mousemove(d, i, barData)})
            .on("mouseleave", mouseleave)
        });  
    });



    
    let barGroupHeight = [];
    let barGroupPos = data_.map(d => 0);
    /* **************************************************** */
    groupPosition_bar_horizontal(chart, barGroupHeight, barGroupPos, setting, distribution);
    /* **************************************************** */
    chart.selectAll("g.bar_groups")
    .each(function(_, i) {
        d3.select(this)
        .attr("transform", `translate(0, ${barGroupPos[i]})`)
    });
    



    // add ticks level 1 for y axis
    /* **************************************************** */
    ticks_grouped_horizontal_horizontal_bar(chart, level_2, metadata, xAxisWidth, setting, barGroupHeight);
    /* **************************************************** */
    
}