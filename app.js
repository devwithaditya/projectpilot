const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const currencyOptions = [["USD", "USD — US Dollar"], ["EUR", "EUR — Euro"], ["GBP", "GBP — British Pound"], ["CAD", "CAD — Canadian Dollar"], ["AUD", "AUD — Australian Dollar"], ["INR", "INR — Indian Rupee"], ["JPY", "JPY — Japanese Yen"], ["MXN", "MXN — Mexican Peso"]];
const currencyRates = { USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.36, AUD: 1.52, INR: 83.5, JPY: 150, MXN: 17.8 };
const currencyLocales = { USD: "en-US", EUR: "de-DE", GBP: "en-GB", CAD: "en-CA", AUD: "en-AU", INR: "en-IN", JPY: "ja-JP", MXN: "es-MX" };
const currencyValueFields = new Set(["paintPrice", "primerPrice", "materialPrice", "installPrice", "bagPrice", "postPrice", "gatePrice", "laborPrice", "concretePrice", "materials", "tools", "rental", "hourlyValue", "quote"]);
const money = (value, currency = "USD") => {
  const code = currencyRates[currency] ? currency : "USD";
  return new Intl.NumberFormat(currencyLocales[code], { style: "currency", currency: code, maximumFractionDigits: 0 }).format(Math.max(0, value || 0) * currencyRates[code]);
};
const number = (value, digits = 1) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const whole = (value) => Math.max(0, Math.ceil(value || 0));
const localCurrencyValue = (value, currency) => {
  const precision = currency === "JPY" ? 0 : 2;
  const rounded = Math.round(Math.max(0, value || 0) * 10 ** precision) / 10 ** precision;
  return String(rounded);
};

const field = (name, label, value, options = {}) => {
  const type = options.type || "number";
  const input = type === "select"
    ? `<select id="${name}" name="${name}">${options.options.map(([key, text]) => `<option value="${key}" ${String(key) === String(value) ? "selected" : ""}>${text}</option>`).join("")}</select>`
    : `<input id="${name}" name="${name}" type="${type}" value="${value}" ${type === "number" ? `min="${options.min ?? 0}" step="${options.step ?? "any"}"` : ""} ${options.placeholder ? `placeholder="${options.placeholder}"` : ""} />`;
  const labelMarkup = options.currencyLabel ? `<label for="${name}" data-currency-label="${label}">${label} (USD)</label>` : `<label for="${name}">${label}</label>`;
  const helperMarkup = options.helper ? `<span class="helper${options.currencyHelper ? " currency-helper" : ""}">${options.helper}</span>` : "";
  return `<div class="field ${options.full ? "full" : ""}">${labelMarkup}${input}${helperMarkup}</div>`;
};

const checkbox = (name, label, checked = false, helper = "") => `<div class="field checkbox-field full"><input id="${name}" name="${name}" type="checkbox" ${checked ? "checked" : ""} /><label for="${name}">${label}</label>${helper ? `<span class="helper">${helper}</span>` : ""}</div>`;
const section = (title, fields) => `<div class="form-section"><h3>${title}</h3><div class="field-grid">${fields}</div></div>`;

