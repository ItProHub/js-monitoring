function getLoadedResource(lastIndex, duration, startTime, zeroTime, ignoreNames = []) {
    // 如果不支持performanceAPI则直接返回空
    if (typeof performance.getEntriesByType !== 'function') {
      return {
        resources: [],
        lastIndex
      };
    }
    // 初始化需要的res
    const res = [];
    // 截取查找范围
    const range = performance.getEntriesByType('resource').slice(lastIndex + 1);
    // 获得范围长度
    const rangeLen = range.length;
    // 时间限制
    const timeLimit = startTime + duration;
    // 开始查找
    for (let i = 0; i < rangeLen; i++) {
      const item = range[i];
  
      const size = item.transferSize || item.decodedBodySize || item.encodedBodySize || 0;
  
      let resourceUrl = item.name;
      // 转码
      resourceUrl = safeDecode(resourceUrl);
      // 如果是混合APP 尝试处理不需要的部分
      if (window.cordova) {
        // iOS
        resourceUrl = resourceUrl.replace(new RegExp(`^[a-zA-Z]+://([\\w\\.\\-]+(:\\d+)?)?${I_PRE}`), '');
        // Android
        resourceUrl = resourceUrl.replace(new RegExp(`^[a-zA-Z]+://${A_PRE}`), '');
      }
  
      res.push({
        u: resourceUrl,
        s: size,
        du: noNegative(item.duration, true),
        st: +zeroTime + item.startTime,
        rst: item.startTime - startTime,
        it: item.initiatorType || ''
      });
    }
  
    return {
      resources: res,
      // 记录最后的查找位置
      lastIndex: lastIndex + rangeLen
    };
  }