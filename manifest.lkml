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
  url: "Users/noahmacdonald/dev/viz-spider-marketplace/spider.js"
  label: "@{VIS_LABEL}"
}
