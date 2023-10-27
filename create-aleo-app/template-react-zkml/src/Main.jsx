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

import { mlp_program, decision_tree_program, test_imageData, expected_runtimes } from './variables.js';

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

const Main = () => {
    const [account, setAccount] = useState(null);
    const [selectedKey, setSelectedKey] = useState("2"); // Using React useState hook to hold the selected key

    function convert_circuit_outputs_to_softmax(outputs_JSON, used_model) {

        let output_fixed_point_scaling_factor;

        if(used_model == "tree") {
            output_fixed_point_scaling_factor = fixed_point_scaling_factor;
        }
        else if(used_model == "mlp") {
            output_fixed_point_scaling_factor = fixed_point_scaling_factor**3;
        }

        // empty array
        var converted_features = [];

        // iterate over result. For each entry, remove int_type, convert to a number, and divide by the scaling factor
        for (let i = 0; i < outputs_JSON.length; i++) {
            var output = String(outputs_JSON[i]["value"]).replace(int_type, "");
            //console.log("output", output)
            output = Number(output);
            output = output / output_fixed_point_scaling_factor;
            converted_features.push(output);
        }

        console.log("converted_features", converted_features)

        let softmax = [];
        if(used_model == "mlp") {
            const argmax_index = converted_features.indexOf(Math.max(...converted_features));
            console.log("argmax_index", argmax_index);

            // compute softmax of converted_features
            softmax = [];
            var sum = 0;
            for (let i = 0; i < converted_features.length; i++) {
                softmax.push(Math.exp(converted_features[i]));
                sum += Math.exp(converted_features[i]);
            }
            for (let i = 0; i < converted_features.length; i++) {
                softmax[i] = softmax[i] / sum;
            }
        }
        if(used_model == "tree") {
            // create 10 element array with 0s, but 1 at the index of converted_features[0]
            softmax = Array.from({ length: 10 }, (_, i) => 0);
            softmax[converted_features[0]] = 1;
            console.log("converted_features[0]", converted_features[0])
        }

        return softmax;
    }

      async function execute(features) {

        // helpful tool: https://codepen.io/jsnelders/pen/qBByqQy


        console.log("features in execute: ", features)

        const fixed_point_features = features.map((feature) => Math.round(feature * fixed_point_scaling_factor));

        console.log("fixed_point_features: ", fixed_point_features)


        const input_array = [`{x0: ${fixed_point_features[0]}${int_type}, x1: ${fixed_point_features[1]}${int_type}}`, `{x0: ${fixed_point_features[2]}${int_type}, x1: ${fixed_point_features[3]}${int_type}}`, `{x0: ${fixed_point_features[4]}${int_type}, x1: ${fixed_point_features[5]}${int_type}}`, `{x0: ${fixed_point_features[6]}${int_type}, x1: ${fixed_point_features[7]}${int_type}}`, `{x0: ${fixed_point_features[8]}${int_type}}`, `{x0: ${fixed_point_features[9]}${int_type}}`, `{x0: ${fixed_point_features[10]}${int_type}}`, `{x0: ${fixed_point_features[11]}${int_type}}`, `{x0: ${fixed_point_features[12]}${int_type}}`, `{x0: ${fixed_point_features[13]}${int_type}}`, `{x0: ${fixed_point_features[14]}${int_type}}`, `{x0: ${fixed_point_features[15]}${int_type}}`, `{x0: ${fixed_point_features[16]}${int_type}}`, `{x0: ${fixed_point_features[17]}${int_type}}`, `{x0: ${fixed_point_features[18]}${int_type}}`, `{x0: ${fixed_point_features[19]}${int_type}}`];

        console.log("input_array", input_array);

        let model;
        if(model_type == "decision_tree") {
            model = decision_tree_program;
            used_model_type = "tree";
        }
        else if(model_type == "mlp_neural_network") {
            model = mlp_program;
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

        var softmax = convert_circuit_outputs_to_softmax(result_JSON, used_model_type);

        setchartDataProof(
            chartDataProof.map((item, index) => ({
                ...item,
                value: softmax[index] * 100,
            })),
        );

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
    const [chartDataProof, setchartDataProof] = useState(
        Array.from({ length: 10 }, (_, i) => ({ label: String(i), value: 0 })),
    );
    const [chartDataVerify, setchartDataVerify] = useState(
        Array.from({ length: 10 }, (_, i) => ({ label: String(i), value: 0 })),
    );
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

            await executeAleoCode(normalized_features);
          };
    };

    const executeAleoCode = async (features) => {
        console.log("hello")
        console.log("generated account")
        execute(features)
        console.log("finished")
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
        

    const handleCanvasDraw = async () => {
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
            processImageAndPredict();
            let expected_runtime;
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
                const outputs = content_JSON["execution"]["transitions"][0]["outputs"];

                var used_model_type = "tree";
                if(outputs.length == 10) {
                    // neural network
                    used_model_type = "mlp";
                }
                console.log("used_model_type", used_model_type)
                console.log("outputs", outputs)
                var softmax = convert_circuit_outputs_to_softmax(outputs, used_model_type);

                console.log("softmax", softmax)


                setchartDataVerify(
                    chartDataVerify.map((item, index) => ({
                        ...item,
                        value: softmax[index] * 100,
                    })),
                );

            }
        } catch (error) {
            console.error("Verification failed:", error);
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
                    defaultSelectedKeys={["2"]}
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
                                First, draw an image and create proof … Second,
                                verify the proof …
                                <br />
    <Select defaultValue="decision_tree" style={{ width: 330, marginTop: 16 }} onChange={(value) => model_type = value}>
        <Option value="decision_tree">Decision tree (faster)</Option>
        <Option value="mlp_neural_network">MLP neural network (slower, more accurate)</Option>
    </Select>

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
    Generate Proof
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
                                    onChange={handleVerification}
                                />
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col xs={24} sm={22} md={20} lg={18} xl={12}>
                                <Column
                                    data={chartDataVerify}
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
