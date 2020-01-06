
/**
 * Welcome to the Looker Visualization Builder! Please refer to the following resources 
 * to help you write your visualization:
 *  - API Documentation - https://github.com/looker/custom_visualizations_v2/blob/master/docs/api_reference.md
 *  - Example Visualizations - https://github.com/looker/custom_visualizations_v2/tree/master/src/examples
 **/

function RadarChart(id, data, options, moreData, colorSeries, originalData, axes) {
	var cfg = {
		 w: 600,	//Width of the circle
		 h: 600,	//Height of the circle
		 margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
		 levels: 3,		//How many levels or inner circles should there be drawn
		 maxValue: 0, 			//What is the value that the biggest circle will represent
		 labelFactor: 1.325, 	//How much farther than the radius of the outer circle should the labels be placed
		 wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
		 opacityArea: 0.15, 	//The opacity of the area of the blob
		 dotRadius: 5, 			//The size of the colored circles of each blog
		 opacityCircles: 0.15, 	//The opacity of the circles of each blob
		 strokeWidth: 2, 		//The width of the stroke around each blob
		 roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
		 color: d3.scale.category10(),	//Color function
	     legendSide: 'left',	//Side legend appears
	     glow: 2,				//value controlling glow strength
	     negatives: true,		//allow negatives to be plotted?
	     axisColor: "#CDCDCD",	//color of the axis grid lines
	     backgroundColor: "#CDCDCD",	//background color of chart
	     negativeR: .81,		//scalar dictating negative axis length
	     independent: true,		//decouple axes?
	     axisFont: 2,			//font of the axis labels
	     scaleFont: 1,			//font of the scale
	     legendPad: 10,			//separation between legend items
	     legendFont: .8,			//font of legend items
	     domainMax: null
	};

	//Put all of the options into a variable called cfg
	if('undefined' !== typeof options){
	  for(var i in options){
		if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
	  }//for i
	}//if
	
	//If the supplied maxValue is smaller than the actual one, replace by the max in the data
	var maxValue = cfg.domainMax ? Math.max(cfg.domainMax, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))})) : d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))});

	var deterSide = Math.min(cfg.w, cfg.h);
		
	var allAxis = (data[0].map(function(i, j){return i.axis})),	//Names of each axis
		total = allAxis.length,					//The number of different axes
		radius = Math.min(deterSide*.35, cfg.legendSide === 'center' ? deterSide*.3 : deterSide*.45), 	//Radius of the outermost circle
		Format = d3.format(",.0f"),			 	//Label formatting
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
	
	//Scale for the radius
  	if (cfg.independent) {
	    axesMax = []
	    data.forEach(function(d) {
	      d.forEach(function(i) {
	        if (!(i.axis in axesMax)) {
	          axesMax[i.axis] = Math.abs(i.value);
	        } else if (Math.abs(i.value) > axesMax[i.axis]) {
	          axesMax[i.axis] = Math.abs(i.value);
	        }
	      });
	    });
	    rScale = [];
	    allAxis.map(function(d) {
	      rScale.push(d3.scale.linear()
				.range([0, radius])
				.domain([0, axesMax[d]]))
	    });
	    maxValue = []
	    allAxis.map(function(d) {
	      maxValue.push(axesMax[d])
	    });
  	} else {
	    var maxValues = cfg.domainMax ? Math.max(cfg.domainMax, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))})) : d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))});
	    rScale = [];
	    allAxis.map(function(d) {
	      rScale.push(d3.scale.linear()
				.range([0, radius])
				.domain([0, maxValue]))
	    });
	    maxValue = []
	    allAxis.map(function(d) {
	      maxValue.push(maxValues)
	    });
  	}

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////

	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();
	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
			.attr("width",  cfg.w)
			.attr("height", cfg.h + cfg.margin.bottom)
			.attr("class", "radar"+id);
	//Append a g element	
	var moveH =	cfg.legendSide === 'center' ? (cfg.h/2 - cfg.margin.top) : (cfg.h/2 + cfg.margin.top);
	var g = svg.append("g")
			.attr("transform", "translate(" + (cfg.w/2) + "," + moveH + ")");
	
	/////////////////////////////////////////////////////////
	////////// Glow filter for some extra pizzazz ///////////
	/////////////////////////////////////////////////////////
	
	//Filter for the outside glow
	var filter = g.append('defs').append('filter').attr('id','glow'),
		feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation',`${cfg.glow}`).attr('result','coloredBlur'),
		feMerge = filter.append('feMerge'),
		feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
		feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////
	
	//Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");
	
	
	//console.log(d3.range(1,(cfg.levels+1)).reverse());
	//Text indicating at what % each level is
	axisGrid.selectAll(".axisLabel")
	   .data(d3.range(1,(cfg.levels+1)).reverse())
	   .enter().append("text")
	   .attr("class", "axisLabel")
	   .attr("x", 4)
	   .attr("y", function(d){return -d*radius/cfg.levels;})
	   .attr("dy", "0.4em")
       .style("font-size", cfg.independent ? '0px' : `${cfg.scaleFont}px`)
       .style("font-weight", "900")
       .style("font-family", "Open Sans")
  	   .style("z-index", 10)
	   .attr("fill", cfg.axisColor)
	   .text(function(d) { return Format(maxValue[0] * d/cfg.levels); });

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////
	var negativeR = 1;
	console.log(total);
	if (cfg.roundStrokes) {
		negativeR = 1;
	} else if (total == 3) {
		negativeR = .5;
	} else if (total == 5) {
		negativeR = .81
	} else if (total == 7) {
		negativeR = .9
	} else if (total == 9) {
		negativeR = .94
	} else if (total == 11) {
		negativeR = .96
	}
	console.log(negativeR);
	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	//Append the lines
	axis.append("line")
	    .attr("x1", function(d, i){ 
		if (cfg.roundStrokes) {
		    if (cfg.negatives) {
		      return rScale[i](maxValue[i]*-1) * Math.cos(angleSlice*i - Math.PI/2);
		    } else {
	     	return 0;
	    	}
	  	} else {
		    if (cfg.negatives) {
		      return rScale[i](maxValue[i]*-negativeR) * Math.cos(angleSlice*i - Math.PI/2);
		    } else {
		      return 0;
		    }
	  	}
  	})
  	.attr("y1", function(d, i){ 
    	if (cfg.roundStrokes) {
	        if (cfg.negatives) {
	          return rScale[i](maxValue[i]*-1) * Math.sin(angleSlice*i - Math.PI/2);
	        } else {
	          return 0;
	        }
	    } else {
	        if (cfg.negatives) {
	          return rScale[i](maxValue[i]*-negativeR) * Math.sin(angleSlice*i - Math.PI/2);
	        } else {
	          return 0;
	        }
	    }
  	})
	.attr("x2", function(d, i){ return rScale[i](maxValue[i]*1.0) * Math.cos(angleSlice*i - Math.PI/2); })
	.attr("y2", function(d, i){ return rScale[i](maxValue[i]*1.0) * Math.sin(angleSlice*i - Math.PI/2); })
	.attr("class", "line")
	.style("stroke", function(d, i){ return cfg.axisColor })
	.style("stroke-width", "2px");

	//Append the labels at each axis
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", `${cfg.axisFont}px`)
	    .style("font-weight", "549")
	  	.style("font-family", "Open Sans")
		.attr("text-anchor", "middle")
		.attr("dy", "1em")
		.attr("x", function(d, i){ return rScale[i](maxValue[i]*cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y", function(d, i){ return rScale[i](maxValue[i]*cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2) - cfg.labelFine; })
		.text(function(d){return d})
		.call(wrap, cfg.wrapWidth);
  
  	//Draw the background circles
  	if (cfg.roundStrokes) {
    	axisGrid.selectAll(".levels")
		    .data(d3.range(1,(cfg.levels+1)).reverse())
		    .enter()
		    .append("circle")
		    .attr("class", "gridCircle")
		    .attr("r", function(d, i){return radius/cfg.levels*d;})
		    .style("fill", function(d, i){ return cfg.backgroundColor })
		    .style("stroke", function(d, i){ return cfg.axisColor })
		    .style("fill-opacity", cfg.opacityCircles)
		    .style("filter" , "url(#glow)");
  	} else {
	    levels = []
	    axisGrid.selectAll(".axisLabel").forEach(function(d) {
	      s = d.length;
	      d.forEach(function(d) {
	        set = []
	        r = parseInt(d.getAttribute("y"));
	        axis[0].forEach(function(d,i) {
	          tempx = r * Math.cos(angleSlice*i - Math.PI*3/2);
	          tempy = r * Math.sin(angleSlice*i - Math.PI*3/2);
	          set.push({
	            x: tempx,
	            y: tempy
	          });
	        });
	        levels.push(set);
	      });
	    });
	    //console.log(levels);
	    levels.forEach(function(d) {
	      //console.log(d);
	      axisGrid.selectAll(".levels")
	        .data([d])
	        .enter().append("polygon")
	        .attr("points",function(d) { 
	          return d.map(function(d) {
	              return [d.x,d.y].join(",");
	          }).join(" ");
	        })
	        .attr("class", "gridCircle")
	        .style("fill", function(d, i){ return cfg.backgroundColor })
	        .style("stroke", function(d, i){ return cfg.axisColor })
	        .style("fill-opacity", cfg.opacityCircles)
	        .style("filter" , "url(#glow)");
	    });
  	};

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	
	//The radial line function
	var radarLine = d3.svg.line.radial()
		.interpolate("linear-closed")
		.radius(function(d,i) { return rScale[i](cfg.negatives ? (d.value < 0 ? d.value*.8 : d.value) : (d.value < 0 ? 0 : d.value)); })
		.angle(function(d,i) {	return i*angleSlice; });
		
	if(cfg.roundStrokes) {
		radarLine.interpolate("cardinal-closed");
	}
				
	//Create a wrapper for the blobs	
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper")
    	.attr("id", function(d,i) { return "v"+moreData[i].label.replace(/[^A-Z0-9]+/ig, ""); });
	
	//Append the backgrounds	
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
    	.attr("id", function(d,i) { return "v"+moreData[i].label.replace(/[^A-Z0-9]+/ig, ""); })
		.attr("d", function(d,i) { return radarLine(d); })
		.style("fill", function(d,i) { return cfg.color(i); })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1); 
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);	
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});
		
	//Create the outlines	
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d,i) { return cfg.color(i); })
		.style("fill", "none")
		.style("filter" , "url(#glow)");		
	
	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", cfg.dotRadius)
		.attr("cx", function(d,i){ 
    		return rScale[i](cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.cos(angleSlice*i - Math.PI/2); 
  		})
		.attr("cy", function(d,i){ 
	    	return rScale[i](cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.sin(angleSlice*i - Math.PI/2); 
	  	})
		.style("fill", function(d,i,j) { return cfg.color(j); })
		.style("fill-opacity", 1);

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////
	
	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper")
    	.attr("child_id", function(d,i) { return "v"+moreData[i].label.replace(/[^A-Z0-9]+/ig, ""); });
		
	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
    	.attr("series_id", function(d,i){ return this.parentNode.getAttribute("child_id"); })
		.attr("r", cfg.dotRadius*3)
		.attr("cx", function(d,i){ 
	    	return rScale[i](cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.cos(angleSlice*i - Math.PI/2); 
	  	})
		.attr("cy", function(d,i){ 
	    	return rScale[i](cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.sin(angleSlice*i - Math.PI/2); 
	  	})
		.style("fill", "none")
   		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;
	    	d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1); 
			//Bring back the hovered over blob
			d3.select(".radarArea#"+this.parentNode.getAttribute("child_id"))
				.transition().duration(200)
				.style("fill-opacity", 0.7);
			var render = {value: d.rendered};
			tooltip
				.attr('x', newX)
				.attr('y', newY)
    			.text(LookerCharts.Utils.textForCell(render))
				.transition().duration(200)
        		.style("font-family", "Open Sans")
    			.style("pointer-events", "none")
				.style('opacity', 1);
		})
		.on("click", function(d,i) {
			LookerCharts.Utils.openDrillMenu({
	 			links: d.links,
	 			event: event
 			});
		})
		.on("mouseout", function() {
			tooltip.transition().duration(200)
				.style("opacity", 0);
    		d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});
	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0);
  
  	/////////////////////////////////////////////////////////
	///////////// 				Legend-airy		  	 ////////////////
	/////////////////////////////////////////////////////////
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = 'g.radarWrapper.hidden { opacity: 0.0; } .legendCells .hidden { opacity: 0.2;text-align:center }';
  
    var ordinal = d3.scale.ordinal()
	    .domain(moreData.map(d => d.label))
	    .range(moreData.map((d,i)  => cfg.color(i)));

  	var svg = d3.select("svg");
		if (cfg.legendSide === 'left') {
	    legx = 20;
	    legy = 10;
	    leg_orient = 'vertical';
	    leg_pad = cfg.legendPad + 0;
  	} else if (cfg.legendSide === 'right') {
	    legx = cfg.w*1.25;
	    legy = 20;
	    leg_orient = 'vertical';
	    leg_pad = cfg.legendPad + 0;
  	} else if (cfg.legendSide === 'center') {
	    legy = window.innerHeight-(60);
	    leg_orient = 'horizontal';
	    leg_pad = cfg.legendPad + 50;
  	} else if (cfg.legendSide === 'none') {
	    legx = -100;
	    legy = -150;
	    leg_orient = 'vertical';
	    leg_pad = cfg.legendPad + 70;
  	}

 	svg.append("g")
    	.attr("class", "legendOrdinal")
    	.style("font-size", `${cfg.legendFont}px`)
    	.style("font-family", "Open Sans");

  	var legendOrdinal = d3.legend.color()
    	.shape("path", d3.svg.symbol().type("circle").size(120)())
    	.shapePadding(leg_pad)
    	.scale(ordinal)
  		.orient(leg_orient)
  		.on('cellclick', function(d) {
  			var d = d.replace(/[^A-Z0-9]+/ig, "");
	        toggleDataPoints(d);
	        const legendCell = d3.select(this);
	        legendCell.classed('hidden', !legendCell.classed('hidden'));  // toggle opacity of legend item
	      	series_sel = d3.select(`#v${d}`)[0][0].classList.contains('hidden');
	      	if (series_sel) {
	          d3.select(`#v${d}`).style("opacity", "0").style("pointer-events","none");
	          d3.selectAll(`[child_id=v${d}]`).style("pointer-events","none");
	          d3.selectAll(`[series_id=v${d}]`).style("pointer-events","none");
	        } else {
	          d3.select(`#v${d}`).style("opacity", "1").style("pointer-events",null);
	          d3.selectAll(`[child_id=v${d}]`).style("pointer-events","all");
	          d3.selectAll(`[series_id=v${d}]`).style("pointer-events","all");
	        }
	      	legend_tru = legendCell[0][0].classList.contains('hidden');
	      	if (legend_tru) {
	          d3.select(this).style("opacity", ".2");
	        } else {
	          d3.select(this).style("opacity", "1");
	        }
    	});

  	svg.select(".legendOrdinal")
    	.call(legendOrdinal);

    //console.log(d3.select('.legendCells').node().getBBox().width);
    if (cfg.legendSide == 'center') {
    	wid = window.innerWidth/2 - d3.select('.legendCells').node().getBBox().width/2 + cfg.margin.left;
    	d3.select(".legendOrdinal").attr("transform", function(d) { return `translate(${wid},${legy})`});
    } else if (cfg.legendSide == 'right') {
    	wid = window.innerWidth - d3.select('.legendCells').node().getBBox().width*1.25;
    	d3.select(".legendOrdinal").attr("transform", function(d) { return `translate(${wid},${legy})`});
    } else {
    	d3.select(".legendOrdinal").attr("transform", function(d) { return `translate(${legx},${legy})`});
    }
	
	/////////////////////////////////////////////////////////
	/////////////////// Helper Function /////////////////////
	/////////////////////////////////////////////////////////

	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text	
	function wrap(text, width) {
	  text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.4, // ems
			y = text.attr("y"),
			x = text.attr("x"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			
		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		  }
		}
	  });
	}//wrap	
  
 	function toggleDataPoints(colorClass) {
      d3.selectAll(`#v${colorClass}`)
        .classed('hidden', function() {  // toggle "hidden" class
            return !d3.select(this).classed('hidden');
        });
   	}
	
}//RadarChart
const baseOptions = {
	levels: {
      	type: "number",
      	label: "Levels",
      	default: 4,
      	section: "Plot"
    },
    label_factor: {
     	type: "number",
      	label: "Axis Label Padding",
      	default: 85,
      	section: "Plot - Advanced",
      	display: "range",
      	order: 4
    },
    label_fine: {
     	type: "number",
      	label: "Axis Label - Fine Tuning Y",
      	default: 15,
      	section: "Plot - Advanced",
      	display: "range",
      	order: 5
    },
    levels: {
    	type: "number",
      	label: "Plot Levels",
      	default: 3,
      	section: "Plot"
    },
    domain_max: {
    	type: "number",
      	label: "Axis Max Override",
      	section: "Plot"
    },
    rounded_strokes: {
      	type: "string",
      	label: "Rounded Strokes?",
      	display: "select",
      	values: [
      		{"true": true},
      		{"false": false}
      	],
      	default: true,
      	section: "Plot"
    },
    independent: {
      	type: "string",
      	label: "Normalize Axes?",
      	display: "select",
      	values: [
      	 	{"true": true},
      	 	{"false": false}
      	],
      	default: false,
      	section: "Plot"
    },
    negatives: {
      	type: "string",
      	label: "Allow Negatives?",
      	display: "select",
     	values: [
      	 	{"true": true},
      	 	{"false": false}
      	],
      	default: false,
      	section: "Plot"
    },
    wrap_width: {
    	type: "number",
      	label: "Axis Label Wrapping",
      	default: 100,
      	section: "Plot - Advanced",
      	order: 6
    },
    opacity_area: {
      	type: "number",
      	label: "Area Darkness",
      	display: "range",
      	default: 15,
      	section: "Series",
      	order: 0
    },
    dot_radius: {
    	type: "number",
      	label: "Point Radius",
      	default: 30,
      	display: "range",
      	section: "Series",
      	order: 1
    },
    opacity_circles: {
      	type: "number",
      	label: "Background Darkness",
      	display: "range",
      	default: 15,
      	section: "Plot - Advanced",
      	order: 2
    },
    backgroundColor: {
        type: `string`,
        label: `Background Color`,
        display: `color`,
        section: "Plot - Advanced",
        default: "#CDCDCD",
        order: 1
    },
    axisColor: {
        type: `string`,
        label: `Axis Color`,
        display: `color`,
        section: "Plot - Advanced",
        default: "#CDCDCD",
        order: 0
    },
    stroke_width: {
    	type: "number",
      	label: "Stroke Width",
      	default: 15,
      	display: "range",
      	section: "Series",
      	order: 2
    },
    glow: {
      	type: "number",
      	label: "Glow Range",
      	default: 2,
      	display: "range",
      	section: "Plot - Advanced"
    },
    axis_label_font: {
      	type: "number",
      	label: "Axis Label Font Size (px)",
      	default: 12,
      	section: "Plot - Advanced"
    },
    axis_scale_font: {
      	type: "number",
      	label: "Scale Font Size (px)",
      	default: 12,
      	section: "Plot - Advanced"
    },
    legend_font: {
      	type: "number",
      	label: "Legend Font Size (px)",
      	default: 12,
      	section: "Plot - Advanced"
    },
    legend_padding: {
      	type: "number",
      	label: "Legend Item Padding",
      	default: 20,
      	display: "range",
      	section: "Plot - Advanced"
    },
    legend_side: {
      	type: "string",
      	label: "Legend",
      	display: "select",
      	values: [
      	 	{"none": "none"},
      	 	{"left": "left"},
      	 	{"right": "right"},
         	{"center": "center"}
      	],
      	default: "left",
      	section: "Plot"
    },
}


