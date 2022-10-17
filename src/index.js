const XLSX_CALC = require('xlsx-calc');
const Mustache = require('mustache');

function parse(formula, customTags) {
    const parsed = Mustache.parse(formula, customTags);
    return [...new Set(parsed.filter(([type]) => type === "name").map(([type, text]) => text))];
}

function calculate(formula, variables = {}, customTags = ["{{", "}}"]) {
    const vars = {...variables};

    // Find missing variables
    parse(formula, customTags).map((variable) => {
        if(!(variable in vars))
        {
            throw {
                message: `Missing variable: ${variable}`,
                variable,
            };
        }
    });

    const parsed = Mustache.parse(formula, customTags);

    // Look for any arrays in the formula that will be converted to ranges
    // of cells later on
    const substituted_formula = parsed.reduce((acc, [type, text, start, end]) => {
        switch(type)
        {
            case 'name':
                const variable = text;
                if(vars[variable] !== undefined && typeof vars[variable] === "function")
                {
                    const result = vars[variable].call();
                    vars[variable] = result;
                }
                if(vars[variable] !== undefined && Array.isArray(vars[variable]))
                {
                    return [...acc, `'${variable}'!A1:A${vars[variable].length}`];
                }
                return [...acc, `${customTags[0]}${text}${customTags[1]}`];
            default:
                return [...acc, text];
        }
        
    }, []).join("");
    
    const rendered_formula = Mustache.render(substituted_formula, vars, {}, customTags);

    const workbook = {
        Sheets: {
            Sheet1: {
                A1: {
                    f: rendered_formula
                }
            },
            // Convert any arrays into their own sheet with a range of cells
            ...Object.entries(vars).filter(([key, value]) => Array.isArray(value)).reduce((acc, [key, value]) => {
                acc[key] = value.reduce((acc, value, index) => {
                    acc[`A${index + 1}`] = {
                        v: value
                    };
                    return acc;
                }, {});

                return acc;
            }, {})
        }
    };

    XLSX_CALC(workbook);

    return workbook.Sheets.Sheet1.A1.v;


}

module.exports = {
    parse,
    calculate,
}