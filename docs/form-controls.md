# Form Control Reference

Every control type, each shown as a complete, standalone config example,
with every rule kind (`modals`, `alerts`, `footnotes`, `wizards`, `mount`,
`siblings`) and `dependencies` demonstrated so you can see the full range
of what each control supports, not just a single happy-path config.

<details>
<summary><strong>Checkbox</strong></summary>

```json
{
	"type": "checkbox",
	"id": "isUrgent",
	"name": "isUrgent",
	"label": "Mark as Urgent",
	"hint": "Escalates the case to priority handling",
	"disabled": false,
	"value": "on",
	"checked": false,
	"defaultChecked": false,
	"freeform": false,
	"readonly": false,
	"width": 2,
	"constraints": {
		"required": false
	},
	"modals": [
		{
			"test": true,
			"modal": {
				"type": "confirm",
				"header": "Confirm Urgent",
				"message": "Urgent cases page the on-call manager. Continue?",
				"variant": "important",
				"confirmText": "Yes, escalate",
				"cancelText": "Cancel"
			},
			"dependencies": [["priority", "high"]]
		},
		{
			"test": false,
			"modal": {
				"type": "message",
				"header": "Standard Handling",
				"message": "Non-urgent cases are handled within 3 business days.",
				"variant": "note"
			}
		}
	],
	"alerts": [
		{
			"test": true,
			"alert": {
				"variant": "warning",
				"message": "Urgent cases must be escalated within 1 hour."
			},
			"dependencies": [["priority", "high"]]
		},
		{
			"test": false,
			"alert": {
				"variant": "tip",
				"message": "Mark urgent only if the customer is blocked."
			}
		}
	],
	"footnotes": [
		{
			"test": true,
			"footnote": "urgent",
			"dependencies": [["priority", "high"]]
		},
		{
			"test": false,
			"footnote": "standard"
		}
	],
	"wizards": [
		{
			"test": true,
			"wizard": {
				"type": "text",
				"id": "escalationReason",
				"name": "escalationReason",
				"label": "Escalation Reason",
				"constraints": {
					"required": true
				}
			}
		}
	],
	"mount": [
		{
			"test": true,
			"wizard": {
				"type": "text",
				"id": "escalationContact",
				"name": "escalationContact",
				"label": "Escalation Contact"
			}
		}
	],
	"siblings": [
		{
			"test": true,
			"wizard": {
				"type": "text",
				"id": "escalationTicket",
				"name": "escalationTicket",
				"label": "Escalation Ticket #"
			}
		}
	]
}
```

`mount`/`siblings` follow the same `test`/`dependencies` convention as
`wizards` (same bare-vs-wrapped checkbox/radio rules), but change where
the revealed control ends up instead of nesting it in a wizard fieldset:
`mount` appends it to the end of the form, `siblings` inserts it
immediately after this control as a plain sibling. No special styling
applies to either - the revealed control renders exactly as it would if
authored directly at that position in the schema. Supported on the same
types as `wizards` (`Dropdown`-based, `Input`-based, and `Checkbox`); not
supported on `Fieldset`, `List`, or `TextArea`.

Radio group (same `name`, distinct `value`s, each entry follows this same
shape with `"type": "radio"`):

```json
[
	{
		"type": "radio",
		"id": "priorityHigh",
		"name": "priority",
		"label": "High Priority",
		"value": "high"
	},
	{
		"type": "radio",
		"id": "priorityStandard",
		"name": "priority",
		"label": "Standard Priority",
		"value": "standard"
	}
]
```

A checkbox/radio's `wizards` entries can key off the checked state directly,
or off the control's actual value like any other control's rules do. In
order below: a bare control (revealed while checked, the implicit
default), `test: true` (the same thing, spelled out), `test: false`
(revealed while **unchecked** instead), and a literal string / `"/pattern/flags"`
regex tested against the control's own value (`"on"` here, matching this
checkbox's default `value`; a plain `test: true` is just a shorthand for
this same check when the value hasn't been customized):

