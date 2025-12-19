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

    const font_size = '11px';

    // <editor-fold desc="---------- REQUEST MANAGER ----------">

    // Reusable RequestManager
    class RequestManager {
        constructor(model, container) {
            this.model = model;
            this.pendingRequests = new Map();
            this.requestId = 0;
            this.container = container;

            // Add spinner animation styles
            this.addStyles();

            model.on("change:response", () => {
                this.handleResponse(model.get("response"));
            });
        }

        addStyles() {
            // Check if styles already exist
            if (document.getElementById('request-manager-styles')) return;

            const style = document.createElement('style');
            style.id = 'request-manager-styles';
            style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
            document.head.appendChild(style);
        }

        createLocalProgress(container, message, id) {
            const progressDiv = d3.select(container)
                .append('div')
                .attr('class', `local-progress local-progress-${id}`)
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'space-between')
                .style('gap', '8px')
                .style('padding', '8px 12px')
                .style('background', '#f5f5f5')
                .style('border', '1px solid #e0e0e0')
                .style('border-radius', '4px')
                .style('margin', '4px 0')
                .style('font-size', '12px');

            // Left side: spinner and message
            const leftSide = progressDiv
                .append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '8px')
                .style('flex', '1');

            const spinner = leftSide
                .append('div')
                .attr('class', 'spinner')
                .style('width', '16px')
                .style('height', '16px')
                .style('border', '2px solid #e0e0e0')
                .style('border-top-color', '#2196F3')
                .style('border-radius', '50%')
                .style('animation', 'spin 0.8s linear infinite')
                .style('flex-shrink', '0');

            const text = leftSide
                .append('span')
                .style('color', '#666')
                .text(message);

            // Right side: cancel button
            const cancelBtn = progressDiv
                .append('button')
                .attr('class', 'cancel-btn')
                .style('background', 'transparent')
                .style('border', '1px solid #ccc')
                .style('border-radius', '3px')
                .style('padding', '2px 8px')
                .style('cursor', 'pointer')
                .style('font-size', '11px')
                .style('color', '#666')
                .text('Cancel')
                .on('mouseover', function() {
                    d3.select(this).style('background', '#f0f0f0');
                })
                .on('mouseout', function() {
                    d3.select(this).style('background', 'transparent');
                })
                .on('click', () => {
                    this.cancelRequest(id);
                });

            return {
                element: progressDiv.node(),
                spinner: spinner.node(),
                text: text.node(),
                cancelBtn: cancelBtn.node()
            };
        }

        showSuccess(progressElement) {
            const div = d3.select(progressElement.element);
            const wait_spinner = d3.select(progressElement.spinner);
            const text = d3.select(progressElement.text);
            const cancelBtn = d3.select(progressElement.cancelBtn);

            // Update wait_spinner to checkmark
            wait_spinner
                .style('animation', 'none')
                .style('border', 'none')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'center')
                .style('color', '#4CAF50')
                .style('font-weight', 'bold')
                .style('font-size', '14px')
                .text('✓');

            // text.text('Complete').style('color', '#4CAF50');
            cancelBtn.style('display', 'none');
            div.style('border-color', '#4CAF50');

            // Remove after brief delay
            setTimeout(() => {
                div.remove();
            }, 100);
        }

        showError(progressElement, errorMessage) {
            const div = d3.select(progressElement.element);
            const spinner = d3.select(progressElement.spinner);
            const text = d3.select(progressElement.text);
            const cancelBtn = d3.select(progressElement.cancelBtn);

            // Update spinner to X
            spinner
                .style('animation', 'none')
                .style('border', 'none')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'center')
                .style('color', '#f44336')
                .style('font-weight', 'bold')
                .style('font-size', '14px')
                .text('✕');

            text.text(`Error: ${errorMessage}`).style('color', '#f44336');
            cancelBtn.style('display', 'none');
            div.style('border-color', '#f44336');

            // Remove after longer delay
            setTimeout(() => {
                div.remove();
            }, 3000);
        }

        cancelRequest(requestId) {
            const pending = this.pendingRequests.get(requestId);
            if (pending) {
                // Remove progress indicator
                if (pending.progressElement) {
                    d3.select(pending.progressElement.element).remove();
                }

                // Reject the promise with cancellation error
                pending.reject(new Error('Request cancelled'));

                // Remove from pending
                this.pendingRequests.delete(requestId);

                // console.log(`Request ${requestId} cancelled`);

                // Optionally notify Python to stop processing (if supported)
                // this.model.set("cancel_request", requestId);
                // this.model.save_changes();

                return true;
            }
            return false;
        }

        cancelAll() {
            const cancelledIds = [];
            this.pendingRequests.forEach((pending, id) => {
                if (pending.progressElement) {
                    d3.select(pending.progressElement.element).remove();
                }
                pending.reject(new Error('All requests cancelled'));
                cancelledIds.push(id);
            });
            this.pendingRequests.clear();
            // console.log(`Cancelled ${cancelledIds.length} requests`);
            return cancelledIds;
        }

        async request(type, params = {}, options = {}) {
            const {
                statusMessage = 'Processing request...',
                showProgress = true,
                progressContainer = null
            } = options;

            return new Promise((resolve, reject) => {
                const id = ++this.requestId;
                const startTime = Date.now();

                this.pendingRequests.set(id, { resolve, reject, type, startTime });

                if (showProgress) {
                    const targetContainer = progressContainer || this.container;
                    const localProgress = this.createLocalProgress(
                        targetContainer,
                        statusMessage,
                        id
                    );
                    this.pendingRequests.get(id).progressElement = localProgress;
                }

                const requestData = { id, type, params };
                this.model.set("request", JSON.stringify(requestData));
                this.model.save_changes();
            });
        }

        handleResponse(responseJson) {
            if (!responseJson) return;

            const response = JSON.parse(responseJson);
            const { id, success, data, error } = response;

            const pending = this.pendingRequests.get(id);
            if (pending) {
                const duration = Date.now() - pending.startTime;

                if (success) {
                    // Show success state
                    if (pending.progressElement) {
                        this.showSuccess(pending.progressElement);
                    }
                    pending.resolve(data);
                } else {
                    // Show error state
                    if (pending.progressElement) {
                        this.showError(pending.progressElement, error || 'Request failed');
                    }
                    pending.reject(new Error(error));
                }
                this.pendingRequests.delete(id);

                // console.log(`Request ${id} completed in ${duration}ms`);
            }
        }
    }

    const requestManager = new RequestManager(model, el);

    // </editor-fold>

    // <editor-fold desc="---------- DISPATCHERS ----------">

    // handles the concepts table
    const conceptsTableDispatcher =
        d3.dispatch('select-row', 'filter', 'sort', 'change-dp', 'column-resize', 'view-pct');

    // <editor-fold desc="---------- TOOLTIP DISPATCHER ----------">

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

    // handles conditions drag bar
    const conceptsDragbarDispatcher = d3.dispatch('dragstart', 'drag', 'dragend', 'toggle');


    // <editor-fold desc="---------- HIERARCHY VIEW DISPATCHER ----------">

    const hierarchyViewDispatcher = d3.dispatch('dragstart', 'drag', 'dragend', 'centerCardChanged');

