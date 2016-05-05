### 总述
1. node 依赖模块没有上传到git，请push后在app目录下运行: `npm install`
2. 程序运行方式，在app目录下运行：`node app.js`
3. 测试：http://localhost:3000?id1=xxx&id2=xxx
4. 代码风格,主要根据: https://github.com/airbnb/javascript

### 文件说明
1. app.js 应用主程序
2. models/delay-checker.js 负责检测本地到服务器的请求时延。
3. models/evaluation.js 负责评估当前结果
4. models/mag-url-make.js 提供构造mag api请求工具函数
5. models/tada-request.js 提供api请求、数据处理的工具函数.
6. models/handler.js 路径搜索主程序
7. models/handler/Id.js 所有的2-hop, 3-hop的处理模块
8. models/handler/xx 所有的2-hop, 3-hop的处理模块

### 模块主要说明

#### models/delay-checker.js
本模块主要负责时延检测，在app启动时便会启动，在每次处理请求时，都会从此模块中
取得当前时延，做为此次处理的初时timeout

#### models/evaluation.js
主要负责评估，此模块还未实现

#### models/mag-url-make.js
主要负责生成mag api url
```
/**
 * Make a the mag api requst url according to given parameters.
 *
 * @param {String} expr no empty
 * @param {Number} count default 1
 * @param {String} attributes default ''
 *
 * @return {String} the constructed url or empty string on error
 */
function(expr, attributes, count)
```

#### models/tada-request.js 系统中所有的请求都应调用此模块
主要负责系统中对mag api的请求，其主要功能有：http请求、timeout计算、自动重试、
数据预处理
```
/**
 * An encapsulated request function, which provoide the timeout adjust and 
 * response data preprocess.
 *
 * @param {String} url 数据请求的url
 * @param {Object} info 当前request info 
 * @param {Function} callback 请求成功回调函数 function(err, data) err: error info, data: Array response entities 
 * @param {Integer} maxTry Optional 最大重试次数，默认值为4
 */
requst info解析: 
    recievedCount: 当前成功接收的次数
    timeoutCount: 当前超时次数
    timeout: 当前超时值
    flag: 是否停止所有的请求，当这个值为false时，所有请求结果以及请求都会丢弃

function (url, info, callback, maxTry)
```

#### models/handler.js
1. 请求数据分析，判断是[Id, AA.AuId], [Id, Id], [Id, AA.AuId], [AA.AuId, AA.AuId]中的哪一个
2. 系统数据初始化.
3. 取得hop-1请求结果，并且根据结果发出后续path搜索命令
4. 结果返回

```
reqDetail解析:
    desc: Array 描述请求参数数据类型
    value: Array 描述请求参数值
```

#### models/handler/Id.js
```
adaper: object
    定义本模块能搜索的路径。

searchPath: Function
    并行产生各路搜索
```
