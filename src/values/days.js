const DAY_MS = 24 * 60 * 60 * 1000;

const parseISODate = value => {
	if (typeof value !== "string") {
		return null;
	}

	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

	if (!match) {
		return null;
	}

	const [, yearText, monthText, dayText] = match;
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	const date = new Date(Date.UTC(year, month - 1, day));

	return date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
		? date
		: null;
};

const toISODate = date => date.toISOString().slice(0, 10);

const isWeekend = date => {
	const day = date.getUTCDay();

	return day === 0 || day === 6;
};

const countBusinessDays = (start, end, isHoliday) => {
	let elapsed = 0;

	for (
		let date = new Date(start.getTime() + DAY_MS);
		date <= end;
		date = new Date(date.getTime() + DAY_MS)
	) {
		if (!isWeekend(date) && !isHoliday(toISODate(date))) {
			elapsed += 1;
		}
	}

	return elapsed;
};

export const DAYS = {
	/**
	 * Counts whole calendar or business days elapsed from start through end.
	 * Business-day counting excludes the start date and includes the end date.
	 *
	 * @param {string} start - ISO calendar date (`YYYY-MM-DD`).
	 * @param {string} end - ISO calendar date (`YYYY-MM-DD`).
	 * @param {{ businessDays?: boolean, isHoliday?: (isoDate: string) => boolean }} [options] - Counting policy.
	 * @returns {number} Signed elapsed days, or NaN when either date is invalid.
	 */
	daysElapsed(start, end, { businessDays = false, isHoliday = () => false } = {}) {
		const startDate = parseISODate(start);
		const endDate = parseISODate(end);

		if (!startDate || !endDate) {
			return Number.NaN;
		}

		const elapsed = (endDate.getTime() - startDate.getTime()) / DAY_MS;

		if (!businessDays || elapsed === 0) {
			return elapsed;
		}

		return elapsed > 0
			? countBusinessDays(startDate, endDate, isHoliday)
			: -countBusinessDays(endDate, startDate, isHoliday);
	},
};