/******************************************************************
  Polaroid™ Pogo™ ZINK™ paper printer battery pack adapter/housing

  Polaroid™ Part-# 2ATL462849 ALP (Polaroid)
                   2ATL462849 DLL (Dell)
  Dell™ Part-# D4487

  for Polarid Pogo™ () / Dell Wasabi™ (PZ310)
  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  Copyright (C) by XA, V 2022. All rights reserved.
  *****************************************************************

  Connector:  __/ - - T CHG+ + + \___________

*/

// Tray
dxTray = 60;
dyTray = 30;
dzTray = 7;

// Top
dzTop = 3;

// Connector
dxConn = 3;
dyConn = 11;
yConn = 17;

//
radCorners = 0.4;
wdLatch = 1;

thWall = 1;
thWallThin = .5;
thFlap = 1;


/* ******** */

module rounded_cube(size, radius=-1, center=false) {
    assert(len(size) == 3, "size must be vector");
    if (radius == 0) {
        cube(size, center=center);
    } else {
        let (radius = (radius == -1)? ceil((size.x + size.y + size.z)/3)/10 : radius) {
            minkowski() {
                translate([radius, radius, radius]) cube(size - 2*[radius, radius, radius], center=center);
                sphere(radius);
            }
        }
    }
}

/* ******** */

module tray_outer (size, wdLatch=0, radius=-1, noFlaps=false) {
    assert(len(size) == 3, "size must be vector");
    plus = (radius <= 0)? max(size.z/4, 4): radius*2;
    ovr = 2; // overlap
    union () {
        // exagerate z heigt and cut off to correct size to counter rounded edges
        difference() {
            rounded_cube([size.x, size.y, size.z+wdLatch+plus], radius);
            translate([-ovr, -ovr, size.z]) cube([size.x+2*ovr, size.y+2*ovr, wdLatch+1.5*plus]);
        };
        if (wdLatch > 0) {
            // stack wdLatch high latch slice on top
            wdVoid = thWall-thWallThin;
            translate ([wdVoid, wdVoid, size.z])
                cube([size.x-2*wdVoid, size.y-2*wdVoid, wdLatch]);
        };
        if (!noFlaps) {
            /// flaps
            dxFlap = 1;
            dyFlapA = 6.5;
            dyFlapB = 14;
            // connector side flap
            translate([dxTray-ovr, 6, 0])
                union() {
                    cube([dxFlap+ovr, dyFlapA, thWallThin]);
                    translate([ovr+.5, 0, 0])
                        cube([dxFlap-.5, dyFlapA, thFlap]);
                };
            // bottom side flap
            translate([-dxFlap, 1, dzTray-max(thWall,1)]) {
                cube([dxFlap+min(ovr, thWall), dyFlapB, thFlap]);
            };
        };
    };
}

module tray_inner (size, wdLatch=0, thWall=thWall) {
    assert(len(size) == 3, "size must be vector");
    if (wdLatch >= 0) {
        // extend z by latch width
        translate([thWall, thWall, thWall])
            cube([size.x - 2*thWall, size.y - 2*thWall, size.z+wdLatch]);
    } else {
        // thicken by thWallThin from top down by latch width
        wdVoid = thWall-thWallThin;
        union () {
            translate([thWall, thWall, thWall])
                cube([size.x - 2*thWall, size.y - 2*thWall, size.z+(-wdLatch)/2]);
            translate([wdVoid, wdVoid, size.z-(-wdLatch)])
                cube([size.x - 2*wdVoid, size.y - 2*wdVoid, (-wdLatch)]);
        };
    }
}

module seating_AAA (size, thWall=thWall, radius=5) {
    assert(len(size) == 3, "size must be vector");
    translate([-thWall,0,0])
    rotate([90,0,90])
    linear_extrude(height=thWall*2) {
        difference() {
            translate([thWall,thWall]) square([size.y-thWall, size.z-thWall]);
            //translate([radius+3, radius+2]) circle(r=radius);
            //translate([size.y-radius-3, radius+2]) circle(r=radius);
            translate([size.y/4, radius+2]) circle(r=radius);
            translate([size.y/4*3, radius+2]) circle(r=radius);
        }
    }
}


/* ******** */
/* ******** */


// tray
union () {
    union() {
      difference() {
        tray_outer([dxTray, dyTray, dzTray], wdLatch=wdLatch, radius=radCorners, $fn=30);
        tray_inner([dxTray, dyTray, dzTray], wdLatch=wdLatch);
        // connector cutout
        translate([dxTray-dxConn, yConn, dzTray])
           cube([dxConn*2, dyConn, dzTop*2]);
      };
      translate([dxTray/3,0,0]) seating_AAA([dxTray, dyTray, dzTray], $fn=40);
      translate([dxTray/3*2,0,0]) seating_AAA([dxTray, dyTray, dzTray], $fn=40);
    };
};

// top
yTop = dyTray + 15;
translate([0, yTop, 0])
union () {
    // basic top
    union() {
      difference() {
        tray_outer([dxTray, dyTray, dzTop], radius=radCorners, noFlaps=true, $fn=30);
        tray_inner([dxTray, dyTray, dzTop], wdLatch=-wdLatch);
        // connector cutout
        translate([dxTray-dxConn, dyTray-yConn-dyConn, 0])
           cube([dxConn*2, dyConn, dzTop*2]);
      };
    };
};
