# iStat Language Support for VS Code

Provides syntax highlighting, language-aware brackets and indentation, code
snippets, and autocomplete for `.istat` files. Completion includes iStat
built-ins, language keywords, variables and user-defined function names in the
current file. No runtime or additional extension dependency is required.

## Run from this repository

Open the `vscode-extension` folder in VS Code and press **F5** to launch an
Extension Development Host. Open an `.istat` file there; use **Ctrl+Space** to
show completions.

## Package and install

Install the VS Code Extension Manager (`@vscode/vsce`) if it is not already
available, then run these commands from this folder:

```sh
npx @vscode/vsce package
code --install-extension istat-language-support-0.1.0.vsix
```

The extension recognizes `.istat` files and highlights iStat keywords,
operators, numbers, strings, comments and built-in function calls.
