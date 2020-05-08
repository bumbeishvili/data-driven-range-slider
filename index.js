d3 = window.d3||require('d3');

class RangeSlider {
  constructor() {
    const attrs = {
      id: "ID" + Math.floor(Math.random() * 1000000),
      svgWidth: 400,
      svgHeight: 400,
      marginTop: 10,
      marginBottom: 0,
      marginRight: 0,
      marginLeft: 40,
      container: "body",
      defaultTextFill: "#2C3E50",
      defaultFont: "Helvetica",
      data: null,
      accessor: null,
      aggregator: null,
      yScale: null,
      freezeMin: null,
      onBrush: (d) => d,
      yScale: d3.scaleLinear(),
      yTicks: 4,
      freezeMin: false,
      startSelection: 100,
      svg:null
    };


    this.getChartState = () => attrs;

    Object.keys(attrs).forEach((key) => {
      //@ts-ignore
      this[key] = function (_) {
        var string = `attrs['${key}'] = _`;
        if (!arguments.length) {
          return eval(`attrs['${key}'];`);
        }
        eval(string);
        return this;
      };
    });

    this.initializeEnterExitUpdatePattern();
  }

  // Fancy version of d3 join
  initializeEnterExitUpdatePattern() {
    d3.selection.prototype.patternify = function (params) {
      var container = this;
      var selector = params.selector;
      var elementTag = params.tag;
      var data = params.data || [selector];

      // Pattern in action
      var selection = container.selectAll("." + selector).data(data, (d, i) => {
        if (typeof d === "object") {
          if (d.id) {
            return d.id;
          }
        }
        return i;
      });
      selection.exit().remove();
      selection = selection.enter().append(elementTag).merge(selection);
      selection.attr("class", selector);
      return selection;
    };
  }

  drawChartTemplate() {
    const attrs = this.getChartState();
    const calc = attrs.calc;

    //Drawing containers
    var container = d3.select(attrs.container);
    var containerRect = container.node().getBoundingClientRect();
    if (containerRect.width > 0) attrs.svgWidth = containerRect.width;

    //Add svg
    var svg = container
      .patternify({
        tag: "svg",
        selector: "svg-chart-container",
      })
      .style("overflow", "visible")
      .attr("width", attrs.svgWidth)
      .attr("height", attrs.svgHeight)
      .attr("font-family", attrs.defaultFont);

    //Add container g element
    var chart = svg
      .patternify({
        tag: "g",
        selector: "chart",
      })
      .attr(
        "transform",
        "translate(" + calc.chartLeftMargin + "," + calc.chartTopMargin + ")"
      );

    // Share chart
    attrs.chart = chart;
    attrs.svg = svg;
  }

  drawBrushHandles() {
    const attrs = this.getChartState();
    const brush = attrs.brush;
    const calc = attrs.calc;

    const handlerWidth = 2,
      handlerFill = "#3F434D",
      middleHandlerWidth = 10,
      middleHandlerStroke = "#D4D7DF",
      middleHandlerFill = "#486878";

    var handle = brush
      .patternify({
        tag: "g",
        selector: "custom-handle",
        data: [
          {
            left: true,
          },
          {
            left: false,
          },
        ],
      })
      .attr("cursor", "ew-resize")
      .attr("pointer-events", "all")


    handle
      .patternify({
        tag: "rect",
        selector: "custom-handle-rect",
        data: (d) => [d],
      })
      .attr("width", handlerWidth)
      .attr("height", calc.chartHeight)
      .attr("fill", handlerFill)
      .attr("stroke", handlerFill)
      .attr("y", -calc.chartHeight / 2)
      .attr("pointer-events", "none");

    handle
      .patternify({
        tag: "rect",
        selector: "custom-handle-rect-middle",
        data: (d) => [d],
      })
      .attr("width", middleHandlerWidth)
      .attr("height", 30)
      .attr("fill", middleHandlerFill)
      .attr("stroke", middleHandlerStroke)
      .attr("y", -16)
      .attr("x", -middleHandlerWidth / 4)
      .attr("pointer-events", "none")
      .attr("rx", 3);

    handle
      .patternify({
        tag: "rect",
        selector: "custom-handle-rect-line-left",
        data: (d) => [d],
      })
      .attr("width", 0.7)
      .attr("height", 20)
      .attr("fill", middleHandlerStroke)
      .attr("stroke", middleHandlerStroke)
      .attr("y", -100 / 6 + 5)
      .attr("x", -middleHandlerWidth / 4 + 3)
      .attr("pointer-events", "none");

    handle
      .patternify({
        tag: "rect",
        selector: "custom-handle-rect-line-right",
        data: (d) => [d],
      })
      .attr("width", 0.7)
      .attr("height", 20)
      .attr("fill", middleHandlerStroke)
      .attr("stroke", middleHandlerStroke)
      .attr("y", -100 / 6 + 5)
      .attr("x", -middleHandlerWidth / 4 + middleHandlerWidth - 3)
      .attr("pointer-events", "none");

    handle.attr("display", "none");

    // Share props
    attrs.handle = handle
  }

