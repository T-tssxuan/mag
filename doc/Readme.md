## Tadaaaa MAG doc

1. [任务划分1](task1.md)

## 算法分析
1. [Id->Id->*](Id_Id_xx.md)
2. [Id->AA.AuId->*](Id_AA.AuId_xx.md)
3. [AA.AuId->AA.AfId->AA.AuId->Id](AA.AuId_AA.AfId_AA.AuId_Id.md)
4. [Id->C.CId->*](Id_C.CId_xx.md)
5. [Id->F.FId->*](Id_F.FId_xx.md)
6. [Id->J.JId->*](Id_J.JId_xx.md)

## 请求分析
1. [dabian](request_bian.md)
2. [weilai](request_weilai.md)
3. [luoxuan](request_luoxuan.md)

### or分析
1. 在图or.png中标记为绿色的联合查询，都可以改为or语句，从面减少请求量。
2. or语句: or(or(ele1, ele2), ele3)
3. and和or语句: and(or(ele1, ele2), ele3)
4. 总的请求量大概可以下减少30条左右，并且可以根据rid的cc域判断是否分片。
5. 绿色部分可以合成一个模块，逻辑基本相同。
6. 减少请求数的原因主要是：可以减速阻塞的可能性，现在系统时间增加的主要原因是个别请求阴塞。
7. 预计平均可提速200-300ms左右。
