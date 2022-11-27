d3.selection.prototype.trigger = function (type) {
  this.each(function () {
    const evt = document.createEvent('HTMLEvents');
    evt.initEvent(type, true, true);
    this.dispatchEvent(evt);
  });
};
