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
    metalType: sheetName.includes("металл") ? getColumnValues(28) : null, // Столбец AB (28)
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

// Вспомогательная функция для генерации имени листа
function generateTempSheetName(prefix) {
  const now = new Date();
  const timestamp = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    "yyyyMMdd_HHmmss"
  );
  return `${prefix}_${timestamp}`;
}

// Обработка формы Техника
function processForm(formData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const baseSheet = ss.getSheetByName("Калькулятор техники");
  if (!baseSheet) throw new Error('Лист "Калькулятор техники" не найден!');

  const tempSheet = baseSheet.copyTo(ss);
  const tempName = generateTempSheetName("Temp_Technika");
  tempSheet.setName(tempName);
  ss.setActiveSheet(tempSheet);
  ss.moveActiveSheet(ss.getSheets().length); // в самый конец

  const values = [
    formData.condition,
    formData.price,
    formData.term,
    formData.returnProb,
    formData.clientProfit,
    formData.complect,
  ];
  for (let i = 0; i < values.length; i++) {
    tempSheet.getRange(`C${i + 2}`).setValue(values[i]);
  }

  SpreadsheetApp.flush();
  const result = tempSheet.getRange("C8").getDisplayValue();

  return `Сумма кредита: ${result} грн`;
}

// Обработка формы Металл
function processFormMetall(formData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const baseSheet = ss.getSheetByName("Калькулятор металл");
  if (!baseSheet) throw new Error('Лист "Калькулятор металл" не найден!');

  const tempSheet = baseSheet.copyTo(ss);
  const tempName = generateTempSheetName("Temp_Metall");
  tempSheet.setName(tempName);
  ss.setActiveSheet(tempSheet);
  ss.moveActiveSheet(ss.getSheets().length); // в самый конец

  // Записываем данные в соответствующие ячейки
  tempSheet.getRange("C3").setValue(formData.metalType); // Проба металла в C3
  tempSheet.getRange("C4").setValue(formData.weight); // Вес изделия в C4
  tempSheet.getRange("C5").setValue(formData.category); // Категория в C5
  tempSheet.getRange("C6").setValue(formData.pledgeTerm); // Срок залога в C6
  tempSheet.getRange("C7").setValue(formData.returnProb); // Вероятность возврата в C7
  tempSheet.getRange("C8").setValue(formData.clientProfit); // Доход по клиенту в C8

  SpreadsheetApp.flush();
  const result = tempSheet.getRange("C10").getDisplayValue();

  return `Сумма кредита: ${result} грн`;
}

// Удаление устаревших временных листов по триггеру (например, раз в 2 часа)
function cleanUpTempSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();

  for (const sheet of sheets) {
    const name = sheet.getName();
    if (name.startsWith("Temp_")) {
      ss.deleteSheet(sheet);
    }
  }
}
