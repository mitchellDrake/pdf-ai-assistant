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
      // const pdfStrings = pdfPageText.items.map((item) => item.str);
      // const pdfFullTextNormalized = normalize(pdfStrings.join(' '));
      // const startCharIndex =
      //   pdfFullTextNormalized.indexOf(targetTextNormalized);
      // console.log('startCharIndex', startCharIndex);
      // if (startCharIndex === -1) return [];
      // console.log(pdfPageText);
      // let allLetters = [];

      // for (const block of pdfPageText.items) {
      //   const { str, transform, width, height } = block;
      //   const [a, b, c, d, e, f] = transform;

      //   const avgCharWidth = width / str.length;

      //   for (let i = 0; i < str.length; i++) {
      //     // Compute letter-level coordinates using your math
      //     const x0 = e + i * avgCharWidth; // starting x plus offset for letter
      //     const y0 = f;

      //     const letterFormat = {
      //       page: pageNum,
      //       canvasHeight: viewport.height,
      //       canvasWidth: viewport.width,
      //       char: str[i],
      //       x: x0 * scale,
      //       y: viewport.height - y0 * scale - height * scale, // flip y-axis
      //       width: avgCharWidth * scale,
      //       height: height * scale,
      //     };

      //     allLetters.push(letterFormat);
      //   }
      // }

      // console.log('all letters', allLetters, allLetters.length);

      // const filteredLetters = allLetters.filter((item) => {
      //   // Keep only letters, numbers, and common symbols
      //   return /^[\w\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]$/.test(item.char);
      // });
      // console.log('filteredLetters', filteredLetters, filteredLetters.length);
      // const pdfText = filteredLetters.map((item) => item.char).join('');
      // console.log('pdfText', pdfText);
      // const cleanedSearchString = textToFind.replace(
      //   /[^a-zA-Z0-9!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g,
      //   ''
      // );
      // console.log('cleaned search string', cleanedSearchString);
      // const searchIndexStart = cleanedSearchString.indexOf(cleanedSearchString);
      // console.log('search start', searchIndexStart);

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
          threshold: 0.4, // lower = stricter match
          distance: 40, // max distance for approximate matches
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
      // let counter = 0;
      // const firstBaseline = matchedItems[0].transform[5];
      // console.log('matched items', matchedItems);
      // for (let block of matchedItems) {
      //   if (!block.transform) {
      //     continue;
      //   }
      //   console.log('block height', block.height);
      //   const [a, b, c, d, e, f] = block.transform;
      //   const padding = counter * 0.3;
      //   const heightMultiple = block.height * 0.2;
      //   const x0 = e - 5;
      //   // const y0 = f + heightMultiple;
      //   const y0 =
      //     firstBaseline + (block.transform[5] - firstBaseline) - padding; // relative
      //   const width = block.width;
      //   const height = block.height;

      //   const format = {
      //     page: pageNum,
      //     canvasHeight: viewport.height,
      //     canvasWidth: viewport.width,
      //     x: x0 * scale,
      //     y: viewport.height - y0 * scale - height * scale,
      //     width: width * scale,
      //     height: height * scale,
      //   };
      //   coordinates.push(format);
      //   counter++;
      // }

      // console.log('matched items', matchedItems);
      function getLineHighlightRects(
        matchedItems,
        viewport,
        pageNum,
        scale = 1
      ) {
        const lineBuckets = new Map();
        const tolerance = 1; // px tolerance for baseline grouping
        const coordinates = [];

        // 1. Bucket items into lines by Y
        for (const block of matchedItems) {
          const y0 = block.transform[5];
          let bucketKey = null;

          for (let key of lineBuckets.keys()) {
            if (Math.abs(key - y0) <= tolerance) {
              bucketKey = key;
              break;
            }
          }

          if (bucketKey === null) {
            bucketKey = y0;
            lineBuckets.set(bucketKey, []);
          }

          lineBuckets.get(bucketKey).push(block);
        }

        // 2. Sort buckets top-to-bottom
        const sortedBuckets = [...lineBuckets.entries()].sort(
          (a, b) => b[0] - a[0]
        );

        let prevSpacing = null;
        const lineSpacings = [];

        // 3. Compute rect per line bucket
        sortedBuckets.forEach(([baseline, blocks], idx) => {
          // If this is a "paragraph break" placeholder, skip
          if (blocks.every((b) => b.str.trim().length === 0)) return;

          const minX = Math.min(...blocks.map((b) => b.transform[4]));
          const maxX = Math.max(...blocks.map((b) => b.transform[4] + b.width));
          const maxHeight = Math.max(...blocks.map((b) => b.height));

          const y0 = baseline;

          let rectHeight;

          // Next bucket’s baseline (if exists)
          if (idx < sortedBuckets.length - 1) {
            const [nextBaseline, nextBlocks] = sortedBuckets[idx + 1];

            if (nextBlocks.every((b) => b.str.trim().length === 0)) {
              // Paragraph/page break
              rectHeight =
                prevSpacing ??
                (lineSpacings.length > 0
                  ? lineSpacings.reduce((a, b) => a + b, 0) /
                    lineSpacings.length
                  : maxHeight);
            } else {
              // Normal line spacing
              rectHeight = y0 - nextBaseline;
              rectHeight = Math.max(rectHeight, maxHeight); // enforce min height
              lineSpacings.push(rectHeight);
              prevSpacing = rectHeight;
            }
          } else {
            // Last line
            rectHeight =
              prevSpacing ??
              (lineSpacings.length > 0
                ? lineSpacings.reduce((a, b) => a + b, 0) / lineSpacings.length
                : maxHeight);
          }

          const rect = {
            page: pageNum,
            x: minX * scale - 4,
            y: viewport.height - y0 * scale - rectHeight * scale,
            width: (maxX - minX) * scale,
            height: rectHeight * scale,
          };

          coordinates.push(rect);
        });

        return coordinates;
      }
      const finalCoordinates = getLineHighlightRects(
        matchedItems,
        viewport,
        pageNum,
        scale
      );

      // console.log('coordinates', finalCoordinates);
      return finalCoordinates;
    } catch (error) {
      console.log(error);
      return [];
    }
  },
};