```json
[
	{
		"type": "text",
		"id": "bareWizardField",
		"name": "bareWizardField",
		"label": "Shown while checked (bare control, implicit default)"
	},
	{
		"test": true,
		"wizard": {
			"type": "text",
			"id": "checkedWizardField",
			"name": "checkedWizardField",
			"label": "Shown while checked (explicit test: true)"
		}
	},
	{
		"test": false,
		"wizard": {
			"type": "textarea",
			"id": "uncheckedWizardField",
			"name": "uncheckedWizardField",
			"label": "Shown while unchecked (test: false)"
		}
	}
]
```

`freeform: true` additionally renders a text input beside the checkbox,
capturing a custom value when checked:

```json
{
	"type": "checkbox",
	"id": "otherReason",
	"name": "otherReason",
	"label": "Other",
	"freeform": true
}
```

</details>

<details>
<summary><strong>ImageInput</strong></summary>

```json
{
	"type": "image",
	"id": "screenshot",
	"name": "screenshot",
	"label": "Screenshot",
	"hint": "Choose an image to attach",
	"multiple": true,
	"constraints": {
		"required": false
	}
}
```

`image` renders `<input type="file" accept="image/*">`. Set `multiple` to
`true` to let one picker select several images. Use `list:image` for an
addable set of one-image pickers:

```json
{
	"type": "list:image",
	"id": "screenshots",
	"name": "screenshots",
	"label": "Screenshots"
}
```

The selected browser `File` is intentionally not submitted as ordinary form
data. Convert it with `APP.imageToUpload(file)` and upload it before
submitting the returned Drive metadata with the rest of the form.

</details>

<details>
<summary><strong>CurrencyInput</strong></summary>

```json
{
	"type": "currency",
	"id": "amount",
	"name": "amount",
	"label": "Claim Amount",
	"hint": "Enter the total claimed amount",
	"disabled": false,
	"value": "0.00",
	"width": 2,
	"inputMode": "decimal",
	"constraints": {
		"required": true,
		"maxLength": 20
	},
	"modals": [
		{
			"test": "/^[5-9][0-9]{3,}/",
			"modal": {
				"type": "confirm",
				"message": "This amount is unusually high. Continue?",
				"confirmText": "Yes",
				"cancelText": "Cancel"
			},
			"dependencies": [["routingDepartment", "billing"]]
		},
		{
			"test": "/^0(\\.0+)?$/",
			"modal": {
				"type": "message",
				"header": "Zero Amount",
				"message": "Confirm this claim is intentionally $0.",
				"variant": "note"
			}
		}
	],
	"alerts": [
		{
			"test": "/^0(\\.0+)?$/",
			"alert": {
				"variant": "caution",
				"message": "Amount is zero, confirm this is intentional."
			}
		},
		{
			"test": "/^[5-9][0-9]{3,}/",
			"alert": {
				"variant": "warning",
				"message": "High-value claim, secondary approval required."
			},
			"dependencies": [["routingDepartment", "billing"]]
		}
	],
	"footnotes": [
		{
			"test": "/^[5-9][0-9]{3,}/",
			"footnote": "requires secondary approval"
		},
		{
			"test": "/^0(\\.0+)?$/",
			"footnote": "zero-dollar claim"
		}
	],
	"wizards": [
		{
			"test": "/^[5-9][0-9]{3,}/",
			"wizard": {
				"type": "text",
				"id": "approverName",
				"name": "approverName",
				"label": "Secondary Approver",
				"constraints": {
					"required": true
				}
			}
		}
	]
}
```

