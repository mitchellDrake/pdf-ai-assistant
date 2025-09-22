const Fuse = require('fuse.js');

module.exports = {
  matchText: function matchText(
    textToFind,
    pdfPageText,
    pageNum,
    viewport,
    scale
  ) {
    try {
      const normalize = (str) => str.replace(/\s+/g, ' ').trim();

      let targetTextNormalized = normalize(textToFind);
      const pdfStrings = pdfPageText.items.map((item) => item.str);
      const pdfFullTextNormalized = normalize(pdfStrings.join(' '));
      const startCharIndex =
        pdfFullTextNormalized.indexOf(targetTextNormalized);
      if (startCharIndex === -1) return [];

      let matchedItems = [];

      //   // window search

      //   console.log('search', targetTextNormalized);
      //   console.log('run window search');

      //   const targetText = textToFind.replace(/\s+/g, '');

      //   for (let i = 0; i < pdfStrings.length; i++) {
      //     let j = i;
      //     let windowStr = '';

      //     while (j < pdfStrings.length && windowStr.length < targetText.length) {
      //       windowStr += pdfStrings[j].replace(/\s+/g, '');
      //       j++;
      //     }

      //     if (windowStr.includes(targetText)) {
      //       matchedItems = pdfPageText.items.slice(i, j);
      //       break;
      //     }
      //   }

      //   // filter out anything in window that didnt really meet spec
      //   let matchedTemp = [];
      //   for (const match in matchedItems) {
      //     const compressedText = matchedItems[match].str.replace(/\s+/g, '');
      //     console.log(matchedItems[match]);
      //     if (
      //       compressedText.length === 0 ||
      //       textToFind.indexOf(matchedItems[match].str) === -1
      //     )
      //       continue;
      //     matchedTemp.push(matchedItems[match]);
      //   }
      //   matchedItems = matchedTemp;
      //   // end window search

      //   // console.log('match', matchedItems);
      //   console.log('matched items after window', matchedItems);

      //   if (matchedItems.length === 0) {
      //     console.log('run compressed search');

      //     // compressed search
      //     let searchString = targetTextNormalized.replace(/\s+/g, '');
      //     for (const item of pdfPageText.items) {
      //       const normalizedString = item.str.replace(/\s+/g, '');
      //       const searchIndex = searchString.indexOf(normalizedString);
      //       if (normalizedString.length === 0) continue;

      //       // console.log('raw normalized string', normalizedString);
      //       // console.log('Search text', searchString);
      //       // console.log(searchIndex);
      //       if (searchIndex === 0) {
      //         //   console.log('matched text', normalizedString);
      //         searchString =
      //           searchString.slice(0, searchIndex) +
      //           searchString.slice(searchIndex + normalizedString.length);
      //         matchedItems.push(item);
      //       }
      //       if (searchString.length === 0) return;
      //     }
      //     // end compressed search
      //   }
      //   console.log('matched items after compressed', matchedItems);

      if (matchedItems.length === 0) {
        const pdfItems = pdfPageText.items.map((item, index) => ({
          id: index,
          text: item.str.trim(),
          original: item,
        }));
        // 2. Configure Fuse.js
        const fuse = new Fuse(pdfItems, {
          keys: ['text'],
          includeScore: true,
          threshold: 0.2, // lower = stricter match
          distance: 30, // max distance for approximate matches
          ignoreLocation: true,
        });
        const result = fuse.search(targetTextNormalized);
        if (result.length !== 0) {
          const refIndices = result.map((r) => r.refIndex);
          const minIndex = Math.min(...refIndices);
          const maxIndex = Math.max(...refIndices);
          matchedItems = pdfPageText.items.slice(minIndex, maxIndex + 1) || [];
        }
      }
      const coordinates = [];

      if (matchedItems.length === 0) return coordinates;

      for (let block of matchedItems) {
        if (!block.transform) {
          continue;
        }
        const [a, b, c, d, e, f] = block.transform;

        const x0 = e;
        const y0 = f;
        const width = block.width;
        const height = block.height;
        const format = {
          page: pageNum,
          canvasHeight: viewport.height,
          canvasWidth: viewport.width,
          x: x0 * scale,
          y: viewport.height - y0 * scale - height * scale,
          width: width * scale,
          height: height * scale,
        };
        coordinates.push(format);
      }

      return coordinates;
    } catch (error) {
      console.log(error);
      return [];
    }
  },
};
