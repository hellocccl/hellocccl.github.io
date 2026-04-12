# 线段树与懒标记笔记

**发布日期：** 2024-11-14  
**标签：** 数据结构、线段树、懒标记

线段树的核心价值在于：**把区间拆成若干个互不重叠的小段维护**，从而在 `O(log n)` 内完成区间查询或区间修改。

如果树状数组更像“前缀工具”，那线段树就是更通用的区间维护工具。

## 一、什么情况下该想到线段树

常见信号：

- 需要动态维护区间和 / 区间最值
- 需要区间修改
- 普通前缀和无法应对在线更新
- 题目要求同时支持“修改 + 查询”

## 二、线段树维护的是什么

每个节点代表一个区间 `[l, r]`，并维护这个区间上的某些信息，例如：

- 区间和
- 区间最大值
- 区间最小值
- 最大前缀和 / 最大子段和

设计节点时要先想清楚：

1. 这个区间需要回答什么问题？
2. 父节点的信息能否由左右儿子合并得到？

## 三、基础结构

最常见的是四倍空间写法：

```cpp
struct Node {
    long long sum;
    long long mx;
    long long tag;
} tr[4 * N];
```

其中：

- `sum` 表示区间和
- `mx` 表示区间最大值
- `tag` 表示懒标记

## 四、建树、下传、更新、查询

### 1. 建树

```cpp
void build(int p, int l, int r) {
    if (l == r) {
        tr[p].sum = tr[p].mx = a[l];
        return;
    }
    int mid = (l + r) >> 1;
    build(p << 1, l, mid);
    build(p << 1 | 1, mid + 1, r);
    push_up(p);
}
```

### 2. 向上合并

```cpp
void push_up(int p) {
    tr[p].sum = tr[p << 1].sum + tr[p << 1 | 1].sum;
    tr[p].mx = max(tr[p << 1].mx, tr[p << 1 | 1].mx);
}
```

### 3. 懒标记下传

如果对整段 `[l, r]` 都加上 `v`，就没必要立刻递归到底。  
只要把“这段整体被加过 `v`”记下来，需要访问孩子时再下传。

```cpp
void apply(int p, int l, int r, long long v) {
    tr[p].sum += (r - l + 1) * v;
    tr[p].mx += v;
    tr[p].tag += v;
}

void push_down(int p, int l, int r) {
    if (!tr[p].tag) return;
    int mid = (l + r) >> 1;
    apply(p << 1, l, mid, tr[p].tag);
    apply(p << 1 | 1, mid + 1, r, tr[p].tag);
    tr[p].tag = 0;
}
```

### 4. 区间修改

```cpp
void update(int p, int l, int r, int ql, int qr, long long v) {
    if (ql <= l && r <= qr) {
        apply(p, l, r, v);
        return;
    }
    push_down(p, l, r);
    int mid = (l + r) >> 1;
    if (ql <= mid) update(p << 1, l, mid, ql, qr, v);
    if (qr > mid) update(p << 1 | 1, mid + 1, r, ql, qr, v);
    push_up(p);
}
```

### 5. 区间查询

```cpp
long long query_sum(int p, int l, int r, int ql, int qr) {
    if (ql <= l && r <= qr) return tr[p].sum;
    push_down(p, l, r);
    int mid = (l + r) >> 1;
    long long res = 0;
    if (ql <= mid) res += query_sum(p << 1, l, mid, ql, qr);
    if (qr > mid) res += query_sum(p << 1 | 1, mid + 1, r, ql, qr);
    return res;
}
```

## 五、懒标记为什么有用

如果没有懒标记，区间加法要递归到所有叶子，复杂度会退化。  
懒标记的意义就是：**把尚未下传的修改暂存在当前节点**。

只有在需要访问孩子时，才把修改发下去。

## 六、常见维护类型

### 1. 区间加 + 区间和

最基础，也最值得先练熟。

### 2. 区间加 + 区间最大值

如果整体加 `v`，区间最大值也整体加 `v`，很好维护。

### 3. 单点修改 + 区间最值

不一定需要懒标记，但还是线段树经典题型。

### 4. 最大子段和

需要维护：

- 区间和
- 最大前缀和
- 最大后缀和
- 最大子段和

属于线段树信息设计的进阶题。

## 七、调试时最容易错的点

### 1. 忘记 `push_down`

凡是“有标记且继续往下递归”的地方，都要小心。

### 2. 区间长度写错

```cpp
(r - l + 1)
```

经常有人漏掉 `+1`。

### 3. 父节点合并不完整

如果维护多种信息，`push_up` 一定要把所有字段都更新。

### 4. 查询函数没下传

即使只是查询，也可能先要 `push_down`，否则孩子信息不正确。

## 八、什么时候不要硬上线段树

如果题目只需要：

- 单点修改
- 前缀和查询

树状数组通常更好写。

如果题目根本不需要在线修改，前缀和/差分也可能更合适。

## 九、结语

线段树真正难的不是“会不会背模板”，而是：

- 会不会设计节点信息
- 会不会判断是否需要懒标记
- 会不会保证 `push_up / push_down` 的一致性

把最基础的“区间加 + 区间和”写熟之后，再往上扩展到最大值、最大子段和等模型，会轻松很多。

---

[← 返回文章列表](blog.html)