No `min`/`max`/`step` here, unlike `NumberInput`: this isn't a native
number input under the hood (it renders as `type="text"` so comma-formatted
amounts parse correctly), so there's nothing for the browser to natively
constrain. It also accepts more than one amount, delimited by whitespace
(space, tab, etc.), optionally preceded by a comma; a bare comma with no
following whitespace stays part of one amount's thousands grouping. Any
individual amount may also carry an optional leading `multi` keyword,
case-insensitive and followed by whitespace (e.g. `multi 100`), independent
of the others; it's stripped before validation and doesn't affect that
amount's own format check, and the space after it doesn't interfere with
the delimiter between amounts:

```json
{
	"type": "currency",
	"id": "priorAmounts",
	"name": "priorAmounts",
	"label": "Prior Claimed Amounts",
	"hint": "Enter one or more amounts, separated by a space (a comma before the space is optional)",
	"value": "1,234.56, multi 89.00 500"
}
```

Each amount is validated independently on input; one malformed amount
invalidates the whole field (naming the bad one), stray/duplicate
delimiters (e.g. a trailing separator) are silently ignored rather than
flagged.

</details>

<details>
<summary><strong>DateInput</strong></summary>

```json
{
	"type": "date",
	"id": "incidentDate",
	"name": "incidentDate",
	"label": "Incident Date",
	"hint": "Date the incident occurred",
	"disabled": false,
	"value": "2026-01-01",
	"readonly": false,
	"width": 2,
	"constraints": {
		"required": true,
		"min": "2020-01-01",
		"max": "2026-12-31"
	},
	"modals": [
		{
			"test": "2020-01-01",
			"modal": {
				"type": "message",
				"header": "Old Case",
				"message": "This is the earliest supported incident date.",
				"variant": "note"
			}
		},
		{
			"test": "/^202[0-3]/",
			"modal": {
				"type": "confirm",
				"header": "Aged Case",
				"message": "This case is more than 2 years old. Continue?",
				"confirmText": "Yes",
				"cancelText": "Cancel"
			},
			"dependencies": [["routingDepartment", "escalations"]]
		}
	],
	"alerts": [
		{
			"test": "/^202[0-3]/",
			"alert": {
				"variant": "caution",
				"message": "Incident is more than 2 years old."
			}
		},
		{
			"test": "2020-01-01",
			"alert": {
				"variant": "note",
				"message": "This is the earliest date this form accepts."
			}
		}
	],
	"footnotes": [
		{
			"test": "/^202[0-3]/",
			"footnote": "aged case",
			"dependencies": [["routingDepartment", "escalations"]]
		},
		{
			"test": "2020-01-01",
			"footnote": "earliest supported date"
		}
	],
	"wizards": [
		{
			"test": "/^202[0-3]/",
			"wizard": {
				"type": "textarea",
				"id": "agedCaseReason",
				"name": "agedCaseReason",
				"label": "Reason for Delay"
			}
		}
	]
}
```

</details>

<details>
<summary><strong>DatetimeInput</strong></summary>

```json
{
	"type": "datetime",
	"id": "escalatedAt",
	"name": "escalatedAt",
	"label": "Escalated At",
	"hint": "Date and time the case was escalated",
	"disabled": false,
	"value": "2026-01-01T09:00",
	"readonly": false,
	"width": 2,
	"constraints": {
		"required": false,
		"min": "2020-01-01T00:00",
		"max": "2026-12-31T23:59"
	},
	"modals": [
		{
			"test": "/T(0[0-6]):/",
			"modal": {
				"type": "message",
				"header": "After-Hours Escalation",
				"message": "This escalation was logged outside business hours.",
				"variant": "note"
			}
		},
		{
			"test": "/T(0[0-6]):/",
			"modal": {
				"type": "confirm",
				"header": "Notify On-Call?",
				"message": "This is outside business hours. Page on-call now?",
				"confirmText": "Yes, page now",
				"cancelText": "Not yet"
			},
			"dependencies": [["priority", "high"]]
		}
	],
	"alerts": [
		{
			"test": "/T(0[0-6]):/",
			"alert": {
				"variant": "important",
				"message": "After-hours escalation, on-call has been notified."
			}
		},
		{
			"test": "/T(0[0-6]):/",
			"alert": {
				"variant": "tip",
				"message": "Business hours are 7:00–18:00 local time."
			}
		}
	],
	"footnotes": [
		{
			"test": "/T(0[0-6]):/",
			"footnote": "after-hours",
			"dependencies": [["priority", "high"]]
		}
	],
	"wizards": [
		{
			"test": "/T(0[0-6]):/",
			"wizard": {
				"type": "text",
				"id": "onCallContact",
				"name": "onCallContact",
				"label": "On-Call Contact"
			}
		}
	]
}
```

