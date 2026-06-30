const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  const formatNumber = n => n < 10 ? `0${n}` : n;

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

const startAutoRefresh = (page, interval = 30000) => {
  console.log(page, 'page')
  stopAutoRefresh(page);          // 先停旧定时器
  page._timer = setInterval(() => page.onRefresh?.(), interval);
};

const stopAutoRefresh = (page) => {
  if (page._timer) {
    clearInterval(page._timer);
    page._timer = null;
  }
};
export {
  startAutoRefresh,
  stopAutoRefresh,
  formatTime
};