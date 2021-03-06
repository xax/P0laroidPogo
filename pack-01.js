/******************************************************************
  Polaroid™ Pogo™ ZINK™ paper printer battery pack adapter/housing

  Polaroid™ Part-# 2ATL462849 ALP (Polaroid)
                   2ATL462849 DLL (Dell)
  Dell™ Part-# D4487

  for Polaroid Pogo™ (CZA-10011B) / Dell Wasabi™ (PZ310)
  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  Copyright (C) by XA, V 2022. All rights reserved.
  *****************************************************************

  Connector:  __/ - - T CHG+ + + \___________

  PCB view (from top / non-cell side):

    +/C2+              C2-
    ––––               –––+
    IC IC  O  - - T C + + |
     O      O         O   |
    ––––               –––+
    -/C1-              C1+

*/

//const jscad = require('@jscad/modeling')
const { circle, rectangle, cuboid, roundedCuboid } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { translate, rotate } = require('@jscad/modeling').transforms
const { extrudeLinear } = require('@jscad/modeling').extrusions


const getParameterDefinitions = () => {
  return [
    { name: 'fShowConnector', type: 'checkbox', checked: true, initial: true, caption: 'Show Connector' },
    { name: 'fShowAAA', type: 'checkbox', checked: true, initial: true, caption: 'Show AAA seatings' },
    //
    { name: 'GROUP1', type: 'group', initial: 'closed', caption: 'Box dimensions:' },
    // Tray
    { name: 'dxTray', type: 'number', initial: 60, min: 1, caption: 'Box length:' },
    { name: 'dyTray', type: 'number', initial: 30, min: 1, caption: 'Box width:' },
    { name: 'dzTray', type: 'number', initial: 7, min: 1, caption: 'Box height:' },
    // Top
    { name: 'dzTop', type: 'number', initial: 3, min: 1, step: .1, caption: 'Top height:' },
    // oversized battery housing
    { name: 'dzOversize', type: 'number', initial: 0, min: 0, max: 2, step: .1, caption: 'Oversize pack height by:' },

    { name: 'GROUP2', type: 'group', initial: 'closed', caption: 'Advanced dimensions:' },
    { name: 'radCorners', type: 'number', initial: 0.4, min: 0, step: .01, caption: 'Corner/edge radius:' },
    { name: 'wdLatch', type: 'number', initial: 1, min: 0, step: .1, caption: 'Latch width:' },

    { name: 'thWall', type: 'number', initial: 1, min: 0, step: .01, caption: 'Wall thickness:' },
    { name: 'thWallThin', type: 'number', initial: .5, min: 0, step: .01, caption: 'Wall thickness (thin):' },
  ]
}

const constParameterDefinitions = {
  // Connector
  dxConn: 4.5,
  dyConn: 11,
  dzConn: 4,
  noxConn: 2,
  yConn: 17,
  //
  thFlap: 1,
  dxFlap: 1,
  dyFlapConn: 11, // should be == dyConn !
  yFlapLift: 16,
  dyFlapLift: 8,
}

/* ******************
    Helper Functions
   ****************** */

/** Shift left-front-lower 3d coordinates into center-center-center coordinates,
 *  respectively.
 *  This facilitates using OpenSCAD workflow regarding `cube(…, centered=false)`
 *  and similar constructs from JSCAD and `cuboid(…)` et.al.
 */
const $s = (opts) => {
  // provide reasonable default options in temporary `t`
  const t = Object.assign({ center: [0, 0, 0], size: [2, 2, 2] }, opts)
  // shift by "half" of bounding box
  return Object.assign(opts, { center: [t.size[0] * .5 - t.center[0], t.size[1] * .5 - t.center[1], t.size[2] * .5 - t.center[2]] })
}

/** Shift left-front/lower 2d coordinates into center-center coordinates, respectively.
 *  This facilitates using OpenSCAD workflow regarding `cube(…, centered=false)`
 *  and similar constructs from JSCAD and `cuboid(…)` et.al.
 */
const $s2 = (opts) => {
  // provide reasonable default options in temporary `t`
  const t = Object.assign({ center: [0, 0], size: [2, 2] }, opts)
  // shift by "half" of bounding box
  return Object.assign(opts, { center: [t.size[0] * .5 - t.center[0], t.size[1] * .5 - t.center[1]] })
}

/* ********************
    Construction Parts
   ******************** */