</details>

<details>
<summary><strong>Fieldset</strong></summary>

No `name`, `value`, `constraints`, `modals`, `alerts`, `footnotes`,
`wizards`, `mount`, `siblings`, or `width` override: always full-width,
purely a grouping of `members`. Members can themselves be another
`fieldset`, recursively:

```json
{
	"type": "fieldset",
	"id": "escalationDetails",
	"label": "Escalation Details",
	"disabled": false,
	"members": [
		{
			"type": "select",
			"id": "escalationOwner",
			"name": "escalationOwner",
			"label": "Owner",
			"options": [
				{ "label": "Team Lead", "value": "team_lead" },
				{ "label": "Manager", "value": "manager", "icon": "⭐" }
			]
		},
		{
			"type": "text",
			"id": "escalationReason",
			"name": "escalationReason",
			"label": "Reason",
			"constraints": {
				"required": true
			}
		},
		{
			"type": "fieldset",
			"id": "escalationContactDetails",
			"label": "Contact Details",
			"members": [
				{
					"type": "text",
					"id": "escalationContactName",
					"name": "escalationContactName",
					"label": "Name"
				},
				{
					"type": "tel",
					"id": "escalationContactPhone",
					"name": "escalationContactPhone",
					"label": "Phone"
				}
			]
		}
	]
}
```

</details>

<details>
<summary><strong>List</strong></summary>

An extendable/retractable list of same-typed inputs. `type` is either bare
`"list"` (entries render as `text` inputs) or `` `list:${InputType}` ``
(e.g. `"list:url"`, `"list:number"`) naming which `InputType` each entry
renders as. Like `Fieldset`, it isn't itself value-bearing: no
`value`/`defaultValue` - it always starts with exactly one blank entry,
never pre-populated from the config. Each entry is named
`${name}_${index}`, id'd `${name}-${index}` (0-based; removing an entry
re-indexes every entry after it, so there are never gaps). The first entry
(`${name}_0`) never gets a remove button and is always present.
`constraints` applies identically to every entry:

```json
{
	"type": "list:url",
	"id": "relatedLinks",
	"name": "relatedLinks",
	"label": "Related Links",
	"hint": "Add every reference link relevant to this case",
	"width": 2,
	"constraints": {
		"required": false,
		"maxLength": 2000
	}
}
```

Bare `"list"` (defaults each entry to `text`):

```json
{
	"type": "list",
	"id": "aliases",
	"name": "aliases",
	"label": "Known Aliases"
}
```

No `modals`, `alerts`, `footnotes`, `wizards`, `mount`, or `siblings`
support on the list itself (no single control has "the" list's value to
key rules off of) - the same kind of gap `Fieldset` (no rules at all) and
`TextArea` (no `wizards`/`mount`/`siblings`) already have. It can still
be the *target* of another control's wizard/mount/siblings rule (shown/
hidden as a whole), and its always-present first entry's name
(`${name}_0`) can be used as a `dependencies` source elsewhere in the
schema, since that's a real, unchanging control name.

</details>

<details>
<summary><strong>Listbox</strong></summary>