// Setup auto-scroll handler on the container
    let autoScrollInterval = null;

    hierarchyViewDispatcher.on('dragstart', () => {
        // Clear any existing interval when drag starts
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    });

    hierarchyViewDispatcher.on('drag', (eventData) => {
        // Remove this line:
        // console.log('Container received drag event:', eventData);

        const scrollContainer = concept_hier_col.node().querySelector('div[style*="overflow: auto"]');

        if (!scrollContainer) return;

        const rect = scrollContainer.getBoundingClientRect();
        const scrollThreshold = 80;
        const scrollSpeed = 15;
        const mouseY = eventData.clientY;

        const relativeY = mouseY - rect.top;
        const containerHeight = rect.height;

        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }

        if (relativeY < scrollThreshold && scrollContainer.scrollTop > 0) {
            autoScrollInterval = setInterval(() => {
                scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop - scrollSpeed);
            }, 16);
        } else if (relativeY > containerHeight - scrollThreshold) {
            autoScrollInterval = setInterval(() => {
                const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                scrollContainer.scrollTop = Math.min(maxScroll, scrollContainer.scrollTop + scrollSpeed);
            }, 16);
        }
    });

    hierarchyViewDispatcher.on('dragend', () => {
        // Clear auto-scroll when drag ends
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    });

    // </editor-fold>

    // </editor-fold>

    // <editor-fold desc="---------- UTILITY FUNCTIONS ----------"

    // clears an element
    function clearElement(element) {
        if(element)
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

    function getCohortItemCount(item, cohort_id){
        return item['metrics'][cohort_id].count;
    }

    function getCohortItemPrevalence(item, cohort_id){
        return item['metrics'][cohort_id].prevalence;
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

    function logObjectType(label, obj) {
        console.log(label + ' Object:', obj);
        console.log(label + ' Constructor:', obj.constructor.name);
        console.log(label + ' Keys:', Object.keys(obj));
        console.log(label + ' Type of keys:', Object.keys(obj).map(k => `${k}: ${typeof obj[k]}`));
        console.log(label + 'Type', Object.prototype.toString.call(obj).slice(8, -1));
    }

    function logAndThrowError(msg) {
        const error =
        console.error('Error Message:', error.message);
        console.error('Stack Trace:');
        console.error(error.stack.split('\n').join('\n'));
    }

    // converts a key to readable words by:
    // 1. replacing the underscore with a space, and
    // 2. capitalizing the first letter of each word
    function makeKeyWords (key, series1_name, series2_name) {
        key = key.replace("cohort1", series1_name);
        key = key.replace("cohort2", series2_name);
        return toLabel(key);
    }

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

    function setStatus(container, status){
        // console.log('onConceptTableRowSelect status: ', status);
        container.text(status);
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

    // Cohort1 and Cohort2 are not the cohort IDs, but are just 2 cohorts that we are comparing
    var cohort1_meta = model.get('_cohort1Metadata');
    var cohort1_stats = model.get('_cohort1Stats');
    var race_stats1 = model.get('_raceStats1');
    var ethnicity_stats1 = model.get('_ethnicityStats1');
    var gender_dist1 = model.get('_genderDist1');
    var age_dist1 = model.get('_ageDist1');
    var cohort1_shortname = model.get('_cohort1Shortname');

    var cohort2_meta = model.get('_cohort2Metadata');
    var cohort2_stats = model.get('_cohort2Stats');
    var race_stats2 = model.get('_raceStats2');
    var ethnicity_stats2 = model.get('_ethnicityStats2');
    var gender_dist2 = model.get('_genderDist2');
    var age_dist2 = model.get('_ageDist2');
    var cohort2_shortname = model.get('_cohort2Shortname');

    var cond_hier = model.get('_interestingConditions');
    // console.log('cond_hier', cond_hier);

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

    function isSingleCohort(){
        return Object.keys(cond_hier[0]['metrics']).length === 1;
    }

    // </editor-fold>

    // <editor-fold desc="---------- VISUAL COMPONENTS ----------">

    function createTooltip() {
        return vis_container.append("div")
            .attr("class", "tooltip");
    }

    /**
     * Renders a difference bar chart showing the comparison between two values
     * @param {d3.Selection} container - D3 selection where the chart should be rendered
     * @param {number} difference - The difference value to visualize
     * @param {Object} options - Configuration options
     * @param {number} options.width - Width of the chart in pixels
     * @param {number} options.height - Height of the chart in pixels
     * @param {number} [options.maxDiff=1] - Maximum absolute difference for the scale (default: 1)
     * @param {string} options.positiveColor - Color for positive differences
     * @param {string} options.negativeColor - Color for negative differences
     * @param {Object} [options.tooltip] - Tooltip configuration (optional)
     * @param {*} options.tooltip.dispatcher - D3 dispatcher for tooltip events
     * @param {string|Function} options.tooltip.content - Tooltip content (string or function: (difference) => string)
     * @param {number} [options.margin=5] - Margin around the bar in pixels (default: 5)
     */
    function DifferenceBar(container, difference, options) {
        const {
            width,
            height,
            maxDiff = 1,
            positiveColor,
            negativeColor,
            tooltip,
            margin = 5
        } = options;

        const diffValue = difference;
        const absDiff = Math.abs(diffValue);

        // Create scale for bar positioning
        const barScale = d3.scaleLinear()
            .domain([maxDiff, -maxDiff])
            .range([margin, width - margin]);

        const zeroX = barScale(0);
        const innerY = margin;
        const innerHeight = height - 2 * margin;

        // Clear any existing chart content (but preserve table backgrounds/borders)
        container.selectAll('g.diff-bar-chart').remove();

        // Create SVG group with a class for future cleanup
        const g = container.append('g')
            .attr('class', 'diff-bar-chart');

        // Draw zero line (x = 0 marker)
        g.append("line")
            .attr("x1", zeroX)
            .attr("y1", 0)
            .attr("x2", zeroX)
            .attr("y2", height)
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        // Draw bar
        const bar = g.append("rect")
            .attr("x", Math.min(zeroX, barScale(diffValue)))
            .attr("y", innerY)
            .attr("width", Math.abs(barScale(diffValue) - zeroX))
            .attr("height", innerHeight)
            .attr("fill", diffValue < 0 ? negativeColor : positiveColor);

        // Add tooltip handlers if provided
        if (tooltip) {
            const getContent = typeof tooltip.content === 'function'
                ? tooltip.content
                : () => tooltip.content;

            bar.on("mouseover", function(event) {
                const content = getContent(diffValue);
                tooltip.dispatcher.call("show", null, { content, event });
            })
                .on("mouseout", function() {
                    tooltip.dispatcher.call("hide");
                });
        }

        // Add invisible hover rectangle for small/zero values
        if (absDiff <= 0.001) {
            const hoverWidth = Math.abs(barScale(0.01) - zeroX);

            const hoverRect = g.append("rect")
                .attr("x", zeroX - hoverWidth / 2)
                .attr("y", innerY)
                .attr("width", hoverWidth)
                .attr("height", innerHeight)
                .attr("fill", "transparent")
                .attr("opacity", 0)
                .style("cursor", "pointer");

            // Add tooltip handlers to hover rect if provided
            if (tooltip) {
                const getContent = typeof tooltip.content === 'function'
                    ? tooltip.content
                    : () => tooltip.content;

                hoverRect.on("mouseover", function(event) {
                    const content = getContent(diffValue);
                    tooltip.dispatcher.call("show", null, { content, event });
                })
                    .on("mouseout", function() {
                        tooltip.dispatcher.call("hide");
                    });
            }
        }
    }

    /*
    * Converts 3 divs into 2 panels and a dragbar
    * Parameters:
    *   dispatch: an instance of d3.dispatch
    *   dispatch: an instance of d3.dispatch
    *   dragBar: dragbar div
    *   leftContainer: left panel div
    *   rightContainer: right panel div
    *   parentContainer: parent container
    *   visContainer: overall vis container
    *   dragBarWidth = 3 : dragbar width,
    *   initialRightPanelOpen = false : whether to start with the right panel open
    * Return:
    *   state of dragbar and 2 panels
    */
    function MakeDragBar(config) {
        const {
            dispatch,
            dragBar,
            leftContainer,
            rightContainer,
            parentContainer,
            visContainer,
            dragBarWidth = 3,
            initialRightPanelOpen = false
        } = config;

        // Create SVG grip icon
        const gripIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        gripIcon.setAttribute('width', '6');
        gripIcon.setAttribute('height', '20');
        gripIcon.setAttribute('viewBox', '0 0 6 20');
        gripIcon.style.pointerEvents = 'none';
        const circle_r = "1.5";
        gripIcon.innerHTML = `
            <circle cx="2" cy="5" r="${circle_r}" fill="#999"/>
            <circle cx="2" cy="10" r="${circle_r}" fill="#999"/>
            <circle cx="2" cy="15" r="${circle_r}" fill="#999"/>
            <circle cx="4" cy="5" r="${circle_r}" fill="#999"/>
            <circle cx="4" cy="10" r="${circle_r}" fill="#999"/>
            <circle cx="4" cy="15" r="${circle_r}" fill="#999"/>
        `;

        // State
        let isDragging = false;
        let startX = 0;
        let startWidthLeft = 0;
        let startWidthRight = 0;
        let isRightPanelOpen = initialRightPanelOpen;
        let lastOpenWidth = null;

        const dragBarElement = dragBar.node();
        const leftNode = leftContainer.node();
        const rightNode = rightContainer.node();
        const parentNode = parentContainer.node();
        const visNode = visContainer.node();

        // Style the drag bar
        dragBarElement.style.cursor = 'col-resize';
        dragBarElement.style.background = '#e0e0e0';
        dragBarElement.style.display = 'flex';
        dragBarElement.style.alignItems = 'center';
        dragBarElement.style.justifyContent = 'center';
        dragBarElement.style.transition = 'background 0.2s';

        // Add the grip icon
        dragBarElement.appendChild(gripIcon);

        // Helper function to calculate available width
        function getAvailableWidth() {
            const parentRect = parentNode.getBoundingClientRect();
            const parentStyle = window.getComputedStyle(parentNode);
            const paddingLeft = parseFloat(parentStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(parentStyle.paddingRight) || 0;

            const leftBorderWidth = parseFloat(window.getComputedStyle(leftNode).borderLeftWidth) +
                parseFloat(window.getComputedStyle(leftNode).borderRightWidth);
            const rightBorderWidth = parseFloat(window.getComputedStyle(rightNode).borderLeftWidth) +
                parseFloat(window.getComputedStyle(rightNode).borderRightWidth);

            const totalWidth = parentRect.width - paddingLeft - paddingRight;
            return totalWidth - dragBarWidth - leftBorderWidth - rightBorderWidth;
        }

        // Helper function to update panel widths
        function updatePanelWidths(newWidthLeft, newWidthRight) {
            leftNode.style.flex = `0 0 ${Math.max(0, newWidthLeft)}px`;
            rightNode.style.flex = `0 0 ${Math.max(0, newWidthRight)}px`;
        }

        // Helper function to set state
        function setInternalState(state) {
            // console.log("state", state);
            const availableWidth = getAvailableWidth();

            if (state === 'left-full') {
                updatePanelWidths(availableWidth, 0);
                isRightPanelOpen = false;
            } else if (state === 'right-full') {
                updatePanelWidths(0, availableWidth);
                isRightPanelOpen = true;
            } else if (state === 'split') {
                const halfWidth = availableWidth / 2;
                updatePanelWidths(halfWidth, halfWidth);
                isRightPanelOpen = true;
                lastOpenWidth = halfWidth;
            }
        }

        // Helper function to snap panels
        function snapPanels(dx) {
            const availableWidth = getAvailableWidth();

            const newWidthLeft = startWidthLeft + dx;
            const newWidthRight = startWidthRight - dx;

            if (newWidthLeft > 0 && newWidthRight > 0) {
                updatePanelWidths(newWidthLeft, newWidthRight);
            } else if (newWidthLeft <= 0) {
                updatePanelWidths(0, availableWidth);
            } else if (newWidthRight <= 0) {
                updatePanelWidths(availableWidth, 0);
            }
        }

        // Helper function to update hover state
        function updateHoverState(isHovering) {
            dragBarElement.style.background = isHovering ? '#d0d0d0' : '#e0e0e0';
            const circles = gripIcon.querySelectorAll('circle');
            circles.forEach(circle => circle.setAttribute('fill', isHovering ? '#666' : '#999'));
        }

        // Event handlers
        function onMouseEnter() {
            updateHoverState(true);
        }

        function onMouseLeave() {
            if (!isDragging) {
                updateHoverState(false);
            }
        }

        function onPointerDown(event) {
            isDragging = true;
            startX = event.clientX;

            const tableRect = leftNode.getBoundingClientRect();
            const detailRect = rightNode.getBoundingClientRect();

            startWidthLeft = tableRect.width;
            startWidthRight = detailRect.width;

            visNode.classList.add('dragging');
            dragBarElement.style.background = '#c0c0c0';

            dragBarElement.setPointerCapture(event.pointerId);

            dispatch.call('dragstart', null, { startWidthLeft, startWidthRight });

            event.preventDefault();
            event.stopPropagation();
        }

        function onPointerMove(event) {
            if (!isDragging) return;

            const dx = event.clientX - startX;
            snapPanels(dx);

            dispatch.call('drag', null, {
                dx,
                currentWidthLeft: leftNode.getBoundingClientRect().width,
                currentWidthRight: rightNode.getBoundingClientRect().width
            });

            event.preventDefault();
        }

        function onPointerUp(event) {
            if (isDragging) {
                isDragging = false;
                visNode.classList.remove('dragging');
                dragBarElement.style.background = '#e0e0e0';
                dragBarElement.releasePointerCapture(event.pointerId);

                const leftWidth = leftNode.getBoundingClientRect().width;
                const rightWidth = rightNode.getBoundingClientRect().width;

                // Update the state tracker
                if (rightWidth > 10) {
                    isRightPanelOpen = true;
                    lastOpenWidth = rightWidth;
                } else {
                    isRightPanelOpen = false;
                    if (startWidthRight > 10) {
                        lastOpenWidth = startWidthRight;
                    }
                }

                dispatch.call('dragend', null, { leftWidth, rightWidth, isRightPanelOpen });
            }
        }

        function onPointerCancel(event) {
            if (isDragging) {
                isDragging = false;
                visNode.classList.remove('dragging');
                dragBarElement.style.background = '#e0e0e0';
            }
        }

        function onDoubleClick(event) {
            const availableWidth = getAvailableWidth();
            const currentLeftWidth = leftNode.getBoundingClientRect().width;
            const currentRightWidth = rightNode.getBoundingClientRect().width;

            let newState;

            if (currentLeftWidth <= 10) {
                // Currently right full, go to left full
                updatePanelWidths(availableWidth, 0);
                isRightPanelOpen = false;
                newState = 'left-full';
            } else if (currentRightWidth <= 10) {
                // Currently left full, go to right full
                updatePanelWidths(0, availableWidth);
                isRightPanelOpen = true;
                newState = 'right-full';
            } else {
                // Currently split, go to left full
                updatePanelWidths(availableWidth, 0);
                isRightPanelOpen = false;
                newState = 'left-full';
            }

            dispatch.call('toggle', null, { state: newState, isRightPanelOpen });

            event.preventDefault();
            event.stopPropagation();
        }

        // Attach event listeners
        dragBarElement.addEventListener('mouseenter', onMouseEnter);
        dragBarElement.addEventListener('mouseleave', onMouseLeave);
        dragBarElement.addEventListener('pointerdown', onPointerDown);
        dragBarElement.addEventListener('pointermove', onPointerMove);
        dragBarElement.addEventListener('pointerup', onPointerUp);
        dragBarElement.addEventListener('pointercancel', onPointerCancel);
        dragBarElement.addEventListener('dblclick', onDoubleClick);

        conceptsTableDispatcher.on('select-row', (rowData, isSelected) => {
            // console.log('handling state change. state = ', isSelected ? 'split' : 'left-full');
            setInternalState(isSelected ? 'split' : 'left-full');
            if(!isSelected){
                concept_hier_col.innerHTML = '';
            }
        });

        // Initialize panel state based on initialRightPanelOpen
        if (!initialRightPanelOpen) {
            setInternalState('left-full');
        }
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
        const input = Inputs.text({ label: label, placeholder: "Filter", width: `${width}px`});
        input.style.marginLeft = '8px';

        // The actual input element is inside the wrapper
        const innerInput = input.querySelector("input");
        // Apply styles to the real input
        innerInput.style.borderRadius = "8px";
        innerInput.style.border = "1px solid #ccc";
        // innerInput.style.padding = "4px 8px"; // optional for nicer spacing
        innerInput.style.width = `${width}px`;    // "100%";      // fills the wrapper width

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
                return `<strong>${series.shortname}: ${xlabel + ': ' || ''} ${d.category}</strong><hr>Proportion: ${patient_count_text}`;
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

    // <editor-fold desc="---------- HIERARCHICAL TABLE FUNCTIONS ----------">

    function HierarchyView(data, { width = 960, height = 720, shortnames = [], dispatcher = null } = {}){
        // console.log('HierarchyView data = ', data);

        if (isNullOrEmpty(shortnames))
            shortnames = ['study', 'baseline'];

        // Layout constants
        const H1 = 180;           // Top section height
        const H2 = 360;           // Middle section height
        const H3 = height - H1 - H2;  // Bottom section height
        const pad = 12;           // Padding
        const cardPadding = 8;    // Padding between cards
        const minCardWidth = 300;
        const minCardHeight = 80;
        const sectionGap = 8;     // Gap between sections
        const separatorThickness = 3;  // Bold line thickness
        const labelHeight = 20;   // Height for section labels

        // State
        let centerCard = data.caller_node || null;
        let currentData = data; // Store current data reference

        // Create SVG root
        const svg = d3.create("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("width", "100%")
            .attr("height", height)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("display", "block");

        // Create persistent layers (z-order: middle behind, top and bottom in front)
        const middleLayer = svg.append("g").attr("class", "middle-layer");
        const topLayer = svg.append("g").attr("class", "top-layer");
        const bottomLayer = svg.append("g").attr("class", "bottom-layer");
        const separatorLayer = svg.append("g").attr("class", "separator-layer");

        // Helper function to calculate card height
        function calculateCardHeight(include_keys) {
            const padding = 16;
            const fontSize = 11;
            const rowGap = 4;
            const headerLineSpacing = 18;
            const separatorMargin = 6;
            const headerExtraLine = 18; // Space for potential second line in header

            const separatorY = headerLineSpacing + headerExtraLine + separatorMargin;
            const dataStartY = separatorY + separatorMargin;

            // Calculate height based on number of keys (no extra lines needed in body now)
            const dataHeight = include_keys.length * (fontSize + rowGap);

            return padding + dataStartY + dataHeight + padding;
        }

        function setCohortCardContent(cardGroup, include_keys, d, cardWidth, cardHeight) {
            // console.log('setCohortCardContent d = ', d);

            const padding = 16;
            const fontSize = 11;
            const labelWidth = 120;
            const columnGap = 10;
            const rowGap = 4;
            const headerLineSpacing = 18;
            const separatorMargin = 6;
            const headerWidth = cardWidth - 2 * padding;

            // Add header
            const headerGroup = cardGroup.append('g')
                .attr('transform', `translate(${padding}, ${padding})`);

            // Wrap concept_name in header to 2 lines if necessary
            const conceptName = d.concept_name || '';
            const maxCharsPerLine = Math.floor(headerWidth / 6); // Approximate chars that fit

            let line1 = '';
            let line2 = '';

            if (conceptName.length > maxCharsPerLine) {
                // Split into two lines at word boundaries
                const words = conceptName.split(' ');
                let currentLine = 1;

                words.forEach(word => {
                    const testLine = currentLine === 1 ?
                        (line1 + (line1 ? ' ' : '') + word) :
                        (line2 + (line2 ? ' ' : '') + word);

                    if (testLine.length <= maxCharsPerLine || (currentLine === 1 && !line1) || (currentLine === 2 && !line2)) {
                        if (currentLine === 1) {
                            line1 = testLine;
                        } else {
                            line2 = testLine;
                        }
                    } else {
                        currentLine = 2;
                        line2 = word;
                    }
                });
            } else {
                line1 = conceptName;
            }

            // First line of concept name
            headerGroup.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('font-size', 11)
                .attr('font-weight', 'bold')
                .attr('fill', '#000')
                .text(line1);

            // Second line of concept name (if needed)
            let currentHeaderY = 0;
            if (line2) {
                headerGroup.append('text')
                    .attr('x', 0)
                    .attr('y', headerLineSpacing)
                    .attr('font-size', 11)
                    .attr('font-weight', 'bold')
                    .attr('fill', '#000')
                    .text(line2);
                currentHeaderY = headerLineSpacing;
            }

            // SNOMED code line
            headerGroup.append('text')
                .attr('x', 0)
                .attr('y', currentHeaderY + headerLineSpacing)
                .attr('font-size', 11)
                .attr('fill', '#666')
                .text(`(SNOMED Code: ${d.concept_code})`);

            // Calculate separator position (accounting for wrapped header)
            const separatorY = currentHeaderY + headerLineSpacing + separatorMargin;

            // Add separator line
            headerGroup.append('line')
                .attr('x1', 0)
                .attr('y1', separatorY)
                .attr('x2', headerWidth)
                .attr('y2', separatorY)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1);

            // Position data rows right below the separator
            const dataStartY = separatorY + separatorMargin;

            // Add data rows
            const dataGroup = cardGroup.append('g')
                .attr('transform', `translate(${padding}, ${padding + dataStartY})`);

            let currentY = 0;

            include_keys.forEach((key) => {
                const rowGroup = dataGroup.append('g')
                    .attr('transform', `translate(0, ${currentY})`);

                // Label (name)
                rowGroup.append('text')
                    .attr('x', 0)
                    .attr('y', fontSize)
                    .attr('font-size', fontSize)
                    .attr('text-anchor', 'start')
                    .attr('fill', '#000')
                    .text(makeKeyWords(key, shortnames[0], shortnames[1]) + ':');

                // Value (no special handling needed anymore)
                const value = d[key] !== undefined ? d[key] : '—';
                rowGroup.append('text')
                    .attr('x', labelWidth + columnGap)
                    .attr('y', fontSize)
                    .attr('font-size', fontSize)
                    .attr('text-anchor', 'start')
                    .attr('fill', '#000')
                    .text(value);

                currentY += fontSize + rowGap;
            });
        }

        // Helper function to prepare item data and get keys
        function prepareItemData(item) {
            let keys = []; // Remove concept_code and concept_name from body
            let cohort_ids = item['source_cohorts'];

            // Add content based on mode
            if (isSingleCohort()) {
                keys = keys.concat(['count_in_cohort', 'prevalence']);
                item['count_in_cohort'] = getCohortItemCount(item, cohort_ids[0]);
                item['prevalence'] = getCohortItemPrevalence(item, cohort_ids[0]);
            } else {
                keys = keys.concat(['cohort1_count', 'cohort1_prevalence', 'difference_in_prevalence', 'cohort2_count', 'cohort2_prevalence']);
                item['cohort1_count'] = getCohortItemCount(item, cohort_ids[0]);
                item['cohort1_prevalence'] = getCohortItemPrevalence(item, cohort_ids[0]);
                item['cohort2_count'] = getCohortItemCount(item, cohort_ids[1]);
                item['cohort2_prevalence'] = getCohortItemPrevalence(item, cohort_ids[1]);
                item['difference_in_prevalence'] = Math.abs(item['cohort1_prevalence'] - Math.abs(item['cohort2_prevalence']));
            }

            return keys;
        }

        // Updated createCard function - now accepts cardHeight as parameter
        function createCard(parentGroup, x, y, cardWidth, cardHeight, item, keys, isDraggable = true) {
            const card = parentGroup.append("g")
                .datum(item)
                .attr("transform", `translate(${x},${y})`)
                .attr("class", "card")
                .style("cursor", isDraggable ? "grab" : "default");

            // Card background
            card.append("rect")
                .attr("width", cardWidth)
                .attr("height", cardHeight)
                .attr("rx", 8)
                .attr("fill", "#fff")
                .attr("stroke", "#ddd")
                .attr("stroke-width", 1);

            setCohortCardContent(card, keys, item, cardWidth, cardHeight);

            if (isDraggable) {
                setupDragBehavior(card, item, cardWidth, cardHeight);
            }

            return card;
        }

        // Setup drag-and-drop behavior
        function setupDragBehavior(card, item, cardWidth, cardHeight) {

            let startX, startY, originalTransform, parentTransform, offsetX, offsetY;

            const drag = d3.drag()
                .on("start", function(event) {
                    // Visual feedback
                    card.style("cursor", "grabbing").raise();
                    card.select("rect").attr("stroke", "#0d6efd").attr("stroke-width", 2);

                    // Store initial positions
                    const [cardX, cardY] = getTransform(d3.select(this));
                    const [parentX, parentY] = getTransform(d3.select(this.parentNode));
                    startX = cardX;
                    startY = cardY;
                    originalTransform = d3.select(this).attr("transform");
                    parentTransform = { x: parentX, y: parentY };

                    // Calculate offset between mouse position and card's top-left corner
                    offsetX = event.x;
                    offsetY = event.y;

                    highlightDropZone(true);

                    // Emit drag start event
                    if (event.sourceEvent && dispatcher) {
                        dispatcher.call('dragstart', null, {
                            clientX: event.sourceEvent.clientX,
                            clientY: event.sourceEvent.clientY
                        });
                    }
                })
                .on("drag", function(event) {
                    const newX = startX + event.x - offsetX;
                    const newY = startY + event.y - offsetY;
                    d3.select(this).attr("transform", `translate(${newX},${newY})`);

                    // Check if hovering over drop zone
                    const absoluteY = newY + parentTransform.y;
                    const isOverDropZone = isInDropZone(absoluteY, cardHeight);
                    highlightDropZone(true, isOverDropZone);

                    // Emit drag event for container to handle scrolling
                    if (event.sourceEvent && dispatcher) {
                        dispatcher.call('drag', null, {
                            clientX: event.sourceEvent.clientX,
                            clientY: event.sourceEvent.clientY
                        });
                    }
                })
                .on("end", async function(event) {

                    // Emit drag end event
                    if (dispatcher) {
                        dispatcher.call('dragend', null, {});
                    }

                    // Reset visual feedback
                    card.style("cursor", "grab");
                    card.select("rect").attr("stroke", "#ddd").attr("stroke-width", 1);

                    const finalX = startX + event.x - offsetX;
                    const finalY = startY + event.y - offsetY;
                    const absoluteY = finalY + parentTransform.y;

                    if (isInDropZone(absoluteY, cardHeight)) {
                        // console.log('setupDragBehavior old item = ', centerCard);
                        // console.log('setupDragBehavior new item = ', item);

                        // Cancel any pending requests when selection changes
                        requestManager.cancelAll();

                        try {
                            const immediate_nodes_data = await requestManager.request(
                                "get_immediate_nodes",
                                {
                                    caller_node_id: item.concept_id,
                                    parent_ids: item.parent_ids
                                },
                                {
                                    statusMessage: "Loading parent and child nodes...",
                                    progressContainer: concept_hier_col.node(),
                                    showProgress: true
                                }
                            );

                            // Update the current data with new data
                            currentData = immediate_nodes_data;
                            centerCard = immediate_nodes_data.caller_node || item;

                            // Redraw with new data
                            redrawHierarchyView();

                        } catch (error) {
                            if (error.message === 'Request cancelled') {
                                // console.log('Immediate nodes request was cancelled');
                            } else {
                                console.error("Error fetching immediate nodes:", error);

                                // Show error message in the panel
                                d3.select(concept_hier_col.node()).selectAll('*').remove();
                                d3.select(concept_hier_col.node())
                                    .append('p')
                                    .style('padding', '8px')
                                    .style('color', '#f44336')
                                    .style('font-size', '12px')
                                    .text(`Error: ${error.message || 'Failed to fetch immediate nodes'}`);
                            }
                        }
                    } else {
                        // Return to original position
                        d3.select(this)
                            .transition()
                            .duration(300)
                            .attr("transform", originalTransform);
                    }

                    highlightDropZone(false);
                });

            card.call(drag);
        }

        // Check if a card is in the drop zone (now needs to be dynamic)
        function isInDropZone(absoluteY, cardHeight) {
            // Use currentData instead of data
            const centerCardId = centerCard?.concept_id;
            const parents = (currentData.parents || []).filter(p => p.concept_id !== centerCardId);

            let middleTop = pad + labelHeight; // Account for "PARENTS" label

            if (parents.length > 0) {
                // Calculate top section height
                const firstItem = parents[0];
                const keys = prepareItemData(firstItem);
                const cardHeight = calculateCardHeight(keys);
                const cardsPerRow = Math.floor((width - 2 * pad + cardPadding) / (minCardWidth + cardPadding));
                const actualCardsPerRow = Math.max(1, Math.min(cardsPerRow, parents.length));
                const numRows = Math.ceil(parents.length / actualCardsPerRow);
                const topHeight = numRows * cardHeight + (numRows - 1) * cardPadding;
                middleTop += topHeight + 2 * sectionGap;
            } else {
                middleTop += 50 + 2 * sectionGap; // Empty section height
            }

            // Account for "CURRENT CONCEPT" label
            middleTop += labelHeight;

            // Calculate middle section height
            let middleHeight = 100; // Default for empty drop zone
            if (centerCard) {
                const keys = prepareItemData(centerCard);
                middleHeight = calculateCardHeight(keys);
            }

            const middleBottom = middleTop + middleHeight;
            const cardCenter = absoluteY + cardHeight / 2;
            return cardCenter >= middleTop && cardCenter <= middleBottom;
        }

        // Extract x, y from transform attribute
        function getTransform(selection) {
            const transform = selection.attr("transform");
            const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
            return match ? [parseFloat(match[1]), parseFloat(match[2])] : [0, 0];
        }

        // Highlight/unhighlight the drop zone
        function highlightDropZone(show, hovering = false) {
            const dropZone = middleLayer.select(".drop-zone-indicator");

            if (show) {
                if (hovering) {
                    dropZone
                        .attr("stroke", "#0d6efd")
                        .attr("stroke-width", 3)
                        .attr("stroke-dasharray", null)
                        .attr("fill", "#e7f3ff");
                } else {
                    dropZone
                        .attr("stroke", "#999")
                        .attr("stroke-width", 2)
                        .attr("stroke-dasharray", "5,5")
                        .attr("fill", "#f0f9f4");
                }
            } else {
                dropZone
                    .attr("stroke", "#ddd")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", centerCard ? null : "5,5")
                    .attr("fill", centerCard ? "#fff" : "#f8f9fa");
            }
        }

        // Updated layoutCardsInGrid - calculates height once and returns total height used
        function layoutCardsInGrid(parentGroup, items, availableWidth, availableHeight, isDraggable = true) {

            if (items.length === 0) {
                // Show "No data to show" message
                parentGroup.append("text")
                    .attr("x", availableWidth / 2)
                    .attr("y", 30)
                    .attr("text-anchor", "middle")
                    .attr("font-size", 14)
                    .attr("fill", "#999")
                    .text("No data to show");
                return 50; // Return minimal height for empty section
            }

            // Prepare first item to determine keys and calculate height once
            const firstItem = items[0];
            const keys = prepareItemData(firstItem);
            const cardHeight = calculateCardHeight(keys);

            // Prepare remaining items
            items.slice(1).forEach(item => prepareItemData(item));

            const cardsPerRow = Math.floor((availableWidth + cardPadding) / (minCardWidth + cardPadding));
            const actualCardsPerRow = Math.max(1, Math.min(cardsPerRow, items.length));
            const cardWidth = (availableWidth - (actualCardsPerRow - 1) * cardPadding) / actualCardsPerRow;

            items.forEach((item, i) => {
                const row = Math.floor(i / actualCardsPerRow);
                const col = i % actualCardsPerRow;
                const x = col * (cardWidth + cardPadding);
                const y = row * (cardHeight + cardPadding);
                createCard(parentGroup, x, y, cardWidth, cardHeight, item, keys, isDraggable);
            });

            // Calculate and return total height used
            const numRows = Math.ceil(items.length / actualCardsPerRow);
            const totalHeight = numRows * cardHeight + (numRows - 1) * cardPadding;
            return totalHeight;
        }

        // Draw the middle section (drop zone or center card) and return its height
        function drawMiddleSection() {
            const mid = middleLayer.append("g").attr("transform", `translate(${pad},0)`);
            const centerCardWidth = width - 2 * pad;

            if (centerCard) {
                // Prepare center card data and calculate actual height
                const keys = prepareItemData(centerCard);
                const centerCardHeight = calculateCardHeight(keys);

                // Draw background indicator (same height as card)
                mid.append("rect")
                    .attr("class", "drop-zone-indicator")
                    .attr("width", centerCardWidth)
                    .attr("height", centerCardHeight)
                    .attr("rx", 8)
                    .attr("fill", "#fff")
                    .attr("stroke", "#ddd")
                    .attr("stroke-width", 1);

                // Draw center card
                createCard(mid, 0, 0, centerCardWidth, centerCardHeight, centerCard, keys, false);
                return centerCardHeight;
            } else {
                // Draw empty drop zone
                const emptyHeight = 100;
                mid.append("rect")
                    .attr("class", "drop-zone-indicator")
                    .attr("width", centerCardWidth)
                    .attr("height", emptyHeight)
                    .attr("rx", 8)
                    .attr("fill", "#f8f9fa")
                    .attr("stroke", "#ddd")
                    .attr("stroke-dasharray", "5,5");

                mid.append("text")
                    .attr("x", centerCardWidth / 2)
                    .attr("y", emptyHeight / 2)
                    .attr("text-anchor", "middle")
                    .attr("font-size", 16)
                    .attr("fill", "#999")
                    .text("Drop a card here");
                return emptyHeight;
            }
        }

        // Redraw the entire view with dynamic positioning
        function redrawHierarchyView() {
            // Clear all layers
            topLayer.selectAll("*").remove();
            middleLayer.selectAll("*").remove();
            bottomLayer.selectAll("*").remove();
            separatorLayer.selectAll("*").remove();

            // Use currentData instead of data
            const centerCardId = centerCard?.concept_id;
            const parents = (currentData.parents || []).filter(p => p.concept_id !== centerCardId);
            const children = (currentData.children || []).filter(c => c.concept_id !== centerCardId);

            let currentY = pad;

            // Add "PARENTS" label
            topLayer.append("text")
                .attr("x", pad)
                .attr("y", currentY + 12)
                .attr("font-size", 12)
                .attr("font-weight", "bold")
                .attr("fill", "#333")
                .text("PARENTS");

            currentY += labelHeight;

            // Draw top section (parents)
            const top = topLayer.append("g").attr("transform", `translate(${pad},${currentY})`);
            const topHeight = layoutCardsInGrid(top, parents, width - 2 * pad, H1 - pad, true);
            currentY += topHeight + sectionGap;

            // Draw separator line between top and middle
            separatorLayer.append("line")
                .attr("x1", pad)
                .attr("y1", currentY)
                .attr("x2", width - pad)
                .attr("y2", currentY)
                .attr("stroke", "#333")
                .attr("stroke-width", separatorThickness);
            currentY += sectionGap;

            // Add "CURRENT CONCEPT" label (in separatorLayer so it doesn't get transformed)
            separatorLayer.append("text")
                .attr("x", pad)
                .attr("y", currentY + 12)
                .attr("font-size", 12)
                .attr("font-weight", "bold")
                .attr("fill", "#333")
                .text("CURRENT CONCEPT");

            currentY += labelHeight;

            // Draw middle section (center card or drop zone)
            middleLayer.attr("transform", `translate(0,${currentY})`);
            const middleHeight = drawMiddleSection();
            currentY += middleHeight + sectionGap;

            // Draw separator line between middle and bottom
            separatorLayer.append("line")
                .attr("x1", pad)
                .attr("y1", currentY)
                .attr("x2", width - pad)
                .attr("y2", currentY)
                .attr("stroke", "#333")
                .attr("stroke-width", separatorThickness);
            currentY += sectionGap;

            // Add "CHILDREN" label
            bottomLayer.append("text")
                .attr("x", pad)
                .attr("y", currentY + 12)
                .attr("font-size", 12)
                .attr("font-weight", "bold")
                .attr("fill", "#333")
                .text("CHILDREN");

            currentY += labelHeight;

            // Draw bottom section (children)
            const bottom = bottomLayer.append("g").attr("transform", `translate(${pad},${currentY})`);
            const bottomHeight = layoutCardsInGrid(bottom, children, width - 2 * pad, H3 - pad, true);
        }

        // Initial draw
        redrawHierarchyView();

        return svg.node();
    }

    // </editor-fold>

    // <editor-fold desc="---------- CONCEPTS TABLE FUNCTIONS ----------">

    function ConceptsTable(dispatch, data, total_counts = [],  shortnames = [], options = {}){

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

        function getPrevDiffTooltipContent(d, series_name){
            const heading = `<strong>${d.concept_name}</strong><br>(SNOMED Code: ${d.concept_code})<hr>`;
            let msg = `(no difference)`;
            if(series_name !== "")
                msg = `(higher in ${series_name})`;
            return `${heading} Diff. in Prev: ${Math.abs(d.difference_in_prevalence).toFixed(prevalence_dp)}<br>${msg}`;
        }

        function getTooltipContent(d, colfield){

            // console.log('d = ', d);
            // console.log('colfield = ', colfield);

            const heading = `<strong>${d.concept_name}</strong><br>(SNOMED Code: ${d.concept_code})<hr>`;
            // default to cohort 1, unless we know it is 2
            let cohort = 1;
            if (colfield.includes('2'))
                cohort = 2;

            // console.log('cohort # = ', cohort);
            // console.log('total_counts = ', total_counts);

            let t_count = total_counts[cohort - 1];

            // console.log('t_count = ', t_count);

            let count_key = 'count_in_cohort';
            if(!isSingleCohort())
                count_key = count_key + cohort;
            let count = d[count_key];

            const patient_count_text = `${formatFraction(count || 0, t_count)}`;
            return `${heading}</strong>Count: ${patient_count_text}`;
        }

        function prepareCondOccurCompareData() {
            // Add calculated fields
            let data = cond_hier.map(item => {
                const [prev1 = 0, prev2 = 0] = Object.values(item.metrics).map(m => m.prevalence);
                const [count1 = 0, count2 = 0] = Object.values(item.metrics).map(m => m.count);

                // Destructure to separate children from the rest
                const { children, ...itemWithoutChildren } = item;

                return {
                    ...itemWithoutChildren,  // Keep all fields EXCEPT children
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

                // Destructure to separate children from the rest
                const { children, ...itemWithoutChildren } = item;

                return {
                    ...itemWithoutChildren,  // Keep all fields EXCEPT children
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

        if (isNullOrEmpty(shortnames))
            shortnames = ['study', 'baseline'];

        if (typeof dimensions !== "object" || dimensions === null) {
            throw new Error("ConceptsTable: 'dimensions' must be an object.");
        }

        let table_data;
        if (!isSingleCohort()) {
            table_data = prepareCondOccurCompareData();
        } else {
            table_data = prepareCondOccurSingleData();
        }
        // console.log('table_data', table_data)

        // Initialize filtered_data after table_data is prepared
        filtered_data = [...table_data];

        const text_offset_x = 10;
        const { height, row_height } = dimensions;

        // Remove scroll & set fixed height
        const container = d3.create("div")
            .style("width", "100%")
            .style("border", "1px solid #ccc")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("height", "100%");

        const table_wrapper = container.append("div")
            .style("flex", "1")
            .style("overflow", "auto")
            .style("min-height", "0");

        // === HEADERS ===

        const headers_text = makeKeysWords(Object.keys(table_data[0]), shortnames[0], shortnames[1]);

        if (!table_data.length) {
            throw new Error("ConceptsTable: table_data is empty.");
        }

        // console.log('headers_text = ', headers_text);

        let columns_data;
        if(isSingleCohort()){
            // columns_data = [
            //     { text: headers_text[7], field: "depth", x: 0, width: 60, type: 'text' },
            //     { text: headers_text[2], field: "concept_code",  x: 60,   width: 160 },
            //     { text: headers_text[1], field: "concept_name",  x: 220, width: 530 },
            //     { text: headers_text[8], field: "count_in_cohort", x: 750, width: 160 },
            //     { text: headers_text[7], field: "prevalence", x: 910, width: 160 }
            // ];
            columns_data = [
                { text: headers_text[2], field: "concept_code",  x: 0,   width: 160 },
                { text: headers_text[1], field: "concept_name",  x: 160, width: 590 },
                { text: headers_text[8], field: "count_in_cohort", x: 750, width: 160 },
                { text: headers_text[7], field: "prevalence", x: 910, width: 160 }
            ];
        }
        else{
            columns_data = [
                { text: headers_text[6], field: "depth", x: 0, width: 60, type: 'text' },
                { text: headers_text[2], field: "concept_code", x: 60, width: 140, type: 'text' },
                { text: headers_text[1], field: "concept_name", x: 200, width: 350, type: 'text' },
                { text: headers_text[8], field: "cohort1_prevalence", x: 550, width: 140, type: 'text' },
                { text: headers_text[7], field: "difference_in_prevalence", x: 690, width: 240, type: 'compare_bars' },
                { text: headers_text[9], field: "cohort2_prevalence", x: 930, width: 140, type: 'text' }
            ];
        }

        const total_table_width = d3.sum(columns_data, d => d.width);

        // console.log('columns_data', columns_data);

        const headers_svg = table_wrapper.append("svg")
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

        const body_svg = table_wrapper.append("svg")
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

            // console.log('renderTableCells row data', row.d);

            // Add click handler to the row group
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
                        onConceptTableRowSelect(d, false);
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

                        onConceptTableRowSelect(d, true);
                    }
                });

            function getPrevalenceValue(val, col) {
                // Define which fields are numeric
                const numericFields =
                    ["prevalence", "count_in_cohort", "cohort1_prevalence", "cohort2_prevalence"];
                const no_dp = ["count_in_cohort"];

                if (val === null || val === undefined) {
                    val = dafault_prevalence;
                }

                if(numericFields.includes(col.field)){
                    if(!no_dp.includes(col.field))
                        val = val.toFixed(prevalence_dp)
                }

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
                            return getPrevalenceValue(d[col.field], col);
                        })
                    .on("mouseover", function (event, d ) {
                        if(col.field.includes('prevalence') || col.field.includes('count')) {
                            tooltipDispatcher.call("show", null, {
                                content: getTooltipContent(d, col.field),
                                event: event
                            });
                        }
                    })
                    .on("mouseout", function () {
                        tooltipDispatcher.call("hide");
                    });
                } else {

                    function getHighestPrevalenceSeriesName(d) {
                        // console.log('d.cohort1_prevalence', d.cohort1_prevalence);
                        // console.log('d.cohort2_prevalence', d.cohort2_prevalence);
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
                                    return getPrevalenceValue(d[col.field], col);
                                })
                                .on("mouseover", function (event, d ) {
                                    // console.log('d = ', d)
                                    if(col.field.includes('prevalence')) {
                                        tooltipDispatcher.call("show", null, {
                                            content: getTooltipContent(d, col.field),
                                            event: event
                                        });
                                    }
                                })
                                .on("mouseout", function () {
                                    tooltipDispatcher.call("hide");
                                });
                            break;

                        case "compare_bars":
                            barScale
                                .domain([max_diff || 1, -max_diff || -1])
                                .range([margin, col.width - margin]);  // full available space inside cell

                            zeroX = barScale(0);

                            cell.each(function (d) {
                                const g = d3.select(this);

                                DifferenceBar(g, d.difference_in_prevalence, {
                                    width: col.width,
                                    height: row_height,
                                    maxDiff: max_diff,
                                    positiveColor: color(shortnames[0]),
                                    negativeColor: color(shortnames[1]),
                                    tooltip: col.field.includes('prevalence') ? {
                                        dispatcher: tooltipDispatcher,
                                        content: (diff) => {
                                            const highest_prevalence = getHighestPrevalenceSeriesName(d);
                                            let highest_series_name = "";
                                            if (highest_prevalence >= 0) {
                                                highest_series_name = shortnames[highest_prevalence];
                                            }
                                            return getPrevDiffTooltipContent(d, highest_series_name);
                                        }
                                    } : undefined,
                                    margin: margin
                                });
                            });
                            break;

                        default:
                            throw new Error(`Unknown column type: ${col.type}`);
                    }
                }
            });
        }

        async function onConceptTableRowSelect(rowData, isSelected) {

            // Helper function to show default message
            function showNoDataMessage() {
                d3.select(concept_hier_col.node())
                    .append('p')
                    .style('padding', '8px')
                    .style('color', '#666')
                    .style('font-size', '12px')
                    .text('No data to display.');
            }

            // console.log(`Row ${isSelected ? 'selected' : 'deselected'}:`, rowData);

            // Cancel any pending requests when selection changes
            requestManager.cancelAll();
            // Clear the right panel
            d3.select(concept_hier_col.node()).selectAll('*').remove();
            // Open or close the right panel depending on selection state
            dispatch.call("select-row", this, rowData, isSelected);

            if (!isSelected) {
                showNoDataMessage();
                return;
            }

            // Fetch parent nodes with progress indicator
            try {
                const immediate_nodes_data = await requestManager.request(
                    "get_immediate_nodes",
                    {
                        caller_node_id: rowData.concept_id,
                        parent_ids: rowData.parent_ids
                    },
                    {
                        statusMessage: "Loading parent and child nodes...",
                        progressContainer: concept_hier_col.node(),
                        showProgress: true
                    }
                );

                // console.log("Received parent and child nodes data:", immediate_nodes_data);concept_hier_col.innerHTML = '';

                concept_hier_col.innerHTML = '';

                const concept_hier_wrapper = concept_hier_col.append('div')
                    .style('height', '100%')
                    .style('overflow', 'auto')
                    .style('width', '100%')
                    .style('flex', '1 1 0')
                    .style('min-height', '0')
                    .style('position', 'relative')
                    .style('box-sizing', 'border-box');

                // Function to create/update the SVG
                function updateHierarchyView() {
                    // Clear existing content
                    concept_hier_wrapper.node().innerHTML = '';

                    const concept_hier_rect_bounds = concept_hier_col.node().getBoundingClientRect();

                    // Calculate SVG height based on number of cards
                    const parents = immediate_nodes_data.parents || [];
                    const children = immediate_nodes_data.children || [];

                    const minCardWidth = 150;
                    const cardPadding = 8;
                    const availableWidth = concept_hier_rect_bounds.width - 24;

                    const cardsPerRow = Math.floor((availableWidth + cardPadding) / (minCardWidth + cardPadding));
                    const actualCardsPerRow = Math.max(1, cardsPerRow);

                    const parentRows = Math.ceil(parents.length / actualCardsPerRow);
                    const childRows = Math.ceil(children.length / actualCardsPerRow);

                    const minCardHeight = 80;
                    const topSectionHeight = 180;
                    const middleSectionHeight = 360;
                    const bottomSectionHeight = 180;

                    const topHeight = Math.max(topSectionHeight, parentRows * (minCardHeight + cardPadding) + 24);
                    const bottomHeight = Math.max(bottomSectionHeight, childRows * (minCardHeight + cardPadding) + 24);

                    const svgHeight = topHeight + middleSectionHeight + bottomHeight;

                    const svg_hier = HierarchyView(immediate_nodes_data, {
                        width: concept_hier_rect_bounds.width,
                        height: svgHeight,
                        shortnames: [cohort1_shortname, cohort2_shortname],
                        dispatcher: hierarchyViewDispatcher
                    });
                    concept_hier_wrapper.node().appendChild(svg_hier);
                }

                // Initial draw
                updateHierarchyView();

                // Listen to drag events and redraw
                conceptsDragbarDispatcher.on('drag.hiercard', () => {
                    updateHierarchyView();
                });

                // Also listen to dragend for a final update
                conceptsDragbarDispatcher.on('dragend.hiercard', () => {
                    updateHierarchyView();
                });

            } catch (error) {
                if (error.message === 'Request cancelled') {
                    // console.log('Immediate nodes request was cancelled');
                    // Deselect the row when cancelled
                    // Show default message for cancelled requests
                    showNoDataMessage();
                } else {
                    console.error("Error fetching immediate nodes:", error);

                    // Show error message in the panel
                    d3.select(concept_hier_col.node()).selectAll('*').remove();
                    d3.select(concept_hier_col.node())
                        .append('p')
                        .style('padding', '8px')
                        .style('color', '#f44336')
                        .style('font-size', '12px')
                        .text(`Error: ${error.message || 'Failed to fetch immediate nodes'}`);
                }
            }
        }

        function updateTableBody() {
            const page_data = getCurrentPageData();

            // console.log('page_data = ', page_data)

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
            .style("align-items", "center")
            .style("flex-shrink", "0");

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
            .style("width", "50px")
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
    const cohort_summary_row = vis_container.append('div').attr('class', 'row-container cohort-summary');
    const cohort_summary_col = cohort_summary_row.append('div').attr('class', 'col-container col-full no-border');

    // demographics row
    const demographics_row = vis_container.append('div').attr('class', 'row-container demographics-row');
    const gender_col = demographics_row.append('div').attr('class', 'col-container');
    const race_col = demographics_row.append('div').attr('class', 'col-container');
    const ethnicity_col = demographics_row.append('div').attr('class', 'col-container');
    const age_col = demographics_row.append('div').attr('class', 'col-container');

    // concepts row
    const concepts_row = vis_container.append('div').attr('class', 'row-container concepts-row no-border');
    const concepts_col = concepts_row.append('div').attr('class', 'col-container col-full');

    // concepts controls row
    const concepts_ctrl_row = concepts_col.append('div').attr('class', 'row-container concepts-ctrl-row');
    // const concepts_ctrl_col = concepts_ctrl_row.append('div').attr('class', 'col-container col-full');

    // concepts table & hierarchy row
    const concepts_tables_row = concepts_col.append('div').attr('class', 'row-container concepts-tables-row');
    const concepts_table_col = concepts_tables_row.append('div').attr('class', 'col-container col-resizable');
    const dragbar_col = concepts_tables_row.append('div').attr('class', 'drag-bar');
    const concept_hier_col = concepts_tables_row.append('div').attr('class', 'col-container');

    // Add resizing functionality to the structure you created
    const conceptsResizablePanel = MakeDragBar({
        dispatch: conceptsDragbarDispatcher,
        dragBar: dragbar_col,
        leftContainer: concepts_table_col,
        rightContainer: concept_hier_col,
        parentContainer: concepts_tables_row,
        visContainer: vis_container
    });

    // const concepts_parents_row = concept_hier_col.append('div').attr('class', 'row-container concepts-tables-row');
    // const concepts_children_row = concept_hier_col.append('div').attr('class', 'row-container concepts-tables-row');

    // </editor-fold>

    // <editor-fold desc="---------- INSERT THE VISUALIZATIONS ----------">

    const cohort2_exists = dataEntityExists(cohort2_stats); // assumption: if this exists, the rest of the cohort 2 data also exists

    // summary statistics
    SummaryStatistics(cohort_summary_col, {data: cohort1_stats, meta: cohort1_meta, shortname: cohort1_shortname},
        {series2: {data: cohort2_stats, meta: cohort2_meta, shortname: cohort2_shortname}});

    // draw the gender barchart
    let series2_data = cohort2_exists ?
        {data: gender_dist2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    gender_col.append(() =>
        VerticalBarChart({data: gender_dist1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
            {series2: series2_data, dimensions: {xlabel: 'gender'}})
    );

    series2_data = cohort2_exists ?
        {data: race_stats2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    race_col.append(() =>
        VerticalBarChart({data: race_stats1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
            {series2: series2_data, dimensions: {xlabel: 'race'}})
    );

    series2_data = cohort2_exists ?
        {data: ethnicity_stats2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    ethnicity_col.append(() =>
        VerticalBarChart({data: ethnicity_stats1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
            {series2: series2_data, dimensions: {xlabel: 'ethnicity'}})
    );

    series2_data = cohort2_exists ?
        {data: age_dist2, shortname: cohort2_shortname, total_count: cohort2_stats[0].total_count} : {};
    age_col.append(() =>
        VerticalBarChart({data: age_dist1, shortname: cohort1_shortname, total_count: cohort1_stats[0].total_count},
            {series2: series2_data, dimensions: {xlabel: 'age'}})
    );

    // draw the concepts table search box
    concepts_ctrl_row.append(() =>
        SearchBox(conceptsTableDispatcher, {label: 'Filter concept code or name'})
    );

    const default_prevalence_dp = 3;
    concepts_ctrl_row.append(() =>
        SpinnerBox(conceptsTableDispatcher, {label: 'Prev dp'})
    );

    if(cohort2_exists) {
        concepts_table_col.append(() =>
            ConceptsTable(conceptsTableDispatcher, cond_hier, [cohort1_stats[0].total_count, cohort2_stats[0].total_count], [cohort1_shortname, cohort2_shortname])
        );
    }
    else{
        concepts_table_col.append(() =>
            ConceptsTable(conceptsTableDispatcher, cond_hier, [cohort1_stats[0].total_count], [cohort1_shortname])
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
