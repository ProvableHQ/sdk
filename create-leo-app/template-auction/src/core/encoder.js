import { Field } from "@provablehq/sdk";

const FIELD_LENGTH_BYTES = 31;
const BIGINT_LENGTH = 32;

function encodeStringAsField(auction_name) {
  // Create a new text encoder.
  const encoder = new TextEncoder();
  let utf8Bytes = encoder.encode(auction_name);

  // Ensure it's at most 31 bytes
  if (utf8Bytes.length > FIELD_LENGTH_BYTES) {
    throw new Error("String is too long to convert to a field, must be at most 31 utf-8 bytes");
  }

  // Pad the byte array to 32 bytes and add the bytes into it.
  const paddedBytes = new Uint8Array(BIGINT_LENGTH);
  paddedBytes.set(utf8Bytes);

  // Convert the bytes to a field and return the string representation.
  const field = Field.fromBytesLe(paddedBytes).toString();
  console.log(`Encoding of auction ID: ${field}`);
  return field;
}

function convertFieldToString(field) {
  let fieldBytes = field;
  if (field instanceof Field) {
    fieldBytes = field.toBytesLe();
  } else if (typeof field === "string") {
    fieldBytes = Field.fromString(field).toBytesLe();
  }
  return new TextDecoder("utf-8").decode(fieldBytes);
}

export { encodeStringAsField, convertFieldToString };