```json
{
	"type": "listbox",
	"id": "tags",
	"name": "tags",
	"label": "Case Tags",
	"hint": "Select every tag that applies",
	"disabled": false,
	"width": 2,
	"size": 4,
	"collapsed": false,
	"options": [
		{ "label": "Fraud", "value": "fraud", "icon": "🚩" },
		{ "label": "Billing Dispute", "value": "billing_dispute" },
		{ "label": "Duplicate", "value": "duplicate" },
		{ "label": "Follow-up", "value": "follow_up" }
	],
	"wizards": [
		{
			"test": true,
			"wizard": {
				"type": "textarea",
				"id": "tagNotes",
				"name": "tagNotes",
				"label": "Tag Notes"
			}
		}
	],
	"mount": [
		{
			"test": "fraud",
			"wizard": {
				"type": "text",
				"id": "complianceCaseNumber",
				"name": "complianceCaseNumber",
				"label": "Compliance Case Number"
			}
		}
	],
	"siblings": [
		{
			"test": "duplicate",
			"wizard": {
				"type": "text",
				"id": "originalCaseId",
				"name": "originalCaseId",
				"label": "Original Case ID"
			}
		}
	],
	"modals": [
		{
			"test": "fraud",
			"modal": {
				"type": "confirm",
				"message": "Fraud cases must be reported to compliance. Continue?",
				"confirmText": "Yes",
				"cancelText": "Cancel"
			},
			"dependencies": [["routingDepartment", "escalations"]]
		},
		{
			"test": "duplicate",
			"modal": {
				"type": "message",
				"header": "Duplicate Flagged",
				"message": "This case will be cross-linked to its original.",
				"variant": "note"
			}
		}
	],
	"alerts": [
		{
			"test": "fraud",
			"alert": {
				"variant": "warning",
				"message": "Compliance will be notified automatically."
			}
		},
		{
			"test": "follow_up",
			"alert": {
				"variant": "tip",
				"message": "Follow-up cases are reviewed weekly."
			}
		}
	],
	"footnotes": [
		{
			"test": "fraud",
			"footnote": "compliance notified",
			"dependencies": [["routingDepartment", "escalations"]]
		},
		{
			"test": "duplicate",
			"footnote": "cross-linked"
		}
	]
}
```

</details>

<details>
<summary><strong>NumberInput</strong></summary>

```json
{
	"type": "number",
	"id": "attemptCount",
	"name": "attemptCount",
	"label": "Contact Attempts",
	"hint": "Number of times the customer was contacted",
	"disabled": false,
	"value": 0,
	"readonly": false,
	"width": 2,
	"step": 1,
	"inputMode": "numeric",
	"constraints": {
		"required": false,
		"min": 0,
		"max": 10
	},
	"modals": [
		{
			"test": "/^([5-9]|10)$/",
			"modal": {
				"type": "message",
				"header": "Max Attempts Reached",
				"message": "Consider closing this case as unreachable.",
				"variant": "note"
			}
		},
		{
			"test": "0",
			"modal": {
				"type": "confirm",
				"message": "No contact attempts logged yet. Continue anyway?",
				"confirmText": "Yes",
				"cancelText": "Cancel"
			}
		}
	],
	"alerts": [
		{
			"test": "/^([5-9]|10)$/",
			"alert": {
				"variant": "caution",
				"message": "High attempt count, review case status."
			},
			"dependencies": [["priority", "high"]]
		},
		{
			"test": "0",
			"alert": {
				"variant": "tip",
				"message": "Log every contact attempt as it happens."
			}
		}
	],
	"footnotes": [
		{
			"test": "/^([5-9]|10)$/",
			"footnote": "high attempt count"
		},
		{
			"test": "0",
			"footnote": "no attempts yet"
		}
	],
	"wizards": [
		{
			"test": "/^([5-9]|10)$/",
			"wizard": {
				"type": "checkbox",
				"id": "markUnreachable",
				"name": "markUnreachable",
				"label": "Mark as Unreachable"
			}
		}
	]
}
```

