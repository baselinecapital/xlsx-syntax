require("should");

const {calculate, parse} = require('../src/index');


describe("Basic tests", function() {

    it("should parse basic formula", async () => {
        should(calculate("1+3")).be.eql(4);
        should(calculate("1*3")).be.eql(3);
        should(calculate("SUM(4,5)")).be.eql(9);
        should(calculate("IF(2 > 1, 1, 0)")).be.eql(1);
        should(calculate("IF(0 > 1, 1, 0)")).be.eql(0);
    });

    it("should parse a formula with a variable reference", async () => {
        should(calculate("1+{{a}}", {
            a: 3
        })).eql(4);

        should(calculate("1+{{a}}+{{b}}", {
            a: 3,
            b: function()
            {
                return 2;
            }
        })).eql(6);
    });

    it("should parse a formula with a range array", async () => {
        should(calculate("SUM({{a}})", {
            a: [1,2,3]
        })).eql(6);

        should(calculate("SUM({{a.b}})", {
            a: {
                b: [1,2,3],
            }
        })).eql(6);

        should(calculate("SUM({{a}})", {
            a: [1]
        })).eql(1);
        
        should(calculate("SUM({{a}})", {
            a: []
        })).eql(0);

        should(calculate("SUMPRODUCT({{a}},{{b}})", {
            a: [1,2,3],
            b: [3,2,1]
        })).eql(10);

        should(calculate("SUMPRODUCT(({{a}}),({{b}}))", {
            a: [1,2,3],
            b: [3,2,1]
        })).eql(10);

        should(calculate("SUMPRODUCT(({{a-b_c}}),({{b}}))", {
            "a-b_c": [1,2,3],
            b: [3,2,1]
        })).eql(10);
    });

    it("should parse a formula with a range function", async () => {
        should(calculate("SUM({{a}})", {
            a: () => [1,2,3]
        })).eql(6);

        should(calculate("SUMPRODUCT({{a}},{{b}})", {
            a: () => [1,2,3],
            b: [3,2,1]
        })).eql(10);
    });

    it("should parse a formula with custom tags", async () => {
        should(calculate("1+${a}", {
            a: 3
        }, ["${", "}"])).eql(4);
    });

    it("should handle a complex formula with lots of nesting", async () => {
        should(calculate("1+{{a}}+IF(SUM({{b}})>2,SUM({{b}}),0)", {
            a: 3,
            b: [1,2,3]
        })).eql(10);
    });

    it("should handle a formula starting with =", async () => {
        should(calculate("=1+{{a}}+IF(SUM({{b}})>2,SUM({{b}}),0)", {
            a: 3,
            b: [1,2,3]
        })).eql(10);

        should(calculate("={{loan-amount}}/12", {
            "loan-amount": "100000"
        })).eql(8333.333333333334);

        should(calculate("={{data.loan-amount}}/12", {
            data:
            {
                "loan-amount": "100000"
            }
        })).eql(8333.333333333334);
    });

    it("should get the variables necessary in the formula", async () => {
        should(parse("=1+{{a}}+IF(SUM({{b}})>2,SUM({{b}}),0)")).eql(["a", "b"]);

        should(parse("={{loan-amount}}/12")).eql(["loan-amount"]);

        should(parse("1/12")).eql([]);

        should(parse("{{data.test}}")).eql(["data.test"]);
        
    });

    it("should throw an exception if a necessary variable isn't passed", async () => {
        should.throws(() => {
            parse("={{a}}", {b: 3});
        }, "Missing variable: a");

        should.throws(() => {
            parse("={{a}}/{{c}}", {b: 3});
        }, "Missing variable: a");
    });

    it("should sum a property of an array", async () => {
        should(calculate("SUM({{a.value}})", {
            a: [
                {value: 1},
                {value: 2},
                {value: 3},
            ]
        })).eql(6);
    });

    it("should sum a property of an array (multi-level)", async () => {
        should(calculate("SUM({{outer.a.value}})", {
            outer: {
                a: [
                    {value: 1},
                    {value: 2},
                    {value: 3},
                ]
            }
        })).eql(6);

        should(calculate("SUM({{more.outer.a.value}})", {
            more: {
                outer: {
                    a: [
                        {value: 1},
                        {value: 2},
                        {value: 3},
                    ]
                }
            }
        })).eql(6);
    });

    it("should suppress errors by default", async () => {
        should(calculate("1/0")).eql(undefined);
        
        try
        {
            calculate("1/0", undefined, undefined, false);
            throw "Should not get here";
        }
        catch(err)
        {
            err.should.eql("#DIV/0!");
        }
    });

});