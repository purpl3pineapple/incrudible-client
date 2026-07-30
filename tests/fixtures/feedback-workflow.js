// The feedback form is built by APP.init({ feedback }) rather than by a
// consumer calling renderEntries, so this fixture pairs a full schema with
// every rule family the feedback branch of the rule sync supports. Rule
// arrays are shared with the schema entries that render them, matching how
// a consumer authors the two halves together.
const kindWizards = [
  {
    test: "Bug",
    wizard: {
      type: "text",
      id: "feedback-repro",
      name: "feedbackRepro",
      label: "Reproduction steps",
    },
  },
];

const blockingAlerts = [
  {
    test: true,
    alert: {
      variant: "warning",
      message: "Blocking reports page the on-call engineer.",
    },
  },
];

const blockingModals = [
  {
    test: true,
    modal: {
      type: "message",
      header: "Thanks for flagging",
      message: "We triage blocking reports first.",
      variant: "tip",
    },
  },
];

const feedbackWorkflow = {
  schema: [
    {
      type: "select",
      id: "feedback-kind",
      name: "feedbackKind",
      label: "Kind",
      constraints: { required: true },
      options: [
        { label: "Choose", value: "" },
        { label: "Bug", value: "bug" },
        { label: "Idea", value: "idea" },
      ],
      wizards: kindWizards,
    },
    {
      type: "checkbox",
      id: "feedback-blocking",
      name: "feedbackBlocking",
      label: "Blocking my work",
      alerts: blockingAlerts,
    },
    {
      type: "text",
      id: "feedback-severity",
      name: "feedbackSeverity",
      label: "Severity",
    },
    {
      type: "textarea",
      id: "feedback-detail",
      name: "feedbackDetail",
      label: "Detail",
    },
  ],
  rules: {
    wizards: { "feedback-kind": kindWizards },
    criteria: { "feedback-severity": [["feedback-blocking", true]] },
    requisitions: { "feedback-detail": [["feedback-blocking", true]] },
    autofills: {
      "feedback-severity": [
        { value: "critical", when: [["feedback-blocking", true]] },
      ],
    },
    alerts: { "feedback-blocking": blockingAlerts },
    modals: { "feedback-blocking": blockingModals },
  },
};

module.exports = { feedbackWorkflow };
