[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/sdk/docs/styles)

The `.autodoc/docs/json/sdk/docs/styles` folder contains CSS files that define the styling and layout for the Aleo project's user interface. These files ensure a consistent and visually appealing appearance across the entire project, including typography, colors, layout, and responsive design for different screen sizes.

The `clean-jsdoc-theme-base.css` file sets the foundation for the project's web pages, defining custom font faces, global styles, and specific components such as badges, blockquotes, tables, and code blocks. The layout is designed using Flexbox, with a fixed sidebar, top navigation bar, and main content area. The file also includes styles for a search functionality and a mobile menu.

For example, to style a table with proper spacing and border-radius, the following code is used:

```css
table {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 4px;
  overflow: hidden;
}
```

The `clean-jsdoc-theme-dark.css` and `clean-jsdoc-theme-light.css` files define the styling for the dark and light themes, respectively. These files cover a wide range of elements, including text, links, headings, sidebars, navigation bars, footers, tables, code blocks, and search components. They also include styling for syntax highlighting in code blocks using the `hljs` (highlight.js) library.

For example, to style the body element with a dark background color and white text color in the dark theme, the following code is used:

```css
.light body {
  background-color: #1a1a1a;
  color: #fff;
}
```

The `clean-jsdoc-theme.min.css` file is a minified version of the base CSS file, providing the same styling and layout but with a smaller file size for faster loading times.

In the larger project, these CSS files work together to provide a cohesive and visually appealing appearance for the user interface. The base CSS file sets the foundation, while the dark and light theme files customize the appearance based on the user's preference. The minified version of the base CSS file ensures faster loading times for the project's web pages.

Developers working with the Aleo project can use these CSS files to style their components and ensure a consistent appearance across the entire project. They can also customize the dark and light themes by modifying the respective CSS files, or create new themes by following the same structure.
