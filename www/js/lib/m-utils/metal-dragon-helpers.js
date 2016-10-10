
function mithrilifyMetalDragon(metalDragon) {
  var _createDragItem = metalDragon.createDragItem;
  var _createDropzone = metalDragon.createDropzone;

  metalDragon.createDragItem = function() {
    return mithrilifyItemOrZone(_createDragItem.apply(metalDragon, arguments));
  };
  metalDragon.createDropzone = function() {
    return mithrilifyItemOrZone(_createDropzone.apply(metalDragon, arguments));
  };

  return metalDragon;
}

function mithrilifyItemOrZone(dragItemOrDropzone) {
  var _attachToElement = dragItemOrDropzone.attachToElement;

  dragItemOrDropzone.attachToElement = function(element, isInitialized, context) {
    if (isInitialized) { return; }

    _attachToElement.call(dragItemOrDropzone, element);
    context.onunload = ()=> dragItemOrDropzone.unattachFromElement();
  };

  return dragItemOrDropzone;
};

export { mithrilifyItemOrZone, mithrilifyMetalDragon };
