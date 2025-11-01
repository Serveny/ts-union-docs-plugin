# 🟦 TypeScript Union Docs Plugin

A TypeScript Language Service plugin that displays JSDoc comments from union type members directly in your editor's quick info (hover) tooltips.

<p align="center">
	<img width="700" height="393" alt="image" src="https://github.com/user-attachments/assets/e79d79e7-173a-4399-aad5-99ebc1ec2c27" />
</p>

## 💡 The Problem

By default, when you use a value from a union type, TypeScript's quick info just shows the literal value or the base union type. Documentation associated with that specific member of the union is ignored.

**Given this code:**

```typescript
type Color =
	/**
	 * Primary color
	 */
	| 'red'
	
	/**
	 * Secondary color
	 */
	| 'green'
	
	/**
	 * Third color
	 * 
	 * I'm blue da ba dee
	 */
	| 'blue';


/**
 * Log color function
 */
function logColor(color: Color): void {
	// ...
}

// When you hover over 'logColor' in the line below...
logColor('green');
```

**Before this plugin**, hovering over the function just shows the documentation of the function itself, not of the paramter union value.

## ✨ The Solution

This plugin resolves the union member back to its original definition, pulling its JSDoc documentation directly into the tooltip.

**After installing this plugin**, hovering over `'logColor'` now shows its full documentation.

## 🚀 Get Started

### 1\. Installation

Install the plugin as a development dependency using npm:

```bash
npm install --save-dev github:serveny/ts-union-type-docs-plugin
```

### 2\. Configuration

Enable the plugin in your `tsconfig.json` file:

```json
{
	"compilerOptions": {
		// ... your other options
		"plugins": [
			{
				"name": "ts-union-type-docs-plugin"
			}
		]
	}
}
```

### 3\. Restart VS Code

After updating your `tsconfig.json`, you **must restart your TS Server**. The easiest way is to open the VS Code Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`) and run the **"TypeScript: Restart TS server"** command.

## 📋 Features

- **Function Union Parameters Documentation:** When hovering over a a function.

## 🗺️ Roadmap

- **Variable Declarations:** When hovering over a `const` or `let` that is assigned a union member.
- **Dynamic Type Suggestions:** Provide intelligent suggestions for template literal types (e.g., typing `group${number}` would suggest `group0`, `group1`, etc.).

## 🛠️ Contributing & Development

Interested in helping build this plugin? We'd love to have you\!

### How to Debug

The easiest way to test your changes is to run a debug instance of VS Code that loads your local plugin code. The commands search the example project under `../example` (outside of plugin project folder)

> [!IMPORTANT]  
> The project to be debugged must be located outside the ts-union-type-docs-plugin folder. It wont work otherwise. If you want to use the example project, you must copy or move it out of the folder.

1. **Start watcher in plugin project folder:**

   This command builds the plugin and installs it in example project every time a file inside the plugin project was changed.

   ```bash
   npm run refresh-watch
   ```

2. **Start the example project with debugging enabled:**

   This command launches VS Code (`code`) using a special `TSS_DEBUG` port and a separate user data directory to avoid conflicts.

   ```bash
   npm run debug
   ```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.
