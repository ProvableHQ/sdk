import { Field } from "@provablehq/sdk";

// The length of a field element in bytes.
const FIELD_LENGTH_BYTES = 31;
const BIGINT_LENGTH = 32;

/**
 * Encode a string of (31 or less) utf-8 bytes as a field element.
 *
 * @param {string} auction_name string to encode as a field element.
 *
 * @returns {string} string representation of a field element.
 */
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

/**
 * Decode a field element into an utf-8 encoded string.
 *
 * @param {string | Field } field Field element (as a string or wasm object) to decode.
 *
 * @returns {string} the field element as a string.
 */
function convertFieldToString(field) {
  let fieldBytes;
  if (field instanceof Field) {
    // If the field is a Field object, convert it to bytes.
    fieldBytes = field.toBytesLe();
  } else if (typeof field === "string") {
    // If the field is a string, convert it to a field object first and then to bytes.
    fieldBytes = Field.fromString(field).toBytesLe();
  } else {
    throw new Error("Field must be a Field object or a string");
  }

  // Decode the bytes to a string.
  return new TextDecoder("utf-8").decode(fieldBytes);
}

function encodeStringAsFieldArray(auction_name) {
  const encoder = new TextEncoder();
  let utf8Bytes = encoder.encode(auction_name);
  return utf8Bytes;
}

export { encodeStringAsField, convertFieldToString, encodeStringAsFieldArray };