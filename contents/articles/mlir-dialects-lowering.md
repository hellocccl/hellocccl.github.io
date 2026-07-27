# MLIR in Practice: Dialects, Lowering, and Progressive Optimization

**Published:** 2026-07-23
**Tags:** AI Compiler, MLIR, LLVM

## The problem MLIR solves

Before MLIR, every compiler team reinvented the same infrastructure. TensorFlow had its graph IR, XLA had HLO, TVM had Relay, and each one wrote its own pass manager, its own IR verifier, its own serialization. Worse, there was no clean way to represent a program at *several* levels of abstraction inside one system.

**MLIR** (Multi-Level Intermediate Representation), born inside LLVM, is the answer: a single, extensible IR framework where different levels of abstraction coexist as **dialects**, and where lowering between them is a first-class operation.

## Dialects: namespaces for operations

A dialect is a self-contained set of operations, types, and attributes under a namespace. You can mix them freely in one module. A few you will meet constantly:

- `func` — functions and calls
- `arith` — scalar arithmetic (`arith.addi`, `arith.mulf`)
- `linalg` — structured ops on tensors and buffers (the workhorse for ML)
- `tensor` / `memref` — values vs. explicit memory buffers
- `scf` — structured control flow (`scf.for`, `scf.if`)
- `llvm` — a near-1:1 mirror of LLVM IR, the bottom of the stack
- `gpu` / `nvvm` — GPU kernels and NVIDIA intrinsics

The power comes from the fact that a `linalg.matmul` and an `scf.for` loop can sit in the same function during lowering. You are never forced to translate the whole program at once.

## What an operation looks like

MLIR's textual form is verbose but completely explicit. Here is a matmul on tensors in the `linalg` dialect:

```mlir
func.func @matmul(%A: tensor<128x256xf32>,
                  %B: tensor<256x64xf32>,
                  %C: tensor<128x64xf32>) -> tensor<128x64xf32> {
  %0 = linalg.matmul
        ins(%A, %B : tensor<128x256xf32>, tensor<256x64xf32>)
        outs(%C : tensor<128x64xf32>) -> tensor<128x64xf32>
  return %0 : tensor<128x64xf32>
}
```

Every value carries its full type, including static shapes. This is what lets passes reason precisely about tiling and memory.

## Progressive lowering

The central idea of MLIR is **progressive lowering**: you do not jump from `linalg` to machine code. You descend one rung at a time, and each rung is a place to optimize.

```
linalg on tensors        ← fusion, tiling decisions
      │  bufferize
      ▼
linalg on memrefs        ← explicit buffers, memory planning
      │  convert to loops
      ▼
scf.for loop nests       ← loop unrolling, vectorization
      │  lower to
      ▼
llvm dialect             ← LLVM IR territory
      │  translate
      ▼
LLVM IR → PTX / object code
```

A representative pass pipeline reads almost like the diagram:

```
mlir-opt input.mlir \
  -linalg-fuse-elementwise-ops \
  -linalg-tile="tile-sizes=32,32,32" \
  -one-shot-bufferize \
  -convert-linalg-to-loops \
  -lower-affine \
  -convert-scf-to-cf \
  -convert-to-llvm
```

Each flag is a rewrite. The beauty is that you can stop at any level, dump the IR, and *read exactly what the compiler is thinking*.

## Tiling, illustrated

Tiling is where a lot of performance lives. Conceptually, `-linalg-tile` turns one big matmul into a loop nest over sub-blocks that fit in cache or shared memory:

```mlir
scf.for %i = %c0 to %c128 step %c32 {
  scf.for %j = %c0 to %c64 step %c32 {
    scf.for %k = %c0 to %c256 step %c32 {
      // 32x32x32 matmul on tiles that fit in fast memory
      %tileA = tensor.extract_slice %A[%i, %k] ...
      %tileB = tensor.extract_slice %B[%k, %j] ...
      linalg.matmul ins(%tileA, %tileB) outs(%tileC)
    }
  }
}
```

The high-level `linalg.matmul` did not know or care about tile sizes. The lowering pass introduced them. That separation of concerns — *what* to compute vs. *how* to schedule it — is exactly what MLIR is built to express.

## Why the ML world adopted it

- **Reuse.** Write your fusion pass once against `linalg`; it works for any frontend that lowers into `linalg`.
- **Interoperability.** Frontends (Torch-MLIR, StableHLO, ONNX-MLIR) and backends (LLVM, SPIR-V, custom accelerators) meet in the middle.
- **Debuggability.** Every stage is printable, verifiable text. `-print-ir-after-all` is the best teacher.

## A mental model to keep

Think of MLIR less as "an IR" and more as "a kit for building IRs that agree on a common substrate." When you design a compiler on it, your real job is choosing *which dialects to pass through* and *what to optimize at each level*. Get the ladder right and the individual passes become small, focused, and testable.

If you want to see these ideas applied inside a production framework, look at how PyTorch captures graphs and hands them to a backend — the subject of my write-up on `torch.compile`.
