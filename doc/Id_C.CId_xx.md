## Id -> C.CId -> Id -> AA.AuId  

### 阶段分析  
0. 该阶段取得上一步来的**C.CId**，和题目给的**结果Id**，可能是AA.AuId或Id类型
1. 若为Id，查询**结果Id**的C.CId，在本地与上一步来的C.CId做交集。获得2-hop的结果。
2. 若为AA.AuId，使用**C.CId**和题目给的**结果Id**来查询Id，去掉结果中与原始Id相同的结果（2-hop自环）。获得3-hop的结果。  

### 数据请求1  

#### 查询参数  

		expr=Id=结果id
		count=10
		attributes=C.CId

#### 数据处理  
查询结果与上一阶段来的C.CId集合做交集，获取2-hop结果路径。  

### 数据请求2  

#### 查询参数  
		expr=And(Composite(C.CId=each_C.CId),Composite(AA.AuId=结果id))
		count=100
		attributes=Id

#### 数据处理  
查询结果去掉Id=原始Id的路径，剩下的作为3-hop结果。  

### 请求数量 cost预估  
请求1 1个请求，本地处理10条数据，时间可忽略。  
请求2 大约5个请求，由上一步C.CId数量决定。  

## Id -> C.CId -> Id -> Id

### 阶段分析  
1. 该阶段取得上一步来的**C.CId**，和题目给的**结果Id**，但并不知道是AA.AuId还是Id类型
2. 查询**结果Id**的C.CId，在本地与上一步来的C.CId做交集。获得2-hop的结果。
3. 使用**C.CId**和题目给的**结果Id**作为RId来查询Id，去掉结果中与原始Id相同的结果（2-hop自环）。获得3-hop的结果。  

### 数据请求1  

#### 查询参数  
		expr=Id=结果id
		count=10
		attributes=C.CId

#### 数据处理  
查询结果与上一阶段来的C.CId集合做交集，获取2-hop结果路径。  

### 数据请求2  

#### 查询参数  
		expr=And(Composite(C.CId=each_C.CId),RId=结果id)
		count=100
		attributes=Id
#### 数据处理  
查询结果去掉Id=原始Id的路径，剩下的作为3-hop结果。  

### 请求数量 cost预估  
请求1 1个请求，本地处理10条数据，时间可忽略。  
请求2 大约5个请求，由上一步C.CId数量决定。
