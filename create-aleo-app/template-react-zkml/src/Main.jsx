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
    
      async function execute() {

        // helpful tool: https://codepen.io/jsnelders/pen/qBByqQy

        //const helloworld_program = "program helloworld.aleo;\nfunction main:\ninput r0 as u32.public;\ninput r1 as u32.private;\nadd r0 r1 into r2;\noutput r2 as u32.private;\n";
        //const helloworld_program = "program helloworld.aleo; {struct Struct0 {x0: i64,x1: i64}transition main (struct0_0: Struct0) -> (i64) {let output : i64 = relu(struct0_0.x0 + struct0_0.x1);return (output);}function relu(x: i64) -> i64 {if x < 0i64 {return 0i64;} else {return x;}}}";
        //const helloworld_program = "program helloworld.aleo; {\nstruct Struct0 {\nx0: i64,\nx1: i64\n}\ntransition main (struct0_0: Struct0) -> (i64) {\nlet output : i64 = relu(struct0_0.x0 + struct0_0.x1);\nreturn (output);\n}function relu(x: i64) -> i64 {\nif x < 0i64 {return 0i64;} else {return x;\n}\n}\n}";
        //const helloworld_program = "program helloworld.aleo; {transition main (x0: i64, x1:i64) -> (i64) {let output : i64 = x0 + x1;return (output);}function relu(x: i64) -> i64 {if x < 0i64 {return 0i64;} else {return x;}}}";

        const helloworld_program = "program sklearn_mlp_mnist_1.aleo;\n\nstruct Struct0:\n    x0 as i64;\n    x1 as i64;\n\n\nclosure relu:\n    input r0 as i64;\n    lt r0 0i64 into r1;\n    ternary r1 0i64 r0 into r2;\n    output r2 as i64;\n\n\nfunction main:\n    input r0 as Struct0.private;\n    add r0.x0 r0.x1 into r1;\n    call relu r1 into r2;\n    output r2 as i64.private;\n";

        const result = await aleoWorker.localProgramExecution(
          helloworld_program,
          "main",
          //["5u32", "5u32"],
          //["5i64", "5i64"],
          ["{x0: -6i64, x1:5i64}"],
        );
    
        alert(JSON.stringify(result));
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
                const x = Math.floor(j * xScale);
                const y = Math.floor(i * yScale);
                resizedImage[i][j] = image[y][x];
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
            const imageData = await processImage(image);
            const firstPixel = imageData[0];
            console.log("First pixel value:", firstPixel);
            const cropped = getBoundingBox(imageData);
            console.log("Cropped image shape:", cropped.length, cropped[0].length);
            const resized = resizeImage(cropped, 12);
            console.log("Resized image shape:", resized.length, resized[0].length);

            const haarFeatures = computeHaarFeatures(resized);
            console.log("Haar features shape:", haarFeatures.length);

            const aspectRatioValue = aspectRatio(imageData);
            console.log("Aspect ratio:", aspectRatioValue);

            const numRegions = numRegionsBelowThreshold(imageData);
            console.log("Number of regions:", numRegions);

            const features = haarFeatures.concat([aspectRatioValue, numRegions]);
            console.log("Features:", features);
          };
    };

    const executeAleoCode = async () => {
        console.log("hello")
        generateAccount()
        console.log("generated account")
        execute()
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
            await executeAleoCode();
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
