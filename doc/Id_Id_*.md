## 目录
* [Id->RId->J.JId->Id](#Id->RId->J.JId->Id)


#### Id->RId->AA.AuId->Id

1. 阶段分析：由论文的RId发出请求，并且最后一个Id也是已知的，可以分别找出RId与Id的AA.AuId，由他们的共同AA.AuId, 生成2-hop和3-hop结果

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

3. 结果处理: 拿到以上两个请求的数据后，找出共同的AA.AuId，使用共同的AA.AuId构造`[Id, RId, AA.AuId]`加入2-hop结果集，构造`[Id, RId, AA.AuId, Id]`加入3-hop结果集

4. 请求数量计算，cost预估。
```
    total request: 2 * Rid count
    total time: 1, 请求可并行
    cpu cost operation: 0
```

#### Id->RId->J.JId->Id

1. 阶段分析: 由论文的Rid已知，而且最后的Id是已知的，可以分别查找RId与Id的J.JId, 通过他们的共同J.JId, 生成3-hop结果

2. 数据请求1:
    
    1. 查询参数
    ```
        expr: Id=RId
        count: 1
        attributes: J.JId
    ```
    2. 数据处理方式：保存返回数据中的J.JId

3. 数据请求2:

    1. 查询参数
    ```
        expr: Id=Id
        count: 1
        attributes: J.JId
    ```
    2. 数据处理方式：保存返回数据中的J.JId

4. 结果处理：拿到以上两个请求的数据后，找出以上数据的共同J.JId，并且使用这些J.JId构造3-hop结果`[Id, RId, J.JId, Id]`

5. 请求数量计算，cost预估
```
    total request: 2 * Rid count
    total time: 1, 请求可并行
    cpu cost operation: 0
```

#### Id->RId->C.CId->Id

1. 阶段分析：由论文的RId已知，而且最后的Id是已知的，可以分别查找RId和Id的C.CId, 并且通过他们的共同C.CId生成3-hop结果

2. 数据请求1:
    
    1. 查询参数
    ```
        expr: Id=RId
        count: 1
        attributes: C.CId
    ```
    2. 数据处理方式：保存返回数据中C.CId

3. 数据请求2:
    
    1. 查询参数
    ```
        expr: Id=Id
        count: 1
        attributes: C.CId
    ```
    2. 数据处理方式：保存返回数据中的C.CId

4. 结果处理：拿到以上两个数据请求后，找出以上数据中的C.CId，并且使用这些C.CId构造3-hop结果`[Id, RId, C.CId, Id]`

5. 请求数据计算，cost预估
```
    total request: 2 * Rid count
    total time: 2 * Rid count
    cpu cost operation: 0
```

#### Id->RId->F.FId->Id

1. 阶段分析: 由于论文的RId已知，而且最后的Id是已知的，可以分别查找RId和Id的F.FId，通过他们的共同F.FId生成3-hop结果

2. 数据请求1:
    1. 查询参数
    ```
        expr: Id=RId
        count: 1
        attribute: F.FId
    ```
    2. 数据处理方式：保存返回数据中的F.FId

3. 数据请求2:
    
    1. 查询参数
    ```
        expr: Id=Id
        count: 1
        attributes: F.FId
    ```
    2. 数据处理方式：保存返回数据中的F.FId

4. 结果处理：拿到以上两个数据结果后，找出数据中的共同F.FId，并且使用这些F.FId构造3-hop结果`[Id, RId, F.FId, Id]`

5. 请求数量计算，cost预估
```
    total request: 2 * Rid count
    total time: 1, 请求可并行
    cpu cost operation: 0
```

#### Id->RId1->RId2->AA.AuId
1. 阶段分析：由于论文的RI已知，而且最后的AA.AuId已知，可以分别查找RId1的RId2，以及AA.AuId的论文Id，找同两个集合中相同的论文Id，并且构造2-hop, 3-hop结果。

2. 数据请求1:

    1. 查询参数
    ```
        expr: Id=RId1
        count: 1
        attribute: RId
    ```
    2. 数据处理方式：保存返回数据中的RId.

3. 数据请求2:

    1. 查询参数
    ```
        expr: Composite(AA.AuId=AA.AuId)
        count: 1000
        attributes: Id
    ```
    2. 数据处理方式: 保存返回数据中的Id

4. 结果处理：拿到两个请求数据后，找出数据中共set1.RId = set2.Id的项，并且由这些数据构造2-hop结果：`[Id->RId1->RId2]`, 3-hop结果：`[Id->RId1->RId2->AA.AuId]`

5. 请求数量计算，cost预估
```
    total request: 2 * Rid count
    total time: 1, 请求可并行
    cpu cost operation: 0
```

#### Id->RId1->RId2->RId3
1. 阶段分析：由于论文的引用是单向的，所以要取得所有的引用关系，只能通过单向的一级级推进取得结果集。

2. 数据请求1:
    
    1. 查询参数
    ```
        expr: Id=RId1
        count: 1
        attributes: RId
    ```
    2. 数据处理方法：保存取得的RId

3. 数据请求2:
    
    1. 查询参数
    ```
        expr: And(Id=RId2,RId=RId3)
        count: 1
        attributes: Id
    ```
    2. 数据处理方法：判断返回结果集，如果不为空，则此路径可达，生成2-hop: `[Id, RId1, RId2]`, 3-hop: `[Id, RId1, RId2, RId3]`

4. 结果处理：得到所有的3-hop、2-hop数据.

5. 请求数量计算，cost预估
```
    total request: RId1 count * RId2 count
    totol time: 求取RId2并行请求时间，以及其后验证请求时间
    cpu cost operation: 0
```
