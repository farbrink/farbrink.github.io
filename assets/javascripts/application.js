import {
  instateResizeRefresh,
  instateSceneSwitches,
  instateScrollTo,
  instateStickyHeader,
  prepareScene
} from "./main/prepare.js";

window.sceneType     = ['birch', 'cherry', 'willow', 'wisteria'][Math.floor(Math.random() * 4)];
window.treeInstances = []

$(document).ready(function () {
  console.log('Document loaded.')

  instateScrollTo();

  instateSceneSwitches();
  prepareScene(window.sceneType);
});

console.log('Script loaded.')

instateResizeRefresh();
instateStickyHeader();
