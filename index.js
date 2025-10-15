import * as d3 from 'https://esm.sh/d3@7';
import * as Inputs from "https://esm.sh/@observablehq/inputs";
// import * as Plot from "https://esm.sh/@observablehq/plot";

// function initialize({ model }) {
//     // Set up shared state or event handlers.
//     return () => {
//       // Optional: Called when the widget is destroyed.
//     }
// } // end initialize

function render({ model, el }) {
    const font_size = '12px';

    // <editor-fold desc="---------- DISPATCHERS ----------">

    // handles the concepts table
    const conceptsTableDispatcher = d3.dispatch('filter', 'sort', 'change-dp', 'column-resize', 'view-pct');
    // handles all tooltips
    const tooltipDispatcher = d3.dispatch("show", "hide");

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

    // </editor-fold>

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

    function formatFraction(numerator, denominator) {
        return `
        <span style="display: inline-flex; flex-direction: column; text-align: center; vertical-align: middle; font-size: 0.9em; line-height: 1.2;">
            <span style="border-bottom: 1px solid black; padding: 0 4px;">${numerator}</span>
            <span style="padding: 0 4px;">${denominator}</span>
        </span>
    `;
    }

    // converts timestamp to formatted date 'YYYY-MM-DD'
    function getIsoDateString(timestamp) {
        let aDate = new Date(timestamp);
        return aDate.toISOString().split('T')[0];
    }

    function isNullOrEmpty(value) {
        if (value === null || value === undefined)
            return true;

        switch (typeof value) {
            case 'string':
                return value.trim().length === 0;
            case 'object':
                if (Array.isArray(value))
                    return value.length === 0;
                return Object.keys(value).length === 0;
            case 'number':
            case 'boolean':
                return false;
            default:
                return false;
        }
    }

    function removeDuplicates(data, key) {
        const uniqueMap = new Map();
        data.forEach(item => {
            if (!uniqueMap.has(item[key])) {
                uniqueMap.set(item[key], item);
            }
        });
        return Array.from(uniqueMap.values());
    }

    function renameKeys(data, oldKeys, newKeys) {
        if (oldKeys.length !== newKeys.length) {
            throw new Error("oldKeys and newKeys must be the same length");
        }

        return data.map(item => {
            const changed_data = { ...item };
            oldKeys.forEach((oldKey, index) => {
                const newKey = newKeys[index];
                if (oldKey in changed_data) {
                    changed_data[newKey] = changed_data[oldKey];
                    delete changed_data[oldKey];
                }
            });
            return changed_data;
        });
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

    // </editor-fold>

    // <editor-fold desc="---------- DEFINE DATA ----------">

    var cohort1_meta = model.get('_cohort1_meta');
    var cohort1_stats = model.get('_cohort1_stats');
    var race_stats1 = model.get('_race_stats1');
    var ethnicity_stats1 = model.get('_ethnicity_stats1');
    var gender_dist1 = model.get('_gender_dist1');
    var age_dist1 = model.get('_age_dist1');
    var cohort1_shortname = model.get('_cohort1_shortname');

    var cohort2_meta = model.get('_cohort2_meta');
    var cohort2_stats = model.get('_cohort2_stats');
    var race_stats2 = model.get('_race_stats2');
    var ethnicity_stats2 = model.get('_ethnicity_stats2');
    var gender_dist2 = model.get('_gender_dist2');
    var age_dist2 = model.get('_age_dist2');
    var cohort2_shortname = model.get('_cohort2_shortname');

    var cond_hier = model.get('_cond_hier');
    console.log('cond_hier', cond_hier);

    race_stats1 = renameKeys(race_stats1, ['race', 'race_count'], ['category', 'value']);
    ethnicity_stats1 = renameKeys(ethnicity_stats1, ['ethnicity', 'ethnicity_count'], ['category', 'value']);
    gender_dist1 = renameKeys(gender_dist1, ['gender', 'gender_count'], ['category', 'value']);
    age_dist1 = renameKeys(age_dist1, ['age_bin', 'bin_count'], ['category', 'value']);

    if(dataEntityExists(race_stats2))
        race_stats2 = renameKeys(race_stats2, ['race', 'race_count'], ['category', 'value']);
    if(dataEntityExists(ethnicity_stats2))
        ethnicity_stats2 = renameKeys(ethnicity_stats2, ['ethnicity', 'ethnicity_count'], ['category', 'value']);
    if(dataEntityExists(gender_dist2))
        gender_dist2 = renameKeys(gender_dist2, ['gender', 'gender_count'], ['category', 'value']);
    if(dataEntityExists(age_dist2))
        age_dist2 = renameKeys(age_dist2, ['age_bin', 'bin_count'], ['category', 'value']);

    // TODO: Ask Hong to fix this in her code. This is a temporary fix for gender probabilities being out of 100,
    //       when other probabilities are out of 1
    gender_dist1 = d3.map(gender_dist1, d => ({ ...d, probability: d.probability / 100 }));
    if (dataEntityExists(gender_dist2))
        gender_dist2 = d3.map(gender_dist2, d => ({ ...d, probability: d.probability / 100 }));

    function isSingleCohort(){
        return Object.keys(cond_hier[0]['metrics']).length === 1;
    }

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
            .text(label);

        return svg.node();
    }

    // </editor-fold>

    // <editor-fold desc="---------- SUMMARY STATISTICS FUNCTIONS ----------">

    function SummaryStatistics(container, series1, { series2 = { data: null, meta: null, shortname1: "cohort 2" } } = {}) {
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

            const title = cohort.meta.name.trim();
            const desc = cohort.meta.description.trim();

            if (title !== "") {
                parentSel.append('h1')
                    .attr('class', 'tight-header')
                    .style('font-size', '13px')
                    .text(title);
            }

            if (desc !== "") {
                parentSel.append('h2')
                    .attr('class', 'tight-header')
                    .style('font-size', '11px')
                    .text(desc);
            }

            // Create a container for this cohort
            const cohortBlock = parentSel.append('div')
                .style('display', 'flex')
                .style('flex-direction', 'column')
                .style('gap', '12px');

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

        // draw first series
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
        let ylabel = show_percentage ? 'Proportion' : 'Patients Count';

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
                label: "Show Proportion", initial_state: show_percentage
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

        // chart title
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
                const patient_count_text = `${d3.format(".0%")(d.probability || 0)} (${formatFraction(d.value || 0, series.total_count)})`;
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
                    .attr('fill', d => color(series.shortname)), update => update.transition().duration(500)
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
            ylabel = show_percentage ? 'Proportion' : 'Patients Count';
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

    function ConceptsTable(dispatch, data, shortnames = [], options = {}){
        const {
            dimensions = { height: 432, row_height: 30 },
            pageSize = 10
        } = options;

        let full_data = [];       // original dataset
        let visible_data = [];    // filtered + sorted subset

        // Add these variables for proper state management
        let current_filter = ""; // Track current filter state
        let filtered_data; // Will be initialized after table_data

        // Add paging variables
        let current_page = 0;
        let page_size = pageSize;

        function getTooltipContent(d, series_name){
            // console.log('getTooltipContent d = ', d);
            const heading = `<strong>Concept: ${d.concept_code}</strong><br>(${d.concept_name})<hr>`;
            let msg = ` (no difference)`;
            if(series_name !== "")
                msg = ` (higher in ${series_name})`;
            return `${heading} Diff. in Prev: ${Math.abs(d.difference_in_prevalence).toFixed(prevalence_dp)}<br>${msg}`;
        }

        function prepareCondOccurCompareData() {
            // Add calculated fields
            let data = cond_hier.map(item => {
                const [prev1 = 0, prev2 = 0] = Object.values(item.metrics).map(m => m.prevalence);
                const [count1 = 0, count2 = 0] = Object.values(item.metrics).map(m => m.count);
                return {
                    ...item,  // Keep ALL original fields
                    difference_in_prevalence: prev1 - prev2,
                    cohort1_prevalence: prev1,
                    cohort2_prevalence: prev2,
                    count_in_cohort1: count1,
                    count_in_cohort2: count2
                };
            });
            return data;
        }

        function prepareCondOccurSingleData() {
            // Add calculated fields
            let data = cond_hier.map(item => {
                const [prev = 0] = Object.values(item.metrics).map(m => m.prevalence);
                const [count = 0] = Object.values(item.metrics).map(m => m.count);
                return{
                    ...item,  // Keep ALL original fields
                    prevalence: prev,
                    count_in_cohort: count
                };
            });
            return data;
        }

        // Add pagination helper functions
        function getTotalPages() {
            return Math.ceil(filtered_data.length / page_size);
        }

        function getCurrentPageData() {
            const start = current_page * page_size;
            const end = start + page_size;
            return filtered_data.slice(start, end);
        }

        function updatePaginationControls() {
            const total_pages = getTotalPages();
            const current_display = current_page + 1;

            pagination_container.select('.page-info')
                .text(`${filtered_data.length} rows`);

            pagination_container.select('.prev-btn')
                .property('disabled', current_page === 0);

            pagination_container.select('.next-btn')
                .property('disabled', current_page >= total_pages - 1);

            // Update page input and total pages display
            nav_container.select('input').property('value', current_display);
            nav_container.select('.total-pages').text(`of ${total_pages}`);
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

            // Reset to first page after sort
            current_page = 0;

            // Re-render the table body with sorted and filtered data
            updateTableBody();
        }

        // </editor-fold>

        // ==== Validation for required params ====
        if (!dataEntityExists(data)) {
            throw new Error("ConceptsTable requires at least one cohort.");
        }

        if (isNullOrEmpty(shortnames)) {
            shortnames[0] = 'study'
            shortnames[1] = 'baseline'
        }

        if (typeof dimensions !== "object" || dimensions === null) {
            throw new Error("ConceptsTable: 'dimensions' must be an object.");
        }

        let table_data;
        if (!isSingleCohort()) {
            table_data = prepareCondOccurCompareData();
        } else {
            table_data = prepareCondOccurSingleData();
        }
        console.log('table_data', table_data)

        // Initialize filtered_data after table_data is prepared
        filtered_data = [...table_data];

        const text_offset_x = 10;
        const { height, row_height } = dimensions;

        // Remove scroll & set fixed height
        const container = d3.create("div")
            .style("width", "100%")
            .style("border", "1px solid #ccc")

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

        const headers_text = makeKeysWords(Object.keys(table_data[0]), shortnames[0], shortnames[1]);

        if (!table_data.length) {
            throw new Error("ConceptsTable: table_data is empty.");
        }

        let columns_data;
        if(isSingleCohort()){
            columns_data = [
                { text: headers_text[2], field: "concept_code",  x: 0,   width: 160 },
                { text: headers_text[1], field: "concept_name",  x: 160, width: 590 },
                { text: headers_text[8], field: "count_in_cohort", x: 750, width: 160 },
                { text: headers_text[7], field: "prevalence", x: 910, width: 160 }
            ];
        }
        else{
            columns_data = [
                { text: headers_text[2], field: "concept_code", x: 0, width: 160, type: 'text' },
                { text: headers_text[1], field: "concept_name", x: 160, width: 350, type: 'text' },
                { text: headers_text[9], field: "cohort2_prevalence", x: 510, width: 160, type: 'text' },
                { text: headers_text[7], field: "difference_in_prevalence", x: 670, width: 240, type: 'compare_bars' },
                { text: headers_text[8], field: "cohort1_prevalence", x: 910, width: 160, type: 'text' }
            ];
        }

        const total_table_width = d3.sum(columns_data, d => d.width);

        console.log('columns_data', columns_data);

        const headers_svg = container.append("svg")
            .attr("width", total_table_width)
            .attr("height", row_height)
            .style("background", "white");

        const headers_g = headers_svg.append("g");

        const header_g = headers_g.selectAll("g")
            .data(columns_data)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x},0)`);

        const color = d3.scaleOrdinal()
            .domain(shortnames) // the series labels
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

        dispatch.on("sort", function(column_data) {
            // console.log('handling dispatch sort call');
            handleSort(column_data);
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

            // Reset to first page after filter
            current_page = 0;

            // Re-render with filtered data
            updateTableBody();
        });

        dispatch.on("column-resize", function(data) {
            const {phase, columnData: column_data, element} = data;

            switch (phase) {
                case "start":
                    const {startWidth, startX} = data;
                    column_data.startWidth = startWidth;
                    column_data.startX = startX;
                    break;

                case "drag":
                    const {currentX} = data;
                    const dx = currentX - column_data.startX;
                    const newWidth = Math.max(30, column_data.startWidth + dx);
                    column_data.width = newWidth;

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

                    body_svg.selectAll(".cell").each(function(d, i) {
                        const col = columns_data[i % columns_data.length];
                        d3.select(this)
                            .attr("transform", `translate(${col.x},0)`)
                            .select(".cell-bg")
                            .attr("width", col.width);
                    });

                    // Update body and header SVG width
                    const total_width = d3.sum(columns_data, c => c.width);
                    body_svg.attr("width", total_width);
                    headers_svg.attr("width", total_width);
                    break;

                case "end":
                    // Clean up temporary properties
                    delete column_data.startWidth;
                    delete column_data.startX;
                    break;
            }
        });

        dispatch.on("change-dp", function(dp_value) {
            // Parse and validate the decimal places value
            let newDP = parseInt(dp_value);
            if (isNaN(newDP) || newDP < 0 || newDP > 16) {
                newDP = 0;
            }

            prevalence_dp = newDP;

            // Clear existing table body content
            rows_g.selectAll(".row").remove();

            // Re-render the table with new decimal places
            const page_data = getCurrentPageData();
            const row = rows_g.selectAll(".row")
                .data(page_data)
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

        // TABLE BODY
        const body_height = page_size * row_height;

        // track selected rows
        let selected_rows = new Set();

        // clear selections for filtered-out rows
        function clearHiddenSelections(visible_data) {
            const visibleRowIds = new Set(visible_data.map(d => d.id || d.shortname || JSON.stringify(d)));

            // Find selected rows that are no longer visible
            const hidden_selected_rows = [...selected_rows].filter(rowId => !visibleRowIds.has(rowId));

            // Remove hidden rows from selection
            hidden_selected_rows.forEach(rowId => {
                selected_rows.delete(rowId);
            });

            // If we had selections that are now hidden, update the UI
            if (hidden_selected_rows.length > 0) {
                rows_g.selectAll("g").classed("selected", false);
                rows_g.selectAll(".row-border").remove();
            }
        }

        const body_svg = container.append("svg")
            .attr("width", total_table_width)
            .attr("height", body_height);

        const rows_g = body_svg.append("g");

        let max_bias, max_diff, margin = 5;
        if (!isSingleCohort()) {
            // max_bias = d3.max(table_data, d => Math.abs(d.bias)) || 0;
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
                .on("click", function(event, d) {
                    // Get a unique identifier for this row (adjust based on your data structure)
                    const rowId = d.id || d.shortname || JSON.stringify(d);

                    // Check if this row is already selected
                    if (selected_rows.has(rowId)) {
                        // Deselect this row
                        selected_rows.delete(rowId);
                        d3.select(this).classed("selected", false);
                        // Remove the border
                        d3.select(this).select(".row-border").remove();
                        onRowSelect(d, false);
                    } else {
                        // Clear all previous selections first
                        selected_rows.clear();
                        rows_g.selectAll("g").classed("selected", false);
                        rows_g.selectAll(".row-border").remove();

                        // Select this row
                        selected_rows.add(rowId);
                        d3.select(this).classed("selected", true);

                        // Add border around the entire row
                        d3.select(this).append("rect")
                            .attr("class", "row-border")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("width", total_table_width)
                            .attr("height", row_height);

                        onRowSelect(d, true);
                    }
                });

            function getPrevalenceValue(val, col, d) {
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

                if (isSingleCohort()) {
                    cell.append("text")
                        .attr("x", text_offset_x)
                        .attr("y", row_height / 2)
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "start")
                        .text(d => {
                            return getPrevalenceValue(d[col.field], col, d);
                        });
                    // TODO: for prevalence column only, show fraction (e.g., 404/414)
                    // .on("mouseover", function (event, d ) {
                    //     tooltipDispatcher.call("show", null, {
                    //         content: '',
                    //         event: event
                    //     });
                    // })
                    // .on("mouseout", function () {
                    //     tooltipDispatcher.call("hide");
                    // });
                } else {

                    function getHighestPrevalenceSeriesName(d) {
                        if (d.cohort1_prevalence > d.cohort2_prevalence) return 0;
                        if (d.cohort1_prevalence < d.cohort2_prevalence) return 1;
                        return 0;
                    }

                    switch (col.type) {
                        case "text":
                            cell.append("text")
                                .attr("x", text_offset_x)
                                .attr("y", row_height / 2)
                                .attr("dy", "0.35em")
                                .attr("text-anchor", "start")
                                .text(d => {
                                    return getPrevalenceValue(d[col.field], col, d);
                                });
                            // TODO: for prevalence columns only, show fraction (e.g., 404/414)
                            // .on("mouseover", function (event, d ) {
                            //     tooltipDispatcher.call("show", null, {
                            //         content: '',
                            //         event: event
                            //     });
                            // })
                            // .on("mouseout", function () {
                            //     tooltipDispatcher.call("hide");
                            // });
                            break;

                        case "bar":
                            biasScale
                                .domain([0, max_bias || 1])
                                .range([margin, col.width - margin]);  // full available space inside cell

                            cell.each(function (d) {
                                g = d3.select(this);
                                outerHeight = row_height;
                                innerY = margin;
                                innerH = outerHeight - 2 * margin;

                                // Bar: left-aligned, scaled to bias value
                                g.append("rect")
                                    .attr("x", 0)
                                    .attr("y", innerY)
                                    .attr("width", biasScale(Math.abs(d.metrics['1'].prevalence)))
                                    .attr("height", innerH)
                                    .attr("fill", "lightslategrey");

                                // Text: show the bias value
                                g.append("text")
                                    .attr("x", 4)  // small left inset
                                    .attr("y", outerHeight / 2 + 4)
                                    .attr("font-size", font_size)
                                    .attr("fill", "black")
                                    .text(Math.abs(d.metrics['1'].count !== null ? Math.abs(d.metrics['1'].count).toFixed(prevalence_dp) :
                                        dafault_prevalence.toFixed(prevalence_dp)));
                            });
                            break;

                        case "compare_bars":
                            barScale
                                .domain([-max_diff || -1, max_diff || 1])
                                .range([margin, col.width - margin]);  // full available space inside cell

                            zeroX = barScale(0);

                            cell.each(function (d) {
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

                                const diff_val = d.difference_in_prevalence;
                                const abs_diff = Math.abs(diff_val);
                                // console.log('d', d);

                                // Bar (only if difference is significant enough to be visible)
                                if (abs_diff >= 0.001) {
                                    g.append("rect")
                                        .attr("x", Math.min(zeroX, barScale(diff_val)))
                                        .attr("y", innerY)
                                        .attr("width", Math.abs(barScale(diff_val) - zeroX))
                                        .attr("height", innerH)
                                        .attr("fill", diff_val < 0 ? color(shortnames[1]) : color(shortnames[0]))
                                        .on("mouseover", function (event, d) {
                                            const highest_prevalence = getHighestPrevalenceSeriesName(d);
                                            let highest_series_name = "";
                                            if(highest_prevalence >= 0)
                                                highest_series_name = shortnames[highest_prevalence];

                                            tooltipDispatcher.call("show", null, {
                                                content: getTooltipContent(d, highest_series_name),
                                                event: event
                                            });
                                        })
                                        .on("mouseout", function () {
                                            tooltipDispatcher.call("hide");
                                        });
                                }

                                // Invisible hover rectangle for small/zero values
                                if (abs_diff <= 0.005) {
                                    const hover_width = barScale(0.2) - barScale(0); // Width for 0.2 difference
                                    g.append("rect")
                                        .attr("x", zeroX - hover_width/2)
                                        .attr("y", innerY)
                                        .attr("width", hover_width)
                                        .attr("height", innerH)
                                        .attr("fill", "transparent")
                                        .attr("opacity", 0)
                                        .style("cursor", "pointer")
                                        .on("mouseover", function (event, d) {
                                            const highest_prevalence = getHighestPrevalenceSeriesName(d);
                                            let highest_series_name = "";
                                            if(highest_prevalence >= 0)
                                                highest_series_name = shortnames[highest_prevalence];

                                            tooltipDispatcher.call("show", null, {
                                                content: getTooltipContent(d, highest_series_name),
                                                event: event
                                            });
                                        })
                                        .on("mouseout", function () {
                                            tooltipDispatcher.call("hide");
                                        });
                                }

                                // Text label - positioned based on value sign
                                const textX = d.difference_in_prevalence >= 0 ?
                                    Math.min(zeroX, barScale(d.difference_in_prevalence)) - 5 : // Left of positive bars
                                    Math.max(zeroX, barScale(d.difference_in_prevalence)) + 5;  // Right of negative bars

                                const textAnchor = d.difference_in_prevalence >= 0 ? "end" : "start";

                                // g.append("text")
                                //     .attr("x", textX)
                                //     .attr("y", row_height / 2 + 4)
                                //     .attr("text-anchor", textAnchor)
                                //     .attr("font-size", font_size)
                                //     .text(d.difference_in_prevalence !== null ?
                                //         Math.abs(d.difference_in_prevalence.toFixed(prevalence_dp)) :
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
            const page_data = getCurrentPageData();

            const rows = rows_g.selectAll(".row")
                .data(page_data, d => d.concept_code);

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
                .duration(150)
                .ease(d3.easeQuadOut)
                .attr("transform", (d, i) => `translate(0, ${i * row_height})`);

            // Render cells for new rows only
            renderTableCells(rowsEnter);

            // Update pagination controls
            updatePaginationControls();
        }

        // === ADD PAGINATION CONTROLS ===
        const pagination_container = container.append("div")
            .style("padding", "5px 10px")
            .style("border-top", "1px solid #ccc")
            .style("background", "#f9f9f9")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("align-items", "center");

        // Left side - page info
        pagination_container.append("div")
            .attr("class", "page-info")
            .style("color", "#666");

        // Right side - navigation controls
        const nav_container = pagination_container.append("div")
            .style("display", "flex")
            .style("gap", "5px")
            .style("align-items", "center");

        const prev_btn = nav_container.append("button")
            .attr("class", "prev-btn")
            .style("padding", "2px 6px")
            .style("border", "1px solid #ccc")
            .style("background", "#fff")
            .style("cursor", "pointer")
            .text("<")
            .on("click", function() {
                if (current_page > 0) {
                    current_page--;
                    updateTableBody();
                }
            });

        // Add page jump input
        nav_container.append("span")
            .text("Page");

        const page_input = nav_container.append("input")
            .attr("type", "number")
            .attr("min", 1)
            .style("width", "40px")
            .style("padding", "2px")
            .style("border", "1px solid #ccc")
            .style("text-align", "center")
            .on("change", function() {
                const page_num = parseInt(this.value);
                const total_pages = getTotalPages();
                if (page_num >= 1 && page_num <= total_pages) {
                    current_page = page_num - 1; // Convert to 0-based index
                    updateTableBody();
                } else {
                    // Reset to current page if invalid
                    this.value = current_page + 1;
                }
            });

        nav_container.append("span")
            .attr("class", "total-pages");

        const next_btn = nav_container.append("button")
            .attr("class", "next-btn")
            .style("padding", "2px 6px")
            .style("border", "1px solid #ccc")
            .style("background", "#fff")
            .style("cursor", "pointer")
            .text(">")
            .on("click", function() {
                if (current_page < getTotalPages() - 1) {
                    current_page++;
                    updateTableBody();
                }
            });

        // Initial render
        const initial_page_data = getCurrentPageData();
        // console.log('initial_page_data', initial_page_data);
        const row = rows_g.selectAll(".row")
            .data(initial_page_data)
            .enter()
            .append("g")
            .attr("class", "row")
            .attr("transform", (d, i) => `translate(0, ${i * row_height})`);

        renderTableCells(row);

        // Initialize with descending sort on difference_in_prevalence if we have comparison data
        // or on prevalence for single dataset tables
        if (!isSingleCohort()) {
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

        // Initialize pagination controls
        updatePaginationControls();

        return container.node();
    }

    // </editor-fold>

    // <editor-fold desc="---------- PAGE LAYOUT ----------">

    // overall container
    const vis_container = d3.select(el).append("div").attr('class', 'vis-container');

    // summary container row
    const div_cohort_summary = vis_container.append('div').attr('class', 'row-container cohort-summary');

    // demographics row
    const demographics_row = vis_container.append('div').attr('class', 'row-container');
    const div_gender = demographics_row.append('div').attr('class', 'col-container');
    const div_race = demographics_row.append('div').attr('class', 'col-container');
    // const div_ethnicity = demographics_row.append('div').attr('class', 'col-container');
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

    // series2_data = cohort2_exists ?
    //     {data: ethnicity_stats2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    // div_ethnicity.append(() =>
    //     VerticalBarChart({data: ethnicity_stats1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
    //         {series2: series2_data, dimensions: {xlabel: 'ethnicity'}})
    // );

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

    div_concepts_table.append(() =>
        ConceptsTable(conceptsTableDispatcher, cond_hier, [cohort1_shortname, cohort2_shortname])
    );

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
