# mdocify

CLI-инструмент для конвертации Markdown → Google Docs через batch API. Надстройка для gws.

## Команды

- `npm run dev -- convert <file>` — конвертировать md в Google Doc
- `npm test` — запуск unit/integration тестов
- `npm run test:e2e` — запуск E2E тестов (нужен gws auth)
- `npm run build` — сборка TypeScript

## Архитектура

```
md → remark-parse (MDAST) → compiler (BatchRequest[]) → executor (gws batchUpdate) → Google Doc
```

## Ключевые принципы

- **Истинный md** = то, что возвращает Google Docs export (`text/markdown`)
- **Round-trip тест:** input.md → Doc → export → exported.md → diff
- **Отчёт о потерях:** если export упрощает md, система сообщает что потеряно
- **Двухпроходная компиляция:** вставка текста (вперёд) → стили (назад по индексам)
- **UTF-16 code units** для индексов (Google Docs API требование)

## Стек

TypeScript, ESM, unified/remark, vitest, commander, gws CLI