Same `"any"` escape hatch as `CurrencyInput`: `"min": "any"`/`"max": "any"`
disables that side of the check. `step` also accepts `"any"` to allow
fractional values freely instead of snapping to whole numbers.

</details>

<details>
<summary><strong>Select</strong></summary>

```json
{
	"type": "select",
	"id": "routingDepartment",
	"name": "routingDepartment",
	"label": "Routing Department",
	"hint": "Department this case should be routed to",
	"disabled": false,
	"width": 2,
	"options": [
		{ "label": "Billing", "value": "billing" },
		{ "label": "Technical", "value": "technical" },
		{ "label": "Escalations", "value": "escalations", "icon": "⚠️" }
	],
	"wizards": [
		{
			"test": "escalations",
			"wizard": {
				"type": "text",
				"id": "escalationContact",
				"name": "escalationContact",
				"label": "Escalation Contact"
			}
		}
	],
	"modals": [
		{
			"test": "escalations",
			"modal": {
				"type": "confirm",
				"header": "Confirm Escalation",
				"message": "Routing to Escalations pages the on-call manager. Continue?",
				"variant": "important",
				"confirmText": "Yes, escalate",
				"cancelText": "Cancel"
			},
			"dependencies": [["priority", "high"]]
		},
		{
			"test": "billing",
			"modal": {
				"type": "message",
				"header": "Billing Queue",
				"message": "Billing cases are reviewed within 2 business days.",
				"variant": "note"
			}
		}
	],
	"alerts": [
		{
			"test": "escalations",
			"alert": {
				"variant": "warning",
				"message": "On-call manager will be paged immediately."
			}
		},
		{
			"test": "technical",
			"alert": {
				"variant": "tip",
				"message": "Attach any relevant logs before submitting."
			}
		}
	],
	"footnotes": [
		{
			"test": "escalations",
			"footnote": "escalated",
			"dependencies": [["priority", "high"]]
		},
		{
			"test": "billing",
			"footnote": "billing queue"
		}
	]
}
```

</details>

<details>
<summary><strong>TextArea</strong></summary>

```json
{
	"type": "textarea",
	"id": "notes",
	"name": "notes",
	"label": "Notes",
	"hint": "Markdown-formatted context for this case",
	"disabled": false,
	"defaultValue": "",
	"readonly": false,
	"width": 4,
	"rows": 4,
	"autocomplete": "on",
	"placeholder": "Add any relevant context...",
	"constraints": {
		"required": false,
		"minLength": 0,
		"maxLength": 2000
	},
	"modals": [
		{
			"test": "/urgent/i",
			"modal": {
				"type": "message",
				"header": "Urgency Noted",
				"message": "Consider using the Mark as Urgent checkbox instead of free text.",
				"variant": "note"
			}
		}
	],
	"alerts": [
		{
			"test": "/(?!^)./",
			"alert": {
				"variant": "tip",
				"message": "Notes support markdown formatting."
			}
		},
		{
			"test": "/urgent/i",
			"alert": {
				"variant": "caution",
				"message": "Use the Mark as Urgent checkbox for routing purposes."
			},
			"dependencies": [["isUrgent", false]]
		}
	],
	"footnotes": [
		{
			"test": "/urgent/i",
			"footnote": "flagged in notes"
		}
	]
}
```

Note: `textarea` does not support `wizards`, `mount`, or `siblings`; it's
excluded on this one type only, everything else above still applies.

</details>

<details>
<summary><strong>TextInput</strong></summary>

Covers `type`: `email`, `password`, `search`, `tel`, `text`, `url`. This
example uses `email`; every field below applies identically regardless of
which of the six you pick.

