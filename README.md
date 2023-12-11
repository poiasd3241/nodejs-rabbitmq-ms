# nodejs-rabbitmq-ms
## Описание
Система состоит из двух микросервисов:
1. ms1-req
- принимает запросы на выполнение задачи (HTTP API)
- передаёт запрос в очередь RabbitMQ
- получает результат выполнения задачи из другой очереди RabbitMQ
- возвращает полученный результат в ответе HTTP API
2. ms2-work
- выполняет задачи из очереди RabbitMQ
- передаёт результаты выполнения задачи в другую очередь RabbitMQ
## Развёртывание (docker)
Для развёртывая необходимо иметь
- сервер RabbitMQ
- docker
- склонированный данный репозиторий

**Общее для обоих сервисов:**
В корневых папках сервисов создать файл `.env` как копию файла `.env.example` и указать параметры сервера RabbitMQ.

**Развёртывание ms1-req:**
В файле `.env` указать порт (`PORT`), на котором будет доступен HTTP API (по умолчанию `8001`).
В корневой папке сервиса создать образ и контейнер сервиса.
Если `PORT` отличается от `8001`, соответственно изменить порт в `docker run`.
```
docker build -t ms1-req .
docker run --name=ms1-req -p 8001:8001 -itd ms1-req
```

**Развёртывание ms2-work:**
В корневой папке сервиса создать образ и контейнер сервиса.
```
docker build -t ms2-work .
docker run --name=ms2-work -itd ms2-work
```
## Пользование
ms1-req предоставляет эндпоинт POST `/work/key1`; эндпоинт принимает JSON с ключом `key1` со строковым значением.

**Пример запроса:** 
```
curl -L 'http://localhost:8001/work/key1' \
-H 'Content-Type: application/json' \
-d '{"key1":"value1"}'
```
Ответ:
```
{"data":{"key1":"value1_2460"},"isError":false}
```

**Пример некорректных запросов:**
(без ключа `key1`)
```
curl -L 'http://localhost:8001/work/key1' \
-H 'Content-Type: application/json' \
-d '{"key2":"value2"}'
```
(значение ключа `key1` не строковое)
```
curl -L 'http://localhost:8001/work/key1' \
-H 'Content-Type: application/json' \
-d '{"key1":123}'
```
Ответ:
```
{"isError":true,"errorMessage":"Missing or invalid key1 input"}
```
## Логирование
Для логирования используется библиотека `winston`.
Логирование осуществляется в файлы в корневой папке каждого сервиса:
- `logs/combined.log` (все сообщения)
- `logs/error.log` (сообщения уровня `error` и выше)

Файлы логов доступны внутри контейнеров.
Например, как войти в shell контейнера ms1-req:
```
docker exec -it ms1-req sh
```
Например, как прочитать лог в ms1-req, находясь в shell сервиса:
```
tail -f /app/logs/combined.log
```