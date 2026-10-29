module.exports = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    const { _id, id, ...rest } = ret;
    return { id: id || (_id && _id.toString()), ...rest };
  }
};