```json
{
	"type": "email",
	"id": "contactEmail",
	"name": "contactEmail",
	"label": "Contact Email",
	"hint": "Best email to reach the submitter",
	"disabled": false,
	"value": "",
	"defaultValue": "",
	"readonly": false,
	"placeholder": "name@example.com",
	"autocomplete": "on",
	"width": 2,
	"list": ["support@example.com", "billing@example.com"],
	"constraints": {
		"required": true,
		"minLength": 5,
		"maxLength": 254,
		"pattern": "^[^@]+@[^@]+\\.[^@]+$"
	},
	"modals": [
		{
			"test": "/@example\\.com$/i",
			"modal": {
				"type": "message",
				"header": "Internal Address",
				"message": "This looks like an internal email address.",
				"variant": "note"
			}
		},
		{
			"test": "/@competitor\\.com$/i",
			"modal": {
				"type": "confirm",
				"header": "External Domain",
				"message": "This domain isn't on the approved list. Continue?",
				"confirmText": "Yes",
				"cancelText": "Cancel"
			}
		}
	],
	"alerts": [
		{
			"test": "/@example\\.com$/i",
			"alert": {
				"variant": "tip",
				"message": "Internal submitters are auto-CC'd on replies."
			}
		},
		{
			"test": "/@competitor\\.com$/i",
			"alert": {
				"variant": "caution",
				"message": "Double-check this address before sending replies."
			},
			"dependencies": [["routingDepartment", "escalations"]]
		}
	],
	"footnotes": [
		{
			"test": "/@example\\.com$/i",
			"footnote": "internal"
		},
		{
			"test": "/@competitor\\.com$/i",
			"footnote": "unverified domain",
			"dependencies": [["routingDepartment", "escalations"]]
		}
	],
	"wizards": [
		{
			"test": "/@example\\.com$/i",
			"wizard": {
				"type": "text",
				"id": "internalTeam",
				"name": "internalTeam",
				"label": "Internal Team"
			}
		}
	],
	"mount": [
		{
			"test": "/@competitor\\.com$/i",
			"wizard": {
				"type": "textarea",
				"id": "externalDomainJustification",
				"name": "externalDomainJustification",
				"label": "Reason for External Domain"
			}
		}
	],
	"siblings": [
		{
			"test": "/@example\\.com$/i",
			"wizard": {
				"type": "text",
				"id": "internalExtension",
				"name": "internalExtension",
				"label": "Internal Extension"
			}
		}
	]
}
```

</details>

<details>
<summary><strong>TimeInput</strong></summary>

```json
{
	"type": "time",
	"id": "callbackTime",
	"name": "callbackTime",
	"label": "Preferred Callback Time",
	"hint": "Best time of day to reach the submitter",
	"disabled": false,
	"value": "09:00",
	"readonly": false,
	"width": 2,
	"constraints": {
		"required": false,
		"min": "07:00",
		"max": "18:00"
	},
	"modals": [
		{
			"test": "/^0[0-6]:/",
			"modal": {
				"type": "message",
				"header": "Early Callback",
				"message": "This is before standard business hours.",
				"variant": "note"
			}
		},
		{
			"test": "/^0[0-6]:/",
			"modal": {
				"type": "confirm",
				"header": "Notify On-Call?",
				"message": "This is outside business hours. Page on-call now?",
				"confirmText": "Yes, page now",
				"cancelText": "Not yet"
			},
			"dependencies": [["priority", "high"]]
		}
	],
	"alerts": [
		{
			"test": "/^0[0-6]:/",
			"alert": {
				"variant": "important",
				"message": "Requested callback is outside business hours."
			}
		},
		{
			"test": "/^0[0-6]:/",
			"alert": {
				"variant": "tip",
				"message": "Business hours are 7:00–18:00 local time."
			}
		}
	],
	"footnotes": [
		{
			"test": "/^0[0-6]:/",
			"footnote": "outside business hours",
			"dependencies": [["priority", "high"]]
		}
	],
	"wizards": [
		{
			"test": "/^0[0-6]:/",
			"wizard": {
				"type": "text",
				"id": "onCallContact",
				"name": "onCallContact",
				"label": "On-Call Contact"
			}
		}
	]
}
```

</details>
