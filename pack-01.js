/******************************************************************
  Polaroid™ Pogo™ ZINK™ paper printer battery pack adapter/housing

  Polaroid™ Part-# 2ATL462849 ALP (Polaroid)
                   2ATL462849 DLL (Dell)
  Dell™ Part-# D4487

  for Polaroid Pogo™ () / Dell Wasabi™ (PZ310)
  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  Copyright (C) by XA, V 2022. All rights reserved.
  *****************************************************************

  Connector:  __/ - - T CHG+ + + \___________

*/

//const jscad = require('@jscad/modeling')
const { circle, rectangle, cuboid, roundedCuboid } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { translate, rotate } = require('@jscad/modeling').transforms
const { extrudeLinear } = require('@jscad/modeling').extrusions


const getParameterDefinitions = () => {
  return [
    { name: 'GROUP1', type: 'group', caption: 'Box dimensions:' },
    // Tray
    { name: 'dxTray', type: 'number', initial: 60, min: 1, caption: 'Box length:' },
    { name: 'dyTray', type: 'number', initial: 30, min: 1, caption: 'Box width:' },
    { name: 'dzTray', type: 'number', initial: 7, min: 1, caption: 'Box height:' },
    // Top
    { name: 'dzTop', type: 'number', initial: 3, min: 1, step: .1, caption: 'Top height:' },

    { name: 'GROUP2', type: 'group', caption: 'Advanced dimensions:' },
    { name: 'radCorners', type: 'number', initial: 0.4, min: 0, step: .01, caption: 'Corner/edge radius:' },
    { name: 'wdLatch', type: 'number', initial: 1, min: 0, step: .1, caption: 'Latch width:' },

    { name: 'thWall', type: 'number', initial: 1, min: 0, step: .01, caption: 'Wall thickness:' },
    { name: 'thWallThin', type: 'number', initial: .5, min: 0, step: .01, caption: 'Wall thickness (thin):' },
  ]
}

const constParameterDefinitions = {
  // Connector
  dxConn: 3,
  dyConn: 11,
  yConn: 17,
  //
  thFlap: 1,
  dxFlap: 1,
  dyFlapA: 6.5,
  dyFlapB: 14,
}


/* ******** */


const $s2 = (opts) => {
  const t = Object.assign({ center: [0, 0], size: [2, 2] }, opts)
  return Object.assign(opts, { center: [t.size[0] * .5 - t.center[0], t.size[1] * .5 - t.center[1]] })
}

const $s = (opts) => {
  const t = Object.assign({ center: [0, 0, 0], size: [2, 2, 2] }, opts)
  return Object.assign(opts, { center: [t.size[0] * .5 - t.center[0], t.size[1] * .5 - t.center[1], t.size[2] * .5 - t.center[2]] })
}

/* ******** */

const tray_outer = (p, opts = {}) => {
  let { size, wdLatch, radius, noFlaps } = Object.assign({ size: [2, 2, 2], wdLatch: 0, radius: -1, noFlaps: false }, opts)

  const surplus = (radius <= 0) ? Math.max(size[2] / 4, 4) : radius * 2
  const overlap = 2 // overlap
  radius = (radius < 0) ? Math.ceil((size[0] + size[1] + size[2]) / 3) / 10 : radius
  let result =
    // exaggerate z height and cut off to correct size to counter rounded edges
    subtract(
      roundedCuboid($s({ size: [size[0], size[1], size[2] + wdLatch + surplus], roundRadius: radius })),
      translate([-overlap, -overlap, size[2]], cuboid($s({ size: [size[0] + 2 * overlap, size[1] + 2 * overlap, wdLatch + 1.5 * surplus] })))
    )
  if (wdLatch > 0) {
    // stack wdLatch high latch slice on top
    const wdVoid = p.thWall - p.thWallThin
    result = union(result,
      translate([wdVoid, wdVoid, size[2]],
        cuboid($s({ size: [size[0] - 2 * wdVoid, size[1] - 2 * wdVoid, wdLatch] })))
    )
  }
  if (!noFlaps) {
    // connector side flap
    result = union(result,
      translate([p.dxTray - overlap, 6, 0],
        union(
          cuboid($s({ size: [p.dxFlap + overlap, p.dyFlapA, p.thWallThin] })),
          translate([overlap + .5, 0, 0],
            cuboid($s({ size: [p.dxFlap - .5, p.dyFlapA, p.thFlap] })))
        )
      ),
      // bottom side flap
      translate([-p.dxFlap, 1, p.dzTray - Math.max(p.thWall, 1)],
        cuboid($s({ size: [p.dxFlap + Math.min(overlap, p.thWall), p.dyFlapB, p.thFlap] })))
    )
  }
  return result
}

