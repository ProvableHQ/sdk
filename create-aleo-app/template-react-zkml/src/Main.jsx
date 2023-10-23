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
        tempCanvas.width = 25;
        tempCanvas.height = 28;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(image, 0, 0, 28, 28);
        return ctx.getImageData(0, 0, 28, 28);
    };

    const processImageAndPredict = async () => {
        if (!canvasRef.current) {
            return;
        }
        const imageURI = await canvasRef.current.exportImage("image/png");
        const image = new Image();
        image.src = imageURI;
        image.onload = async () => {
            console.log(await processImage(image));
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
                                        onClick={() =>
                                            canvasRef.current.clearCanvas()
                                        }
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
