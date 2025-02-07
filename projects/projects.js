import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
// const projectCountElement = document.querySelector('.projects-title');
// projectCountElement.textContent = `Projects (${projects.length})`;

// // Lab 5
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;



function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let newArcs = newArcData.map((d) => newArcGenerator(d));

  let svg = d3.select('svg');
  svg.selectAll('path').remove(); // Clear previous paths

  let legend = d3.select('.legend');
  legend.selectAll('li').remove(); // Clear previous legend items

  // Append arcs and add click logic for highlighting
  newArcs.forEach((arc, idx) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx)) // Fill color
      .attr('class', idx === selectedIndex ? 'selected' : '') // Highlight selected wedge
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx; // Toggle selection

        // Update chart and legend appearance
        svg.selectAll('path').attr('class', (_, arcIdx) => (
          arcIdx === selectedIndex ? 'selected' : ''
        ));
        legend.selectAll('li').attr('class', (_, legendIdx) => (
          legendIdx === selectedIndex ? 'selected' : ''
        ));

        // Filter projects based on selected year
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          let selectedYear = newData[selectedIndex].label;
          let filteredProjects = projects.filter(
            (project) => project.year === selectedYear
          );
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
  });

  // Append legend and add highlighting logic
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '') // Highlight selected legend item
      .attr('class', 'legend-item')
      .html(
        `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
      )
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx; // Toggle selection

        // Update chart and legend appearance
        svg.selectAll('path').attr('class', (_, arcIdx) => (
          arcIdx === selectedIndex ? 'selected' : ''
        ));
        legend.selectAll('li').attr('class', (_, legendIdx) => (
          legendIdx === selectedIndex ? 'selected' : ''
        ));

        // Filter projects based on selected year
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          let selectedYear = newData[selectedIndex].label;
          let filteredProjects = projects.filter(
            (project) => project.year === selectedYear
          );
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
  });
}


// Render initial pie chart
renderPieChart(projects);

// Search for projects
let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
}); 
