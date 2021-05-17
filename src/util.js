const isPointInMiddle = (point, right, left) => {
  return left < point && point < right;
};

export { isPointInMiddle };
