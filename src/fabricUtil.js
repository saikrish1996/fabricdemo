import { fabric } from "fabric";
import {
  blockPrefix,
  shelvePrefix,
  columnPrefix,
  columnStackPrefix,
  blockPadding,
} from "./defaultConfig";
import { isPointInMiddle } from "./util";

class fabricActiveSelection extends fabric.ActiveSelection {
  lockScalingX = true;
  lockScalingY = true;
}

class fabricCanvas extends fabric.Canvas {
  constructor(...args) {
    super(...args);
    this._historyInit();
  }

  /**
   * Override the dispose function for the _historyDispose();
   */
  dispose = (...args) => {
    super.dispose(...args);
    this._historyDispose();
  };

  /**
   * Returns current state of the string of the canvas
   */
  _historyNext = () => {
    return JSON.stringify(this.toDatalessJSON(this.extraProps));
  };

  /**
   * Returns an object with fabricjs event mappings
   */
  _historyEvents = () => {
    return {
      "object:added": this._historySaveAction,
      "object:removed": this._historySaveAction,
      "object:modified": this._historySaveAction,
      "object:skewing": this._historySaveAction,
      "objects:removed": this._historySaveAction,
    };
  };

  /**
   * Initialization of the plugin
   */
  _historyInit = () => {
    this.historyUndo = [];
    this.historyRedo = [];
    this.extraProps = [
      "selectable",
      "padding",
      "lockScalingY",
      "lockMovementX",
      "lockMovementY",
      "name",
    ];
    this.historyNextState = this._historyNext();

    this.on(this._historyEvents());
  };

  /**
   * Remove the custom event listeners
   */
  _historyDispose = () => {
    this.off(this._historyEvents());
  };

  /**
   * It pushes the state of the canvas into history stack
   */
  _historySaveAction = () => {
    if (this.historyProcessing) return;

    const json = this.historyNextState;
    this.historyUndo.push(json);
    this.historyNextState = this._historyNext();
    this.fire("history:append", { json: json });
  };

  /**
   * Undo to latest history.
   * Pop the latest state of the history. Re-render.
   * Also, pushes into redo history.
   */
  undo = (callback) => {
    // The undo process will render the new states of the objects
    // Therefore, object:added and object:modified events will triggered again
    // To ignore those events, we are setting a flag.
    this.historyProcessing = true;

    const history = this.historyUndo.pop();
    if (history) {
      // Push the current state to the redo history
      this.historyRedo.push(this._historyNext());
      this.historyNextState = history;
      this._loadHistory(history, "history:undo", callback);
    } else {
      this.historyProcessing = false;
    }
  };

  /**
   * Redo to latest undo history.
   */
  redo = (callback) => {
    // The undo process will render the new states of the objects
    // Therefore, object:added and object:modified events will triggered again
    // To ignore those events, we are setting a flag.
    this.historyProcessing = true;
    const history = this.historyRedo.pop();
    if (history) {
      // Every redo action is actually a new action to the undo history
      this.historyUndo.push(this._historyNext());
      this.historyNextState = history;
      this._loadHistory(history, "history:redo", callback);
    } else {
      this.historyProcessing = false;
    }
  };

  _loadHistory = (history, event, callback) => {
    var that = this;

    this.loadFromJSON(history, () => {
      that.renderAll();
      that.fire(event);
      that.historyProcessing = false;

      if (callback && typeof callback === "function") callback();
    });
  };

  /**
   * Clear undo and redo history stacks
   */
  clearHistory = () => {
    this.historyUndo = [];
    this.historyRedo = [];
    this.fire("history:clear");
  };

  /**
   * Off the history
   */
  offHistory = () => {
    this.historyProcessing = true;
  };

  /**
   * On the history
   */
  onHistory = () => {
    this.historyProcessing = false;

    this._historySaveAction();
  };

  removeMultiple = (arr) => {
    var objects = this._objects,
      index,
      removedObjects = [];

    for (var i = 0, length = arr.length; i < length; i++) {
      index = objects.indexOf(arr[i]);

      if (index !== -1) {
        objects.splice(index, 1);
        removedObjects.push(arr[i]);
      }
    }

    this.onMultiObjectRemoved(removedObjects);
    this.requestRenderAll();
    return this;
  };

  onMultiObjectRemoved = (removedObjects) => {
    this.fire("objects:removed", { target: removedObjects });
    for (const removedObject of removedObjects) {
      removedObject.fire("removed");
      delete removedObject.canvas;
    }
  };

