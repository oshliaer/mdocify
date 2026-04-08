# Правила работы с ветками при реализации фич

> Заметка создана 2026-03-02 после инцидента: фича MATERIALIZED VIEW была реализована напрямую в `prod`-ветке.

## Проблема

Изменения кода (миграция, правка сервиса, версия) были сделаны в ветке `prod`, которая является деплой-веткой. Это создаёт риски:

- Нет код-ревью перед деплоем
- Невозможно откатить набор связанных изменений одним действием
- Нарушена линейность истории `master` → `prod`

## Правильный workflow для оператора

### Шаг 1. Создать feature-ветку от `master`

```bash
git checkout master
git pull origin master
git checkout -b feature/<название-фичи>
```

Пример для materialized view:

```bash
git checkout -b feature/materialized-view-cold-start
```

### Шаг 2. Реализовать изменения

Оператор даёт задание Claude Code, указывая:

1. **Что сделать** — описание фичи, ссылка на план
2. **Контекст** — какие файлы затронуты, какая проблема решается
3. **Ветка** — явно указать, что работа в feature-ветке

Пример промпта:

```
Мы на ветке feature/materialized-view-cold-start.
Реализуй следующий план: [описание]
НЕ деплой на прод — только код и тесты.
```

### Шаг 3. Коммит и push

```bash
git add <файлы>
git commit -m "feat: описание изменений"
git push -u origin feature/<название-фичи>
```

### Шаг 4. Pull Request в `master`

```bash
gh pr create --base master --title "feat: MATERIALIZED VIEW + cold start fix" --body "описание"
```

Ревью можно попросить у Claude Code:

```
Сделай код-ревью PR #<номер>
```

### Шаг 5. Merge в master

После одобрения:

```bash
gh pr merge <номер> --squash
```

### Шаг 6. Деплой: merge `master` → `prod`

```bash
git checkout prod
git pull origin prod
git merge master
git push origin prod
```

Это запустит GitHub Actions workflow (`.github/workflows/deploy.yml`), который:

1. Запустит тесты
2. Доставит код на сервер (rsync)
3. Соберёт Docker-образ
4. Запустит миграции
5. Перезапустит сервисы
6. Проверит health check

### Шаг 7. Ручные действия на проде (если нужны)

Если миграция имеет timestamp меньше уже применённых (как в нашем случае), TypeORM её не подхватит автоматически. Тогда после деплоя:

```bash
# SSH на сервер
ssh user@host

# Применить SQL миграции вручную
cd /path/to/app
docker compose exec -T postgres-service psql -U <user> -d <db> < migration.sql

# Или через Claude Code:
# "Примени миграцию 1709290800004 на проде через psql"
```

## Чек-лист для оператора

- [ ] Feature-ветка создана от `master`
- [ ] Код реализован и закоммичен в feature-ветке
- [ ] PR создан в `master`
- [ ] Код-ревью пройдено
- [ ] PR смёрджен в `master`
- [ ] `master` смёрджен в `prod`
- [ ] CI/CD workflow прошёл успешно
- [ ] Ручные миграции применены (если нужны)
- [ ] Проверка на проде выполнена

## Антипаттерны

| Что НЕ делать | Почему |
|---------------|--------|
| Коммитить напрямую в `prod` | Нет ревью, риск сломать деплой |
| Коммитить напрямую в `master` | Нет PR, нет истории обсуждений |
| Деплоить через rsync без CI/CD | Нет тестов, нет health check, нет rollback |
| Забывать про VERSION/CHANGELOG | Потеря трекинга изменений |

## Исключения

Для **hotfix** (критический баг на проде):

1. Ветка `hotfix/<описание>` от `prod`
2. Минимальный фикс → PR в `prod`
3. После деплоя — cherry-pick или merge обратно в `master`
