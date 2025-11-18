const XLSX_CALC = require("@baselinelending/xlsx-calc");
const formulajs = require("@formulajs/formulajs");
XLSX_CALC.import_functions(formulajs);

const Mustache = require("mustache");

function parse(formula, customTags) {
	const parsed = Mustache.parse(formula, customTags);
	return [
		...new Set(
			parsed.filter(([type]) => type === "name").map(([type, text]) => text)
		),
	];
}

function calculate(
	formula,
	variables = {},
	customTags = ["{{", "}}"],
	suppress_errors = true
) {
	const is_function = typeof variables === "function";

	const vars = is_function ? {} : { ...variables };

	// Find missing variables
	parse(formula, customTags).map(variable => {
		function hasProperty(obj, prop) {
			const levels = prop.split(".");
			if (levels.length === 1) {
				if (Array.isArray(obj)) {
					return prop in obj[0];
				} else {
					return prop in obj;
				}
			} else {
				const [first, ...rest] = levels;
				return hasProperty(obj[first], rest.join("."));
			}
		}

		if (is_function) {
			try {
				vars[variable] = variables(variable);
			} catch (e) {
				throw {
					message: `Missing variable: ${variable}`,
					variable,
				};
			}
		} else if (!hasProperty(vars, variable)) {
			throw {
				message: `Missing variable: ${variable}`,
				variable,
			};
		}
	});

	const parsed = Mustache.parse(formula, customTags);

	// Look for any arrays in the formula that will be converted to ranges
	// of cells later on
	const substituted_formula = parsed
		.reduce((acc, [type, text, start, end]) => {
			switch (type) {
				case "name":
					function clean(text, subvars, original) {
						const dots = is_function ? [text] : text.split(".");
						const variable = dots[0];

						if (
							dots.length == 2 &&
							subvars[variable] &&
							Array.isArray(subvars[variable])
						) {
							const value = subvars[variable].map(o => o[dots[1]]);
							subvars[variable] = {
								[dots[1]]: value,
							};
							return clean(text, subvars, original);
						} else if (
							dots.length == 1 &&
							subvars[variable] &&
							Array.isArray(subvars[variable])
						) {
							vars[original] = subvars[variable];
							return [
								...acc,
								`'${transform_array_key(original)}'!A1:A${
									subvars[variable].length
								}`,
							];
						} else if (dots.length === 1 && subvars[variable] instanceof Date) {
							vars[original] = subvars[variable];
							return [...acc, `'${transform_array_key(original)}'!A1`];
						} else if (
							dots.length === 1 &&
							typeof subvars[variable] === "function"
						) {
							const result = subvars[variable].call();
							subvars[variable] = result;
							return clean(text, subvars, original);
						} else if (dots.length === 1) {
							return [...acc, `${customTags[0]}${original}${customTags[1]}`];
						} else {
							subvars = subvars[dots[0]];
							return clean(dots.slice(1).join("."), subvars, original);
						}
					}

					return clean(text, vars, text + "");

				default:
					return [...acc, text];
			}
		}, [])
		.join("");

	const rendered_formula = Mustache.render(
		substituted_formula,
		vars,
		{},
		{
			tags: customTags,
			escape: text => {
				if (text instanceof Date) {
					// Dates are now handled via cell references, so this shouldn't be hit
					return `"${text.toISOString()}"`;
				} else if (typeof text === "string") {
					return `"${text}"`;
				}
				return text;
			},
		}
	);

	const workbook = {
		Sheets: {
			Sheet1: {
				A1: {
					f: rendered_formula,
				},
			},
			// Convert any arrays into their own sheet with a range of cells
			...Object.entries(vars)
				.filter(([key, value]) => Array.isArray(value))
				.reduce((acc, [key, value]) => {
					acc[transform_array_key(key)] = value.reduce((acc, value, index) => {
						acc[`A${index + 1}`] = {
							v: value,
						};
						return acc;
					}, {});

					return acc;
				}, {}),
			// Convert any Date objects into their own sheet with a single cell
			...Object.entries(vars)
				.filter(([key, value]) => value instanceof Date)
				.reduce((acc, [key, value]) => {
					acc[transform_array_key(key)] = {
						A1: {
							v: value,
						},
					};
					return acc;
				}, {}),
		},
	};

	XLSX_CALC(workbook);

	const { w: error } = workbook.Sheets.Sheet1.A1;

	if (error && !suppress_errors) throw error;

	return error ? undefined : workbook.Sheets.Sheet1.A1.v;
}

function transform_array_key(key) {
	return key.replace(/'/g, "");
}

module.exports = {
	parse,
	calculate,
};
