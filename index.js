// TODO уточнить что есть хорошая практика для преобразования строки в число, нужно ли писать базу

// Закинуть этот код в IIFE, чтобы не было в глобальной области видимости formInputs, inputErrorClass и т.д., должен быть только объект MyForm

const formInputs = ["fio", "email", "phone"];
const inputErrorClass = "error";
const emailRegex = /^.+?@.+?\.[^@]+$/;

const phoneNumberRegEx = /\+7\(\d{3}\)\d{3}\-\d{2}\-\d{2}/;
const phoneNumberSumLimit = 30;
const allowDomains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];

const inputValidators = {
  fio: function(value) {
    // TODO усилить валидацию
    return value.trim().split(' ').length === 3
  },
  email: function(value) {
    if (!emailRegex.test(value)) {
      return false;
    }

    const [_, domain] = value.split('@');
    // возвращаем true или false в зависимости от того, каким доменом оканчиватся мыло
    return allowDomains.includes(domain);
  },
  phone: function(value) {
    if (!phoneNumberRegEx.test(value)) {
      return false;
    }

    const numberSum = value
      .replace(/[^\d]/g, '')
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);

    return numberSum <= phoneNumberSumLimit;
  }
};

class FormHandler {
  constructor() {
    this.form = document.getElementById("myForm");
    this.formStatusContainer = document.getElementById("resultContainer");
    this.formSubmitButton = document.getElementById("submitButton");
    this.form.addEventListener('submit', this.submit.bind(this));

    this.elements = formInputs.reduce((acc, inputName) => {
      acc[inputName] = this.form.elements[inputName]
      return acc;
    }, {});
    this.elementNames = Object.keys(this.elements);

    // Начальные тестовые значения
    this.setData({
      fio: "Горбунков Семён Семёныч",
      email: "mail@ya.ru",
      phone: "+7(111)222-33-44"
    });
  }

  validate() {
    return this.elementNames.reduce((acc, inputName) => {
      const inputValidator = inputValidators[inputName];
      const inputElement = this.elements[inputName];
      const isInputValid = inputValidator(inputElement.value);

      acc.isValid = acc.isValid && isInputValid;
      if (!isInputValid) {
        inputElement.classList.add(inputErrorClass);
        acc.errorFields.push(inputName);
      } else {
        inputElement.classList.remove(inputErrorClass);
      }

      return acc;
    }, {
      isValid: true,
      errorFields: [],
    });
  }

  getData() {
    return this.elementNames.reduce((acc, inputName) => {
      acc[inputName] = this.elements[inputName].value;
      return acc;
    }, {});
  }

  setData(formData) {
    // TODO подумать как точно должен работать этот метод
    // Сейчас он скидывает все поля, если они не пришли в объекте formData
    // Возможно нужно переделать, чтобы ставились только значения из formData
    this.elementNames.forEach(inputName => {
      this.elements[inputName].value = formData[inputName] || "";
    });
  }

  submit(event) {
    event.preventDefault();


    const { isValid, errorFields } = this.validate();
    if (!isValid) {
      return;
    }

    if (this.submitInProgress) {
      return;
    }
    //Если валидация прошла успешно, кнопка отправки формы должна стать неактивной...
    this.lockFormSubmit();
    const requestOptions = this._createOptions();
    this._sendRequest(requestOptions);
    //...и должен отправиться ajax-запрос
  }

  lockFormSubmit() {
    this.submitInProgress = true;
    this.formSubmitButton.setAttribute("disabled", "disabled");
  }

  unlockFormSumbit() {
    this.submitInProgress = false;
    this.formSubmitButton.removeAttribute("disabled");
  }

  _handleResponse(requestOptions) {
    return (response) => {
      const allowedStatuses = ["success", "error", "progress"];
      const status = response.status;

      if (allowedStatuses.includes(status)) {
        this.formStatusContainer.className  = `resultContainer ${status}`;

        if (status === "success") {

          this.formStatusContainer.innerText = "Success! Данные успешно отправлены.";
          this.setData({});
        } else if (status === "progress" && response.timeout) {
          this.formStatusContainer.innerText = "Progress! Идет обработка данных...";
          setTimeout(() => {
            this._sendRequest(requestOptions);
          }, parseInt(response.timeout, 10));
        } else {
          this.formStatusContainer.innerText = response.reason || "Ошибка обработки статуса";
        }
      } else {
        this.formStatusContainer.className  = `resultContainer error`;
        this.formStatusContainer.innerText = `Неизвестная ошибка. ${response}`
      }

      if (status !== "progress") {
        this.unlockFormSumbit();
      }
    }
  }

  _createOptions() {
    return {
      method: this.form.method,
      url: this.form.action,
      body: this.elementNames.map(inputName => `${inputName}=${encodeURIComponent(this.elements[inputName].value)}`).join('&')
    }
  }

  _sendRequest(options) {
    const handleResponse = this._handleResponse(options);

    return fetch(options.url, {
      method: options.method,
      body: options.body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(res => res.json())
      .then(handleResponse)
      .catch(handleResponse);
  }
}

const MyForm = new FormHandler();