const calculators = {
  paint: {
    hash: "paint-calculator",
    kicker: "PAINTING TOOL",
    title: "Paint project cost",
    description: "Estimate paint quantity and materials for interior walls and optional ceilings.",
    form: () => [
      section("Room details", field("rooms", "Number of rooms", 1, { min: 1, step: 1 }) + field("length", "Room length (ft)", 12, { min: 0.1 }) + field("width", "Room width (ft)", 14, { min: 0.1 }) + field("height", "Wall height (ft)", 9, { min: 0.1 }) + field("doors", "Doors", 1, { min: 0, step: 1 }) + field("windows", "Windows", 2, { min: 0, step: 1 })),
      section("Coverage & waste", field("coats", "Number of coats", 2, { min: 1, step: 1 }) + field("coverage", "Coverage per gallon (sq ft)", 350, { min: 1, helper: "Check your paint can for the manufacturer rating." }) + field("waste", "Extra paint / waste (%)", 10, { min: 0, max: 100, helper: "10% is a planning starting point." }) + checkbox("ceiling", "Include ceiling painting", false)),
      section("Your prices", field("currency", "Display results in", "USD", { type: "select", options: currencyOptions, helper: "Prices update when you change the currency.", currencyHelper: true }) + field("paintPrice", "Paint price per gallon", 42, { min: 0, currencyLabel: true }) + checkbox("primer", "Include one coat of primer", false) + field("primerPrice", "Primer price per gallon", 35, { min: 0, currencyLabel: true })),
      `<div class="error-message" id="form-error">Please enter positive measurements and check your prices.</div><button class="calculate-submit" type="submit">Calculate paint estimate <span aria-hidden="true">→</span></button>`
    ].join(""),
    calculate: (v) => {
      const wallArea = v.rooms * 2 * (v.length + v.width) * v.height;
      const openings = (v.doors * 21) + (v.windows * 15);
      const ceilingArea = v.ceiling ? v.rooms * v.length * v.width : 0;
      const paintableArea = Math.max(0, wallArea - openings) + ceilingArea;
      const gallonsBeforeWaste = (paintableArea * v.coats) / v.coverage;
      const gallons = whole(gallonsBeforeWaste * (1 + v.waste / 100));
      const primerGallons = v.primer ? whole((paintableArea * (1 + v.waste / 100)) / v.coverage) : 0;
      const paintCost = gallons * v.paintPrice;
      const primerCost = primerGallons * v.primerPrice;
      return { main: `${gallons} gallon${gallons === 1 ? "" : "s"}`, sub: "of paint recommended", lines: [["Paintable area", `${number(paintableArea)} sq ft`], ["Coverage used", `${number(v.coverage)} sq ft / gallon`], ["Paint cost", money(paintCost, v.currency)], ...(v.primer ? [["Primer cost", money(primerCost, v.currency)]] : []), ["Estimated materials", money(paintCost + primerCost, v.currency)]], highlight: ["Paint + primer estimate", money(paintCost + primerCost, v.currency)], note: "This estimate subtracts 21 sq ft per door and 15 sq ft per window, then adds your chosen waste allowance. Display currency uses an embedded planning conversion from USD.", details: [{ title: "How it works", text: "Wall area is calculated from room perimeter × wall height. Openings are deducted before coats and coverage are applied." }, { title: "Assumptions", list: [`${v.coats} coat${v.coats === 1 ? "" : "s"} of paint`, `${v.waste}% overage`, v.ceiling ? "Ceilings included" : "Ceilings excluded"] }, { title: "Planning tip", text: "Keep a small amount of leftover paint for future touch-ups, and confirm coverage on the product label." }] };
    }
  },
  flooring: {
    hash: "flooring-calculator",
    kicker: "FLOORING TOOL",
    title: "Flooring project cost",
    description: "Compare material, waste, installation, and total cost for a room or multiple rooms.",
    form: () => [
      section("Area to cover", field("rooms", "Number of rooms", 1, { min: 1, step: 1 }) + field("length", "Room length (ft)", 12, { min: 0.1 }) + field("width", "Room width (ft)", 14, { min: 0.1 }) + field("material", "Flooring type", "vinyl", { type: "select", options: [["hardwood", "Hardwood"], ["laminate", "Laminate"], ["vinyl", "Vinyl / LVP"], ["tile", "Tile"], ["carpet", "Carpet"]] })),
      section("Waste & pricing", field("currency", "Display results in", "USD", { type: "select", options: currencyOptions, helper: "Prices update when you change the currency.", currencyHelper: true }) + field("waste", "Waste / overage (%)", 10, { min: 0, max: 50, helper: "Complex layouts may need more." }) + field("materialPrice", "Material price per sq ft", 3.5, { min: 0, step: "0.01", currencyLabel: true }) + field("installPrice", "Installation per sq ft", 2.25, { min: 0, step: "0.01", currencyLabel: true })),
      `<div class="error-message" id="form-error">Please enter positive dimensions and non-negative prices.</div><button class="calculate-submit" type="submit">Calculate flooring estimate <span aria-hidden="true">→</span></button>`
    ].join(""),
    calculate: (v) => {
      const area = v.rooms * v.length * v.width;
      const purchaseArea = area * (1 + v.waste / 100);
      const materialCost = purchaseArea * v.materialPrice;
      const installCost = area * v.installPrice;
      const total = materialCost + installCost;
      return { main: money(total, v.currency), sub: "estimated project cost", lines: [["Floor area", `${number(area)} sq ft`], ["Material to purchase", `${number(purchaseArea)} sq ft`], ["Material cost", money(materialCost, v.currency)], ["Installation cost", money(installCost, v.currency)]], highlight: ["Material choice", v.material === "vinyl" ? "Vinyl / LVP" : v.material.charAt(0).toUpperCase() + v.material.slice(1)], note: `${number(v.waste)}% overage is included for cuts, layout changes, and future repairs. Installation applies to the base floor area. Display currency uses an embedded planning conversion from USD.`, details: [{ title: "How it works", text: "Base area is length × width × rooms. Waste is added to the material purchase quantity, not to the installation area." }, { title: "Assumptions", list: [`${number(v.waste)}% material overage`, `${money(v.materialPrice, v.currency)} / sq ft material`, `${money(v.installPrice, v.currency)} / sq ft installation`] }, { title: "Planning tip", text: "Ask about subfloor preparation, transitions, delivery, and removal of old flooring before accepting an installation quote." }] };
    }
  },
  concrete: {
    hash: "concrete-calculator",
    kicker: "CONSTRUCTION TOOL",
    title: "Concrete quantity",
    description: "Estimate cubic yards and bag counts for slabs, footings, columns, and circular forms.",
    form: () => [
      section("Project shape", field("project", "Project type", "slab", { type: "select", options: [["slab", "Slab / patio"], ["footing", "Rectangular footing"], ["column", "Column / round footing"], ["circular", "Circular slab"]] }) + field("quantity", "Number of forms", 1, { min: 1, step: 1 }) + field("length", "Length (ft)", 12, { min: 0.1 }) + field("width", "Width (ft)", 10, { min: 0.1 }) + field("depth", "Depth / height (ft)", 0.5, { min: 0.01, step: "0.01" }) + field("diameter", "Diameter (ft, round forms)", 3, { min: 0.1 })),
      section("Order assumptions", field("currency", "Display results in", "USD", { type: "select", options: currencyOptions, helper: "Prices update when you change the currency.", currencyHelper: true }) + field("waste", "Extra concrete (%)", 10, { min: 0, max: 50, helper: "Site conditions can require more." }) + field("bagYield", "60 lb bag yield (cu ft)", 0.45, { min: 0.01, step: "0.01" }) + field("bagPrice", "Price per 60 lb bag", 6.5, { min: 0, step: "0.01", currencyLabel: true })),
      `<div class="error-message" id="form-error">Please enter valid dimensions and assumptions.</div><button class="calculate-submit" type="submit">Calculate concrete quantity <span aria-hidden="true">→</span></button>`
    ].join(""),
    calculate: (v) => {
      let cubicFeet = 0;
      if (v.project === "column") cubicFeet = Math.PI * Math.pow(v.diameter / 2, 2) * v.depth * v.quantity;
      else if (v.project === "circular") cubicFeet = Math.PI * Math.pow(v.diameter / 2, 2) * v.depth * v.quantity;
      else cubicFeet = v.length * v.width * v.depth * v.quantity;
      const orderCubicFeet = cubicFeet * (1 + v.waste / 100);
      const yards = orderCubicFeet / 27;
      const bags = whole(orderCubicFeet / v.bagYield);
      return { main: `${number(yards, 2)} yd³`, sub: "recommended concrete order", lines: [["Calculated volume", `${number(cubicFeet, 2)} cu ft`], ["With extra concrete", `${number(orderCubicFeet, 2)} cu ft`], ["60 lb bags", `${bags} bags`], ["Bag estimate", money(bags * v.bagPrice, v.currency)]], highlight: ["Order planning", `${number(yards, 2)} cubic yards`], note: "Concrete requirements can change with excavation, grade, reinforcement, formwork, delivery minimums, and site conditions. Confirm quantities with your supplier. Display currency uses an embedded planning conversion from USD.", details: [{ title: "How it works", text: "Rectangular volume is length × width × depth. Circular forms use π × radius² × depth. The extra percentage is applied before converting to cubic yards and bags." }, { title: "Assumptions", list: [`${number(v.waste)}% extra concrete`, "60 lb bag yield is editable", "No delivery or pump fees included"] }, { title: "Planning tip", text: "For ready-mix deliveries, suppliers may sell in minimum increments. Order timing and access can matter as much as the math." }] };
    }
  },
  fence: {
    hash: "fence-calculator",
    kicker: "OUTDOOR TOOL",
    title: "Fence project cost",
    description: "Plan posts, panels, gates, labor, and materials for a straight-run fence estimate.",
    form: () => [
      section("Fence layout", field("length", "Total fence length (ft)", 150, { min: 1 }) + field("height", "Fence height (ft)", 6, { min: 1 }) + field("spacing", "Post spacing (ft)", 8, { min: 1 }) + field("panelWidth", "Panel / picket coverage (ft)", 8, { min: 0.1 }) + field("gates", "Number of gates", 1, { min: 0, step: 1 }) + field("material", "Fence material", "wood", { type: "select", options: [["wood", "Wood privacy"], ["vinyl", "Vinyl"], ["chain", "Chain link"], ["aluminum", "Aluminum"]] })),
      section("Your prices", field("currency", "Display results in", "USD", { type: "select", options: currencyOptions, helper: "Prices update when you change the currency.", currencyHelper: true }) + field("materialPrice", "Material cost per linear ft", 18, { min: 0, step: "0.01", helper: "Use a local quote or store price.", currencyLabel: true }) + field("postPrice", "Post cost each", 18, { min: 0, step: "0.01", currencyLabel: true }) + field("gatePrice", "Gate cost each", 350, { min: 0, step: "0.01", currencyLabel: true }) + field("laborPrice", "Labor per linear ft", 15, { min: 0, step: "0.01", currencyLabel: true }) + field("concretePrice", "Concrete per post", 8, { min: 0, step: "0.01", currencyLabel: true })),
      `<div class="error-message" id="form-error">Please enter positive layout values and non-negative prices.</div><button class="calculate-submit" type="submit">Calculate fence estimate <span aria-hidden="true">→</span></button>`
    ].join(""),
    calculate: (v) => {
      const posts = Math.ceil(v.length / v.spacing) + 1;
      const panels = Math.ceil(v.length / v.panelWidth);
      const materialCost = v.length * v.materialPrice + posts * v.postPrice + v.gates * v.gatePrice + posts * v.concretePrice;
      const labor = v.length * v.laborPrice;
      const total = materialCost + labor;
      return { main: money(total, v.currency), sub: "estimated fence project cost", lines: [["Posts", `${posts}`], ["Panels / coverage units", `${panels}`], ["Materials + concrete", money(materialCost, v.currency)], ["Labor estimate", money(labor, v.currency)]], highlight: ["Fence layout", `${number(v.length)} linear ft × ${number(v.height)} ft high`], note: "This is a straight-run planning estimate. Corners, slopes, demolition, permits, access, and local labor can change the final quote. Display currency uses an embedded planning conversion from USD.", details: [{ title: "How it works", text: "Posts are estimated from total length ÷ spacing, plus one end post. Panels or coverage units are rounded up to cover the run." }, { title: "Assumptions", list: [`${number(v.spacing)} ft post spacing`, `${v.gates} gate${v.gates === 1 ? "" : "s"}`, `${money(v.laborPrice, v.currency)} / linear ft labor`] }, { title: "Planning tip", text: "Before digging, confirm property lines, local height rules, utility locations, and whether a permit is required." }] };
    }
  },
  diy: {
    hash: "diy-calculator",
    kicker: "DECISION TOOL",
    title: "DIY or contractor?",
    description: "Put a value on your time and compare the financial trade-off before you decide.",
    form: () => [
      section("DIY inputs", field("currency", "Display results in", "USD", { type: "select", options: currencyOptions, helper: "Cost inputs are entered in USD and converted for display." }) + field("project", "Project type", "painting", { type: "select", options: [["painting", "Painting"], ["flooring", "Flooring"], ["fence", "Fence"], ["concrete", "Concrete"], ["other", "Other home project"]] }) + field("materials", "DIY material cost (USD)", 1200, { min: 0 }) + field("tools", "Tools you need to buy (USD)", 250, { min: 0 }) + field("rental", "Tool rental cost (USD)", 120, { min: 0 }) + field("hours", "Estimated DIY hours", 32, { min: 0, step: "0.5" }) + field("hourlyValue", "Value of your time per hour (USD)", 25, { min: 0, step: "0.01", helper: "Use a number that feels meaningful to you." })),
      section("Contractor comparison", field("quote", "Contractor quote (USD)", 2400, { min: 0 }) + field("duration", "Contractor duration (days)", 3, { min: 0, step: "0.5" }) + field("experience", "Your experience level", "some", { type: "select", options: [["new", "New to this"], ["some", "Some experience"], ["confident", "Very confident"]] })),
      `<div class="error-message" id="form-error">Please enter non-negative costs, time, and a contractor quote.</div><button class="calculate-submit" type="submit">Compare my options <span aria-hidden="true">→</span></button>`
    ].join(""),
    calculate: (v) => {
      const timeCost = v.hours * v.hourlyValue;
      const diyTotal = v.materials + v.tools + v.rental + timeCost;
      const difference = v.quote - diyTotal;
      const difficulty = v.experience === "new" ? "Higher" : v.experience === "some" ? "Medium" : "Lower";
      const recommendation = difference > 0 ? "DIY may save money" : difference < 0 ? "The quote may be worth considering" : "The options are close in value";
      return { main: money(Math.abs(difference), v.currency), sub: difference >= 0 ? "potential DIY advantage" : "contractor value advantage", lines: [["DIY cash cost", money(v.materials + v.tools + v.rental, v.currency)], ["Value of your time", money(timeCost, v.currency)], ["Total DIY value", money(diyTotal, v.currency)], ["Contractor quote", money(v.quote, v.currency)]], highlight: ["Balanced read", recommendation], note: `${difficulty} learning curve based on your experience. This is a planning comparison, not professional advice or a guarantee of project outcome. Display currency uses an embedded planning conversion from USD.`, details: [{ title: "How it works", text: "DIY value combines cash expenses with the value you assign to your time. It is compared with the contractor quote you entered." }, { title: "Assumptions", list: [`${number(v.hours)} hours of DIY time`, `${money(v.hourlyValue, v.currency)} value per hour`, `${number(v.duration)} contractor day${v.duration === 1 ? "" : "s"}`] }, { title: "Planning tip", text: "Ask what the contractor quote includes: preparation, cleanup, materials, permits, warranty, and disposal can change the comparison." }] };
    }
  }
};

