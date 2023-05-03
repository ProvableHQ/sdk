[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/website/src/components)

The `CopyButton.js` file contains a reusable React component called `CopyButton` that provides a button with copy-to-clipboard functionality. This component can be used throughout the Aleo project to enable users to easily copy specific data to their clipboard with a single click.

The component utilizes the `useState` hook from React to manage its internal state, specifically whether the copy action was successful or not. It initializes the `copySuccess` state to `false` and updates it using the `setCopySuccess` function.

The `copy` function is responsible for the actual copy-to-clipboard action. It uses the `copyToClipboard` function from the `copy-to-clipboard` library to copy the data passed through the `props` object. After a successful copy, it sets the `copySuccess` state to `true` and schedules a callback to set it back to `false` after 2 seconds using `setTimeout`.

The component's rendering logic is based on the value of the `copySuccess` state. If the copy action was successful, it renders a `CheckCircleOutlined` icon from the `@ant-design/icons` library, indicating that the data has been copied. Otherwise, it renders a `CopyOutlined` icon, which represents the copy action. Both icons have an `onClick` event handler that triggers the `copy` function when clicked.

To use this component in the larger project, simply import it and include it in the desired location, passing the data to be copied as a prop:

```jsx
import { CopyButton } from "./path/to/CopyButton";

// ...

<CopyButton data="Text to be copied" />
```

This will render a copy button that, when clicked, copies the specified data to the user's clipboard and provides visual feedback on the success of the action.
