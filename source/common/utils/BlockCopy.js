import Segment from './Segment';

export default function blockCopy(src, srcOffset, dst, dstOffset) {
  //  src: ------[   ...]-------
  //                 VVV
  //  dst: ---------[...   ]----
  const srcSegment = new Segment(srcOffset, srcOffset + src.length);
  const dstSegment = new Segment(dstOffset, dstOffset + dst.length);
  const intersection = srcSegment.intersection(dstSegment);
  if (intersection && (intersection.left < intersection.right)) {
    const readOffset = intersection.left - srcOffset;
    const readEnd = readOffset + intersection.right - intersection.left;
    const subarray = src.subarray(readOffset, readEnd);
    dst.set(subarray, intersection.left - dstOffset);
  }
}
