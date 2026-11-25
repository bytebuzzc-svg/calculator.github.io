const calculator = document.getElementById("nimta-calc");
const historyElement = document.getElementById("history");
const currentElement = document.getElementById("current");

let expression = "";
let justEvaluated = false;

function displayValue() {
    const text = expression
        .replaceAll("*", "×")
        .replaceAll("/", "÷")
        .replaceAll("-", "−")
        .replaceAll("pi", "π");
    currentElement.textContent = text || "0";
}

function appendValue(value) {
    if (justEvaluated) {
        expression = "";
        historyElement.textContent = "";
        justEvaluated = false;
    }
    expression += value;
    displayValue();
}

function clearCalculator() {
    expression = "";
    justEvaluated = false;
    historyElement.textContent = "";
    displayValue();
}

function backspace() {
    if (justEvaluated) clearCalculator();
    else {
        expression = expression.slice(0, -1);
        displayValue();
    }
}

function toggleSign() {
    if (!expression) return;
    if (expression.startsWith("-(") && expression.endsWith(")")) {
        expression = expression.slice(2, -1);
    } else {
        expression = "-(" + expression + ")";
    }
    displayValue();
}

function applyPercent() {
    if (!expression) return;
    expression += "/100";
    displayValue();
}

function factorial(value) {
    if (!Number.isInteger(value) || value < 0 || value > 170) {
        throw new Error("Invalid factorial");
    }
    let result = 1;
    for (let i = 2; i <= value; i++) result *= i;
    return result;
}

class ExpressionParser {
    constructor(input) {
        this.input = input.replaceAll(" ", "");
        this.position = 0;
    }

    parse() {
        const value = this.parseSum();
        if (this.position !== this.input.length) throw new Error("Invalid expression");
        return value;
    }

    parseSum() {
        let value = this.parseProduct();
        while (this.input[this.position] === "+" || this.input[this.position] === "-") {
            const operator = this.input[this.position++];
            const right = this.parseProduct();
            value = operator === "+" ? value + right : value - right;
        }
        return value;
    }

    parseProduct() {
        let value = this.parseUnary();
        while (["*", "/", "%"].includes(this.input[this.position])) {
            const operator = this.input[this.position++];
            const right = this.parseUnary();
            if (operator === "*") value *= right;
            if (operator === "/") {
                if (right === 0) throw new Error("Cannot divide by zero");
                value /= right;
            }
            if (operator === "%") value %= right;
        }
        return value;
    }

    parseUnary() {
        if (this.input[this.position] === "+") {
            this.position++;
            return this.parseUnary();
        }
        if (this.input[this.position] === "-") {
            this.position++;
            return -this.parseUnary();
        }
        return this.parsePower();
    }

    parsePower() {
        let value = this.parsePrimary();
        if (this.input[this.position] === "^") {
            this.position++;
            value = value ** this.parseUnary();
        }
        return value;
    }

    parsePrimary() {
        const char = this.input[this.position];

        if (char === "(") {
            this.position++;
            const value = this.parseSum();
            if (this.input[this.position] !== ")") throw new Error("Missing )");
            this.position++;
            return value;
        }

        const functionMatch = this.input.slice(this.position).match(/^(sin|cos|tan|log|ln|sqrt|pi|e)(?=\(|$)/);
        if (functionMatch) {
            const name = functionMatch[1];
            this.position += name.length;
            if (name === "pi") return Math.PI;
            if (name === "e") return Math.E;
            if (this.input[this.position] !== "(") throw new Error("Missing (");
            this.position++;
            const value = this.parseSum();
            if (this.input[this.position] !== ")") throw new Error("Missing )");
            this.position++;
            if (name === "sin") return Math.sin(value * Math.PI / 180);
            if (name === "cos") return Math.cos(value * Math.PI / 180);
            if (name === "tan") return Math.tan(value * Math.PI / 180);
            if (name === "log") return Math.log10(value);
            if (name === "ln") return Math.log(value);
            if (name === "sqrt") return Math.sqrt(value);
        }

        const numberMatch = this.input.slice(this.position).match(/^((\d+\.?\d*)|(\.\d+))/);
        if (!numberMatch) throw new Error("Invalid expression");
        this.position += numberMatch[0].length;
        return Number(numberMatch[0]);
    }
}

function formatResult(value) {
    if (!Number.isFinite(value)) throw new Error("Result is out of range");
    if (Math.abs(value) < 1e-12) value = 0;
    return Number(value.toPrecision(12)).toString();
}

function evaluateExpression() {
    if (!expression) return;
    const source = expression;
    try {
        const result = formatResult(new ExpressionParser(expression).parse());
        historyElement.textContent = source.replaceAll("*", "×").replaceAll("/", "÷").replaceAll("pi", "π") + " =";
        expression = result;
        justEvaluated = true;
        displayValue();
    } catch (error) {
        historyElement.textContent = "Error";
        expression = "";
        justEvaluated = true;
        currentElement.textContent = "Cannot calculate";
    }
}

function handleFunction(name) {
    if (justEvaluated) {
        if (!["pi", "e", "exp"].includes(name)) {
            expression = "";
            historyElement.textContent = "";
        }
        justEvaluated = false;
    }

    if (name === "pi") appendValue("pi");
    else if (name === "e") appendValue("e");
    else if (name === "power") appendValue("^");
    else if (name === "exp") appendValue("e");
    else if (name === "square") appendValue("^2");
    else if (name === "factorial") {
        if (!expression) return;
        try {
            const value = new ExpressionParser(expression).parse();
            expression = String(factorial(value));
            displayValue();
        } catch (error) {
            historyElement.textContent = "Error";
            currentElement.textContent = "Cannot calculate";
        }
    } else {
        appendValue(name + "(");
    }
}

calculator.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.num) appendValue(button.dataset.num);
    if (button.dataset.op) appendValue(button.dataset.op);
    if (button.dataset.func) handleFunction(button.dataset.func);

    if (button.dataset.action === "clear") clearCalculator();
    if (button.dataset.action === "back") backspace();
    if (button.dataset.action === "sign") toggleSign();
    if (button.dataset.action === "percent") applyPercent();
    if (button.dataset.action === "paren") appendValue(button.dataset.paren);
    if (button.dataset.action === "equals") evaluateExpression();
});

document.addEventListener("keydown", (event) => {
    if (/^[0-9.]$/.test(event.key)) appendValue(event.key);
    else if (["+", "-", "*", "/", "^", "(", ")"].includes(event.key)) appendValue(event.key);
    else if (event.key === "Enter" || event.key === "=") evaluateExpression();
    else if (event.key === "Backspace") backspace();
    else if (event.key === "Escape") clearCalculator();
});
