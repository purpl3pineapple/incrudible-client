import { DAYS } from "./values/days.js";

export { DAYS };

// incrudible-client — shared client framework for InCRUDibly-based Apps
// Script apps. `APP` is the only export; it's the house for everything
// (DOM accessors as live getters, render helpers, rule state), so a
// consumer only ever needs `import { APP } from "incrudible-client";`.
// This module has no knowledge of any single app's workflow-acquisition
// logic (free-text search vs. a fixed link list) — that stays in each
// app's own Client.html, calling into APP.

export const APP = {
	THEME_STORAGE_KEY: "[incrudible:theme]",
	RECORDS_STORAGE_KEY: "[incrudible:records]",

	get topnav() {
		return document.getElementById("topnav");
	},
	get topnavToggle() {
		return document.getElementById("topnav-collapse-toggle");
	},
	get dropdowns() {
		return Array.from(document.querySelectorAll(".nav-dropdown"));
	},
	get sidenav() {
		return document.getElementById("sidenav");
	},
	get sidenavClose() {
		return document.getElementById("close-sidenav");
	},
	get sideNavControllers() {
		return [
			document.getElementById("open-sidenav"),
			...document.querySelectorAll(
				`:is(button, a)[data-drawer-target="${this.sidenav.id}"]`,
			),
		];
	},
	get notepad() {
		return document.getElementById("notepad");
	},
	get notepadHandle() {
		return document.getElementById("notepad-handle");
	},
	get closeNotepad() {
		return document.getElementById("close-notepad");
	},
	get openNotepad() {
		return document.getElementById("open-notepad");
	},
	get confirmModal() {
		return document.getElementById("confirm-modal");
	},
	get confirmModalClose() {
		return document.getElementById("confirm-modal-close");
	},
	get confirmModalCancel() {
		return document.getElementById("confirm-modal-cancel-button");
	},
	get confirmModalConfirm() {
		return document.getElementById("confirm-modal-confirm-button");
	},
	get messageModal() {
		return document.getElementById("message-modal");
	},
	get messageModalClose() {
		return document.getElementById("message-modal-close");
	},
	get messageModalDismiss() {
		return document.getElementById("message-modal-dismiss-button");
	},
	get feedbackDrawer() {
		return document.getElementById("feedback-drawer");
	},
	get openFeedbackDrawer() {
		return document.getElementById("open-feedback-drawer");
	},
	get closeFeedbackDrawer() {
		return document.getElementById("close-feedback-drawer");
	},
	get form() {
		return document.getElementById("app-form");
	},
	get feedbackForm() {
		return document.getElementById("feedback-form");
	},
	get feedbackFormControls() {
		return document.getElementById("feedback-form-controls");
	},
	get appAlerts() {
		return document.getElementById("app-alerts");
	},
	get formAlerts() {
		return document.getElementById("form-alerts");
	},
	get feedbackAlerts() {
		return document.getElementById("feedback-alerts");
	},
	get tablist() {
		return document.querySelector('[role="tablist"]');
	},
	get tabs() {
		return Array.from(this.tablist?.querySelectorAll('[role="tab"]') ?? []);
	},
	get formControls() {
		return document.getElementById("form-controls");
	},
	get recordsList() {
		return document.getElementById("records-list");
	},
	get overlay() {
		return document.getElementById("app-overlay");
	},
	get formPreview() {
		return document.getElementById("form-preview");
	},
	get previewList() {
		return document.getElementById("preview-list");
	},
	get copyPreview() {
		return document.getElementById("copy-preview");
	},
	get activeFlowLink() {
		return this.sidenav?.querySelector("a[data-flow-id].active");
	},
	get toastContainer() {
		return document.getElementById("toast-container");
	},
	get themeToggle() {
		return document.getElementById("theme-toggle");
	},
	get messageModalHeader() {
		return document.getElementById("message-modal-header");
	},
	get messageModalMessage() {
		return document.getElementById("message-modal-message");
	},
	get confirmModalHeader() {
		return document.getElementById("confirm-modal-header");
	},
	get confirmModalMessage() {
		return document.getElementById("confirm-modal-message");
	},

	// Active workflow's rule maps, plus feedback's own. Each app's own
	// mountWorkflow/resetWorkflow, and each app's own feedback-init line,
	// assign onto this directly (e.g. `APP.rules.modalRules = data.rules.modals;`) —
	// object property mutation works fine across the module boundary,
	// unlike reassigning a bare imported binding.
	rules: {
		modalRules: {},
		alertRules: {},
		footnoteRules: {},
		wizardRules: {},
		mountRules: {},
		siblingsRules: {},
		feedbackWizardRules: {},
		feedbackAlertRules: {},
		feedbackModalRules: {},
		feedbackMountRules: {},
		feedbackSiblingsRules: {},
	},

	workflowLabel: "",

	// The active workflow — a rich alert object for queue, a plain label
	// string for static. Each app's own mountWorkflow/resetWorkflow read
	// and write this; it's a real accessor (not a plain data property) so
	// that access always goes through APP rather than reaching into
	// _internals directly.
	get workflow() {
		return APP._internals.workflow;
	},
	set workflow(value) {
		APP._internals.workflow = value;
	},

	imageToUpload: file => {
		const maxImageBytes = 10 * 1024 * 1024;

		if (!file?.type?.startsWith("image/")) {
			return Promise.reject(new Error("Select an image file."));
		}

		if (file.size > maxImageBytes) {
			return Promise.reject(new Error("Select an image no larger than 10 MiB."));
		}

		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.addEventListener("load", () => {
				const [, base64] = `${reader.result}`.split(",", 2);
				resolve({ name: file.name, mimeType: file.type, base64 });
			});
			reader.addEventListener("error", () => reject(reader.error));
			reader.readAsDataURL(file);
		});
	},

	init: ({
		feedback,
		workflowLabel = "",
		onWorkflowLoaded,
		onAppInit,
		onFormReset,
		onRecordsTab,
	} = {}) => {
		APP.workflowLabel = workflowLabel;

		if (feedback) {
			APP.rules.feedbackWizardRules = feedback?.rules?.wizards || {};
			APP.rules.feedbackAlertRules = feedback?.rules?.alerts || {};
			APP.rules.feedbackModalRules = feedback?.rules?.modals || {};
			APP.rules.feedbackMountRules = feedback?.rules?.mount || {};
			APP.rules.feedbackSiblingsRules = feedback?.rules?.siblings || {};

			APP.feedbackFormControls.replaceChildren(
				APP.renderEntries(feedback.schema),
			);
		}

		if (localStorage.getItem(APP.THEME_STORAGE_KEY)) {
			document.documentElement.dataset.theme = APP.theme;
		}

		if (APP.themeToggle) {
			APP.themeToggle.checked = APP.theme === "dark";
		}

		document.addEventListener("click", event => {
			if (event.target.closest?.('a[href^="javascript:"]')) {
				event.preventDefault();
			}
		});

		APP.tabs.forEach((tab, index) => {
			tab.addEventListener("click", () =>
				APP.navigator.selectTab(tab.dataset.tabId),
			);

			tab.addEventListener("keydown", e => {
				const last = APP.tabs.length - 1;
				let next = null;

				switch (e.key) {
					case "ArrowRight": {
						next = index === last ? 0 : index + 1;
						break;
					}
					case "ArrowLeft": {
						next = index === 0 ? last : index - 1;
						break;
					}
					case "Home": {
						next = 0;
						break;
					}
					case "End": {
						next = last;
						break;
					}
					default:
						return;
				}

				e.preventDefault();
				APP.navigator.selectTab(APP.tabs[next].dataset.tabId);
				APP.tabs[next].focus();
			});
		});

		APP.dropdowns.forEach(dropdown => {
			dropdown
				.querySelector(".dropdown-button")
				?.addEventListener("click", () => APP.toggleDropdown(dropdown));
		});

		APP.topnavToggle?.addEventListener("click", event => {
			event.preventDefault();
			APP.topnav?.classList.toggle("expanded");
		});

		APP.sideNavControllers.forEach(element =>
			element?.addEventListener("click", event => {
				event.preventDefault();
				APP.sidenav?.classList.add("open");
			}),
		);

		APP.sidenavClose?.addEventListener("click", event => {
			event.preventDefault();
			APP.sidenav?.classList.remove("open");
		});

		APP.openFeedbackDrawer?.addEventListener("click", event => {
			event.preventDefault();
			APP.feedbackDrawer?.classList.add("open");
		});

		APP.closeFeedbackDrawer?.addEventListener("click", event => {
			event.preventDefault();
			APP.feedbackDrawer?.classList.remove("open");
			APP.feedbackForm?.reset();
		});

		APP.closeNotepad?.addEventListener("click", () =>
			APP.notepad.classList.add("closed"),
		);
		APP.openNotepad?.addEventListener("click", () =>
			APP.notepad.classList.remove("closed"),
		);

		// Draggable notepad — grab the header to move it (mouse + touch)
		APP.notepadHandle?.addEventListener("pointerdown", event => {
			if (event.button !== 0 || event.target === APP.closeNotepad) {
				return;
			}

			const rect = APP.notepad.getBoundingClientRect();
			const grabX = event.clientX - rect.left;
			const grabY = event.clientY - rect.top;

			// Hand off from the initial right-anchored spot to left/top
			APP.notepad.style.right = "auto";
			APP.notepad.style.bottom = "auto";

			const onPointerMove = move => {
				APP.notepad.style.left = move.clientX - grabX + "px";
				APP.notepad.style.top = move.clientY - grabY + "px";
			};

			const onPointerUp = up => {
				APP.notepadHandle.releasePointerCapture(up.pointerId);
				APP.notepadHandle.removeEventListener("pointermove", onPointerMove);
				APP.notepadHandle.removeEventListener("pointerup", onPointerUp);
			};

			APP.notepadHandle.setPointerCapture(event.pointerId);
			APP.notepadHandle.addEventListener("pointermove", onPointerMove);
			APP.notepadHandle.addEventListener("pointerup", onPointerUp);
		});

		[APP.messageModalDismiss, APP.messageModalClose].forEach(button =>
			button?.addEventListener("click", () => APP.messageModal.close()),
		);

		APP.confirmModalConfirm?.addEventListener("click", () =>
			APP.confirmModal.close("confirm"),
		);
		[APP.confirmModalCancel, APP.confirmModalClose].forEach(button =>
			button?.addEventListener("click", () => APP.confirmModal.close("cancel")),
		);

		document.addEventListener("click", event => {
			APP.dropdowns
				.filter(dropdown => !dropdown.contains(event.target))
				.forEach(dropdown => APP.toggleDropdown(dropdown, false));
		});

		document.addEventListener("keydown", event => {
			if (event.key === "Escape") {
				APP.dropdowns.forEach(dropdown => APP.toggleDropdown(dropdown, false));
			}
		});

		APP.confirmModal?.addEventListener("close", () => {
			APP.publish(
				APP.confirmModal.returnValue === "confirm"
					? "confirm:accepted"
					: "confirm:cancelled",
				APP._internals.confirmDetail,
			);
			APP._internals.confirmDetail = undefined;
			APP.publish("modal:closed");
		});

		APP.messageModal?.addEventListener("close", () =>
			APP.publish("modal:closed"),
		);

		// Delegated: copy buttons embedded in notify() message markup, e.g.
		// the feedback:submitted subscriber's record-ID copy button below.
		APP.messageModal?.addEventListener("click", async e => {
			const button = e.target.closest(".copy-button");

			if (!button) {
				return;
			}

			try {
				await navigator.clipboard.writeText(button.dataset.copy);
				APP.toast("Copied to clipboard.", "tip");
			} catch (_e) {
				APP.toast("Couldn't copy to clipboard.", "caution");
			}
		});

		APP.form?.addEventListener("reset", () =>
			requestAnimationFrame(() => {
				APP._internals.form.resetLists();
				onFormReset?.();
			}),
		);

		APP.feedbackForm?.addEventListener("input", event =>
			APP._internals.form.syncWizards(event, APP.feedbackForm),
		);

		APP.feedbackForm?.addEventListener("change", event => {
			APP._internals.form.syncWizards(event, APP.feedbackForm);
			APP._internals.form.syncModals(event);
			APP._internals.form.syncAlerts(APP.feedbackForm);
		});

		APP._internals.form.syncWizards(undefined, APP.feedbackForm);

		APP.feedbackForm?.addEventListener("reset", () =>
			requestAnimationFrame(() => {
				APP._internals.form.syncWizards(undefined, APP.feedbackForm);
				APP._internals.form.syncAlerts(APP.feedbackForm);
			}),
		);

		APP.copyPreview?.addEventListener("click", async () => {
			if (!APP.form.reportValidity()) {
				return;
			}

			const { charCount, copyText } = APP.formHelpers;

			if (!charCount) {
				return;
			}

			try {
				await navigator.clipboard.writeText(copyText);
				APP.toast("Copied to clipboard.", "tip");
			} catch (_e) {
				APP.toast("Couldn't copy to clipboard.", "caution");
			}
		});

		APP.themeToggle?.addEventListener("change", () => {
			APP.theme = APP.themeToggle.checked ? "dark" : "light";
		});

		APP.subscribe("overlay:show", () => APP.overlay?.classList.add("active"));

		APP.subscribe("overlay:hide", () =>
			APP.overlay?.classList.remove("active"),
		);

		APP.subscribe("tab:change", ({ id }) => {
			if (id === "panel-records") {
				onRecordsTab?.();
			}
		});

		APP.subscribe("record:created", () => {
			APP.form?.reset();
			APP.toast("Submission received.", "tip");
		});

		APP.subscribe("feedback:submitted", record => {
			APP._internals.feedback.records?.unshift(record);
			APP.feedbackForm?.reset();
			APP.notify(
				`Thanks for the feedback! Keep this ID for reference:\n<span class="copyable"><code>${record.id}</code><button type="button" class="copy-button" data-copy="${record.id}" aria-label="Copy ID"><i class="copy-icon" aria-hidden="true"></i></button></span>`,
				{ header: "Feedback submitted", variant: "tip" },
			);
		});

		APP.subscribe("workflow:loaded", data => onWorkflowLoaded?.(data));

		APP.subscribe("app:init", onInit => onAppInit?.(onInit));
	},

	// Bare <input> builder shared by renderFormControl's labeled-control path
	// and by list-control entries (which need their own id/name per entry,
	// so they can't go through renderFormControl/applyShared directly).
	buildInput: (type, constraints = {}, value, multiple = false) => {
		const input = document.createElement("input");
		input.type =
			type === "currency"
				? "text"
				: type === "datetime"
					? "datetime-local"
					: type === "image"
						? "file"
						: type;

		if (["currency", "number"].includes(type)) {
			input.dataset.type = type;
		}

		if (type === "image") {
			input.accept = "image/*";
			input.multiple = multiple;
		}

		if (value != null && type !== "image") {
			input.defaultValue = value;
		}

		if (constraints.minLength != null) {
			input.minLength = constraints.minLength;
		}

		if (constraints.maxLength != null) {
			input.maxLength = constraints.maxLength;
		}

		if (constraints.pattern) {
			input.pattern = constraints.pattern;
		}

		if (constraints.min != null) {
			input.min = constraints.min;
		}

		if (constraints.max != null) {
			input.max = constraints.max;
		}

		return input;
	},

	renderFormControl: (entry, rule) => {
		const v = entry.constraints || {};
		const val = entry.defaultValue;
		// Elements are serialized to HTML at the end, so defaults must land
		// on attribute-backed properties (defaultValue/defaultChecked/
		// defaultSelected), not the live ones outerHTML would drop.
		const applyShared = element => {
			element.id = entry.id;

			if (entry.name) {
				element.name = entry.name;
			}

			if (entry.disabled) {
				element.disabled = true;
			}

			if (entry.readonly) {
				element.readOnly = true;
			}

			if (v.required) {
				element.required = true;
			}
		};

		const fragment = document.createDocumentFragment();

		switch (entry.type) {
			case "text":
			case "email":
			case "search":
			case "tel":
			case "password":
			case "url":
			case "image":
			case "currency":
			case "number":
			case "date":
			case "datetime":
			case "time": {
				const input = APP.buildInput(entry.type, v, val, entry.multiple);

				applyShared(input);

				if (entry.placeholder) {
					input.placeholder = entry.placeholder;
				}

				if (entry.autocomplete) {
					input.autocomplete = entry.autocomplete;
				}

				if (entry.step != null) {
					input.step = entry.step;
				}

				if (entry.inputMode) {
					input.inputMode = entry.inputMode;
				} else if (entry.type === "currency") {
					input.inputMode = "decimal";
				}

				const icon = document.createElement("i");
				icon.setAttribute("aria-hidden", "true");
				fragment.append(icon, input);

				if (entry.list) {
					input.setAttribute("list", `${entry.id}-list`);
					fragment.append(APP.renderDatalist(entry));
				}

				break;
			}
			case "textarea": {
				const textarea = document.createElement("textarea");
				applyShared(textarea);

				if (val != null) {
					textarea.defaultValue = val;
				}

				if (entry.placeholder) {
					textarea.placeholder = entry.placeholder;
				}

				if (entry.autocomplete) {
					textarea.autocomplete = entry.autocomplete;
				}

				if (entry.rows != null) {
					textarea.rows = entry.rows;
				}

				if (v.minLength != null) {
					textarea.minLength = v.minLength;
				}

				if (v.maxLength != null) {
					textarea.maxLength = v.maxLength;
				}

				fragment.append(textarea);
				break;
			}
			case "select":
			case "listbox": {
				const select = document.createElement("select");
				select.id = entry.id;

				if (entry.name) {
					select.name = entry.name;
				}

				if (entry.type === "listbox") {
					select.multiple = true;

					if (entry.size != null) {
						select.size = entry.size;
					}

					if (entry.collapsed) {
						select.className = "collapsed";
					}
				}

				if (entry.disabled) {
					select.disabled = true;
				}

				if (v.required) {
					select.required = true;
				}

				// Customizable-select pattern: the button + selectedcontent pair
				// renders the chosen option's rich content in the closed state.
				if (entry.type === "select") {
					const button = document.createElement("button");
					button.type = "button";
					button.className = "select-button";

					const content = document.createElement("selectedcontent");
					content.className = "select-content";

					button.append(content);
					select.append(button);
				}

				entry.options?.forEach(option => {
					const element = document.createElement("option");
					element.value = option.value;

					if (!option.value) {
						element.className = "select-placeholder";
					}

					if (
						Array.isArray(val)
							? val.indexOf(option.value) !== -1
							: option.value === val
					) {
						element.defaultSelected = true;
					}

					if (option.icon) {
						const icon = document.createElement("span");
						icon.className = "icon";
						icon.setAttribute("aria-hidden", "true");
						icon.innerHTML = option.icon;
						element.append(icon);
					}

					const optionLabel = document.createElement("span");
					optionLabel.className = "option-label";
					optionLabel.innerHTML = option.label || option.value;

					element.append(optionLabel);
					select.append(element);
				});

				fragment.append(select);
				break;
			}
			case "checkbox":
			case "radio": {
				const input = document.createElement("input");
				input.type = entry.type;
				applyShared(input);

				if (entry.freeform) {
					input.className = "freeform";
				}

				if (entry.value != null) {
					input.defaultValue = entry.value;
				} else if (entry.type === "checkbox") {
					input.defaultValue = "true";
				}

				if (entry.checked || entry.defaultChecked) {
					input.defaultChecked = true;
				}

				fragment.append(input);
				break;
			}
		}

		const label = document.createElement("label");
		label.className = `form-control w-${entry.width || 1}`;
		label.htmlFor = entry.id;

		if (rule) {
			label.hidden = true;
		}

		const toolbar = document.createElement("span");
		toolbar.className = "label-toolbar";

		const labelText = document.createElement("span");
		labelText.className = "label-text";
		labelText.innerHTML = entry.label;
		toolbar.append(labelText);

		if (entry.hint) {
			const tooltip = document.createElement("span");
			tooltip.className = "tooltip";

			const tooltipIcon = document.createElement("i");
			tooltipIcon.className = "tooltip-icon";
			tooltipIcon.setAttribute("aria-hidden", "true");
			tooltip.append(tooltipIcon);

			const tooltipText = document.createElement("span");
			tooltipText.className = "tooltip-text";
			tooltipText.innerHTML = entry.hint;

			tooltip.append(tooltipText);
			toolbar.append(tooltip);
		}

		if (entry.alerts?.length) {
			label.append(APP.renderControlAlerts(entry));
		}

		label.append(toolbar, fragment);

		return label;
	},

	renderControlAlerts: entry => {
		const container = document.createElement("div");
		container.className = "control-alerts";

		if (entry.name) {
			container.dataset.name = entry.name;
		}

		container.dataset.controlId = entry.id;
		return container;
	},

	renderDatalist: entry => {
		const datalist = document.createElement("datalist");
		datalist.id = `${entry.id}-list`;

		entry.list.forEach(item => {
			const option = document.createElement("option");
			option.value = item;
			datalist.append(option);
		});

		return datalist;
	},

	renderEntry: (entry, rule, mounted = []) => {
		if (entry.type === "list" || entry.type.startsWith("list:")) {
			const itemType = entry.type === "list" ? "text" : entry.type.slice(5);
			const v = entry.constraints || {};

			const fieldset = document.createElement("fieldset");
			fieldset.className = `list w-${entry.width || 1}`;
			fieldset.id = entry.id;

			if (entry.name) {
				fieldset.dataset.name = entry.name;
			}

			if (itemType !== "text") {
				fieldset.dataset.type = itemType;
			}

			if (entry.disabled) {
				fieldset.disabled = true;
			}

			if (rule) {
				fieldset.hidden = true;
			}

			if (v.required) {
				fieldset.dataset.required = "true";
			}

			if (v.minLength != null) {
				fieldset.dataset.minLength = v.minLength;
			}

			if (v.maxLength != null) {
				fieldset.dataset.maxLength = v.maxLength;
			}

			if (v.pattern) {
				fieldset.dataset.pattern = v.pattern;
			}

			if (v.min != null) {
				fieldset.dataset.min = v.min;
			}

			if (v.max != null) {
				fieldset.dataset.max = v.max;
			}

			const label = document.createElement("label");
			label.className = "form-control";

			const toolbar = document.createElement("span");
			toolbar.className = "label-toolbar";

			const labelText = document.createElement("span");
			labelText.className = "label-text";
			labelText.innerHTML = entry.label;
			toolbar.append(labelText);

			if (entry.hint) {
				const tooltip = document.createElement("span");
				tooltip.className = "tooltip";

				const tooltipIcon = document.createElement("i");
				tooltipIcon.className = "tooltip-icon";
				tooltipIcon.setAttribute("aria-hidden", "true");
				tooltip.append(tooltipIcon);

				const tooltipText = document.createElement("span");
				tooltipText.className = "tooltip-text";
				tooltipText.innerHTML = entry.hint;

				tooltip.append(tooltipText);
				toolbar.append(tooltip);
			}

			const list = document.createElement("ul");

			// Builds one entry <li>. Reused for the always-present first entry
			// (not removable) and for every entry the "Add" button creates
			// later (removable) - both need the exact same input construction,
			// just closing over this one render's entry/itemType/v rather than
			// round-tripping through the fieldset's dataset.
			const buildEntry = (index, removable) => {
				const entryLi = document.createElement("li");

				const input = APP.buildInput(itemType, v);
				input.id = `${entry.id}-${index}`;

				if (entry.name) {
					input.name = `${entry.name}_${index}`;
				}

				input.required = Boolean(v.required);
				entryLi.append(input);

				if (removable) {
					const removeButton = document.createElement("button");
					removeButton.type = "button";
					removeButton.className = "list-remove";
					removeButton.setAttribute("aria-label", "Remove");
					removeButton.textContent = "×";
					removeButton.addEventListener("click", () => {
						entryLi.dispatchEvent(
							new CustomEvent("item-removed", { bubbles: true }),
						);
						entryLi.remove();
					});
					entryLi.append(removeButton);
				}

				return entryLi;
			};

			const addButton = document.createElement("button");
			addButton.type = "button";
			addButton.className = "list-add";
			addButton.textContent = "+ Add";
			addButton.addEventListener("click", () => {
				list.append(buildEntry(list.querySelectorAll("li").length, true));
			});
			toolbar.append(addButton);

			label.append(toolbar);
			list.append(buildEntry(0, false));

			fieldset.addEventListener("item-removed", () => {
				list.querySelectorAll("li").forEach((entryLi, index) => {
					const input = entryLi.querySelector("input");
					input.id = `${entry.id}-${index}`;

					if (entry.name) {
						input.name = `${entry.name}_${index}`;
					}
				});
			});

			fieldset.append(label, list);

			return fieldset;
		}

		if (entry.type === "fieldset") {
			const fieldset = document.createElement("fieldset");

			if (entry.id) {
				fieldset.id = entry.id;
			}

			if (entry.disabled) {
				fieldset.disabled = true;
			}

			const legend = document.createElement("legend");
			legend.innerHTML = entry.label;

			fieldset.append(
				legend,
				...entry.members.map(member => APP.renderEntry(member, undefined, mounted)),
			);

			return fieldset;
		}

		// Mount/siblings items may be bare (shown while checked, for
		// checkbox/radio) or wrapped as {wizard, test} - same convention as
		// wizards. Unlike wizards they don't stay adjacent to their
		// controller in the DOM (mount ends up at the end of the form,
		// siblings right after this control but still a plain sibling, not
		// nested in any fieldset), so each rendered node is tagged with the
		// controller's id + its rule's index instead, for syncWizards to
		// find later.
		const tag = (attr, i, node) => {
			const nodes =
				node instanceof DocumentFragment ? Array.from(node.children) : [node];

			nodes.forEach(n => {
				n.dataset[attr] = entry.id;
				n.dataset.ruleIndex = i;
			});

			return node;
		};

		(entry.mount || []).forEach((r, i) => {
			const node = APP.renderEntry(r.wizard || r, r.wizard ? r : {}, mounted);
			mounted.push(tag("mountedBy", i, node));
		});

		const siblings = (entry.siblings || []).map((r, i) => {
			const node = APP.renderEntry(r.wizard || r, r.wizard ? r : {}, mounted);
			return tag("siblingOf", i, node);
		});

		if (!(entry.wizards && entry.wizards.length && entry.type !== "textarea")) {
			const control = APP.renderFormControl(entry, rule);

			if (!siblings.length) {
				return control;
			}

			const group = document.createDocumentFragment();
			group.append(control, ...siblings);
			return group;
		}

		const fieldset = document.createElement("fieldset");
		fieldset.dataset.type = entry.type;

		if (rule) {
			fieldset.hidden = true;
		}

		const children = entry.wizards.map(r =>
			// checkbox/radio wizard items may be bare (shown while checked) or
			// wrapped as {wizard, test} with an explicit boolean test
			APP.renderEntry(r.wizard || r, r.wizard ? r : {}, mounted),
		);

		// A checkbox/radio controller never gets its own box regardless of
		// nesting (see the :has(input[type=checkbox],[type=radio]) rule),
		// so unlike other control types there's no double-boxing to avoid
		// by nesting it inside the fieldset - and rendering it as a
		// preceding sibling instead means the fieldset's own boxed "shell"
		// can be hidden entirely while nothing is currently eligible to
		// reveal (see the dataset.type check in syncWizards below), without
		// also hiding the controller itself. Both the controller and the
		// fieldset are forced full-width so a wizard-controlling checkbox
		// always claims its own row, rather than a partial-width fieldset
		// landing in the middle of a row an adjacent control was sharing
		// with the checkbox. A plain (non-wizard) checkbox still respects
		// entry.width as normal.
		if (["checkbox", "radio"].includes(entry.type)) {
			fieldset.className = "wizard w-1";
			fieldset.append(...children);

			const controller = APP.renderFormControl(
				Object.assign({}, entry, { width: 1 }),
				rule,
			);
			const group = document.createDocumentFragment();
			group.append(controller, fieldset, ...siblings);

			return group;
		}

		fieldset.className = `wizard w-${entry.width || 1}`;
		fieldset.append(
			APP.renderFormControl(Object.assign({}, entry, { width: 1 })),
			...children,
		);

		if (!siblings.length) {
			return fieldset;
		}

		const group = document.createDocumentFragment();
		group.append(fieldset, ...siblings);
		return group;
	},

	renderEntries: entries => {
		const mounted = [];
		const fragment = document.createDocumentFragment();
		fragment.append(
			...entries.map(entry => APP.renderEntry(entry, undefined, mounted)),
		);
		fragment.append(...mounted);
		return fragment;
	},

	// Records persist across browser restarts, but only for the current
	// calendar day (America/New_York, matching the submitted-at display) —
	// a fresh day starts a fresh collection rather than showing stale rows.
	today: () => {
		return new Date().toLocaleDateString("en-CA", {
			timeZone: "America/New_York",
		});
	},

	// Shared google.script.run envelope: overlay toggle, { success, data,
	// error } unwrap, and a `${prefix}${message}` toast on either failure path.
	runServer: (
		method,
		args,
		{ loading = true, variant = "caution", prefix = "", onData },
	) => {
		const fail = message => {
			if (loading) {
				APP.loading = false;
			}

			APP.toast(`${prefix}${message}`, variant);
		};

		if (loading) {
			APP.loading = true;
		}

		google.script.run
			.withSuccessHandler(response => {
				if (!response.success) {
					fail(response.error.message);
					return;
				}

				if (loading) {
					APP.loading = false;
				}

				onData(response.data);
			})
			.withFailureHandler(error => fail(error.message))
			[method](...args);
	},

	toggleDropdown: (target, open = undefined) => {
		const opened = target.classList.toggle("open", open);

		target
			.querySelector(".dropdown-button")
			?.setAttribute("aria-expanded", opened ? "true" : "false");

		return opened;
	},

	_internals: {
		confirmDetail: undefined,
		get records() {
			const stored = JSON.parse(
				localStorage.getItem(APP.RECORDS_STORAGE_KEY) ?? "null",
			);

			return stored?.date === APP.today() ? stored.records : [];
		},
		workflow: undefined,
		bus: {
			_handlers: new Map(),
			clear(event) {
				if (event === undefined) {
					this._handlers.clear();
					return;
				}

				this._handlers.delete(event);
			},
			next(event, callback) {
				const unsubscribe = this.subscribe(event, payload => {
					unsubscribe();
					callback(payload);
				});

				return unsubscribe;
			},
			publish(event, payload) {
				const handlers = this._handlers.get(event);

				if (handlers === undefined) {
					return;
				}

				for (const handler of [...handlers]) {
					handler(payload);
				}
			},
			subscribe(event, callback) {
				if (!this._handlers.get(event)) {
					this._handlers.set(event, new Set());
				}

				this._handlers.get(event)?.add(callback);

				return () => {
					this.unsubscribe(event, callback);
				};
			},
			unsubscribe(event, callback) {
				const handlers = this._handlers.get(event);

				if (!handlers) {
					return;
				}

				handlers.delete(callback);

				if (!handlers.size) {
					this._handlers.delete(event);
				}
			},
		},
		dependenciesMet: (dependencies = new Map(), targetForm = APP.form) => {
			const data = new FormData(targetForm);

			for (const [name, test] of dependencies) {
				if (!targetForm.elements.namedItem(name)) {
					console.warn(`Dependency references unknown control "${name}"`);
				}

				if (!APP._internals.match(test, data.getAll(name))) {
					return false;
				}
			}

			return true;
		},
		feedback: {
			records: undefined,
			syncRecords: () => {
				if (!APP.feedbackForm) {
					return;
				}

				APP.runServer("getFeedback", [], {
					loading: false,
					variant: "warning",
					prefix: "Couldn't load feedback records: ",
					onData: records => {
						APP._internals.feedback.records = records;
					},
				});
			},
		},
		form: {
			get checkboxes() {
				return this.inputs.filter(control => control.type === "checkbox");
			},
			get charCount() {
				return this.copyText.length;
			},
			get copyText() {
				const rowText = this.preview
					.map(([, label, value]) => `${label}: ${value}`)
					.join(" | ");
				const department = APP.activeFlowLink?.textContent?.trim() || "";
				const prefix = APP.workflow && typeof APP.workflow === "object"
					? [department, APP.workflowLabel]
					: [`${department} (${APP.workflowLabel})`];

				return rowText
					? [...prefix, rowText].filter(Boolean).join(" | ")
					: "";
			},
			get currencyInputs() {
				return this.inputs.filter(
					control => control.dataset.type === "currency",
				);
			},
			get dateInputs() {
				return this.inputs.filter(control => control.type === "date");
			},
			get datetimeInputs() {
				return this.inputs.filter(control => control.type === "datetime-local");
			},
			get dropdowns() {
				return this.elements.filter(
					control => control instanceof HTMLSelectElement,
				);
			},
			get elements() {
				return Array.from(APP.form?.elements ?? []);
			},
			get emailInputs() {
				return this.inputs.filter(control => control.type === "email");
			},
			get fieldsets() {
				return this.elements.filter(
					control =>
						control instanceof HTMLFieldSetElement &&
						!control.classList.contains("wizard") &&
						!control.classList.contains("list"),
				);
			},
			get formControls() {
				return [...this.inputs, ...this.dropdowns, ...this.textAreas];
			},
			get inputs() {
				return this.elements.filter(
					control => control instanceof HTMLInputElement,
				);
			},
			get listboxes() {
				return this.dropdowns.filter(control => control.multiple);
			},
			get lists() {
				return this.elements.filter(
					control =>
						control instanceof HTMLFieldSetElement &&
						control.classList.contains("list"),
				);
			},
			resetLists() {
				this.lists.forEach(list => {
					list.querySelectorAll(".list-remove").forEach(button => {
						button.closest("li")?.remove();
					});
				});
			},
			get numberInputs() {
				return this.inputs.filter(
					control =>
						control.type === "number" && control.dataset.type !== "currency",
				);
			},
			get passwordInputs() {
				return this.inputs.filter(control => control.type === "password");
			},
			get preview() {
				const rows = [];

				for (const control of this.elements) {
					if (control instanceof HTMLFieldSetElement) {
						if (
							!this.lists.includes(control) ||
							!control.dataset.name ||
							control.disabled
						) {
							continue;
						}

						const values = Array.from(control.querySelectorAll("input"))
							.map(input => input.value.trim())
							.filter(Boolean);

						if (!values.length) {
							continue;
						}

						const label = control
							.querySelector(".label-text")
							?.textContent?.trim();

						const group = control
							.closest("fieldset:not(.wizard):not(.list)")
							?.querySelector(":scope > legend")
							?.textContent?.trim();

						rows.push([
							group,
							label || control.dataset.name,
							values.map(v => `- ${v}`).join("\n"),
						]);

						continue;
					}

					if (control.closest("fieldset.list") || !control.name || control.disabled) {
						continue;
					}

					let value;

					if (["checkbox", "radio"].includes(control.type)) {
						if (!control.checked) {
							continue;
						}

						value =
							["checkbox", "radio"].includes(control.type)
								? this.resolveValueReferences(control.value, control)
								: control.value;
					} else if (control.tagName === "SELECT") {
						if (control.multiple) {
							value = Array.from(control.selectedOptions)
								.map(option =>
									/!\{#[^}]+\}/.test(option.value)
										? this.resolveValueReferences(option.value, control)
										: option.textContent.trim(),
								)
								.filter(Boolean)
								.join(", ");
						} else {
							const option = control.selectedOptions[0];
							value = option?.value
								? /!\{#[^}]+\}/.test(option.value)
									? this.resolveValueReferences(option.value, control)
									: option.textContent.trim()
								: "";
						}
					} else {
						value = control.value;
					}

					value = value.trim();

					if (!value) {
						continue;
					}

					const footnote = APP.rules.footnoteRules[control.name]
						?.filter(r =>
							APP._internals.match(r.test, APP._internals.getValue(control)),
						)
						.map(r => this.resolveValueReferences(r.footnote, control))
						.join(" ");

					if (footnote) {
						value = `${value} (${footnote})`;
					}

					const label = control
						.closest(".form-control")
						?.querySelector(".label-text")
						?.textContent?.trim();

					const group = control
						.closest("fieldset:not(.wizard):not(.list)")
						?.querySelector(":scope > legend")
						?.textContent?.trim();

					if (control.type === "checkbox" && value === "true") {
						rows.push([group, "", label || control.name]);
					} else {
						rows.push([group, label || control.name, value]);
					}
				}

				return rows;
			},
			get radios() {
				return this.inputs.filter(control => control.type === "radio");
			},
			get searchInputs() {
				return this.inputs.filter(control => control.type === "search");
			},
			get selects() {
				return this.dropdowns.filter(control => !control.multiple);
			},
			get telInputs() {
				return this.inputs.filter(control => control.type === "tel");
			},
			get textAreas() {
				return this.elements.filter(
					control => control instanceof HTMLTextAreaElement,
				);
			},
			get textInputs() {
				return this.inputs.filter(control => control.type === "text");
			},
			get timeInputs() {
				return this.inputs.filter(control => control.type === "time");
			},
			get urlInputs() {
				return this.inputs.filter(control => control.type === "url");
			},
			resolveValueReferences(value, control) {
				if (typeof value !== "string") {
					return value;
				}

				return value.replaceAll(/!\{#([^}]+)\}/g, (token, id) => {
					const source = Array.from(
						control.form?.querySelectorAll("input, select, textarea") ?? [],
					).find(candidate => candidate.id === id);

					return source?.value ? source.value : token;
				});
			},
			renderPreview() {
				const rows = APP._internals.form.preview;
				let currentGroup;

				APP.previewList.replaceChildren(
					...rows.flatMap(([group, label, value]) => {
						const elements = [];

						if (group && group !== currentGroup) {
							const heading = document.createElement("dt");
							heading.className = "preview-group";
							heading.textContent = group;
							elements.push(heading);
						}

						currentGroup = group;

						if (label) {
							const term = document.createElement("dt");
							term.textContent = label;
							elements.push(term);
						}

						const detail = document.createElement("dd");
						detail.textContent = value;

						elements.push(detail);

						return elements;
					}),
				);

				APP.copyPreview.disabled = rows.length === 0;
			},
			syncAlerts(targetForm = APP.form) {
				const isFeedback = targetForm === APP.feedbackForm;
				const rules = isFeedback
					? APP.rules.feedbackAlertRules
					: APP.rules.alertRules;

				targetForm.querySelectorAll(".control-alerts").forEach(container => {
					const name = container.dataset.name;
					const activeRules = rules[name];
					const control = document.getElementById(
						container.dataset.controlId,
					);

					if (!activeRules || !control) {
						return;
					}

					const values = APP._internals.getValue(control, targetForm);

					container.replaceChildren();

					activeRules
						.filter(
							r =>
								APP._internals.match(r.test, values) &&
								APP._internals.dependenciesMet(
									new Map(r.dependencies),
									targetForm,
								),
						)
						.forEach(r => {
							container.insertAdjacentHTML(
								"beforeend",
								APP._internals.alertMarkup(r.alert),
							);
						});
				});
			},
			syncModals(e) {
				const target = e?.target;

				if (!target?.name) {
					return;
				}

				const activeRules = (
					target.form === APP.feedbackForm
						? APP.rules.feedbackModalRules
						: APP.rules.modalRules
				)[target.name];

				if (!activeRules) {
					return;
				}

				const values = APP._internals.getValue(target);
				const rule = activeRules.find(
					r =>
						APP._internals.match(r.test, values) &&
						APP._internals.dependenciesMet(
							new Map(r.dependencies),
							target.form,
						),
				);

				if (!rule) {
					return;
				}

				APP._internals.showModal(rule.modal);
			},
			syncWizards(e, targetForm = APP.form) {
				const syncFieldset = fieldset => {
					// A checkbox/radio controller renders as the fieldset's
					// preceding sibling; every other control type still renders
					// as its first child (see renderEntry).
					const external = ["checkbox", "radio"].includes(
						fieldset.dataset.type,
					);
					const controller = external
						? fieldset.previousElementSibling
						: fieldset.querySelector(":scope > .form-control");
					const control = document.getElementById(controller?.htmlFor ?? "");

					if (!control?.name) {
						return;
					}

					const values = APP._internals.getValue(control, targetForm);
					const activeRules =
						(targetForm === APP.feedbackForm
							? APP.rules.feedbackWizardRules
							: APP.rules.wizardRules)[control.name] || [];

					const wizards = Array.from(
						fieldset.querySelectorAll(
							":scope > :is(.form-control, fieldset.wizard, fieldset.list)",
						),
					);

					const targets = external ? wizards : wizards.slice(1);

					targets.forEach((wizard, i) => {
						const rule = activeRules[i] || {};
						const show =
							APP._internals.match(rule.test, values) &&
							APP._internals.dependenciesMet(
								new Map(rule.dependencies),
								targetForm,
							);

						wizard.hidden = !show;

						if (wizard instanceof HTMLFieldSetElement) {
							wizard.disabled = !show;

							if (show) {
								syncFieldset(wizard);
							}
						} else {
							wizard
								.querySelectorAll("input, select, textarea")
								.forEach(control => (control.disabled = !show));
						}
					});

					if (!external) {
						return;
					}

					// Nothing eligible to reveal right now: collapse (and disable,
					// so nothing inside can still submit a stale value) the whole
					// shell instead of leaving an empty boxed fieldset visible
					// next to the controller. Only applies to the external
					// (checkbox/radio) case - the controller is this fieldset's
					// own first child otherwise, and hiding the fieldset would
					// hide the controller too.
					const anyShown = targets.some(wizard => !wizard.hidden);
					fieldset.hidden = !anyShown;
					fieldset.disabled = !anyShown;
				};

				// Mount/siblings targets don't stay adjacent to their
				// controller in the DOM the way a nested wizard fieldset's
				// children do, so they're found by the data-mounted-by/
				// data-sibling-of + rule index tags renderEntry sets on
				// them instead of DOM position. Rule counts here are small
				// (a handful of gating controls per form), so re-evaluating
				// all of them on every call is cheap - simpler than
				// replicating the fieldset-adjacency filtering below in
				// attribute-lookup form.
				const syncPlaced = (selector, dataKey, rules, feedbackRules) => {
					targetForm?.querySelectorAll(selector).forEach(node => {
						const control = document.getElementById(node.dataset[dataKey]);

						if (!control?.name) {
							return;
						}

						const values = APP._internals.getValue(control, targetForm);
						const activeRules =
							(targetForm === APP.feedbackForm ? feedbackRules : rules)[
								control.name
							] || [];
						const rule = activeRules[node.dataset.ruleIndex] || {};
						const show =
							APP._internals.match(rule.test, values) &&
							APP._internals.dependenciesMet(
								new Map(rule.dependencies),
								targetForm,
							);

						node.hidden = !show;

						if (node instanceof HTMLFieldSetElement) {
							node.disabled = !show;
						} else {
							node
								.querySelectorAll("input, select, textarea")
								.forEach(control => (control.disabled = !show));
						}
					});
				};

				syncPlaced(
					"[data-mounted-by]",
					"mountedBy",
					APP.rules.mountRules,
					APP.rules.feedbackMountRules,
				);
				syncPlaced(
					"[data-sibling-of]",
					"siblingOf",
					APP.rules.siblingsRules,
					APP.rules.feedbackSiblingsRules,
				);

				const wizards = Array.from(
					targetForm?.querySelectorAll("fieldset.wizard") ?? [],
				);

				const target = e?.target;

				if (!target) {
					wizards
						.filter(
							fieldset => !fieldset.parentElement?.closest("fieldset.wizard"),
						)
						.forEach(syncFieldset);
					return;
				}

				wizards
					.filter(fieldset => {
						const external = ["checkbox", "radio"].includes(
							fieldset.dataset.type,
						);
						const controller = external
							? fieldset.previousElementSibling
							: fieldset.querySelector(":scope > .form-control");

						return controller?.htmlFor === target.id;
					})
					.forEach(syncFieldset);
			},
		},
		getValue: (control, targetForm = APP.form) => {
			if (["checkbox", "radio"].includes(control.type)) {
				return control.checked ? [control.value] : [];
			}

			return control.multiple
				? new FormData(targetForm).getAll(control.name)
				: [control.value];
		},
		match: (test, values) => {
			if (test === undefined) {
				return values.length > 0;
			}

			if (typeof test === "boolean") {
				return values.length > 0 === test;
			}

			const match = /^\/(.*)\/([a-z]*)$/.exec(test);

			return values.some(v =>
				match ? new RegExp(match[1], match[2]).test(v) : v === test,
			);
		},
		alertMarkup: ({ variant, message }) =>
			marked.parse(
				`> [!${variant.toUpperCase()}]\n> ${message.replaceAll("\n", "\n> ")}`,
			),
		prepareModal: (dialog, headerElement, messageElement, content) => {
			const { header, message, variant } = content;
			headerElement.innerHTML = marked.parseInline(header);
			APP.parse(messageElement, message);

			for (const name of ["note", "tip", "important", "warning", "caution"]) {
				dialog.classList.toggle(`modal-${name}`, name === variant);
			}
		},
		showModal: modal => {
			if (modal?.type === "message") {
				APP.notify(modal.message, modal);
			} else if (modal?.type === "confirm") {
				APP.confirm(modal.message, modal);
			} else {
				return false;
			}

			return true;
		},
	},

	// Public proxies onto _internals — third parties (each app's own
	// Client.html) call these instead of reaching into _internals directly.
	get records() {
		return APP._internals.records;
	},
	syncFeedbackRecords: () => {
		APP._internals.feedback.syncRecords();
	},
	showModal: modal => {
		return APP._internals.showModal(modal);
	},
	match: (test, values) => {
		return APP._internals.match(test, values);
	},
	get formHelpers() {
		return APP._internals.form;
	},

	context: {
		get recordsMessage() {
			return APP.recordsList?.textContent;
		},
		set recordsMessage(text) {
			APP.parse(APP.recordsList, text);
		},
		get headingList() {
			return getHeadingList();
		},
	},
	navigator: {
		selectTab: id => {
			APP.tabs.forEach(tab => {
				const selected = tab.dataset.tabId === id;
				tab.setAttribute("aria-selected", selected ? "true" : "false");
				tab.tabIndex = selected ? 0 : -1;
				document.getElementById(tab.dataset.tabId).hidden = !selected;
			});

			APP.publish("tab:change", { id });
		},
	},
	get loading() {
		return this.overlay.classList.contains("active");
	},
	set loading(loading) {
		this.publish(loading ? "overlay:show" : "overlay:hide");
	},
	get theme() {
		const stored = localStorage.getItem(this.THEME_STORAGE_KEY);

		return stored === "dark" ||
			(stored === null &&
				window.matchMedia("(prefers-color-scheme: dark)").matches)
			? "dark"
			: "light";
	},
	set theme(mode) {
		const theme = mode === "dark" ? "dark" : "light";
		document.documentElement.dataset.theme = theme;
		localStorage.setItem(this.THEME_STORAGE_KEY, theme);
	},
	alert: (key, content) => {
		const root =
			key === "app"
				? APP.appAlerts
				: key === "feedback"
					? APP.feedbackAlerts
					: APP.formAlerts;
		const alerts = root.querySelectorAll(".markdown-alert");

		if (alerts.length >= 2) {
			alerts[alerts.length - 1].remove();
		}

		root.insertAdjacentHTML("afterbegin", APP._internals.alertMarkup(content));
	},
	confirm: (
		message,
		{
			header = "Confirm Action",
			confirmText = "OK",
			cancelText = "Cancel",
			variant,
			detail,
			action,
		} = {},
	) => {
		APP._internals.prepareModal(
			APP.confirmModal,
			APP.confirmModalHeader,
			APP.confirmModalMessage,
			{ header, message, variant },
		);
		APP.confirmModalConfirm.textContent = confirmText;
		APP.confirmModalCancel.textContent = cancelText;

		if (action) {
			APP.form.action = action;
		} else {
			APP.form.removeAttribute("action");
		}

		APP._internals.confirmDetail = detail;
		APP.confirmModal.returnValue = "";
		APP.confirmModal.showModal();
		APP.publish("modal:opened");
	},
	next: (event, callback) => {
		return APP._internals.bus.next(event, callback);
	},
	notify: (
		message,
		{ header = "Notice", dismissText = "OK", variant } = {},
	) => {
		APP._internals.prepareModal(
			APP.messageModal,
			APP.messageModalHeader,
			APP.messageModalMessage,
			{ header, message, variant },
		);
		APP.messageModalDismiss.textContent = dismissText;
		APP.messageModal.showModal();
		APP.publish("modal:opened");
	},
	parse: (root, markdown) => {
		root.innerHTML = marked.parse(markdown);

		for (let l = 1; l <= 6; l++) {
			root.querySelectorAll(`h${l}[id]`).forEach(heading => {
				heading.id = `${root.id}-${heading.id}`;
			});
		}
	},
	publish: (event, payload) => {
		APP._internals.bus.publish(event, payload);
	},
	subscribe: (event, callback) => {
		return APP._internals.bus.subscribe(event, callback);
	},
	toast: (message, variant = "note") => {
		const toast = document.createElement("div");
		toast.className = `toast toast-${variant} open`;
		toast.setAttribute("role", "status");

		const icon = document.createElement("i");
		icon.className = "toast-icon";
		icon.setAttribute("aria-hidden", "true");

		const text = document.createElement("span");
		text.textContent = message;

		toast.append(icon, text);
		APP.toastContainer.append(toast);
		APP.toastContainer.classList.add("open");

		setTimeout(() => {
			toast.remove();
			if (!APP.toastContainer.childElementCount) {
				APP.toastContainer.classList.remove("open");
			}
		}, 3000);
	},
	unsubscribe: (event, callback) => {
		APP._internals.bus.unsubscribe(event, callback);
	},
};