const tray_inner = (p, opts = {}) => {
  let { size, wdLatch } = Object.assign({ size: [2, 2, 2], wdLatch: 0 }, opts)

  if (wdLatch >= 0) {
    // extend z by latch width
    return translate([p.thWall, p.thWall, p.thWall],
      cuboid($s({ size: [size[0] - 2 * p.thWall, size[1] - 2 * p.thWall, size[2] + wdLatch] }))
    )
  } else {
    // thicken by thWallThin from top down by latch width
    const wdVoid = p.thWall - p.thWallThin;
    return union(
      translate([p.thWall, p.thWall, p.thWall],
        cuboid($s({ size: [size[0] - 2 * p.thWall, size[1] - 2 * p.thWall, size[2] + (-wdLatch) / 2] }))),
      translate([wdVoid, wdVoid, size[2] - (-wdLatch)],
        cuboid($s({ size: [size[0] - 2 * wdVoid, size[1] - 2 * wdVoid, (-wdLatch)] })))
    )
  }
}

const seating_AAA = (p, opts = {}) => {
  let { size, radius } = Object.assign({ size: [2, 2, 2], radius: 5 }, opts)

  return translate([-p.thWall, 0, 0],
    rotate([Math.PI / 2, 0, Math.PI / 2],
      extrudeLinear({ height: p.thWall * 2 },
        subtract(
          translate([p.thWall, p.thWall], rectangle($s2({ size: [size[1] - p.thWall, size[2] - p.thWall] }))),
          //translate([radius+3, radius+2], circle({radius})),
          //translate([size.y-radius-3, radius+2], circle({radius})),
          translate([size[1] / 4, radius + 1], circle({ radius })),
          translate([size[1] / 4 * 3, radius + 1], circle({ radius }))
        )
      )
    )
  )
}


/* ******** */
/* ******** */


const main = (p) => {
  p = Object.assign(constParameterDefinitions, p)

  // tray
  const eltTray =
    union(
      subtract(
        tray_outer(p, { size: [p.dxTray, p.dyTray, p.dzTray], wdLatch: p.wdLatch, radius: p.radCorners }),
        tray_inner(p, { size: [p.dxTray, p.dyTray, p.dzTray], wdLatch: p.wdLatch }),
        // connector cutout
        translate([p.dxTray - p.dxConn, p.yConn, p.dzTray],
          cuboid($s({ size: [p.dxConn * 2, p.dyConn, p.dzTop * 2] }))
        )
      ),
      translate([p.dxTray / 3, 0, 0], seating_AAA(p, { size: [p.dxTray, p.dyTray, p.dzTray] })),
      translate([p.dxTray / 3 * 2, 0, 0], seating_AAA(p, { size: [p.dxTray, p.dyTray, p.dzTray] }))
    )

  // top
  yTop = p.dyTray + 15;
  const eltTop =
    translate([0, yTop, 0],
      // basic top
      union(
        subtract(
          tray_outer(p, { size: [p.dxTray, p.dyTray, p.dzTop], radius: p.radCorners, noFlaps: true }),
          tray_inner(p, { size: [p.dxTray, p.dyTray, p.dzTop], wdLatch: -p.wdLatch }),
          // connector cutout
          translate([p.dxTray - p.dxConn, p.dyTray - p.yConn - p.dyConn, 0], cuboid($s({ size: [p.dxConn * 2, p.dyConn, p.dzTop * 2] })))
        )
      )
    )

  return [eltTray, eltTop]
}

module.exports = { main, getParameterDefinitions }
