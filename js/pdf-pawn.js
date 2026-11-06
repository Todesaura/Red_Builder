import { PORTRAITS } from './portrait-catalog.js?v=shopping1';

const mm = value => value * 72 / 25.4;
const bodyHeight = mm(40);
const bodyWidth = mm(22);
const tabHeight = mm(4);
const tabWidth = mm(18);

export function usesGalleryPawn(character) {
  return Boolean(character.portrait && PORTRAITS.some(entry => entry.id === character.portraitSource));
}

export function standardPawnPortrait(role, gender) {
  const variant = gender === 'W' ? 'W' : 'M';
  return PORTRAITS.find(entry => entry.role === role && entry.gender === variant && entry.number === 1);
}

export function drawPawn(page, image, name, {
  font, rgb, degrees, wrap, pushGraphicsState, popGraphicsState, rectangle, clip, endPath
}) {
  const ink = rgb(0.11, 0.12, 0.15), guide = rgb(0.38, 0.40, 0.43);
  const right = page.getWidth() - mm(5), left = right - bodyWidth;
  const center = right - bodyWidth / 2;
  const tabLeft = center - tabWidth / 2, tabRight = center + tabWidth / 2;
  const bottom = mm(5) + tabHeight, fold = bottom + bodyHeight, top = fold + bodyHeight;
  const line = ([x1,y1], [x2,y2], color=ink, dashArray) => page.drawLine({
    start:{x:x1,y:y1}, end:{x:x2,y:y2}, thickness:0.6, color, dashArray
  });
  const label = (value, y, size) => page.drawText(value, {
    x:center-font.widthOfTextAtSize(value,size)/2, y, size, font, color:ink
  });

  label('PAPIERFIGUR', top + mm(9), 11);

  const nameSize = 8, nameMaxWidth = bodyWidth - mm(2);
  const wrapped = wrap(name.replace(/\s+/g, ' '), font, nameSize, nameMaxWidth);
  const caption = wrapped.slice(0, 2);
  if (wrapped.length > caption.length) {
    const last = Array.from(caption[1]);
    while (font.widthOfTextAtSize(last.join('') + '…', nameSize) > nameMaxWidth) last.pop();
    caption[1] = last.join('').trimEnd() + '…';
  }
  caption.forEach((value, index) => {
    const offset = mm(1.2 + 3 * (caption.length - 1 - index));
    label(value, bottom + offset, nameSize);
    page.drawText(value, {
      x:center+font.widthOfTextAtSize(value,nameSize)/2,
      y:top-offset, size:nameSize, font, color:ink, rotate:degrees(180)
    });
  });
  if (image) {
    const inset = mm(0.6);
    const areaWidth = bodyWidth - 2 * inset;
    const areaBottom = bottom + mm(caption.length === 2 ? 7.5 : 4.5);
    const areaHeight = fold - inset - areaBottom;
    const factor = Math.max(areaWidth/image.width, areaHeight/image.height);
    const width = image.width * factor, height = image.height * factor;
    const y = areaBottom + (areaHeight - height) / 2;
    page.pushOperators(
      pushGraphicsState(),
      rectangle(left+inset,areaBottom,areaWidth,areaHeight),
      rectangle(left+inset,fold+inset,areaWidth,areaHeight),
      clip(), endPath()
    );
    page.drawImage(image, { x:center-width/2, y, width, height });
    page.drawImage(image, { x:center+width/2, y:2*fold-y, width, height, rotate:degrees(180) });
    page.pushOperators(popGraphicsState());
  }
  const outline = [
    [left,bottom], [tabLeft,bottom], [tabLeft,bottom-tabHeight], [tabRight,bottom-tabHeight],
    [tabRight,bottom], [right,bottom], [right,top], [tabRight,top], [tabRight,top+tabHeight],
    [tabLeft,top+tabHeight], [tabLeft,top], [left,top], [left,bottom]
  ];
  outline.slice(1).forEach((point, index) => line(outline[index], point));
  line([left,fold], [right,fold], ink, [3,2]);
  for (const [edge, direction] of [[bottom,-1],[top,1]]) {
    line([tabLeft,edge+direction*mm(2)], [tabRight,edge+direction*mm(2)], guide, [1,1]);
    for (const x of [center-mm(6),center+mm(6)]) line([x,edge], [x,edge+direction*tabHeight], guide, [1,1]);
  }
}
