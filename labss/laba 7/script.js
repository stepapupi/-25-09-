"use strict";

const display = document.getElementById("display");
const expression = document.getElementById("expression");
const keys = document.getElementById("keys");

const operations = {
  add: { symbol: "+", calculate: (left, right) => left + right },
  subtract: { symbol: "−", calculate: (left, right) => left - right },
  multiply: { symbol: "×", calculate: (left, right) => left * right },
  divide: { symbol: "÷", calculate: (left, right) => left / right },
};

let entry;
let stored;
let operation;
let waiting;
let replaceEntry;
let error;

function reset() {
  entry = "0";
  stored = null;
  operation = null;
  waiting = false;
  replaceEntry = false;
  error = "";
}

function showNumber(value) {
  if (!Number.isFinite(value)) {
    reset();
    error = "Число вне диапазона";
    return;
  }
  const rounded = Number(value.toPrecision(15));
  entry = String(Number.isFinite(rounded) ? rounded : value);
  waiting = false;
  replaceEntry = true;
}

function render() {
  display.textContent = error || entry.replace(".", ",");
  expression.textContent = operation
    ? `${String(stored).replace(".", ",")} ${operations[operation].symbol}`
    : "";
}

function enterCharacter(key) {
  if (waiting || replaceEntry) entry = "0";
  waiting = false;
  replaceEntry = false;

  if (key === "decimal") {
    if (!entry.includes(".")) entry += ".";
  } else if (entry.replace(/\D/g, "").length < 15) {
    if (entry === "0" || entry === "-0") entry = entry.slice(0, -1);
    entry += key;
  }
}

function calculate() {
  const right = Number(entry);
  if (operation === "divide" && right === 0) {
    reset();
    error = "Деление на ноль";
    return;
  }
  const value = operations[operation].calculate(stored, right);
  operation = null;
  stored = null;
  showNumber(value);
}

function applyUnary(key) {
  const number = Number(entry);
  if ((key === "root" && number < 0) || (key === "inverse" && number === 0)) {
    reset();
    error =
      key === "root" ? "Корень из отрицательного числа" : "Деление на ноль";
    return;
  }

  if (key === "root") showNumber(Math.sqrt(number));
  if (key === "inverse") showNumber(1 / number);
  if (key === "percent") {
    const base = operation === "add" || operation === "subtract" ? stored : 1;
    showNumber(base * (number / 100));
  }
}

function handleKey(key) {
  if (error || key === "clear") reset();

  if (/^[0-9]$/.test(key) || key === "decimal") {
    enterCharacter(key);
  } else if (key === "entry") {
    entry = "0";
    waiting = false;
    replaceEntry = false;
  } else if (key === "back" && !waiting && !replaceEntry) {
    entry = entry.slice(0, -1);
    if (!entry || entry === "-") entry = "0";
  } else if (key === "sign") {
    if (waiting) entry = "0";
    entry = entry.startsWith("-") ? entry.slice(1) : "-" + entry;
    waiting = false;
    if (entry === "-0") replaceEntry = false;
  } else if (Object.hasOwn(operations, key)) {
    if (operation && !waiting) calculate();
    if (!error) {
      stored = Number(entry);
      operation = key;
      waiting = true;
    }
  } else if (key === "equals" && operation) {
    calculate();
  } else if (key === "root" || key === "inverse" || key === "percent") {
    applyUnary(key);
  }

  render();
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) handleKey(button.dataset.key);
});

const keyboard = {
  ".": "decimal",
  ",": "decimal",
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
  "%": "percent",
  "=": "equals",
  Enter: "equals",
  Escape: "clear",
  Delete: "entry",
  Backspace: "back",
};

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented)
    return;
  if (event.key === "Enter" && event.target.closest?.("button")) return;

  const key = /^[0-9]$/.test(event.key) ? event.key : keyboard[event.key];
  if (typeof key === "string") {
    event.preventDefault();
    handleKey(key);
  }
});

reset();
render();
