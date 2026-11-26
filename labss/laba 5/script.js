'use strict';

function findDigit(position) {
  const index = position - 1;
  const number = 100 + Math.floor(index / 3);
  return String(number)[index % 3];
}

function sumFromPositiveCosine(numbers) {
  let sum = null;

  for (let i = 0; i < numbers.length; i++) {
    if (sum === null && Math.cos(numbers[i]) > 0) {
      sum = 0;
    }

    if (sum !== null) {
      sum += numbers[i];
    }
  }

  return sum;
}

function hasIncreasingDigitProgression(number) {
  const digits = BigInt(Math.abs(Math.trunc(number))).toString();
  if (digits.length < 2) {
    return false;
  }

  const difference = Number(digits[1]) - Number(digits[0]);
  if (difference <= 0) {
    return false;
  }

  for (let i = 2; i < digits.length; i++) {
    if (Number(digits[i]) - Number(digits[i - 1]) !== difference) {
      return false;
    }
  }

  return true;
}

function findBrokenLink(words) {
  for (let i = 1; i < words.length; i++) {
    if (!words[i - 1].endsWith(words[i][0])) {
      return i;
    }
  }

  return -1;
}

function bindForm(id, calculate) {
  const form = document.getElementById(id);
  const input = form.querySelector('input');
  const output = form.querySelector('output');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    output.textContent = calculate(input.value.trim());
  });

  input.addEventListener('input', () => {
    output.textContent = '';
  });
}

bindForm('digit-form', (value) => {
  const position = Number(value);
  return Number.isInteger(position) && position >= 1 && position <= 300
    ? `Цифра на позиции ${position}: ${findDigit(position)}`
    : 'Введите целое число от 1 до 300.';
});

bindForm('array-form', (value) => {
  const entries = value.split(/[\s;]+/);
  const numbers = entries.map((entry) => Number(entry.replace(',', '.')));
  const decimal = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i;

  if (entries.some((entry, i) => !decimal.test(entry) || !Number.isFinite(numbers[i]))) {
    return 'Введите действительные числа через пробел или точку с запятой.';
  }

  const sum = sumFromPositiveCosine(numbers);
  const filtered = numbers.filter((number) => !hasIncreasingDigitProgression(number));

  const sumResult = sum === null ? 'элементов с положительным косинусом нет' : sum;
  return `А. Сумма: ${sumResult}\nБ. После удаления: [${filtered.join(', ')}]`;
});

bindForm('words-form', (value) => {
  const words = value.normalize('NFC').split(/\s+/);
  if (words.some((word) => !/^\p{L}+(?:[-’']\p{L}+)*$/u.test(word))) {
    return 'Введите слова через пробел.';
  }

  const brokenLink = findBrokenLink(words.map((word) => word.toLowerCase()));
  if (brokenLink === -1) {
    return 'Условие выполнено.';
  }

  return `Условие нарушено между словами «${words[brokenLink - 1]}» и «${words[brokenLink]}».`;
});
