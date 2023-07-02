exports.valueRequired = (value) => {
  const type = typeof value;

  if (
    value === null ||
    value === "" ||
    value === "null" ||
    value === "undefined" ||
    value === undefined
  ) {
    return false;
  } else {
    return true;
  }
};
