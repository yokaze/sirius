export default function blockCopy(src, srcOffset, dst, dstOffset) {
  //  src: ------[   ...]-------
  //                 VVV
  //  dst: ---------[...   ]----
  const unionOffset = Math.max(srcOffset, dstOffset);
  const unionEnd = Math.min(src.length + srcOffset, dst.length + dstOffset);
  const unionLength = Math.max(0, unionEnd - unionOffset);
  if (unionLength > 0) {
    const readOffset = unionOffset - srcOffset;
    const readEnd = readOffset + unionLength;
    const unionArray = src.subarray(readOffset, readEnd);
    dst.set(unionArray, unionOffset - dstOffset);
  }
}
