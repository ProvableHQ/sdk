import { useMemo, useState } from "react";
import { Card, Divider, Form, Input, Radio, Select, Button, Typography, Space, Tag } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";

const { Text } = Typography;

const BHP_OPTIONS = [
    { value: "BHP256", label: "BHP256" },
    { value: "BHP512", label: "BHP512" },
    { value: "BHP768", label: "BHP768" },
    { value: "BHP1024", label: "BHP1024" },
];

const PEDERSEN_OPTIONS = [
    { value: "Pedersen64", label: "Pedersen64" },
    { value: "Pedersen128", label: "Pedersen128" },
];

const POSEIDON_OPTIONS = [
    { value: "Poseidon2", label: "Poseidon2" },
    { value: "Poseidon4", label: "Poseidon4" },
    { value: "Poseidon8", label: "Poseidon8" },
];

const HASHER_FAMILIES = [
    { value: "BHP", label: "BHP (bits -> Field/Group)" },
    { value: "Pedersen", label: "Pedersen (bits -> Field/Group)" },
    { value: "Poseidon", label: "Poseidon (Fields -> Field/Scalar/Group)" },
];

export const HashFunctions = () => {
    const [wasm] = useAleoWASM();

    // Family and specific hasher
    const [family, setFamily] = useState("BHP");
    const [bhp, setBhp] = useState("BHP256");
    const [pedersen, setPedersen] = useState("Pedersen64");
    const [poseidon, setPoseidon] = useState("Poseidon2");

    // Operation selection per family
    const [bhpOp, setBhpOp] = useState("hash"); // hash | hashToGroup | commit | commitToGroup
    const [pedersenOp, setPedersenOp] = useState("hash"); // hash | commit | commitToGroup
    const [poseidonOp, setPoseidonOp] = useState("hash"); // hash | hashToScalar | hashToGroup | hashMany

    // Inputs
    const [bitsInput, setBitsInput] = useState(""); // comma-separated booleans or 0/1
    const [finiteFieldCsv, setFiniteFieldCsv] = useState(""); // comma-separated Field elements (without suffix)
    const [scalarInput, setScalarInput] = useState("");
    const [hashManyChunkSize, setHashManyChunkSize] = useState("2");

    const [result, setResult] = useState("");
    const [error, setError] = useState("");

    const layout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        style: { marginBottom: '24px' }
    };

    const parseBits = (text) => {
        if (!text || !text.trim()) return [];
        return text
            .split(/[,\s]+/)
            .filter(Boolean)
            .map((t) => {
                const lower = t.toLowerCase();
                if (lower === "true" || lower === "t" || lower === "1") return true;
                if (lower === "false" || lower === "f" || lower === "0") return false;
                throw new Error(`Invalid bit '${t}'. Use true/false or 1/0`);
            });
    };

    const parseFields = (text) => {
        if (!wasm) return [];
        if (!text || !text.trim()) return [];
        return text
            .split(/[,\s]+/)
            .filter(Boolean)
            .map((num) => {
                const withSuffix = num.includes("field") ? num : `${num}field`;
                return wasm.Field.fromString(withSuffix);
            });
    };

    const parseScalar = (text) => {
        if (!wasm) return null;
        if (!text || !text.trim()) return null;
        const withSuffix = text.includes("scalar") ? text : `${text}scalar`;
        return wasm.Scalar.fromString(withSuffix);
    };

    const bytesFromFieldsLe = (fields) => {
        return fields.map((f) => f.toBitsLe()).flat();
    };

    const computeBhp = () => {
        setError("");
        try {
            const bits = parseBits(bitsInput);
            const ScalarCtor = wasm.Scalar;
            const scalar = parseScalar(scalarInput) ?? ScalarCtor.random();

            let hasher;
            switch (bhp) {
                case "BHP256": hasher = new wasm.BHP256(); break;
                case "BHP512": hasher = new wasm.BHP512(); break;
                case "BHP768": hasher = new wasm.BHP768(); break;
                case "BHP1024": hasher = new wasm.BHP1024(); break;
                default: hasher = new wasm.BHP256();
            }

            let out;
            switch (bhpOp) {
                case "hash":
                    out = hasher.hash(bytesFromFieldsLe(parseFields(finiteFieldCsv)));
                    break;
                case "hashToGroup":
                    out = hasher.hashToGroup(bytesFromFieldsLe(parseFields(finiteFieldCsv)));
                    break;
                case "commit":
                    out = hasher.commit(bytesFromFieldsLe(parseFields(finiteFieldCsv)), scalar.clone());
                    break;
                case "commitToGroup":
                    out = hasher.commitToGroup(bytesFromFieldsLe(parseFields(finiteFieldCsv)), scalar.clone());
                    break;
                default:
                    out = hasher.hash(bytesFromFieldsLe(parseFields(finiteFieldCsv)));
            }
            setResult(out.toString());
        } catch (e) {
            console.error(e);
            setError(String(e.message || e));
            setResult("");
        }
    };

    const computePedersen = () => {
        setError("");
        try {
            const bits = parseBits(bitsInput);
            const scalar = parseScalar(scalarInput) ?? wasm.Scalar.random();

            let hasher;
            switch (pedersen) {
                case "Pedersen64": hasher = new wasm.Pedersen64(); break;
                case "Pedersen128": hasher = new wasm.Pedersen128(); break;
                default: hasher = new wasm.Pedersen64();
            }

            let out;
            switch (pedersenOp) {
                case "hash":
                    out = hasher.hash(bits);
                    break;
                case "commit":
                    out = hasher.commit(bits, scalar.clone());
                    break;
                case "commitToGroup":
                    out = hasher.commitToGroup(bits, scalar.clone());
                    break;
                default:
                    out = hasher.hash(bits);
            }
            setResult(out.toString());
        } catch (e) {
            console.error(e);
            setError(String(e.message || e));
            setResult("");
        }
    };

    const computePoseidon = () => {
        setError("");
        try {
            const fields = parseFields(finiteFieldCsv);
            let hasher;
            switch (poseidon) {
                case "Poseidon2": hasher = new wasm.Poseidon2(); break;
                case "Poseidon4": hasher = new wasm.Poseidon4(); break;
                case "Poseidon8": hasher = new wasm.Poseidon8(); break;
                default: hasher = new wasm.Poseidon2();
            }

            let out;
            switch (poseidonOp) {
                case "hash":
                    out = hasher.hash(fields);
                    break;
                case "hashToScalar":
                    out = hasher.hashToScalar(fields);
                    break;
                case "hashToGroup":
                    out = hasher.hashToGroup(fields);
                    break;
                case "hashMany":
                    {
                        const n = Math.max(1, parseInt(hashManyChunkSize || "2", 10));
                        const arr = hasher.hashMany(fields.map((f) => f.clone()), n);
                        out = `[${arr.map((f) => f.toString()).join(", ")}]`;
                    }
                    break;
                default:
                    out = hasher.hash(fields);
            }
            setResult(out.toString());
        } catch (e) {
            console.error(e);
            setError(String(e.message || e));
            setResult("");
        }
    };

    const onCompute = () => {
        if (!wasm) return;
        if (family === "BHP") return computeBhp();
        if (family === "Pedersen") return computePedersen();
        return computePoseidon();
    };

    const familySpecificControls = () => {
        if (family === "BHP") {
            return (
                <>
                    <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Hasher</span>} colon={false} style={{ marginBottom: '24px' }}>
                        <Select value={bhp} onChange={setBhp} options={BHP_OPTIONS} size="large" />
                    </Form.Item>
                    <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Operation</span>} colon={false} style={{ marginBottom: '24px' }}>
                        <Radio.Group value={bhpOp} onChange={(e) => setBhpOp(e.target.value)} size="large">
                            <Radio.Button value="hash">Hash</Radio.Button>
                            <Radio.Button value="hashToGroup">Hash → Group</Radio.Button>
                            <Radio.Button value="commit">Commit</Radio.Button>
                            <Radio.Button value="commitToGroup">Commit → Group</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Inputs</span>} colon={false} style={{ marginBottom: '24px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text>Enter Field elements (comma-separated). Example: 1, 2, 3</Text>
                            <Input
                                size="large"
                                placeholder="e.g. 1, 2, 3, 4"
                                value={finiteFieldCsv}
                                onChange={(e) => setFiniteFieldCsv(e.target.value)}
                                allowClear
                            />
                            {(bhpOp === "commit" || bhpOp === "commitToGroup") && (
                                <Input
                                    size="large"
                                    placeholder="Scalar (e.g. 5)"
                                    value={scalarInput}
                                    onChange={(e) => setScalarInput(e.target.value)}
                                    allowClear
                                />
                            )}
                        </Space>
                    </Form.Item>
                </>
            );
        }

        if (family === "Pedersen") {
            return (
                <>
                    <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Hasher</span>} colon={false} style={{ marginBottom: '24px' }}>
                        <Select value={pedersen} onChange={setPedersen} options={PEDERSEN_OPTIONS} size="large" />
                    </Form.Item>
                    <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Operation</span>} colon={false} style={{ marginBottom: '24px' }}>
                        <Radio.Group value={pedersenOp} onChange={(e) => setPedersenOp(e.target.value)} size="large">
                            <Radio.Button value="hash">Hash</Radio.Button>
                            <Radio.Button value="commit">Commit</Radio.Button>
                            <Radio.Button value="commitToGroup">Commit → Group</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Inputs</span>} colon={false} style={{ marginBottom: '24px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text>Enter bits as comma-separated values. Example: 1,0,0,1,1</Text>
                            <Input
                                size="large"
                                placeholder="e.g. true, false, 1, 0, 1, 0"
                                value={bitsInput}
                                onChange={(e) => setBitsInput(e.target.value)}
                                allowClear
                            />
                            {(pedersenOp === "commit" || pedersenOp === "commitToGroup") && (
                                <Input
                                    size="large"
                                    placeholder="Scalar (e.g. 5)"
                                    value={scalarInput}
                                    onChange={(e) => setScalarInput(e.target.value)}
                                    allowClear
                                />
                            )}
                        </Space>
                    </Form.Item>
                </>
            );
        }

        // Poseidon
        return (
            <>
                <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Hasher</span>} colon={false} style={{ marginBottom: '24px' }}>
                    <Select value={poseidon} onChange={setPoseidon} options={POSEIDON_OPTIONS} size="large" />
                </Form.Item>
                <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Operation</span>} colon={false} style={{ marginBottom: '24px' }}>
                    <Radio.Group value={poseidonOp} onChange={(e) => setPoseidonOp(e.target.value)} size="large">
                        <Radio.Button value="hash">Hash</Radio.Button>
                        <Radio.Button value="hashToScalar">Hash → Scalar</Radio.Button>
                        <Radio.Button value="hashToGroup">Hash → Group</Radio.Button>
                        <Radio.Button value="hashMany">Hash Many</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Inputs</span>} colon={false} style={{ marginBottom: '24px' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text>Enter Field elements (comma-separated). Example: 1, 2, 3</Text>
                        <Input
                            size="large"
                            placeholder="e.g. 1, 2, 3, 4"
                            value={finiteFieldCsv}
                            onChange={(e) => setFiniteFieldCsv(e.target.value)}
                            allowClear
                        />
                        {poseidonOp === "hashMany" && (
                            <Input
                                size="large"
                                placeholder="Chunk size (e.g. 2)"
                                value={hashManyChunkSize}
                                onChange={(e) => setHashManyChunkSize(e.target.value)}
                            />
                        )}
                    </Space>
                </Form.Item>
            </>
        );
    };

    return (
        <Card title="Hash Functions" style={{ width: "100%" }}>
            <Form {...layout}>
                <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Family</span>} colon={false} style={{ marginBottom: '24px' }}>
                    <Radio.Group value={family} onChange={(e) => setFamily(e.target.value)} size="large">
                        {HASHER_FAMILIES.map((f) => (
                            <Radio.Button key={f.value} value={f.value}>{f.label}</Radio.Button>
                        ))}
                    </Radio.Group>
                </Form.Item>

                {familySpecificControls()}

                <Divider />
                {error ? (
                    <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Error</span>} colon={false} style={{ marginBottom: '24px' }}>
                        <Input size="large" value={error} disabled />
                    </Form.Item>
                ) : null}

                <Form.Item label={<span style={{ whiteSpace: 'nowrap' }}>Result</span>} colon={false} style={{ marginBottom: '24px' }}>
                    <Input
                        size="large"
                        placeholder="Result will appear here"
                        value={result}
                        addonAfter={<CopyButton data={result} />}
                        disabled
                    />
                </Form.Item>

                <Form.Item colon={false} style={{ marginBottom: 0 }}>
                    <Button type="primary" size="large" onClick={onCompute} disabled={!wasm}>
                        Compute
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default HashFunctions;
