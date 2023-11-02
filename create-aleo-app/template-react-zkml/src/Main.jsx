import React, { useEffect, useRef, useState } from "react";
import {
    NumberOutlined,
    SlidersOutlined,
    TagsOutlined,
} from "@ant-design/icons";
import {
    Layout,
    Menu,
    Card,
    Row,
    Col,
    Slider,
    Button,
    Progress,
    Space,
    Typography,
    Input,
    Select,
} from "antd";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Column } from "@ant-design/charts";
import aleoLogo from "./assets/aleo.svg";
import { AleoWorker } from "./workers/AleoWorker.js";
import './Main.css';

import { mlp_program, decision_tree_program, decision_tree_program_even_odd, mlp_program_even_odd, test_imageData, expected_runtimes, run_JS_decision_tree_classification, run_JS_decision_tree_even_odd, run_JS_mlp_even_odd, run_JS_mlp_classification } from './variables.js';

const { Text, Title, Paragraph } = Typography;
const { Header, Content, Footer, Sider } = Layout;
const { Option } = Select;

var model_type = "decision_tree";
var proving_finished = false;
let used_model_type, proving_start_time, proving_end_time;

const aleoWorker = AleoWorker();

var run_counter = {}

var proofText = "";
const fixed_point_scaling_factor = 16;
const int_type = "i64";

let struct0_0 = { x0: 0, x1: 0 };
let struct0_1 = { x0: 0, x1: 0 };
let struct0_2 = { x0: 0, x1: 0 };
let struct0_3 = { x0: 0, x1: 0 };
let struct0_4 = { x0: 0 };
let struct0_5 = { x0: 0 };
let struct0_6 = { x0: 0 };
let struct0_7 = { x0: 0 };
let struct0_8 = { x0: 0 };
let struct0_9 = { x0: 0 };
let struct0_10 = { x0: 0 };
let struct0_11 = { x0: 0 };
let struct0_12 = { x0: 0 };
let struct0_13 = { x0: 0 };
let struct0_14 = { x0: 0 };
let struct0_15 = { x0: 0 };

