import { fabric } from "fabric";
import {
  blockPrefix,
  shelvePrefix,
  columnPrefix,
  columnStackPrefix,
} from "./defaultConfig";

class fabricActiveSelection extends fabric.ActiveSelection {
  lockScalingX = true;
  lockScalingY = true;
}

class fabricCanvas extends fabric.Canvas {
  getObjectsInBlock({ x, h, y, w }) {
    // let blockObjects = [],
    //   objects = this.getObjects();
    // for (var i = 0, len = this.size(); i < len; i++) {
    //   if (objects[i]) {
    //     object = objects[i];
    //     break;
    //   }
    // }
  }

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