function getValues(form) {
  const values = {};
  new FormData(form).forEach((value, key) => { values[key] = value === "on" ? true : (value === "" ? 0 : (Number.isNaN(Number(value)) ? value : Number(value))); });
  return values;
}

function syncCurrencyUI(form, currency) {
  $$('label', form).forEach((label) => {
    if (!label.dataset.currencyLabel && /\s\([A-Z]{3}\)$/.test(label.textContent)) label.dataset.currencyLabel = label.textContent.replace(/\s\([A-Z]{3}\)$/, "");
    if (label.dataset.currencyLabel) label.textContent = `${label.dataset.currencyLabel} (${currency})`;
  });
  $$('.currency-helper', form).forEach((helper) => { helper.textContent = `Prices update to ${currency} when you change the currency.`; });
  $$('.helper', form).forEach((helper) => {
    if (helper.textContent.includes("entered in USD") || helper.textContent.includes("Prices are shown in ")) helper.textContent = `Prices are shown in ${currency} and converted automatically.`;
  });
}

function convertCurrencyFields(form, fromCurrency, toCurrency) {
  const fromRate = currencyRates[fromCurrency] || 1;
  const toRate = currencyRates[toCurrency] || 1;
  const factor = toRate / fromRate;
  $$('input', form).filter((input) => currencyValueFields.has(input.name)).forEach((input) => {
    if (input.value !== "") input.value = localCurrencyValue(Number(input.value) * factor, toCurrency);
  });
}

