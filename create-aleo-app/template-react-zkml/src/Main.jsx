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
} from "antd";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Column } from "@ant-design/charts";
import aleoLogo from "./assets/aleo.svg";
import {Account, initThreadPool, PrivateKey, ProgramManager,} from "@aleohq/sdk";
import { AleoWorker } from "./workers/AleoWorker.js";

import { mlp_program, decision_tree_program } from './variables.js';

const { Text, Title, Paragraph } = Typography;
const { Header, Content, Footer, Sider } = Layout;


const aleoWorker = AleoWorker();
//import helloworld_program from "../helloworld/build/main.aleo?raw";


const Main = () => {
    const [account, setAccount] = useState(null);

    const generateAccount = async () => {
        const key = await aleoWorker.getPrivateKey();
        setAccount(await key.to_string());
      };
    
      async function execute(features) {

        // helpful tool: https://codepen.io/jsnelders/pen/qBByqQy

        //const helloworld_program = "program helloworld.aleo;\nfunction main:\ninput r0 as u32.public;\ninput r1 as u32.private;\nadd r0 r1 into r2;\noutput r2 as u32.private;\n";
        //const helloworld_program = "program helloworld.aleo; {struct Struct0 {x0: i64,x1: i64}transition main (struct0_0: Struct0) -> (i64) {let output : i64 = relu(struct0_0.x0 + struct0_0.x1);return (output);}function relu(x: i64) -> i64 {if x < 0i64 {return 0i64;} else {return x;}}}";
        //const helloworld_program = "program helloworld.aleo; {\nstruct Struct0 {\nx0: i64,\nx1: i64\n}\ntransition main (struct0_0: Struct0) -> (i64) {\nlet output : i64 = relu(struct0_0.x0 + struct0_0.x1);\nreturn (output);\n}function relu(x: i64) -> i64 {\nif x < 0i64 {return 0i64;} else {return x;\n}\n}\n}";
        //const helloworld_program = "program helloworld.aleo; {transition main (x0: i64, x1:i64) -> (i64) {let output : i64 = x0 + x1;return (output);}function relu(x: i64) -> i64 {if x < 0i64 {return 0i64;} else {return x;}}}";

        const helloworld_program = "program sklearn_mlp_mnist_1.aleo;\n\nstruct Struct0:\n    x0 as i64;\n    x1 as i64;\n\n\nclosure relu:\n    input r0 as i64;\n    lt r0 0i64 into r1;\n    ternary r1 0i64 r0 into r2;\n    output r2 as i64;\n\n\nfunction main:\n    input r0 as Struct0.private;\n    add r0.x0 r0.x1 into r1;\n    call relu r1 into r2;\n    output r2 as i64.private;\n";
        const int_type = "i64";

        console.log("features in execute: ", features)

        const fixed_point_scaling_factor = 16;
        const fixed_point_features = features.map((feature) => Math.round(feature * fixed_point_scaling_factor));

        console.log("fixed_point_features: ", fixed_point_features)

        const model_type = "tree"



        const input_array = [`{x0: ${fixed_point_features[0]}${int_type}, x1: ${fixed_point_features[1]}${int_type}}`, `{x0: ${fixed_point_features[2]}${int_type}, x1: ${fixed_point_features[3]}${int_type}}`, `{x0: ${fixed_point_features[4]}${int_type}, x1: ${fixed_point_features[5]}${int_type}}`, `{x0: ${fixed_point_features[6]}${int_type}, x1: ${fixed_point_features[7]}${int_type}}`, `{x0: ${fixed_point_features[8]}${int_type}}`, `{x0: ${fixed_point_features[9]}${int_type}}`, `{x0: ${fixed_point_features[10]}${int_type}}`, `{x0: ${fixed_point_features[11]}${int_type}}`, `{x0: ${fixed_point_features[12]}${int_type}}`, `{x0: ${fixed_point_features[13]}${int_type}}`, `{x0: ${fixed_point_features[14]}${int_type}}`, `{x0: ${fixed_point_features[15]}${int_type}}`, `{x0: ${fixed_point_features[16]}${int_type}}`, `{x0: ${fixed_point_features[17]}${int_type}}`, `{x0: ${fixed_point_features[18]}${int_type}}`, `{x0: ${fixed_point_features[19]}${int_type}}`];

        console.log("input_array", input_array);

        let model;
        if(model_type == "tree") {
            model = decision_tree_program;
        }
        else if(model_type == "mlp") {
            model = mlp_program;
        }

        const result = await aleoWorker.localProgramExecution(
            model,
          "main",
          //["5u32", "5u32"],
          //["5i64", "5i64"],
          //["{x0: -6i64, x1:5i64}"],
          //["{struct0_0: {x0: ${fixed_point_features[0]}, x1: {x0: ${fixed_point_features[1]}}, struct0_1: ..., ..., struct0_3: ..., struct0_4: {x0: ${fixed_point_features[8]}}, ..., struct0_15: ...}"],
          input_array,
          );
    
            console.log("result", result);

            let output_fixed_point_scaling_factor;

            if(model_type == "tree") {
                output_fixed_point_scaling_factor = fixed_point_scaling_factor;
            }
            else if(model_type == "mlp") {
                output_fixed_point_scaling_factor = fixed_point_scaling_factor**3;
            }

            // empty array
            var converted_features = [];

            // iterate over result. For each entry, remove "i64", convert to a number, and divide by the scaling factor
            for (let i = 0; i < result.length; i++) {
                var output = result[i].replace("i64", "");
                output = Number(output);
                output = output / output_fixed_point_scaling_factor;
                converted_features.push(output);
            }

            console.log("converted_features", converted_features);

            const argmax_index = converted_features.indexOf(Math.max(...converted_features));

            console.log("argmax_index", argmax_index);
            
        alert(JSON.stringify(converted_features));


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
    const [chartData, setChartData] = useState(
        Array.from({ length: 10 }, (_, i) => ({ label: String(i), value: 0 })),
    );
    const [brushSize, setBrushSize] = useState(10);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const menuItems = ["Even/Odd", "Number Range", "Classification"].map(
        (label, index) => ({
            key: String(index + 1),
            icon: [<NumberOutlined />, <SlidersOutlined />, <TagsOutlined />][
                index
            ],
            label: label,
        }),
    );

    const randomizeChartData = () => {
        setChartData(
            chartData.map((item) => ({
                ...item,
                value: Math.floor(Math.random() * 20),
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
      
    
      
    
    

    const processImageAndPredict = async () => {
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
            //imageData = [[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 84.0, 185.0, 159.0, 151.0, 60.0, 36.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 222.0, 254.0, 254.0, 254.0, 254.0, 241.0, 198.0, 198.0, 198.0, 198.0, 198.0, 198.0, 198.0, 198.0, 170.0, 52.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 67.0, 114.0, 72.0, 114.0, 163.0, 227.0, 254.0, 225.0, 254.0, 254.0, 254.0, 250.0, 229.0, 254.0, 254.0, 140.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 17.0, 66.0, 14.0, 67.0, 67.0, 67.0, 59.0, 21.0, 236.0, 254.0, 106.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 83.0, 253.0, 209.0, 18.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 22.0, 233.0, 255.0, 83.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 129.0, 254.0, 238.0, 44.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 59.0, 249.0, 254.0, 62.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 133.0, 254.0, 187.0, 5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 9.0, 205.0, 248.0, 58.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 126.0, 254.0, 182.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 75.0, 251.0, 240.0, 57.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 19.0, 221.0, 254.0, 166.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 3.0, 203.0, 254.0, 219.0, 35.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 38.0, 254.0, 254.0, 77.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 31.0, 224.0, 254.0, 115.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 133.0, 254.0, 254.0, 52.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 61.0, 242.0, 254.0, 254.0, 52.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 121.0, 254.0, 254.0, 219.0, 40.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 121.0, 254.0, 207.0, 18.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]];

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

            await executeAleoCode(normalized_features);
          };
    };

    const executeAleoCode = async (features) => {
        console.log("hello")
        generateAccount()
        console.log("generated account")
        execute(features)
        console.log("finished")
    };

    const startProgressAndRandomizeData = () => {
        if (isProgressRunning || !hasMounted) {
            return;
        }
        setIsProgressRunning(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((oldProgress) => {
                const newProgress = oldProgress + 10;
                if (newProgress === 100) {
                    clearInterval(interval);
                    randomizeChartData();
                    setIsProgressRunning(false);
                    processImageAndPredict();
                    return newProgress;
                }
                return Math.min(newProgress, 100);
            });
        }, 200);
    };

    const handleCanvasDraw = async () => {
        try {
            startProgressAndRandomizeData();
        } catch (error) {
            console.error("Failed to execute Aleo code:", error);
            // Handle the error accordingly. For example, show an error message to the user.
        }
    };
    

    const handleBrushSizeChange = (value) => {
        setBrushSize(value);
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
                                First, draw an image and create proof … Second,
                                verify the proof …
                            </Paragraph>
                        </Col>
                    </Row>
                    <Card title="Prover" style={{ width: "100%" }}>
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
                                />
                            </Col>
                        </Row>
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
                        <Row justify="center">
                            <Col>
                                <Space>
                                <Button type="primary" onClick={handleCanvasDraw}>
    Store Proof
</Button>
                                    <Button
                                        type="default"
                                        onClick={() => {
                                            getTopLeftPixelData(); // Get pixel data before clearing
                                            canvasRef.current.clearCanvas();
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
                                    data={chartData}
                                    xField="label"
                                    yField="value"
                                    seriesField="label"
                                    legend={false}
                                />
                            </Col>
                        </Row>
                    </Card>
                    <Card
                        title="Verifier"
                        style={{ width: "100%", marginTop: "24px" }}
                    >
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
                                    onChange={() =>
                                        console.log("handle proof change")
                                    }
                                />
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col xs={24} sm={22} md={20} lg={18} xl={12}>
                                <Column
                                    data={Array.from(
                                        { length: 10 },
                                        (_, i) => ({
                                            label: String(i),
                                            value: 0,
                                        }),
                                    )}
                                    xField="label"
                                    yField="value"
                                    seriesField="label"
                                    legend={false}
                                />
                            </Col>
                        </Row>
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
