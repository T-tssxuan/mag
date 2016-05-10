### (Id,AA.AuId)->RId->RId->RId
```
    expr: RId = reqDetail.value[1]
    attribute: 'Id'
    count: 100000
```

### (Id, AA.AuId)->RId->RId->AA.AuId
```
    expr: Composite(AA.AuId=reqDetail.value[1])
    attribute: 'Id'
    count: 10000
```

### (Id, AA.AuId)->RId->RId
```
    expr: Id=xxx
    attribute: 'RId'
    count: default
```

### (Id, AA.AuId)->RId->(AA.AuId, J.JId, C.CId, F.FId)->Id
```
    expr: Id=xxxx
    attribute: 'AA.AuId,J.JId,C.CId,F.FId'
    count: default
```

### (Id, AA.AuId)->RId->AA.AuId
```
    expr: Composite(AA.AuId=reqDetail.value[1])
    attribute: 'Id'
    count: 10000
```

