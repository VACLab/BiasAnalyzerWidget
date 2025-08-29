import * as d3 from 'https://esm.sh/d3@7';

// function initialize({ model }) {
//     // Set up shared state or event handlers.
//     return () => {
//       // Optional: Called when the widget is destroyed.
//     }
// } // end initialize

function render({ model, el }) {
    // for testing
    // alert('hello');

    // DISPATCHERS

    // for handling the concepts table
    let conceptsTableDispatcher = d3.dispatch('filter','sort');


    // <editor-fold desc="---------- UTILITY FUNCTIONS ----------"

    // clears an element
    function clearElement(element) {
        element.selectAll('*').remove();
    }

    // converts timestamp to formatted date 'YYYY-MM-DD'
    function getIsoDateString(timestamp) {
        let aDate = new Date(timestamp);
        return aDate.toISOString().split('T')[0];
    }

    // converts keys to readable words by:
    // 1. replacing the underscore with a space, and
    // 2. capitalizing the first letter of each word
    function makeKeysWords (keys) {
        return keys.map(key => {
            return key.split('_')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
        });
    }
    // </editor-fold>

    // <editor-fold desc="---------- DEFINE DATA ----------">

    var concepts1 = model.get('_concepts1');
    var race_stats1 = model.get('_race_stats1');
    var gender_dist1 = model.get('_gender_dist1');
    var age_dist1 = model.get('_age_dist1');

    var concepts2 = model.get('_concepts2');
    var race_stats2 = model.get('_race_stats2');
    var gender_dist2 = model.get('_gender_dist2');
    var age_dist2 = model.get('_age_dist2');

    // </editor-fold>

    // <editor-fold desc="---------- VISUAL CONTROL FUNCTIONS ----------">

    /*
* draws a search box
* Parameters:
*   containerId: type: string - prepended id of container where the control is to be rendered.
*   dispatch: d3.dispatch instance - user input event handler
*   label: type: string - label for the control
*   width: type: string - the width of the input box in pixels
*   data: type: list of objects - each object should have the keys display (string),
*                                        and data (anything needed to handle the selection
*   handleSearch: type: function - callback
* Return:
*   div: DOM div element containing input box
*/
    function SearchBox(dispatch, label='Search', width=300) {
        let div = d3.create("xhtml:div")
            .attr("xmlns", "http://www.w3.org/1999/xhtml")
            .style("padding", "10px");

        let input = div.append('input')
            .attr('type', 'text')
            .attr('placeholder', label);

        input.on('input', function (event) {
            dispatch.call('filter', this, event.target.value);  // dispatch filter event
        });

        return div;
    }

    // </editor-fold>

    // <editor-fold desc="---------- VERTICAL BAR CHART FUNCTIONS ----------">

    function VerticalBarChart(
        series1,  // required
        {
            series2 = { data: null, name: "cohort 2" },   // default object
            dimensions: {
                xlabel = "",
                ylabel = "",
                title = "",
                width = 600,
                height = 400,
                margin = { top: 40, right: 10, bottom: 60, left: 80 },
                padding = 0.1
            } = {}
        } = {}  // default for options object
    ) {
        // validate series1
        if (!series1 || !series1.data) {
            throw new Error("SvgVerticalBarChart requires series1 with a 'data' property.");
        }

        // default series1 name if missing
        if (!series1.name){
            series1.name = "cohort 1";
        }

        let svg = d3.create('svg')
            .attr('class', 'barchart')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Combine data for scales
        const combinedData = series2.data ? series1.data.concat(series2.data) : series1.data;

        // Set up scales
        const xScale = d3.scaleBand(series1.data.map(d => d.category),
            [margin.left, width - margin.right])
            .padding(padding);

        const yScale = d3.scaleLinear([0, d3.max(combinedData, d => d.value)],
            [height - margin.bottom, margin.top])
            .nice();

        // Add X-axis
        svg.append('g')
            .attr('transform', `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .attr('class', 'axis');
        // .selectAll('text')
        // .attr('transform', 'rotate(-45)')
        // .style('text-anchor', 'end');

        // x-axis label
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height - 20)
            .style('text-anchor', 'middle')
            .text(xlabel);

        // Add Y-axis
        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale))
            .attr('class', 'axis');

        // y-axis label
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', height / 2 * -1)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text(ylabel);

        if (title === '' && xlabel !== ''){
            title = xlabel + ' Distribution';
        }

        svg.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .text(title);

        // console.log(xScale.bandwidth());

        // series 1 bars
        svg.selectAll('.bar1')
            .data(series1.data)
            .enter()
            .append('rect')
            .attr('class', 'bar1')
            .attr('x', d => series2.data && series2.data.length > 0 ? xScale(d.category) : xScale(d.category)) // CHANGED: Added conditional logic
            .attr('y', d => yScale(d.value))
            .attr('width', series2.data && series2.data.length > 0 ? xScale.bandwidth() / 2 : xScale.bandwidth()) // CHANGED: Half width when 2 series
            .attr('height', d => height - margin.bottom - yScale(d.value));

        if (series2.data && series2.data.length > 0) {
            // series 2 data bars
            svg.selectAll('.bar2')
                .data(series2.data)
                .enter()
                .append('rect')
                .attr('class', 'bar2')
                .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.value))
                .attr('width', xScale.bandwidth() / 2)
                .attr('height', d => height - margin.bottom - yScale(d.value));

            // Add labels for series 2 data
            svg.selectAll('.label2')
                .data(series2.data)
                .enter()
                .append('text')
                .attr('class', 'label2')
                .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2 + xScale.bandwidth() / 4) // CHANGED: Fixed positioning
                .attr('y', d => yScale(d.value) - 5)
                .attr('text-anchor', 'middle')
                .text(d => d.value);

            // labels for series 1 data if there are 2 datasets
            svg.selectAll('.label1')
                .data(series1.data)
                .enter()
                .append('text')
                .attr('class', 'label1')
                .attr('x', d => xScale(d.category) + xScale.bandwidth() / 4) // CHANGED: Fixed positioning
                .attr('y', d => yScale(d.value) - 5)
                .attr('text-anchor', 'middle')
                .text(d => d.value);

            // only show legend if there are 2 datasets
            const legendData = [
                { label: series1.name, color: 'steelblue' },
                { label: series2.name, color: 'orange' }
            ];

            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${margin.left}, ${height - 20})`);

            legend.selectAll('rect')
                .data(legendData)
                .enter()
                .append('rect')
                .attr('x', (d, i) => i * 100) // Adjust spacing as needed
                .attr('y', 0)
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', d => d.color);

            legend.selectAll('text')
                .data(legendData)
                .enter()
                .append('text')
                .attr('x', (d, i) => i * 100 + 24) // Adjust spacing as needed
                .attr('y', 9)
                .attr('dy', '0.35em')
                .text(d => d.label);
        }
        else{
            // labels for series 1 data if there is 1 dataset
            svg.selectAll('.label1')
                .data(series1.data)
                .enter()
                .append('text')
                .attr('class', 'label1')
                .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2 + 5)
                .attr('y', d => yScale(d.value) - 5)
                .attr('text-anchor', 'middle')
                .text(d => d.value);
        }

        return svg;
    }

    // </editor-fold>

    // <editor-fold desc="---------- CONCEPTS TABLE FUNCTIONS ----------">

    function prepareConceptsCompareData(concepts1, concepts2) {

        // console.log(`Concepts1: ${JSON.stringify(concepts1)}`);
        // console.log(`Concepts2: ${JSON.stringify(concepts2)}`);

        // function hellingerDistance(P, Q) {
        //     if (P.length !== Q.length) {
        //         throw new Error("The distributions must have the same length.");
        //     }
        //
        //     let sum = 0;
        //     for (let i = 0; i < P.length; i++) {
        //         sum += Math.pow(Math.sqrt(P[i]) - Math.sqrt(Q[i]), 2);
        //     }
        //
        //     return (1 / Math.sqrt(2)) * Math.sqrt(sum);
        // }

        let mergedList = concepts1.map(item1 => {
            const item2 = concepts2.find(item => item.concept_code === item1.concept_code);
            return Object.assign({}, item1, item2);
        });

        // Add a key-value pair based on a calculation (e.g., double the age)
        mergedList = mergedList.map(item => {
            item.difference = (item.study_prevalence ?? 0) - (item.base_prevalence ?? 0);

            // item.bias = hellingerDistance(item.study_prevalence, item.base_prevalence);
            item.bias = Math.abs(item.difference);
            delete item.study_count;
            delete item.base_count;
            delete item.ancestor_concept_id;
            delete item.descendant_concept_id;
            return item;
        });

        const order = ['concept_code', 'concept_name', 'base_prevalence', 'difference', 'study_prevalence', 'bias'];

        mergedList = mergedList.map(item => {
            const rearrangedItem = {};
            order.forEach(key => {
                if (item.hasOwnProperty(key)) {
                    rearrangedItem[key] = item[key];
                }
            });
            return rearrangedItem;
        });

        mergedList.sort((a, b) => b.bias - a.bias);

        // console.log(mergedList);

        return mergedList;
    }

    function handleFilterConceptsTable(dispatch, row, body_svg) {
        dispatch.on("filter", search_term => {
            const normalized = search_term.toLowerCase().replace(/[^a-z0-9]/g, "");
            row.style("display", null);
            row.filter(d => {
                const code = d.concept_code.toLowerCase();
                const name = d.concept_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                return !(code.startsWith(normalized) || name.includes(normalized));
            }).style("display", "none");

            // Recompute Y positions for visible rows
            let yOffset = 0;
            row.filter(function () {
                return d3.select(this).style("display") !== "none";
            })
                .each(function () {
                    d3.select(this).attr("transform", `translate(0, ${yOffset})`);
                    yOffset += parseFloat(d3.select(this).select("rect").attr("height"));
                });
            body_svg.attr("height", yOffset);
        });
    }

    function ConceptsTable(data, dispatch,
                           {data2 = null,
                               dimensions = { height: 432, row_height: 30 }} = {}){
        // ==== Validation for required params ====
        if (data === null) {
            throw new Error("drawConceptsTable requires a 'data' parameter.");
        }

        if (
            !dispatch ||
            typeof dispatch !== "object" ||
            typeof dispatch.call !== "function" ||
            typeof dispatch.on !== "function"
        ) {
            throw new Error("drawConceptsTable requires a valid d3.dispatch object.");
        }

        // ==== Validate optional params ====
        if (data2 !== null && !Array.isArray(data2)) {
            console.warn("drawConceptsTable: 'data2' should be an array (or null).");
        }

        if (typeof dimensions !== "object" || dimensions === null) {
            throw new Error("drawConceptsTable: 'dimensions' must be an object.");
        }

        let table_data;
        if (data2 !== null) {
            table_data = prepareConceptsCompareData(data, data2);
        } else {
            table_data = data;
        }

        const text_offset_x = 10;
        const { height, row_height } = dimensions;

        // === container with scroll ===
        const container = d3.create("div")
            .style("width", "100%")
            .style("max-height", height + "px")
            .style("overflow", "auto")
            .style("position", "relative")
            .style("border", "1px solid #ccc")
            .style("font-family", "sans-serif");

        // === HEADERS ===

        const headers_text = makeKeysWords(Object.keys(table_data[0]));
        if (!table_data.length) {
            throw new Error("drawConceptsTable: table_data is empty.");
        }

        // TODO: I have assumed a maximum drawing area width of about 1070px. We may need to change this so that we get
        //       the available canvas size and dynamically resize the visualization accordingly.
        let columns_data;
        if(data2 === null){
            columns_data = [
                { text: headers_text[1], field: "concept_code", x: 0, width: 160 },
                { text: headers_text[0], field: "concept_name", x: 160, width: 590 },
                { text: headers_text[2], field: "count_in_cohort", x: 750, width: 160 },
                { text: headers_text[3],
                    field: d => (d.prevalence !== null ? d.prevalence.toFixed(3) : ""), x: 910, width: 160 }
            ];
        }
        else{
            columns_data = [
                { text: headers_text[0], field: "concept_code", x: 0, width: 140, type: 'text' },
                { text: headers_text[1], field: "concept_name", x: 140, width: 330, type: 'text' },
                { text: headers_text[2],
                    field: d => (d.base_prevalence !== null ? d.base_prevalence.toFixed(3) : ""),
                    x: 470, width: 120, type: 'text' },
                { text: headers_text[3], field: "difference", x: 590, width: 240, type: 'compare_bars' },
                { text: headers_text[4],
                    field: d => (d.study_prevalence !== null ? d.study_prevalence.toFixed(3) : ""),
                    x: 830, width: 120, type: 'text' },
                { text: headers_text[5], field: "bias", x: 950, width: 120, type: 'bar' }
            ];
        }

        const total_table_width = d3.sum(columns_data, d => d.width);

        const headers_svg = container.append("svg")
            .attr("width", total_table_width)
            .attr("height", row_height)
            .style("position", "sticky")
            .style("top", 0)
            .style("background", "white")
            .style("z-index", 1);

        const headers_g = headers_svg.append("g");

        const header_g = headers_g.selectAll("g")
            .data(columns_data)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x},0)`);

        header_g.append("rect")
            .attr("width", d => d.width)
            .attr("height", row_height)
            .attr("fill", "#d0d0d0")
            .attr("stroke", "#fff");

        header_g.append("text")
            .attr("x", text_offset_x)
            .attr("y", row_height / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .text(d => d.text);

        // === Column resizing handle ===
        header_g.append("rect")
            .attr("class", "resize-handle")
            .attr("x", d => d.width - 5)
            .attr("y", 0)
            .attr("width", 5)
            .attr("height", row_height)
            .style("cursor", "col-resize")
            .style("fill", "transparent")
            .call(d3.drag()
                .on("start", function(event, d) {
                    d.startWidth = d.width;       // store starting width
                    d.startX = event.x;           // store starting mouse X
                })
                .on("drag", function(event, d) {
                    const dx = event.x - d.startX;           // change in mouse X
                    const newWidth = Math.max(30, d.startWidth + dx); // minimum width 30
                    d.width = newWidth;

                    // Update header rect
                    d3.select(this.parentNode).select("rect").attr("width", newWidth);
                    // Update resize handle position
                    d3.select(this).attr("x", newWidth - 5);

                    // Recalculate x positions for all columns after this one
                    let x = 0;
                    columns_data.forEach(col => {
                        col.x = x;
                        x += col.width;
                    });

                    // Update header positions
                    headers_g.selectAll("g").attr("transform", col => `translate(${col.x},0)`);

                    // Update body cell positions and widths
                    body_svg.selectAll(".row").each(function(row_data) {
                        d3.select(this).selectAll(".cell")
                            .attr("transform", (c, i) => `translate(${columns_data[i].x},0)`)
                            .select(".cell_bg")
                            .attr("width", (c, i) => columns_data[i].width);
                    });

                    // Update body and header SVG width
                    const totalWidth = d3.sum(columns_data, c => c.width);
                    body_svg.attr("width", totalWidth);
                    headers_svg.attr("width", totalWidth);
                })
            );

        // === BODY ===

        const body_svg = container.append("svg")
            .attr("width", total_table_width)
            .attr("height", table_data.length * row_height);

        const rows_g = body_svg.append("g");

        const row = rows_g.selectAll(".row")
            .data(table_data)
            .enter()
            .append("g")
            .attr("class", "row")
            .attr("transform", (d, i) => `translate(0, ${i * row_height})`);

        let max_bias, max_diff, margin = 5;
        if (data2 !== null) {
            max_bias = d3.max(table_data, d => Math.abs(d.bias)) || 0;
            max_diff = d3.max(table_data, d => Math.abs(d.difference)) || 0;
        }

        const biasScale = d3.scaleLinear();
        const barScale = d3.scaleLinear();
        let zeroX, g, outerHeight, innerY, innerH;

        // per-row, per-column cells
        columns_data.forEach(col => {
            const cell = row.append("g")
                .attr("class", "cell")
                .attr("transform", `translate(${col.x},0)`);

            cell.append("rect")
                .attr("class", "cell-bg")
                .attr("width", col.width)
                .attr("height", row_height)
                .attr("fill", "#f0f0f0")
                .attr("stroke", "#ccc");

            if (data2 === null) {
                cell.append("text")
                    .attr("x", text_offset_x)
                    .attr("y", row_height / 2)
                    .attr("dy", "0.35em")
                    .attr("text-anchor", "start")
                    .text(row_data => {
                        const val = typeof col.field === "function" ? col.field(row_data) : row_data[col.field];
                        return val !== null ? val : "";
                    });
            } else {
                switch (col.type) {
                    case "text":
                        cell.append("text")
                            .attr("x", text_offset_x)
                            .attr("y", row_height / 2)
                            .attr("dy", "0.35em")
                            .attr("text-anchor", "start")
                            .text(row_data => {
                                const val = typeof col.field === "function" ? col.field(row_data) : row_data[col.field];
                                return val !== null ? val : "";
                            });
                        break;

                    case "bar":
                        biasScale
                            .domain([0, max_bias || 1])
                            .range([margin, col.width - margin]);  // full available space inside cell

                        cell.each(function (row_data) {
                            g = d3.select(this);
                            outerHeight = row_height;
                            innerY = margin;
                            innerH = outerHeight - 2 * margin;

                            // Bar: left-aligned, scaled to bias value
                            g.append("rect")
                                .attr("x", 0)
                                .attr("y", innerY)
                                .attr("width", biasScale(Math.abs(row_data.bias)))
                                .attr("height", innerH)
                                .attr("fill", "lightslategrey");

                            // Text: show the bias value
                            g.append("text")
                                .attr("x", 4)  // small left inset
                                .attr("y", outerHeight / 2 + 4)
                                .attr("font-size", "10px")
                                .attr("fill", "black")
                                .text(row_data.bias !== null ? row_data.bias.toFixed(3) : "");
                        });
                        break;

                    case "compare_bars":
                        barScale
                            .domain([-max_diff || -1, max_diff || 1])
                            .range([margin, col.width - margin]);  // full available space inside cell

                        zeroX = barScale(0);

                        cell.each(function (row_data) {
                            g = d3.select(this);
                            outerHeight = row_height;
                            innerY = 5;
                            innerH = outerHeight - 2 * margin;

                            // Bar
                            g.append("rect")
                                .attr("x", Math.min(zeroX, barScale(row_data.difference)))
                                .attr("y", innerY)
                                .attr("width", Math.abs(barScale(row_data.difference) - zeroX))
                                .attr("height", innerH)
                                .attr("fill", row_data.difference < 0 ? "orange" : "steelblue");

                            // Text label
                            g.append("text")
                                .attr("x", zeroX)
                                .attr("y", row_height / 2 + 4)
                                .attr("text-anchor", "middle")
                                .attr("font-size", "10px")
                                .text(row_data.difference !== null ? row_data.difference.toFixed(3) : "");

                        });
                        break;

                    default:
                        throw new Error(`Unknown column type: ${col.type}`);
                }
            }
        });

        handleFilterConceptsTable(dispatch, row, body_svg);

        return container;
    }
    // </editor-fold>

    // <editor-fold desc="---------- PAGE LAYOUT ----------">

    // overall container
    let vis_container = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    vis_container.setAttribute('class', 'vis-container');

    // demographics container row
    let demographics_row = vis_container.appendChild(document.createElement('div'));
    demographics_row.setAttribute('class', 'row-container');
    // gender container
    let div_gender = demographics_row.appendChild(document.createElement('div'));
    div_gender.setAttribute('class', 'col-container');
    // race container
    let div_race = demographics_row.appendChild(document.createElement('div'));
    div_race.setAttribute('class', 'col-container');
    // age container
    let div_age = demographics_row.appendChild(document.createElement('div'));
    div_age.setAttribute('class', 'col-container');

    // concepts container row
    let concepts_row = vis_container.appendChild(document.createElement('div'));
    concepts_row.setAttribute('class', 'row-container concepts-row');
    // concepts container
    let div_concepts_container = concepts_row.appendChild(document.createElement('div'));
    div_concepts_container.setAttribute('class', 'col-container');

    // </editor-fold>

    // <editor-fold desc="---------- INSERT THE VISUALIZATIONS ----------">

    // draw the gender barchart
    div_gender.appendChild(
        VerticalBarChart({data: gender_dist1},
            {series2: {data: gender_dist2}, dimensions: {xlabel: 'Gender'}}).node());

    // draw the race barchart
    div_race.appendChild(
        VerticalBarChart({data: race_stats1},
            {series2: {data: race_stats2}, dimensions: {xlabel: 'Race'}}).node());

    // draw the age barchart
    div_age.appendChild(
        VerticalBarChart({data: age_dist1},
            {series2: {data: age_dist2}, dimensions: {xlabel: 'Age'}}).node());

    // draw the concepts table search box
    div_concepts_container.appendChild(
        SearchBox(conceptsTableDispatcher).node());

    // if there is only one set of concepts, draw a single cohort concepts table
    if(Object.keys(concepts2).length === 0) {
        // draw the concepts table
        div_concepts_container.appendChild(
            ConceptsTable(concepts1, conceptsTableDispatcher).node());
    }
    else{
        div_concepts_container.appendChild(
            ConceptsTable(concepts1, conceptsTableDispatcher,{data2: concepts2}).node());
    }

    // attach the visualization to the AnyWidget element
    el.appendChild(vis_container);

    // </editor-fold>

    // return () => {
    //   // Optional: Called when the view is destroyed.
    // }

} // end render

// export default async () => {
//   let extraState = {};
//   return {
//     initialize({ model }) { /* ... */ },
//     render({ model, el }) { /* ... */ },
//   }
// }

export default { render };
