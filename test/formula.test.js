require("should");

const { calculate, parse } = require("../src/index");

describe("Forula variable tests", function () {
	it("should parse a formula with a function for the variable", async () => {
		should(
			calculate("1+{{a}}", name => {
				switch (name) {
					case "a":
						return 3;
				}
			})
		).eql(4);

		should(
			calculate("1+{{a}}+{{b}}", name => {
				switch (name) {
					case "a":
						return 3;
					case "b":
						return function () {
							return 2;
						};
				}
			})
		).eql(6);
	});

	it("should handle an exception thrown by the function", async () => {
		should.throws(() => {
			calculate("1+{{a}}", name => {
				throw "I don't know that variable";
			});
		}, "Missing variable: a");
	});

	it("should parse a formula with a range array", async () => {
		should(calculate("SUM({{a}})", () => [1, 2, 3])).eql(6);

		should(
			calculate("SUM({{a.b}})", () => {
				return [1, 2, 3];
			})
		).eql(6);

		should(calculate("SUM({{a}})", () => [1])).eql(1);

		should(calculate("SUM({{a}})", () => [])).eql(0);

		should(
			calculate("SUMPRODUCT({{a}},{{b}})", name => {
				switch (name) {
					case "a":
						return [1, 2, 3];
					case "b":
						return [3, 2, 1];
				}
			})
		).eql(10);

		should(
			calculate("SUMPRODUCT({{a.b}},{{b}})", name => {
				switch (name) {
					case "a.b":
						return [1, 2, 3];
					case "b":
						return [3, 2, 1];
				}
			})
		).eql(10);
	});

	it("should parse a formula with a range function", async () => {
		should(
			calculate("SUM({{a}})", {
				a: () => [1, 2, 3],
			})
		).eql(6);

		should(
			calculate("SUMPRODUCT({{a}},{{b}})", name => {
				switch (name) {
					case "a":
						return () => [1, 2, 3];
					case "b":
						return [3, 2, 1];
				}
			})
		).eql(10);
	});
});

describe("Date formula tests", function () {
	it("should extract day from date using DAY()", async () => {
		// Test with ISO date string
		should(calculate("DAY({{date}})", { date: new Date("2023-11-15") })).eql(
			15
		);

		// Test with different day
		should(calculate("DAY({{date}})", { date: new Date("2023-01-05") })).eql(5);

		// Test with end of month
		should(calculate("DAY({{date}})", { date: new Date("2023-03-31") })).eql(
			31
		);
	});

	it("should extract month from date using MONTH()", async () => {
		// Test with different months
		should(calculate("MONTH({{date}})", { date: new Date("2023-01-15") })).eql(
			1
		);

		should(calculate("MONTH({{date}})", { date: new Date("2023-06-20") })).eql(
			6
		);

		should(calculate("MONTH({{date}})", { date: new Date("2023-12-31") })).eql(
			12
		);
	});

	it("should extract year from date using YEAR()", async () => {
		// Test with different years
		should(calculate("YEAR({{date}})", { date: new Date("2023-06-15") })).eql(
			2023
		);

		should(calculate("YEAR({{date}})", { date: new Date("2020-01-01") })).eql(
			2020
		);

		should(calculate("YEAR({{date}})", { date: new Date("2025-12-31") })).eql(
			2025
		);
	});

	it("should combine date functions in formulas", async () => {
		const testDate = new Date("2023-07-15");

		// Test combining multiple date functions
		should(calculate("DAY({{date}})+MONTH({{date}})", { date: testDate })).eql(
			22
		); // 15 + 7

		should(calculate("YEAR({{date}})-MONTH({{date}})", { date: testDate })).eql(
			2016
		); // 2023 - 7

		// Test with arithmetic
		should(
			calculate("YEAR({{date}})*100+MONTH({{date}})*10+DAY({{date}})", {
				date: testDate,
			})
		).eql(202385); // 2023*100 + 7*10 + 15
	});

	it("should calculate date differences using DATEDIF() with years", async () => {
		const startDate = new Date(2020, 0, 15, 0, 0, 0, 0);
		startDate.setUTCHours(0, 0, 0, 0);
		const endDate = new Date(2023, 0, 15, 0, 0, 0, 0);
		endDate.setUTCHours(0, 0, 0, 0);

		// Exactly 3 years
		should(
			calculate('DATEDIF({{start}},{{end}},"Y")', {
				start: startDate,
				end: endDate,
			})
		).eql(3);

		// Another multi-year period
		const start2 = new Date(2020, 5, 15, 0, 0, 0, 0);
		start2.setUTCHours(0, 0, 0, 0);
		const end2 = new Date(2024, 0, 15, 0, 0, 0, 0);
		end2.setUTCHours(0, 0, 0, 0);
		should(
			calculate('DATEDIF({{start}},{{end}},"Y")', {
				start: start2,
				end: end2,
			})
		).eql(4);
	});

	it("should calculate date differences using DATEDIF() with months", async () => {
		const startDate = new Date(2023, 0, 15, 0, 0, 0, 0);
		startDate.setUTCHours(0, 0, 0, 0);
		const endDate = new Date(2023, 6, 15, 0, 0, 0, 0);
		endDate.setUTCHours(0, 0, 0, 0);

		// Exactly 6 months
		should(
			calculate('DATEDIF({{start}},{{end}},"M")', {
				start: startDate,
				end: endDate,
			})
		).eql(6);

		// Test across years (14 months)
		const start2 = new Date(2022, 5, 15, 0, 0, 0, 0);
		start2.setUTCHours(0, 0, 0, 0);
		const end2 = new Date(2023, 7, 15, 0, 0, 0, 0);
		end2.setUTCHours(0, 0, 0, 0);
		should(
			calculate('DATEDIF({{start}},{{end}},"M")', {
				start: start2,
				end: end2,
			})
		).eql(14);
	});

	it("should calculate date differences using DATEDIF() with days", async () => {
		const startDate = new Date(2023, 0, 1, 0, 0, 0, 0);
		startDate.setUTCHours(0, 0, 0, 0);
		const endDate = new Date(2023, 0, 11, 0, 0, 0, 0);
		endDate.setUTCHours(0, 0, 0, 0);

		// 10 days difference
		should(
			calculate('DATEDIF({{start}},{{end}},"D")', {
				start: startDate,
				end: endDate,
			})
		).eql(10);

		// Test longer period
		const start2 = new Date(2023, 0, 1, 0, 0, 0, 0);
		start2.setUTCHours(0, 0, 0, 0);
		const end2 = new Date(2023, 11, 31, 0, 0, 0, 0);
		end2.setUTCHours(0, 0, 0, 0);
		should(
			calculate('DATEDIF({{start}},{{end}},"D")', {
				start: start2,
				end: end2,
			})
		).eql(364);
	});

	it("should calculate date differences using DATEDIF() with combined dates and formulas", async () => {
		const startDate = new Date(2020, 0, 1, 0, 0, 0, 0);
		startDate.setUTCHours(0, 0, 0, 0);
		const endDate = new Date(2022, 0, 1, 0, 0, 0, 0);
		endDate.setUTCHours(0, 0, 0, 0);

		// Calculate years difference
		should(
			calculate('DATEDIF({{start}},{{end}},"Y")', {
				start: startDate,
				end: endDate,
			})
		).eql(2);

		// Test with arithmetic - multiply years by 12
		should(
			calculate('DATEDIF({{start}},{{end}},"Y")*12', {
				start: startDate,
				end: endDate,
			})
		).eql(24);
	});
});
