# Эксперимент: Code Blocks Round-Trip

**Дата:** 2026-04-05
**Issue:** #1

## Проблема

Google Docs не имеет нативного элемента «блок кода». Как сохранить fenced code blocks при round-trip?

## Эксперименты

### 1. Literal fences + Courier New

Вставлен текст ` ```javascript\n...\n``` ` со шрифтом Courier New.

**Export:**
```
\`\`\`javascript  
function hello() {  
  console.log("Hello");  
}  
\`\`\`  
```

**Результат:** Backticks экранированы (`\``), но контент и language tag сохранены. Trailing `  ` на каждой строке.

### 2. Single-cell table

Код вставлен в таблицу 1×1 с Courier New.

**Export:**
```
| function hello() {   console.log("Hello"); } |
| :---- |
```

**Результат:** Multiline код схлопнут в одну строку. **Непригодно.**

### 3. Plain text fences (без стилей)

Те же backtick fences без Courier New.

**Export:** Идентичен эксперименту 1 — backticks экранированы. Стиль не влияет на escaping.

## Решение

**Подход: Literal fences + unescape в normalizer.**

- `code-block.ts`: вставляет ` ``` ` как текст + Courier New + shading
- `normalize.ts`: unescape `\`` → `` ` ``, `\=` → `=`, `\_` → `_`; strip trailing `  `
- Round-trip: input.md → Doc → export (escaped) → normalize (unescape) → **match**

## Что сохраняется

- Контент code block — полностью
- Language tag — полностью
- Fence markers — через unescape

## Что теряется

- Визуально в Google Docs backticks видны как текст (не идеально, но функционально)
