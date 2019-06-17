import assert from 'assert';
import blockCopy from './utils/BlockCopy';
import Segment from './utils/Segment';
import SiriusConstants from './SiriusConstants';
import WeightedSkipList from './utils/WeightedSkipList';

const { maxBlockSize } = SiriusConstants;

export default class SiriusBinary {
  constructor() {
    this._list = new WeightedSkipList();
  }

  setFileHandle(fileHandle) {
    this._list.clear();
    if (fileHandle) {
      this._fileHandle = fileHandle;
      this._setupInitialNode({ file: true, address: 0 }, fileHandle.getSize());
    }
  }

  blockCount() {
    return this._list.length();
  }

  length() {
    return this._list.distance();
  }

  insert(address, block) {
    assert(address >= 0);
    const li = this._list;
    const me = li.makeNode({ file: false, block }, block.length);
    if (address < li.distance()) {
      const { node, distance } = li.nodeForDistance(address);
      if (distance === address) {
        li.insert(li.prev(node), me);
      } else {
        const leftSize = address - distance;
        const rightSize = node.distance - leftSize;
        if (node.file) {
          const right = li.makeNode({ file: true, address: node.address + leftSize }, rightSize);
          li.insert(node, me);
          li.insert(me, right);
        } else {
          const right = li.makeNode({
            file: false,
            block: node.content.block.subarray(leftSize),
          }, rightSize);
          li.insert(node, me);
          li.insert(me, right);
        }
        li.resize(node, leftSize);
        if (node.content.block) {
          node.content.block = node.content.block.subarray(0, leftSize);
        }
      }
    } else if (address === li.distance()) {
      li.push(me);
    } else {
      assert(false);
    }
  }

  overwrite(address, block) {

  }

  remove(address, length) {
    assert((address + length) <= this.length());
    const li = this._list;
    const target = new Segment(address, address + length);

    let { node, distance } = li.nodeForDistance(address);
    while (node && (distance < (address + length))) {
      const intersection = target.intersection(new Segment(distance, distance + node.distance));
      intersection.subtract(distance);

      const nodeDistance = node.distance;
      const left = (intersection.left === 0);
      const right = (intersection.right === node.distance);
      const next = li.next(node);
      if (left && right) {
        li.remove(node);
      } else if (left) {
        if (node.content.block) {
          node.content.block = node.content.block.subarray(intersection.right - distance);
        }
        li.resize(node, node.distance - intersection.right);
      } else if (right) {
        const width = intersection.right - intersection.left;
        if (node.content.block) {
          node.content.block = node.content.block.subarray(0, node.distance - width);
        }
        li.resize(node, node.distance - width);
      } else if (node.content.block) {
        const leftBlock = node.content.block.subarray(0, intersection.left);
        const rightBlock = node.content.block.subarray(intersection.right, node.distance);
        node.content.block = leftBlock;
        li.resize(node, leftBlock.length);
        li.insert(node, li.makeNode({ file: false, block: rightBlock }, rightBlock.length));
      }
      distance += nodeDistance;
      node = next;
    }
  }

  resize(length) {

  }

  read(address, length) {
    assert(address >= 0);
    assert(length >= 0);
    const dataLength = this.length();
    length = Math.max(0, Math.min(length, dataLength - address));

    const ret = new Uint8Array(length);
    if (length > 0) {
      const li = this._list;
      let { node, distance } = li.nodeForDistance(address);
      while ((address + length) > distance) {
        if (node.content.file && (node.distance > maxBlockSize)) {
          const right = li.makeNode({
            file: true,
            address: node.content.address + maxBlockSize,
          }, node.distance - maxBlockSize);
          li.resize(node, maxBlockSize);
          li.insert(node, right);
        }
        this._fillFileBlock(node);
        blockCopy(node.content.block, distance, ret, address);
        distance += node.distance;
        node = li.next(node);
      }
    }
    return ret;
  }

  _setupInitialNode(content, length) {
    const li = this._list;
    const node = li.makeNode(content, length);
    li.push(node);
  }

  _fillFileBlock(node) {
    if (node.content.file && (node.content.block === undefined)) {
      node.content.block = this._fileHandle.getBuffer(node.content.address, node.distance);
    }
  }

  //
  //  diagnostics
  //
  _disableBlockOptimization() {
  }
}
