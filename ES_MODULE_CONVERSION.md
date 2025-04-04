# ES Module Conversion Guide for KaamMitra

This document provides guidance on working with the ES module system in the KaamMitra project, which has been converted from TypeScript to JavaScript.

## Understanding ES Modules vs. CommonJS

The KaamMitra project uses ES Modules (ESM) instead of CommonJS (CJS). Here's a quick comparison:

**CommonJS (Traditional Node.js):**
```javascript
// Importing
const express = require('express');
const { users } = require('./models');

// Exporting
module.exports = myFunction;
module.exports.namedExport = anotherFunction;
```

**ES Modules (Modern JavaScript):**
```javascript
// Importing
import express from 'express';
import { users } from './models.js';

// Exporting
export default myFunction;
export const namedExport = anotherFunction;
```

## Key Differences in ES Modules

1. **File Extensions**: Must include `.js` extension when importing local files
2. **No `require`**: Must use `import` instead of `require()`
3. **No `module.exports`**: Must use `export` or `export default`
4. **Top-level await**: Can use `await` at the top level (outside of async functions)
5. **No `__dirname` or `__filename`**: Must use alternative approaches

## How KaamMitra Uses ES Modules

The project is configured for ES Modules with:
```json
{
  "type": "module"
}
```
in `package.json`.

### Import Examples

Correct ES Module import examples from the KaamMitra codebase:

```javascript
// External packages
import express from 'express';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Local files (note the .js extension)
import { storage } from './storage.js';
import { users, jobs } from '../shared/schema.js';

// Named and default exports
import { setupVite, serveStatic, log } from "./vite.js";
import HomePage from "@/pages/home-page";
```

## Common Issues and Solutions

### 1. Missing .js Extensions

**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...' imported from '...'
```

**Solution:** 
Add `.js` extension to all local file imports:
```javascript
// Incorrect
import { storage } from './storage';

// Correct
import { storage } from './storage.js';
```

### 2. __dirname / __filename Not Available

**Error:**
```
ReferenceError: __dirname is not defined in ES module scope
```

**Solution:**
Use `import.meta.url` to get file paths:
```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now use join() to create paths
const filePath = join(__dirname, '../uploads');
```

### 3. Dynamic Imports

**Error:**
```
SyntaxError: Cannot use import statement outside a module
```

**Solution:**
Use dynamic imports with async/await:
```javascript
const loadModule = async (modulePath) => {
  const module = await import(`./modules/${modulePath}.js`);
  return module.default;
};
```

### 4. Circular Dependencies

**Error:**
```
ReferenceError: Cannot access '...' before initialization
```

**Solution:**
Refactor your code to avoid circular dependencies, or use dynamic imports.

### 5. Package Compatibility

**Error:**
```
Error [ERR_REQUIRE_ESM]: Must use import to load ES Module: ...
```

**Solution:**
Check if packages support ESM, or use dynamic imports as a workaround:
```javascript
const packageModule = await import('some-package');
```

## Path Resolution Issues on Windows

Windows uses backslashes (`\`) in file paths, which can cause issues with ES modules.

**Solutions:**
1. Use forward slashes (`/`) in all file paths
2. Use the `path` module for cross-platform compatibility
3. Avoid spaces in file paths and directory names

```javascript
import { join } from 'path';

// Cross-platform path
const uploadPath = join(process.cwd(), 'uploads', 'documents');
```

## Checking for ES Module Compatibility

To check if a file is using ES Module syntax correctly:

1. Ensure it uses `import`/`export` syntax
2. Check that local imports have `.js` extensions
3. Verify that package.json has `"type": "module"`
4. Look for legacy CommonJS syntax (`require`, `module.exports`)

## Additional Resources

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html)
- [MDN Import Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [MDN Export Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)