function normalizeCurrencyValues(values) {
  const rate = currencyRates[values.currency] || 1;
  currencyValueFields.forEach((key) => {
    if (typeof values[key] === "number") values[key] /= rate;
  });
  return values;
}

function isValid(values) {
  const nonNegative = Object.entries(values).every(([key, value]) => key === "material" || key === "project" || key === "experience" || key === "currency" || key === "ceiling" || key === "primer" || (typeof value === "number" && value >= 0));
  const requiredPositive = ["length", "width", "height", "coverage", "rooms", "quote", "bagYield", "spacing", "panelWidth", "diameter"];
  return nonNegative && requiredPositive.every((key) => values[key] === undefined || values[key] > 0);
}

function renderResults(result) {
  const lineMarkup = result.lines.map(([label, value]) => `<div class="result-line"><span>${label}</span><b>${value}</b></div>`).join("");
  const detailMarkup = result.details.map((detail) => `<div class="detail-card"><h3>${detail.title}</h3>${detail.text ? `<p>${detail.text}</p>` : `<ul>${detail.list.map((item) => `<li>${item}</li>`).join("")}</ul>`}</div>`).join("");
  $("#calculator-results").innerHTML = `<div class="results-kicker">YOUR ESTIMATE</div><div class="main-result"><small>${result.sub}</small><strong>${result.main}</strong></div><div class="result-list">${lineMarkup}<div class="result-highlight"><div class="result-line"><span>${result.highlight[0]}</span><b>${result.highlight[1]}</b></div></div></div><p class="result-note">${result.note}</p><div class="result-actions"><button class="small-action" type="button" data-action="copy">Copy result</button><button class="small-action" type="button" data-action="print">Print</button></div>`;
  $("#calculator-details").innerHTML = detailMarkup;
  $$('[data-action="copy"]').forEach((button) => button.addEventListener("click", () => { navigator.clipboard?.writeText(`${result.sub}: ${result.main}\n${result.highlight[0]}: ${result.highlight[1]}`); button.textContent = "Copied ✓"; setTimeout(() => { button.textContent = "Copy result"; }, 1400); }));
  $$('[data-action="print"]').forEach((button) => button.addEventListener("click", () => window.print()));
}

