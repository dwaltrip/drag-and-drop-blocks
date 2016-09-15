/*
source: http://aaditmshah.github.io/why-prototypal-inheritance-matters/#toc_11
*/

export default function(base) {
  var obj = Object.create(base);
  var extensions = Array.prototype.slice.call(arguments, 1);

  extensions.forEach(function(extension) {
    for(var attr in extension) {
      if (Object.hasOwnProperty.call(extension, attr) || typeof obj[attr] === 'undefined') {
        obj[attr] = extension[attr];
      }
    }
  });

  return obj;
};
