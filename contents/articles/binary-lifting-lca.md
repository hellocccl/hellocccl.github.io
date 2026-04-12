# 倍增法求 LCA 与树上路径问题

**发布日期：** 2026-02-16  
**标签：** 树论、LCA、倍增

LCA（Lowest Common Ancestor，最近公共祖先）是树上查询中的基础问题。很多题虽然表面上问距离、路径、跳祖先，本质上都绕不开 LCA。

倍增法是最经典也最稳定的做法之一。

## 一、LCA 是什么

对于树上两个点 `u` 和 `v`，LCA 指的是：

> 同时是 `u` 和 `v` 的祖先，并且深度尽可能大的那个点。

它的重要性在于：

- 路径 `u -> v` 一定经过 `lca(u, v)`
- 很多路径问题都可以拆成“到 LCA 的两段”

## 二、倍增法的核心思想

预处理：

```text
fa[u][k] = 点 u 向上跳 2^k 步后的祖先
```

这样查询时就可以像二进制拆分一样快速向上跳。

## 三、预处理内容

需要维护：

- `depth[u]`：深度
- `fa[u][k]`：第 `2^k` 级祖先

DFS 建表：

```cpp
const int LOG = 20;
vector<int> g[N];
int fa[N][LOG], depth[N];

void dfs(int u, int p) {
    fa[u][0] = p;
    depth[u] = depth[p] + 1;
    for (int k = 1; k < LOG; k++) {
        fa[u][k] = fa[fa[u][k - 1]][k - 1];
    }
    for (int v : g[u]) {
        if (v == p) continue;
        dfs(v, u);
    }
}
```

## 四、LCA 查询流程

### 1. 先把较深的点跳到同一深度

```cpp
if (depth[u] < depth[v]) swap(u, v);
int diff = depth[u] - depth[v];
for (int k = LOG - 1; k >= 0; k--) {
    if (diff >> k & 1) u = fa[u][k];
}
```

### 2. 再一起向上跳

如果此时 `u == v`，说明答案已经找到了。

否则从大到小枚举 `k`：

```cpp
for (int k = LOG - 1; k >= 0; k--) {
    if (fa[u][k] != fa[v][k]) {
        u = fa[u][k];
        v = fa[v][k];
    }
}
return fa[u][0];
```

完整函数：

```cpp
int lca(int u, int v) {
    if (depth[u] < depth[v]) swap(u, v);
    int diff = depth[u] - depth[v];
    for (int k = LOG - 1; k >= 0; k--) {
        if (diff >> k & 1) u = fa[u][k];
    }
    if (u == v) return u;
    for (int k = LOG - 1; k >= 0; k--) {
        if (fa[u][k] != fa[v][k]) {
            u = fa[u][k];
            v = fa[v][k];
        }
    }
    return fa[u][0];
}
```

## 五、LCA 的经典应用

### 1. 树上两点距离

如果边权为 1：

```text
dist(u, v) = depth[u] + depth[v] - 2 * depth[lca(u, v)]
```

如果边带权，则维护根到每点的距离前缀和 `dis[u]`：

```text
dist(u, v) = dis[u] + dis[v] - 2 * dis[lca(u, v)]
```

### 2. 第 k 级祖先

只要按二进制拆分跳祖先即可。

### 3. 路径相关查询

很多路径计数、路径交点、树上差分等问题，也经常用 LCA 做关键中转。

## 六、为什么要从大到小跳

因为我们希望在不越过答案的前提下尽量跳得更高。  
从大的 `2^k` 开始试，能保证复杂度是 `O(log n)`。

## 七、复杂度

预处理：

```text
O(n log n)
```

单次查询：

```text
O(log n)
```

如果有很多次树上询问，这个复杂度非常合适。

## 八、常见坑

### 1. `LOG` 开小了

如果 `n` 最大是 `2e5`，`LOG` 开到 20 或 21 才稳妥。

### 2. 根节点祖先访问越界

一般让 `0` 号点作为虚根，默认 `fa[0][k] = 0`。

### 3. 深度初始化错

常写法：

```cpp
depth[0] = 0;
depth[root] = 1;
```

统一后更不容易出错。

## 九、什么时候该想到 LCA

当题目涉及：

- 树上两点路径
- 两点距离
- 公共祖先
- 路径拆分

就应该优先考虑 LCA 是否能作为中间工具。

## 十、结语

LCA 是树论里非常基础的一块。把倍增法写熟之后，很多树上查询题会一下子变得很顺，因为路径信息往往都能围绕 `lca(u, v)` 展开。

---

[← 返回文章列表](blog.html)
