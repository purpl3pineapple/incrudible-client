// incrudible-client — shared client framework for InCRUDibly-based Apps
// Script apps. `APP` is the only export; it's the house for everything
// (DOM accessors as live getters, render helpers, rule state), so a
// consumer only ever needs `import { APP } from "incrudible-client";`.
// This module has no knowledge of any single app's workflow-acquisition
// logic (free-text search vs. a fixed link list) — that stays in each
// app's own Client.html, calling into APP.

const APP = {
	THEME_STORAGE_KEY: "[incrudible:theme]",
	RECORDS_STORAGE_KEY: "[incrudible:records]",

	get topnav() { return document.getElementById("topnav"); },
	get topnavToggle() { return document.getElementById("topnav-collapse-toggle"); },
	get dropdowns() { return Array.from(document.querySelectorAll(".nav-dropdown")); },
	get sidenav() { return document.getElementById("sidenav"); },
	get sidenavClose() { return document.getElementById("close-sidenav"); },
	get sideNavControllers() {
		return [
			document.getElementById("open-sidenav"),
			...document.querySelectorAll(
				`:is(button, a)[data-drawer-target="${this.sidenav.id}"]`,
			),
		];
	},
	get notepad() { return document.getElementById("notepad"); },
	get notepadHandle() { return document.getElementById("notepad-handle"); },
	get closeNotepad() { return document.getElementById("close-notepad"); },
	get openNotepad() { return document.getElementById("open-notepad"); },
	get confirmModal() { return document.getElementById("confirm-modal"); },
	get confirmModalClose() { return document.getElementById("confirm-modal-close"); },
	get confirmModalCancel() { return document.getElementById("confirm-modal-cancel-button"); },
	get confirmModalConfirm() { return document.getElementById("confirm-modal-confirm-button"); },
	get messageModal() { return document.getElementById("message-modal"); },
	get messageModalClose() { return document.getElementById("message-modal-close"); },
	get messageModalDismiss() { return document.getElementById("message-modal-dismiss-button"); },
	get feedbackDrawer() { return document.getElementById("feedback-drawer"); },
	get openFeedbackDrawer() { return document.getElementById("open-feedback-drawer"); },
	get closeFeedbackDrawer() { return document.getElementById("close-feedback-drawer"); },
	get form() { return document.getElementById("app-form"); },
	get feedbackForm() { return document.getElementById("feedback-form"); },
	get feedbackFormControls() { return document.getElementById("feedback-form-controls"); },
	get appAlerts() { return document.getElementById("app-alerts"); },
	get formAlerts() { return document.getElementById("form-alerts"); },
	get feedbackAlerts() { return document.getElementById("feedback-alerts"); },
	get tablist() { return document.querySelector('[role="tablist"]'); },
	get tabs() { return Array.from(this.tablist?.querySelectorAll('[role="tab"]') ?? []); },
	get formControls() { return document.getElementById("form-controls"); },
	get recordsList() { return document.getElementById("records-list"); },
	get overlay() { return document.getElementById("app-overlay"); },
	get formPreview() { return document.getElementById("form-preview"); },
	get previewList() { return document.getElementById("preview-list"); },
	get copyPreview() { return document.getElementById("copy-preview"); },
	get departmentBrand() { return document.querySelector(".brand"); },
	get toastContainer() { return document.getElementById("toast-container"); },
	get themeToggle() { return document.getElementById("theme-toggle"); },
	get messageModalHeader() { return document.getElementById("message-modal-header"); },
	get messageModalMessage() { return document.getElementById("message-modal-message"); },
	get confirmModalHeader() { return document.getElementById("confirm-modal-header"); },
	get confirmModalMessage() { return document.getElementById("confirm-modal-message"); },

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
		feedbackWizardRules: {},
		feedbackAlertRules: {},
		feedbackModalRules: {},
	},

	renderFormControl: (entry, rule) => {
		const v = entry.constraints || {};
		const val = entry.defaultValue;
		// Elements are serialized to HTML at the end, so defaults must land
		// on attribute-backed properties (defaultValue/defaultChecked/
		// defaultSelected), not the live ones outerHTML would drop.
		const applyShared = element => {
			element.id = entry.id;
			element.name = entry.name;

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
			case "currency":
			case "number":
			case "date": {
				const input = document.createElement("input");
				input.type = entry.type === "currency" ? "number" : entry.type;

				if (entry.type === "currency" || entry.type === "number") {
					input.dataset.type = entry.type;
				}

				applyShared(input);

				if (val != null) {
					input.defaultValue = val;
				}

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

				if (v.minLength != null) {
					input.minLength = v.minLength;
				}

				if (v.maxLength != null) {
					input.maxLength = v.maxLength;
				}

				if (v.pattern) {
					input.pattern = v.pattern;
				}

				if (v.min != null) {
					input.min = v.min;
				}

				if (v.max != null) {
					input.max = v.max;
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
				select.name = entry.name;

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
					const selected = Array.isArray(val)
						? val.indexOf(option.value) !== -1
						: option.value === val;

					const element = document.createElement("option");
					element.value = option.value;

					if (!option.value) {
						element.className = "select-placeholder";
					}

					if (selected) {
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
			tooltip.append("?");

			const tooltipText = document.createElement("span");
			tooltipText.className = "tooltip-text";
			tooltipText.innerHTML = entry.hint;

			tooltip.append(tooltipText);
			toolbar.append(tooltip);
		}

		label.append(toolbar, fragment);

		return label;
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

	renderEntry: (entry, rule) => {
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

			fieldset.append(legend, APP.renderEntries(entry.members));

			return fieldset;
		}

		if (
			!(entry.wizards && entry.wizards.length && entry.type !== "textarea")
		) {
			return APP.renderFormControl(entry, rule);
		}

		const fieldset = document.createElement("fieldset");
		fieldset.className = `wizard w-${entry.width || "auto"}`;

		if (rule) {
			fieldset.hidden = true;
		}

		const children = entry.wizards.map(r =>
			// checkbox/radio wizard items may be bare (shown while checked) or
			// wrapped as {wizard, test} with an explicit boolean test
			APP.renderEntry(r.wizard || r, r.wizard ? r : {}),
		);

		fieldset.append(
			APP.renderFormControl(Object.assign({}, entry, { width: 1 })),
			...children,
		);

		return fieldset;
	},

	renderEntries: entries => {
		const fragment = document.createDocumentFragment();
		fragment.append(...entries.map(entry => APP.renderEntry(entry)));
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
			get currencyInputs() {
				return this.inputs.filter(
					control => control.dataset.type === "currency",
				);
			},
			get dateInputs() {
				return this.inputs.filter(control => control.type === "date");
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
			get formControls() {
				return [
					...this.inputs,
					...this.dropdowns,
					...this.textAreas,
				]
			},
			get inputs() {
				return this.elements.filter(
					control => control instanceof HTMLInputElement,
				);
			},
			get listboxes() {
				return this.dropdowns.filter(control => control.multiple);
			},
			get numberInputs() {
				return this.inputs.filter(
					control =>
						control.type === "number" &&
						control.dataset.type !== "currency",
				);
			},
			get passwordInputs() {
				return this.inputs.filter(control => control.type === "password");
			},
			get preview() {
				const data = new FormData();
				const current = new FormData(APP.form);

				for (const control of APP.form.elements) {
					if (!control.name || control.disabled) {
						continue;
					}

					let value;

					if (control.type === "checkbox" || control.type === "radio") {
						if (!control.checked) {
							continue;
						}

						value = control.value === "on" ? "Yes" : control.value;
					} else if (control.tagName === "SELECT") {
						if (control.multiple) {
							value = Array.from(control.selectedOptions)
								.map(option => option.textContent.trim())
								.filter(Boolean)
								.join(", ");
						} else {
							const option = control.selectedOptions[0];
							value =
								option && option.value ? option.textContent.trim() : "";
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
							APP._internals.match(r.test, current.getAll(control.name)),
						)
						.map(r => r.footnote)
						.join(" ");

					if (footnote) {
						value = `${value} (${footnote})`;
					}

					const label = control
						.closest(".form-control")
						?.querySelector(".label-text")
						?.textContent?.trim();

					data.append(label || control.name, value);
				}

				return [...data];
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
			get urlInputs() {
				return this.inputs.filter(control => control.type === "url");
			},
			renderPreview() {
				const rows = APP._internals.form.preview;

				APP.previewList.replaceChildren(
					...rows.flatMap(([label, value]) => {
						const term = document.createElement("dt");
						term.textContent = label;

						const detail = document.createElement("dd");
						detail.textContent = value;

						return [term, detail];
					}),
				);

				APP.copyPreview.disabled = rows.length === 0;
			},
			syncAlerts(e) {
				const target = e?.target;

				if (!target?.name) {
					return;
				}

				const isFeedback = target.form === APP.feedbackForm;
				const activeRules = (isFeedback
					? APP.rules.feedbackAlertRules
					: APP.rules.alertRules)[target.name];

				if (!activeRules) {
					return;
				}

				const values = APP._internals.getValue(target);

				activeRules
					.filter(
						r =>
							APP._internals.match(r.test, values) &&
							APP._internals.dependenciesMet(
								new Map(r.dependencies),
								target.form,
							),
					)
					.forEach(r => {
						APP.alert(isFeedback ? "feedback" : "form", r.alert);
					});
			},
			syncModals(e) {
				const target = e?.target;

				if (!target?.name) {
					return;
				}

				const activeRules = (target.form === APP.feedbackForm
					? APP.rules.feedbackModalRules
					: APP.rules.modalRules)[target.name];

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
					const controller = fieldset.querySelector(":scope > .form-control");
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
							":scope > :is(.form-control, fieldset.wizard)",
						),
					).slice(1);

					wizards.forEach((wizard, i) => {
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
				};

				const wizards = Array.from(
					targetForm?.querySelectorAll("fieldset.wizard") ?? [],
				);

				const target = e?.target;

				if (!target) {
					wizards
						.filter(
							fieldset =>
								!fieldset.parentElement?.closest("fieldset.wizard"),
						)
						.forEach(syncFieldset);
					return;
				}

				wizards
					.filter(fieldset => {
						const controller = fieldset.querySelector(
							":scope > .form-control",
						);

						return controller?.htmlFor === target.id;
					})
					.forEach(syncFieldset);
			},
		},
		getValue: (control, targetForm = APP.form) => {
			return control.type === "checkbox" ||
				control.type === "radio" ||
				control.multiple
				? new FormData(targetForm).getAll(control.name)
				: [control.value];
		},
		match: (test, values) => {
			if (test === undefined) {
				return values.length > 0;
			}

			if (typeof test === "boolean") {
				return (values.length > 0) === test;
			}

			const match = /^\/(.*)\/([a-z]*)$/.exec(test);

			return values.some(v =>
				match ? new RegExp(match[1], match[2]).test(v) : v === test,
			);
		},
		prepareModal: (dialog, headerElement, messageElement, content) => {
			const { header, message, variant } = content;
			headerElement.innerHTML = marked.parseInline(header);
			APP.parse(messageElement, message);

			for (const name of [
				"note",
				"tip",
				"important",
				"warning",
				"caution",
			]) {
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
	alert: (key, { variant, message }) => {
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

		root.insertAdjacentHTML(
			"afterbegin",
			marked.parse(
				`> [!${variant.toUpperCase()}]\n> ${message.replaceAll("\n", "\n> ")}`,
			),
		);
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

export { APP };
