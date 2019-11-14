project_name: "viz-packed_bubble-marketplace"

constant: VIS_LABEL {
  value: "Spider"
  export: override_optional
}

constant: VIS_ID {
  value: "spider-marketplace"
  export:  override_optional
}

visualization: {
  id: "@{VIS_ID}"
  url: "spider.js"
  label: "@{VIS_LABEL}"
  dependencies: ["https://code.jquery.com/jquery-2.2.4.min.js","https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js","https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js","https://cdnjs.cloudflare.com/ajax/libs/d3-legend/1.13.0/d3-legend.min.js"]
}