  getObjectsInBlock = (item, name) => {
    const left = item.left + blockPadding,
      right = left + item.width - 3 * blockPadding;
    const blocks = this.getBlocks();
    let shouldReturn = false;
    for (let blockItem of blocks) {
      if (blockItem.name !== name) {
        const blockItemLeft = blockItem.left + blockPadding,
          blockItemRight = blockItemLeft + blockItem.width - 3 * blockPadding;

        if (
          isPointInMiddle(blockItemLeft, right, left) ||
          isPointInMiddle(blockItemRight, right, left)
        ) {
          shouldReturn = true;
          break;
        }
      }
    }

    if (shouldReturn) {
      alert("Please Make sure you are not going into another block");
      return { shouldReset: true };
    }

    const shleves = this.getShelves(),
      shleveItems = [];

    for (let shleveItem of shleves) {
      if (shleveItem.name !== name) {
        const shleveItemLeft = shleveItem.left + blockPadding,
          shleveItemRight =
            shleveItemLeft + shleveItem.width - 3 * blockPadding;

        if (
          isPointInMiddle(shleveItemLeft, right, left) ||
          isPointInMiddle(shleveItemRight, right, left)
        ) {
          shleveItems.push(shleveItem);
        }
      }
    }

    let startObj = {},
      rightWidth = {},
      leftposition = 0;
    for (let shleveItem of shleveItems) {
      const shleveItemLeft = shleveItem.left + blockPadding;
      if (leftposition === 0) leftposition = shleveItem.left;
      const keyName = shleveItemLeft;
      if (startObj[keyName]) {
        startObj[keyName].push(shleveItem.height);
      } else {
        startObj[keyName] = [shleveItem.height];
        rightWidth[keyName] = shleveItem.width;
      }
    }

    const keyNames = Object.keys(startObj);

    let length = startObj[keyNames[0]].length;
    for (let j = 0; j < keyNames.length; j++) {
      if (length !== startObj[keyNames[j]].length) {
        shouldReturn = true;
        break;
      }
    }

    if (shouldReturn) {
      alert(
        "There are different number of shelves make sure they are same before expanding"
      );
      return { shouldReset: true };
    }
    let conDiff = 0,
      smallDiff = 0,
      largeDiff = 0;
    for (let i = 0; i < startObj[keyNames[0]].length; i++) {
      let arr = [];
      for (let j = 0; j < keyNames.length; j++) {
        if (arr[0]) {
          const diff = arr[0] - startObj[keyNames[j]][i];
          if (diff <= 5) {
            smallDiff++;
          } else if (diff <= 10) {
            conDiff++;
          } else if (diff >= 10) {
            largeDiff++;
          }
        }
        arr.push(startObj[keyNames[j]][i]);
      }
    }
    console.log(smallDiff);
    if (conDiff > 2 || largeDiff > 2) {
      alert("Shelves Have considerable difference in height");
      return { shouldReset: true };
    } else {
      let widthToExpand = 0;
      Object.keys(rightWidth).map(
        (item) => (widthToExpand += rightWidth[item])
      );
      return { shouldReset: false, widthToExpand, leftposition };
    }
  };

  getItemByName = (name) => {
    var object = null,
      objects = this.getObjects();

    for (var i = 0, len = this.size(); i < len; i++) {
      if (objects[i].name && objects[i].name === name) {
        object = objects[i];
        break;
      }
    }

    return object;
  };

  getBlocks = () => {
    var object = [],
      objects = this.getObjects();

    for (var i = 0, len = this.size(); i < len; i++) {
      if (objects[i].name && objects[i].name.indexOf(blockPrefix) >= 0) {
        object.push(objects[i]);
      }
    }

    return object;
  };

  getShelves = () => {
    var object = [],
      objects = this.getObjects();

    for (var i = 0, len = this.size(); i < len; i++) {
      if (objects[i].name && objects[i].name.indexOf(shelvePrefix) >= 0) {
        object.push(objects[i]);
      }
    }

    return object;
  };

  getColumns = () => {
    var object = [],
      objects = this.getObjects();

    for (var i = 0, len = this.size(); i < len; i++) {
      if (objects[i].name && objects[i].name.indexOf(columnPrefix) >= 0) {
        object.push(objects[i]);
      }
    }

    return object;
  };

  getStackedColumns = () => {
    var object = [],
      objects = this.getObjects();

    for (var i = 0, len = this.size(); i < len; i++) {
      if (objects[i].name && objects[i].name.indexOf(columnStackPrefix) >= 0) {
        object.push(objects[i]);
      }
    }

    return object;
  };
}

fabric.Canvas = fabricCanvas;
fabric.ActiveSelection = fabricActiveSelection;

export { fabric };