  createScales() {
    const attrs = this.getChartState();
    const dataFinal = attrs.dataFinal;
    const accessorFunc = attrs.accessorFunc;
    const isDate = attrs.isDate;
    const dateScale = attrs.dateScale;
    const calc = attrs.calc;

    const groupedInitial = this.group(dataFinal)
      .by((d, i) => {
        const field = accessorFunc(d);
        if (isDate) {
          return Math.round(dateScale(field));
        }
        return field;
      })
      .orderBy((d) => d.key)
      .run();

    const grouped = groupedInitial.map((d) =>
      Object.assign(d, { value: typeof attrs.aggregator == "function" ? attrs.aggregator(d) : d.values.length })
    );

    const values = grouped.map((d) => d.value);
    const max = d3.max(values);
    const maxX = grouped[grouped.length - 1].key;
    const minX = grouped[0].key;

    var minDiff = d3.min(grouped, (d, i, arr) => {
      if (!i) return Infinity;
      return d.key - arr[i - 1].key;
    });

    let eachBarWidth = calc.chartWidth / minDiff / (maxX - minX);
    if (eachBarWidth > 20) { eachBarWidth = 20; }
    if (minDiff < 1) { eachBarWidth = eachBarWidth * minDiff; }
    if (eachBarWidth < 1) { eachBarWidth = 1; }

    const scale = attrs.yScale
      .domain([calc.minY, max])
      .range([0, calc.chartHeight - 25]);
    const scaleY = scale
      .copy()
      .domain([max, calc.minY])
      .range([0, calc.chartHeight - 25]);

    const scaleX = d3
      .scaleLinear()
      .domain([minX, maxX])
      .range([0, calc.chartWidth]);

    attrs.scale = scale;
    attrs.scaleX = scaleX;
    attrs.scaleY = scaleY;
    attrs.max = max;
    attrs.minX = minX;
    attrs.maxX = maxX;
    attrs.grouped = grouped;
    attrs.eachBarWidth = eachBarWidth;
    attrs.scale = scale;
  }

