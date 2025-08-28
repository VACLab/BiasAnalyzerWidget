// import * as d3 from "d3";
import * as d3 from 'https://esm.sh/d3@7';
/*
    * draws a vertical bar chart for one or two series of data
    * Parameters:
    *   series1: series 1 data and name
    *   series2: series 2 data and name
    *   dimensions: dimensions of the chart visualization
    * Return:
    *   svg: SVG element containing a vertical bar chart
    */
/* FIXME: Fix overlapping bars */
/* TODO: Refactor to allow more than two series */
export function VerticalBarChart(
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
        .attr('x', d => xScale(d.category))
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth())
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
            .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2 + 25)
            .attr('y', d => yScale(d.value) - 5)
            .attr('text-anchor', 'middle')
            .text(d => d.value);

        // labels for series 1 data if there are 2 datasets
        svg.selectAll('.label1')
            .data(series1.data)
            .enter()
            .append('text')
            .attr('class', 'label1')
            .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2 - xScale.bandwidth() / 4)
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
    