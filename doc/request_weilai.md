#### Id->AA.AuId1->AA.AfId->AA.AuId2

1. AA.AuId2->AA.AfId

   ```
   var expr = "Composite(AA.AuId=" + reqDetail.value[1] + ")";
   var attributes = "AA.AuId,AA.AfId";
   var count  = 1000;
   ```

2. AA.AuId1->AA.AfId

   ```
   var expr = "Composite(AA.AuId=" + item + ")";
   var attributes = "AA.AuId,AA.AfId";
   var count  = 1000;
   ```

#### Id->AA.AuId1->Id->AA.AuId2

1. AA.AuId1->Id->AA.AuId2

   ```
   var expr = "And(Composite(AA.AuId=" + reqDetail.value[1] + "),Composite(AA.AuId=" + item + "))";
   var attributes = "Id";
   var count  = 1000;
   ```

#### Id->AA.AuId->Id

1. Id->AA.AuId

   ```
   var expr = "Id=" + reqDetail.value[1];
   var attributes = "AA.AuId";
   var count  = 1000;
   ```

#### Id->AA.AuId->Id->RId

1. AA.AuId->Id->RId

   ```
   var expr = "And(RId=" + reqDetail.value[1] + ",Composite(AA.AuId=" + item + "))";
   var attributes = "Id";
   var count  = 1000;
   ```

#### Id->J.JId->Id

1. J.JId->Id

   ```
   var expr = "And(Id=" + reqDetail.value[1] + ",Composite(J.JId=" + basePath[0] + "))";
   var attributes = "";
   var count  = 1000;
   ```

#### Id->J.JId->Id->AA.AuId

1. J.JId->Id->AA.AuId

   ```
   var expr = "And(Composite(AA.AuId=" + reqDetail.value[1] + "),Composite(J.JId=" + basePath[0] + "))";
   var attributes = "Id";
   var count  = 1000;
   ```

#### Id->J.JId->Id->RId

1. J.JId->Id->RId

   ```
   var expr = "And(RId=" + reqDetail.value[1] + ",Composite(J.JId=" + basePath[0] + "))";
   var attributes = "Id";
   var count  = 1000;
   ```

   ​