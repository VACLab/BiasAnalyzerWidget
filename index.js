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

    // UTILITY FUNCTIONS

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

    // Ref: CoPilot
    function prepareConceptsCompareData(concepts1, concepts2) {

        let mergedList = concepts1.map(item1 => {
            const item2 = concepts2.find(item => item.concept_code === item1.concept_code);
            return Object.assign({}, item1, item2);
        });

        // Add a key-value pair based on a calculation (e.g., double the age)
        mergedList = mergedList.map(item => {
            item.difference = item.study_prevalence - item.base_prevalence;
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

    // DATA
    var concepts1 = model.get('_concepts1');
    var race_stats1 = model.get('_race_stats1');
    var gender_dist1 = model.get('_gender_dist1');
    var age_dist1 = model.get('_age_dist1');

    var concepts2 = model.get('_concepts2');
    var race_stats2 = model.get('_race_stats2');
    var gender_dist2 = model.get('_gender_dist2');
    var age_dist2 = model.get('_age_dist2');

    // PAGE LAYOUT

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
    // concepts prevalence container
    let div_concepts_table = concepts_row.appendChild(document.createElement('div'));
    div_concepts_table.setAttribute('class', 'col-container');
    
    // INSERT THE VISUALIZATIONS

    // draw the gender barchart
    div_gender.appendChild(
        drawVerticalBarChart({
            data1: gender_dist1, data2: gender_dist2, xlabel: 'Gender', ylabel: 'Count'}).node());

    // draw the race barchart
    div_race.appendChild(
        drawVerticalBarChart({
            data1: race_stats1, data2: race_stats2, xlabel: 'Race', ylabel: 'Count'}).node());

    // draw the age barchart
    div_age.appendChild(
        drawVerticalBarChart({
            data1: age_dist1, data2: age_dist2, xlabel: 'Age', ylabel: 'Count'}).node());

    // if there is only one set of concepts, draw a single cohort concepts table
    if(Object.keys(concepts2).length === 0) {
        // draw the concepts table
        div_concepts_table.appendChild(
            drawConceptsTable({
                data: concepts1
            }).node());
    }
    else{
        div_concepts_table.appendChild(
            drawCompareConceptsTable({
                data: prepareConceptsCompareData(concepts1, concepts2)
            }).node());
    }

    // attach the visualization to the AnyWidget element
    el.appendChild(vis_container);

    // DRAW COMPARE CONCEPTS TABLE FUNCTION
    // works for drawing a concepts table for a single cohort
    // TODO: Behavior when resizing the window needs to be tidied-up.
    // TODO: Increase the height of a row where one of the cells is word-wrapped.
    // TODO: Add the ability to resize columns.
    // TODO: Add the ability to sort columns.
    // TODO: Add a concept name/code search box
    function drawCompareConceptsTable({data, height = 400, row_height = 30}){

        // console.log(data);
        const headers_text = makeKeysWords(Object.keys(data[0]));
        // console.log(headers_text);

        // create the parent svg
        let svg = d3.create('svg')
            .attr('class', 'full-width')
            // .attr('width', width)
            .attr('height', data.length * row_height + row_height)
            .attr('viewBox', `0 0 ${self.clientWidth} ${data.length * row_height + row_height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        
        // TABLE HEADERS

        let div_concepts_table_headers_fo = svg.append('foreignObject')
            .attr('class', 'full-width')
            // .attr('width', width)
            .attr('height', row_height);

        let div_concepts_table_headers = div_concepts_table_headers_fo.append('xhtml:div')
            .attr('class', 'full-width');

        // ensure the foreignObject and div are appended before selecting
        setTimeout(() => {
            const headers_svg = div_concepts_table_headers.append('svg')
                .attr('class', 'full-width')
                // .attr('width', width)
                .attr('height', row_height);

            const headers = headers_svg.append('g')
                .attr('class', 'full-width');

            headers.append('rect')
                // .attr('width', width)
                .attr('class', 'full-width')
                .attr('height', row_height)
                .attr('fill', '#d0d0d0')
                .attr('stroke', '#ccc');

            headers.append('text')
                .attr('x', 5)
                .attr('y', 20)
                .text(headers_text[0]);

            headers.append('text')
                .attr('x', 150)
                .attr('y', 20)
                .text(headers_text[1]);

            headers.append('text')
                .attr('x', 510)
                .attr('y', 20)
                .text(headers_text[2]);

            headers.append('text')
                .attr('x', 640)
                .attr('y', 20)
                .text(headers_text[3]);

            headers.append('text')
                .attr('x', 830)
                .attr('y', 20)
                .text(headers_text[4]);

            headers.append('text')
                .attr('x', 950)
                .attr('y', 20)
                .text(headers_text[5]);

        }, 0);

        // TABLE BODY

        let div_concepts_table_body_fo = svg.append('foreignObject')
            // .attr('margin-top', `${row_height}px`)
            // .attr('width', width)
            .attr('class', 'full-width')
            .attr('height', height - row_height);

        let div_concepts_table_body = div_concepts_table_body_fo.append('xhtml:div')
            .attr('class', 'div-concepts-table-body');

        // ensure the foreignObject and div are appended before selecting
        setTimeout(() => {
            const tableSvg = div_concepts_table_body.append('svg')
                .attr('class', 'full-width')
                // .attr('width', width)
                .attr('height', data.length * row_height + row_height);

            const table_body_g = tableSvg.append('g')
                .attr('class', 'full-width');

            // Add data rows
            const rows = table_body_g.selectAll('.row')
                .data(data)
                .enter()
                .append('g')
                .attr('class', 'full-width')
                .attr('transform', (d, i) => `translate(0, ${i * row_height})`);

            rows.append('rect')
                // .attr('width', width)
                .attr('class', 'full-width')
                .attr('height', row_height)
                .attr('fill', '#f0f0f0')
                .attr('stroke', '#ccc');

            rows.append("foreignObject")
                .attr("x", 0)
                // .attr("y", 20)
                .attr("width", 150)
                .attr("height", 30)
                // .style("border", "1px solid blue")
                .style("padding", "5px 5px 5px 5px")
                .append("xhtml:div")
                // .style("border", "1px solid orange")
                .style("word-wrap", "break-word")
                .html(d => d.concept_code);

            rows.append("foreignObject")
                .attr("x", 150)
                // .attr("y", 20)
                .attr("width", 345)
                .attr("height", 30)
                // .style("border", "1px solid blue")
                .style("padding", "5px 5px 5px 5px")
                .append("xhtml:div")
                // .style("border", "1px solid orange")
                .style("word-wrap", "break-word")
                .html(d => d.concept_name);

            rows.append("foreignObject")
                .attr("x", 505)
                // .attr("y", 20)
                .attr("width", 120)
                .attr("height", 30)
                // .style("border", "1px solid blue")
                .style("padding", "5px 5px 15px 5px")
                .append("xhtml:div")
                // .style("border", "1px solid orange")
                .style("word-wrap", "break-word")
                .html(d => d.base_prevalence.toFixed(3));
                // .html(d => (d.base_prevalence * 100).toFixed(3) + "%");

            const maxDiff = d3.max(data, d => Math.abs(d.difference));
            rows.append("foreignObject")
                .attr("x", 635)
                // .attr("y", 20)
                .attr("width", 180)
                .attr("height", 30)
                // .style("border", "1px solid blue")
                .style("padding", "5px 5px 15px 5px")
                .append("xhtml:div")
                .style("border", "1px solid lightgrey")
                .append("xhtml:div")
                .style("background-color", d => d.difference < 0 ? "orange" : "steelblue")
                // .style("width", d => `${(Math.abs(d.difference) * 80).toFixed(3)}px`)
               .style("width", d => `${((Math.abs(d.difference) / maxDiff) * 80).toFixed(3)}px`)
                .style("margin-left", function(d) {
                    let width = parseFloat(d3.select(this).style("width"));
                    let origin = parseFloat(d3.select(this.parentNode).style("width")) / 2;
                  //  console.log(`origin = ${origin}; width = ${width}; difference = ${d.difference}`);
                    return d.difference > 0 ? `${origin}px` : `${origin - width}px`;
                })
                .html(d => d.difference.toFixed(3));

            rows.append("foreignObject")
                .attr("x", 825)
                // .attr("y", 20)
                .attr("width", 120)
                .attr("height", 30)
                // .style("border", "1px solid blue")
                .style("padding", "5px 5px 5px 5px")
                .append("xhtml:div")
                // .style("border", "1px solid orange")
                .style("word-wrap", "break-word")
                .html(d => d.study_prevalence.toFixed(3));
                // .html(d => (d.study_prevalence * 100).toFixed(3) + "%");

            const maxBias = d3.max(data, d => Math.abs(d.bias));
            rows.append("foreignObject")
                .attr("x", 945)
                // .attr("y", 20)
                .attr("width", 100)
                .attr("height", 30)
                // .style("border", "1px solid blue")
                .style("padding", "5px 5px 5px 5px")
                .append("xhtml:div")
                .style("border", "1px solid lightgrey")
                .append("xhtml:div")
                .style("background-color", "grey")
                .style("width", d => `${((Math.abs(d.bias) / maxBias) * 90).toFixed(3)}px`)
                // .style("width", d => `${(d.bias * 80).toFixed(3)}px`)
                .style("height", "20px");
                // .html(d => d.bias.toFixed(3));

            // Add interactivity
            rows.on('mouseover', function() {
                d3.select(this).select('rect').attr('fill', '#e0e0e0');
            })
                .on('mouseout', function() {
                    d3.select(this).select('rect').attr('fill', '#f0f0f0');
                });
        }, 0);

        return svg;
    }

    // DRAW CONCEPTS TABLE FUNCTION
    // works for drawing a concepts table for a single cohort
    // TODO: Behavior when resizing the window needs to be tidied-up.
    // TODO: Increase the height of a row where one of the cells is word-wrapped.
    // TODO: Add the ability to resize columns.
    // TODO: Add the ability to sort columns.
    // TODO: Add a concept name/code search box
    function drawConceptsTable({data, height = 400, row_height = 30}){

        // console.log(data);
        const headers_text = makeKeysWords(Object.keys(data[0]));
        // console.log(headers_text);

        // create the parent svg
        let svg = d3.create('svg')
            .attr('class', 'full-width')
            // .attr('width', width)
            .attr('height', data.length * row_height + row_height)
            .attr('viewBox', `0 0 ${self.clientWidth} ${data.length * row_height + row_height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // TABLE HEADERS

        let div_concepts_table_headers_fo = svg.append('foreignObject')
            .attr('class', 'full-width')
            // .attr('width', width)
            .attr('height', row_height);

        let div_concepts_table_headers = div_concepts_table_headers_fo.append('xhtml:div')
            .attr('class', 'full-width');

        // ensure the foreignObject and div are appended before selecting
        setTimeout(() => {

            const headers_svg = div_concepts_table_headers.append('svg')
                .attr('class', 'full-width')
                // .attr('width', width)
                .attr('height', row_height);

            const headers = headers_svg.append('g')
                .attr('class', 'full-width');

            headers.append('rect')
                // .attr('width', width)
                .attr('class', 'full-width')
                .attr('height', row_height)
                .attr('fill', '#d0d0d0')
                .attr('stroke', '#ccc');

            headers.append('text')
                .attr('x', 10)
                .attr('y', 20)
                .text(headers_text[0]);

            headers.append('text')
                .attr('x', 210)
                .attr('y', 20)
                .text(headers_text[1]);

            headers.append('text')
                .attr('x', 610)
                .attr('y', 20)
                .text(headers_text[2]);

            headers.append('text')
                .attr('x', 810)
                .attr('y', 20)
                .text(headers_text[3]);

        }, 0);

        // TABLE BODY

        let div_concepts_table_body_fo = svg.append('foreignObject')
            // .attr('margin-top', `${row_height}px`)
            // .attr('width', width)
            .attr('class', 'full-width')
            .attr('height', height - row_height);

        let div_concepts_table_body = div_concepts_table_body_fo.append('xhtml:div')
            .attr('class', 'div-concepts-table-body');

        // ensure the foreignObject and div are appended before selecting
        setTimeout(() => {
            const tableSvg = div_concepts_table_body.append('svg')
                .attr('class', 'full-width')
                // .attr('width', width)
                .attr('height', data.length * row_height + row_height);

            const table_body_g = tableSvg.append('g')
                .attr('class', 'full-width');

            // Add data rows
            const rows = table_body_g.selectAll('.row')
                .data(data)
                .enter()
                .append('g')
                .attr('class', 'full-width')
                .attr('transform', (d, i) => `translate(0, ${i * row_height})`);

            rows.append('rect')
                // .attr('width', width)
                .attr('class', 'full-width')
                .attr('height', row_height)
                .attr('fill', '#f0f0f0')
                .attr('stroke', '#ccc');

            rows.append("foreignObject")
                .attr("x", 0)
                // .attr("y", 20)
                .attr("width", 200)
                .attr("height", 30)
                .style("padding", "5px 10px 5px 10px")
                .append("xhtml:div")
                .style("word-wrap", "break-word")
                .html(d => d.concept_code);

            rows.append("foreignObject")
                .attr("x", 200)
                // .attr("y", 20)
                .attr("width", 400)
                .attr("height", 30)
                .style("padding", "5px 10px 5px 10px")
                .append("xhtml:div")
                .style("word-wrap", "break-word")
                .html(d => d.concept_name);

            rows.append("foreignObject")
                .attr("x", 600)
                // .attr("y", 20)
                .attr("width", 200)
                .attr("height", 30)
                .style("padding", "5px 10px 5px 10px")
                .append("xhtml:div")
                .style("word-wrap", "break-word")
                .html(d => d.count_in_cohort);

            rows.append("foreignObject")
                .attr("x", 800)
                // .attr("y", 20)
                .attr("width", 200)
                .attr("height", 30)
                .style("padding", "5px 10px 5px 10px")
                .append("xhtml:div")
                .style("word-wrap", "break-word")
                .html(d => d.prevalence.toFixed(3));
                // .html(d => (d.prevalence * 100).toFixed(3) + "%");

            // Add interactivity
            rows.on('mouseover', function() {
                d3.select(this).select('rect').attr('fill', '#e0e0e0');
            })
                .on('mouseout', function() {
                    d3.select(this).select('rect').attr('fill', '#f0f0f0');
                });
        }, 0);

        return svg;
    }

    // DRAW VERTICAL BAR CHART FUNCTION
    // works for one or two data series
    // TODO: Add mouseover event to show values on hover.
    // TODO: Fix overlapping bars
    function drawVerticalBarChart({data1, data2 = null,
                                      xlabel = '', ylabel = '', title = '',
                                      width = 600, height = 400,
                                      margin = {top: 40, right: 10, bottom: 60, left: 80},
                                      padding = 0.1}) {

        let svg = d3.create('svg')
            .attr('class', 'barchart')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Combine data for scales
        const combinedData = data2 ? data1.concat(data2) : data1;

        // Set up scales
        const xScale = d3.scaleBand(data1.map(d => d.category),
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

        // data1 bars
        svg.selectAll('.bar1')
            .data(data1)
            .enter()
            .append('rect')
            .attr('class', 'bar1')
            .attr('x', d => xScale(d.category))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - margin.bottom - yScale(d.value));


        if (data2 && data2.length > 0) {
            // data2 bars
            svg.selectAll('.bar2')
                .data(data2)
                .enter()
                .append('rect')
                .attr('class', 'bar2')
                .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.value))
                .attr('width', xScale.bandwidth() / 2)
                .attr('height', d => height - margin.bottom - yScale(d.value));

            // Add labels for data2
            svg.selectAll('.label2')
                .data(data2)
                .enter()
                .append('text')
                .attr('class', 'label2')
                .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2 + 25)
                .attr('y', d => yScale(d.value) - 5)
                .attr('text-anchor', 'middle')
                .text(d => d.value);

            // labels for data1 if there are 2 datasets
            svg.selectAll('.label1')
                .data(data1)
                .enter()
                .append('text')
                .attr('class', 'label1')
                .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2 - xScale.bandwidth() / 4)
                .attr('y', d => yScale(d.value) - 5)
                .attr('text-anchor', 'middle')
                .text(d => d.value);

            // only show legend if there are 2 datasets
            const legendData = [
                { label: 'cohort 1', color: 'steelblue' },
                { label: 'cohort 2', color: 'orange' }
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
            // labels for data1 if there is 1 dataset
            svg.selectAll('.label1')
                .data(data1)
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
