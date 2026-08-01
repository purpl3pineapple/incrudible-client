// The feedback form is built by APP.init({ feedback }) rather than by a
// consumer calling renderEntries, so this fixture pairs a full schema with
// every rule family the feedback branch of the rule sync supports. Every
// rule is declared on the entry that owns it and the maps are derived,
// exactly as the server hands them over.
import { buildRuleMaps } from "../helpers/rules.js";
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
      modals: blockingModals,
    },
    {
      type: "text",
      id: "feedback-severity",
      name: "feedbackSeverity",
      label: "Severity",
      criteria: [["feedback-blocking", true]],
      autofills: [{ value: "critical", when: [["feedback-blocking", true]] }],
    },
    {
      type: "textarea",
      id: "feedback-detail",
      name: "feedbackDetail",
      label: "Detail",
      requisitions: [["feedback-blocking", true]],
    },
  ],
};

// APP.init receives the rule maps the server builds from the schema, so
// the fixture builds its own the same way rather than restating them.
feedbackWorkflow.rules = buildRuleMaps(feedbackWorkflow.schema);

export { feedbackWorkflow };
