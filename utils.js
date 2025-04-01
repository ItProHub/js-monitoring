function safeIsNaN(n) {
    if (typeof Number.isNaN === 'function') {
      return Number.isNaN(n);
    }
    try {
      // eslint-disable-next-line
      return window.isNaN(n);
    } catch (err) {
      return false;
    }
  }


  function safeParseFloat(n) {
    if (typeof Number.parseFloat === 'function') {
      return Number.parseFloat(n);
    }
    try {
      // eslint-disable-next-line
      return window.parseFloat(n);
    } catch (err) {
      return +n;
    }
  }
  
  function noNegative(a, round = false) {
    return a > 0 ? (round ? Math.round(a) : a) : 0;
  }

  function safeDecode(str) {
    if (typeof str === 'string') {
      str = str.replace(/(%[0-9a-f]{2})+/gi, (a) => {
        let r;
        try {
          r = decodeURIComponent(a);
        } catch (er) {
          r = unescape(a);
        }
        return r;
      });
    }
  
    return str;
  }


function getTimeStamp($self$) {
    // 基本时间戳
    const t = new Date().getTime().toFixed(3);
    // 如果存在上一次的ts并且和当前生成的t相同 则追加计数器部分 否则刷新上一次的ts与计数器
    if ($self$.last_ts && $self$.last_ts === t) {
      $self$.ts_counter = +$self$.ts_counter + 1;
    } else {
      $self$.last_ts = t;
      $self$.ts_counter = 0;
    }
    // 返回t与追加计数器部分的suffix拼接
    return `${t}${Array(4 - `${$self$.ts_counter}`.length).join('0') + $self$.ts_counter}`;
  }


  function toFloat(n, pos = 2) {
    return safeIsNaN(+n) ? 0 : safeParseFloat((+n).toFixed(pos));
  }