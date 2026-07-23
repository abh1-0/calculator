/**
 * Calculator Engine
 *
 * Pure computation logic — no DOM interaction.
 * Manages current operand, pending operator, previous operand,
 * and evaluates expressions with error handling.
 */

"use strict";

class Calculator {
  constructor() {
    this.reset();
  }

  /** Fully reset calculator state */
  reset() {
    this.currentOperand = "0";
    this.previousOperand = "";
    this.operator = null;
    this.shouldResetScreen = false;
    this.lastExpression = "";
    this.hasError = false;
  }

  /**
   * Append a digit (0-9) to the current operand.
   * Caps input at 15 characters to prevent overflow.
   * @param {string} digit
   */
  appendNumber(digit) {
    if (this.hasError) this.reset();

    // If we just evaluated, start a fresh number
    if (this.shouldResetScreen) {
      this.currentOperand = "";
      this.shouldResetScreen = false;
    }

    // Prevent leading zeros (but allow "0.")
    if (digit === "0" && this.currentOperand === "0") return;
    if (digit !== "0" && this.currentOperand === "0") {
      this.currentOperand = "";
    }

    // Limit digit length
    if (this.currentOperand.replace(".", "").replace("-", "").length >= 15) return;

    this.currentOperand += digit;
  }

  /** Append a decimal point, preventing duplicates */
  appendDecimal() {
    if (this.hasError) this.reset();

    if (this.shouldResetScreen) {
      this.currentOperand = "0";
      this.shouldResetScreen = false;
    }

    if (this.currentOperand.includes(".")) return;
    if (this.currentOperand === "" || this.currentOperand === "-") {
      this.currentOperand += "0";
    }

    this.currentOperand += ".";
  }

  /**
   * Choose an operator (+, -, *, /).
   * If there's already a pending operation, evaluate it first (chaining).
   * @param {string} op
   */
  chooseOperator(op) {
    if (this.hasError) this.reset();

    // Allow changing operator if screen is about to reset (e.g., user pressed + then *)
    if (this.shouldResetScreen && this.operator) {
      this.operator = op;
      return;
    }

    // Chain: evaluate pending op before setting a new one
    if (this.operator && !this.shouldResetScreen) {
      this.evaluate();
      if (this.hasError) return; // abort on error
    }

    this.previousOperand = this.currentOperand;
    this.operator = op;
    this.shouldResetScreen = true;
  }

  /** Toggle the sign of the current operand (+/-) */
  toggleSign() {
    if (this.hasError) this.reset();
    if (this.currentOperand === "0" || this.currentOperand === "") return;

    if (this.currentOperand.startsWith("-")) {
      this.currentOperand = this.currentOperand.slice(1);
    } else {
      this.currentOperand = "-" + this.currentOperand;
    }
  }

  /** Convert the current operand to a percentage (÷ 100) */
  percent() {
    if (this.hasError) this.reset();
    if (this.currentOperand === "" || this.currentOperand === "0") return;

    const value = parseFloat(this.currentOperand);
    if (isNaN(value)) return;

    this.currentOperand = this._stripTrailingZeros(value / 100);
  }

  /** Delete the last character (backspace) */
  deleteLast() {
    if (this.hasError) this.reset();
    if (this.shouldResetScreen) return;

    this.currentOperand = this.currentOperand.slice(0, -1);
    if (this.currentOperand === "" || this.currentOperand === "-") {
      this.currentOperand = "0";
    }
  }

  /**
   * Evaluate the pending expression (previousOperand OP currentOperand).
   * Sets hasError on division-by-zero or invalid result.
   * @returns {{ expression: string, result: string } | null}
   */
  evaluate() {
    if (!this.operator || this.previousOperand === "") return null;

    const prev = parseFloat(this.previousOperand);
    const curr = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(curr)) {
      this._setError("Invalid input");
      return null;
    }

    // Build human-readable expression
    const opSymbol = this._operatorSymbol(this.operator);
    const expression = `${this._formatDisplay(prev)} ${opSymbol} ${this._formatDisplay(curr)}`;

    let result;
    switch (this.operator) {
      case "+":
        result = prev + curr;
        break;
      case "-":
        result = prev - curr;
        break;
      case "*":
        result = prev * curr;
        break;
      case "/":
        if (curr === 0) {
          this._setError("Cannot divide by zero");
          this.lastExpression = expression;
          return null;
        }
        result = prev / curr;
        break;
      default:
        return null;
    }

    // Guard against Infinity / NaN from floating point edge cases
    if (!isFinite(result)) {
      this._setError("Overflow");
      this.lastExpression = expression;
      return null;
    }

    const resultStr = this._stripTrailingZeros(result);

    this.lastExpression = expression;
    this.currentOperand = resultStr;
    this.previousOperand = "";
    this.operator = null;
    this.shouldResetScreen = true;
    this.hasError = false;

    return { expression, result: resultStr };
  }

  // ---- Getters for UI ----

  /** Get the display-ready string for the current operand */
  getDisplay() {
    if (this.hasError) return this.currentOperand; // error message
    return this._formatWithCommas(this.currentOperand);
  }

  /** Get the expression line (e.g., "12 + 3") while typing */
  getExpression() {
    if (!this.operator || this.previousOperand === "") return "";
    const opSymbol = this._operatorSymbol(this.operator);
    return `${this._formatWithCommas(this.previousOperand)} ${opSymbol}`;
  }

  /** Get the raw (un-formatted) result for clipboard copy */
  getRawValue() {
    return this.currentOperand;
  }

  // ---- Private helpers ----

  /** Set calculator into error state */
  _setError(message) {
    this.hasError = true;
    this.currentOperand = message;
    this.previousOperand = "";
    this.operator = null;
    this.shouldResetScreen = true;
  }

  /**
   * Convert operator token to display symbol.
   * @param {string} op
   * @returns {string}
   */
  _operatorSymbol(op) {
    const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    return symbols[op] || op;
  }

  /**
   * Remove unnecessary trailing zeros from a number.
   * Caps to 12 significant digits to avoid floating-point noise.
   * @param {number} n
   * @returns {string}
   */
  _stripTrailingZeros(n) {
    // toPrecision(12) removes floating-point artefacts like 0.1+0.2=0.30000000000000004
    return parseFloat(n.toPrecision(12)).toString();
  }

  /**
   * Format a numeric string with thousands separators (commas).
   * Preserves the decimal part and negative sign.
   * @param {string} numStr
   * @returns {string}
   */
  _formatWithCommas(numStr) {
    if (!numStr || numStr === "-") return numStr;

    const parts = numStr.split(".");
    // Add commas to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  /**
   * Format a number for expression display.
   * @param {number} n
   * @returns {string}
   */
  _formatDisplay(n) {
    return this._formatWithCommas(this._stripTrailingZeros(n));
  }
}
