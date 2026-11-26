"use strict";

const form = document.getElementById("marriage-form");
const formStatus = document.getElementById("form-status");
const result = document.getElementById("result");
const resultTitle = document.getElementById("result-title");
const details = document.getElementById("result-details");
const date = document.getElementById("ceremony-date");
const birthDates = form.querySelectorAll('[name$="-birth"]');
const fields = new Map();
const letters = /^\p{L}[\p{L}\p{M}]*(?:[ ’'-]\p{L}[\p{L}\p{M}]*)*$/u;

function updateDateLimits() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const localDate = `${today.getFullYear()}-${month}-${day}`;
  date.min = localDate;
  for (const birth of birthDates) {
    birth.max = localDate;
  }
}

function getError(control) {
  const { name, type, validity } = control;
  const value = control.value.trim();

  if (validity.badInput) return "Введите корректное значение.";
  if (validity.valueMissing || (control.required && !value)) {
    if (type === "radio") return "Выберите формат регистрации.";
    if (type === "checkbox") return "Подтвердите правильность данных.";
    if (type === "select-one") return "Выберите отдел ЗАГС.";
    return "Заполните это поле.";
  }

  if (!value) return "";
  if (validity.typeMismatch) return "Введите почту в формате name@example.com.";
  if (validity.tooLong) return `Введите не больше ${control.maxLength} символов.`;
  if (name === "guests" && !validity.valid) return "Введите целое число от 0 до 100.";
  if (name === "ceremony-time" && !validity.valid) return "Выберите время с 09:00 до 17:00.";
  if (type === "date" && !validity.valid) {
    return name === "ceremony-date"
      ? "Выберите сегодняшнюю дату или более позднюю."
      : "Дата рождения должна быть не позже сегодняшней даты.";
  }

  if (/(?:-surname|-name|-patronymic|-citizenship)$/.test(name) && !letters.test(value)) {
    return "Используйте буквы, пробелы, дефисы или апострофы.";
  }
  if (name.endsWith("-passport") && (!/^[\p{L}0-9 -]+$/u.test(value) || !/\d/.test(value))) {
    return "Введите серию и номер документа, используя буквы, цифры, пробелы или дефисы.";
  }
  if (name.endsWith("-address") && !/\p{L}/u.test(value)) {
    return "Введите адрес, содержащий название населённого пункта или улицы.";
  }
  if (name === "phone") {
    const digitCount = value.replace(/\D/g, "").length;
    if (!/^\+?[0-9() —-]+$/.test(value) || digitCount < 7 || digitCount > 15) {
      return "Введите телефон с 7–15 цифрами. Знак + ставится в начале.";
    }
  }
  return validity.valid ? "" : "Проверьте введённое значение.";
}

function showError(field, message) {
  field.error.textContent = message;
  field.error.hidden = !message;
  for (const control of field.controls) {
    if (message) {
      control.setAttribute("aria-invalid", "true");
    } else {
      control.removeAttribute("aria-invalid");
    }
  }
}

function validateField(field) {
  const message = getError(field.controls[0]);
  showError(field, message);
  return !message;
}

function formatValue(control) {
  if (control.type === "radio") return control.labels[0].textContent.trim();
  if (control.type === "checkbox") return "Да";
  if (control.type === "select-one") return control.selectedOptions[0].text;
  if (control.type === "date") return control.value.split("-").reverse().join(".");
  return control.value.trim() || "Не указано";
}

function buildResult() {
  const summary = document.createDocumentFragment();
  const groups = new Map();
  for (const field of fields.values()) {
    const first = field.controls[0];
    const control = first.type === "radio"
      ? field.controls.find((option) => option.checked)
      : first;
    const fieldset = control.closest("fieldset");
    const heading = fieldset?.querySelector("legend").lastChild.textContent.trim() || "Подтверждение";
    if (!groups.has(heading)) {
      const title = document.createElement("h3");
      title.textContent = heading;
      const list = document.createElement("dl");
      summary.append(title, list);
      groups.set(heading, list);
    }
    const label = document.createElement("dt");
    label.textContent = first.type === "radio"
      ? document.getElementById("ceremony-label").textContent
      : control.labels[0].textContent.trim();
    const value = document.createElement("dd");
    value.textContent = formatValue(control);
    groups.get(heading).append(label, value);
  }
  return summary;
}

for (const control of form.elements) {
  if (!control.name) continue;
  if (!fields.has(control.name)) {
    const container = control.closest(".field, .choice-group") || control.closest("label");
    const error = document.createElement("p");
    error.className = "field-error";
    error.id = `error-${control.name}`;
    error.hidden = true;
    if (control.type === "checkbox") {
      container.after(error);
    } else {
      container.append(error);
    }
    fields.set(control.name, { controls: [], error });
  }
  fields.get(control.name).controls.push(control);
  control.setAttribute("aria-describedby", `error-${control.name}`);
}

updateDateLimits();
form.noValidate = true;

function recheckEditedField(event) {
  const field = fields.get(event.target.name);
  if (field && !field.error.hidden) {
    updateDateLimits();
    validateField(field);
  }
  if (![...fields.values()].some((field) => !field.error.hidden)) {
    formStatus.textContent = "";
  }
}

form.addEventListener("input", recheckEditedField);
form.addEventListener("change", recheckEditedField);

form.addEventListener("reset", () => {
  for (const field of fields.values()) showError(field, "");
  formStatus.textContent = "";
  result.hidden = true;
  details.replaceChildren();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateDateLimits();
  let firstInvalid;
  for (const field of fields.values()) {
    if (!validateField(field) && !firstInvalid) firstInvalid = field.controls[0];
  }
  if (firstInvalid) {
    formStatus.textContent = "Проверьте выделенные поля.";
    firstInvalid.focus();
    return;
  }

  const summary = buildResult();
  form.reset();
  details.replaceChildren(summary);
  result.hidden = false;
  resultTitle.focus();
});