const Main = () => {

    const [showVerificationChart, setShowVerificationChart] = useState(true);
    const [account, setAccount] = useState(null);
    const [selectedKey, setSelectedKey] = useState("1");

    const [decisionTreePrediction, setDecisionTreePrediction] = useState('');
    const [mlpPrediction, setMlpPrediction] = useState('');

    const [drawTimeout, setDrawTimeout] = useState(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    const [userHasDrawn, setUserHasDrawn] = useState(false);
    const [clearButtonPressed, setClearButtonPressed] = useState(false);


    function computeSoftmax(values, scalingFactor = 1) {
        const scaledValues = values.map(v => v / scalingFactor);
        const maxVal = Math.max(...scaledValues);
        const expValues = scaledValues.map(v => Math.exp(v - maxVal)); // subtract max for numerical stability
        const sumExpValues = expValues.reduce((acc, v) => acc + v, 0);
        const softmax = expValues.map(v => v / sumExpValues);
        return softmax;
    }
    
    function convert_proof_to_softmax(executionResponse) {
        const executionResponse_JSON = JSON.parse(executionResponse);
        console.log("executionResponse_JSON", executionResponse_JSON);
    
        let used_model;
        let used_mode;
    
        const program = executionResponse_JSON["program"];
        
        if (program.includes("tree_mnist_1.aleo")) {
            used_mode = "2"; // classification
            used_model = "tree";
        } else if (program.includes("tree_mnist_2.aleo")) {
            used_mode = "1"; // even/odd
            used_model = "tree";
        } else if (program.includes("sklearn_mlp_mnist_1.aleo")) {
            used_mode = "2"; // classification
            used_model = "mlp";
        } else if (program.includes("sklearn_mlp_mnist_2.aleo")) {
            used_mode = "1"; // even/odd
            used_model = "mlp";
        }
    
        let num_softmax_elements;
        if (used_mode === "1") {
            num_softmax_elements = 2;
        } else if (used_mode === "2") {
            num_softmax_elements = 10;
        }
    
        console.log("used_model", used_model, "used_mode", used_mode, "num_softmax_elements", num_softmax_elements);
    
        let output_fixed_point_scaling_factor;
    
        if (used_model === "tree") {
            output_fixed_point_scaling_factor = fixed_point_scaling_factor;
        } else if (used_model === "mlp") {
            output_fixed_point_scaling_factor = fixed_point_scaling_factor ** 3;
        }
    
        const outputs_JSON = executionResponse_JSON["execution"]["transitions"][0]["outputs"];
        const converted_features = outputs_JSON.map(output => {
            const outputNum = Number(String(output["value"]).replace(int_type, ""));
            return outputNum / output_fixed_point_scaling_factor;
        });
    
        console.log("converted_features", converted_features);
    
        let softmax;
        if (used_model === "mlp") {
            softmax = computeSoftmax(converted_features, 1);
        } else if (used_model === "tree") {
            softmax = Array(num_softmax_elements).fill(0);
            softmax[converted_features[0]] = 1;
        }
    
        return softmax;
    }

      async function execute(fixed_point_features) {

        // helpful tool: https://codepen.io/jsnelders/pen/qBByqQy

        const input_array = [`{x0: ${fixed_point_features[0]}${int_type}, x1: ${fixed_point_features[1]}${int_type}}`, `{x0: ${fixed_point_features[2]}${int_type}, x1: ${fixed_point_features[3]}${int_type}}`, `{x0: ${fixed_point_features[4]}${int_type}, x1: ${fixed_point_features[5]}${int_type}}`, `{x0: ${fixed_point_features[6]}${int_type}, x1: ${fixed_point_features[7]}${int_type}}`, `{x0: ${fixed_point_features[8]}${int_type}}`, `{x0: ${fixed_point_features[9]}${int_type}}`, `{x0: ${fixed_point_features[10]}${int_type}}`, `{x0: ${fixed_point_features[11]}${int_type}}`, `{x0: ${fixed_point_features[12]}${int_type}}`, `{x0: ${fixed_point_features[13]}${int_type}}`, `{x0: ${fixed_point_features[14]}${int_type}}`, `{x0: ${fixed_point_features[15]}${int_type}}`, `{x0: ${fixed_point_features[16]}${int_type}}`, `{x0: ${fixed_point_features[17]}${int_type}}`, `{x0: ${fixed_point_features[18]}${int_type}}`, `{x0: ${fixed_point_features[19]}${int_type}}`];

        console.log("input_array", input_array);

        let model;
        if(model_type == "decision_tree" && selectedKey == "2") {
            model = decision_tree_program;
            used_model_type = "tree";
        }
        else if(model_type == "decision_tree" && selectedKey == "1") {
            model = decision_tree_program_even_odd;
            used_model_type = "tree";
        }
        else if(model_type == "mlp_neural_network" && selectedKey == "2") {
            model = mlp_program;
            used_model_type = "mlp";
        }
        else if(model_type == "mlp_neural_network" && selectedKey == "1") {
            model = mlp_program_even_odd;
            used_model_type = "mlp";
        }
        proving_start_time = performance.now();

        console.log("starting to measure proving time, before execution")

        var [result, executionResponse] = await aleoWorker.localProgramExecution(
            model,
            "main",
            input_array,
            true
        );

        proofText = executionResponse;
        console.log("executionResponse", executionResponse)

        proving_end_time = performance.now();
        console.log("proving time in seconds", (proving_end_time - proving_start_time) / 1000);

        proving_finished = true;

        console.log("result", result);
        var result_JSON = [];
        // iterate over result, and convert entries to JSON
        for (let i = 0; i < result.length; i++) {
            result_JSON.push(JSON.parse(result[i]));
        }

        var softmax = convert_proof_to_softmax(executionResponse);

        console.log("softmax", softmax);

        if(softmax.length === 2) {
            setChartDataProof([
                { label: "Even", value: softmax[0] * 100 },
                { label: "Odd", value: softmax[1] * 100 },
            ]);
        }                

        if(softmax.length == 10) {
            setChartDataProof(
                Array.from({ length: 10 }, (_, index) => ({
                    label: String(index),
                    value: softmax[index] * 100,
                }))
            );
        }

        var selected_setting = menuItems[selectedKey - 1].label;
        var runs = run_counter[selected_setting][model_type];
        run_counter[selected_setting][model_type] = runs + 1;
        console.log("incremented run_counter[selected_setting][model_type]", run_counter[selected_setting][model_type])

      }

      const getTopLeftPixelData = async () => {
        try {
          const dataUrl = await canvasRef.current.exportImage("png");
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0, img.width, img.height);
            const imageData = tempCtx.getImageData(0, 0, 1, 1);
            console.log("Top left pixel data:", imageData.data);
          };
        } catch (error) {
          console.error("Failed to get top left pixel data:", error);
        }
      };

    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [isProgressRunning, setIsProgressRunning] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    const [chartDataProof, setChartDataProof] = useState([
        { label: "Even", value: 0 },
        { label: "Odd", value: 0 },
    ]);
    const [chartDataVerify, setChartDataVerify] = useState([
        { label: "Even", value: 0 },
        { label: "Odd", value: 0 },
    ]);

    const [brushSize, setBrushSize] = useState(10);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    async function synthesizeKeys(model) {
        await aleoWorker.synthesizeKeys(model, "main");
    }

    const menuItems = ["Even/Odd", "Classification"].map(
        (label, index) => ({
            key: String(index + 1),
            icon: [<NumberOutlined />, <TagsOutlined />][
                index
            ],
            label: label,
        }),
    );

    const zerochartDataProof = () => {
        setchartDataProof(
            chartDataProof.map((item) => ({
                ...item,
                value: 0,
            })),
        );
    };

    const processImage = async (image) => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(image, 0, 0, 28, 28);
        const imageData = ctx.getImageData(0, 0, 28, 28);
        const data = imageData.data;
    
        // Create a 2D array to store the single-channel grayscale values
        const grayscaleData = Array.from({ length: 28 }, () => new Uint8ClampedArray(28));
    
        for (let i = 0; i < data.length; i += 4) {
            // Calculate the grayscale value
            const grayscale = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            // Invert the grayscale value
            const invertedGrayscale = 255 - grayscale;
            // Calculate the current row and column
            const row = Math.floor(i / 4 / 28);
            const col = (i / 4) % 28;
            // Assign the inverted grayscale value to the 2D array
            grayscaleData[row][col] = invertedGrayscale;
        }
    
        return grayscaleData;
    };
    

    function getBoundingBox(img) {
        const height = img.length;
        const width = img[0].length;
      
        let rmin = height;
        let rmax = 0;
        let cmin = width;
        let cmax = 0;
      
        for (let row = 0; row < height; row++) {
          for (let col = 0; col < width; col++) {
            if (img[row][col] !== 0) { // Non-zero pixel
              if (row < rmin) rmin = row;
              if (row > rmax) rmax = row;
              if (col < cmin) cmin = col;
              if (col > cmax) cmax = col;
            }
          }
        }
      
        // If no non-zero pixels were found, return an empty array
        if (rmax < rmin || cmax < cmin) {
          return [];
        }
      
        // Extract the bounding box
        const cropped = img.slice(rmin, rmax + 1).map(row => row.slice(cmin, cmax + 1));
      
        return cropped;
      }

      const resizeImage = (image, newSize) => {
        const height = image.length;
        const width = image[0].length;
        const resizedImage = Array.from({ length: newSize }, () => new Uint8ClampedArray(newSize));
      
        const xScale = width / newSize;
        const yScale = height / newSize;
      
        for (let i = 0; i < newSize; i++) {
          for (let j = 0; j < newSize; j++) {
            const xStart = Math.floor(j * xScale);
            const yStart = Math.floor(i * yScale);
            const xEnd = Math.floor((j + 1) * xScale);
            const yEnd = Math.floor((i + 1) * yScale);
      
            let sum = 0;
            let count = 0;
      
            for (let y = yStart; y < yEnd; y++) {
              for (let x = xStart; x < xEnd; x++) {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                  sum += image[y][x];
                  count++;
                }
              }
            }
      
            resizedImage[i][j] = count > 0 ? Math.max(0, Math.round(sum / count)) : 0;
          }
        }
      
        return resizedImage;
      };
            

    function computeIntegralImage(image) {
        const height = image.length;
        const width = image[0].length;
        const integralImage = Array.from({length: height}, () => new Array(width).fill(0));
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            integralImage[y][x] =
              image[y][x] +
              (integralImage[y][x - 1] || 0) +
              (integralImage[y - 1] ? integralImage[y - 1][x] : 0) -
              (integralImage[y - 1] ? integralImage[y - 1][x - 1] || 0 : 0);
          }
        }
        
        return integralImage;
      }

      function sumRegion(integralImage, top_left, bottom_right) {
        const [tl_y, tl_x] = top_left;
        const [br_y, br_x] = bottom_right;
      
        let total = integralImage[br_y][br_x];
        if (tl_y > 0) total -= integralImage[tl_y - 1][br_x];
        if (tl_x > 0) total -= integralImage[br_y][tl_x - 1];
        if (tl_y > 0 && tl_x > 0) total += integralImage[tl_y - 1][tl_x - 1];
      
        return total;
      }

      function computeHaarFeatures(image) {
        const size = image.length;
        if (size !== image[0].length) {
          throw new Error("The input image must be square.");
        }
      
        const integralImage = computeIntegralImage(image);
        const features = [];
      
        for (let i = 0; i < size; i += 3) {
          for (let j = 0; j < size; j += 3) {
            if (i + 6 > size || j + 6 > size) continue;
      
            // Horizontal feature
            const horizontal_feature_value =
              sumRegion(integralImage, [i, j], [i + 2, j + 5]) -
              sumRegion(integralImage, [i + 3, j], [i + 5, j + 5]);
      
            // Vertical feature
            const vertical_feature_value =
              sumRegion(integralImage, [i, j], [i + 5, j + 2]) -
              sumRegion(integralImage, [i, j + 3], [i + 5, j + 5]);
      
            features.push(horizontal_feature_value);
            features.push(vertical_feature_value);
          }
        }
      
        return features;
      }

      function aspectRatio(image, threshold = 0.5) {
        const binImage = image.map(row => row.map(pixel => pixel > threshold ? 1 : 0));
        const rows = binImage.length;
        const cols = binImage[0].length;
        
        let minRow = rows, maxRow = 0, minCol = cols, maxCol = 0;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (binImage[y][x] === 1) {
              minRow = Math.min(minRow, y);
              maxRow = Math.max(maxRow, y);
              minCol = Math.min(minCol, x);
              maxCol = Math.max(maxCol, x);
            }
          }
        }
        
        const width = maxCol - minCol + 1;
        const height = maxRow - minRow + 1;
      
        if (height === 0) return 1.0;
        return width / height;
      }

      function labelRegions(binImage) {
        const rows = binImage.length;
        const cols = binImage[0].length;
        const labels = Array.from({length: rows}, () => new Array(cols).fill(0));
        let label = 0;
      
        function dfs(y, x) {
          if (y < 0 || y >= rows || x < 0 || x >= cols || binImage[y][x] === 0 || labels[y][x] > 0) {
            return;
          }
          
          labels[y][x] = label;
          
          dfs(y - 1, x);
          dfs(y + 1, x);
          dfs(y, x - 1);
          dfs(y, x + 1);
        }
      
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (binImage[y][x] === 1 && labels[y][x] === 0) {
              label += 1;
              dfs(y, x);
            }
          }
        }
      
        return { labels, numRegions: label };
      }
      
      function numRegionsBelowThreshold(image, threshold = 0.5) {
        const binImage = image.map(row => row.map(pixel => pixel < threshold ? 1 : 0));
        const { numRegions } = labelRegions(binImage);
        return numRegions;
      }
      
    
      
    
    

    const processImageAndPredict = async (js_or_leo) => {
        if (!canvasRef.current) {
            return;
        }
        const imageURI = await canvasRef.current.exportImage("image/png");
        const image = new Image();
        image.src = imageURI;
        image.onload = async () => {
            console.log("image shape:", image.width, image.height)
            var imageData = await processImage(image);

            // test cases
            // imageData = test_imageData;

            console.log("imageData shape after processing:", imageData.length, imageData[0].length, "type:", typeof(imageData[0][0]))
            const firstPixel = imageData[0];
            console.log("First pixel value:", firstPixel);
            const cropped = getBoundingBox(imageData);
            console.log("Cropped image shape:", cropped.length, cropped[0].length);
            console.log("Cropped image:", cropped)
            const resized = resizeImage(cropped, 12);
            console.log("Resized image shape:", resized.length, resized[0].length);
            console.log("Resized image:", resized)
            
            const haarFeatures = computeHaarFeatures(resized);
            console.log("Haar features shape:", haarFeatures.length);

            const aspectRatioValue = aspectRatio(imageData);
            console.log("Aspect ratio:", aspectRatioValue);

            const numRegions = numRegionsBelowThreshold(imageData);
            console.log("Number of regions:", numRegions);

            var features = haarFeatures.concat([aspectRatioValue, numRegions]);

            // test cases
            //features = [1749.0, -11.0, 1218.0, -636.0, 790.0, -442.0, -232.0, -232.0, -841.0, -1555.0, 144.0, 1034.0, -1302.0, -1766.0, -221.0, 451.0, 1081.0, 1315.0, 0.8, 1.0, ];
            //features = [1711.0, 141.0, 1228.0, -326.0, 411.0, -995.0, -129.0, -129.0, -1066.0, -1476.0, 132.0, 536.0, -1162.0, -1420.0, -79.0, -39.0, 1083.0, 1459.0, 0.8, 1.0, ]

            console.log("Features:", features);

            const features_means = [-156.89455555555554, -746.5724074074074, 181.8240925925926, -233.12468518518517, 215.89527777777778, 263.25757407407406, -26.51775925925926, -543.3616481481481, -95.56633333333333, -166.66537037037037, 12.451333333333332, 338.8871111111111, -328.52153703703704, -618.7087592592593, -104.3222962962963, 63.83240740740741, 266.76446296296297, 587.4937592592593, 0.800278554246832, 1.6494444444444445];
            const feature_stds = [1043.9481099421746, 922.6413166564906, 1081.7258364235456, 985.0782471787254, 874.9847165310242, 1126.609325302833, 1008.5022217328883, 1128.672429354368, 1088.6080378204506, 1055.7391728007258, 981.360965040711, 1344.6910499347453, 1022.6303743646741, 990.6650968719681, 1184.0437747222106, 1175.2329215102861, 817.5057847253131, 1208.9739683033454, 0.22148878238313918, 0.8687792982892613]

            // normalize features
            let normalized_features = [];
            for (let i = 0; i < features.length; i++) {
                normalized_features.push((features[i] - features_means[i]) / feature_stds[i]);
            }

            console.log("Normalized features:", normalized_features);
            console.log("fixed_point_scaling_factor", fixed_point_scaling_factor)
            const fixed_point_features = normalized_features.map((feature) => Math.round(feature * fixed_point_scaling_factor));
            console.log("fixed_point_features: ", fixed_point_features)

            if(js_or_leo) {
    
            struct0_0.x0 = fixed_point_features[0];
            struct0_0.x1 = fixed_point_features[1];
            struct0_1.x0 = fixed_point_features[2];
            struct0_1.x1 = fixed_point_features[3];
            struct0_2.x0 = fixed_point_features[4];
            struct0_2.x1 = fixed_point_features[5];
            struct0_3.x0 = fixed_point_features[6];
            struct0_3.x1 = fixed_point_features[7];
            struct0_4.x0 = fixed_point_features[8];
            struct0_5.x0 = fixed_point_features[9];
            struct0_6.x0 = fixed_point_features[10];
            struct0_7.x0 = fixed_point_features[11];
            struct0_8.x0 = fixed_point_features[12];
            struct0_9.x0 = fixed_point_features[13];
            struct0_10.x0 = fixed_point_features[14];
            struct0_11.x0 = fixed_point_features[15];
            struct0_12.x0 = fixed_point_features[16];
            struct0_13.x0 = fixed_point_features[17];
            struct0_14.x0 = fixed_point_features[18];
            struct0_15.x0 = fixed_point_features[19];

            console.log("struct0_0", struct0_0)

            let result_JS_decision_tree;
            let result_JS_mlp;

            console.log("selectedKey", selectedKey)

            if(selectedKey == "1") {
                // even/odd
                result_JS_decision_tree = run_JS_decision_tree_even_odd(struct0_0, struct0_1, struct0_2, struct0_3, struct0_4, struct0_5, struct0_6, struct0_7, struct0_8, struct0_9, struct0_10, struct0_11, struct0_12, struct0_13, struct0_14, struct0_15);
                result_JS_mlp = run_JS_mlp_even_odd(struct0_0, struct0_1, struct0_2, struct0_3, struct0_4, struct0_5, struct0_6, struct0_7, struct0_8, struct0_9, struct0_10, struct0_11, struct0_12, struct0_13, struct0_14, struct0_15);
            }
            else if(selectedKey == "2") {
                // classification
                result_JS_decision_tree = run_JS_decision_tree_classification(struct0_0, struct0_1, struct0_2, struct0_3, struct0_4, struct0_5, struct0_6, struct0_7, struct0_8, struct0_9, struct0_10, struct0_11, struct0_12, struct0_13, struct0_14, struct0_15);
                result_JS_mlp = run_JS_mlp_classification(struct0_0, struct0_1, struct0_2, struct0_3, struct0_4, struct0_5, struct0_6, struct0_7, struct0_8, struct0_9, struct0_10, struct0_11, struct0_12, struct0_13, struct0_14, struct0_15);
            }

            var softmax_decision_tree = computeSoftmax([result_JS_decision_tree], 16);
            var softmax_mlp = computeSoftmax(result_JS_mlp, 16**3);

            var argmax_mlp = softmax_mlp.indexOf(Math.max(...softmax_mlp));

            let string_decision_tree = "";
            let string_mlp = "";

            if(selectedKey == "1") {
                // even/odd
                if(result_JS_decision_tree == 0) {
                    string_decision_tree = "Even";
                }
                else if(result_JS_decision_tree == 16) {
                    string_decision_tree = "Odd";
                }
                if(argmax_mlp == 0) {
                    string_mlp = "Even" + " (" + (softmax_mlp[0]*100).toFixed(1) + "%)";
                }
                else if(argmax_mlp == 1) {
                    string_mlp = "Odd" + " (" + (softmax_mlp[1]*100).toFixed(1) + "%)";
                }
            }
            else if(selectedKey == "2") {
                // classification
                string_decision_tree = String(result_JS_decision_tree/16);
                string_mlp = String(argmax_mlp) + " (" + (softmax_mlp[argmax_mlp]*100).toFixed(1) + "%)";
            }

            setDecisionTreePrediction(string_decision_tree);
            setMlpPrediction(string_mlp);

            console.log("result_JS_decision_tree", result_JS_decision_tree)
            console.log("softmax_decision_tree", softmax_decision_tree)
            console.log("softmax_mlp", softmax_mlp)
        }
            if(!js_or_leo) {
                await executeAleoCode(fixed_point_features);
            }
          };
    };

    const executeAleoCode = async (features) => {
        execute(features)
    };

    const startProgressAndRandomizeData = (expected_runtime) => {
        console.log("in startProgressAndRandomizeData")
        if (isProgressRunning || !hasMounted) {
            return;
        }
        setIsProgressRunning(true);
        setProgress(0);
    
        const intervalTime = 150; // time in milliseconds
        const expectedRuntimeInMilliseconds = expected_runtime * 1000;
        const increment = (intervalTime / expectedRuntimeInMilliseconds) * 100;
        
        const interval = setInterval(() => {
            setProgress((oldProgress) => {
                var newProgress = oldProgress + increment;
                if(newProgress >= 99) {
                    newProgress = 99;
                }
                if (newProgress >= 100 || proving_finished) {
                    clearInterval(interval);
                    //zerochartDataProof();
                    setIsProgressRunning(false);
                    return 100;
                }
                return Math.round(newProgress * 10) / 10;
            });
        }, intervalTime);
    };

    const handleCanvasChange = () => {
        if(hasInteracted) {
            setUserHasDrawn(true);
        }
        if(clearButtonPressed) {
            setUserHasDrawn(false);
            setClearButtonPressed(false);
        }

        setHasInteracted(true);
        // Clear any existing timeout since drawing is still happening
        if (drawTimeout) {
          clearTimeout(drawTimeout);
          setDrawTimeout(null);
        }
      
        // Set a new timeout
        const timeout = setTimeout(() => {
            if (hasInteracted) {
                console.log("Canvas drawing has paused");
                processImageAndPredict(true);
              }
        }, 100); // 100ms after the last drawing event
      
        setDrawTimeout(timeout);
      };
        

    const generateProof = async () => {
        try {
            var selected_setting = menuItems[selectedKey - 1].label;
            proofText = "";
            console.log("model_type", model_type)

            // ensure selected_setting exists in run_counter
            if(!(selected_setting in run_counter)) {
                run_counter[selected_setting] = {};
            }
            // ensure model_type exists in run_counter[selected_setting]
            if(!(model_type in run_counter[selected_setting])) {
                run_counter[selected_setting][model_type] = 0;
            }
            var runs = run_counter[selected_setting][model_type];
            console.log("runs", runs)
            proving_finished = false;
            processImageAndPredict(false);
            let expected_runtime;
            console.log("selected_setting", selected_setting)
            console.log("model_type", model_type)
            if(runs == 0) {
                expected_runtime = expected_runtimes[selected_setting][model_type][0];
            }
            else if(runs > 0) {
                expected_runtime = expected_runtimes[selected_setting][model_type][1];
            }
            console.log("expected_runtime", expected_runtime)
            startProgressAndRandomizeData(expected_runtime);
        } catch (error) {
            console.error("Failed to execute Aleo code:", error);
        }
    };

    const handleVerification = async (event) => {
        try {
            const content = event.target.value;
            console.log("in handleVerification, content:", content)
            var verification_result = await aleoWorker.verifyExecution(content);
            console.log("verification_result", verification_result)
            if(verification_result) {
                var content_JSON = JSON.parse(content);
                console.log("content_JSON", content_JSON)

                var softmax = convert_proof_to_softmax(content);
                console.log("softmax", softmax);

                if(softmax.length === 2) {
                    setChartDataVerify([
                        { label: "Even", value: softmax[0] * 100 },
                        { label: "Odd", value: softmax[1] * 100 },
                    ]);
                    setShowVerificationChart(true);
                }                

                if(softmax.length == 10) {
                    setChartDataVerify(
                        Array.from({ length: 10 }, (_, index) => ({
                            label: String(index),
                            value: softmax[index] * 100,
                        }))
                    );
                    setShowVerificationChart(true);
                }

            }
            else {
                setShowChart(false);
            }
        } catch (error) {
            console.error("Verification failed:", error);
            setShowVerificationChart(false);
        }
    };
    

    const handleBrushSizeChange = (value) => {
        setBrushSize(value);
    };

    const handleCopyProof = () => {
        navigator.clipboard.writeText(proofText)
            .then(() => {
                console.log('Text successfully copied to clipboard');
            })
            .catch((err) => {
                console.error('Could not copy text: ', err);
            });
    };    

    const handleMenuSelect = ({ key }) => {
        console.log("Selected menu item:", key);
        setSelectedKey(key); // Update the selectedKey state variable when an item is selected
    };

    return (
        <Layout style={{ minHeight: "100vh", maxWidth: "100vw" }}>
            <Sider theme="light" breakpoint="lg" collapsedWidth="0">
                <div
                    style={{
                        height: "32px",
                        margin: "16px",
                        fontWeight: "bold",
                    }}
                >
                    <img
                        src={aleoLogo}
                        alt="Aleo Logo"
                        style={{ height: "100%" }}
                    />
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    defaultSelectedKeys={["1"]}
                    items={menuItems}
                    onSelect={handleMenuSelect}
                />
            </Sider>
            <Layout>
                <Header
                    style={{ backgroundColor: "#fff", textAlign: "center" }}
                >
                    <h1 style={{ margin: 0 }}>React ZKML App</h1>
                </Header>
                <Content style={{ margin: "24px 16px 0" }}>
                    <Row justify="center">
                        <Col span={24} style={{ textAlign: "center" }}>
                            <Title level={2}>
                                Welcome to the Aleo zkml MNIST app
                            </Title>
                            <Paragraph>
                                First, draw an image, select your ML model, and create proof. Second,
                                verify the proof.


                            </Paragraph>
                        </Col>
                    </Row>
                    <Card title="Prover" style={{ 
        width: "100%", 
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Add a subtle shadow
        backgroundColor: '#f9f9f9', // Light background color
        padding: '20px', // Increased internal padding
        border: '1px solid #e0e0e0' // Adding a distinct border
    }}>
                    <Card style={{ margin: "20px", padding: "20px", border: "1px solid #ECECEC" }}>

                        <Row justify="center">
                            <Col>
                                <Text type="secondary">
                                    Draw a single digit (0-9) in the empty box,
                                    and store the proof locally.
                                </Text>
                            </Col>
                        </Row>
                        <Row justify="center">
                            <Col>
                                <ReactSketchCanvas
                                    ref={canvasRef}
                                    width="400px"
                                    height="400px"
                                    style={{
                                        border: "2px solid black",
                                        backgroundColor: "white",
                                    }}
                                    strokeWidth={brushSize}
                                    strokeColor="black"
                                    onChange={handleCanvasChange}
                                />
                            </Col>
                        </Row>
                        
                        {/* Commenting out the Brush Size section
                        <Row justify="center">
                            <Col span={12}>
                                <div
                                    style={{
                                        marginBottom: "10px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Brush Size
                                </div>
                                <Slider
                                    min={1}
                                    max={20}
                                    value={brushSize}
                                    onChange={handleBrushSizeChange}
                                    style={{
                                        width: "100%",
                                        marginBottom: "20px",
                                    }}
                                    marks={{ 1: "1", 20: "20" }}
                                />
                            </Col>
                        </Row>
                        */}

                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col span={12}>
                                <Title level={4}>Predictions</Title>
                                <Text strong>Decision Tree: </Text>{decisionTreePrediction}
                                <br />
                                <Text strong>MLP: </Text>{mlpPrediction}
                            </Col>
                        </Row>
                        </Card>

                        <Card style={{ margin: "20px", padding: "20px", border: "1px solid #ECECEC" }}>
                        <Row justify="center" style={{ marginTop: "20px" }}>

                        <Select defaultValue="decision_tree" style={{ width: 330, marginTop: 16 }} onChange={(value) => model_type = value}>
        <Option value="decision_tree">Decision tree (faster)</Option>
        <Option value="mlp_neural_network">MLP neural network (slower, more accurate)</Option>
    </Select>
    
                        </Row>


                        <Row justify="center" style={{ marginTop: "20px" }}>



                            <Col>
                                <Space>
                                <Button type="primary" onClick={generateProof} disabled={!userHasDrawn}>
                                    Generate Proof
                               </Button>
                                    <Button
                                        type="default"
                                        onClick={() => {
                                            getTopLeftPixelData(); // Get pixel data before clearing
                                            canvasRef.current.clearCanvas();
                                            setUserHasDrawn(false);
                                            setClearButtonPressed(true);
                                          }}
                                    >
                                        Clear
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col span={12}>
                                <Progress percent={progress} />
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col xs={24} sm={22} md={20} lg={18} xl={12}>
                                <Column
                                    data={chartDataProof}
                                    xField="label"
                                    yField="value"
                                    seriesField="label"
                                    legend={false}
                                />
                            </Col>
                        </Row>
                        
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col span={12}>
                                <Title level={4}>Proof</Title>
                                <Input.TextArea
                                    rows={4}
                                    value={proofText}
                                    disabled
                                    style={{ margin: "20px 0" }}
                                />
                            </Col>
                        </Row>
                        <Row justify="center">
                            <Col>
                                <Button type="primary" onClick={handleCopyProof}>
                                    Copy Proof
                                </Button>
                            </Col>
                        </Row>

                        </Card>
                    </Card>

                    <Card
                        title="Verifier"
                        style={{ 
                            width: "100%", 
                            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Add a subtle shadow
                            backgroundColor: '#f9f9f9', // Light background color
                            padding: '20px', // Increased internal padding
                            border: '1px solid #e0e0e0' // Adding a distinct border
                        }}
                    >
                                            <Card style={{ margin: "20px", padding: "20px", border: "1px solid #ECECEC" }}>

                        <Row justify="center">
                            <Col>
                                <Text type="secondary">
                                    Paste the proof and verify it.
                                </Text>
                            </Col>
                        </Row>
                        <Row justify="center">
                            <Col span={12}>
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Paste the proof here..."
                                    style={{ margin: "20px 0" }}
                                    onChange={handleVerification}
                                />
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
    <Col xs={24} sm={22} md={20} lg={18} xl={12}>
        {showVerificationChart ? (
            <Column
                data={chartDataVerify}
                xField="label"
                yField="value"
                seriesField="label"
                legend={false}
            />
        ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="verification-failed-message">
                    Verification Failed
                </div>
            </div>
        )}
    </Col>
</Row>
                    </Card>
                    </Card>
                </Content>
                <Footer style={{ textAlign: "center" }}>
                    Visit the{" "}
                    <a href="https://github.com/AleoHQ/sdk">
                        Aleo SDK Github repo
                    </a>
                    .
                </Footer>
            </Layout>
        </Layout>
    );
};

export default Main;
