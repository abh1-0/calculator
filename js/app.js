/**
 * App Controller
 *
 * Wires the Calculator engine and HistoryManager to the DOM.
 * Handles button clicks, keyboard input, copy-to-clipboard,
 * history panel interactions, and all visual feedback.
 */

"use strict";

(function () {
  // ── Instances ──
  const calc = new Calculator();
  const history = new HistoryManager();

  // ── DOM References ──
  const $expression = document.getElementById("expression");
  const $result = document.getElementById("result");
  const $keypad = document.getElementById("keypad");
  const $copyBtn = document.getElementById("copyBtn");
  const $copyTooltip = document.getElementById("copyTooltip");

  const $historyToggle = document.getElementById("historyToggle");
  const $historyPanel = document.getElementById("historyPanel");
  const $historyClose = document.getElementById("historyClose");
  const $historyClear = document.getElementById("historyClear");
  const $historyList = document.getElementById("historyList");
  const $historyEmpty = document.getElementById("historyEmpty");
  const $backdrop = document.getElementById("backdrop");

  // ── State ──
  let copyTimeout = null;

  // ====================================================================
  //  Display Updates
  // ====================================================================

  /** Sync DOM display with calculator state */
  function updateDisplay() {
    const display = calc.getDisplay();
    const expr = calc.getExpression();

    $expression.textContent = expr;
    $result.textContent = display;

    // Toggle error styling
    $result.classList.toggle("error", calc.hasError);

    // Dynamic font shrinking for long results
    const len = display.replace(/,/g, "").length;
    $result.classList.remove("shrink-1", "shrink-2", "shrink-3");
    if (len > 14) $result.classList.add("shrink-3");
    else if (len > 10) $result.classList.add("shrink-2");
    else if (len > 7) $result.classList.add("shrink-1");

    // Highlight the active operator button
    updateOperatorHighlight();
  }

  /** Add/remove the "active" class on operator buttons */
  function updateOperatorHighlight() {
    document.querySelectorAll(".key--op").forEach((btn) => {
      const isActive =
        calc.operator &&
        calc.shouldResetScreen &&
        btn.dataset.value === calc.operator;
      btn.classList.toggle("active", isActive);
    });
  }

  // ====================================================================
  //  Action Router
  // ====================================================================

  /**
   * Route a UI action to the calculator engine.
   * @param {string} action - action name from data-action attribute
   * @param {string} [value] - optional value (digit or operator)
   */
  function handleAction(action, value) {
    switch (action) {
      case "number":
        calc.appendNumber(value);
        break;
      case "decimal":
        calc.appendDecimal();
        break;
      case "operator":
        calc.chooseOperator(value);
        break;
      case "equals": {
        const result = calc.evaluate();
        if (result) {
          history.add(result.expression, result.result);
          renderHistory();
          // Show completed expression briefly
          $expression.textContent = result.expression + " =";
        }
        break;
      }
      case "clear":
        calc.reset();
        break;
      case "toggle-sign":
        calc.toggleSign();
        break;
      case "percent":
        calc.percent();
        break;
      case "backspace":
        calc.deleteLast();
        break;
      default:
        return; // unknown action — do nothing
    }
    updateDisplay();
  }

  // ====================================================================
  //  Keypad Click Handling
  // ====================================================================

  $keypad.addEventListener("click", (e) => {
    const key = e.target.closest(".key");
    if (!key) return;

    const { action, value } = key.dataset;
    handleAction(action, value);

    // Visual press feedback
    pressAnimation(key);
  });

  /** Brief scale-down animation on a key element */
  function pressAnimation(el) {
    el.classList.add("pressed");
    el.addEventListener(
      "transitionend",
      () => el.classList.remove("pressed"),
      { once: true }
    );
    // Fallback: remove class after 200ms in case transitionend doesn't fire
    setTimeout(() => el.classList.remove("pressed"), 200);
  }

  // ====================================================================
  //  Keyboard Support
  // ====================================================================

  /** Map from KeyboardEvent.key to { action, value, keyId } */
  function mapKey(key) {
    if (key >= "0" && key <= "9")
      return { action: "number", value: key, keyId: `key-${key}` };

    const map = {
      ".":         { action: "decimal",     keyId: "key-decimal" },
      "+":         { action: "operator",    value: "+", keyId: "key-add" },
      "-":         { action: "operator",    value: "-", keyId: "key-subtract" },
      "*":         { action: "operator",    value: "*", keyId: "key-multiply" },
      "/":         { action: "operator",    value: "/", keyId: "key-divide" },
      Enter:       { action: "equals",      keyId: "key-equals" },
      "=":         { action: "equals",      keyId: "key-equals" },
      Backspace:   { action: "backspace",   keyId: null },
      Delete:      { action: "clear",       keyId: "key-clear" },
      Escape:      { action: "clear",       keyId: "key-clear" },
      "%":         { action: "percent",     keyId: "key-percent" },
    };

    return map[key] || null;
  }

  document.addEventListener("keydown", (e) => {
    // Don't capture when a text input is focused
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    const mapping = mapKey(e.key);
    if (!mapping) return;

    e.preventDefault();
    handleAction(mapping.action, mapping.value);

    // Visual feedback on the corresponding button
    if (mapping.keyId) {
      const btn = document.getElementById(mapping.keyId);
      if (btn) pressAnimation(btn);
    }
  });

  // ====================================================================
  //  Copy to Clipboard
  // ====================================================================

  $copyBtn.addEventListener("click", async () => {
    const value = calc.getRawValue();
    if (!value || calc.hasError) return;

    try {
      await navigator.clipboard.writeText(value);
      showCopyTooltip();
    } catch {
      // Fallback for older browsers / insecure contexts
      fallbackCopy(value);
    }
  });

  /** Flash the "Copied!" tooltip */
  function showCopyTooltip() {
    clearTimeout(copyTimeout);
    $copyTooltip.classList.add("visible");
    copyTimeout = setTimeout(() => {
      $copyTooltip.classList.remove("visible");
    }, 1400);
  }

  /** Fallback copy via a temporary textarea */
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showCopyTooltip();
    } catch {
      /* silently fail */
    }
    document.body.removeChild(ta);
  }

  // ====================================================================
  //  History Panel
  // ====================================================================

  /** Open the history drawer */
  function openHistory() {
    $historyPanel.classList.add("open");
    $backdrop.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  /** Close the history drawer */
  function closeHistory() {
    $historyPanel.classList.remove("open");
    $backdrop.classList.remove("visible");
    document.body.style.overflow = "";
  }

  $historyToggle.addEventListener("click", () => {
    $historyPanel.classList.contains("open") ? closeHistory() : openHistory();
  });
  $historyClose.addEventListener("click", closeHistory);
  $backdrop.addEventListener("click", closeHistory);

  // Close on Escape when panel is open
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $historyPanel.classList.contains("open")) {
      e.stopPropagation();
      closeHistory();
    }
  });

  /** Clear history */
  $historyClear.addEventListener("click", () => {
    history.clear();
    renderHistory();
  });

  /** Render the history list from data */
  function renderHistory() {
    const entries = history.getAll();

    if (entries.length === 0) {
      $historyList.innerHTML = "";
      $historyList.appendChild($historyEmpty);
      $historyEmpty.style.display = "";
      return;
    }

    $historyEmpty.style.display = "none";

    // Build new list items
    const fragment = document.createDocumentFragment();
    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-label", `${entry.expression} equals ${entry.result}`);
      li.innerHTML = `
        <div class="history-item__expression">${escapeHTML(entry.expression)}</div>
        <div class="history-item__result">= ${escapeHTML(entry.result)}</div>
      `;

      // Click to load result into calculator
      li.addEventListener("click", () => {
        calc.reset();
        calc.currentOperand = entry.result;
        calc.shouldResetScreen = true;
        updateDisplay();
        closeHistory();
      });

      // Keyboard accessible
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          li.click();
        }
      });

      fragment.appendChild(li);
    });

    $historyList.innerHTML = "";
    $historyList.appendChild(fragment);
  }

  /** Basic HTML escaping to prevent XSS in history entries */
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ====================================================================
  //  Initialisation
  // ====================================================================

  updateDisplay();
  renderHistory();
})();
