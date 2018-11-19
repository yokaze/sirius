class Insert {
  constructor(address, data) {
    this.type = Insert.getType();
    this.address = address;
    this.data = data;
  }

  static getType() {
    return 'Insert';
  }
}

class Remove {
  constructor(address, length) {
    this.type = Remove.getType();
    this.address = address;
    this.length = length;
  }

  static getType() {
    return 'Remove';
  }
}

export default {
  Insert,
  Remove,
};
