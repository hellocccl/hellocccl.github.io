# Inside `torch.compile`: Dynamo, AOTAutograd, and Inductor

**Published:** 2026-07-26
**Tags:** AI Compiler, PyTorch, torch.compile

## One line, three subsystems

`torch.compile` is the most approachable production AI compiler around, because you opt in with a single line:

```python
import torch

@torch.compile
def forward(x, w, b):
    return torch.relu(x @ w + b)
```

Behind that decorator sit three cooperating subsystems: **TorchDynamo** captures the graph, **AOTAutograd** handles the backward pass and functionalization, and **TorchInductor** generates fast kernels. Understanding the hand-offs between them demystifies the whole thing.

```
Python bytecode
      │  TorchDynamo  (capture)
      ▼
FX graph (forward)
      │  AOTAutograd  (trace fwd+bwd, functionalize)
      ▼
Functional ATen graph
      │  TorchInductor (lower + codegen)
      ▼
Triton (GPU) / C++ + OpenMP (CPU)
```

## TorchDynamo: capturing the graph without breaking Python

The hard part of compiling PyTorch is that models are *ordinary Python* — loops, conditionals, prints, arbitrary side effects. Earlier tools tried to trace this and silently produced wrong graphs when control flow depended on data.

Dynamo takes a cleverer route. It hooks into CPython's frame evaluation API (PEP 523) and analyzes **bytecode** just before it runs. It extracts the longest run of pure tensor operations into an **FX graph**, and everything it cannot safely capture becomes a **graph break** — the code falls back to normal Python, then compilation resumes afterward.

```python
def forward(x):
    y = x @ x            # captured
    if y.sum() > 0:      # data-dependent → graph break
        y = y.relu()     # new graph after the break
    return y
```

This is why `torch.compile` "just works" on real models: it never has to compile the whole function, only the tensor-heavy stretches. You can measure the damage with:

```python
import torch._dynamo as dynamo
explanation = dynamo.explain(forward)(x)
print(explanation.graph_break_count)
```

Fewer graph breaks means larger fused regions and more speedup, so hunting them down is the main tuning loop in practice.

## Guards: why recompilation happens

When Dynamo captures a graph, it also records **guards** — assumptions about the inputs, such as tensor dtype, device, and shape. On the next call it checks the guards. If they all hold, it reuses the compiled artifact. If one fails (say a new batch size), it recompiles.

```python
model = torch.compile(model)
model(torch.randn(8, 512))    # compiles for shape (8, 512)
model(torch.randn(16, 512))   # guard fails → recompile
```

To avoid a recompile per shape, mark dimensions dynamic:

```python
model = torch.compile(model, dynamic=True)
```

This trades some peak performance for a single graph that handles many shapes — usually the right call for serving.

## AOTAutograd: forward and backward together

Training needs gradients. AOTAutograd traces **both** the forward and backward passes ahead of time, lowers them to functional **ATen** ops (no in-place mutation, no aliasing surprises), and hands two clean graphs to the backend. Functionalization is what makes aggressive fusion safe: once there are no hidden side effects, the compiler can reorder and fuse freely.

## TorchInductor: where the kernels are born

Inductor is the default backend and the actual code generator. Its strategy:

- **Define-by-run lowering** from ATen ops into an internal loop-level IR.
- **Aggressive fusion** of elementwise and reduction ops into as few kernels as possible.
- **Triton** codegen for GPUs; **C++ with OpenMP** for CPUs.

The payoff is that a `matmul + bias + relu` chain collapses into one Triton kernel where the epilogue runs while the matmul output is still in registers. You can read the generated code:

```bash
TORCH_LOGS="output_code" python train.py
```

That command prints the Triton or C++ Inductor emits. Seeing a hand-written-looking Triton kernel appear from your PyTorch code is the moment the compiler stops being a black box.

## A practical checklist

From tuning `torch.compile` on real workloads, the things that actually move the needle:

1. **Count graph breaks first** (`dynamo.explain`). Restructure data-dependent control flow out of the hot path.
2. **Stabilize shapes** or pass `dynamic=True` to stop recompilation storms.
3. **Pick the mode.** `mode="max-autotune"` searches kernel configs for extra speed at the cost of longer compile time.
4. **Warm up** before benchmarking — the first call pays the full compile cost.
5. **Inspect the output code** when a speedup is smaller than expected; the emitted kernels tell you whether fusion happened.

## The takeaway

`torch.compile` is a clean, layered AI compiler you can poke at from Python. Dynamo answers *"what graph am I running?"*, AOTAutograd answers *"what does the backward look like, without side effects?"*, and Inductor answers *"what kernels should the hardware actually execute?"* Each layer is inspectable, and once you know which layer to look at, debugging performance becomes a directed search instead of guesswork.
