// Checkbox wizards nested two deep, with the outer controller itself
// criteria-gated. Each checkbox controller renders as its container's
// preceding sibling, so this is the shape that exercises collapsing a
// container without collapsing the control that drives it.
const detailNotesWizards = [
  {
    test: true,
    wizard: {
      type: "text",
      id: "details",
      name: "details",
      label: "Details",
    },
  },
];

const includeDetailsWizards = [
  {
    test: true,
    wizard: {
      type: "checkbox",
      id: "include-detail-notes",
      name: "includeDetailNotes",
      label: "Include detail notes",
      wizards: detailNotesWizards,
    },
  },
];

const includeDetailsCriteria = [["allowDetails", true]];

const nestedCheckboxWorkflow = {
  schema: [
    {
      type: "checkbox",
      id: "allow-details",
      name: "allowDetails",
      label: "Allow details",
      checked: true,
    },
    {
      type: "checkbox",
      id: "include-details",
      name: "includeDetails",
      label: "Include details",
      width: 2,
      criteria: includeDetailsCriteria,
      wizards: includeDetailsWizards,
    },
  ],
};

export { nestedCheckboxWorkflow };
