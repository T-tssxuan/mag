## 目录

- [Id1->J.JId->Id2->AA.AuId](#Id1->J.JId->Id2->AA.AuId)
- [Id1->J.JId->Id2->RId](#Id1->J.JId->Id2->RId)

#### Id1->J.JId->Id2->AA.AuId

1. 阶段分析：根据论文Id1得到期刊J.JId，然后根据期刊J.JId和作者AA.AuId得到Id2。

2. 数据请求1

   I. 查询参数

   ```
   expr: Id=Id1
   count: default
   attributes: J.JId
   ```

   II. 数据处理方式

   ​    保存返回数据中的J.JId

3. 数据请求2

   I. 查询参数

   ```
   expr: And(Composite(J.JId=J.JId),Composite(AA.AuId=AA.AuId))
   count: default
   attributes:Id
   ```

   II. 数据处理方式

   ​    保存返回数据中的Id

4. 数据请求3

   I. 查询参数

   ```
   expr: And(Composite(J.JId=J.JId),Id=Id2)
   count: default
   attributes:default
   ```

   II. 数据处理方式

   ​    保存返回数据实体长度

5. 结果处理

   根据数据请求2，找到最后作者AA.AuId发表在期刊J.JId上的论文Id2，构造 `[Id1, J.JId, Id2, AA.AuId]` 加入3-hop结果。根据数据请求3，判断期刊J.JId是否和最后结果Id2有关系，若有关系构造 `[Id1, J.JId, Id2]` 加入2-hop结果。

6. 请求数量计算，cost预估

   ```
   total request: 1 + J.JId count
   total time: 1 + J.JId count
   cpu cost operation: 0
   ```

#### Id1->J.JId->Id2->RId

1. 阶段分析：根据论文Id1得到期刊J.JId，然后根据期刊J.JId和引用论文RId得到Id2。

2. 数据请求1

   I. 查询参数

   ```
   expr: Id=Id1
   count: default
   attributes: J.JId
   ```

   II. 数据处理方式

   ​    保存返回数据中的J.JId

3. 数据请求2

   I. 查询参数

   ```
   expr: And(Composite(J.JId=J.JId),RId=RId)
   count: default
   attributes: Id
   ```

   II. 数据处理方式

   ​    保存返回数据中的Id

4. 结果处理

   根据数据请求2，找到引用论文RId并且发表在期刊J.JId上的论文Id2，构造 `[Id1, J.JId, Id2, RId]` 加入3-hop结果。

5. 请求数量计算，cost预估

   ```
   total request: 1 + J.JId count
   total time: 1 + J.JId count
   cpu cost operation: 0
   ```









