// One select driving a requisition and four autofills, with a target of
// each shape the autofill sync distinguishes: a plain text field it can
// write, a single select it can write, and a textarea and checkbox it
// must leave alone. `source` is interpolated into the written value.
//
// The autofilled-note entry holds two rules so only the first passing one
// is applied.
//
// Rules live on the entries that own them, the way a workflow config is
// authored; the lookup tables the client reads are derived from these.
const autofillWorkflow = {
  schema: [
    {
      type: "select",
      id: "mode",
      name: "mode",
      label: "Mode",
      options: [
        { label: "Choose", value: "" },
        { label: "Auto", value: "auto" },
        { label: "Required", value: "required" },
      ],
    },
    { type: "text", id: "source", name: "source", label: "Source" },
    {
      type: "text",
      id: "conditional-note",
      name: "conditionalNote",
      label: "Conditional Note",
      constraints: { required: true },
      requisitions: [["mode", "Required"]],
    },
    {
      type: "text",
      id: "autofilled-note",
      name: "autofilledNote",
      label: "Autofilled Note",
      autofills: [
        { value: "First !{#source}", when: [["mode", "Auto"]] },
        { value: "Ignored", when: [["mode", "Auto"]] },
      ],
    },
    {
      type: "select",
      id: "autofilled-select",
      name: "autofilledSelect",
      label: "Autofilled Select",
      options: [
        { label: "Choose", value: "" },
        { label: "Auto", value: "auto" },
      ],
      autofills: [{ value: "auto", when: [["mode", "Auto"]] }],
    },
    {
      type: "textarea",
      id: "autofilled-textarea",
      name: "autofilledTextarea",
      label: "Autofilled Textarea",
      autofills: [{ value: "Ignored", when: [["mode", "Auto"]] }],
    },
    {
      type: "checkbox",
      id: "autofilled-checkbox",
      name: "autofilledCheckbox",
      label: "Autofilled Checkbox",
      autofills: [{ value: "true", when: [["mode", "Auto"]] }],
    },
  ],
};

export { autofillWorkflow };
