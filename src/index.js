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
        function hasProperty(obj, prop) {
            const levels = prop.split(".");
            if(levels.length === 1) 
            {
                if(Array.isArray(obj))
                {
                    return prop in obj[0];
                }
                else
                {
                    return prop in obj;
                }
            }
            else
            {
                const [first, ...rest] = levels;
                return hasProperty(obj[first], rest.join("."));
            }
        }

        if(!hasProperty(vars, variable))
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
                function clean(text,subvars, original)
                {
                    const dots = text.split(".");
                    const variable = dots[0];

                    if(dots.length > 2)
                    {
                        subvars = subvars[dots[0]];
                        return clean(dots.slice(1).join("."), subvars, original);
                    }
                    else
                    {
                        if(subvars[variable] !== undefined && typeof subvars[variable] === "function")
                        {
                            const result = subvars[variable].call();
                            subvars[variable] = result;
                        }
                        if(subvars[variable] !== undefined && Array.isArray(subvars[variable]))
                        {
                            if(dots.length === 2)
                            {
                                const values = subvars[variable].map((item) => item[dots[1]]);

                                const new_id = Math.random().toString();

                                vars[new_id] = values;

                                return [...acc, `'${new_id}'!A1:A${vars[new_id].length}`];
                            }

                            return [...acc, `'${variable}'!A1:A${subvars[variable].length}`];
                        }
                        return [...acc, `${customTags[0]}${text}${customTags[1]}`];
                    }

                }

                return clean(text, vars, text + "");
                
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