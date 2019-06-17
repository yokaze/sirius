//
//        3: [ ]-----[ ]--------- NIL
//        2: [ ]-----[ ]-----[ ]- NIL
//        1: [ ]-----[ ]-[ ]-[ ]- NIL
//  Level 0: [ ]-[ ]-[ ]-[ ]-[ ]- NIL
//           [#] [#] [#] [#] [#]
//            |
//            + content   (object)
//            + distance  (number)
//            + links     (array)
//
import assert from 'assert';

export default class WeightedSkiplist {
  constructor() {
    this.clear();
  }

  //
  //  Global Operations
  //
  clear() {
    this._front = undefined;
  }

  length() {
    let ret = 0;
    if (this._front) {
      const level = this.height() - 1;
      let node = this._front;
      while (node !== undefined) {
        ret += node._links[level].step;
        node = node._links[level].next;
      }
    }
    return ret;
  }

  distance() {
    let ret = 0;
    if (this._front) {
      let node = this._front;
      const level = node._links.length - 1;
      while (node !== undefined) {
        ret += node._links[level].distance;
        node = node._links[level].next;
      }
    }
    return ret;
  }

  height() {
    if (this._front) {
      return this._front._links.length;
    }
    return 0;
  }

  front() {
    return this._front;
  }

  back() {
    let node = this._front;
    if (node) {
      let level = node._links.length - 1;
      while (level >= 0) {
        while (node._links[level].next) {
          node = node._links[level].next;
        }
        level -= 1;
      }
    }
    return node;
  }

  //
  //  Find
  //
  nodeForIndex(index) {
    if ((index < 0) || (index >= this.length())) {
      return undefined;
    }
    let node = this._front;
    let dist = 0;
    let nodeIndex = 0;
    let level = node._links.length - 1;
    while (nodeIndex < index) {
      while ((nodeIndex + node._links[level].step) > index) {
        level -= 1;
      }
      nodeIndex += node._links[level].step;
      dist += node._links[level].distance;
      node = node._links[level].next;
    }
    return { node, distance: dist };
  }

  nodeForDistance(distance) {
    if ((distance < 0) || (distance >= this.distance())) {
      return undefined;
    }
    let node = this._front;
    let dist = 0;
    let level = node._links.length - 1;
    while ((node.distance + dist) <= distance) {
      while ((dist + node._links[level].distance) > distance) {
        level -= 1;
      }
      dist += node._links[level].distance;
      node = node._links[level].next;
    }
    return { node, distance: dist };
  }

  prev(node) {
    if (node._links) {
      return node._links[0].prev;
    }
    return undefined;
  }

  next(node) {
    if (node._links) {
      return node._links[0].next;
    }
    return undefined;
  }

  //
  //  Edit
  //
  insert(prev, node) {
    assert(node !== undefined);
    assert(node._links === undefined);
    if (this._front === undefined) {
      assert(prev === undefined);
      this._setupInitialNode(node);
    } else if (prev === undefined) {
      this._insertFront(node);
    } else {
      const path = this._traverse(prev);
      this._addLink(path, node);
      this._setNodeHeight(node, this._sampleNodeHeight());
    }
  }

  remove(node) {
    assert(node);
    if (node === this._front) {
      const next = this.next(node);
      if (next) {
        this._setNodeHeight(next, this.height());
      }
      this._front = next;
    } else {
      const height = node._links.length;
      for (let i = 0; i < height; i += 1) {
        this._removeLink(node);
      }
    }
  }

  push(node) {
    if (this._front === undefined) {
      this.insert(undefined, node);
    } else {
      this.insert(this.back(), node);
    }
  }

  resize(node, distance) {
    const path = this._traverse(node);
    const diff = distance - node.distance;
    for (let i = 0; i < path.length; i += 1) {
      path[i].node._links[i].distance += diff;
    }
    node.distance = distance;
  }

  //
  //  Helper Functions
  //
  makeNode(content, distance) {
    assert(distance >= 0);
    return { content, distance };
  }

  //
  //  private
  //
  _setupInitialNode(node) {
    node._links = [{
      step: 1,
      distance: node.distance,
      prev: undefined,
      next: undefined,
    }];
    this._front = node;
  }

