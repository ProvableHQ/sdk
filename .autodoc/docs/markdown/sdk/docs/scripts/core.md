[View code on GitHub](https://github.com/AleoHQ/aleo/sdk/docs/scripts/core.js)

This code is responsible for handling various UI features and interactions in the Aleo project's documentation website. The primary functionalities include theme toggling, accordion behavior, font size adjustment, and code block interactions.

1. **Theme Toggling**: The `toggleTheme` function is responsible for switching between dark and light themes. It updates the `data-theme` attribute, the class list of the body element, and the localStorage to store the user's theme preference.

2. **Accordion Behavior**: The `initAccordion` function initializes the accordion behavior for the sidebar sections. It sets up click event listeners for each sidebar section title and toggles the `data-isopen` attribute to expand or collapse the section. The accordion state is stored in localStorage to persist the user's preference.

3. **Font Size Adjustment**: The code provides functions to increment, decrement, and reset the font size of the content. The font size is stored in localStorage to remember the user's preference. A tooltip is also provided for the font size adjustment controls.

4. **Code Block Interactions**: The code adds features to the code blocks, such as syntax highlighting using the `hljs` library, line numbering, and a copy-to-clipboard button. It also adds anchor links to headings for easy navigation and sharing.

5. **Table of Contents**: The code hides the table of contents on source pages and brings the selected section into view when the page loads or when the URL hash changes.

6. **Mobile Menu**: The code initializes the mobile menu and sets up click event listeners to show or hide the mobile menu.

7. **Miscellaneous**: The code also includes functions for fixing table layouts, adding href attributes to sidebar titles, and initializing tooltips for various UI elements.

Example usage:

```javascript
// Toggle theme
toggleTheme();

// Increment font size
incrementFont(event);

// Decrement font size
decrementFont(event);

// Reset font size
updateFontSize(16);
```
## Questions: 
 1. **Question**: What is the purpose of the `toggleTheme` function and how does it work?
   **Answer**: The `toggleTheme` function is used to switch between the dark and light themes of the webpage. It gets the current theme from the body's `data-theme` attribute, determines the new theme, and then calls the `updateTheme` function to apply the new theme.

2. **Question**: How does the `initAccordion` function work and when is it called?
   **Answer**: The `initAccordion` function initializes the accordion functionality for the sidebar sections. It is called when the DOM content is loaded. It sets up event listeners for the sidebar section titles and toggles the accordion state based on the stored accordion IDs in the local storage.

3. **Question**: How does the `bringElementIntoView` function work and what is its purpose?
   **Answer**: The `bringElementIntoView` function is used to scroll the specified element into the viewport. It calculates the offset based on the navbar's height and scrolls the body accordingly. It also has an optional parameter `updateHistory` which, when set to true, updates the browser's history with the element's ID.