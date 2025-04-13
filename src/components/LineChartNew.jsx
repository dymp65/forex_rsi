import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const LineChart = ({ lines }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll('*').remove(); // clear previous chart

    const svg = svgEl
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('background', '#111')
      .style('border-radius', '8px')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const parseTime = d3.timeParse('%Y-%m-%d');
    const formatTime = d3.timeFormat('%d %b %Y');

    // Build cleaned data per line
    const lineData = lines.map(line => {
      return {
        ...line,
        data: line.data
          .map(d => ({
            time: parseTime(d.time),
            value: d.value,
          }))
          .filter(d => d.time instanceof Date && !isNaN(d.time) && typeof d.value === 'number'),
      };
    });

    // Flatten for global scales
    const allData = lineData.flatMap(line => line.data);

    if (!allData.length) return;

    const x = d3
      .scaleTime()
      .domain(d3.extent(allData, d => d.time))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(allData, d => d.value) * 0.95,
        d3.max(allData, d => d.value) * 1.05,
      ])
      .range([height, 0]);

    // Axes
    const xAxis = d3.axisBottom(x).tickFormat(formatTime).ticks(6);
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

    svg.selectAll('path.domain, .tick line').attr('stroke', '#444');

    // Line generator
    const lineGen = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Draw all lines
    lineData.forEach((line, i) => {
      svg.append('path')
        .datum(line.data)
        .attr('fill', 'none')
        .attr('stroke', line.color || d3.schemeTableau10[i])
        .attr('stroke-width', 2)
        .attr('d', lineGen);
    });

    // Tooltip groups
    const hoverLine = svg.append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('y1', 0)
      .attr('y2', height)
      .style('opacity', 0);

    const tooltipGroup = svg.append('g').style('opacity', 0);
    const tooltipCircles = tooltipGroup.selectAll('circle')
      .data(lineData)
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('fill', d => d.color || '#fff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    const tooltipText = svg.append('text')
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // Overlay to capture mouse
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const xDate = x.invert(mx);

        hoverLine
          .attr('x1', mx)
          .attr('x2', mx)
          .style('opacity', 1);

        const tooltipLines = [];

        tooltipCircles.each(function (d) {
            const data = d.data;
            const bisect = d3.bisector(d => d.time).left;
            const index = bisect(data, xDate);
            const d0 = data[index - 1];
            const d1 = data[index];
            const closest = !d0 ? d1 : !d1 ? d0 : xDate - d0.time > d1.time - xDate ? d1 : d0;
          
            d3.select(this)
              .attr('cx', x(closest.time))
              .attr('cy', y(closest.value));
          
            tooltipLines.push(`${d.name}: ${closest.value.toFixed(4)}`);
        });

        tooltipGroup.style('opacity', 1);
        tooltipText
          .text(`${formatTime(xDate)} | ${tooltipLines.join(' | ')}`)
          .attr('x', mx + 10)
          .attr('y', 20);
      })
      .on('mouseout', () => {
        hoverLine.style('opacity', 0);
        tooltipGroup.style('opacity', 0);
        tooltipText.text('');
      });

  }, [lines]);

  return <svg ref={svgRef}></svg>;
};

export default LineChart;
