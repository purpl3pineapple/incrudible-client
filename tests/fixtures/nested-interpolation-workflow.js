// A three-deep interpolation chain, each level revealed by the one above
// it. Only the outermost control is named, so the chain resolves through
// controls that never appear in the preview themselves — which is the
// point: a nameless wizard source contributes its value by reference
// without contributing a row.
const nestedSource = {
  type: "date",
  id: "nested-interpolated",
  label: "Nested interpolated",
};

const sourceWizards = [{ test: "nested-label", wizard: nestedSource }];

const source = {
  type: "select",
  id: "interpolated",
  label: "Interpolated",
  options: [
    { label: "Choose", value: "" },
    {
      label: "nested-label",
      value: "its wizard interpolates !{#nested-interpolated}",
    },
  ],
  wizards: sourceWizards,
};

const destinationWizards = [{ test: "the-label", wizard: source }];

const destination = {
  type: "select",
  id: "interpolator",
  name: "entry1",
  label: "Entry1",
  options: [
    { label: "Choose", value: "" },
    { label: "the-label", value: "Text that interpolates !{#interpolated}" },
  ],
  wizards: destinationWizards,
};

const invokerWizards = [{ test: true, wizard: destination }];

const invoker = {
  type: "checkbox",
  id: "invoke-interpolator",
  label: "Invoke interpolator",
  wizards: invokerWizards,
};

const nestedInterpolationWorkflow = {
  schema: [invoker],
  rules: {
    wizardRules: {
      "invoke-interpolator": invokerWizards,
      interpolator: destinationWizards,
      interpolated: sourceWizards,
    },
  },
};

export { nestedInterpolationWorkflow };
