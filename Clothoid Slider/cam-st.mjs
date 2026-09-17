// Formats a fitted cam table as TwinCAT structured text in the project's house
// style: `_Camming` instance, MasterPos/SlavePos first, and every `:=` aligned to
// one tab stop with hard tabs.
//
// FunctionType on a point describes the segment that STARTS at that point, and a
// point's SlaveVelo / SlaveAcc serve as the end condition of the incoming segment
// and the start condition of the outgoing one. The POLYNOM1 segments ignore them;
// the POLYNOM5_MM segments need them.

const FUNC = {
  Polynomial1: 'MOTIONFUNCTYPE_POLYNOM1',
  Polynomial5_MM: 'MOTIONFUNCTYPE_POLYNOM5_MM',
};

const TAB = 4;    // editor tab width the alignment is built for
const COL = 56;   // column every ":=" starts at

/** One assignment line: hard-tab indent, then tabs out to the := column. */
function asg(indent, lvalue, rvalue) {
  const lead = '\t'.repeat(indent);
  let col = indent * TAB + lvalue.length;
  let pad;
  if (col >= COL) pad = ' ';
  else if (COL - col === 1) pad = ' ';         // a tab here would look identical
  else {
    pad = '';
    while (col < COL) { pad += '\t'; col = Math.floor(col / TAB) * TAB + TAB; }
  }
  return `${lead}${lvalue}${pad}:= ${rvalue};`;
}

const num = (v, d) => (Object.is(v, -0) ? 0 : v).toFixed(d);

export function toST(points, opts = {}) {
  const name = opts.name || '_Camming';
  const id = opts.camTableId ?? 1;
  const n = points.length;
  const fld = f => `${name}.camPoints[point].${f}`;

  const head = [
    `\t// Clothoid oval cam, ${n} points, generated from cam-table.json.`,
    `\t// Master = position along the orange (outer, 99 mm offset) path.`,
    `\t// Slave  = position along the blue (track centreline) path.`,
    `\t// Periodic: ${num(opts.masterPeriod, 4)} mm of master -> ${num(opts.slavePeriod, 4)} mm of slave,`,
    `\t// which is half a lap. Run it twice for a full lap.`,
    `\t// Worst deviation from the exact clothoid: ${opts.errUm} um.`,
    `\t// Master zero is where the left curve meets the bottom straight.`,
    `\t// Carrier A enters at master ${opts.aStart ?? 65} mm, carrier B at ${opts.bStart ?? 180} mm.`,
  ];

  const body = points.map((p, i) => [
    asg(1, 'point', i + 1),
    asg(3, fld('MasterPos'), num(p.x, 4)),
    asg(3, fld('SlavePos'), num(p.y, 4)),
    asg(3, fld('PointIndex'), 'point'),
    asg(3, fld('FunctionType'), `MC_MotionFunctionType.${FUNC[p.seg]}`),
    asg(3, fld('PointType'), `MC_MotionPointType.MOTIONPOINTTYPE_${i === 0 ? 'ACTIVATION' : 'MOTION'}`),
    asg(3, fld('RelIndexNextPoint'), i === n - 1 ? 0 : 1),
    asg(3, fld('SlaveVelo'), num(p.v, 7)),
    asg(3, fld('SlaveAcc'), num(p.a, 9)),
    asg(3, fld('SlaveJerk'), '0.00'),
  ].join('\n')).join('\n\n');

  const ref = f => `${name}.camRef.${f}`;
  const tail = [
    asg(1, ref('NoOfColumns'), 1),
    asg(1, ref('NoOfRows'), 'point'),
    asg(1, ref('TableType'), 'MC_TableType.MC_TABLETYPE_MOTIONFUNCTION'),
    asg(1, ref('ArraySize'), `SIZEOF(${name}.camPoints)`),
    asg(1, ref('pArray'), `ADR(${name}.camPoints)`),
    '',
    `\t${name}.camTableSelect(\tCamTable\t\t:= ${name}.camRef,`,
    `\t\t\t\t\t\t\t\tExecute\t\t\t:= TRUE,`,
    `\t\t\t\t\t\t\t\tPeriodic\t\t:= TRUE,`,
    `\t\t\t\t\t\t\t\tCamTableID\t\t:= ${id} );`,
    '',
    `\tIF ${name}.camTableSelect.Done THEN`,
    `\t\tTrace.Info(__POUNAME() ,'Cam Table Clothoid Built - ID ${id}');`,
    `\t\t${name}.camTableSelect(\tCamTable\t\t:= ${name}.camRef,`,
    `\t\t\t\t\t\t\t\t\tExecute\t\t\t:= FALSE);`,
    `\t\tGenCamClothoid := TRUE;`,
    `\tEND_IF`,
  ];

  return [...head, '', body, '', ...tail, ''].join('\n');
}
