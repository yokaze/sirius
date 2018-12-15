import assert from 'assert';

class Insert {
  constructor(address, data) {
    assert(address !== undefined);
    assert(data instanceof Uint8Array);
    this.type = Insert.getType();
    this.address = address;
    this.data = data;
  }

  static getType() {
    return 'Insert';
  }
}

class Overwrite {
  constructor(address, data) {
    assert(address !== undefined);
    assert(data instanceof Uint8Array);
    this.type = Overwrite.getType();
    this.address = address;
    this.data = data;
  }

  static getType() {
    return 'Overwrite';
  }
}

class Remove {
  constructor(address, length) {
    assert(address !== undefined);
    this.type = Remove.getType();
    this.address = address;
    this.length = length;
  }

  static getType() {
    return 'Remove';
  }
}

class Cut {
  constructor(address, length) {
    assert(address !== undefined);
    this.type = Cut.getType();
    this.address = address;
    this.length = length;
  }

  static getType() {
    return 'Cut';
  }
}

class Copy {
  constructor(address, length) {
    assert(address !== undefined);
    this.type = Copy.getType();
    this.address = address;
    this.length = length;
  }

  static getType() {
    return 'Copy';
  }
}

class Paste {
  constructor(address) {
    assert(address !== undefined);
    this.type = Paste.getType();
    this.address = address;
  }

  static getType() {
    return 'Paste';
  }
}

class Composite {
  constructor(items) {
    this.type = Composite.getType();
    this.items = items;
  }

  static getType() {
    return 'Composite';
  }
}

export default {
  Insert,
  Overwrite,
  Remove,
  Cut,
  Copy,
  Paste,
  Composite,
};
