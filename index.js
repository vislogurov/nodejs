const formInputs = ["fio", "email", "phone"];
const inputErrorClass = "error";

const emailRegex = /^.+?@.+?\.[^@]+$/;
const phoneNumberRegEx = /\+7\(\d{3}\)\d{3}\-\d{2}\-\d{2}/;

const phoneNumberSumLimit = 30;
const emailAllowedDomains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];

const inputValidators = {
  fio: function(value) {
    return value.trim().split(' ').length === 3
  },
  email: function(value) {
    if (!emailRegex.test(value)) {
      return false;
    }

    const [_, domain] = value.split('@');
    // возвращаем true если домен есть в списке разрешенных
    return emailAllowedDomains.includes(domain);
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
    this.fieldset = document.getElementById("myFormFieldset");
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
    //...и должен отправиться ajax-запрос
    this._sendRequest(requestOptions);
  }

  lockFormSubmit() {
    this.submitInProgress = true;
    this.formSubmitButton.setAttribute("disabled", "disabled");
    // Также на время отправки данных блокируем возможность ввести что-то в форму
    this.fieldset.setAttribute("disabled", "disabled");
  }

  unlockFormSumbit() {
    this.submitInProgress = false;
    this.formSubmitButton.removeAttribute("disabled");
    this.fieldset.removeAttribute("disabled", "disabled");
  }

  _handleResponse(requestOptions) {
    return (response) => {
      const allowedStatuses = ["success", "error", "progress"];
      const status = response.status;
      // Страховка на случай, если в timeout придет строка, а не Number
      const timeout = parseInt(response.timeout, 10);

      if (allowedStatuses.includes(status)) {
        this.formStatusContainer.className  = `resultContainer ${status}`;

        if (status === "success") {
          this.formStatusContainer.innerText = "Success";
          this.setData({});
        } else if (status === "progress" && timeout > 0) {
          this.formStatusContainer.innerText = "Progress! Идет обработка данных...";
          // через timeout миллисекунд повторяем запрос
          setTimeout(() => {
            this._sendRequest(requestOptions);
          }, timeout);
        } else {
          this.formStatusContainer.className  = `resultContainer error`;
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
