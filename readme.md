# Тестовое задание для Школы Node.js
**Руководство для проверяющих**


### Для запуска проекта понадобится одна единственная команда

```
npm start
```
Скопипастил с MDN самый простой сервер, даже без Express'a. Копипаста мною модифицирована, конкретно — XHR был заменен на [fetch()](https://developer.mozilla.org/ru/docs/Web/API/Fetch_API/Using_Fetch).

### Почему нельзя обойтись без поднятия локального сервера?
Основная сложность заключаеися в том что, XHR не работает с file:///... т.е с файлом, лежащим локально в файловой системе. У меня не хватило смекалки, чтобы обойти это ограничение. ***А можно ли обойти его вообще?***. Предположу, что в Школе мне расскажут об этом.

### Обработка ответов от сервера (success/progress/error).
Есть файл ```endpoint.json```, на который мы шлем запросы из action'а формы. Содержимое этого файла, а значит и ответ, который мы получим, определяется файлами ```success.json```, ```progress.json```, ```error.json```.

Эмуляция статусов ответа делается слудующим образом — берется содержимое ```success/progress/error.json``` и **руками** переносится в ```endpoint.json```.
Статус ```progress``` имеет таймаут 5 секунд и повторяет запрос, пока не вернется статус отличный от ```progress```. За время таймаута меняем содержимое ```endpoint.json``` и следующий запрос вернет нам ```success``` или ```error```.
