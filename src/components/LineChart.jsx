import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const LineChart = ({ lines, rsiMode = false }) => {
  const wrapperRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const { width } = wrapperRef.current.getBoundingClientRect();
        setDimensions({ width, height: 400 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0) return;

    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll('*').remove();

    const svg = svgEl
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .style('background', '#111')
      .style('border-radius', '8px')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const parseTime = d3.timeParse('%Y-%m-%d');
    const formatTime = d3.timeFormat('%d %b %Y');

    const lineData = lines.map(line => ({
      ...line,
      data: line.data
        .map(d => ({
          time: parseTime(d.time),
          value: d.value,
        }))
        .filter(d => d.time instanceof Date && !isNaN(d.time) && typeof d.value === 'number'),
    }));

    const allData = lineData.flatMap(line => line.data);
    if (!allData.length) return;

    const x = d3.scaleTime()
      .domain(d3.extent(allData, d => d.time))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(allData, d => d.value) * 0.95,
        d3.max(allData, d => d.value) * 1.05,
      ])
      .range([height, 0]);

    const xAxis = d3.axisBottom(x).tickFormat(formatTime).ticks(6).tickSize(-height);
    const yAxis = d3.axisLeft(y).ticks(6).tickSize(-width);

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#ccc');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#ccc');

    svg.selectAll('.tick line').attr('stroke', '#333');
    svg.selectAll('path.domain').attr('stroke', '#333');

    const lineGen = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    lineData.forEach((line, i) => {
      svg.append('path')
        .datum(line.data)
        .attr('fill', 'none')
        .attr('stroke', line.color || d3.schemeTableau10[i])
        .attr('stroke-width', 2)
        .attr('d', lineGen);
    });

    const crosshairX = svg.append('line')
      .attr('stroke', '#888')
      .attr('stroke-width', 1)
      .attr('y1', 0)
      .attr('y2', height)
      .style('opacity', 0);

    const crosshairY = svg.append('line')
      .attr('stroke', '#888')
      .attr('stroke-width', 1)
      .attr('x1', 0)
      .attr('x2', width)
      .style('opacity', 0);

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => {
        crosshairX.style('opacity', 1);
        crosshairY.style('opacity', 1);
        d3.select(tooltipRef.current).style('display', 'block');
      })
      .on('mouseout', () => {
        crosshairX.style('opacity', 0);
        crosshairY.style('opacity', 0);
        d3.select(tooltipRef.current).style('display', 'none');
      })
      .on('mousemove', function (event) {
        const [mx, my] = d3.pointer(event);
        const xDate = x.invert(mx);
        crosshairX.attr('x1', mx).attr('x2', mx);
        crosshairY.attr('y1', my).attr('y2', my);

        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('left', `${mx + margin.left + 20}px`);
        tooltip.style('top', `${my + margin.top}px`);

        let content = `<div class="text-sm text-white mb-1">${formatTime(xDate)}</div>`;
        lineData.forEach((line, i) => {
          const bisect = d3.bisector(d => d.time).left;
          const index = bisect(line.data, xDate);
          const d0 = line.data[index - 1];
          const d1 = line.data[index];
          const closest = !d0 ? d1 : !d1 ? d0 : xDate - d0.time > d1.time - xDate ? d1 : d0;

          if (closest) {
            content += `
              <div class="flex justify-between gap-2 text-xs text-gray-300">
                <span style="color: ${line.color || d3.schemeTableau10[i]};">${line.name}</span>
                <span>${closest.value.toFixed(4)}</span>
              </div>`;
          }
        });
        tooltip.html(content);
      });

      if (rsiMode) {
        const levelColors = { 30: '#ff0000', 70: '#32cd32' };
        [70, 30].forEach(level => {
          svg.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', y(level))
            .attr('y2', y(level))
            .attr('stroke', levelColors[level])
            .attr('stroke-dasharray', '4')
            .attr('stroke-width', 2);

            // svg.append('text')
            // .attr('x', width - 30)
            // .attr('y', y(level) - 5)
            // .text(level)
            // .attr('fill', levelColors[level])
            // .style('font-size', '10px');
  
          // svg.append('text')
          //   .attr('x', width - 30)
          //   .attr('y', y(level) - 5)
          //   .text(`RSI ${level}`)
          //   .attr('fill', '#ff0000')
          //   .style('font-size', '10px')
          //   .attr('text-anchor', 'end');
        });
      }

  }, [lines, dimensions]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <svg ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        className="absolute bg-black/80 text-white rounded-md shadow-lg p-2 text-xs hidden pointer-events-none"
        style={{ minWidth: '140px', zIndex: 10 }}
      ></div>
    </div>
  );
};

export default LineChart;
