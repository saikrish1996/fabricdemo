import logo from "./logo.png";
import { fabric } from "./fabricUtil";
import "./App.css";
import { Component } from "react";
import json from "./data.json";
import {
  blockPrefix,
  shelvePrefix,
  columnPrefix,
  columnStackPrefix,
  blockConfig,
  sheleveConfig,
  columnConfig,
} from "./defaultConfig";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { blockBox, shelves } = this.getBlocks();
    const { shelveBox, columns } = this.getShelves(shelves);
    const columnBox = this.getColumns(columns);

    const me = this;
    fabric.Image.fromURL(logo, function (myImg) {
      var img1 = myImg.set({
        left: 0,
        top: 0,
        width: myImg.width,
        height: myImg.height,
      });

      me.canvas = new fabric.Canvas("canvas", {
        height: img1.height,
        width: img1.width,
      });
      me.canvas.setBackgroundImage(img1, me.canvas.renderAll.bind(me.canvas));

      let i = 0;
      for (let item of blockBox) {
        i++;
        const { y: top, x: left, w: width, h: height } = item;
        let rect = new fabric.Rect({
          top,
          left,
          width,
          height,
          name: blockPrefix + i,
          ...blockConfig,
        });
        me.canvas.add(rect);
      }

      i = 0;
      for (let item of shelveBox) {
        i++;
        const { y: top, x: left, w: width, h: height } = item;
        let rect = new fabric.Rect({
          top,
          left,
          width,
          height,
          name: shelvePrefix + i,
          ...sheleveConfig,
        });
        me.canvas.add(rect);
      }

      i = 0;
      let stackNum = 0;
      for (let item of columnBox) {
        let stackPrefix = "";
        if (item.isStacked) {
          stackNum++;
          stackPrefix = columnStackPrefix + stackNum;
        } else i++;
        const { y: top, x: left, w: width, h: height } = item;
        let rect = new fabric.Rect({
          top,
          left,
          width,
          height,
          name: columnPrefix + i + stackPrefix,
          ...columnConfig,
        });
        me.canvas.add(rect);
      }
      me.canvas.on({
        "object:modified": me.onScaling,
        "object:scaling": me.onScaling,
      });
    });
  }

  onScaling = (options) => {
    // const me = this;
    options.target.setCoords();
    console.log(options.target.getScaledWidth(), options.target.width);
  };

  mergeSelection = () => {};

  getBlocks = () => {
    let blockBox = [],
      shelves = [];
    for (let item of json.data.blocks) {
      blockBox.push(item.blockBoundingBox);
      shelves.push(...item.facings.shelves);
    }
    return { blockBox, shelves };
  };

  getShelves = (shelves) => {
    let shelveBox = [],
      columns = [];

    for (let item of shelves) {
      shelveBox.push(item.shelfBoundingBox);
      columns.push(...item.columns);
    }
    return { shelveBox, columns };
  };

  getColumns = (columns) => {
    let columnBox = [];

    for (let item of columns) {
      let isStacked = false;
      if (item.products.length > 1) isStacked = true;
      for (let chItem of item.products)
        columnBox.push({ ...chItem.productBoundingBox, isStacked });
    }
    return columnBox;
  };

  getJson = () => {
    console.log(
      this.canvas.getBlocks(),
      this.canvas.getShelves(),
      this.canvas.getColumns(),
      this.canvas.getStackedColumns()
    );
  };

  delete = () => {
    for (let item of this.canvas.getActiveObjects()) this.canvas.remove(item);
  };

  render() {
    return (
      <>
        <button onClick={this.getJson}>JSON</button>
        <button onClick={this.delete}>Delete</button>
        <div className="App">
          <canvas id="canvas"></canvas>
        </div>
      </>
    );
  }
}

export default App;
