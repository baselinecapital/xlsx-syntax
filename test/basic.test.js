require("should");

const {parse} = require('../src/index');


describe("Basic tests", function() {

    it("should parse basic formula", async () => {
        should(parse("1+3")).be.eql(4);
        should(parse("1*3")).be.eql(3);
        should(parse("SUM(4,5)")).be.eql(9);
        should(parse("IF(2 > 1, 1, 0)")).be.eql(1);
        should(parse("IF(0 > 1, 1, 0)")).be.eql(0);
    });

    it("should parse a formula with a variable reference", async () => {
        should(parse("1+{{a}}", {
            a: 3
        })).eql(4);

        should(parse("1+{{a}}+{{b}}", {
            a: 3,
            b: function()
            {
                return 2;
            }
        })).eql(6);
    });

    it("should parse a formula with a range array", async () => {
        should(parse("SUM({{a}})", {
            a: [1,2,3]
        })).eql(6);

        should(parse("SUM({{a}})", {
            a: [1]
        })).eql(1);
        
        should(parse("SUM({{a}})", {
            a: []
        })).eql(0);

        should(parse("SUMPRODUCT({{a}},{{b}})", {
            a: [1,2,3],
            b: [3,2,1]
        })).eql(10);

        should(parse("SUMPRODUCT(({{a}}),({{b}}))", {
            a: [1,2,3],
            b: [3,2,1]
        })).eql(10);

        should(parse("SUMPRODUCT(({{a-b_c}}),({{b}}))", {
            "a-b_c": [1,2,3],
            b: [3,2,1]
        })).eql(10);
    });

    it("should parse a formula with a range function", async () => {
        should(parse("SUM({{a}})", {
            a: () => [1,2,3]
        })).eql(6);

        should(parse("SUMPRODUCT({{a}},{{b}})", {
            a: () => [1,2,3],
            b: [3,2,1]
        })).eql(10);
    });

    it("should parse a formula with custom tags", async () => {
        should(parse("1+${a}", {
            a: 3
        }, ["${", "}"])).eql(4);
    });

    it("should handle a complex formula with lots of nesting", async () => {
        should(parse("1+{{a}}+IF(SUM({{b}})>2,SUM({{b}}),0)", {
            a: 3,
            b: [1,2,3]
        })).eql(10);
    });

});