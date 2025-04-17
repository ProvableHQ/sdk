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

const FIELD_MODULUS = 8444461749428370424248824938781546531375899335154063827935233455917409239040n;

function stringToBigInt(input) {
  const encoder = new TextEncoder();
  const encodedBytes = encoder.encode(input);
  encodedBytes.reverse();

  let bigIntValue = BigInt(0);
  for (let i = 0; i < encodedBytes.length; i++) {
    const byteValue = BigInt(encodedBytes[i]);
    const shiftedValue = byteValue << BigInt(8 * i);
    bigIntValue = bigIntValue | shiftedValue;
  }

  return bigIntValue;
}

function bigIntToString(bigIntValue) {
  const bytes = [];
  let tempBigInt = bigIntValue;
  while (tempBigInt > BigInt(0)) {
    const byteValue = Number(tempBigInt & BigInt(255));
    bytes.push(byteValue);
    tempBigInt = tempBigInt >> BigInt(8);
  }
  bytes.reverse();
  const decoder = new TextDecoder();
  const asciiString = decoder.decode(Uint8Array.from(bytes));
  return asciiString;
}

function stringToFields(input, numFieldElements = 4) {
  const bigIntValue = stringToBigInt(input);
  const fieldElements = [];
  let remainingValue = bigIntValue;
  for (let i = 0; i < numFieldElements; i++) {
    const fieldElement = remainingValue % FIELD_MODULUS;
    fieldElements.push(fieldElement);
    remainingValue = remainingValue / FIELD_MODULUS;
  }
  if (remainingValue !== 0n) {
    throw new Error("String is too big to be encoded.");
  }
  return fieldElements;
}

function stringToFieldInputs(input) {
    return stringToFields(input).map((field) => field.toString() + "field");
}

function fieldsToString(fields) {
  let bigIntValue = BigInt(0);
  let multiplier = BigInt(1);
  for (const fieldElement of fields) {
    bigIntValue += fieldElement * multiplier;
    multiplier *= FIELD_MODULUS;
  }
  return bigIntToString(bigIntValue);
}

console.log(stringToFields("ANS"));

export { encodeStringAsField, convertFieldToString, stringToFields, stringToFieldInputs, fieldsToString};