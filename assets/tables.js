// import * as d3 from "d3";
import * as d3 from 'https://esm.sh/d3@7';
import { makeKeysWords } from "./utils.js";

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

export function ConceptsTable(data, dispatch,
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