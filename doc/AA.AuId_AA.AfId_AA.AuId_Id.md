##AA.AuId -> AA.AfId -> AA.AuId -> Id
###阶段分析
1. 得到的AA.AfId需要去重，最终得到无重复的AA.AfId表。
2. 如果结果Id是AA.AuId类型，那么也要得到该AA.AuId的无重复AA.AfId表，并在本地做交集，得出2-hop结果。
3. 如果结果Id是Id类型，使用AA.AfId和结果Id查出AA.AuId，这里得到的作者是该论文的全部作者，所以还要去除不在该AA.AfId内的作者及AA.AuId为原始AA.AuId，剩下的作为3-hop结果。  
###数据请求1  
####查询参数  
		expr=AA.AuId=结果Id
		count=10
		attributes=AA.AfId，AA.AuId
####数据处理  
找出该作者的所有不同的AfId，在与之前原始AuId做交集。得到2-hop路径结果。  
###数据请求2  
####查询参数  
		expr=And(Composite(AA.AfId=each_AfId),Id=结果Id)
		count=50
		attributes=AA.AfId，AA.AuId
####数据处理  
结果得到了该篇论文的全部作者，去掉不在该AfId内的作者和原始AuId的作者，剩下的即为3-hop路径结果。  
###请求数量 cost预估  
请求1 1个请求。  
请求2 约5个请求，与AfId数量有关。