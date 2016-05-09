##AA.AfId->AA.AuId
		var expr = "Composite(AA.AuId="+reqDetail.value[1]+")";
        var attributes = "AA.AuId,AA.AfId";
        var count = 1000;

##AA.AfId->AA.AuId->Id
request1

		var expr = "Id="+reqDetail.value[1];
        var attributes = "AA.AuId";
        var count = 100;
request2

		var expr = "Composite(AA.AuId="+item+")";
	    var attributes = "AA.AuId,AA.AfId";
        var count = 1000;

##C.CId->Id
		var expr = "Id="+reqDetail.value[1];
        var attributes = "C.CId";
        var count = 1;

##C.CId->Id->AA.AuId
		var expr = "And(Composite(C.CId="+basePath[0]+"),Composite(AA.AuId="+reqDetail.value[1]+"))";
        var attributes = "Id";
        var count = 100;

##C.CId->Id->Id
		var expr = "And(Composite(C.CId="+basePath[0]+"),RId="+reqDetail.value[1]+")";
        var attributes = "Id";
        var count = 10000;

##F.FId->Id
		var expr = "Id="+reqDetail.value[1];
        var attributes = "F.FId";
        var count = 100;

##F.FId->Id->AA.AuId
		var expr = "And(Composite(F.FId="+ item +"),Composite(AA.AuId="+reqDetail.value[1]+"))";
        var attributes = "Id";
        var count = 1000;

##F.FId->Id->Id
		var expr = "And(Composite(F.FId="+ item +"),RId="+reqDetail.value[1]+")";
        var attributes = "Id";
        var count = 100000;