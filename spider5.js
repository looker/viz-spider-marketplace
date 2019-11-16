/**
 * Welcome to the Looker Visualization Builder! Please refer to the following resources 
 * to help you write your visualization:
 *  - API Documentation - https://github.com/looker/custom_visualizations_v2/blob/master/docs/api_reference.md
 *  - Example Visualizations - https://github.com/looker/custom_visualizations_v2/tree/master/src/examples
 **/

function RadarChart(id, data, options, moreData, colorSeries, originalData, axes) {
	var cfg = {
	 w: 600,				//Width of the circle
	 h: 600,				//Height of the circle
	 margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
	 levels: 3,				//How many levels or inner circles should there be drawn
	 maxValue: 0, 			//What is the value that the biggest circle will represent
	 labelFactor: 1.325, 	//How much farther than the radius of the outer circle should the labels be placed
	 wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
	 opacityArea: 0.15, 	//The opacity of the area of the blob
	 dotRadius: 5, 			//The size of the colored circles of each blog
	 opacityCircles: 0.15, 	//The opacity of the circles of each blob
	 strokeWidth: 2, 		//The width of the stroke around each blob
	 roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
	 color: d3.scale.category10(),	//Color function
   legendSide: 'left',
   glow: 2,
   negatives: true,
   axisColor: "#CDCDCD",
   negativeR: .81,
   independent: true
	};
	
	//Put all of the options into a variable called cfg
	if('undefined' !== typeof options){
	  for(var i in options){
		if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
	  }//for i
	}//if
	
	//If the supplied maxValue is smaller than the actual one, replace by the max in the data
	var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
		
	var allAxis = (data[0].map(function(i, j){return i.axis})),	//Names of each axis
		total = allAxis.length,					//The number of different axes
		radius = Math.min(cfg.w*.5, cfg.h*.5), 	//Radius of the outermost circle
		Format = d3.format(",.0f"),			 	//Label formatting
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
	
  //console.log(data);
	//Scale for the radius
  if (cfg.independent) {
    axesMax = []
    data.forEach(function(d) {
      d.forEach(function(i) {
        if (!(i.axes in axesMax)) {
          axesMax[i.axes] = i.value;
        } else if (i.value > axesMax[i.axes]) {
          axesMax[i.axes] = i.value;
        }
      });
    });
    console.log(axesMax);
  } else {
    var rScale = d3.scale.linear()
			.range([0, radius])
			.domain([0, maxValue]);
  }
		
	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////

	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();
	
	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
			.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
			.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
			.attr("class", "radar"+id);
	//Append a g element		
	var g = svg.append("g")
			.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");
	
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
	
	

	//Text indicating at what % each level is
	axisGrid.selectAll(".axisLabel")
	   .data(d3.range(1,(cfg.levels+1)).reverse())
	   .enter().append("text")
	   .attr("class", "axisLabel")
	   .attr("x", 4)
	   .attr("y", function(d){return -d*radius/cfg.levels;})
	   .attr("dy", "0.4em")
     .style("font-size", "10px")
     .style("font-weight", "900")
     .style("font-family", "Open Sans")
  	 .style("z-index", 10)
	   .attr("fill", "#737373")
	   .text(function(d,i) { return Format(maxValue * d/cfg.levels); });

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////
	
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
          return rScale(maxValue*-1) * Math.cos(angleSlice*i - Math.PI/2);
        } else {
          return 0;
        }
      } else {
        if (cfg.negatives) {
          return rScale(maxValue*-cfg.negativeR) * Math.cos(angleSlice*i - Math.PI/2);
        } else {
          return 0;
        }
      }
  	})
  	.attr("y1", function(d, i){ 
    	if (cfg.roundStrokes) {
        if (cfg.negatives) {
          return rScale(maxValue*-1) * Math.sin(angleSlice*i - Math.PI/2);
        } else {
          return 0;
        }
      } else {
        if (cfg.negatives) {
          return rScale(maxValue*-cfg.negativeR) * Math.sin(angleSlice*i - Math.PI/2);
        } else {
          return 0;
        }
      }
  	})
		.attr("x2", function(d, i){ return rScale(maxValue*1.0) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i){ return rScale(maxValue*1.0) * Math.sin(angleSlice*i - Math.PI/2); })
		.attr("class", "line")
		.style("stroke", function(d, i){ return cfg.axisColor })
		.style("stroke-width", "2px");

	//Append the labels at each axis
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", ".8em")
    .style("font-weight", "549")
  	.style("font-family", "Open Sans")
		.attr("text-anchor", "middle")
		.attr("dy", ".35em")
		.attr("x", function(d, i){ return rScale(maxValue*cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y", function(d, i){ return rScale(maxValue*cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2) - 25; })
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
		  .style("fill", function(d, i){ return cfg.axisColor })
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
        .style("fill", function(d, i){ return cfg.axisColor })
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
		.radius(function(d) { return rScale(cfg.negatives ? (d.value < 0 ? d.value*.8 : d.value) : (d.value < 0 ? 0 : d.value)); })
		.angle(function(d,i) {	return i*angleSlice; });
		
	if(cfg.roundStrokes) {
		radarLine.interpolate("cardinal-closed");
	}
				
	//Create a wrapper for the blobs	
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper")
    .attr("id", function(d,i) { return "v"+moreData[i].label; });
	
  //console.log(moreData);
	//Append the backgrounds	
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
    .attr("id", function(d,i) { "v"+return moreData[i].label; })
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
    	return rScale(cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.cos(angleSlice*i - Math.PI/2); 
  	})
		.attr("cy", function(d,i){ 
    	return rScale(cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.sin(angleSlice*i - Math.PI/2); 
  	})
		.style("fill", function(d,i,j) { return cfg.color(j); })
		.style("fill-opacity", 0.8);

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////
	
	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper")
    .attr("child_id", function(d,i) { return "v"+moreData[i].label; });
		
	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
    .attr("series_id", function(d,i){ return this.parentNode.getAttribute("child_id"); })
		.attr("r", cfg.dotRadius*3)
		.attr("cx", function(d,i){ 
    	return rScale(cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.cos(angleSlice*i - Math.PI/2); 
  	})
		.attr("cy", function(d,i){ 
    	return rScale(cfg.negatives ? (d.value < 0 ? d.value*cfg.negativeR : d.value) : (d.value < 0 ? 0 : d.value)) * Math.sin(angleSlice*i - Math.PI/2); 
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
    	//console.log(".radarArea#v"+this.parentNode.getAttribute("child_id"));
			d3.select(".radarArea#v"+this.parentNode.getAttribute("child_id"))
				.transition().duration(200)
				.style("fill-opacity", 0.7);
					
			tooltip
				.attr('x', newX)
				.attr('y', newY)
    		.text(Format(d.value))
				.transition().duration(200)
        .style("font-family", "Open Sans")
    		.style("pointer-events", "none")
				.style('opacity', 1);
		})
		.on("mouseout", function(){
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
  style.innerHTML = 'g.radarWrapper.hidden { opacity: 0.0; } .legendCells .hidden { opacity: 0.2; }';
  
  var ordinal = d3.scale.ordinal()
    .domain(moreData.map(d => d.label))
    .range(colorSeries);

  var svg = d3.select("svg");
	if (cfg.legendSide === 'left') {
    legx = cfg.w/4;
    legy = 20;
    leg_orient = 'vertical';
    leg_pad = 10;
  } else if (cfg.legendSide === 'right') {
    legx = cfg.w*1.2;
    legy = 20;
    leg_orient = 'vertical';
    leg_pad = 10;
  } else if (cfg.legendSide === 'center') {
    legx = window.innerWidth*.5;
    legy = cfg.h*1.3;
    leg_orient = 'horizontal';
    leg_pad = 20;
  }
  svg.append("g")
    .attr("class", "legendOrdinal")
    .attr("transform", function(d) { return `translate(${legx - data.length*leg_pad/1.7},${legy})`}) //`translate(${legx - data.length*leg_pad/2},${legy})`
    .style("font-family", "Open Sans");

  var legendOrdinal = d3.legend.color()
    .shape("path", d3.svg.symbol().type("circle").size(120)())
    .shapePadding(leg_pad)
    .scale(ordinal)
  	.orient(leg_orient)
  	.on('cellclick', function(d) {
        //console.log(d);
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

const visObject = {
 /**
  * Configuration options for your visualization. In Looker, these show up in the vis editor
  * panel but here, you can just manually set your default values in the code.
  **/
  options: {
    levels: {
    	type: "number",
      label: "Levels",
      default: 4,
      section: "Plot"
    },
    label_factor: {
    	type: "number",
      label: "Axis Label Padding",
      default: 1.35,
      section: "Plot - Advanced"
    },
    levels: {
    	type: "number",
      label: "Levels",
      default: 4,
      section: "Plot",
      display_size: 'third',
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
    independent: {
      type: "string",
      label: "Independent Axes?",
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
      label: "Label Wrapping",
      default: 30,
      section: "Plot - Advanced"
    },
    opacity_area: {
    	type: "number",
      label: "Area Opacity",
      default: .15,
      section: "Plot - Advanced"
    },
    dot_radius: {
    	type: "number",
      label: "Point Radius",
      default: 4,
      section: "Plot - Advanced"
    },
    opacity_circles: {
    	type: "number",
      label: "Background Opacity",
      default: .1,
      section: "Plot - Advanced"
    },
    stroke_width: {
    	type: "number",
      label: "Stroke Width",
      default: 5,
      section: "Plot - Advanced"
    },
    glow: {
    	type: "number",
      label: "Glow Range",
      default: 2,
      section: "Plot - Advanced"
    },
    negative_r: {
    	type: "number",
      label: "Negative Axis Scalar",
      default: 1,
      section: "Plot - Advanced"
    },
    legend_side: {
      type: "string",
      label: "Legend",
      display: "select",
      values: [
      	 {"left": "left"},
      	 {"right": "right"},
         {"center": "center"}
      ],
      default: "left",
      display_size: 'third',
      section: "Plot"
    },
  },
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
    marginY = element.clientHeight*.15;
    marginX = element.clientWidth*.15;
    //console.log(marginY);
    var margin = {top: marginY, right: marginX, bottom: marginY, left: marginX},
        width = element.clientWidth - margin.left - margin.right,
        height = element.clientHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    element.innerHTML = ""
    var svg = d3.select("#vis").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");
    
    // grab the series labels
    series = []
    queryResponse['pivots'].forEach(function(d) {
      series.push(d['key']);
    });
    //console.log(series);
    originalData = data;
    // format the data
    //console.log(data);
    
    // get measure-like field names and label
    axes = [];
    queryResponse['fields']['measure_like'].forEach(function(d) {
      axes.push({
        name: d['name'],
        label: d['label_short']
      });
    });
    //console.log(axes);
    
    formattedData = [];
    moreData = [];
    series.forEach(function(s) {
      //console.log(s);
      values = [];
      axes.forEach(function(a) {
        //console.log(data[0][a['name']][s]['value']);
        //console.log(a['label']);
        values.push({
          axis: a['label'],
          name: a['name'],
          value: data[0][a['name']][s]['value']
        });
      });
      //console.log(values);
      set = [];
      values.forEach(function(v) {
        set.push(v);
      });
      moreData.push({
        label: s,
        data: set
      });
      formattedData.push(set);
    });

    var series_colors1 = ["#4285F4","#DB4437","#F4B400", "#0F9D58","#B977A9","#c76273"].slice(0, moreData.length);
    var series_colors2 = ["#462C9D","#A2829E","#D0AD9F", "#FED8A0","#B977A9","#c76273"].slice(0, moreData.length);
    var color = d3.scale.ordinal()
				.range(series_colors1);
	this.trigger('registerOptions', visObject.options)

	var radarChartOptions1 = {
	  w: width,
	  h: height,
	  margin: margin,
	  maxValue: 0.5,
	  levels: config.levels,
	  roundStrokes: config.rounded_strokes,
	  color: color,
    labelFactor: config.label_factor,
    wrapWidth: config.wrap_width,
    opacityArea: config.opacity_area,
    dotRadius: config.dot_radius,
    opacityCircles: config.opacity_circles,
    strokeWidth: config.stroke_width,
    legendSide: config.legend_side,
    glow: config.glow,
    negatives: config.negatives,
    axisColor: config.axis_color,
    negativeR: config.negative_r,
    independent: config.independent
	};
    
	var radarChartOptions2 = {
		w: width,
		h: height,
		margin: margin,
		maxValue: 105,
		levels: 3,
		roundStrokes: true,
		color: color,
    labelFactor: 1.25,
    wrapWidth: 30,
    opacityArea: .1,
    dotRadius: 5,
    opacityCircles: 0.0,
    strokeWidth: 5,
    legendSide: 'center',
    glow: 1,
    negatives: false,
    axisColor: "#CFCFCF",
    negativeR: .81,
    independent: true
	};
    
    console.log(formattedData);
		//Call function to draw the Radar chart
    svg.append("g")
    	.call(RadarChart("#vis", formattedData, radarChartOptions2, moreData, series_colors1, originalData, axes));

		doneRendering()
	}
};

looker.plugins.visualizations.add(visObject);
