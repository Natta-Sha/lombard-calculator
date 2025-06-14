const SPREADSHEET_ID = "1W8eKFx9aVCCBeErjoqwAaUlQtpEvqRvIm-5X5AGeas4";

function getDropdownOptions(sheetName) {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) throw new Error(`Лист "${sheetName}" не найден`);

  function getColumnValues(col) {
    const values = sheet.getRange(2, col, sheet.getLastRow() - 1).getValues();
    return values.flat().filter(String);
  }

  return {
    metalType: sheetName.includes("металл") ? getColumnValues(1) : null,
    category: sheetName.includes("металл") ? getColumnValues(2) : null,
    pledgeTerm: sheetName.includes("металл") ? getColumnValues(3) : null,
    returnProb: getColumnValues(sheetName.includes("металл") ? 4 : 7),
    clientProfit: getColumnValues(sheetName.includes("металл") ? 5 : 10),
    complect: sheetName.includes("техника") ? getColumnValues(12) : null,
    condition: sheetName.includes("техника") ? getColumnValues(1) : null,
    term: sheetName.includes("техника") ? getColumnValues(4) : null,
  };
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  const page = (e.parameter.page || "main").toLowerCase();
  let template;

  switch (page) {
    case "technika":
      template = HtmlService.createTemplateFromFile("FormTechnika");
      template.data = getDropdownOptions("Служебный техника");
      template.baseUrl = ScriptApp.getService().getUrl();
      break;

    case "metall":
      template = HtmlService.createTemplateFromFile("FormMetall");
      template.data = getDropdownOptions("Служебный металл");
      template.baseUrl = ScriptApp.getService().getUrl();
      break;

    // Эти можно оставить, если нужны отдельные страницы с правилами
    case "rules_technika":
      template = HtmlService.createTemplateFromFile("RulesTechnika");
      template.title = "Правила техники";
      template.baseUrl = ScriptApp.getService().getUrl();
      break;

    case "rules_metall":
      template = HtmlService.createTemplateFromFile("RulesMetall");
      template.title = "Правила металла";
      template.baseUrl = ScriptApp.getService().getUrl();
      break;

    default:
      template = HtmlService.createTemplateFromFile("Main");
      template.baseUrl = ScriptApp.getService().getUrl();
  }

  return template
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function processForm(formData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(
    "Калькулятор техники"
  );
  if (!sheet) throw new Error('Лист "Калькулятор техники" не найден!');

  const values = [
    formData.condition,
    formData.price,
    formData.term,
    formData.returnProb,
    formData.clientProfit,
    formData.complect,
  ];

  for (let i = 0; i < values.length; i++) {
    sheet.getRange(`C${i + 2}`).setValue(values[i]);
  }

  SpreadsheetApp.flush();
  return `Сумма кредита: ${sheet.getRange("C8").getDisplayValue()} грн`;
}

function processFormMetall(formData) {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(
      "Калькулятор металл"
    );
  if (!sheet) throw new Error('Лист "Калькулятор металл" не найден!');

  const values = [
    formData.metalType,
    formData.estimatedValue,
    formData.weight,
    formData.category,
    formData.pledgeTerm,
    formData.returnProb,
    formData.clientProfit,
  ];

  for (let i = 0; i < values.length; i++) {
    sheet.getRange(`C${i + 2}`).setValue(values[i]);
  }

  SpreadsheetApp.flush();
  return `Сумма кредита: ${sheet.getRange("C10").getDisplayValue()} грн`;
}
