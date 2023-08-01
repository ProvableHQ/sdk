import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { noctisLilac } from "@uiw/codemirror-theme-noctis-lilac";
import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";
import { StreamLanguage } from "@codemirror/language";
import { theme } from "antd";
import { useState } from "react";

const aleoSyntaxHighlight = {
    start: [
        {
            regex: /(?:^|\s)(function|program|as|by|interface|closure|into|import)(?:$|\s)/,
            token: "keyword",
        },
        {
            regex: /(?:^|\s)(finalize|mapping)(?:$|\s)/,
            token: "atom",
        },
        {
            regex: /(?:^|\s)(abs.w|abs|add.w|add|and|assert|assert.eq|assert.neq|block.height|branch.eq|branch.neq|call|cast|cast.loosy|commit.bhp256|commit.bhp512|commit.bhp768|commit.bhp1024|commit.ped64|commit.ped128|div.w|div|double|gt|gte|hash.bhp256|hash.bhp512|hash.bhp768|hash.bhp1024|hash.ped64|hash.ped128|hash.psd2|hash.psd4|hash.psd8|inv|input|is.eq|is.neq|lt|lte|key|mod|mul.w|mul|nand|neg|nor|not|or|output|position|pow.w|pow|rand.chacha|rem.w|rem|shl.w|shl|shr.w|srh|sqrt|sub.w|sub|square|ternary|value|xor|get.or_use|get|set|contains|remove)(?:$|\s)/,
            token: "property",
        },
        {
            regex: /(?:field|group|address|scalar|u8|u16|u32|u64|u128|i8|i16|i32|i64|i128)\b/,
            token: "number",
        },
        {
            regex: /\.(constant|public|private|record|aleo)\b/,
            token: "type",
        },
        {
            regex: /(?:^|\s)(record)(?:$|\s)/,
            token: "type",
        },
        {
            regex: /\b([0-9]+)([ui](8|16|32|64|128))?\b/,
            token: "number",
        },
        {
            regex: /[cr][0-9]+/,
            token: "variable",
        },
    ],
};

export function CodeEditor({ value, onChange }) {
    const [isFocused, setIsFocused] = useState(false);
    const { token } = theme.useToken();

    return (
        <section
            style={{
                overflow: "auto",
                borderRadius: token.borderRadius,
                height: "300px",
                outline: isFocused
                    ? `1px solid ${token.colorPrimaryHover}`
                    : "none",
                boxShadow: isFocused
                    ? `0 0 0 ${token.controlOutlineWidth + 1}px ${
                          token.controlOutline
                      }`
                    : "none",
            }}
        >
            <CodeMirror
                style={{
                    overflow: "auto",
                    borderRadius: token.borderRadius,
                }}
                value={value}
                extensions={[
                    StreamLanguage.define(simpleMode(aleoSyntaxHighlight)),
                ]}
                theme={token.colorBgBase === "#000" ? okaidia : noctisLilac}
                onChange={onChange}
                height="300px"
                option={{ indentUnit: 4 }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </section>
    );
}
