export function getCronExpressionFromDate(date: Date) {
  const seconds = date.getSeconds();
  const minutes = date.getMinutes();
  const hours = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${seconds} ${minutes} ${hours} ${day} ${month} ${year}`;
}
