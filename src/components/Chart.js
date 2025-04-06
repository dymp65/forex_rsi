import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

const Charts = () => {
  const [data, setData] = useState(null);
  const mainChartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    axios.get('http://localhost:5050/api/analytics')
      .then((res) => {
        setData(res.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (data) {
      drawChart(data, mainChartRef, 'main');
      drawChart(data, rsiChartRef, 'rsi');
    }
  }, [data]);

  const drawChart = (data, ref, type) => {
    const container = d3.select(ref.current);
    container.selectAll('*').remove();

    const width = ref.current.clientWidth || 800;
    const height = type === 'main' ? 300 : 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const parseDate = d3.timeParse('%Y-%m-%d');
    const dates = data.dates.map(parseDate);

    const x = d3.scaleTime().domain(d3.extent(dates)).range([0, innerWidth]);

    const y = d3.scaleLinear()
      .range([innerHeight, 0])
      .domain(type === 'main'
        ? d3.extent([...data.spread, ...data.lower, ...data.middle, ...data.upper].filter(Boolean))
        : [0, 100]
      );

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    const yAxis = g.append('g')
      .call(d3.axisLeft(y));

    const tooltip = d3.select(ref.current)
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '4px 8px')
      .style('font-size', '12px')
      .style('border-radius', '4px')
      .style('display', 'none');

    const drawLine = (values, color) => {
      g.append('path')
        .datum(values.map((v, i) => ({ date: dates[i], value: v })))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('d', d3.line()
          .defined(d => d.value !== null)
          .x(d => x(d.date))
          .y(d => y(d.value))
        );
    };

    if (type === 'main') {
      drawLine(data.spread, '#4e79a7');
      drawLine(data.lower, '#f28e2b');
      drawLine(data.middle, '#e15759');
      drawLine(data.upper, '#76b7b2');
    } else {
      const levelColors = { 30: '#e15759', 70: '#59a14f' };
      [30, 70].forEach(level => {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', y(level))
          .attr('y2', y(level))
          .attr('stroke', levelColors[level])
          .attr('stroke-dasharray', '4');

        g.append('text')
          .attr('x', innerWidth - 30)
          .attr('y', y(level) - 5)
          .text(level)
          .attr('fill', levelColors[level])
          .style('font-size', '10px');
      });

      const points = data.rsi.map((v, i) => ({ date: dates[i], value: v }));
      g.append('path')
        .datum(points.filter(d => d.value !== null))
        .attr('fill', 'none')
        .attr('stroke', '#ff7c43')
        .attr('stroke-width', 1.5)
        .attr('d', d3.line()
          .x(d => x(d.date))
          .y(d => y(d.value))
        );

      g.selectAll('circle')
        .data(points.filter(d => d.value !== null))
        .enter()
        .append('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.value))
        .attr('r', 3)
        .attr('fill', '#ff7c43')
        .on('mouseenter', (e, d) => {
          tooltip
            .html(`RSI: ${d.value.toFixed(2)}<br>${d.date.toLocaleDateString()}`)
            .style('display', 'block');
        })
        .on('mousemove', e => {
          tooltip
            .style('top', `${e.pageY + 10}px`)
            .style('left', `${e.pageX + 10}px`);
        })
        .on('mouseleave', () => tooltip.style('display', 'none'));
    }

    // Zoom & Pan
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        const newX = event.transform.rescaleX(x);
        xAxis.call(d3.axisBottom(newX));
        g.selectAll('path')
          .attr('d', d3.line()
            .defined(d => d.value !== null)
            .x(d => newX(d.date))
            .y(d => y(d.value))
          );
        g.selectAll('circle')
          .attr('cx', d => newX(d.date))
          .attr('cy', d => y(d.value));
      });

    svg.call(zoom);
  };

  return (
    <div ref={wrapperRef}>
      <div ref={mainChartRef} style={{ width: '100%', height: 'auto' }} />
      <div ref={rsiChartRef} style={{ width: '100%', height: 'auto', marginTop: '20px' }} />
    </div>
  );
};

export default Charts;
