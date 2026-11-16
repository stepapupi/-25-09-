"use strict";
const form = document.getElementById("marriage-form");
const result = document.getElementById("result");
const date = document.getElementById("ceremony-date");
// Локальная дата без сдвига часового пояса при преобразовании в UTC.
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
date.min = localDate;
for (const birth of form.querySelectorAll('[name$="-birth"]')) {
  birth.max = localDate;
}
form.addEventListener("input", () => { result.textContent = ""; });
form.addEventListener("change", () => { result.textContent = ""; });
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const office = document.getElementById("office");
  const dateLabel = new Intl.DateTimeFormat("ru-RU").format(new Date(`${data.get("ceremony-date")}T12:00:00`));
  result.textContent = `Учебное заявление заполнено. ${office.options[office.selectedIndex].text}, ${dateLabel}, ${data.get("ceremony-time")}. Данные не отправлялись.`;
});
form.addEventListener("reset", () => { result.textContent = ""; });