  _insertFront(node) {
    node._links = [];
    for (let i = 0; i < this.height(); i += 1) {
      node._links.push({
        step: 1,
        distance: node.distance,
        prev: undefined,
        next: this._front,
      });
      this._front._links[i].prev = node;
    }
    this._front = node;

    //  front node may be higher than others
    const height = this._sampleNodeHeight();
    if (height > this.height()) {
      node._links.push({
        step: this.length(),
        distance: this.distance(),
        prev: undefined,
        next: undefined,
      });
    }

    //  resample second node height
    const secondHeight = Math.min(this.height(), this._sampleNodeHeight());
    this._setNodeHeight(this.next(this._front), secondHeight);
  }

  _setHeight(height) {
    const front = this._front;
    assert(front);
    const step = this.length();
    const distance = this.distance();
    while (front._links.length < height) {
      front._links.push({
        step,
        distance,
        prev: undefined,
        next: undefined,
      });
    }
  }

  _setNodeHeight(node, height) {
    assert(node);
    assert(height > 0);
    if (height > this.height()) {
      this._setHeight(height);
    }
    const path = this._traverse(node);
    while (node._links.length < height) {
      this._addLink(path, node);
    }
    while (node._links.length > height) {
      this._removeLink(node);
    }
  }

  _addLink(path, node) {
    if (node._links === undefined) {
      const prev = path[0].node;
      const { next } = prev._links[0];
      node._links = [{
        step: 1,
        distance: node.distance,
        prev,
        next,
      }];
      prev._links[0].next = node;
      if (next) {
        next._links[0].prev = node;
      }
      for (let i = 1; i < path.length; i += 1) {
        path[i].node._links[i].distance += node.distance;
        path[i].node._links[i].step += 1;
      }
    } else {
      const level = node._links.length;
      const prev = path[level].node;
      const { next } = prev._links[level];
      const stepLR = prev._links[level].step;
      const distanceLR = prev._links[level].distance;
      prev._links[level].step = path[level].step;
      prev._links[level].distance = path[level].distance;
      node._links.push({
        step: stepLR - prev._links[level].step,
        distance: distanceLR - prev._links[level].distance,
        prev,
        next,
      });
      prev._links[level].next = node;
      if (next) {
        next._links[level].prev = node;
      }
    }
  }

  _removeLink(node) {
    assert(node !== this._front);
    const level = node._links.length - 1;
    const { prev, next } = node._links[level];
    prev._links[level].distance += node._links[level].distance;
    prev._links[level].step += node._links[level].step;
    prev._links[level].next = next;
    if (next) {
      next._links[level].prev = prev;
    }
    node._links.pop();

    if (level === 0) {
      const path = this._traverse(prev);
      for (let i = 0; i < path.length; i += 1) {
        path[i].node._links[i].distance -= node.distance;
        path[i].node._links[i].step -= 1;
      }
      delete node._links;
    }
  }

  _traverse(node) {
    //  [x]<--------->  [ step, distance ]
    //  [ ]-----[x]<->  [ step, distance ]
    //  [ ]-[ ]-[ ]-[x] [ 0, 0 ]
    //  [ ]-[ ]-[ ]-[x] [ 0, 0 ]
    //              node
    assert(node);
    let level = 0;
    let step = 0;
    let distance = 0;
    const ret = [];
    while (level < this.height()) {
      while (node._links.length <= level) {
        node = node._links[level - 1].prev;
        step += node._links[level - 1].step;
        distance += node._links[level - 1].distance;
      }
      ret.push({ node, step, distance });
      level += 1;
    }
    return ret;
  }

  _sampleNodeHeight() {
    const maxHeight = this.height() + 1;
    return Math.min(maxHeight, Math.floor(1 + -Math.log2(Math.random())));
  }

  //
  //  diagnostics
  //
  _averageHeight() {
    if (this._front) {
      let total = 0;
      let node = this._front;
      while (node) {
        total += node._links.length;
        node = node._links[0].next;
      }
      return total / this.length();
    }
    return 0;
  }

  _validate() {
    if (this._front) {
      const step = this.length();
      const distance = this.distance();
      for (let i = 0; i < this.height(); i += 1) {
        let node = this._front;
        let s = 0;
        let d = 0;
        while (node) {
          const { next } = node._links[i];
          if (next) {
            assert(next._links[i].prev === node);
          }
          s += node._links[i].step;
          d += node._links[i].distance;
          node = next;
        }
        assert(step === s);
        assert(distance === d);
      }
    }
  }
}
