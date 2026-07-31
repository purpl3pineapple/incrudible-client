const sharedOptionCriteria = [["show-options", true]];
const approvalCriteria = [
  ["first-approval", true],
  ["second-approval", true],
];
const detailWizard = {
  type: "text",
  id: "detail-notes",
  name: "detailNotes",
  label: "Detail notes",
};
const modeWizard = {
  type: "text",
  id: "mode-notes",
  name: "modeNotes",
  label: "Mode notes",
};

const criteriaWorkflow = {
  schema: [
    {
      type: "checkbox",
      id: "show-options",
      name: "showOptions",
      label: "Show options",
    },
    ...["first", "second", "third"].map((value) => ({
      type: "radio",
      id: `${value}-option`,
      name: "option",
      label: `${value} option`,
      value,
      criteria: sharedOptionCriteria,
    })),
    {
      type: "checkbox",
      id: "first-approval",
      name: "firstApproval",
      label: "First approval",
    },
    {
      type: "checkbox",
      id: "second-approval",
      name: "secondApproval",
      label: "Second approval",
    },
    {
      type: "textarea",
      id: "approval-notes",
      name: "approvalNotes",
      label: "Approval notes",
      criteria: approvalCriteria,
    },
    {
      type: "checkbox",
      id: "show-first",
      name: "showFirst",
      label: "Show first detail",
    },
    {
      type: "checkbox",
      id: "show-second",
      name: "showSecond",
      label: "Show second detail",
    },
    {
      type: "text",
      id: "first-detail",
      name: "detail",
      label: "First detail",
      criteria: [["show-first", true]],
    },
    {
      type: "text",
      id: "second-detail",
      name: "detail",
      label: "Second detail",
      criteria: [["show-second", true]],
    },
    {
      type: "checkbox",
      id: "show-tags",
      name: "showTags",
      label: "Show tags",
    },
    {
      type: "list",
      id: "conditional-tags",
      name: "tags",
      label: "Tags",
      criteria: [["show-tags", true]],
    },
    {
      type: "checkbox",
      id: "show-details",
      name: "showDetails",
      label: "Show details",
    },
    {
      type: "checkbox",
      id: "include-details",
      name: "includeDetails",
      label: "Include details",
      criteria: [["show-details", true]],
      wizards: [{ test: true, wizard: detailWizard }],
    },
    {
      type: "checkbox",
      id: "show-mode",
      name: "showMode",
      label: "Show mode",
    },
    {
      type: "select",
      id: "conditional-mode",
      name: "conditionalMode",
      label: "Conditional mode",
      criteria: [["show-mode", true]],
      options: [
        { label: "Choose", value: "" },
        { label: "Detailed", value: "detailed" },
      ],
      wizards: [{ test: "Detailed", wizard: modeWizard }],
    },
  ],
  rules: {
    criteriaRules: {
      option: sharedOptionCriteria,
      "approval-notes": approvalCriteria,
      "first-detail": [["show-first", true]],
      "second-detail": [["show-second", true]],
      "conditional-tags": [["show-tags", true]],
      "include-details": [["show-details", true]],
      "conditional-mode": [["show-mode", true]],
    },
    wizardRules: {
      "include-details": [{ test: true, wizard: detailWizard }],
      "conditional-mode": [{ test: "Detailed", wizard: modeWizard }],
    },
  },
};

export { criteriaWorkflow };