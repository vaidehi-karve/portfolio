// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
let data = [];
let xScale, yScale;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    processCommits();
    console.log(commits);
    displayStats();
  }
  

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  createScatterplot();
});

let commits = d3.groups(data, (d) => d.commit);

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        // What other options do we need to set?
        // Hint: look up configurable, writable, and enumerable
      });

      return ret;
    });
}

function displayStats() {
  // Process commits first
  processCommits();

  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);

  // Add more stats as needed...
  const numFiles = d3.group(data, (d) => d.file).size;
  dl.append('dt').text('Number of Files');
  dl.append('dd').text(numFiles);

  const maxFileLength = d3.max(data, (d) => d.length);
  dl.append('dt').text('Max File Length (Lines)');
  dl.append('dd').text(maxFileLength);

  const averageFileLength = d3.mean(data, (d) => d.length);
  dl.append('dt').text('Average File Length (Lines)');
  dl.append('dd').text(averageFileLength.toFixed(2));

  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('Max Depth');
  dl.append('dd').text(maxDepth);

  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];

  dl.append('dt').text('Most Active Time of Day');
  dl.append('dd').text(maxPeriod);
}

function createScatterplot(){
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const width = 1000;
  const height = 600;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
  .scaleSqrt() // Change only this line
  .domain([minLines, maxLines])
  .range([2, 30]);

  const dots = svg.append('g').attr('class', 'dots');
  // dots.selectAll('circle').data(sortedCommits).join('circle');

  dots
  .selectAll('circle')
  .data(sortedCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines))   // Use the radius scale for dot size
  .style('fill-opacity', 0.7)               // Add some transparency for overlapping dots
  .on('mouseenter', function (event, d) {
    d3.select(event.currentTarget).style('fill-opacity', 1);  // Full opacity on hover
    updateTooltipContent(d);                  // Update tooltip
    updateTooltipVisibility(true);           // Make tooltip visible
    brushSelector();
  })
  .on('mouseleave', function (event) {
    d3.select(event.currentTarget).style('fill-opacity', 0.7);  // Restore opacity
    updateTooltipVisibility(false);            // Hide tooltip
  });



    // .attr('r', (d) => {
    //   const lines = d.totalLines || 0;  // Use 0 as fallback if totalLines is missing
    //   return rScale(lines);
    // })
    // .attr('fill', (d) => (d.hourFrac < 6 || d.hourFrac > 18 ? 'steelblue' : 'orange'))
    // .on('mouseenter', (event, commit) => {
    //   updateTooltipContent(commit);
    //   updateTooltipVisibility(true);
    //   updateTooltipPosition(event);
    // })
    // .on('mouseleave', () => {
    //   updateTooltipContent({});
    //   updateTooltipVisibility(false);
    // });


  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

// Create gridlines as an axis with no labels and full-width ticks
gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    

  // console.log("Dots selection:", dots);
  // console.log("Total dots found:", dots.size());


};

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
  const svg = document.querySelector('svg');
  // Create brush
  d3.select(svg).call(d3.brush());

  // Raise dots and everything after overlay
  d3.select(svg).call(d3.brush().on('start brush end', brushed));

}

let brushSelection = null;

function brushed(event) {
  console.log(event);
  brushSelection = event.selection;
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  if (!brushSelection) return false;
  const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
  const max = { x: brushSelection[1][0], y: brushSelection[1][1] };

  const x = xScale(commit.date);
  const y = yScale(commit.hourFrac);

  return x >= min.x && x <= max.x && y >= min.y && y <= max.y; 
} 

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}


function updateSelectionCount() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}