let baseConfig = {}


const visObject = {
 /**
  * Configuration options for your visualization. In Looker, these show up in the vis editor
  * panel but here, you can just manually set your default values in the code.
  **/
 /**
  * The create function gets called when the visualization is mounted but before any
  * data is passed to it.
  **/
	create: function(element, config){
		element.innerHTML = "<div/>";
	},

 /**
  * UpdateAsync is the function that gets called (potentially) multiple times. It receives
  * the data and should update the visualization with the new data.
  **/
	updateAsync: function(data, element, config, queryResponse, details, doneRendering){
    // set the dimensions and margins of the graph
    const addLight = function(color, amount){
	  	let cc = parseInt(color,16) + amount;
	  	let c = (cc > 255) ? 255 : (cc);
	  	c = (c.toString(16).length > 1 ) ? c.toString(16) : `0${c.toString(16)}`;
	  	return c;
	}
	const lighten = (color, amount)=> {
	  	color = (color.indexOf("#")>=0) ? color.substring(1,color.length) : color;
	  	amount = parseInt((255*amount)/100);
	  	return color = `#${addLight(color.substring(0,2), amount)}${addLight(color.substring(2,4), amount)}${addLight(color.substring(4,6), amount)}`;
	}

    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = element.clientWidth,
        height = element.clientHeight;

    //console.log(data);

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    element.innerHTML = ""
    var svg = d3.select("#vis").append("svg")
        .attr("width", width)
        .attr("height", height)
      	.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var series_default = ["#4A80BC", "#615894", "#F0C733", "#D13452", "#E48522", "#B977A9", "#7bc739", "#92b3d7", "#e38597"];

    if (queryResponse['pivots']) {
	    // grab the series labels
	    series = [];
	    //console.log(queryResponse['fields']['measure_like'].length % 2);
	    if (!(queryResponse['fields']['measure_like'].length % 2) && config.negatives) {
	    	console.log("troof");
	      this.addError({
	        title: "Can't display negatives with symmetric axes.",
	        message: "Negatives can only be plotted on odd number of axes."
	      });
	      return;
	    }
	    if (queryResponse['fields']['measure_like'].length < 3) {
	      this.addError({
	        title: "Multiple measures only.",
	        message: "This chart requires at least 3 measures."
	      });
	      return;
	    }
	    if (queryResponse['fields']['dimensions'].length > 0) {
	      this.addError({
	        title: "Single dimension only.",
	        message: "This chart accepts only 1, pivoted or unpivoted dimension."
	      });
	      return;
	    }
	    queryResponse['pivots'].forEach(function(d) {
	      series.push(d['key']);
	    });
	    originalData = data;
	    // format the data
	    // get measure-like field names and label
	    axes = [];
	    queryResponse['fields']['measure_like'].forEach(function(d) {
	      axes.push({
	        name: d['name'],
	        label: d['label_short']
	      });
	    });
	    
	    formattedData = [];
	    moreData = [];
	    series.forEach(function(s, index) {
	      values = [];
	      axes.forEach(function(a) {
	        values.push({
	          axis: a['label'],
	          name: a['name'],
	          value: data[0][a['name']][s]['value'],
	          rendered: data[0][a['name']][s]['rendered'] ? data[0][a['name']][s]['rendered'] : data[0][a['name']][s]['value'],
	          links: data[0][a['name']][s]['links']
	        });
	      });
	      set = [];
	      values.forEach(function(v) {
	        set.push(v);
	      });
	      moreData.push({
	        label: s,
	        data: set,
	        color: index < 9 ? series_default[index] : lighten("#D13452", index*1.7)
	      });
	      formattedData.push(set);
	    });
	} else {
		series = [];
		if (!(queryResponse['fields']['measure_like'].length % 2) && config.negatives) {
	    	console.log("troof");
	      this.addError({
	        title: "Can't display negatives with symmetric axes.",
	        message: "Negatives can only be plotted on odd number of axes."
	      });
	      return;
	    }
	    if (queryResponse['fields']['measure_like'].length < 3) {
	      this.addError({
	        title: "Multiple measures only.",
	        message: "This chart requires at least 3 measures."
	      });
	      return;
	    }
	    if (queryResponse['fields']['dimension_like'].length > 1) {
	      this.addError({
	        title: "Single dimension only.",
	        message: "This chart accepts only 1, pivoted or unpivoted dimension."
	      });
	      return;
	    }
		originalData = data;
		console.log(queryResponse['fields']['measure_like']);
		qrn = queryResponse["fields"]["dimensions"][0].name;
		axes = [];
	    queryResponse['fields']['measure_like'].forEach(function(d) {
	      axes.push({
	        name: d['name'],
	        label: d['label_short'] ? d['label_short'] : d['label']
	      });
	    });
	    formattedData = [];
	    moreData = [];
		data.forEach(function(d, index) {
			values = []
			axes.forEach(function(a) {
				values.push({
		          axis: a['label'],
		          name: a['name'],
		          value: d[a['name']]['value'],
		          rendered: d[a['name']]['rendered'] ? d[a['name']]['rendered'] : d[a['name']]['value'],
		          links: d[a['name']]['links']
		        });
			});
			set = [];
	        values.forEach(function(v) {
	          set.push(v);
	        });
	        moreData.push({
	          label: String(d[qrn]['value']),
	          data: set,
	          color: index < 9 ? series_default[index] : lighten("#D13452", index*1.7)
	        });
	        formattedData.push(set);
		});
		series = moreData.map(s => s.label);
	}
	console.log(formattedData);
	//console.log(moreData);
	//color: index < 9 ? series_default[index] : lighten("#D13452", index*1.7),
    opt = Object.assign({}, baseOptions)

    moreData.forEach(function(s, index) {
	    opt[`${s.label}_color`] = {
	        type: `string`,
	        label: `${s.label} - Color`,
	        display: `color`,
	        section: "Series",
	        default: `${s.color}`
	        //default: baseConfig[`${s.label}_color`] ? baseConfig[`${s.label}_color`] : [series_default[index]],
	    };
  	});
  	this.trigger('registerOptions', opt);

  	//var color = d3.scale.ordinal().range(moreData.map((d,index) => config[`${d.label}_color`] ? config[`${d.label}_color`] : [series_default[index]]));
	var color = d3.scale.ordinal().range(Object.keys(config).filter(function(key){ return key.indexOf('_color') !== -1 }).map(function(d){ return config[d]}));

	var radarChartOptions1 = {
	  	w: width,
	  	h: height,
	  	margin: margin,
	  	maxValue: 0.5,
	  	levels: config.levels,
	  	roundStrokes: config.rounded_strokes,
	  	color: color,
	  	axisFont: config.axis_label_font,
	  	scaleFont: config.axis_scale_font,
      	labelFactor: config.label_factor*1.5/100,
      	labelFine: config.label_fine*1.2,
      	wrapWidth: config.wrap_width,
      	opacityArea: config.opacity_area/100,
      	dotRadius: config.dot_radius/5,
      	opacityCircles: config.opacity_circles/200,
      	backgroundColor: config.backgroundColor,
      	axisColor: config.axis_color,
      	strokeWidth: config.stroke_width/5,
      	legendSide: config.legend_side,
      	glow: config.glow/20,
      	negatives: config.negatives,
      	axisColor: config.axisColor,
      	negativeR: config.negative_r,
      	independent: config.independent,
      	legendPad: config.legend_padding,
      	legendFont: config.legend_font,
      	domainMax: config.domain_max
	};
    //this.trigger('registerOptions', visOptions);

	//Call function to draw the Radar chart
    svg.append("g").call(RadarChart("#vis", formattedData, radarChartOptions1, moreData, [], originalData, axes));
	done()
	}
};

looker.plugins.visualizations.add(visObject);
