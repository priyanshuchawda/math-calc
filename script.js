document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const calculatorInput = document.getElementById('calculator-input');
    const calculatorResult = document.getElementById('calculator-result');

    // Set initial theme based on localStorage
    toggleDarkMode(localStorage.getItem('theme') === 'dark');

    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        sunIcon.style.display = isDarkMode ? 'none' : 'block';
        moonIcon.style.display = isDarkMode ? 'block' : 'none';
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    function toggleDarkMode(isDark) {
        document.body.classList.toggle('dark-mode', isDark);
        document.querySelector('.container').classList.toggle('dark-mode', isDark);
        sunIcon.style.display = isDark ? 'none' : 'block';
        moonIcon.style.display = isDark ? 'block' : 'none';
    }

    // Section navigation
    document.querySelectorAll('#options button').forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(sectionId);
        });
    });

    function showSection(sectionId) {
        document.querySelectorAll('.section-content').forEach(section =>
            section.classList.toggle('active', section.id === sectionId)
        );
    }

    // Ensure mathjs library is loaded
    if (typeof math === 'undefined') {
        console.error('mathjs library is not loaded.');
        return;
    }

    // Define custom functions for math.js
    function asec(x) {
        if (Math.abs(x) < 1) {
            throw new Error("Domain Error: asec(x) requires |x| >= 1");
        }
        return Math.acos(1 / x);
    }

    function acosec(x) {
        if (Math.abs(x) < 1) {
            throw new Error("Domain Error: acosec(x) requires |x| >= 1");
        }
        return Math.asin(1 / x);
    }

    function acot(x) {
        return Math.atan(1 / x);
    }

    // Define combinatorial functions
    function factorial(n) {
        return n <= 1 ? 1 : n * factorial(n - 1);
    }

    function nCr(n, r) {
        if (n < r) {
            throw new Error("n cannot be less than r");
        }
        return factorial(n) / (factorial(r) * factorial(n - r));
    }

    function nPr(n, r) {
        if (n < r) {
            throw new Error("n cannot be less than r");
        }
        return factorial(n) / factorial(n - r);
    }

    // Import custom functions into math.js
    math.import({
        asec: asec,
        acosec: acosec,
        acot: acot,
        nCr: nCr,
        nPr: nPr
    }, { override: true });

    // Define domains for functions
    const domains = {
        asin: "[-1, 1]",
        acos: "[-1, 1]",
        atan: "All Real Numbers",
        sec: "R - (2n + 1)π/2",
        cosec: "R - nπ",
        cot: "R - nπ",
        asec: "|x| >= 1",
        acosec: "|x| >= 1",
        acot: "All Real Numbers",
        log: "x > 0 and base > 0, base ≠ 1"
    };

    // Handle calculations with custom functions
    function calculateExpression(expression) {
        try {
            console.log(`Original expression: ${expression}`);
            expression = expression.replace(/π/g, Math.PI)
                .replace(/log\(([^,]+),([^\)]+)\)/g, 'log($2, $1)')
                .replace(/\bsec\(/g, '1/cos(')
                .replace(/\bcosec\(/g, '1/sin(')
                .replace(/\bcot\(/g, '1/tan(')
                .replace(/\basec\(/g, 'asec(')
                .replace(/\bacosec\(/g, 'acosec(')
                .replace(/\bacot\(/g, 'acot(');

            // Check domain validity for trigonometric and logarithmic functions
            const trigonometricFunctions = ['asin', 'acos', 'asec', 'acosec', 'acot', 'sec', 'cosec', 'cot'];
            const logarithmicFunctions = ['log'];

            trigonometricFunctions.forEach(fn => {
                const regex = new RegExp(`${fn}\\(`, 'g');
                if (regex.test(expression)) {
                    const args = expression.match(/\(([^)]+)\)/)[1];
                    const value = math.evaluate(args);

                    switch (fn) {
                        case 'asec':
                        case 'acosec':
                            if (Math.abs(value) < 1) {
                                calculatorResult.innerText = `Domain Error: ${fn}(x) requires |x| >= 1. Input value ${value} is out of domain. Result will be a complex number.`;
                                return;
                            }
                            break;
                        case 'sec':
                        case 'cosec':
                            if (Math.cos(value) === 0) {
                                calculatorResult.innerText = `Domain Error: ${fn}(x) is undefined where cos(x) = 0. Result will be a complex number.`;
                                return;
                            }
                            break;
                        case 'tan':
                            if (Math.cos(value) === 0) {
                                calculatorResult.innerText = `Domain Error: tan(x) is undefined where cos(x) = 0. Result will be a complex number.`;
                                return;
                            }
                            break;
                        case 'cot':
                            if (Math.sin(value) === 0) {
                                calculatorResult.innerText = `Domain Error: cot(x) is undefined where sin(x) = 0. Result will be a complex number.`;
                                return;
                            }
                            break;
                        default:
                            break;
                    }
                }
            });

            logarithmicFunctions.forEach(fn => {
                const regex = new RegExp(`${fn}\\(`, 'g');
                if (regex.test(expression)) {
                    const [args, base] = expression.match(/\(([^,]+),([^\)]+)\)/).slice(1, 3);
                    const value = math.evaluate(args);
                    const baseValue = math.evaluate(base);

                    if (value <= 0 || baseValue <= 0 || baseValue === 1) {
                        calculatorResult.innerText = `Domain Error: ${fn}(x, base) requires x > 0 and base > 0, base ≠ 1. Input values x: ${value}, base: ${baseValue} are out of domain. Result will be a complex number.`;
                        return;
                    }
                }
            });

            console.log(`Expression after replacement: ${expression}`);
            const result = math.evaluate(expression);
            const functionName = expression.match(/^\w+/)[0];
            const domainMessage = domains[functionName] ? `Domain of ${functionName} is ${domains[functionName]}.` : '';
            const resultMessage = `Result: ${result}`;
            calculatorResult.innerText = `${domainMessage}\n${resultMessage}`;
        } catch (error) {
            console.error('Error in calculation:', error.message);
            calculatorResult.innerText = `Error: ${error.message}`;
        }
    }

    document.querySelectorAll('.calc-button').forEach(button => {
        button.addEventListener('click', () => handleButtonClick(button.getAttribute('data-value')));
    });

    function handleButtonClick(value) {
        switch (value) {
            case 'log':
                const base = prompt("Enter the base for log:", "10");
                calculatorInput.value += `log(${base},`;
                break;
            case 'nCr':
            case 'nPr':
                const n = prompt(`Enter the value of n (must be positive):`);
                const r = prompt(`Enter the value of r (must be positive):`);
                if (parseFloat(n) <= 0 || parseFloat(r) <= 0) {
                    calculatorResult.innerText = `Error: Both n and r must be positive numbers.`;
                    return;
                }
                if (parseFloat(n) < parseFloat(r)) {
                    calculatorResult.innerText = `Error: n cannot be less than r.`;
                    return;
                }
                calculatorInput.value += `${value}(${n}, ${r})`;
                break;
            default:
                calculatorInput.value += value.includes('(') ? `${value}` : `${value}(`;
        }
        // Focus back on the input box
        calculatorInput.focus();
    }

    document.getElementById('calc-equal').addEventListener('click', () => {
        calculateExpression(calculatorInput.value);
    });

    // Handle Enter key for calculation
    calculatorInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission or page refresh
            calculateExpression(calculatorInput.value);
        }
    });
});
