const slugify = require('slugify');

module.exports = {
  slugify: (d) => {
    return slugify(d, { lower: true });
  }
};