const tray_outer = (p, opts = {}) => {
  let { size, wdLatch, radius, noFlaps } = Object.assign({ size: [2, 2, 2], wdLatch: 0, radius: -1, noFlaps: false }, opts)

  const surplus = (radius <= 0) ? Math.max(size[2] / 4, 4) : radius * 2
  const overlap = Math.min(2, p.thWall) // overlap
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
      // connector flap
      translate([p.dxTray - overlap, p.yConn, p.dzTray - p.thFlap],
        cuboid($s({ size: [p.dxFlap + overlap, p.dyFlapConn, p.thFlap] }))
      ),
      // bottom/top side flap
      translate([-p.dxFlap, p.yFlapLift, 0],
        cuboid($s({ size: [p.dxFlap + Math.min(overlap, p.thWall), p.dyFlapLift, p.thFlap] })))
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
          translate([size[1] / 4, radius + p.thWall], circle({ radius })),
          translate([size[1] / 4 * 3, radius + p.thWall], circle({ radius }))
        )
      )
    )
  )
}


const connector = (p) => {
  return translate([p.dxTray - p.noxConn, p.yConn, p.dzTray],
    subtract(
      cuboid($s({ size: [p.dxConn, p.dyConn, p.dzConn] })),
      union(
        translate([p.dxConn-1, .5, 0],
          union(
            translate([0, 1, 0], cuboid($s({ size: [1, .5, p.dzConn] }))),
            translate([0, 2.5, 0], cuboid($s({ size: [1, .5, p.dzConn] }))),
            translate([0, 4, 0], cuboid($s({ size: [1, .5, p.dzConn] }))),
            translate([0, 5.5, 0], cuboid($s({ size: [1, .5, p.dzConn] }))),
            translate([0, 7, 0], cuboid($s({ size: [1, .5, p.dzConn] }))),
            translate([0, 8.5, 0], cuboid($s({ size: [1, .5, p.dzConn] })))
          )
        ),
        translate([0, .5, p.dzConn-1],
          translate([0, 1, 0], cuboid($s({ size: [p.dxConn, .5, 1] }))),
          translate([0, 2.5, 0], cuboid($s({ size: [p.dxConn, .5, 1] }))),
          translate([0, 4, 0], cuboid($s({ size: [p.dxConn, .5, 1] }))),
          translate([0, 5.5, 0], cuboid($s({ size: [p.dxConn, .5, 1] }))),
          translate([0, 7, 0], cuboid($s({ size: [p.dxConn, .5, 1] }))),
          translate([0, 8.5, 0], cuboid($s({ size: [p.dxConn, .5, 1] })))
        )
      )
    )
  )
}


const main = (p) => {
  p = Object.assign(constParameterDefinitions, p)

  let result = []

  // tray
  result.push(
    subtract(
      tray_outer(p, { size: [p.dxTray, p.dyTray, p.dzTray], wdLatch: p.wdLatch, radius: p.radCorners }),
      tray_inner(p, { size: [p.dxTray, p.dyTray, p.dzTray], wdLatch: p.wdLatch }),
      // connector cutout
      translate([p.dxTray - p.dxConn, p.yConn, p.dzTray],
        cuboid($s({ size: [p.dxConn * 2, p.dyConn, p.dzTop * 2] }))
      )
    ),
  )

  // AAA holders
  if (p.fShowAAA) {
    result.push(
      translate([p.dxTray / 3, 0, 0], seating_AAA(p, { size: [p.dxTray, p.dyTray, p.dzTray] })),
      translate([p.dxTray / 3 * 2, 0, 0], seating_AAA(p, { size: [p.dxTray, p.dyTray, p.dzTray] }))
    )
  }

  // top
  yTop = p.dyTray + 15;
  result.push(
    translate([0, yTop, 0],
      // basic top
      union(
        subtract(
          tray_outer(p, { size: [p.dxTray, p.dyTray, p.dzTop + p.dzOversize], radius: p.radCorners, noFlaps: true }),
          tray_inner(p, { size: [p.dxTray, p.dyTray, p.dzTop + p.dzOversize], wdLatch: -p.wdLatch }),
          // connector cutout
          translate([p.dxTray - p.noxConn, p.dyTray - p.yConn - p.dyConn, 0], cuboid($s({ size: [p.dxConn, p.dyConn, p.dzTop * 3] })))
        )
      )
    )
  )

  if (p.fShowConnector) {
    result.push(
      connector(p)
    )
  }

  return result
}

module.exports = { main, getParameterDefinitions }
