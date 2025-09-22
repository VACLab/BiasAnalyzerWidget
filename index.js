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
    const font_size = '12px';

    /* DISPATCHERS */

    // handles the concepts table
    const conceptsTableDispatcher = d3.dispatch('filter', 'sort', 'change-dp', 'column-resize', 'view-pct');
    // handles all tooltips
    const tooltipDispatcher = d3.dispatch("show", "hide");

    // Ref: Claude AI
    tooltipDispatcher.on("show", function({ content, event }) {
        const containerRect = vis_container.node().getBoundingClientRect();
        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;

        const tooltip = createTooltip();

        // Set content first to measure
        tooltip
            .style("visibility", "hidden")
            .style("left", "0px")
            .style("top", "0px")
            .html(content);

        const tooltipRect = tooltip.node().getBoundingClientRect();
        const tooltipWidth = tooltipRect.width;
        const tooltipHeight = tooltipRect.height;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Get container dimensions
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Calculate absolute position on screen
        const absoluteX = event.clientX;
        const absoluteY = event.clientY;

        // Calculate relative position within container
        let finalX = x + 10; // Default: right of cursor
        let finalY = y - 10; // Default: above cursor

        // Check viewport constraints (absolute positioning)
        const wouldExceedRightViewport = absoluteX + 10 + tooltipWidth > viewportWidth;
        const wouldExceedBottomViewport = absoluteY - 10 + tooltipHeight > viewportHeight;
        const wouldExceedLeftViewport = absoluteX - tooltipWidth - 10 < 0;
        const wouldExceedTopViewport = absoluteY - tooltipHeight - 10 < 0;

        // Check container constraints (relative positioning)
        const wouldExceedRightContainer = finalX + tooltipWidth > containerWidth;
        const wouldExceedBottomContainer = finalY + tooltipHeight > containerHeight;
        const wouldExceedLeftContainer = finalX - tooltipWidth - 20 < 0;
        const wouldExceedTopContainer = finalY - tooltipHeight - 20 < 0;

        // Horizontal positioning - prioritize viewport over container
        if (wouldExceedRightViewport || wouldExceedRightContainer) {
            finalX = x - tooltipWidth - 10; // Move to left of cursor

            // If left position also exceeds bounds, clamp it
            if (wouldExceedLeftViewport || finalX < 5) {
                finalX = Math.max(5, Math.min(x - tooltipWidth/2, containerWidth - tooltipWidth - 5));
            }
        }

        // Vertical positioning - prioritize viewport over container
        if (wouldExceedBottomViewport || wouldExceedBottomContainer) {
            finalY = y - tooltipHeight - 10; // Move above cursor

            // If top position also exceeds bounds, clamp it
            if (wouldExceedTopViewport || finalY < 5) {
                finalY = Math.max(5, Math.min(y + 15, containerHeight - tooltipHeight - 5));
            }
        }

        // Apply final position
        tooltip
            .style("left", `${finalX}px`)
            .style("top", `${finalY}px`)
            .style("visibility", "visible");
    });

    tooltipDispatcher.on("hide", function() {
        d3.selectAll(".tooltip").remove();
    });

    // <editor-fold desc="---------- UTILITY FUNCTIONS ----------"

    // clears an element
    function clearElement(element) {
        element.selectAll('*').remove();
    }

    function dataEntityExists(entity){
        if (entity && entity.data && entity.data.length > 0)
            return true
        else return entity && entity.length > 0;
    }

    // converts timestamp to formatted date 'YYYY-MM-DD'
    function getIsoDateString(timestamp) {
        let aDate = new Date(timestamp);
        return aDate.toISOString().split('T')[0];
    }

    // function getProportion(numerator, denominator, do_format = false){
    //     if (denominator === 0)
    //         return 'N/A';
    //     const  proportion = numerator / denominator;
    //     return do_format ? d3.format('.2%')(proportion) : proportion;
    // }

    function isEmptyString(str) {
        return typeof str === 'string' && str.trim().length === 0;
    }

    function toLabel(key){
        return key.split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
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

    var cohort1_meta = model.get('_cohort1_meta');
    var cohort1_stats = model.get('_cohort1_stats');
    var concepts1 = model.get('_concepts1');
    var race_stats1 = model.get('_race_stats1');
    var gender_dist1 = model.get('_gender_dist1');
    var age_dist1 = model.get('_age_dist1');
    var cohort1_shortname = model.get('_cohort1_shortname');

    var cohort2_meta = model.get('_cohort2_meta');
    var cohort2_stats = model.get('_cohort2_stats');
    var concepts2 = model.get('_concepts2');
    var race_stats2 = model.get('_race_stats2');
    var gender_dist2 = model.get('_gender_dist2');
    var age_dist2 = model.get('_age_dist2');
    var cohort2_shortname = model.get('_cohort2_shortname');

    // </editor-fold>

    // <editor-fold desc="---------- VISUAL CONTROL FUNCTIONS ----------">

    function createTooltip() {
        return vis_container.append("div")
            .attr("class", "tooltip");
    }

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

        return container.node();
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
            value = default_prevalence_dp,
            label = '',
            width = 45,
            min = 0,
            max = 16,
            step = 1
        } = options;

        verifyDispatch(dispatch, 'Spinnerbox');
        label = label.trim();

        // Create a container div using D3
        let container = d3.create("div")
            .style("padding", "4px");

        // Create the number input using Inputs.number
        const spinner = Inputs.number({
            value: value,
            min: min,
            max: max,
            step: step,
            label: label
        });

        // Style the outer spinner element
        spinner.style.width = width + 'px';
        spinner.style.marginLeft = '8px';

        // Style the inner input element
        const inner = spinner.querySelector("input");
        inner.style.borderRadius = "8px";
        inner.style.border = "1px solid #ccc";
        inner.style.width = "100%";
        inner.style.textAlign = "right";

        // Add event listener to dispatch changes
        spinner.addEventListener("input", e => {
            if (e.target.value < 0)
                e.target.value = 0
            else if (e.target.value > 16)
                e.target.value = 16;
            dispatch.call("change-dp", spinner, e.target.value);
        });

        // Append the spinner DOM node to the D3 container
        container.append(() => spinner);

        // Return the container's DOM node
        return container.node();
    }

    /*
    * draws a toggle switch
    * Parameters:
    *   dispatch: d3.dispatch instance - user input event handler
    *   options: dict
    *     width: type: integer - the width of the input in pixels
    *     height: type: integer - the height of the input in pixels
    *     initial_state: type: boolean - starting-point value -- False=off, True=on
    *     label: type: string - label for the control
    * Return:
    *   svg DOM node containing input box
    */
    function ToggleSwitch(dispatch, {
                              width = 30,
                              height = 30,
                              initial_state = true,
                              label = "Toggle"
                          } = {}) {
        const svg = d3.create("svg")
            .attr("width", width + 160)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width + 160} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const track_height = height * 0.6;
        const track_y = (height - track_height) / 2;
        const thumb_radius = track_height / 2;
        const track_width = width;
        const color_on = "#00e676";
        const color_off = "#ccc";

        let state = initial_state ? 1 : 0;

        const toggle_group = svg.append("g")
            .attr("class", "svg-toggle")
            .attr("transform", `translate(0, ${track_y})`);

        // Track
        const track = toggle_group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", track_width)
            .attr("height", track_height)
            .attr("rx", thumb_radius)
            .attr("fill", state === 1 ? color_on : color_off);

        // Thumb
        const thumb = toggle_group.append("circle")
            .attr("cx", state === 1 ? track_width - thumb_radius : thumb_radius)
            .attr("cy", track_height / 2)
            .attr("r", thumb_radius * 0.9)
            .attr("fill", "#007bff");

        // Transparent clickable layer
        const transparent_rect = toggle_group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", track_width)
            .attr("height", track_height)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("click", () => {
                state = 1 - state; // Toggle state

                // Animate thumb position
                thumb.transition()
                    .duration(300)
                    .attr("cx", state === 1 ? track_width - thumb_radius : thumb_radius);

                // Animate track color
                track.transition()
                    .duration(300)
                    .attr("fill", state === 1 ? color_on : color_off);

                // tell everyone interested the new state
                dispatch.call("toggle_view", null, state);

            });

        // Label
        svg.append("text")
            .attr("x", track_width + 10)
            .attr("y", height / 2 + 4)
            .text(label)
            .style("font-size", "12px")
            .style("font-family", "sans-serif");

        return svg.node();
    }

    // </editor-fold>

    // <editor-fold desc="---------- SUMMARY STATISTICS FUNCTIONS ----------">

    function SummaryStatistics(container, series1, { series2 = { data: null, meta: null, shortname: "cohort 2" } } = {}) {
        // Main container: vertical layout
        container.style('display', 'flex')
            .style('flex-direction', 'column')
            .style('gap', '10px'); // space between cohort blocks

        const columns = [
            ['total_count'],
            ['earliest_start_date', 'latest_start_date', 'earliest_end_date', 'latest_end_date'],
            ['min_duration_days', 'max_duration_days', 'avg_duration_days'],
            ['median_duration', 'stddev_duration']
        ];

        function drawSeriesSummary(parentSel, cohort) {
            // Create a container for this cohort
            const cohortBlock = parentSel.append('div')
                .style('display', 'flex')
                .style('flex-direction', 'column')
                .style('gap', '12px');

            // Cohort name in bold
            cohortBlock.append('div')
                .text(cohort.shortname)
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
            series1.shortname = '';
        drawSeriesSummary(container, series1);

        // Draw second series below the first if it has data
        if (series2.data && series2.data.length > 0) {
            drawSeriesSummary(container, series2);
        }
    }

    // </editor-fold>

    // <editor-fold desc="---------- VERTICAL BAR CHART FUNCTIONS ----------">

    // all parameters are optional at the function signature level, but we are validating within the function
    function VerticalBarChart(
        series1,
        {
            series2 = { data: null, total_count: null, shortname: "cohort 2"},
            dimensions: {
                xlabel = "",
                title = "",
                width = 600,
                height = 200,
                margin = { top: 40, right: 10, bottom: 60, left: 80 },
                padding = 0.1,
                show_Percentage: show_percentage = true
            } = {}
        } = {}
    ) {
        const series2_exists = dataEntityExists(series2);
        const combinedData = series2_exists
            ? series1.data.concat(series2.data)
            : series1.data;

        xlabel = toLabel(xlabel);

        const categories = Array.from(new Set(combinedData.map(d => d.category)));
        let ylabel = show_percentage ? 'Percentage' : 'Patients Count';

        // handles the vertical bar chart
        const toggle_view_dispatcher = d3.dispatch("toggle_view"); // handles toggling between value and probability

        const svg = d3.create('svg')
            .attr('class', 'barchart')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg.append("g")
            .attr("transform", `translate(${width - margin.right - 160}, ${10})`)
            .append(() => ToggleSwitch(toggle_view_dispatcher, {
                label: "Show Percentage", initial_state: show_percentage
            }));

        // X scale
        const xScale = d3.scaleBand(categories, [margin.left, width - margin.right])
            .padding(padding);

        const color = d3.scaleOrdinal()
            .domain([series1.shortname, series2.shortname])
            .range(d3.schemePaired.slice(0, 2));

        // X-axis
        svg.append('g')
            .attr('transform', `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .attr('class', 'axis');

        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height - 20)
            .style('text-anchor', 'middle')
            .text(xlabel);

        // Y-axis group
        const yAxisGroup = svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .attr('class', 'axis');

        const y_axis_label = svg.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', height / 2 * -1)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text(ylabel);

        function drawYAxis() {
            const yMax = show_percentage
                ? d3.max([
                    d3.max(series1.data, d => d.probability),
                    series2_exists ? d3.max(series2.data, d => d.probability) : 0
                ])
                : d3.max(combinedData, d => +d.value);

            const yScale = d3.scaleLinear([0, yMax], [height - margin.bottom, margin.top]).nice();
            y_axis_label.text(ylabel);

            const yAxis = show_percentage
                ? d3.axisLeft(yScale).ticks(2).tickFormat(d3.format(""))
                : d3.axisLeft(yScale).ticks(2).tickFormat(d3.format(","));

            yAxisGroup.transition().duration(500).call(yAxis);
            return yScale;
        }

        let yScale = drawYAxis();
        if (title === '' && xlabel !== '') title = xlabel + ' Distribution';
        svg.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .text(title);

        function drawSeriesBars(container, series, series_index, class_base_name, yScale) {
            function getTooltipContent(d, series, xlabel) {
                const patient_count_text = `${d.value || 0}/${series.total_count} (${d3.format(".0%")(d.probability || 0)})`;
                return `<strong>${series.shortname}: ${xlabel + ': ' || ''} ${d.category}</strong><hr>Count: ${patient_count_text}`;
            }

            const class_name = class_base_name + series_index;
            const bw = xScale.bandwidth();
            const half = bw / 2;

            const bars = container.selectAll('.' + class_name)
                .data(series.data, d => d.category)
                .on("mouseover", function (event, d, ) {
                    tooltipDispatcher.call("show", null, {
                        content: getTooltipContent(d, series, xlabel),
                        event: event
                    });
                })
                .on("mouseout", function () {
                    tooltipDispatcher.call("hide");
                });

            bars.join(
                enter => enter.append('rect')
                    .attr('class', class_name)
                    .attr('x', d => series_index === 1 ? xScale(d.category) : xScale(d.category) + half)
                    .attr('width', series2_exists ? half : bw)
                    .attr('y', d => yScale(show_percentage ? d.probability : +d.value))
                    .attr('height', d => height - margin.bottom - yScale(show_percentage ? d.probability : +d.value))
                    .attr('fill', d => color(series.shortname)),
                update => update.transition().duration(500)
                    .attr('y', d => yScale(show_percentage ? d.probability : +d.value))
                    .attr('height', d => height - margin.bottom - yScale(show_percentage ? d.probability : +d.value))
            );
        }

        drawSeriesBars(svg, series1, 1, 'bar', yScale);
        if (series2_exists) {
            drawSeriesBars(svg, series2, 2, 'bar', yScale);

            const legend_data = [
                { label: series1.shortname, color: color(series1.shortname) },
                { label: series2.shortname, color: color(series2.shortname) }
            ];

            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${margin.left}, ${height - 20})`);

            const legend_items = legend.selectAll('.legend-item')
                .data(legend_data)
                .enter()
                .append('g')
                .attr('class', 'legend-item')
                .attr('transform', (d, i) => `translate(${i * 100}, 0)`);

            legend_items.append('rect')
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', d => d.color);

            legend_items.append('text')
                .attr('x', 24)
                .attr('y', 14)
                .style('font-size', 12)
                .text(d => d.label);
        }

        // Dispatch listener to redraw y-axis and bars
        toggle_view_dispatcher.on("toggle_view", function(state) {
            show_percentage = state;
            ylabel = show_percentage ? 'Percentage' : 'Patients Count';
            yScale = drawYAxis();
            drawSeriesBars(svg, series1, 1, 'bar', yScale);
            if (series2_exists) {
                drawSeriesBars(svg, series2, 2, 'bar', yScale);
            }
        });
        toggle_view_dispatcher.call("toggle_view", null, show_percentage); // initialize state

        return svg.node();
    }

    // </editor-fold>

    // <editor-fold desc="---------- CONCEPTS TABLE FUNCTIONS ----------">

    function ConceptsTable(
        series1, dispatch,
        {
            series2 = { data: null, shortname: "baseline" },
            dimensions = { height: 432, row_height: 30 }
        } = {}
    ){
        let full_data = [];       // original dataset
        let visible_data = [];    // filtered + sorted subset

        // Add these variables for proper state management
        let current_filter = ""; // Track current filter state
        let filtered_data; // Will be initialized after table_data


        // function getTooltipContent(d, series, xlabel) {
        //     const patient_count_text = `${d.value || 0}/${series.total_count} (${d3.format(".0%")(d.probability || 0)})`;
        //     return `<strong>${series.name}: ${xlabel + ': ' || ''} ${d.category}</strong><hr>Count: ${patient_count_text}`;
        // }

        function getTooltipContent(d, series_name){
            const heading = `<strong>Concept: ${d.concept_code}</strong><br>(${d.concept_name})<hr>`;
            let msg = ` (no difference)`;
            if(series_name !== "")
                msg = ` (higher in ${series_name})`;
            return `${heading} Diff. in Prev: ${Math.abs(d.difference_in_prevalence).toFixed(prevalence_dp)}<br>${msg}`;
        }

        function prepareConceptsCompareData(data1, data2) {
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
            return mergedList;
        }

        // <editor-fold desc="---------- EVENT HANDLER FUNCTIONS ----------">

        // Function to handle sorting logic
        function handleSort(d, skipToggle = false) {
            // console.log('handleSort d = ', d);
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

            // Sort the ORIGINAL data (not filtered_data)
            table_data.sort((a, b) => {
                let aVal, bVal;
                aVal = a[d.field];
                bVal = b[d.field];

                // Handle null/undefined values
                if (aVal === null || aVal === undefined) aVal = "";
                if (bVal === null || bVal === undefined) bVal = "";

                // Convert to numbers if they look numeric
                if (!isNaN(aVal) && !isNaN(bVal) && aVal !== "" && bVal !== "") {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }

                if(d.field === 'difference_in_prevalence'){
                    aVal = Math.abs(aVal);
                    bVal = Math.abs(bVal);
                }

                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                if (aVal > bVal) comparison = 1;

                return d.sortDirection === "desc" ? -comparison : comparison;
            });

            // Re-apply current filter to get new filtered_data with sorted order
            if (current_filter) {
                const normalized = current_filter.toLowerCase().replace(/[^a-z0-9]/g, "");
                filtered_data = table_data.filter(d => {
                    const code = d.concept_code.toLowerCase();
                    const name = d.concept_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                    return code.startsWith(normalized) || name.includes(normalized);
                });
            } else {
                filtered_data = [...table_data];
            }

            // Re-render the table body with sorted and filtered data
            updateTableBody();
        }

        // </editor-fold>

        // ==== Validation for required params ====
        if (series1 === null || series1.data === null) {
            throw new Error("ConceptsTable requires at least one cohort.");
        }

        if (isEmptyString(series1.shortname)) {
            series1.shortname = 'study cohort';
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

        // Initialize filtered_data after table_data is prepared
        filtered_data = [...table_data];

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
            for (let i = 0; i < keys.length; i++) {
                keys[i] = keys[i].replace("cohort1", series1_name);
                keys[i] = keys[i].replace("cohort2", series2_name);
            }
            return keys.map(key => {
                return toLabel(key);
            });
        }

        const headers_text = makeKeysWords(Object.keys(table_data[0]), series1.shortname, series2.shortname);
        if (!table_data.length) {
            throw new Error("ConceptsTable: table_data is empty.");
        }

        let columns_data;
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

        const color = d3.scaleOrdinal()
            .domain([series1.shortname, series2?.shortname]) // the series labels
            .range(d3.schemePaired);

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
            // console.log('handling dispatch sort call');
            handleSort(columnData);
        });

        dispatch.on("filter", function(search_term) {
            current_filter = search_term; // Store current filter
            const normalized = search_term.toLowerCase().replace(/[^a-z0-9]/g, "");

            // Update filtered_data
            if (normalized === "") {
                filtered_data = [...table_data]; // Show all data
            } else {
                // TODO: clear selected row here
                filtered_data = table_data.filter(d => {
                    const code = d.concept_code.toLowerCase();
                    const name = d.concept_name.toLowerCase().replace(/[^a-z0-9]/g, "");
                    return code.startsWith(normalized) || name.includes(normalized);
                });
                // Clear selections for hidden rows
                clearHiddenSelections(filtered_data);
            }

            // Re-render with filtered data
            updateTableBody();
        });

        dispatch.on("column-resize", function(data) {
            const {phase, columnData, element} = data;

            // console.log('column-resize handler this', this)

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
        });

        dispatch.on("change-dp", function(dp_value) {
            // handleChangeDP(dp_value);

            // function handleChangeDP(dp_value) {
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
            // }
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

        // track selected rows
        let selectedRows = new Set();

        // clear selections for filtered-out rows
        // TODO: simplify this function so that the selection is removed before the data is hidden
        function clearHiddenSelections(visibleData) {
            const visibleRowIds = new Set(visibleData.map(d => d.id || d.shortname || JSON.stringify(d)));

            // Find selected rows that are no longer visible
            const hiddenSelectedRows = [...selectedRows].filter(rowId => !visibleRowIds.has(rowId));

            // Remove hidden rows from selection
            hiddenSelectedRows.forEach(rowId => {
                selectedRows.delete(rowId);
            });

            // If we had selections that are now hidden, update the UI
            if (hiddenSelectedRows.length > 0) {
                rows_g.selectAll("g").classed("selected", false);
                rows_g.selectAll(".row-border").remove();
            }
        }

        const body_svg = container.append("svg")
            .attr("width", total_table_width)
            .attr("height", filtered_data.length * row_height);

        const rows_g = body_svg.append("g");

        let max_bias, max_diff, margin = 5;
        if (series2.data !== null) {
            max_bias = d3.max(table_data, d => Math.abs(d.bias)) || 0;
            max_diff = d3.max(table_data, d => Math.abs(d.difference_in_prevalence)) || 0;
        }

        const biasScale = d3.scaleLinear();
        const barScale = d3.scaleLinear();
        let zeroX, g, outerHeight, innerY, innerH;

        let prevalence_dp = default_prevalence_dp;
        function renderTableCells(row) {
            const dafault_prevalence = 0;

            // Add click handler to the row group itself
            row.attr("cursor", "pointer")
                .on("click", function(event, row_data) {
                    // Get a unique identifier for this row (adjust based on your data structure)
                    const rowId = row_data.id || row_data.shortname || JSON.stringify(row_data);

                    // Check if this row is already selected
                    if (selectedRows.has(rowId)) {
                        // Deselect this row
                        selectedRows.delete(rowId);
                        d3.select(this).classed("selected", false);
                        // Remove the border
                        d3.select(this).select(".row-border").remove();
                        onRowSelect(row_data, false);
                    } else {
                        // Clear all previous selections first
                        selectedRows.clear();
                        rows_g.selectAll("g").classed("selected", false);
                        rows_g.selectAll(".row-border").remove();

                        // Select this row
                        selectedRows.add(rowId);
                        d3.select(this).classed("selected", true);

                        // Add border around the entire row
                        d3.select(this).append("rect")
                            .attr("class", "row-border")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("width", total_table_width)
                            .attr("height", row_height);

                        onRowSelect(row_data, true);
                    }
                });

            function getPrevalenceValue(val, col, row_data) {
                // Define which fields are numeric
                const numericFields =
                    ["prevalence", "count_in_cohort", "cohort1_prevalence", "cohort2_prevalence"];
                const no_dp = ["count_in_cohort"];

                if (val === null || val === undefined) {
                    if(numericFields.includes(col.field))
                        val = dafault_prevalence
                    else val = 0;
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

                    function getHighestPrevalenceSeriesName(d) {
                        if (d.cohort1_prevalence > d.cohort2_prevalence) return 1;
                        if (d.cohort1_prevalence < d.cohort2_prevalence) return 2;
                        return 0;
                    }

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
                                    .attr("fill", row_data.difference_in_prevalence < 0 ? color(series2.shortname) : color(series1.shortname))
                                    .on("mouseover", function (event, d, ) {
                                        // console.log('d = ', d);
                                        // which prevalence is higher?
                                        const highest_prevalence = getHighestPrevalenceSeriesName(d);
                                        // get the name of the series with the higher prevalence
                                        let highest_series_name = "";
                                        if(highest_prevalence === 1)
                                            highest_series_name = series1.shortname
                                        else if (highest_prevalence === 2)
                                            highest_series_name = series2.shortname;

                                        // tooltip call
                                        tooltipDispatcher.call("show", null, {
                                            content: getTooltipContent(d, highest_series_name),
                                            event: event
                                        });
                                    })
                                    .on("mouseout", function () {
                                        tooltipDispatcher.call("hide");
                                    });

                                // Text label - positioned based on value sign
                                const textX = row_data.difference_in_prevalence >= 0 ?
                                    Math.min(zeroX, barScale(row_data.difference_in_prevalence)) - 5 : // Left of positive bars
                                    Math.max(zeroX, barScale(row_data.difference_in_prevalence)) + 5;  // Right of negative bars

                                const textAnchor = row_data.difference_in_prevalence >= 0 ? "end" : "start";

                                // g.append("text")
                                //     .attr("x", textX)
                                //     .attr("y", row_height / 2 + 4)
                                //     .attr("text-anchor", textAnchor)
                                //     .attr("font-size", font_size)
                                //     .text(row_data.difference_in_prevalence !== null ?
                                //         Math.abs(row_data.difference_in_prevalence.toFixed(prevalence_dp)) :
                                //         dafault_prevalence.toFixed(prevalence_dp));
                            });
                            break;

                        default:
                            throw new Error(`Unknown column type: ${col.type}`);
                    }
                }
            });
        }

        // callback function for handling row selection
        function onRowSelect(rowData, isSelected) {
            console.log(`Row ${isSelected ? 'selected' : 'deselected'}:`, rowData);
            // TODO: add selection logic here
        }

        function updateTableBody() {
            // Use filtered_data instead of table_data
            const rows = rows_g.selectAll(".row")
                .data(filtered_data, d => d.concept_code || Math.random());

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

            // Update SVG height to match filtered data
            body_svg.attr("height", filtered_data.length * row_height);
        }

        // Initial render - use filtered_data instead of table_data
        const row = rows_g.selectAll(".row")
            .data(filtered_data)
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

        return container.node();
    }

    // </editor-fold>

    // <editor-fold desc="---------- PAGE LAYOUT ----------">

    const vis_container = d3.select(el).append("div").attr('class', 'vis_container');  // overall container

    // summary container row
    const div_cohort_summary = vis_container.append('div').attr('class', 'row-container cohort-summary');

    // demographics row
    const demographics_row = vis_container.append('div').attr('class', 'row-container');
    const div_gender = demographics_row.append('div').attr('class', 'col-container');
    const div_race = demographics_row.append('div').attr('class', 'col-container');
    const div_age = demographics_row.append('div').attr('class', 'col-container');

    // concepts row
    const concepts_row = vis_container.append('div').attr('class', 'row-container concepts-row');
    const div_concepts_table_container = concepts_row.append('div').attr('class', 'col-container');
    // const div_concept_dragbar = concepts_row.append('div').attr('class', 'col-container dragbar');
    // const div_concept_detail_container = concepts_row.append('div').attr('class', 'col-container');

    // concepts controls row
    const div_concepts_ctrl = div_concepts_table_container.append('div')
        .attr('class', 'row-container')
        .style('display', 'flex')
        .style('justify-content', 'flex-start')
        .style('border', 'none');

    // the container row for the concepts table itself
    const div_concepts_table = div_concepts_table_container.append('div').attr('class', 'row-container');

    // </editor-fold>

    // <editor-fold desc="---------- INSERT THE VISUALIZATIONS ----------">

    const cohort2_exists = dataEntityExists(cohort2_stats); // assumption: if this exists, the rest of the cohort 2 data also exists

    // summary statistics
    SummaryStatistics(div_cohort_summary, {data: cohort1_stats, meta: cohort1_meta, shortname: cohort1_shortname},
        {series2: {data: cohort2_stats, meta: cohort2_meta, shortname: cohort2_shortname}});

    // draw the gender barchart
    let series2_data = cohort2_exists ?
        {data: gender_dist2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    div_gender.append(() =>
        VerticalBarChart({data: gender_dist1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
            {series2: series2_data, dimensions: {xlabel: 'gender'}})
    );

    series2_data = cohort2_exists ?
        {data: race_stats2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    div_race.append(() =>
        VerticalBarChart({data: race_stats1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
            {series2: series2_data, dimensions: {xlabel: 'race'}})
    );

    series2_data = cohort2_exists ?
        {data: age_dist2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    div_age.append(() =>
        VerticalBarChart({data: age_dist1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
            {series2: series2_data, dimensions: {xlabel: 'age'}})
    );

    // draw the concepts table search box
    div_concepts_ctrl.append(() =>
        SearchBox(conceptsTableDispatcher, {label: 'Filter concept code or name'})
    );

    const default_prevalence_dp = 3;
    div_concepts_ctrl.append(() =>
        SpinnerBox(conceptsTableDispatcher, {label: 'Prev dp'})
    );

    // if there is only one set of concepts, draw a single cohort concepts table
    if(Object.keys(concepts2).length === 0) {
        // draw the concepts table
        div_concepts_table.append(() =>
            ConceptsTable({data: concepts1, shortname: cohort1_shortname}, conceptsTableDispatcher)
        );
    }
    else{
        div_concepts_table.append(() =>
            ConceptsTable({data: concepts1, shortname: cohort1_shortname}, conceptsTableDispatcher,
                {series2: {data: concepts2, shortname: cohort2_shortname}})
        );
    }

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
