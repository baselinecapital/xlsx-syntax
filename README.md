# XLSX Formula Parser

Parses XLSX-style formulas with variable substitution, and produces a result. Supports the formulas [in the xlsx-calc project](https://github.com/fabiooshiro/xlsx-calc/blob/master/src/formulas.js#L6). The formula is written using [mustache](https://github.com/janl/mustache.js/) syntax, including custom tags. Any array variables produce a range within the formula e.g. `SUM({{array}})` with variable `array:[1,2,3]` is equivalent to `SUM(A1:A3)` where the rows are `1,2,3` respectively.

## Installation
```bash
npm install xlsx-syntax
```

## Usage
```js
const {parse} = require("xlsx-syntax");
parse(formula, variables, [customTags]);
```

## Example
```js
const {parse} = require("xlsx-syntax");
parse("1+{{a}}", {a: 2})
// 3

parse("1+SUM({{a}})", {a: [1,2,3]})
// 7

parse("1+SUM({{a}})", {a: () => {
    // Do something
    return [1,2,3];
}})
// 7

// Custom tags
parse("1+${a}", {a: 2}, ["${", "}"])
// 3
```

## Special Thanks
Special thanks to the team who made [xlsx-calc](https://github.com/fabiooshiro/xlsx-calc) who made the underlying formula parsing for this library.


## MIT License

Copyright 2022, Baseline Lending

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.