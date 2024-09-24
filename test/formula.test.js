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
