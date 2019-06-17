/* eslint-env mocha */
import { expect } from 'chai';
import Segment from '../common/utils/Segment';

describe('Segment', () => {
  it('intersection', () => {
    const a = new Segment(2, 8);
    const b = new Segment(4, 9);
    const i = a.intersection(b);
    expect(i.left).to.equal(4);
    expect(i.right).to.equal(8);
  });
  it('union', () => {
    const a = new Segment(2, 8);
    const b = new Segment(4, 9);
    const u = a.union(b);
    expect(u.left).to.equal(2);
    expect(u.right).to.equal(9);
  });
});
