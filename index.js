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
    let conceptsTableDispatcher = d3.dispatch('filter', 'sort', 'change-dp');


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

    function isEmptyString(str) {
        return typeof str === 'string' && str.trim().length === 0;
    }

    // converts keys to readable words by:
    // 1. replacing the underscore with a space, and
    // 2. capitalizing the first letter of each word
    function makeKeysWords (keys, series1_name, series2_name) {
        // console.log('keys', keys);

        for (let i = 0; i < keys.length; i++) {
            keys[i] = keys[i].replace("cohort1", series1_name);
            keys[i] = keys[i].replace("cohort2", series2_name);
        }

        return keys.map(key => {
            return key.split('_')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
        });
    }

    function verifyDispatch(dispatch, component) {
        if (
            !dispatch ||
            typeof dispatch !== "object" ||
            typeof dispatch.call !== "function" ||
            typeof dispatch.on !== "function"
        ) {
            throw new Error(component + " requires a valid d3.dispatch object.");
        }
    }

    // function reduce_transform(data) {
    //     // validate that data is a non-empty array
    //     if (!Array.isArray(data) || data.length === 0) {
    //         throw new Error("data must be a non-empty array");
    //     }
    //
    //     // validate that data contains valid objects
    //     if (!data[0] || typeof data[0] !== 'object') {
    //         throw new Error("data must contain valid objects");
    //     }
    //
    //     return Object.keys(data[0]).reduce((acc, key) => {
    //         acc[key] = data.map(d => d[key]);
    //         return acc;
    //     }, {});
    // }

    // </editor-fold>

    // <editor-fold desc="---------- DEFINE DATA ----------">

    var concepts1 = model.get('_concepts1');
    var race_stats1 = model.get('_race_stats1');
    var gender_dist1 = model.get('_gender_dist1');
    var age_dist1 = model.get('_age_dist1');
    var cohort1_name = model.get('_cohort1_name');

    var concepts2 = model.get('_concepts2');
    var race_stats2 = model.get('_race_stats2');
    var gender_dist2 = model.get('_gender_dist2');
    var age_dist2 = model.get('_age_dist2');
    var cohort2_name = model.get('_cohort2_name');

    // </editor-fold>

    // <editor-fold desc="---------- VISUAL CONTROL FUNCTIONS ----------">

    /*
    * draws a search box
    * Parameters:
    *   dispatch: d3.dispatch instance - user input event handler
    *   element_id: type: string - unique element id
    *   placeholder: type: string - placeholder for the control value
    *   label: type: string - label for the control
    *   width: type: string - the width of the input box in pixels
    * Return:
    *   div: DOM div element containing input box
    */
    // TODO: Test the changes to this function.
    function SearchBox(dispatch,
                       {element_id = '', placeholder= 'Search', label = '', width= 100}) {

        verifyDispatch(dispatch, 'Searchbox')

        let div = d3.create("xhtml:div")
            .attr("xmlns", "http://www.w3.org/1999/xhtml")
            .style("padding", "10px");

        let input = div.append('input')
            .attr('type', 'text')
            .attr('width', width);

        label = label.trim();
        element_id = element_id.trim();
        placeholder = placeholder.trim();

        if(element_id !== "") {
            input.attr('id', element_id);

            if (label !== ""){
                div.append("label")
                    .attr("for", element_id)
                    .text(label);
            }
        }

        input.on('input', function (event) {
            dispatch.call('filter', this, event.target.value);  // dispatch filter event
        });

        return div;
    }

    /*
    * draws a search box
    * Parameters:
    *   dispatch: d3.dispatch instance - user input event handler
    *   element_id: type: string - unique element id
    *   placeholder: type: string - placeholder for the control value
    *   label: type: string - label for the control
    *   width: type: string - the width of the input box in pixels
    * Return:
    *   div: DOM div element containing input box
    */
    // TODO: Test this function.
    function SpinnerBox(dispatch,
                       {element_id = '', placeholder= 'Search', label = '', width= 100}) {

        verifyDispatch(dispatch, 'Spinnerbox')

        let div = d3.create("xhtml:div")
            .attr("xmlns", "http://www.w3.org/1999/xhtml")
            .style("padding", "10px");

        let input = div.append('input')
            .attr('type', 'text')
            .attr('width', width)
            .attr('min', 0)
            .attr('max', 16)
            .attr('step', 1);

        label = label.trim();
        element_id = element_id.trim();
        placeholder = placeholder.trim();

        if(element_id !== "") {
            input.attr('id', element_id);

            if (label !== ""){
                div.append("label")
                    .attr("for", element_id)
                    .text(label);
            }
        }

        input.on('input', function (event) {
            dispatch.call('change-dp', this, event.target.value);  // dispatch filter event
        });

        return div;
    }

    // </editor-fold>

    // <editor-fold desc="---------- VERTICAL BAR CHART FUNCTIONS ----------">

    // all parameters are optional at the function signature level, but we are validating within the function
    function VerticalBarChart(
        series1,
        {
            series2 = { data: null, name: "cohort 2" },
            dimensions: {
                xlabel = "",
                ylabel = "",
                title = "",
                width = 600,
                height = 400,
                margin = { top: 40, right: 10, bottom: 60, left: 80 },
                padding = 0.1
            } = {}
        } = {}
    ){
        // validate series1
        // if (!series1.data) {
        //     throw new Error("VerticalBarChart requires series1.data.");
        // }
        //
        // // Validate that series1.data is a non-empty array
        // if (!Array.isArray(series1.data) || series1.data.length === 0) {
        //     throw new Error("series1.data must be a non-empty array");
        // }

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
            .attr('x', d => series2.data && series2.data.length > 0 ? xScale(d.category) : xScale(d.category))
            .attr('y', d => yScale(d.value))
            .attr('width', series2.data && series2.data.length > 0 ? xScale.bandwidth() / 2 : xScale.bandwidth())
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
            const legend_data = [
                { label: series1.name, color: 'steelblue' },
                { label: series2.name, color: 'orange' }
            ];

            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${margin.left}, ${height - 20})`);

            // Grouped approach: create a group for each legend item
            const legend_items = legend.selectAll('.legend-item')
                .data(legend_data)
                .enter()
                .append('g')
                .attr('class', 'legend-item')
                .attr('transform', (d, i) => `translate(${i * 120}, 0)`);

            // Add rectangle to each legend item group
            legend_items.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', d => d.color);

            // Add text to each legend item group
            legend_items.append('text')
                .attr('x', 24)
                .attr('y', 14) // Middle of 18px rect
                .style('font-family', 'Arial, sans-serif')
                .style('font-size', '14px')
                .style('fill', 'black')
                .style('dominant-baseline', 'middle')
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

    function ConceptsTable(
        series1, dispatch,
        {
            series2 = { data: null, name: "baseline" },
            dimensions = { height: 432, row_height: 30 }
        } = {}
    ){
        function prepareConceptsCompareData(data1, data2) {

            // console.log('concepts1', data1)
            // console.log('concepts2', data2)

            let mergedList = data1.map(item1 => {
                const item2 = data2.find(item => item.concept_code === item1.concept_code);
                return Object.assign({}, item1, item2);
            });

            // Add a key-value pair based on a calculation (e.g., double the age)
            mergedList = mergedList.map(item => {
                item.difference_in_prevalence = (item.cohort1_prevalence ?? 0) - (item.cohort2_prevalence ?? 0);

                item.bias = Math.abs(item.difference_in_prevalence);
                delete item.cohort1_count;
                delete item.cohort2_count;
                delete item.ancestor_concept_id;
                delete item.descendant_concept_id;
                return item;
            });

            const order = ['concept_code', 'concept_name', 'cohort2_prevalence', 'difference_in_prevalence',
                'cohort1_prevalence', 'bias'];

            mergedList = mergedList.map(item => {
                const rearrangedItem = {};
                order.forEach(key => {
                    if (item.hasOwnProperty(key)) {
                        rearrangedItem[key] = item[key];
                    }
                });
                return rearrangedItem;
            });

            // mergedList.sort((a, b) => b.bias - a.bias);
            // mergedList.sort((a, b) => b.bias - a.bias);

            // console.log('mergedList', mergedList);

            return mergedList;
        }

        function handleFilterConcepts(dispatch, row, body_svg) {
            verifyDispatch(dispatch, 'handleFilterConcepts');

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


        // ==== Validation for required params ====
        if (series1 === null || series1.data === null) {
            throw new Error("ConceptsTable requires at least one cohort.");
        }

        if (isEmptyString(series1.name)) {
            series1.name = 'study cohort';
        }

        verifyDispatch(dispatch, 'ConceptsTable');

        // ==== Validate optional params ====
        if (series2 !== null && series2.data !== null && !Array.isArray(series2.data)) {
            console.warn("ConceptsTable: Series 2 data should be an array (or null).");
        }

        if (typeof dimensions !== "object" || dimensions === null) {
            throw new Error("ConceptsTable: 'dimensions' must be an object.");
        }

        let table_data;
        if (series2.data !== null) {
            table_data = prepareConceptsCompareData(series1.data, series2.data);
        } else {
            table_data = series1.data;
        }

        // console.log('table_data', table_data);

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

        const headers_text = makeKeysWords(Object.keys(table_data[0]), series1.name, series2.name);
        if (!table_data.length) {
            throw new Error("ConceptsTable: table_data is empty.");
        }

        // TODO: We may need to change this so that the table fills
        //       the available width and dynamically resizes the visualization accordingly.
        let columns_data;
        if(series2.data === null){
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
                { text: headers_text[0], field: "concept_code", x: 0, width: 160, type: 'text' },
                { text: headers_text[1], field: "concept_name", x: 160, width: 350, type: 'text' },
                { text: headers_text[2],
                    field: d => (d.cohort2_prevalence !== null ? d.cohort2_prevalence.toFixed(3) : ""),
                    x: 510, width: 160, type: 'text' },
                { text: headers_text[3], field: "difference_in_prevalence", x: 670, width: 240, type: 'compare_bars' },
                { text: headers_text[4],
                    field: d => (d.cohort1_prevalence !== null ? d.cohort1_prevalence.toFixed(3) : ""),
                    x: 910, width: 160, type: 'text' }
                // ,{ text: headers_text[5], field: "bias", x: 950, width: 120, type: 'bar' }
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
            .attr("stroke", "#fff")
            .style("cursor", "pointer")
            .on("click", function(event, d) {
                handleSort(d);
            });

        header_g.append("text")
            .attr("x", text_offset_x)
            .attr("y", row_height / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .style("cursor", "pointer")
            .style("pointer-events", "all")
            .text(d => d.text)
            .on("click", function(event, d) {
                event.stopPropagation(); // Prevent header rect click
                handleSort(d);
            });

        // Add sort indicators
        header_g.append("text")
            .attr("class", "sort-indicator")
            .attr("x", d => d.width - 15)
            .attr("y", row_height / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#666")
            .style("cursor", "pointer")
            .style("pointer-events", "all")
            .text("")
            .on("click", function(event, d) {
                event.stopPropagation(); // Prevent header click
                handleSort(d);
            });

        // Function to handle sorting logic
        function handleSort(d, skipToggle = false) {
            // Toggle sort direction (unless we're initializing)
            if (!skipToggle) {
                if (d.sortDirection === "asc") {
                    d.sortDirection = "desc";
                } else {
                    d.sortDirection = "asc";
                }
            }

            // Clear other column sort indicators
            columns_data.forEach(col => {
                if (col !== d) {
                    col.sortDirection = null;
                }
            });

            // Dispatch sort event
            dispatch.call("sort", null, {
                column: d.field,
                direction: d.sortDirection,
                columnData: d
            });

            // Update sort indicators using D3 data join
            const sortIndicators = headers_g.selectAll(".sort-indicator")
                .data(columns_data);

            sortIndicators
                .text(col => {
                    if (col.sortDirection === "asc") return "▲";
                    if (col.sortDirection === "desc") return "▼";
                    return "";
                });

            // Sort the data
            table_data.sort((a, b) => {
                let aVal, bVal;

                if (typeof d.field === "function") {
                    aVal = d.field(a);
                    bVal = d.field(b);
                } else {
                    aVal = a[d.field];
                    bVal = b[d.field];
                }

                // Handle null/undefined values
                if (aVal === null || aVal === undefined) aVal = "";
                if (bVal === null || bVal === undefined) bVal = "";

                // Convert to numbers if they look numeric
                if (!isNaN(aVal) && !isNaN(bVal) && aVal !== "" && bVal !== "") {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }

                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                if (aVal > bVal) comparison = 1;

                return d.sortDirection === "desc" ? -comparison : comparison;
            });

            // Re-render the table body with sorted data
            updateTableBody();
        }

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

                    // Update body cell positions and widths using D3 selections
                    body_svg.selectAll(".row").each(function() {
                        d3.select(this).selectAll(".cell")
                            .data(columns_data)
                            .attr("transform", col => `translate(${col.x},0)`)
                            .select(".cell-bg")
                            .attr("width", col => col.width);
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

        let max_bias, max_diff, margin = 5;
        if (series2.data !== null) {
            max_bias = d3.max(table_data, d => Math.abs(d.bias)) || 0;
            max_diff = d3.max(table_data, d => Math.abs(d.difference_in_prevalence)) || 0;
        }

        const biasScale = d3.scaleLinear();
        const barScale = d3.scaleLinear();
        let zeroX, g, outerHeight, innerY, innerH;

        function updateTableBody() {
            // D3 data join pattern: select, data, enter/update/exit
            const rows = rows_g.selectAll(".row")
                .data(table_data, d => d.concept_code || Math.random()); // Use concept_code as key if available

            // Remove exiting rows
            rows.exit().remove();

            // Add new rows
            const rowsEnter = rows.enter()
                .append("g")
                .attr("class", "row");

            // Merge enter and update selections
            const rowsUpdate = rowsEnter.merge(rows);

            // Update positions with transition
            rowsUpdate
                .transition()
                .duration(300)
                .attr("transform", (d, i) => `translate(0, ${i * row_height})`);

            // Render cells for new rows only
            renderTableCells(rowsEnter);

            handleFilterConcepts(dispatch, rowsUpdate, body_svg);
        }

        function renderTableCells(row) {
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

                if (series2.data === null) {
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
                                    .attr("x", Math.min(zeroX, barScale(row_data.difference_in_prevalence)))
                                    .attr("y", innerY)
                                    .attr("width", Math.abs(barScale(row_data.difference_in_prevalence) - zeroX))
                                    .attr("height", innerH)
                                    .attr("fill", row_data.difference_in_prevalence < 0 ? "orange" : "steelblue");

                                // Text label - positioned based on value sign
                                const textX = row_data.difference_in_prevalence >= 0 ?
                                    Math.min(zeroX, barScale(row_data.difference_in_prevalence)) - 5 : // Left of positive bars
                                    Math.max(zeroX, barScale(row_data.difference_in_prevalence)) + 5;  // Right of negative bars

                                const textAnchor = row_data.difference_in_prevalence >= 0 ? "end" : "start";

                                g.append("text")
                                    .attr("x", textX)
                                    .attr("y", row_height / 2 + 4)
                                    .attr("text-anchor", textAnchor)
                                    .attr("font-size", "10px")
                                    .text(row_data.difference_in_prevalence !== null ? row_data.difference_in_prevalence.toFixed(3) : "");

                            });
                            break;

                        default:
                            throw new Error(`Unknown column type: ${col.type}`);
                    }
                }
            });
        }

        // Initial render
        const row = rows_g.selectAll(".row")
            .data(table_data)
            .enter()
            .append("g")
            .attr("class", "row")
            .attr("transform", (d, i) => `translate(0, ${i * row_height})`);

        renderTableCells(row);

        // Initialize with descending sort on difference_in_prevalence if we have comparison data
        // or on prevalence for single dataset tables
        if (series2.data !== null) {
            const diffColumn = columns_data.find(col => col.field === "difference_in_prevalence");
            if (diffColumn) {
                diffColumn.sortDirection = "desc";
                handleSort(diffColumn, true); // Skip toggle for initialization
            }
        } else {
            // For single dataset, sort by prevalence (which uses a function field)
            const prevalenceColumn = columns_data.find(col =>
                typeof col.field === "function" && col.field.toString().includes("prevalence")
            );
            if (prevalenceColumn) {
                prevalenceColumn.sortDirection = "desc";
                handleSort(prevalenceColumn, true); // Skip toggle for initialization
            }
        }

        handleFilterConcepts(dispatch, row, body_svg);

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
    // concepts controls container
    let div_concepts_control_container = div_concepts_container.appendChild(document.createElement('div'));
    div_concepts_control_container.setAttribute('class', 'row-container');
    div_concepts_control_container.style.display = 'flex';
    div_concepts_control_container.style.justifyContent = 'flex-start';
    // concepts table container
    let div_concepts_table_container = div_concepts_container.appendChild(document.createElement('div'));
    div_concepts_table_container.setAttribute('class', 'row-container');

    // </editor-fold>

    // <editor-fold desc="---------- INSERT THE VISUALIZATIONS ----------">

    // draw the gender barchart
    // console.log('gender_dist1', JSON.stringify(gender_dist1, null, 2));
    // console.log('gender_dist2', JSON.stringify(gender_dist2, null, 2));
    div_gender.appendChild(
        VerticalBarChart({data: gender_dist1, name: cohort1_name},
            {series2: {data: gender_dist2, name: cohort2_name}, dimensions: {xlabel: 'Gender'}}).node());

    // draw the race barchart
    // console.log('race_stats1', JSON.stringify(race_stats1, null, 2));
    // console.log('race_stats2', JSON.stringify(race_stats2, null, 2));
    div_race.appendChild(
        VerticalBarChart({data: race_stats1, name: cohort1_name},
            {series2: {data: race_stats2, name: cohort2_name}, dimensions: {xlabel: 'Race'}}).node());

    // draw the age barchart
    // console.log('age_dist1', JSON.stringify(age_dist1, null, 2));
    // console.log('age_dist2', JSON.stringify(age_dist2, null, 2));
    div_age.appendChild(
        VerticalBarChart({data: age_dist1, name: cohort1_name},
            {series2: {data: age_dist2, name: cohort2_name}, dimensions: {xlabel: 'Age'}}).node());

    // draw the concepts table search box
    div_concepts_control_container.appendChild(
        SearchBox(conceptsTableDispatcher).node());

    // draw the prevalence decimal points spinner box
    div_concepts_control_container.appendChild(
        SpinnerBox(conceptsTableDispatcher).node());

    // if there is only one set of concepts, draw a single cohort concepts table
    if(Object.keys(concepts2).length === 0) {
        // draw the concepts table
        div_concepts_table_container.appendChild(
            ConceptsTable({data: concepts1, name: cohort1_name}, conceptsTableDispatcher).node());
    }
    else{
        div_concepts_table_container.appendChild(
            ConceptsTable({data: concepts1, name: cohort1_name}, conceptsTableDispatcher,
                {series2: {data: concepts2, name: cohort2_name}}).node());
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
