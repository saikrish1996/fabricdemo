import logo from "./logo.png";
import { fabric } from "./fabricUtil";
import "./App.css";
import { Component, createRef } from "react";
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
    this.state = {
      json,
    };
    this.canvas = createRef();
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
        renderOnAddRemove: true,
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
      me.canvas.renderAll();
      me.canvas.calcOffset();
      me.canvas.on({
        "object:scaled": me.onScaling,
      });
    });
  }

  onScaling = ({ target, transform }) => {
    // console.log(options.target.getScaledWidth(), options.target.width);
    if (target.name.indexOf(blockPrefix) >= 0) {
      const { shouldReset, widthToExpand, leftposition } =
        this.canvas.getObjectsInBlock(target.getBoundingRect(), target.name);
      if (widthToExpand) {
        target.set({
          width: widthToExpand,
          left: leftposition,
          scaleX: 1,
          scaleY: 1,
        });
      }
      if (shouldReset) {
        target.set({
          width: target.width,
          left: transform.original.left,
          scaleX: 1,
          scaleY: 1,
        });
      }
    }
    target.setCoords();
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
    const activeObj = this.canvas.getActiveObjects();
    if (activeObj.length === 1) this.canvas.remove(activeObj[0]);
    // for (let item of this.canvas.getActiveObjects()) this.canvas.remove(item);
    else this.canvas.removeMultiple(this.canvas.getActiveObjects());
  };

  render() {
    return (
      <>
        <button onClick={this.getJson}>JSON</button>
        <button onClick={this.delete}>Delete</button>
        <button
          onClick={() => {
            this.canvas.undo();
          }}
        >
          undo
        </button>
        <button
          onClick={() => {
            this.canvas.redo();
          }}
        >
          redo
        </button>
        <div className="App">
          <canvas id="canvas" ref={this.canvas}></canvas>
        </div>
      </>
    );
  }
}

export default App;
