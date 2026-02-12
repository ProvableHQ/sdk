import { useState } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.svg";
import "./App.css";
import { AleoWorker } from "./workers/AleoWorker";
import {
    SAMPLE_RECORD_1,
    SAMPLE_RECORD_2,
    SAMPLE_RECIPIENT,
    SAMPLE_AMOUNT,
} from "./constants/sampleRecords";

const aleoWorker = AleoWorker();

type Tab = "public" | "private" | "records";

/**
 * Format a single output string for display.
 * Replaces escaped newlines and adds proper indentation.
 */
function formatOutputString(output: string): string {
    return output
        .replace(/\\n/g, "\n")
        .replace(/,\s*\n\s*/g, ",\n  ")
        .trim();
}

/**
 * Detect the type of output (record or future).
 */
function getOutputType(output: string): "record" | "future" {
    if (output.startsWith("Future {")) {
        return "future";
    }
    return "record";
}

/**
 * Component to display formatted outputs.
 */
function OutputDisplay({
    outputs,
    timing,
}: {
    outputs: string[];
    timing: number;
}) {
    return (
        <div className="output success">
            <h4>Output ({timing}ms)</h4>
            <div className="output-list">
                {outputs.map((output, index) => {
                    const type = getOutputType(output);
                    const formatted = formatOutputString(output);
                    return (
                        <div key={index} className="output-item">
                            <span className={`output-label ${type}`}>
                                {type === "record" ? "Record" : "Future"}
                            </span>
                            <pre>{formatted}</pre>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function App() {
    const [activeTab, setActiveTab] = useState<Tab>("public");

    // Execution state
    const [executing, setExecuting] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, string[]>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [timing, setTiming] = useState<Record<string, number>>({});

    // Form inputs for public transfers
    const [publicRecipient, setPublicRecipient] = useState(SAMPLE_RECIPIENT);
    const [publicAmount, setPublicAmount] = useState(SAMPLE_AMOUNT);

    // Form inputs for public to private
    const [pubToPrivRecipient, setPubToPrivRecipient] =
        useState(SAMPLE_RECIPIENT);
    const [pubToPrivAmount, setPubToPrivAmount] = useState(SAMPLE_AMOUNT);

    // Form inputs for private transfer
    const [privateRecord, setPrivateRecord] = useState(SAMPLE_RECORD_1);
    const [privateRecipient, setPrivateRecipient] = useState(SAMPLE_RECIPIENT);
    const [privateAmount, setPrivateAmount] = useState(SAMPLE_AMOUNT);

    // Form inputs for private to public
    const [privToPubRecord, setPrivToPubRecord] = useState(SAMPLE_RECORD_1);
    const [privToPubRecipient, setPrivToPubRecipient] =
        useState(SAMPLE_RECIPIENT);
    const [privToPubAmount, setPrivToPubAmount] = useState(SAMPLE_AMOUNT);

    // Form inputs for join
    const [joinRecord1, setJoinRecord1] = useState(SAMPLE_RECORD_1);
    const [joinRecord2, setJoinRecord2] = useState(SAMPLE_RECORD_2);

    // Form inputs for split
    const [splitRecord, setSplitRecord] = useState(SAMPLE_RECORD_1);
    const [splitAmount, setSplitAmount] = useState(250000);

    const executeFunction = async (
        functionName: string,
        workerMethod: () => Promise<string[]>,
    ) => {
        setExecuting(functionName);
        setErrors((prev) => ({ ...prev, [functionName]: "" }));
        const start = Date.now();

        try {
            const outputs = await workerMethod();
            setResults((prev) => ({ ...prev, [functionName]: outputs }));
            setTiming((prev) => ({
                ...prev,
                [functionName]: Date.now() - start,
            }));
        } catch (e) {
            setErrors((prev) => ({
                ...prev,
                [functionName]: e instanceof Error ? e.message : String(e),
            }));
        }
        setExecuting(null);
    };

    return (
        <div className="app">
            <header className="header">
                <div className="logos">
                    <a href="https://provable.com" target="_blank">
                        <img src={aleoLogo} className="logo" alt="Aleo logo" />
                    </a>
                    <a href="https://react.dev" target="_blank">
                        <img
                            src={reactLogo}
                            className="logo react"
                            alt="React logo"
                        />
                    </a>
                </div>
                <h1>Credits.aleo Functions</h1>
                <p className="subtitle">
                    Build execution transactions for Aleo's native credits
                    program
                </p>
            </header>

            <nav className="tabs">
                <button
                    className={activeTab === "public" ? "active" : ""}
                    onClick={() => setActiveTab("public")}
                >
                    Public Transfers
                </button>
                <button
                    className={activeTab === "private" ? "active" : ""}
                    onClick={() => setActiveTab("private")}
                >
                    Private Transfers
                </button>
                <button
                    className={activeTab === "records" ? "active" : ""}
                    onClick={() => setActiveTab("records")}
                >
                    Record Operations
                </button>
            </nav>

            <main className="main">
                {/* Public Transfers Tab */}
                {activeTab === "public" && (
                    <div className="tab-content">
                        {/* transfer_public */}
                        <div className="function-card">
                            <h3>transfer_public</h3>
                            <p className="description">
                                Transfer credits between public balances.
                            </p>
                            <div className="inputs">
                                <div className="input-group">
                                    <label>Recipient Address</label>
                                    <input
                                        type="text"
                                        value={publicRecipient}
                                        onChange={(e) =>
                                            setPublicRecipient(e.target.value)
                                        }
                                        placeholder="aleo1..."
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Amount (microcredits)</label>
                                    <input
                                        type="text"
                                        value={publicAmount}
                                        onChange={(e) =>
                                            setPublicAmount(Number(e.target.value) || 0)
                                        }
                                        placeholder="50000"
                                    />
                                </div>
                            </div>
                            <button
                                className="execute-button"
                                disabled={executing !== null}
                                onClick={() =>
                                    executeFunction("transfer_public", () =>
                                        aleoWorker.transferPublic(
                                            publicRecipient,
                                            publicAmount,
                                        ),
                                    )
                                }
                            >
                                {executing === "transfer_public"
                                    ? "Executing..."
                                    : "Execute"}
                            </button>
                            {results["transfer_public"] && (
                                <OutputDisplay
                                    outputs={results["transfer_public"]}
                                    timing={timing["transfer_public"]}
                                />
                            )}
                            {errors["transfer_public"] && (
                                <div className="output error">
                                    <h4>Error</h4>
                                    <pre>{errors["transfer_public"]}</pre>
                                </div>
                            )}
                        </div>

                        {/* transfer_public_to_private */}
                        <div className="function-card">
                            <h3>transfer_public_to_private</h3>
                            <p className="description">
                                Convert public credits to a private record.
                            </p>
                            <div className="inputs">
                                <div className="input-group">
                                    <label>Recipient Address</label>
                                    <input
                                        type="text"
                                        value={pubToPrivRecipient}
                                        onChange={(e) =>
                                            setPubToPrivRecipient(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="aleo1..."
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Amount (microcredits)</label>
                                    <input
                                        type="text"
                                        value={pubToPrivAmount}
                                        onChange={(e) =>
                                            setPubToPrivAmount(Number(e.target.value) || 0)
                                        }
                                        placeholder="50000"
                                    />
                                </div>
                            </div>
                            <button
                                className="execute-button"
                                disabled={executing !== null}
                                onClick={() =>
                                    executeFunction(
                                        "transfer_public_to_private",
                                        () =>
                                            aleoWorker.transferPublicToPrivate(
                                                pubToPrivRecipient,
                                                pubToPrivAmount,
                                            ),
                                    )
                                }
                            >
                                {executing === "transfer_public_to_private"
                                    ? "Executing..."
                                    : "Execute"}
                            </button>
                            {results["transfer_public_to_private"] && (
                                <OutputDisplay
                                    outputs={
                                        results["transfer_public_to_private"]
                                    }
                                    timing={
                                        timing["transfer_public_to_private"]
                                    }
                                />
                            )}
                            {errors["transfer_public_to_private"] && (
                                <div className="output error">
                                    <h4>Error</h4>
                                    <pre>
                                        {errors["transfer_public_to_private"]}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Private Transfers Tab */}
                {activeTab === "private" && (
                    <div className="tab-content">
                        {/* transfer_private */}
                        <div className="function-card">
                            <h3>transfer_private</h3>
                            <p className="description">
                                Transfer credits using private records.
                            </p>
                            <div className="inputs">
                                <div className="input-group">
                                    <label>Record</label>
                                    <textarea
                                        value={privateRecord}
                                        onChange={(e) =>
                                            setPrivateRecord(e.target.value)
                                        }
                                        placeholder="{ owner: ..., microcredits: ..., _nonce: ... }"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Recipient Address</label>
                                    <input
                                        type="text"
                                        value={privateRecipient}
                                        onChange={(e) =>
                                            setPrivateRecipient(e.target.value)
                                        }
                                        placeholder="aleo1..."
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Amount (microcredits)</label>
                                    <input
                                        type="text"
                                        value={privateAmount}
                                        onChange={(e) =>
                                            setPrivateAmount(Number(e.target.value) || 0)
                                        }
                                        placeholder="50000"
                                    />
                                </div>
                            </div>
                            <button
                                className="execute-button"
                                disabled={executing !== null}
                                onClick={() =>
                                    executeFunction("transfer_private", () =>
                                        aleoWorker.transferPrivate(
                                            privateRecord,
                                            privateRecipient,
                                            privateAmount,
                                        ),
                                    )
                                }
                            >
                                {executing === "transfer_private"
                                    ? "Executing..."
                                    : "Execute"}
                            </button>
                            {results["transfer_private"] && (
                                <OutputDisplay
                                    outputs={results["transfer_private"]}
                                    timing={timing["transfer_private"]}
                                />
                            )}
                            {errors["transfer_private"] && (
                                <div className="output error">
                                    <h4>Error</h4>
                                    <pre>{errors["transfer_private"]}</pre>
                                </div>
                            )}
                        </div>

                        {/* transfer_private_to_public */}
                        <div className="function-card">
                            <h3>transfer_private_to_public</h3>
                            <p className="description">
                                Convert private record to public balance.
                            </p>
                            <div className="inputs">
                                <div className="input-group">
                                    <label>Record</label>
                                    <textarea
                                        value={privToPubRecord}
                                        onChange={(e) =>
                                            setPrivToPubRecord(e.target.value)
                                        }
                                        placeholder="{ owner: ..., microcredits: ..., _nonce: ... }"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Recipient Address</label>
                                    <input
                                        type="text"
                                        value={privToPubRecipient}
                                        onChange={(e) =>
                                            setPrivToPubRecipient(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="aleo1..."
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Amount (microcredits)</label>
                                    <input
                                        type="text"
                                        value={privToPubAmount}
                                        onChange={(e) =>
                                            setPrivToPubAmount(Number(e.target.value) || 0)
                                        }
                                        placeholder="50000"
                                    />
                                </div>
                            </div>
                            <button
                                className="execute-button"
                                disabled={executing !== null}
                                onClick={() =>
                                    executeFunction(
                                        "transfer_private_to_public",
                                        () =>
                                            aleoWorker.transferPrivateToPublic(
                                                privToPubRecord,
                                                privToPubRecipient,
                                                privToPubAmount,
                                            ),
                                    )
                                }
                            >
                                {executing === "transfer_private_to_public"
                                    ? "Executing..."
                                    : "Execute"}
                            </button>
                            {results["transfer_private_to_public"] && (
                                <OutputDisplay
                                    outputs={
                                        results["transfer_private_to_public"]
                                    }
                                    timing={
                                        timing["transfer_private_to_public"]
                                    }
                                />
                            )}
                            {errors["transfer_private_to_public"] && (
                                <div className="output error">
                                    <h4>Error</h4>
                                    <pre>
                                        {errors["transfer_private_to_public"]}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Record Operations Tab */}
                {activeTab === "records" && (
                    <div className="tab-content">
                        {/* join */}
                        <div className="function-card">
                            <h3>join</h3>
                            <p className="description">
                                Combine two credit records into one.
                            </p>
                            <div className="inputs">
                                <div className="input-group">
                                    <label>Record 1</label>
                                    <textarea
                                        value={joinRecord1}
                                        onChange={(e) =>
                                            setJoinRecord1(e.target.value)
                                        }
                                        placeholder="{ owner: ..., microcredits: ..., _nonce: ... }"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Record 2</label>
                                    <textarea
                                        value={joinRecord2}
                                        onChange={(e) =>
                                            setJoinRecord2(e.target.value)
                                        }
                                        placeholder="{ owner: ..., microcredits: ..., _nonce: ... }"
                                    />
                                </div>
                            </div>
                            <button
                                className="execute-button"
                                disabled={executing !== null}
                                onClick={() =>
                                    executeFunction("join", () =>
                                        aleoWorker.join(
                                            joinRecord1,
                                            joinRecord2,
                                        ),
                                    )
                                }
                            >
                                {executing === "join"
                                    ? "Executing..."
                                    : "Execute"}
                            </button>
                            {results["join"] && (
                                <OutputDisplay
                                    outputs={results["join"]}
                                    timing={timing["join"]}
                                />
                            )}
                            {errors["join"] && (
                                <div className="output error">
                                    <h4>Error</h4>
                                    <pre>{errors["join"]}</pre>
                                </div>
                            )}
                        </div>

                        {/* split */}
                        <div className="function-card">
                            <h3>split</h3>
                            <p className="description">
                                Split one credit record into two.
                            </p>
                            <div className="inputs">
                                <div className="input-group">
                                    <label>Record</label>
                                    <textarea
                                        value={splitRecord}
                                        onChange={(e) =>
                                            setSplitRecord(e.target.value)
                                        }
                                        placeholder="{ owner: ..., microcredits: ..., _nonce: ... }"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Amount for first record</label>
                                    <input
                                        type="text"
                                        value={splitAmount}
                                        onChange={(e) =>
                                            setSplitAmount(Number(e.target.value) || 0)
                                        }
                                        placeholder="250000"
                                    />
                                </div>
                            </div>
                            <button
                                className="execute-button"
                                disabled={executing !== null}
                                onClick={() =>
                                    executeFunction("split", () =>
                                        aleoWorker.split(
                                            splitRecord,
                                            splitAmount,
                                        ),
                                    )
                                }
                            >
                                {executing === "split"
                                    ? "Executing..."
                                    : "Execute"}
                            </button>
                            {results["split"] && (
                                <OutputDisplay
                                    outputs={results["split"]}
                                    timing={timing["split"]}
                                />
                            )}
                            {errors["split"] && (
                                <div className="output error">
                                    <h4>Error</h4>
                                    <pre>{errors["split"]}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="footer">
                <p>
                    Execution may take 10-30 seconds as zero-knowledge proofs
                    are generated.
                </p>
            </footer>
        </div>
    );
}

export default App;
