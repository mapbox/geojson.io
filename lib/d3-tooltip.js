(function(exports) {

  var bootstrap = (typeof exports.bootstrap === "object") ?
    exports.bootstrap :
    (exports.bootstrap = {});

  bootstrap.tooltip = function() {

    var tooltip = function(selection) {
        selection.each(setup);
      },
      animation = d3.functor(false),
      html = d3.functor(false),
      title = function() {
        var title = this.getAttribute("data-original-title");
        if (title) {
          return title;
        } else {
          title = this.getAttribute("title");
          this.removeAttribute("title");
          this.setAttribute("data-original-title", title);
        }
        return title;
      },
      over = "mouseenter.tooltip",
      out = "mouseleave.tooltip",
      placements = "top left bottom right".split(" "),
      placement = d3.functor("top");

    tooltip.title = function(_) {
      if (arguments.length) {
        title = d3.functor(_);
        return tooltip;
      } else {
        return title;
      }
    };

    tooltip.html = function(_) {
      if (arguments.length) {
        html = d3.functor(_);
        return tooltip;
      } else {
        return html;
      }
    };

    tooltip.placement = function(_) {
      if (arguments.length) {
        placement = d3.functor(_);
        return tooltip;
      } else {
        return placement;
      }
    };

    tooltip.show = function(selection) {
      selection.each(show);
    };

    tooltip.hide = function(selection) {
      selection.each(hide);
    };

    tooltip.toggle = function(selection) {
      selection.each(toggle);
    };

    tooltip.destroy = function(selection) {
      selection
        .on(over, null)
        .on(out, null)
        .attr("title", function() {
          return this.getAttribute("data-original-title") || this.getAttribute("title");
        })
        .attr("data-original-title", null)
        .select(".tooltip")
        .remove();
    };

    function setup() {
      var root = d3.select(this),
          animate = animation.apply(this, arguments),
          tip = root.append("div")
            .attr("class", "tooltip");

      if (animate) {
        tip.classed("fade", true);
      }

      // TODO "inside" checks?

      tip.append("div")
        .attr("class", "tooltip-arrow");
      tip.append("div")
        .attr("class", "tooltip-inner");

      var place = placement.apply(this, arguments);
      tip.classed(place, true);

      root.on(over, show);
      root.on(out, hide);
    }

    function show() {
      var root = d3.select(this),
          content = title.apply(this, arguments),
          tip = root.select(".tooltip")
            .classed("in", true),
          markup = html.apply(this, arguments),
          innercontent = tip.select(".tooltip-inner")[markup ? "html" : "text"](content),
          place = placement.apply(this, arguments),
          pos = root.style("position"),
          outer = getPosition(root.node()),
          inner = getPosition(tip.node()),
          style;

      if (pos === "absolute" || pos === "relative") {
          outer.x = outer.y = 0;
      }

      var style;
      switch (place) {
        case "top":
          style = {x: outer.x + (outer.w - inner.w) / 2, y: outer.y - inner.h};
          break;
        case "right":
          style = {x: outer.x + outer.w, y: outer.y + (outer.h - inner.h) / 2};
          break;
        case "left":
          style = {x: outer.x - inner.w, y: outer.y + (outer.h - inner.h) / 2};
          break;
        case "bottom":
          style = {x: Math.max(0, outer.x + (outer.w - inner.w) / 2), y: outer.y + outer.h};
          break;
      }

      tip.style(style ?
        {left: ~~style.x + "px", top: ~~style.y + "px"} :
        {left: null, top: null});

      this.tooltipVisible = true;
    }

    function hide() {
      d3.select(this).select(".tooltip")
        .classed("in", false);

      this.tooltipVisible = false;
    }

    function toggle() {
      if (this.tooltipVisible) {
        hide.apply(this, arguments);
      } else {
        show.apply(this, arguments);
      }
    }

    return tooltip;
  };

  function getPosition(node) {
    var mode = d3.select(node).style('position');
    if (mode === 'absolute' || mode === 'static') {
      return {
        x: node.offsetLeft,
        y: node.offsetTop,
        w: node.offsetWidth,
        h: node.offsetHeight
      };
    } else {
      return {
        x: 0,
        y: 0,
        w: node.offsetWidth,
        h: node.offsetHeight
      };
    }
  }

})(this);
