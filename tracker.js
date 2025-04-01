const __tracker_ts__ = new Date().getTime();

function report(data) {
    // navigator.sendBeacon('/log', JSON.stringify(data));
    console.info('日志：', data);
}
  
  // 监听点击事件
  document.addEventListener('click', function(e) {
    const target = e.target;
    report({
      type: 'click',
      tag: target.tagName,
      id: target.id,
      classes: target.classList.toString()
    });
  });
  
  // 拦截Fetch请求
  const originalFetch = window.fetch;
  window.fetch = function() {
    const startTime = Date.now();
    return originalFetch.apply(this, arguments).then(response => {
      const duration = Date.now() - startTime;
      report({ type: 'fetch', url: response.url, status: response.status, duration, response: response.toString() });
      return response;
    });
  };
  
  // JS异常监听
  window.onerror = function(message, source, lineno, colno, error) {
    report({ type: 'js-error', message, source, lineno, colno, stack: error.stack });
  };
  
  window.addEventListener('unhandledrejection', function(event) {
    report({ type: 'promise-error', reason: event.reason });
  });



// 首次有效绘制（FMP）监控
const _ = {score_arr: [], startTime : performance.now(), $self$: { ts_counter: 0, last_ts: 0 }};
const WW = window.innerWidth;
const WH = window.innerHeight;
const callback = (o, value, error) => {
    let b = 0;
    const method = o.tagName;
    if (
      method !== 'SCRIPT'
       && method !== 'STYLE'
       && method !== 'META'
       && method !== 'HEAD'
    ) {
      const step = o.children ? o.children.length : 0;
      if (step > 0) {
        const c = o.children;
        let index = step - 1;
        for (; index >= 0; index--) {
          b += callback(c[index], value + 1, b > 0);
        }
      }
      if (b <= 0 && !error) {
        const { width, height, left, top } = o.getBoundingClientRect();
        // 不在可视viewport中
        if (top > WH || (top + height) < 0 || left > WW || (left + width) < 0) {
          return 0;
        }
      }
      b += (1 + 0.5 * value);
    }
    return b;
  }

const listener = () => {
    const duration = performance.now() - _.startTime;
    const body = document.querySelector('body');
    if (body) {
      let result = 0;
      result += callback(body, 1, false);
      _.score_arr.push({
        score: result,
        t: duration,
        ct: getTimeStamp(_.$self$),
      });
    } else {
      _.score_arr.push({
        score: 0,
        t: duration,
        ct: getTimeStamp(_.$self$),
      });
    }
  };


const MO = window.MutationObserver || window.WebKitMutationObserver;
const observer = new MO(listener);
observer.observe(document, { childList: true, subtree: true });


const pageLoadReport = (data) => {
    // 获取时间内的资源
    const res = getLoadedResource(_.lastResourceIndex, data.t, __tracker_ts__, _.startTime);
    // 组装page_load事件的tags字段
    const pageLoadEventTags = {
      du: data.t,
      res: res.resources,
      // 标记page_load计算来源为fmp
      capturedType: 'fmp'
    };
    // 如果首屏没有上报过页面加载
    if (!_.$self$.first_pgl) {
      _.$self$.first_pgl = 1;
      // 尝试拿到navigationEntry（也就是整个document的加载Entry）
      const navigationEntry = typeof performance.getEntriesByType === 'function' ? performance.getEntriesByType('navigation')[0] : null;
      // 如果拿到了navigationEntry 则将其中需要的时间戳添加到tags
      if (navigationEntry && navigationEntry.duration > 0) {
        // 这里详细的说明可以参考文档：https://w3c.github.io/navigation-timing/#sec-navigation-timing
        pageLoadEventTags.nty = navigationEntry.type;
        pageLoadEventTags.fs = toFloat(navigationEntry.fetchStart, 6);
        pageLoadEventTags.dls = toFloat(navigationEntry.domainLookupStart, 6);
        pageLoadEventTags.dle = toFloat(navigationEntry.domainLookupEnd, 6);
        pageLoadEventTags.cs = toFloat(navigationEntry.connectStart, 6);
        pageLoadEventTags.ce = toFloat(navigationEntry.connectEnd, 6);
        pageLoadEventTags.ues = toFloat(navigationEntry.unloadEventStart, 6);
        pageLoadEventTags.uee = toFloat(navigationEntry.unloadEventEnd, 6);
        pageLoadEventTags.scs = toFloat(navigationEntry.secureConnectionStart, 6);
        pageLoadEventTags.rqs = toFloat(navigationEntry.requestStart, 6);
        pageLoadEventTags.rps = toFloat(navigationEntry.responseStart, 6);
        pageLoadEventTags.rpe = toFloat(navigationEntry.responseEnd, 6);
        pageLoadEventTags.di = toFloat(navigationEntry.domInteractive, 6);
        pageLoadEventTags.dcs = toFloat(navigationEntry.domContentLoadedEventStart, 6);
        pageLoadEventTags.dce = toFloat(navigationEntry.domContentLoadedEventEnd, 6);
        pageLoadEventTags.dc = toFloat(navigationEntry.domComplete, 6);
        pageLoadEventTags.les = toFloat(navigationEntry.loadEventStart, 6);
        pageLoadEventTags.lee = toFloat(navigationEntry.loadEventEnd, 6);
      }
    }
    report({ type: 'fmp', tags: pageLoadEventTags });
  }


  const execute = () => {
    const arr = _.score_arr;
    let data = null;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].t >= arr[i - 1].t) {
        const maxFrameLength = arr[i].score - arr[i - 1].score;
        if (!data || data.rate <= maxFrameLength) {
          data = {
            t: arr[i].t,
            ct: arr[i].ct,
            rate: maxFrameLength,
          };
        }
      }
    }
    pageLoadReport(data);
  }

  setTimeout(() => {
    execute();
  }, 500)
