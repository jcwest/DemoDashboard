//Base code from https://gist.github.com/mbostock/1642874
// Modified to:
//   - return an object
//   - handle resizing
//   - have an API to feed in updates

function LinearTrace(sampleCount, metric, container, size){
	var random = d3.random.normal(0, .2),
	    data = d3.range(sampleCount).map(function(){return Math.max(0,metric.min);});
 
	var margin = {top: 10, right: 10, bottom: 20, left: 25},
	    width = size.width - margin.left - margin.right,
	    height = size.height - margin.top - margin.bottom;
	
	var x = d3.scale.linear()
	    .domain([0, sampleCount - 1])
	    .range([0, width]);
 
	var y = d3.scale.linear()
	    .domain([metric.min, metric.max])
	    .range([height, 0]);
 
	var line = d3.svg.line()
	    .x(function(d, i) { return x(i); })
	    .y(function(d, i) { return y(d); });
 
	var svg = d3.select('#' + container.attr("id")).append("svg")
	    .attr("width", width + margin.top + margin.bottom)
	    .attr("height", height + margin.left + margin.right);
	
	var g = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
	g.append("defs").append("clipPath")
	    .attr("id", "clip")
	  .append("rect")
	    .attr("width", width)
	    .attr("height", height);
 
	var xAxis = g.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + y(0) + ")")
	    .call(d3.svg.axis().scale(x).orient("bottom"));
 
	var yAxis = g.append("g")
	    .attr("class", "y axis")
	    .call(d3.svg.axis().scale(y).orient("left"));
 
	var path = g.append("g")
	    .attr("clip-path", "url(#clip)")
	  .append("path")
	    .datum(data)
	    .attr("class", "line")
	    .attr("d", line);
	
	this.addDataPoint = function(value, duration){
		data.push(value);
		path.attr("d", line)
			.attr("transform", null)
			.transition()
			.duration(duration)
			.ease("linear")
			.attr("transform", "translate(" + x(-1) + ",0)");
		data.shift();
	};
	
	this.resize = function(width, height){
		svg.attr("width", width)
			.attr("height", height);
		
		width -= margin.left + margin.right;
		height -= margin.top + margin.bottom;
		
		g.select('defs * rect')
			.attr('width', width)
			.attr('height', height);
		
		x = d3.scale.linear()
			.domain([0, sampleCount - 1])
			.range([0, width]);
 
		y = d3.scale.linear()
			.domain([metric.min, metric.max])
			.range([height, 0]);
		
		xAxis
			.attr("transform", "translate(0," + y(0) + ")")
			.call(d3.svg.axis().scale(x).orient("bottom"));
 
		yAxis.call(d3.svg.axis().scale(y).orient("left"));
		
		path.attr("d", line)
			.attr("transform", null);
	};
	
	return this;
}
