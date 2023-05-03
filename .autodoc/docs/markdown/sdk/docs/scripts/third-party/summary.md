[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/sdk/docs/scripts/third-party)

The `.autodoc/docs/json/sdk/docs/scripts/third-party` folder contains various third-party libraries and scripts that are used in the Aleo project to provide additional functionality and improve the user experience. These libraries and scripts include:

1. **Apache-License-2.0.txt**: This file contains the Apache License Version 2.0, which governs the use, modification, and distribution of the Aleo project's software and source code, ensuring that it remains open-source and freely available while protecting the rights of the original authors and contributors.

2. **fuse.js**: A lightweight fuzzy-search library that allows searching for approximate matches of a pattern within a collection of strings or objects. It can be used in the Aleo project to search through large datasets where exact matches may not always be possible or practical. Example usage:

   ```javascript
   const data = ['apple', 'banana', 'cherry'];
   const options = { includeScore: true, threshold: 0.4 };
   const fuse = new Fuse(data, options);

   const results = fuse.search('aple');
   // Results: [{ item: 'apple', refIndex: 0, score: 0.25 }]
   ```

3. **hljs-line-num-original.js** and **hljs-line-num.js**: These scripts provide line numbering functionality for code blocks highlighted using the `highlight.js` library. They add line numbers to the code blocks and ensure consistent copy/paste behavior across all browsers. Example usage:

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <link rel="stylesheet" href="path/to/highlight.js/styles/default.css">
     <script src="path/to/highlight.js"></script>
     <script src="path/to/this-file.js"></script>
     <script>hljs.initHighlightingOnLoad(); hljs.initLineNumbersOnLoad();</script>
   </head>
   <body>
     <pre><code class="hljs" data-ln-start-from="10">Your code here</code></pre>
   </body>
   </html>
   ```

4. **popper.js**: A positioning library for tooltips, popovers, and other floating elements. It calculates the position of an element relative to another element while considering various constraints, such as viewport boundaries, scrollable containers, and user-defined offsets. This library can be used in the Aleo project to create and manage the position of floating UI elements.

5. **tippy.js**: A highly customizable tooltip and popover library built on top of Popper.js. It can be used in the Aleo project to create tooltips, popovers, and other similar UI elements that appear when users interact with elements on a webpage.

6. **tocbot.min.js**: A script that generates a table of contents (TOC) based on the headings present in a given HTML content. The TOC is generated as a nested list of links, allowing users to easily navigate through the content by clicking on the desired heading. This script can be used in the Aleo project to automatically generate a table of contents for any HTML content with headings, improving the overall user experience. Example usage:

   ```javascript
   tocbot.init({
     tocSelector: '.js-toc',
     contentSelector: '.js-content',
     headingSelector: 'h1, h2, h3',
   });
   ```

These third-party libraries and scripts enhance the functionality of the Aleo project by providing additional features such as fuzzy search, line numbering for code blocks, tooltips and popovers, and table of contents generation. They can be integrated into the project to improve the user experience and make it easier for developers to work with the project.
