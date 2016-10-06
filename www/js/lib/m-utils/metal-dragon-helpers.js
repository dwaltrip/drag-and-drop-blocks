
export function configForDragItem(dragItem) {
  return function(element, isInitialized, context) {
    if (isInitialized) { return; }
    dragItem.attachToElement(element);
    context.onunload = ()=> {
      dragItem.unAttachFromElement();
    }
  };
};

export function configForDropzone(dropzone) {
  return function(element, isInitialized, context) {
    if (isInitialized) { return; }
    dropzone.attachToElement(element);
    context.onunload = ()=> {
      dropzone.unAttachFromElement();
    }
  };
};
