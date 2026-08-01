// A workflow exercising every rule family at once: a select driving a
// wizard and carrying a footnote, a checkbox driving an alert, a modal and
// a second wizard, and a criteria-gated field. Every rule is declared on
// the entry that owns it, the way a workflow config is authored; the
// lookup tables the client reads are derived from these.
const outcomeWizards = [
  {
    test: "Customer unavailable",
    wizard: {
      type: "text",
      id: "outcome-reason",
      name: "outcomeReason",
      label: "Outcome Reason",
    },
  },
];

const urgentAlerts = [
  {
    test: true,
    alert: { variant: "warning", message: "Escalate immediately." },
  },
];

const urgentModals = [
  {
    test: true,
    modal: {
      type: "confirm",
      header: "Confirm escalation",
      message: "Continue with urgent handling?",
      variant: "warning",
    },
  },
];

const urgentWizards = [
  {
    test: true,
    wizard: {
      type: "text",
      id: "reason",
      name: "reason",
      label: "Escalation Reason",
      constraints: { required: true },
    },
  },
];

const contactCriteria = [["urgent", true]];

const outcomeFootnotes = [
  {
    test: "Customer unavailable",
    footnote: "reviewed !{#review-date}",
  },
];

const reviewWorkflow = {
  schema: [
    {
      type: "select",
      id: "outcome",
      name: "outcome",
      label: "Outcome",
      constraints: { required: true },
      options: [
        { label: "Choose", value: "" },
        {
          label: "Customer unavailable",
          value: "Customer unavailable on !{#review-date}",
        },
      ],
      wizards: outcomeWizards,
      footnotes: outcomeFootnotes,
    },
    {
      // Nameless on purpose: it is interpolated into the outcome's value
      // and its footnote, but must not appear in the preview itself.
      type: "date",
      id: "review-date",
      label: "Review Date",
      constraints: { required: true },
    },
    {
      type: "checkbox",
      id: "urgent",
      name: "urgent",
      label: "Urgent",
      alerts: urgentAlerts,
      modals: urgentModals,
      wizards: urgentWizards,
    },
    {
      type: "text",
      id: "contact",
      name: "contact",
      label: "Escalation Contact",
      criteria: contactCriteria,
    },
  ],
};

export { reviewWorkflow };
