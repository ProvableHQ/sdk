import React from "react";
import "./index.css";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routing.jsx";
import WorkerProvider from "./workers/WorkerProvider.jsx";
import { init } from '@amplitude/analytics-browser';
import { autocapturePlugin } from '@amplitude/plugin-autocapture-browser';

// // Initialize Amplitude with your API key
// const AMPLITUDE_API_KEY = process.env.VITE_AMPLITUDE_API_KEY;
//
// if (AMPLITUDE_API_KEY) {
//   init(AMPLITUDE_API_KEY, {
//     serverZone: "US",
//     defaultTracking: {
//       sessions: true,
//       pageViews: true,
//       formInteractions: true,
//       fileDownloads: true,
//     },
//     plugins: [
//       autocapturePlugin()
//     ]
//   });
// }

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <WorkerProvider>
            <RouterProvider router={router} />
        </WorkerProvider>
    </React.StrictMode>,
);

const reportWebVitals = (onPerfEntry) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        import("web-vitals").then(
            ({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS(onPerfEntry);
                getFID(onPerfEntry);
                getFCP(onPerfEntry);
                getLCP(onPerfEntry);
                getTTFB(onPerfEntry);
            },
        );
    }
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();