function openCalculator(key) {
  const config = calculators[key];
  if (!config) return;
  $("#calculator").hidden = false;
  $("#calc-kicker").innerHTML = `<span class="eyebrow-dot"></span> ${config.kicker}`;
  $("#calc-title").textContent = config.title;
  $("#calc-description").textContent = config.description;
  $("#calculator-form").innerHTML = config.form();
  $("#calculator-results").innerHTML = `<div class="results-kicker">YOUR ESTIMATE</div><div class="main-result"><small>Ready when you are</small><strong>—</strong></div><p class="result-note">Enter your project details to see an estimate with assumptions and a clear breakdown.</p>`;
  $("#calculator-details").innerHTML = "";
  const form = $("#calculator-form");
  const currencySelect = $("#currency", form);
  let selectedCurrency = currencySelect ? currencySelect.value : "USD";
  syncCurrencyUI(form, selectedCurrency);
  if (currencySelect) currencySelect.addEventListener("change", () => {
    const nextCurrency = currencySelect.value;
    convertCurrencyFields(form, selectedCurrency, nextCurrency);
    selectedCurrency = nextCurrency;
    syncCurrencyUI(form, selectedCurrency);
    if (form.dataset.hasResult === "true") {
      const values = normalizeCurrencyValues(getValues(form));
      if (isValid(values)) renderResults(config.calculate(values));
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = normalizeCurrencyValues(getValues(form));
    const error = $("#form-error", form);
    if (!isValid(values)) { error.classList.add("visible"); return; }
    error.classList.remove("visible");
    form.dataset.hasResult = "true";
    renderResults(config.calculate(values));
  });
  if (!document.body.dataset.tool) $("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
}

window.ProjectPilotCalculators = calculators;
window.openProjectPilotCalculator = openCalculator;

function keyFromHash() {
  const hash = window.location.hash.replace("#", "");
  return Object.keys(calculators).find((key) => calculators[key].hash === hash);
}

$$("[data-tool]").forEach((button) => button.addEventListener("click", () => { window.location.hash = calculators[button.dataset.tool].hash; }));
const closeCalculator = $(".close-calculator");
if (closeCalculator) closeCalculator.addEventListener("click", () => {
  if (document.body.dataset.tool) { window.location.href = "../#tools"; return; }
  $("#calculator").hidden = true; document.querySelector("#tools").scrollIntoView({ behavior: "smooth" }); history.replaceState(null, "", "#tools");
});
$(".menu-toggle").addEventListener("click", (event) => { const nav = $(".main-nav"); const open = event.currentTarget.getAttribute("aria-expanded") === "true"; event.currentTarget.setAttribute("aria-expanded", String(!open)); nav.style.display = open ? "none" : "flex"; nav.style.position = "absolute"; nav.style.top = "68px"; nav.style.left = "0"; nav.style.right = "0"; nav.style.padding = "20px 17px"; nav.style.background = "var(--paper)"; nav.style.flexDirection = "column"; nav.style.gap = "17px"; });
window.addEventListener("hashchange", () => { const key = keyFromHash(); if (key) openCalculator(key); });
const initialKey = keyFromHash(); if (initialKey) openCalculator(initialKey);
