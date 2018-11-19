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

export default {
  Insert
}
