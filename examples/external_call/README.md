# external_call.aleo

This program demonstrates how external calls work in Aleo.

In the [imports](./imports) folder, there are four basic programs:
- [difference.aleo](./imports/difference.aleo)
- [product.aleo](./imports/product.aleo)
- [quotient.aleo](./imports/quotient.aleo)
- [sum.aleo](./imports/sum.aleo)

The [`main` function in `external_call.aleo`](./main.aleo) performs 4 external calls:
```ts
// Creates a transition that evaluates `r0 * r1`.
call product.aleo/product r0 r1 into r2;

// Creates a transition that evaluates `r2 / r1`.
call quotient.aleo/quotient r2 r1 into r3;

// Creates a transition that evaluates `r3 + r0`.
call sum.aleo/sum r3 r0 into r4;

// Creates a transition that evaluates `r4 - r3`.
call difference.aleo/difference r4 r3 into r5;
```

## Build Guide

To compile this Aleo program, run:
```bash
aleo build
```

## Usage

To perform the external call, run:
```bash
aleo run main 5u32 95u32
```
