/*
 * Psuedo-Rosling plot
 * 
 * Derived from scatter plot example at:
 *     http://bl.ocks.org/weiglemc/6185069
 *     
 * Changes/enhancements from base code:
 *    - wrapped in class (parameterized axis metrics + category metrics)
 *    - provided method for dynamic updates
 *    - removed legend
 *    - made dynamically resizable
 *    - added sizing to "dots" based on a third metric
 *    - added trails
 * 
 */
function Rosling(container, xAxisMetric, yAxisMetric, sizeMetric, categoryFields){
	var margin = {top: 20, right: 20, bottom: 30, left: 40},
	    width = container.width() - margin.left - margin.right,
	    height = container.height() - margin.top - margin.bottom;

	// setup x
	var domainMargin = 0.05 * (xAxisMetric.max - xAxisMetric.min);
	var xValue = function(d)  {return d[xAxisMetric.id]; }, // data -> value
	    xScale = d3.scale.linear().domain([xAxisMetric.min - domainMargin, xAxisMetric.max + domainMargin]).range([0, width]), // value -> display
	    xMap = function(d) { return xScale(xValue(d)); }; // data -> display
	
	// setup y
	domainMargin = 0.05 * (yAxisMetric.max - yAxisMetric.min);
	var yValue = function(d) { return d[yAxisMetric.id];}, // data -> value
	    yScale = d3.scale.linear().domain([yAxisMetric.min - domainMargin, yAxisMetric.max+domainMargin]).range([height, 0]), // value -> display
	    yMap = function(d) { return yScale(yValue(d));}; // data -> display
	
	// setup fill color
	var cValue = function(d, i) { return i; },
	    color = d3.scale.category10();
	
	// set dot sizing
	var sizeScale = d3.scale.linear().domain([sizeMetric.min, sizeMetric.max]).range([3,20]);
	function sizeFor(d){ return sizeScale(d[sizeMetric.id]); };
	
	// add the graph canvas to the body of the webpage
	var svg = d3.select('#' + container.attr('id')).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom);
	
	var field = svg.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	// add the tooltip area to the webpage
	var tooltip = d3.select('body').append("div")
	    .attr("class", "tooltip")
	    .style("opacity", 0);

	// x-axis
	var xAxis = field.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(d3.svg.axis().scale(xScale).orient("bottom"));
	
	xAxis.append("text")
	      .attr("class", "label")
	      .attr("x", width)
	      .attr("y", -6)
	      .style("text-anchor", "end")
	      .text(xAxisMetric.label);

	// y-axis
	var yAxis = field.append("g")
	      .attr("class", "y axis")
	      .call(d3.svg.axis().scale(yScale).orient("left"));
	
	yAxis.append("text")
	      .attr("class", "label")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text(yAxisMetric.label);
	
	function categoryLabel(d){
		return _.map(categoryFields, function(f){ return d[f]; }).join(' - ');
	}

	var line = d3.svg.line()
	    .x(function(d, i) { return xScale(d[xAxisMetric.id]); })
	    .y(function(d, i) { return yScale(d[yAxisMetric.id]); });
	
	//data array - d3 requires positional ordering, so can't re-sort as nodes are added
	var data = [];
	var trails = [];
	var paths = [];
	
	//sorted index for faster lookups (array of integers: indexes into data array)
	var dataIndex = [];

	function simpleDiff(a,b){ return a < b ? -1 : a > b ? 1 : 0; }
	function compareKeys(a,b){
		var diff = 0;
		for(var k = 0; diff == 0 && k < categoryFields.length; k++){
			var key = categoryFields[k];
			diff = simpleDiff(a[key], b[key]);
		}
		return diff;
	}
	
	function updateEntry(entry){
		entry = _.clone(entry);  //local copy to prevent inadvertant changes
		
		//binary search to find the relevant entry to update
		var min = 0;
		var max = dataIndex.length;
		var diff = -1;
		while( min < max ){
			var mid = (min + max) >>> 1;
			var index = dataIndex[mid];
			var diff = compareKeys(entry, data[index]);
			if( diff < 0 ){
				max = mid;
			} else if( diff == 0 ){
				//found - update the data node
				trails[index].push(entry);
				if( trails[index].length > 5 ){
					trails[index].shift();
				}
				data[index] = entry;
				return index;
			} else {
				min = mid + 1;
			}
		}

		//Insert the (sorted) data index
		index = data.length;
		dataIndex.splice(min, 0, index);
		
		//Add the object to the data (unsorted)
		data.push(entry);
		trails.push([entry,entry,entry,entry,entry]);

		paths.push(
			field.append("g").append("path")
			    .datum(trails[index])
			    .attr("d", line)
			    .attr('stroke', color(index))
			    .attr('stroke-width', 3)
			    .attr('fill', 'none')
			    .attr('opacity', 0.5)
		);
		
		return index;
	}

	this.updateDataPoint = function(dataPoint, transitionInterval){
		var index = updateEntry(dataPoint);
		
		// draw dots
		var dots = field.selectAll(".dot")
		      .data(data);
		
		dots.exit().remove();
		
		dots.enter().append("circle")
		      .attr("class", "dot")
		      .attr("r", function(d){ return sizeFor(d); })
		      .attr("cx", xMap)
		      .attr("cy", yMap)
		      .style("fill", function(d,i) { return color(cValue(d,i));}) 
		      .on("mouseover", function(d) {
		          tooltip.transition()
		               .duration(200)
		               .style("opacity", .9);
		          tooltip.text(categoryLabel(d))
		               .style("left", (d3.event.pageX + 5) + "px")
		               .style("top", (d3.event.pageY - 28) + "px");
		      })
		      .on("mouseout", function(d) {
		          tooltip.transition()
		               .duration(500)
		               .style("opacity", 0);
		      });

		dots.transition().duration(transitionInterval)
	      .attr("r", function(d){ return sizeFor(d); })
	      .attr("cx", xMap)
	      .attr("cy", yMap);
		
		//update the trail
		var trail = trails[index];
		var lastDataPoint = trail.length - 1;
		paths[index].transition().duration(transitionInterval - 50)
			.attr("d", line)
			.each("end", function(d,i){
				paths[index].attr("d", line).attr("transform", null);
			});
		trail.push(trail[lastDataPoint]);
		if( trail.length > 5 ){
			trail.shift();
		}
		
	}

	this.resize = function(width, height){
		svg.attr("width", width)
			.attr("height", height);
		
		width -= margin.left + margin.right;
		height -= margin.top + margin.bottom;
		
		xScale.range([0,width]);
		yScale.range([height,0]);
		
		xAxis.attr("transform", "translate(0," + yScale(0) + ")")
			.call(d3.svg.axis().scale(xScale).orient("bottom"));
		yAxis.call(d3.svg.axis().scale(yScale).orient("left"));
	    
		field.selectAll(".dot")
		      .attr("cx", xMap)
		      .attr("cy", yMap);
		
		_.each(paths, function(path){
			path.attr("d", line).attr("transform", null);
		});
	};
	
	return this;
}