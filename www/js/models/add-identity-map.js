
var Cache = {
  create: function() {
    var instance = Object.create(this.instance);
    instance.cache = {};
    return instance;
  },

  instance: {
    cache: null,

    get:        function(key)        { return this.cache[key]; },
    contains:   function(key)        { return key in this.cache; },
    add:        function(key, value) { this.cache[key] = value; }
  }
};


export default function addIdentityMap(Model) {
  var cache = Model._cache = Cache.create();

  var createFn = Model.create;
  if (!createFn) {
    throw new Error("addIdentityMap expects Model to have the method 'create'");
  }

  Model.create = function createWithIdentityMap(data) {
    if (data.uid && cache.contains(data.uid)) {
      return cache.get(data.uid);
    }
    var record = createFn.call(this, data);
    if (!record.isNew()) {
      cache.add(record.uid(), record);
    }
    return record;
  };

  var instanceSaveFn = Model.instance.save;
  if (!instanceSaveFn) {
    throw new Error("addIdentityMap expects Model.instance to have the method 'save'");
  }

  Model.instance.save = function saveWithIdentityMap() {
    var isNotInCache = this.isNew();
    var returnVal = instanceSaveFn.apply(this, arguments);
    if (isNotInCache) {
      cache.add(this.uid(), this);
    }
    return returnVal;
  }

  return Model;
};
