const fs = require('fs');

// Function to convert number from any base to decimal
function convertToDecimal(num, base) {
    if (base <= 10) {
        return parseInt(num, base);
    }
    
    const digits = '0123456789abcdef';
    let decimal = 0;
    num = num.toLowerCase();
    
    for (let i = 0; i < num.length; i++) {
        const digit = digits.indexOf(num[i]);
        if (digit === -1 || digit >= base) {
            throw new Error(`Invalid digit for base ${base}: ${num[i]}`);
        }
        decimal = decimal * base + digit;
    }
    
    return decimal;
}

// Lagrange basis polynomial
function lagrangeBasis(j, x, points) {
    let result = 1n;
    for (let m = 0; m < points.length; m++) {
        if (m !== j) {
            result *= (x - BigInt(points[m].x)) * 
                     calculateModularMultiplicativeInverse(
                         BigInt(points[j].x) - BigInt(points[m].x)
                     );
        }
    }
    return result;
}

// Calculate modular multiplicative inverse using extended Euclidean algorithm
function calculateModularMultiplicativeInverse(a) {
    const MOD = 2n ** 256n;  // 256-bit number range
    let t = 0n;
    let newT = 1n;
    let r = MOD;
    let newR = a;
    
    while (newR !== 0n) {
        const quotient = r / newR;
        [t, newT] = [newT, t - quotient * newT];
        [r, newR] = [newR, r - quotient * newR];
    }
    
    if (t < 0n) t += MOD;
    return t;
}

// Lagrange interpolation to find the secret
function findSecret(points) {
    let secret = 0n;
    const x = 0n;  // We want f(0) which is the constant term
    
    for (let j = 0; j < points.length; j++) {
        secret += BigInt(points[j].y) * lagrangeBasis(j, x, points);
    }
    
    // Ensure result is positive and within 256-bit range
    const MOD = 2n ** 256n;
    return ((secret % MOD) + MOD) % MOD;
}

// Validate test case data
function validateTestCase(testCase) {
    if (!testCase.keys || !testCase.keys.n || !testCase.keys.k) {
        throw new Error('Invalid test case: missing keys');
    }

    const { n, k } = testCase.keys;
    if (n < k) {
        throw new Error(`Invalid test case: n (${n}) must be >= k (${k})`);
    }

    // Check if we have enough valid points
    let validPoints = 0;
    for (let i = 1; i <= n; i++) {
        if (testCase[i] && testCase[i].base && testCase[i].value) {
            validPoints++;
        }
    }

    if (validPoints < k) {
        throw new Error(`Invalid test case: not enough valid points (${validPoints}) for k=${k}`);
    }
}

// Process a single test case
function processTestCase(testCase) {
    try {
        validateTestCase(testCase);
        
        const k = testCase.keys.k;
        const points = [];
        
        // Get first k points from the test case
        for (let i = 1; i <= k; i++) {
            if (testCase[i]) {
                const x = i;
                const base = parseInt(testCase[i].base);
                if (isNaN(base) || base < 2 || base > 16) {
                    throw new Error(`Invalid base ${base} for point ${i}`);
                }
                try {
                    const y = convertToDecimal(testCase[i].value, base);
                    points.push({ x, y });
                } catch (error) {
                    throw new Error(`Error converting value for point ${i}: ${error.message}`);
                }
            }
        }
        
        return findSecret(points);
    } catch (error) {
        throw new Error(`Error processing test case: ${error.message}`);
    }
}

// Main function to process test cases from files
function main() {
    try {
        // Read test cases from files
        const testCase1 = JSON.parse(fs.readFileSync('testcase1.json', 'utf8'));
        const testCase2 = JSON.parse(fs.readFileSync('testcase2.json', 'utf8'));

        // Process test cases
        console.log("Processing test cases...\n");
        
        const secret1 = processTestCase(testCase1);
        console.log("Secret for Test Case 1:", secret1.toString());
        
        const secret2 = processTestCase(testCase2);
        console.log("Secret for Test Case 2:", secret2.toString());
        
        // Write results to output file
        const output = {
            testCase1Secret: secret1.toString(),
            testCase2Secret: secret2.toString()
        };
        
        fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
        console.log("\nResults have been written to output.json");
        
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

// Run the program
if (require.main === module) {
    main();
}

// Export functions for testing
module.exports = {
    convertToDecimal,
    findSecret,
    processTestCase,
    validateTestCase
};