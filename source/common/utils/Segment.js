export default class Segment {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }

  intersection(other) {
    const left = Math.max(this.left, other.left);
    const right = Math.min(this.right, other.right);
    if (left > right) {
      return undefined;
    }
    return new Segment(left, right);
  }

  union(other) {
    const left = Math.min(this.left, other.left);
    const right = Math.max(this.right, other.right);
    return new Segment(left, right);
  }

  add(value) {
    this.left += value;
    this.right += value;
  }

  subtract(value) {
    this.add(-value);
  }
}
