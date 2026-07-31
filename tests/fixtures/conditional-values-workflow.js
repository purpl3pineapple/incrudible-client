// Option values carrying every reference form the resolver supports: a
// bare `!{#id}` interpolation, and conditional tokens in both quoting
// dialects. `gate` drives the conditionals, `source` is what they
// interpolate once they pass.
const conditionalValuesWorkflow = {
  schema: [
    { type: "checkbox", id: "gate", name: "gate", label: "Gate" },
    { type: "text", id: "source", name: "source", label: "Source" },
    {
      type: "select",
      id: "conditional-select",
      name: "conditionalSelect",
      label: "Conditional Select",
      options: [
        { label: "Choose", value: "" },
        { label: "Direct", value: "Direct !{#source}" },
        {
          label: "Conditional",
          value: '!{[["gate",true],"From !{#source}"]}',
        },
        {
          label: "Single quoted conditional",
          value: "!{[['gate',true],'From !{#source}']}",
        },
      ],
    },
  ],
};

export { conditionalValuesWorkflow };