  render() {
    const that = this;
    const attrs = this.getChartState();

    //Calculated properties
    var calc = {
      id: null,
      chartTopMargin: null,
      chartLeftMargin: null,
      chartWidth: null,
      chartHeight: null,
    };
    calc.id = "ID" + Math.floor(Math.random() * 1000000); // id for event handlings
    calc.chartLeftMargin = attrs.marginLeft;
    calc.chartTopMargin = attrs.marginTop;
    calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
    calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;
    calc.minY = attrs.yScale ? 0.0001 : 0;
    attrs.calc = calc;

    var accessorFunc = (d) => d;
    if (attrs.data[0].value != null) {
      accessorFunc = (d) => d.value;
    }
    if (attrs.accessor && typeof attrs.accessor == "function") {
      accessorFunc = attrs.accessor;
    }
    const dataFinal = attrs.data;
    attrs.accessorFunc = accessorFunc;
    const isDate = Object.prototype.toString.call(accessorFunc(dataFinal[0])) === "[object Date]";
    attrs.isDate = isDate;


    var dateExtent,
      dateScale,
      scaleTime,
      dateRangesCount,
      dateRanges,
      scaleTime;
    if (isDate) {
      dateExtent = d3.extent(dataFinal.map(accessorFunc));
      dateRangesCount = Math.round(calc.chartWidth / 5);
      dateScale = d3.scaleTime().domain(dateExtent).range([0, dateRangesCount]);
      scaleTime = d3.scaleTime().domain(dateExtent).range([0, calc.chartWidth]);
      dateRanges = d3
        .range(dateRangesCount)
        .map((d) => [dateScale.invert(d), dateScale.invert(d + 1)]);
    }
    
    attrs.dateScale = dateScale;
    attrs.dataFinal = dataFinal;
    attrs.scaleTime = scaleTime;

    this.drawChartTemplate();
    var chart = attrs.chart;
    var svg = attrs.svg;

    this.createScales();
    const scaleX = attrs.scaleX;
    const scaleY = attrs.scaleY;
    const max = attrs.max;
    const grouped = attrs.grouped;
    const eachBarWidth = attrs.eachBarWidth;
    const scale = attrs.scale;

    var axis = d3.axisBottom(scaleX);
    if (isDate) {
      axis = d3.axisBottom(scaleTime);
    }
    const axisY = d3
      .axisLeft(scaleY)
      .tickSize(-calc.chartWidth - 20)
      .ticks(max == 1 ? 1 : attrs.yTicks)
      .tickFormat(d3.format(".2s"));

    const bars = chart
      .patternify({ tag: "rect", selector: "bar", data: grouped })
      .attr("class", "bar")
      .attr("pointer-events", "none")
      .attr("width", eachBarWidth)
      .attr("height", (d) => scale(d.value))
      .attr("fill", "#424853")
      .attr("y", (d) => -scale(d.value) + (calc.chartHeight - 25))
      .attr("x", (d, i) => scaleX(d.key) - eachBarWidth / 2)
      .attr("opacity", 0.9);

    const xAxisWrapper = chart
      .patternify({ tag: "g", selector: "x-axis" })
      .attr("transform", `translate(${0},${calc.chartHeight - 25})`)
      .call(axis);

    const yAxisWrapper = chart
      .patternify({ tag: "g", selector: "y-axis" })
      .attr("transform", `translate(${-10},${0})`)
      .call(axisY);

    const brush = chart.patternify({ tag: "g", selector: "brush" }).call(
      d3
        .brushX()
        .extent([
          [0, 0],
          [calc.chartWidth, calc.chartHeight],
        ])
        .on("start", brushStarted)
        .on("end", brushEnded)
        .on("brush", brushed)
    );

    attrs.brush = brush;
    this.drawBrushHandles();
    const handle = attrs.handle;

    chart
      .selectAll(".selection")
      .attr("fill-opacity", 0.1)
      .attr("fill", "white")
      .attr("stroke-opacity", 0.4);



    function brushStarted() {
      if (d3.event.selection) {
        attrs.startSelection = d3.event.selection[0];
      }
    }

    function brushEnded() {
      const attrs = that.getChartState();
      var minX = attrs.minX;
      var maxX = attrs.maxX;

      if (!d3.event.selection) {
        handle.attr("display", "none");

        output({
          range: [minX, maxX],
        });
        return;
      }
      if (d3.event.sourceEvent.type === "brush") return;

      var d0 = d3.event.selection.map(scaleX.invert),
        d1 = d0.map(d3.timeDay.round);

      if (d1[0] >= d1[1]) {
        d1[0] = d3.timeDay.floor(d0[0]);
        d1[1] = d3.timeDay.offset(d1[0]);
      }
    }

    function brushed(d) {
      if (d3.event.sourceEvent.type === "brush") return;
      if (attrs.freezeMin) {
        if (d3.event.selection[0] < attrs.startSelection) {
          d3.event.selection[1] = Math.min(
            d3.event.selection[0],
            d3.event.selection[1]
          );
        }
        if (d3.event.selection[0] >= attrs.startSelection) {
          d3.event.selection[1] = Math.max(
            d3.event.selection[0],
            d3.event.selection[1]
          );
        }

        d3.event.selection[0] = 0;
        d3.select(this).call(d3.event.target.move, d3.event.selection);
      }

      var d0 = d3.event.selection.map(scaleX.invert);
      const s = d3.event.selection;

      handle.attr("display", null).attr("transform", function (d, i) {
        return "translate(" + (s[i] - 2) + "," + (calc.chartHeight / 2 - 25) + ")";
      });
      output({
        range: d0,
      });
    }

    yAxisWrapper.selectAll(".domain").remove();
    xAxisWrapper.selectAll(".domain").attr("opacity", 0.1);
    xAxisWrapper.selectAll("text").attr("fill", "#9CA1AE");
    yAxisWrapper.selectAll("text").attr("fill", "#9CA1AE");
    svg.selectAll('.selection').attr('transform', 'translate(0,-25)')

    chart
      .selectAll(".tick line")
      .attr("opacity", 0.1)
      .attr("stroke-dasharray", "2 2");

    function output(value) {
      const result = value;
      result.data = getData(result.range);
      if (isDate) {
        result.range = value.range.map((d) => dateScale.invert(d));
      }
      attrs.onBrush(result);
    }

    function getData(range) {
      const dataBars = bars
        .attr("fill", "#535966")
        .filter((d) => {
          return d.key >= range[0] && d.key <= range[1];
        })
        .attr("fill", "#72A3B7")
        .nodes()
        .map((d) => d.__data__)
        .map((d) => d.values)
        .reduce((a, b) => a.concat(b), []);

      return dataBars;
    }

    return this;
  }

