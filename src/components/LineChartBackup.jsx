import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('background', '#111')
      .style('border-radius', '8px')
      .style('color', '#fff')
      .html('') // Clear before draw
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse date
    const parseTime = d3.timeParse('%Y-%m-%d');
    const dataset = data.map(d => ({
      time: parseTime(d.time),
      value: d.value,
    }));

    // Scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(dataset, d => d.time))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(dataset, d => d.value) * 0.95, d3.max(dataset, d => d.value) * 1.05])
      .range([height, 0]);

    // Axis
    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%d %b %Y'));
    const yAxis = d3.axisLeft(y).ticks(6);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#ccc');

    svg.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#ccc');

    svg.selectAll('path.domain, .tick line')
      .attr('stroke', '#444');

    // Line
    const line = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#00bfff')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Cursor elements
    const focusLine = svg.append('line')
      .style('stroke', '#888')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0)
      .attr('y1', 0)
      .attr('y2', height);

    const focusCircle = svg.append('circle')
      .attr('r', 4)
      .style('fill', '#00bfff')
      .style('stroke', '#fff')
      .style('stroke-width', 1.5)
      .style('opacity', 0);

    const tooltip = svg.append('text')
      .style('fill', '#fff')
      .style('font-size', '12px')
      .style('opacity', 0);

    // Overlay to capture mouse
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const xDate = x.invert(mx);
        const bisect = d3.bisector(d => d.time).left;
        const index = bisect(dataset, xDate);
        const d0 = dataset[index - 1];
        const d1 = dataset[index];
        const d = !d0 ? d1 : !d1 ? d0 : xDate - d0.time > d1.time - xDate ? d1 : d0;

        focusLine.attr('x1', x(d.time)).attr('x2', x(d.time)).style('opacity', 1);
        focusCircle
          .attr('cx', x(d.time))
          .attr('cy', y(d.value))
          .style('opacity', 1);
        tooltip
          .attr('x', x(d.time) + 10)
          .attr('y', y(d.value) - 10)
          .text(`${d3.timeFormat('%d %b %Y')(d.time)}: ${d.value.toFixed(2)}`)
          .style('opacity', 1);
      })
      .on('mouseout', function () {
        focusLine.style('opacity', 0);
        focusCircle.style('opacity', 0);
        tooltip.style('opacity', 0);
      });

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default LineChart;
