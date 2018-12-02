import assert from 'assert';

class Insert {
  constructor(address, data) {
    assert(address !== undefined);
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
  Composite,
};