  updateData(data) {
    const attrs = this.getChartState();
    return this;
  }

  // Advanced group by func
  group(arr) {
    const that = this;
    const operations = [];
    const initialData = arr;
    const resultObj = {};
    let resultArr;
    let sort = function (a, b) {
      return a.values.length < b.values.length ? 1 : -1;
    };

    // Group by 
    this.group.by = function (groupFuncs) {
      const length = arguments.length;
      for (let j = 0; j < initialData.length; j++) {
        const dataObj = initialData[j];
        const keys = [];
        for (let i = 0; i < length; i++) {
          const key = arguments[i];
          keys.push(key(dataObj, j));
        }
        const strKey = JSON.stringify(keys);
        if (!resultObj[strKey]) {
          resultObj[strKey] = [];
        }
        resultObj[strKey].push(dataObj);
      }
      operations.push("by");
      return that.group;
    };

    // Order by func
    this.group.orderBy = function (func) {
      sort = function (a, b) {
        var a = func(a);
        var b = func(b);
        if (typeof a === "string" || a instanceof String) {
          return a.localeCompare(b);
        }
        return a - b;
      };
      operations.push("orderBy");
      return that.group;
    };

    // Order by descending func
    this.group.orderByDescending = function (func) {
      sort = function (a, b) {
        var a = func(a);
        var b = func(b);
        if (typeof a === "string" || a instanceof String) {
          return a.localeCompare(b);
        }
        return b - a;
      };
      operations.push("orderByDescending");
      return that.group;
    };

    // Custom sort
    this.group.sort = function (v) {
      sort = v;
      operations.push("sort");
      return that.group;
    };

    // Run result
    this.group.run = function () {
      resultArr = Object.keys(resultObj).map((k) => {
        const result = {};
        const keys = JSON.parse(k);
        if (keys.length == 1) {
          result.key = keys[0];
        } else {
          result.keys = keys;
        }
        result.values = resultObj[k];
        return result;
      });

      if (sort) {
        resultArr.sort(sort);
      }
      return resultArr;
    };

    return this.group;
  };
}

 
typeof module!='undefined' && (module.exports = RangeSlider);

