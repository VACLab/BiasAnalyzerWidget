import * as d3 from 'https://esm.sh/d3@7';
import * as Inputs from "https://esm.sh/@observablehq/inputs";
import * as Plot from "https://esm.sh/@observablehq/plot";

// function initialize({ model }) {
//     // Set up shared state or event handlers.
//     return () => {
//       // Optional: Called when the widget is destroyed.
//     }
// } // end initialize

function render({ model, el }) {
    // for testing
    // alert('hello');

    const font_size = '12px';

    // DISPATCHERS

    // for handling the concepts table
    let conceptsTableDispatcher = d3.dispatch('filter', 'sort', 'change-dp', 'column-resize', 'view-pct');

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

    function toLabel(key){
        return key.split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    // function safeText(getter) {
    //     return d => {
    //         const v = typeof getter === "function" ? getter(d) : d[getter];
    //         return v != null ? String(v) : "";
    //     };
    // }
    //
    // function safeNumber(getter, decimals = 6) {
    //     return d => {
    //         const fallback = 0;
    //         const v = typeof getter === "function" ? getter(d) : d[getter];
    //         return typeof v === "number" ? v.toFixed(decimals) : fallback.toFixed(decimals);
    //     };
    // }
    //
    // function safeDate(getter, formatter = d => d.toLocaleDateString()) {
    //     return d => {
    //         const v = typeof getter === "function" ? getter(d) : d[getter];
    //         return v instanceof Date ? formatter(v) : "";
    //     };
    // }

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

    var cohort1_stats = model.get('_cohort1_stats');
    var concepts1 = model.get('_concepts1');
    var race_stats1 = model.get('_race_stats1');
    var gender_dist1 = model.get('_gender_dist1');
    var age_dist1 = model.get('_age_dist1');
    var cohort1_name = model.get('_cohort1_name');

    var cohort2_stats = model.get('_cohort2_stats');
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
    *   options: dictionary
    *     placeholder: type: string - placeholder for the control value
    *     label: type: string - label for the control
    *     width: type: string - the width of the input box in pixels
    * Return:
    *   container: DOM div element containing input box
    */
    function SearchBox(dispatch, options = {}) {
        let {
            placeholder = 'Filter',
            label = '',
            width = 200
        } = options;

        verifyDispatch(dispatch, 'Searchbox');
        label = label.trim();

        let container = d3.create("div")
            .style("padding", "4px");

        // observable input
        const input = Inputs.text({ label: label, placeholder: "Filter", width: "200px" });
        input.style.marginLeft = '8px';

        // The actual input element is inside the wrapper
        const innerInput = input.querySelector("input");
        // Apply styles to the real input
        innerInput.style.borderRadius = "8px";
        innerInput.style.border = "1px solid #ccc";
        // innerInput.style.padding = "4px 8px"; // optional for nicer spacing
        innerInput.style.width = "100%";      // fills the wrapper width

        // Dispatch filter event on input
        input.addEventListener("input", e => dispatch.call("filter", this, e.target.value));

        container.node().appendChild(input);

        return container;
    }

    /*
    * draws a spinner box
    * Parameters:
    *   dispatch: d3.dispatch instance - user input event handler
    *   options: dict
    *     value: type: integer - starting-point value
    *     label: type: string - label for the control
    *     width: type: integer - the width of the input box in pixels
    * Return:
    *   container: DOM div element containing input box
    */
    function SpinnerBox(dispatch, options = {}) {
        let {
            value = '6',
            label = '',
            width = 32
        } = options;

        verifyDispatch(dispatch, 'Spinnerbox');
        label = label.trim();

        let container = d3.create("div")
            .style("padding", "4px");

        if(value === "")
            value = default_prevalence_dp;

        // Create number input
        const spinner = Inputs.number({
            value: value,
            min: 0,
            max: 14,
            step: 1,
            label: label
        });

        spinner.style.width = width + 'px';
        spinner.style.marginLeft = '8px';

        // Optional: style inner input
        const inner = spinner.querySelector("input");
        inner.style.borderRadius = "8px";
        inner.style.border = "1px solid #ccc";
        // inner.style.padding = "4px 8px"; // optional for nicer spacing
        inner.style.width = "100%";      // fills the wrapper width
        inner.style.text_align = "right";

        // Dispatch filter event on input
        spinner.addEventListener("input", e => dispatch.call("change-dp", this, e.target.value));
        // Append input to container

        container.node().appendChild(spinner);

        return container;
    }

    /*
    * draws a toggle switch
    * Parameters:
    *   dispatch: d3.dispatch instance - user input event handler
    *   options: dict
    *     element_id: type: string - unique element id
    *     is_on: type: boolean - starting-point value -- False=off, True=on
    *     label: type: string - label for the control
    *     width: type: integer - the width of the input box in pixels
    * Return:
    *   div: DOM div element containing input box
    */
    function ToggleSwitch(dispatch, options = {}) {
        let {
            element_id = '',
            label = '',
            width = 32,
            is_on = true
        } = options;

        element_id = element_id.trim();
        label = label.trim();

        verifyDispatch(dispatch, 'ToggleSwitch');

        let div = d3.create("div")
            .style("padding", "8px");

        if (element_id !== '') {
            if (label !== '') {
                div.append('label')
                    .attr("for", element_id)
                    .text(label + ' ');
            }
        }

        // Create the switch container (label) for CSS styling
        let switchLabel = div.append('label')
            .attr('class', 'switch');

        // Add the checkbox input
        switchLabel.append('input')
            .attr('type', 'checkbox')
            .attr('id', element_id)
            .property('checked', is_on)
            .on('change', function(event) {
                dispatch.call('view-pct', this, this.checked); // send boolean value
            });

        // Add the slider span
        switchLabel.append('span')
            .attr('class', 'slider round')
            .style('width', width + 'px') // optional width
            .style('height', (width / 2) + 'px'); // height proportional to width

        return div;
    }

    // </editor-fold>

    // <editor-fold desc="---------- SUMMARY STATISTICS FUNCTIONS ----------">


    function SummaryStatistics(container, series1, { series2 = { data: null, name: "cohort 2" } } = {}) {
        // Wrap plain DOM node in a d3 selection
        const sel = d3.select(container);

        // Main container: vertical layout
        sel.style('display', 'flex')
            .style('flex-direction', 'column')
            .style('gap', '10px'); // space between cohort blocks

        const columns = [
            ['total_count'],
            ['earliest_start_date', 'latest_start_date', 'earliest_end_date', 'latest_end_date'],
            ['min_duration_days', 'max_duration_days', 'avg_duration_days'],
            ['median_duration', 'stddev_duration']
        ];

        function drawSeriesSummary(parentSel, cohort) {
            console.log('cohort = ', cohort);

            // Create a container for this cohort
            const cohortBlock = parentSel.append('div')
                .style('display', 'flex')
                .style('flex-direction', 'column')
                .style('gap', '12px');

            // Cohort name in bold
            cohortBlock.append('div')
                .text(cohort.name)
                .style('font-weight', 'bold')
                .style('font-size', '12px');

            // Columns container: horizontal layout
            const colContainer = cohortBlock.append('div')
                .style('display', 'flex')
                .style('gap', '30px');

            // Populate columns
            columns.forEach(colKeys => {
                const col = colContainer.append('div')
                    .style('display', 'flex')
                    .style('flex-direction', 'column')
                    .style('gap', '4px');

                colKeys.forEach(key => {
                    const row = col.append('div')
                        .style('display', 'flex')
                        .style('justify-content', 'flex-start')
                        .style('gap', '8px');

                    // Key
                    row.append('div')
                        .text(toLabel(key) + ':')
                        .style('width', '120px');

                    // Value
                    row.append('div')
                        .text(() => {
                            if (!cohort.data || cohort.data.length === 0) return '—';
                            const record = cohort.data[0];
                            const value = record[key];
                            return value !== undefined ? value : '—';
                        })
                        .style('text-align', 'left');
                });
            });
        }

        // Draw first series
        if (!series2.data || series2.data.length === 0)
            series1.name = '';
        drawSeriesSummary(sel, series1);

        // Draw second series below the first if it has data
        if (series2.data && series2.data.length > 0) {
            drawSeriesSummary(sel, series2);
        }
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
                padding = 0.1,
                showPercent = true
            } = {}
        } = {}
    ){
        // helper: safely coerce to number
        const toNum = v => (v == null || v === "") ? 0 : +v;

        // helper: normalize explicit proportion-like fields
        const normalizeProp = p => {
            if (p == null || p === "" || isNaN(+p)) return null;
            p = +p;
            // if user provided 0..100 percentages, convert to fraction
            if (p > 1) return p / 100;
            return p;
        };

        // compute sensible category domain from combined data (union)
        const combinedData = (series2 && series2.data && series2.data.length)
            ? series1.data.concat(series2.data)
            : series1.data;

        const categories = Array.from(new Set(combinedData.map(d => d.category)));

        // compute per-series totals for fallback proportion calculation
        const sum1 = d3.sum(series1.data, d => toNum(d.value));
        const sum2 = (series2 && series2.data && series2.data.length)
            ? d3.sum(series2.data, d => toNum(d.value))
            : 0;

        // function to get a proportion (0..1) for an item; seriesIndex = 1 or 2
        function getProportion(d, seriesIndex = 1) {
            // check common fields
            let p = null;
            if (d.proportion != null) p = normalizeProp(d.proportion);
            else if (d.probability != null) p = normalizeProp(d.probability);
            else if (d.percent != null) p = normalizeProp(d.percent);

            if (p != null) return p;

            // fallback: compute from value relative to series total
            const val = toNum(d.value);
            if (seriesIndex === 1) return sum1 > 0 ? val / sum1 : 0;
            if (seriesIndex === 2) return sum2 > 0 ? val / sum2 : 0;
            return 0;
        }

        // Create svg
        let svg = d3.create('svg')
            .attr('class', 'barchart')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // X scale
        const xScale = d3.scaleBand(categories, [margin.left, width - margin.right])
            .padding(padding);

        // Y-scale
        const yMax = showPercent
          ? d3.max([
              d3.max(series1.data, d => getProportion(d, 1)),
              series2 && series2.data ? d3.max(series2.data, d => getProportion(d, 2)) : 0
            ])
          : d3.max(combinedData, d => toNum(d.value));

        const yScale = d3.scaleLinear([0, yMax], [height - margin.bottom, margin.top]).nice();

        // X-axis
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

        // Y-axis with formatting
        const yAxis = showPercent
            ? d3.axisLeft(yScale).tickFormat(d3.format(".0%"))
            : d3.axisLeft(yScale).tickFormat(d3.format(","));

        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(yAxis)
            .attr('class', 'axis');

        // Y-axis label
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', height / 2 * -1)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text(ylabel);

        // Title
        if (title === '' && xlabel !== '') title = xlabel + ' Distribution';
        svg.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .text(title);

        // Render bars & labels
        const hasSecond = series2 && series2.data && series2.data.length > 0;
        const bw = xScale.bandwidth();
        const half = bw / 2;

        // Series 1 bars
        svg.selectAll('.bar1')
            .data(series1.data)
            .enter()
            .append('rect')
            .attr('class', 'bar1')
            .attr('x', d => xScale(d.category))
            .attr('y', d => {
                const val = showPercent ? getProportion(d, 1) : toNum(d.value);
                return yScale(val);
            })
            .attr('width', hasSecond ? half : bw)
            .attr('height', d => {
                const val = showPercent ? getProportion(d, 1) : toNum(d.value);
                return height - margin.bottom - yScale(val);
            });

        if (hasSecond) {
            // Series 2 bars
            svg.selectAll('.bar2')
                .data(series2.data)
                .enter()
                .append('rect')
                .attr('class', 'bar2')
                .attr('x', d => xScale(d.category) + half)
                .attr('y', d => {
                    const val = showPercent ? getProportion(d, 2) : toNum(d.value);
                    return yScale(val);
                })
                .attr('width', half)
                .attr('height', d => {
                    const val = showPercent ? getProportion(d, 2) : toNum(d.value);
                    return height - margin.bottom - yScale(val);
                });

            // Series 2 labels (centered on its half-bar)
            svg.selectAll('.label2')
                .data(series2.data)
                .enter()
                .append('text')
                .attr('class', 'label2')
                .attr('x', d => xScale(d.category) + half + half / 2)
                .attr('y', d => {
                    const val = showPercent ? getProportion(d, 2) : toNum(d.value);
                    return yScale(val) - 5;
                })
                .attr('text-anchor', 'middle')
                .text(d => showPercent ? d3.format(".0%")(getProportion(d, 2)) : d3.format(",")(toNum(d.value)));

            // Series 1 labels (left half)
            svg.selectAll('.label1')
                .data(series1.data)
                .enter()
                .append('text')
                .attr('class', 'label1')
                .attr('x', d => xScale(d.category) + half / 2)
                .attr('y', d => {
                    const val = showPercent ? getProportion(d, 1) : toNum(d.value);
                    return yScale(val) - 5;
                })
                .attr('text-anchor', 'middle')
                .text(d => showPercent ? d3.format(".0%")(getProportion(d, 1)) : d3.format(",")(toNum(d.value)));

            // Legend (simple)
            const legendFontSize = 12;
            const legend_data = [
                { label: series1.name, color: 'steelblue' },
                { label: series2.name, color: 'orange' }
            ];

            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${margin.left}, ${height - 20})`);

            const legend_items = legend.selectAll('.legend-item')
                .data(legend_data)
                .enter()
                .append('g')
                .attr('class', 'legend-item')
                .attr('transform', (d, i) => `translate(${i * 140}, 0)`);

            legend_items.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', d => d.color);

            legend_items.append('text')
                .attr('x', 24)
                .attr('y', 14)
                .style('font-family', 'Arial, sans-serif')
                .style('font-size', legendFontSize)
                .style('fill', 'black')
                .style('dominant-baseline', 'middle')
                .text(d => d.label);
        } else {
            // Single-series labels
            svg.selectAll('.label1')
                .data(series1.data)
                .enter()
                .append('text')
                .attr('class', 'label1')
                .attr('x', d => xScale(d.category) + bw / 2)
                .attr('y', d => {
                    const val = showPercent ? getProportion(d, 1) : toNum(d.value);
                    return yScale(val) - 5;
                })
                .attr('text-anchor', 'middle')
                .text(d => showPercent ? d3.format(".0%")(getProportion(d, 1)) : d3.format(",")(toNum(d.value)));
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

        // <editor-fold desc="---------- EVENT HANDLER FUNCTIONS ----------">

        function handleChangeDP(dp_value) {
            // Parse and validate the decimal places value
            let newDP = parseInt(dp_value);
            if (isNaN(newDP) || newDP < 0 || newDP > 16) {
                newDP = 0;
            }

            // Update the prevalence_dp variable (move it outside renderTableCells to module scope)
            prevalence_dp = newDP;

            // Clear existing table body content
            rows_g.selectAll(".row").remove();

            // Re-render the table with new decimal places
            const row = rows_g.selectAll(".row")
                .data(table_data)
                .enter()
                .append("g")
                .attr("class", "row")
                .attr("transform", (d, i) => `translate(0, ${i * row_height})`);

            renderTableCells(row);
        }

        function handleColumnResize(data) {
            const {phase, columnData, element} = data;

            switch (phase) {
                case "start":
                    const {startWidth, startX} = data;
                    columnData.startWidth = startWidth;
                    columnData.startX = startX;
                    break;

                case "drag":
                    const {currentX} = data;
                    const dx = currentX - columnData.startX;
                    const newWidth = Math.max(30, columnData.startWidth + dx);
                    columnData.width = newWidth;

                    // Update header rect using the passed element reference
                    d3.select(element.parentNode).select("rect").attr("width", newWidth);
                    // Update resize handle position
                    d3.select(element).attr("x", newWidth - 5);

                    // Recalculate x positions for all columns after this one
                    let x = 0;
                    columns_data.forEach(col => {
                        col.x = x;
                        x += col.width;
                    });

                    // Update header positions
                    headers_g.selectAll("g").attr("transform", col => `translate(${col.x},0)`);

                    // Update sort indicator positions within each header group
                    headers_g.selectAll("g").select(".sort-indicator")
                        .attr("x", d => d.width - 15);

                    // Update body cell positions and widths using D3 selections
                    body_svg.selectAll(".row").each(function () {
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
                    break;

                case "end":
                    // Clean up temporary properties
                    delete columnData.startWidth;
                    delete columnData.startX;
                    break;
            }
        }

        function handleFilterConcepts(search_term) {
            const normalized = search_term.toLowerCase().replace(/[^a-z0-9]/g, "");

            // Get current rows (need to re-select since they might have changed due to sorting)
            const currentRows = rows_g.selectAll(".row");

            currentRows.style("display", null);
            currentRows.filter(d => {
                const code = d.concept_code.toLowerCase();
                const name = d.concept_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                return !(code.startsWith(normalized) || name.includes(normalized));
            }).style("display", "none");

            // Recompute Y positions for visible rows
            let yOffset = 0;
            currentRows.filter(function () {
                return d3.select(this).style("display") !== "none";
            })
                .each(function () {
                    d3.select(this).attr("transform", `translate(0, ${yOffset})`);
                    yOffset += row_height; // Use row_height instead of parsing rect height
                });
            body_svg.attr("height", yOffset);
        }

        // Function to handle sorting logic
        // TODO: fix jumpy redrawing of the table during sort
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

            // Update sort indicators using D3 data join
            headers_g.selectAll(".sort-indicator")
                .text((d, i) => {
                    const col = columns_data[i];
                    if (col.sortDirection === "asc") return "▲";
                    if (col.sortDirection === "desc") return "▼";
                    return "";
                });

            // Sort the data
            table_data.sort((a, b) => {
                // console.log('handleSort data = ', d);

                let aVal, bVal;

                // if (typeof d.field === "function") {
                //     aVal = d.field(a);
                //     bVal = d.field(b);
                //     console.log('Do I ever come here?');
                // } else {
                    aVal = a[d.field];
                    bVal = b[d.field];
                // }

                // Handle null/undefined values
                if (aVal === null || aVal === undefined) aVal = "";
                if (bVal === null || bVal === undefined) bVal = "";

                // Convert to numbers if they look numeric
                if (!isNaN(aVal) && !isNaN(bVal) && aVal !== "" && bVal !== "") {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }

                if(d.field === 'difference_in_prevalence'){
                //     console.log('a = ', a);
                //     console.log('b = ', b);
                //     console.log('aVal = ', aVal);
                //     console.log('bVal = ', bVal);
                    aVal = Math.abs(aVal);
                    bVal = Math.abs(bVal);
                //     console.log('Math.abs(aVal) = ', aVal);
                //     console.log('Math.abs(bVal) = ', bVal);
                }

                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                if (aVal > bVal) comparison = 1;

                return d.sortDirection === "desc" ? -comparison : comparison;
            });

            // Re-render the table body with sorted data
            updateTableBody();
        }

        // </editor-fold>

        // ==== Validation for required params ====
        if (series1 === null || series1.data === null) {
            throw new Error("ConceptsTable requires at least one cohort.");
        }

        if (isEmptyString(series1.name)) {
            series1.name = 'study cohort';
        }

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
                return toLabel(key);
            });
        }

        const headers_text = makeKeysWords(Object.keys(table_data[0]), series1.name, series2.name);
        if (!table_data.length) {
            throw new Error("ConceptsTable: table_data is empty.");
        }

        let columns_data;
        // if(series2.data === null){
        //     columns_data = [
        //         { text: headers_text[1], field: "depth",  x: 0,   width: 40 },
        //         { text: headers_text[1], field: "concept_code",  x: 40,   width: 150 },
        //         { text: headers_text[0], field: "concept_name",  x: 190, width: 580 },
        //         { text: headers_text[2], field: "count_in_cohort", x: 770, width: 150 },
        //         { text: headers_text[3], field: "prevalence", x: 920, width: 150 }
        //     ];
        // }
        // else{
        //     columns_data = [
        //         { text: headers_text[1], field: "depth",  x: 0,   width: 40 },
        //         { text: headers_text[0], field: "concept_code", x: 40, width: 150, type: 'text' },
        //         { text: headers_text[1], field: "concept_name", x: 190, width: 340, type: 'text' },
        //         { text: headers_text[2], field: "cohort2_prevalence", x: 530, width: 150, type: 'text' },
        //         { text: headers_text[3], field: "difference_in_prevalence", x: 608, width: 240, type: 'compare_bars' },
        //         { text: headers_text[4], field: "cohort1_prevalence", x: 920, width: 150, type: 'text' }
        //         // ,{ text: headers_text[5], field: "bias", x: 950, width: 120, type: 'bar' }
        //     ];
        // }


        if(series2.data === null){
            columns_data = [
                { text: headers_text[1], field: "concept_code",  x: 0,   width: 160 },
                { text: headers_text[0], field: "concept_name",  x: 160, width: 590 },
                { text: headers_text[2], field: "count_in_cohort", x: 750, width: 160 },
                { text: headers_text[3], field: "prevalence", x: 910, width: 160 }
            ];
        }
        else{
            columns_data = [
                { text: headers_text[0], field: "concept_code", x: 0, width: 160, type: 'text' },
                { text: headers_text[1], field: "concept_name", x: 160, width: 350, type: 'text' },
                { text: headers_text[2], field: "cohort2_prevalence", x: 510, width: 160, type: 'text' },
                { text: headers_text[3], field: "difference_in_prevalence", x: 670, width: 240, type: 'compare_bars' },
                { text: headers_text[4], field: "cohort1_prevalence", x: 910, width: 160, type: 'text' }
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
                dispatch.call("sort", this, d);
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
                dispatch.call("sort", this, d);
            });

        // Add sort indicators
        header_g.append("text")
            .attr("class", "sort-indicator")
            .attr("x", d => d.width - 15)
            .attr("y", row_height / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("font-size", font_size)
            .attr("fill", "#666")
            .style("cursor", "pointer")
            .style("pointer-events", "all")
            .text("")
            .on("click", function(event, d) {
                event.stopPropagation(); // Prevent header click
                dispatch.call("sort", this, d);
            });

        dispatch.on("sort", function(columnData) {
            handleSort(columnData);
        });

        dispatch.on("filter", function(search_term) {
            handleFilterConcepts(search_term);
        })

        dispatch.on("column-resize", function(columnData) {
            handleColumnResize(columnData);
        });

        dispatch.on("change-dp", function(dp_value) {
            handleChangeDP(dp_value);
        });

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
                    dispatch.call("column-resize", this, {
                        phase: "start",
                        columnData: d,
                        startWidth: d.width,
                        startX: event.x,
                        element: this,  // Pass the DOM element reference
                        event: event
                    });
                })
                .on("drag", function(event, d) {
                    dispatch.call("column-resize", this, {
                        phase: "drag",
                        columnData: d,
                        startWidth: d.startWidth,
                        startX: d.startX,
                        currentX: event.x,
                        element: this,  // Pass the DOM element reference
                        event: event
                    });
                })
                .on("end", function(event, d) {
                    dispatch.call("column-resize", this, {
                        phase: "end",
                        columnData: d,
                        element: this,  // Pass the DOM element reference
                        event: event
                    });
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

        }

        let prevalence_dp = default_prevalence_dp;
        function renderTableCells(row) {
            const dafault_prevalence = 0;

            function getPrevalenceValue(val, col, row_data) {
                // Define which fields are numeric
                const numericFields =
                    ["prevalence", "count_in_cohort", "cohort1_prevalence", "cohort2_prevalence"];
                const no_dp = ["count_in_cohort"];

                if (val === null || val === undefined) {
                    if(numericFields.includes(col.field))
                        val = dafault_prevalence
                    else val = "";
                }

                if(numericFields.includes(col.field) && !no_dp.includes(col.field))
                    val = val.toFixed(prevalence_dp)

                return val;
            }

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
                            return getPrevalenceValue(row_data[col.field], col, row_data);
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
                                    return getPrevalenceValue(row_data[col.field], col, row_data);
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
                                    .attr("font-size", font_size)
                                    .attr("fill", "black")
                                    .text(row_data.bias !== null ? row_data.bias.toFixed(prevalence_dp) :
                                        dafault_prevalence.toFixed(prevalence_dp));
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

                                // x = 0 marker
                                g.append("line")
                                    .attr("x1", zeroX)
                                    .attr("y1", 0)
                                    .attr("x2", zeroX)
                                    .attr("y2", outerHeight)
                                    .attr("stroke", "grey")
                                    .attr("stroke-width", 1)
                                    .attr("stroke-dasharray", "3,3");

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
                                    .attr("font-size", font_size)
                                    .text(row_data.difference_in_prevalence !== null ?
                                        Math.abs(row_data.difference_in_prevalence.toFixed(prevalence_dp)) :
                                        dafault_prevalence.toFixed(prevalence_dp));
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

        return container;
    }

    // </editor-fold>

    // <editor-fold desc="---------- PAGE LAYOUT ----------">

    // overall container
    let vis_container = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
    vis_container.setAttribute('class', 'vis-container');

    // TODO: Add study cohort stats
    // summary container row
    let div_cohort_summary = vis_container.appendChild(document.createElement('div'));
    div_cohort_summary.setAttribute('class', 'row-container');
    div_cohort_summary.style.display = 'flex';
    div_cohort_summary.style.gap = '32px'; // space between columns
    div_cohort_summary.style.justifyContent = 'flex-start';
    div_cohort_summary.style.border = '1px solid #ccc'
    div_cohort_summary.style.padding = '8px';

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

    // concepts container row -- contains 2 columns
    let div_concepts = vis_container.appendChild(document.createElement('div'));
    div_concepts.setAttribute('class', 'row-container concepts-row');
    // concepts table column - consists of a controls row and a table row
    let div_concepts_table_container = div_concepts.appendChild(document.createElement('div'));
    div_concepts_table_container.setAttribute('class', 'col-container');
    // concepts table detail column - shows the details for a selected column
    let div_concept_detail_container = div_concepts.appendChild(document.createElement('div'));
    div_concept_detail_container.setAttribute('class', 'col-container');

    // concepts controls container
    let div_concepts_ctrl = div_concepts_table_container.appendChild(document.createElement('div'));
    div_concepts_ctrl.setAttribute('class', 'row-container');
    div_concepts_ctrl.style.display = 'flex';
    div_concepts_ctrl.style.justifyContent = 'flex-start';
    div_concepts_ctrl.style.border = 'none';
    // table controls on the left
    // let div_concepts_ctrl_left = div_concepts_ctrl.appendChild(
    //     document.createElement('div'));
    // div_concepts_ctrl_left.setAttribute('class', 'col-container');
    // div_concepts_ctrl_left.style.display = 'flex';
    // div_concepts_ctrl_left.style.justifyContent = 'flex-start';
    // div_concepts_ctrl_left.style.border = 'none';
    // // table controls on the right
    // let div_concepts_ctrl_right = div_concepts_ctrl.appendChild(
    //     document.createElement('div'));
    // div_concepts_ctrl_right.setAttribute('class', 'col-container');
    // div_concepts_ctrl_right.style.display = 'flex';
    // div_concepts_ctrl_right.style.justifyContent = 'flex-end';
    // div_concepts_ctrl_right.style.border = 'none';
    // the container for the concepts table itself
    let div_concepts_table = div_concepts_table_container.appendChild(document.createElement('div'));
    div_concepts_table.setAttribute('class', 'row-container');

    // </editor-fold>

    // <editor-fold desc="---------- INSERT THE VISUALIZATIONS ----------">

    // summary statistics
    SummaryStatistics(div_cohort_summary, {data: cohort1_stats, name: cohort1_name},
        {series2: {data: cohort2_stats, name: cohort2_name}});

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
    div_concepts_ctrl.appendChild(
        SearchBox(conceptsTableDispatcher, {label: 'Filter by concept code or name'}).node());

    let default_prevalence_dp = 6;
    div_concepts_ctrl.appendChild(
        SpinnerBox(conceptsTableDispatcher, {label: 'D.P.', value: default_prevalence_dp}).node());

    // if there is only one set of concepts, draw a single cohort concepts table
    if(Object.keys(concepts2).length === 0) {

        // draw the concepts table
        div_concepts_table.appendChild(
            ConceptsTable({data: concepts1, name: cohort1_name}, conceptsTableDispatcher).node());
    }
    else{
        // FIXME: fix the toggleswitch, then uncomment it
        // div_concepts_ctrl_right.appendChild(
        //     ToggleSwitch(conceptsTableDispatcher, {label: 'Normalize'}).node());
        // prevalence normalized-actual switch

        div_concepts_table.appendChild(
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
