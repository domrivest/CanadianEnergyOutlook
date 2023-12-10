"use strict";
document.addEventListener('DOMContentLoaded', function () { 
            setTimeout(function () {}, 5000); // Delay of 5 seconds 
       
(function (d3) {
    /***** settings *****/
    let figures, colors, settings_default, setting_3Bar, setting_3BarOffset, setting_5BarOffset, setting_singleBar,
    settings_singleBarOffset, settings_2Bar, settings_map, language;

    /***** DOM *****/
    let $select = {},
    $figures = document.querySelectorAll(".figure"),
    $showTitle = {},
    $showSource = {},
    $showFiligrane = {};

    $select.value = "english";
    $showTitle.checked = false;
    $showSource.checked = false;
    $showFiligrane.checked = false;

    /***** loading data *****/
    const wordpressPath = "/CanadianEnergyOutlook";
    var promises = [];
    promises.push(d3.csv(wordpressPath+"/data/figures.csv")); 
    promises.push(d3.csv(wordpressPath+"/data/colors.csv"));
    promises.push(d3.csv(wordpressPath+"/data/setting_default.csv")); // 2
    promises.push(d3.csv(wordpressPath+"/data/setting_3Bar.csv")); // 3 
    promises.push(d3.csv(wordpressPath+"/data/setting_3BarOffset.csv")); // 4
    promises.push(d3.csv(wordpressPath+"/data/setting_5BarOffset.csv")); // 5
    promises.push(d3.csv(wordpressPath+"/data/setting_singleBar.csv")); // 6
    promises.push(d3.csv(wordpressPath+"/data/setting_singleBarOffset.csv")); // 7
    promises.push(d3.csv(wordpressPath+"/data/setting_2Bar.csv")); // 7
    promises.push(d3.csv(wordpressPath+"/data/settings_map.csv")); // 8

    Promise.all(promises)
    
        /***** after load *****/
        .then(function (data) {

            /***** data preprocessing *****/
            figures = data[0].map(d => d.figure + " - " + d.type);
            colors = parseColors(data[1]);
            settings_default = parserSettings(data[2]);
            setting_3Bar = parserSettings(data[3]);
            setting_3BarOffset = parserSettings(data[4]);
            setting_5BarOffset = parserSettings(data[5]);
            setting_singleBar = parserSettings(data[6]);
            settings_singleBarOffset = parserSettings(data[7]);
            settings_2Bar = parserSettings(data[8]);
            settings_map = data[9];
            /***** initiate *****/
        });

    /***** functions *****/
    
    function fileLoad(file, figure) {
        // Check if the selected file is of the desired type (e.g., text)
        const textType = /text.*/;
        if (file.type.match(textType)) {
            const reader = new FileReader();
    
            reader.onload = function (e) {
                const content = reader.result;
    
                // Parse and display the chart for this file
                const parsedData = parser(content);
                
                // Choose the appropriate setting file for the settings
                let generationType = settings_map.filter(e => e.no == file.name.replace(".txt", ""));
                let settings = [];
                switch (generationType.generation) {
                    case undefined:
                        settings = settings_default;
                        break;
                    case "3Bar":
                        settings = settings_3Bar;
                        break;
                    case "3BarOffset":
                        settings = settings_3BarOffset;
                        break;
                    case "5BarOffset":
                        settings = settings_5BarOffset;
                        break;
                    case "singleBarOffset":
                        settings = settings_singleBarOffset;
                        break;
                    case "singleBar":
                        settings = settings_singleBar;
                        break;
                    case "2Bar":
                        settings = settings_2Bar;
                        break;
                }
                
                // Create a new container for this chart (and add class of title)
                const chartContainer = document.createElement("div");
                chartContainer.classList.add("chart-container", file.name.replace(".txt", ""));
                figure.appendChild(chartContainer);
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                chartContainer.appendChild(svg);

    
                // Draw the chart inside this container
                if($select.value == "english"){language = "label_en"}
                else if($select.value == "french"){language = "label_fr"}
                draw(parsedData, language, chartContainer, settings);
            };
    
            // Read the content of the selected file
            reader.readAsText(file);
        } else {
            // Handle the case where the file type is not supported
            console.log("File not supported: " + file.name);
        }
    }
    
    
    function draw(content, language, chartContainer, settings) {
        //clearChart();
        //console.clear();
        // Remove the hide class from the chart container's SVG
        chartContainer.querySelector("svg").classList.remove("hide");
        document.querySelector("svg").classList.remove("hide");
            let parsed = content;
            let chartTitle = parsed.metadata.chart.title;
            let chartSource = parsed.metadata.chart.source;
            switch(parsed.metadata.chart.type) {
                case "bar.grouped.stacked":
                    bar_grouped_stacked(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped.stacked.mosaic":
                    bar_grouped_stacked(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped.stacked.percent":
                    bar_grouped_stacked_percent(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped.stacked.multi":
                    bar_grouped_stacked_multi(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped.stacked.double":
                    bar_grouped_stacked_double_joiner(content, colors, settings, language, chartContainer);
                    break;
                case "bar.stacked":
                    bar_stacked(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.stacked.center":
                    bar_stacked_center(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped":
                    bar_grouped(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped.overlap":
                    bar_grouped_overlap(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped.horizontal":
                    bar_grouped_horizontal(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "bar.grouped.grouped":
                    bar_grouped_grouped(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break; 
                case "line":
                    line(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "area":
                    area(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "fan":
                    fan(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;
                case "fan.mosaic":
                fan(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                break;
                case "scatter":
                    scatter(parsed.data, parsed.metadata, colors, settings, language, chartContainer);
                    break;   
            }
            // ADD SVG container for source and title
            if ($showTitle.checked) {showTitle(chartContainer, chartTitle)}
            if ($showSource.checked) {showSource(chartContainer, chartSource)};
            if ($showFiligrane.checked) {showFiligrane(chartContainer)};
    }

    function showTitle(chartContainer, title) { // Ajoute le titre le padding nécessaire sur le graphique si la case est cochée
        const titlePad = 100;
        let svg = chartContainer.querySelector("svg");
        d3.select(chartContainer).select("svg")
        .attr("height", svg.viewBox.baseVal.height+titlePad);
        d3.select(svg)
        .append("g")
        .attr("class", "figureTitle")
        .append("text")
        .attr("x", svg.viewBox.baseVal.width/2)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .text(title);
    }

    function showSource(chartContainer, source) { // Affiche la source et le padding nécessaire sur le graphique si la case est cochée
        const heightPadSource = 20;
        const titlePad = 100;
        const leftPadSource = 15;
        const svg = chartContainer.querySelector("svg");
        if (!$showTitle.checked) { // Padding différent si showTitle activé
            d3.select(chartContainer).select("svg")
            .attr("height", svg.viewBox.baseVal.height+heightPadSource);
            d3.select(svg)
            .append("g")
            .attr("class", "source")
            .append('text')
            .attr("text-anchor", "start")
            .attr("x", leftPadSource)
            .attr("y", svg.viewBox.baseVal.height+heightPadSource/3)
            .text("Source: " + source);
        } else {
            d3.select(svg)
            .append("g")
            .attr("class", "source")
            .append('text')
            .attr("text-anchor", "start")
            .attr("x", leftPadSource)
            .attr("y", svg.viewBox.baseVal.height+titlePad/2-heightPadSource/2)
            .text("Source: " + source);
        }
    }

    function showFiligrane(chartContainer) { // Ajoute un filigrane sur le graphique si la case est cochée
        const svg = chartContainer.querySelector("svg");
        d3.select(svg)
        .append("g")
        .attr("class", "filigrane")
        .append('text')
        .attr("text-anchor", "middle")
        .attr("x", 0)
        .attr("y", 0)
        .text("Institut de l'énergie Trottier")
        .attr('transform', 'translate('+svg.viewBox.animVal.width/2+','+svg.viewBox.animVal.height/2+')rotate(-30)')
    }
    
    
    // This is a function to create a custom File object
    function createFileFromText(content, fileName) {
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], fileName, { type: 'text/plain' });
        return file;
    }

    $figures.forEach(figure => {
        // Usage of the createFileFromText function after fetching the content
        fetch(wordpressPath+figure.classList[1].substring(1))
        .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.arrayBuffer(); // This returns the content of the file as text
        })
        .then(buffer => new TextDecoder("utf-16le").decode(buffer)) // Decode in UTF8
        .then((fileContent) => {
        // Create a custom File object with the fetched content
        const fileName = "fig3.1.txt"; // Provide the desired file name
        const customFile = createFileFromText(fileContent, fileName);
    
        // Now you have a custom File object that you can use like a FileInput result
        fileLoad(customFile, figure);
        
        // You can then use this customFile with the same logic as you would with a FileInput
        // For example, you can call fileLoad(customFile) if fileLoad expects a File object.
        })
        .catch((error) => {
        console.error("Error loading the file:", error);
        });
    })

})(d3);
     });