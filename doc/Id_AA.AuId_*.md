**`Id->AA.AuId->AA.AfId->AA.AuId`**

1. 阶段分析：根据最后的作者AA.AuId找到其所属机构AA.AfId，然后根据论文Id和机构AA.AfId找到作者AA.AuId。

2. 数据请求1

   I. 查询参数

   ```
   expr: Composite(AA.AuId=AA.AuId)
   count: default
   attributes: AA.AuId,AA.AfId
   ```

   II. 数据处理方式

   ​    保存返回数据中的AA.AfId

3. 数据请求2

   I. 查询参数

   ```
   expr: Composite(And(Id=Id,AA.AfId=AA.AfId))
   count: default
   attributes:AA.AuId,AA.AfId
   ```

   II. 数据处理方式

   ​    保存返回数据中的{AA.AuId, AA.AfId}

4. 结果处理

   得到上一请求数据后，找到与最后作者AA.AuId属于同一附属机构AA.AfId的作者AA.AuId，与最后作者相同的AA.AuId构造 `[Id, AA.AuId]` 加入1-hop结果集，不相同的AA.AuId构造 `[Id, AA.AuId, AA.AfId, AA.AuId]` 加入3-hop结果集。

5. 请求数量计算，cost预估

   ```
   total request: 1 + AA.AfId count
   total time: 1 + AA.AfId count
   cpu cost operation: 0
   ```

**`Id->AA.AuId->Id->AA.AuId`**

