# ABC441F题解

**发布日期：** 2026-01-17
**标签：** Atcoder题解

# 题面
### Problem Statement

A store sells $N$ items, numbered as item $1$, item $2$, $\ldots$, item $N$.  
Item $i$ $(1\leq i\leq N)$ has a price of $P_i$ yen and a value of $V_i$. The store has only one stock of each item.

Takahashi chooses some items such that the total price is at most $M$ yen.  
Here, it is guaranteed that $M$ is at least the price of any item. That is, for any $1\leq i\leq N$, there exists a way to choose items such that the total price is at most $M$ yen and item $i$ is included.

For each $1\leq i\leq N$, determine which of the following three categories item $i$ falls into:

-   Category A: To maximize the total value of the chosen items (while keeping the total price at most $M$ yen), that item must be chosen.
-   Category B: To maximize the total value of the chosen items (while keeping the total price at most $M$ yen), that item may or may not be chosen.
-   Category C: To maximize the total value of the chosen items (while keeping the total price at most $M$ yen), that item must never be chosen.
### Input

The input is given from Standard Input in the following format:

$N$ $M$<br>
$P_1$ $V_1$<br>
$P_2$ $V_2$<br>
$\vdots$<br>
$P_N$ $V_N$

### Output

Print a string of length $N$ consisting of `A`, `B`, and `C`.  
If item $i$ $(1\leq i\leq N)$ falls into category $X$ (where $X$ is A, B, or C), the $i$\-th character of the output string should be $X$.
### Sample Input 1

```
5 7
2 5
2 5
3 5
3 10
3 20
```
### Sample Output 1

```
BBCBA
```

The maximum possible total value when choosing items such that the total price is at most $7$ yen is $30$, which can be achieved by one of the following:

-   Choosing items $1$, $2$, and $5$.
-   Choosing items $4$ and $5$.

(There is no other way to choose items such that the total price is at most $7$ yen and the total value is $30$.)  
Thus, the category of each item is as follows:

-   Item $5$ is an item that must be chosen to maximize the total value of the chosen items (category A).
-   Items $1$, $2$, and $4$ are items that may or may not be chosen to maximize the total value of the chosen items (category B).
-   Item $3$ is an item that must never be chosen to maximize the total value of the chosen items (category C).

Therefore, according to the output format, print `BBCBA`.

# 解法
## 思路
令 prefix[i][w] = 用前 i 个物品（编号 1..i）恰用总花费恰为 w 时能获得的最大价值（不可达时是 -INF）。prefix[0][0]=0。

令 suffix[i][w] = 用从 i 到 N 的物品（编号 i..N）恰用总花费为 w 时能获得的最大价值，suffix[N+1][0]=0。

用常规转移分别构造 prefix[0..N] 和 suffix[1..N+1]（注意 prefix[i] 的转移用 prefix[i-1] 作为源，suffix[i] 的转移用 suffix[i+1] 作为源）。

计算全局最优值 best = max_{w<=M} prefix[N][w]。

把每个 suffix[i] 做前缀最大化（for k from 1..M: suffix[i][k] = max(suffix[i][k], suffix[i][k-1])），这样 suffix[i][t] 表示使用 i..N、花费上限为 t 时能得到的最大值（直接得到“<=t 的最大值”）。

对每个物品 i 判断：

能否被不选（excluded_possible）：若存在 w（0..M），使得 prefix[i-1][w] 可达且 prefix[i-1][w] + suffix[i+1][M-w] == best，说明不用 i 也能达到最优 → 可以不选。

能否被选（included_possible）：若存在 w（0..M-Pi），使得 prefix[i-1][w] 可达且 prefix[i-1][w] + Vi + suffix[i+1][M-Pi-w] == best，说明有最优解选了 i → 可以选。

最终分类：

included && !excluded → 必选 → A

included && excluded → 可选 → B

!included && excluded → 必不选 → C
（理论上不会出现 !included && !excluded 的情况，因为 best 必然能被构造出来）

复杂度

时间：
𝑂(𝑁⋅𝑀)
空间：需要存储 prefix 与 suffix 两组 (N+2) × (M+1) 的 long long。
## 代码
```
#include<bits/stdc++.h>
using namespace std;
#define int long long
const int inf = 1e15;
const int N = 2e5+7;
int c[N], v[N];
int f[1003][50004];
int g[1003][50004];
void solved(){
    int n, m; cin >> n >> m;
    for (int i = 1; i <= n; i++) {
        cin >> c[i] >> v[i];
    }
    for (int i = 1; i <= n + 1; i++) {
        for (int j = 1; j <= m; j++) {
            f[i][j] = -inf;
            g[i][j] = -inf;
        }
    }
    f[0][0] = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            f[i][j] = f[i - 1][j];
            if (j >= c[i]) f[i][j] = max(f[i - 1][j], f[i - 1][j - c[i]] + v[i]);
        }
    }

    g[n + 1][0] = 0;
    for (int i = n; i >= 1; i--){
        for (int j = 1; j <= m; j++) {
            g[i][j] = g[i + 1][j];
            if (j >= c[i]) g[i][j] = max(g[i + 1][j], g[i + 1][j - c[i]] + v[i]);
        }
    }

    int mx = f[n][m];
    // cout << ans << '\n';
    string ans(n, 'C');
    for (int i = 1; i <= n; i++) {
        int f1 = 0, f2 = 0;
        
        // 不选 i
        for (int j = 0; j <= m; j++) {
            if (f[i - 1][j] == -inf) continue;
            if (f[i - 1][j] + g[i + 1][m - j] == mx) {
                f1 = 1;
                break;
            }
        }

        // 选 i
        for (int j = 0; j + c[i] <= m; j++) {
            if (f[i - 1][j] == -inf) continue;
            if (f[i - 1][j] + v[i] + g[i + 1][m - j - c[i]] == mx) {
                f2 = 1;
                break;
            }
        }
        if (f1 and f2) {
            ans[i - 1] = 'B';
        } else if (f1) {
            ans[i - 1] = 'C';
        } else {
            ans[i - 1] = 'A';
        }
    }
    cout << ans << '\n';
}

signed main(){
    ios::sync_with_stdio(0),cin.tie(0);
    int _ = 1;
    // cin >> _;
    while (_--)solved();
}

```

---

[← 返回文章列表](blog.html)