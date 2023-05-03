[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/sdk/docs/scripts)

The `.autodoc/docs/json/sdk/docs/scripts` folder contains various JavaScript files responsible for handling user interface (UI) functionalities and interactions in the Aleo project's documentation website. These functionalities include theme toggling, accordion behavior, font size adjustment, code block interactions, search functionality, and more.

For example, the `core.js` file handles UI features such as theme toggling, accordion behavior, font size adjustment, and code block interactions. The `toggleTheme` function can be used to switch between dark and light themes:

```javascript
// Toggle theme
toggleTheme();
```

The `resize.js` file is responsible for handling the resizing of a navigation bar (navbar) in the web application, allowing users to adjust the width of the navbar within a specified range and store their preference in the browser's local storage.

The `search.js` file implements a search functionality in the Aleo project, providing an interactive search experience by fetching data, filtering results based on user input, and displaying the results in a user-friendly manner. The search functionality can be triggered by calling the `showSearch()` function:

```javascript
// Show search container
showSearch();
```

The `third-party` subfolder contains various third-party libraries and scripts that are used in the Aleo project to provide additional functionality and improve the user experience. These libraries and scripts include `fuse.js` for fuzzy search, `hljs-line-num-original.js` and `hljs-line-num.js` for line numbering in code blocks, `popper.js` for positioning tooltips and popovers, `tippy.js` for creating tooltips and popovers, and `tocbot.min.js` for generating a table of contents based on the headings present in a given HTML content.

These JavaScript files and third-party libraries enhance the functionality of the Aleo project by providing additional features and improving the user experience. They can be integrated into the project to make it easier for developers to work with the project and provide a smooth user experience for the documentation website.
