#### `Id->RId->AA.AuId->Id`

1. 阶段分析：由论文的RId发出请求，并且最后一个Id也是已知的，可以分别找出RId与Id的AA.AuId，并且判断他们之间是否有共同作者。

2. 数据请求1:

    1. 查询参数
    ```
        expr: Id=RId
        count: 1
        attributes: AA.AuId
    ```

    2. 数据处理方式: 保存返回数据中的AA.AuId域

2. 数据请求2:

    1. 查询参数
    ```
        expr: Id=Id
        count: 1
        attributes: AA.AuId
    ```

    2. 数据处理方式: 保存返回数据中的AA.AuId域

3. 结果处理: 拿到以上两个请求的数据后，判断以上数据是否存在共同的AA.AuId，对于共同的AA.AuId构造`[Id, RId, AA.AuId]`加入2-hop结果集，构造`[Id, RId, AA.AuId, Id]`加入3-hop结果集

4. 请求数量计算，cost预估。
```
    total request: 2 * Rid count
    total time: 2 * Rid count
    cpu cost operation: 0
```

#### `Id->RId->J.Jid->Id`

1. 阶段分析: 由论文的Rid发出请求，而且最后的i
