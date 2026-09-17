// Writes the recommended cam table out as TwinCAT structured text.
import { readFileSync, writeFileSync } from 'node:fs';
import { toST } from './cam-st.mjs';

const CAM = JSON.parse(readFileSync('cam-table.json', 'utf8'));
for (const key of Object.keys(CAM.variants)) {
  const v = CAM.variants[key];
  const st = toST(v.points, {
    name: '_Camming',
    masterPeriod: CAM.masterPeriod,
    slavePeriod: CAM.slavePeriod,
    errUm: (v.err * 1000).toFixed(1),
    camTableId: 1,
    aStart: 65,
    bStart: 180,
  });
  const file = key === String(CAM.recommended) ? 'Cam_Clothoid.txt' : `Cam_Clothoid_${key}pt.txt`;
  writeFileSync(file, st);
  console.log(`wrote ${file} (${key} points, ${(v.err * 1000).toFixed(1)} um)`);
}
