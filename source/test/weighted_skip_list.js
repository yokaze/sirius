/* eslint-env mocha */
import { expect } from 'chai';
import WeightedSkipList from '../common/utils/WeightedSkipList';

describe('WeightedSkipList', () => {
  it('constructor', () => {
    const li = new WeightedSkipList();
    expect(li.length()).to.equal(0);
    expect(li.distance()).to.equal(0);
    expect(li.nodeForIndex(0)).to.equal(undefined);
  });
  it('insert one', () => {
    const li = new WeightedSkipList();
    const x = li.makeNode(undefined, 10);
    li.insert(undefined, x);
    expect(li.length()).to.equal(1);
    expect(li.distance()).to.equal(10);
    expect(li.front() === x).to.equal(true);
    expect(li.back() === x).to.equal(true);
    expect(li.nodeForIndex(0).node._links[0].step).to.equal(1);
    expect(li.nodeForIndex(0).node._links[0].distance).to.equal(10);
  });
  it('insert two', () => {
    for (let i = 0; i < 100; i += 1) {
      const li = new WeightedSkipList();
      const x = li.makeNode(undefined, 10);
      const y = li.makeNode(undefined, 20);
      li.insert(undefined, x);
      li.insert(x, y);
      expect(li.length()).to.equal(2);
      expect(li.distance()).to.equal(30);
      expect(li.front() === x).to.equal(true);
      expect(li.back() === y).to.equal(true);
      li._validate();
    }
  });
  it('insert three', () => {
    for (let i = 0; i < 100; i += 1) {
      const li = new WeightedSkipList();
      const x = li.makeNode(undefined, 10);
      const y = li.makeNode(undefined, 20);
      const z = li.makeNode(undefined, 30);
      li.insert(undefined, x);
      li.insert(x, y);
      li.insert(y, z);
      expect(li.length()).to.equal(3);
      expect(li.distance()).to.equal(60);
      expect(li.front() === x).to.equal(true);
      expect(li.back() === z).to.equal(true);
      for (let j = 0; j < z._links.length; j += 1) {
        expect(z._links[j].distance).to.equal(30);
      }
      li._validate();
    }
  });
  it('insert ten', () => {
    for (let i = 0; i < 50; i += 1) {
      const li = new WeightedSkipList();
      for (let j = 0; j < 10; j += 1) {
        li.push(li.makeNode(undefined, (j + 1) * 10));
      }
      expect(li.length()).to.equal(10);
      expect(li.distance()).to.equal(550);
      li._validate();
    }
  });
  it('insert randomly', () => {
    for (let i = 0; i < 20; i += 1) {
      const li = new WeightedSkipList();
      li.push(li.makeNode(undefined, 1));
      for (let j = 1; j < 10; j += 1) {
        const index = Math.floor(Math.random() * j);
        li.insert(li.nodeForIndex(index).node, li.makeNode(undefined, j));
      }
      expect(li.length()).to.equal(10);
      expect(li.distance()).to.equal(46);
      li._validate();
    }
  });
  it('insert and clear', () => {
    const li = new WeightedSkipList();
    li.insert(undefined, li.makeNode(undefined, 10));
    li.clear();
    expect(li.length()).to.equal(0);
    expect(li.distance()).to.equal(0);
  });
  it('insert front', () => {
    const li = new WeightedSkipList();
    li.insert(undefined, li.makeNode(undefined, 10));
    li.insert(undefined, li.makeNode(undefined, 10));
    li.insert(undefined, li.makeNode(undefined, 10));
    li._validate();
    expect(li.length()).to.equal(3);
    expect(li.distance()).to.equal(30);
  });
  it('insert front burst', () => {
    for (let j = 0; j < 20; j += 1) {
      const li = new WeightedSkipList();
      for (let i = 0; i < 20; i += 1) {
        li.insert(undefined, li.makeNode(undefined, (i + 1) * 10));
      }
      expect(li._averageHeight()).to.not.equal(1);
      li._validate();
    }
  });
  it('content', () => {
    const li = new WeightedSkipList();
    li.push(li.makeNode(11, 10));
    li.push(li.makeNode(22, 10));
    expect(li.nodeForIndex(0).node.content).to.equal(11);
    expect(li.nodeForIndex(1).node.content).to.equal(22);
  });
  it('index', () => {
    const li = new WeightedSkipList();
    li.push(li.makeNode(11, 10));
    li.push(li.makeNode(22, 10));
    expect(li.nodeForIndex(0).node.content).to.equal(11);
    expect(li.nodeForIndex(1).node.content).to.equal(22);
    expect(li.nodeForIndex(2)).to.equal(undefined);
    expect(li.nodeForIndex(3)).to.equal(undefined);
  });
  it('distance', () => {
    const li = new WeightedSkipList();
    li.push(li.makeNode(11, 10));
    li.push(li.makeNode(22, 10));
    expect(li.nodeForDistance(0).node.content).to.equal(11);
    expect(li.nodeForDistance(5).node.content).to.equal(11);
    expect(li.nodeForDistance(9).node.content).to.equal(11);
    expect(li.nodeForDistance(10).node.content).to.equal(22);
    expect(li.nodeForDistance(15).node.content).to.equal(22);
    expect(li.nodeForDistance(0).distance).to.equal(0);
    expect(li.nodeForDistance(15).distance).to.equal(10);
  });
  it('resize', () => {
    const li = new WeightedSkipList();
    const a = li.makeNode(undefined, 10);
    const b = li.makeNode(undefined, 20);
    const c = li.makeNode(undefined, 30);
    const d = li.makeNode(undefined, 40);
    li.push(a);
    li.push(b);
    li.push(c);
    li.push(d);
    li.resize(a, 2);
    expect(li.distance()).to.equal(92);
    expect(a.distance).to.equal(2);
    li.resize(b, 4);
    expect(li.distance()).to.equal(76);
    expect(b.distance).to.equal(4);
    li.resize(c, 6);
    expect(li.distance()).to.equal(52);
    expect(c.distance).to.equal(6);
    li.resize(d, 8);
    expect(li.distance()).to.equal(20);
    expect(d.distance).to.equal(8);
    li._validate();
  });
  it('remove one', () => {
    const li = new WeightedSkipList();
    const a = li.makeNode(undefined, 10);
    li.push(a);
    li.remove(a);
    li._validate();
  });
  it('remove front', () => {
    const li = new WeightedSkipList();
    const a = li.makeNode(undefined, 10);
    const b = li.makeNode(undefined, 20);
    li.push(a);
    li.push(b);
    li.remove(a);
    li._validate();
  });
  it('remove middle', () => {
    for (let i = 0; i < 100; i += 1) {
      const li = new WeightedSkipList();
      const b = li.makeNode(22, 20);
      li.push(li.makeNode(11, 10));
      li.push(b);
      li.push(li.makeNode(33, 30));
      li.push(li.makeNode(44, 40));
      li.remove(b);
      expect(li.length()).to.equal(3);
      expect(li.distance()).to.equal(80);
      expect(li.nodeForIndex(0).node.content).to.equal(11);
      expect(li.nodeForIndex(1).node.content).to.equal(33);
      expect(li.nodeForIndex(2).node.content).to.equal(44);
      expect(li.prev(b)).to.equal(undefined);
      expect(li.next(b)).to.equal(undefined);
      li._validate();
    }
  });
});
