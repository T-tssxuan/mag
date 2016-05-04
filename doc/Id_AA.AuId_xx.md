## 目录

* [Id->AA.AuId1->AA.AfId->AA.AuId2](#Id->AA.AuId1->AA.AfId->AA.AuId2)
* [Id1->AA.AuId1->Id2->AA.AuId2](#Id1->AA.AuId1->Id2->AA.AuId2)
* [Id1->AA.AuId->Id2->RId](#Id1->AA.AuId->Id2->RId)

#### Id->AA.AuId1->AA.AfId->AA.AuId2

1. 阶段分析：根据最后的作者AA.AuId2找到其所属机构AA.AfId，然后根据论文Id和机构AA.AfId找到作者AA.AuId1。

2. 数据请求1

   I. 查询参数

   ```
   expr: Composite(AA.AuId=AA.AuId2)
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

   得到上一请求数据后，找到与最后作者AA.AuId2属于同一附属机构AA.AfId的作者AA.AuId1，与最后作者相同的AA.AuId1构造 `[Id, AA.AuId2]` 加入1-hop结果集，不相同的AA.AuId1构造 `[Id, AA.AuId1, AA.AfId, AA.AuId2]` 加入3-hop结果集。

5. 请求数量计算，cost预估

   ```
   total request: 1 + AA.AfId count
   total time: 1 + AA.AfId count
   cpu cost operation: 0
   ```

#### Id1->AA.AuId1->Id2->AA.AuId2

1. 阶段分析：根据论文Id1得到所有作者AA.AuId1，再根据作者AA.AuId1得到其发表的论文Id2，最后判断论文Id2和最后的作者AA.AuId2是否存在关系。

2. 数据请求1

   I. 查询参数

   ```
   expr: Id=Id1
   count: default
   attributes: AA.AuId
   ```

   II. 数据处理方式

   ​    保存返回数据中的AA.AuId

3. 数据请求2

   I. 查询参数

   ```
   expr: Composite(AA.AuId=AA.AuId1)
   count: default
   attributes: Id
   ```

   II. 数据处理方式

   ​    抽取返回数据中的Id，与查询参数中的AA.AuId构造为{AA.AuId,Id}进存储

4. 数据请求3

   I. 查询参数

   ```
   expr: And(Id=Id2,Composite(AA.AuId=AA.AuId2))
   count: default
   attributes: default
   ```

   II. 数据处理方式

   ​    存储返回数据长度

5. 结果处理

   在数据请求1返回AA.AuId1中，将与AA.AuId2不相同的AA.AuId1传入数据请求2中得到Id2，将与最后结果相同的Id2构造 `[Id1, AA.AuId1, Id2]` 加入2-hop结果。将与最后结果不相同同时与Id1不同的Id2和最后结果AA.AuId2传入数据请求3中得到返回实体列表，若该列表长度大于0，则构造 `[Id1, AA.AuId1, Id2, AA.AuId2]` 加入3-hop结果。

6. 请求数量计算，cost预估

   ```
   total request: AA.AuId1 count + Id2 count
   total time: AA.AuId1 count + Id2 count
   cpu cost operation: 0
   ```

#### Id1->AA.AuId->Id2->RId

1. 阶段分析：由论文Id得到作者AA.AuId，根据作者AA.AuId和论文RId得到论文Id2。

2. 数据请求1

   I. 查询参数

   ```
   expr: Id=Id1
   count: default
   attributes: AA.AuId
   ```

   II. 数据处理方式

   ​    保存返回数据中的AA.AuId

3. 数据请求2

   I. 查询参数

   ```
   expr: Composite(And(AA.AuId=AA.AuId,RId=RId))
   count: default
   attributes: Id
   ```

   II. 数据处理方式

   ​    保存返回数据中的Id

4. 结果处理

   在数据请求1返回AA.AuId中，利用与最后结果不相同的AA.AuId和最后结果RId联合得到论文Id2，将与Id1不相同的Id2构造 `[Id1, AA.AuId, Id2, RId]` 加入3-hop结果。

5. 请求数量计算，cost预估

   ```
   total request: 1 + AA.AuId count
   total time: 1 + AA.AuId count
   cpu cost operation: 0
   ```

#### 





