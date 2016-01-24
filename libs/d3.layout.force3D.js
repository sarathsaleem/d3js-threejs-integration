// https://github.com/ggeoffrey/d3.layout.force3D
(function(){

  if(!(d3 && d3.layout && d3.geom)){
    throw "force3D: Unable to inject d3.layout.force3D"
    + " into d3.js . Be sure to load D3js beforehand.";
  }

  var abs = Math.abs;

  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  function d3_geom_pointZ(d) {
    return d[2];
  }
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  //d3.functor = d3_functor;

  function d3_identity(d) {
    return d;
  }
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }

  d3.geom.octree = function(points, x1, y1, z1, x2, y2, z2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, z = d3_geom_pointZ, compat;
    if (compat = arguments.length) {
      x = d3_geom_octreeCompatX;
      y = d3_geom_octreeCompatY;
      z = d3_geom_octreeCompatZ;
      if (compat === 4) {
        y2 = y1;
        x2 = x1;
        z2 = z1;
        z1 = y1 = x1 = 0;
      }
      return octree(points);
    }
    function octree(data) {
      var d, i, n, fx = d3_functor(x), fy = d3_functor(y), fz = d3_functor(z), xs, ys, zs, x1_, y1_, z1_, x2_, y2_, z2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, z1_ = z1, x2_ = x2, y2_ = y2, z2_ = z2;
      } else {
        x2_ = y2_ = z2_ = -(x1_ = y1_ = z1_ = Infinity);
        xs = [], ys = [], zs = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.z < z1_) z1_ = d.z;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          if (d.z > z2_) z2_ = d.z;
          xs.push(d.x);
          ys.push(d.y);
          zs.push(d.z);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i), z_ = +fz(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (z_ < z1_) z1_ = z_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          if (z_ > z2_) z2_ = z_;
          xs.push(x_);
          ys.push(y_);
          zs.push(z_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_, dz = z2_ - z1_;
      if (dx >= dy && dx >= dz) {
        y2_ = y1_ + dx;
        z2_ = z1_ + dx;
      } else if (dy >= dz && dy >= dx) {
        x2_ = x1_ + dy;
        z2_ = z1_ + dy;
      } else {
        x2_ = x1_ + dz;
        y2_ = y1_ + dz;
      }
      function insert(n, d, x, y, z, x1, y1, z1, x2, y2, z2) {
        if (isNaN(x) || isNaN(y) || isNaN(z)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y, nz = n.z;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) + abs(nz - z) < .01) {
              insertChild(n, d, x, y, z, x1, y1, z1, x2, y2, z2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.z = n.point = null;
              insertChild(n, nPoint, nx, ny, nz, x1, y1, z1, x2, y2, z2);
              insertChild(n, d, x, y, z, x1, y1, z1, x2, y2, z2);
            }
          } else {
            n.x = x, n.y = y, n.z = z, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, z, x1, y1, z1, x2, y2, z2);
        }
      }
      function insertChild(n, d, x, y, z, x1, y1, z1, x2, y2, z2) {
        var xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, zm = (z1 + z2) * .5, right = x >= xm, below = y >= ym, deep = z >= zm, i = deep << 2 | below << 1 | right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_octreeNode());
        if (right) x1 = xm; else x2 = xm;
        if (below) y1 = ym; else y2 = ym;
        if (deep) z1 = zm; else z2 = zm;
        insert(n, d, x, y, z, x1, y1, z1, x2, y2, z2);
      }
      var root = d3_geom_octreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), +fz(d, i), x1_, y1_, z1_, x2_, y2_, z2_);
      };
      root.visit = function(f) {
        d3_geom_octreeVisit(f, root, x1_, y1_, z1_, x2_, y2_, z2_);
      };
      root.find = function(point) {
        return d3_geom_octreeFind(root, point[0], point[1], point[2], x1_, y1_, z1_, x2_, y2_, z2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], zs[i], x1_, y1_, z1_, x2_, y2_, z2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = zs = data = d = null;
      return root;
    }
    octree.x = function(_) {
      return arguments.length ? (x = _, octree) : x;
    };
    octree.y = function(_) {
      return arguments.length ? (y = _, octree) : y;
    };
    octree.z = function(_) {
      return arguments.length ? (z = _, octree) : z;
    };
    octree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1, z1 ], [ x2, y2, z2 ] ];
      if (_ == null) x1 = y1 = z1 = x2 = y2 = z2 = null; else x1 = +_[0][0], y1 = +_[0][1],
      z1 = +_[0][2], x2 = +_[1][0], y2 = +_[1][1], z2 = +_[1][2];
      return octree;
    };
    octree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1, z2 - z1 ];
      if (_ == null) x1 = y1 = z1 = x2 = y2 = z2 = null; else x1 = y1 = z1 = 0, x2 = +_[0],
      y2 = +_[1], z2 = +_[1];
      return octree;
    };
    return octree;
  };
  function d3_geom_octreeCompatX(d) {
    return d.x;
  }
  function d3_geom_octreeCompatY(d) {
    return d.y;
  }
  function d3_geom_octreeCompatZ(d) {
    return d.z;
  }
  function d3_geom_octreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null,
      z: null
    };
  }
  function d3_geom_octreeVisit(f, node, x1, y1, z1, x2, y2, z2) {
    if (!f(node, x1, y1, z1, x2, y2, z2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, sz = (z1 + z2) * .5, children = node.nodes;
      if (children[0]) d3_geom_octreeVisit(f, children[0], x1, y1, z1, sx, sy, sz);
      if (children[1]) d3_geom_octreeVisit(f, children[1], sx, y1, z1, x2, sy, sz);
      if (children[2]) d3_geom_octreeVisit(f, children[2], x1, sy, z1, sx, y2, sz);
      if (children[3]) d3_geom_octreeVisit(f, children[3], sx, sy, z1, x2, y2, sz);
      if (children[4]) d3_geom_octreeVisit(f, children[4], x1, y1, sz, sx, sy, z2);
      if (children[5]) d3_geom_octreeVisit(f, children[5], sx, y1, sz, x2, sy, z2);
      if (children[6]) d3_geom_octreeVisit(f, children[6], x1, sy, sz, sx, y2, z2);
      if (children[7]) d3_geom_octreeVisit(f, children[7], sx, sy, sz, x2, y2, z2);
    }
  }
  function d3_geom_octreeFind(root, x, y, z, x0, y0, z0, x3, y3, z3) {
    var minDistance2 = Infinity, closestPoint;
    (function find(node, x1, y1, z1, x2, y2, z2) {
      if (x1 > x3 || y1 > y3 || z1 > z3 || x2 < x0 || y2 < y0 || z2 < z0) return;
      if (point = node.point) {
        var point, dx = x - node.x, dy = y - node.y, dz = z - node.z, distance2 = dx * dx + dy * dy + dz * dz;
        if (distance2 < minDistance2) {
          var distance = Math.sqrt(minDistance2 = distance2);
          x0 = x - distance, y0 = y - distance, z0 = z - distance;
          x3 = x + distance, y3 = y + distance, z3 = z + distance;
          closestPoint = point;
        }
      }
      var children = node.nodes, xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, zm = (z1 + z2) * .5, right = x >= xm, below = y >= ym, deep = z >= zm;
      for (var i = deep << 2 | below << 1 | right, j = i + 8; i < j; ++i) {
        if (node = children[i & 7]) switch (i & 7) {
         case 0:
         find(node, x1, y1, z1, xm, ym, zm);
         break;

         case 1:
         find(node, xm, y1, z1, x2, ym, zm);
         break;

         case 2:
         find(node, x1, ym, z1, xm, y2, zm);
         break;

         case 3:
         find(node, xm, ym, z1, x2, y2, zm);
         break;

         case 4:
         find(node, x1, y1, zm, xm, ym, z2);
         break;

         case 5:
         find(node, xm, y1, zm, x2, ym, z2);
         break;

         case 6:
         find(node, x1, ym, zm, xm, y2, z2);
         break;

         case 7:
         find(node, xm, ym, zm, x2, y2, z2);
         break;
       }
     }
   })(root, x0, y0, z0, x3, y3, z3);
   return closestPoint;
 }

 var d3_layout_forceLinkDistance = 20,
 d3_layout_forceLinkStrength = 1,
 d3_layout_forceChargeDistance2 = Infinity;

 function d3_layout_force3dAccumulate(oct, alpha, charges) {
  var cx = 0, cy = 0, cz = 0;
  oct.charge = 0;
  if (!oct.leaf) {
    var nodes = oct.nodes, n = nodes.length, i = -1, c;
    while (++i < n) {
      c = nodes[i];
      if (c == null) continue;
      d3_layout_force3dAccumulate(c, alpha, charges);
      oct.charge += c.charge;
      cx += c.charge * c.cx;
      cy += c.charge * c.cy;
      cz += c.charge * c.cz;
    }
  }
  if (oct.point) {
    if (!oct.leaf) {
      oct.point.x += Math.random() - .5;
      oct.point.y += Math.random() - .5;
      oct.point.z += Math.random() - .5;
    }
    var k = alpha * charges[oct.point.index];
    oct.charge += oct.pointCharge = k;
    cx += k * oct.point.x;
    cy += k * oct.point.y;
    cz += k * oct.point.z;
  }
  oct.cx = cx / oct.charge;
  oct.cy = cy / oct.charge;
  oct.cz = cz / oct.charge;
}


d3.layout.force3D = function() {
  var force = {},
  event = d3.dispatch("start", "tick", "end"),
  size = [ 1, 1, 1 ],
  alpha,
  friction = .9,
  linkDistance = d3_layout_forceLinkDistance,
  linkStrength = d3_layout_forceLinkStrength,
  charge = -30,
  chargeDistance2 = d3_layout_forceChargeDistance2,
  gravity = .1,
  theta2 = .64,
  nodes = [],
  links = [],
  distances,
  strengths,
  charges;

  function repulse(node) {
    return function(oct, x1, _0, _1, x2) {
     if (oct.point !== node) {
       var dx = oct.cx - node.x,
       dy = oct.cy - node.y,
       dz = oct.cz - node.z,
       dw = x2 - x1,
       dn = dx * dx + dy * dy + dz * dz;

       if (dw * dw / theta2 < dn) {
         if (dn < chargeDistance2) {
           var k = oct.charge / dn;
           node.px -= dx * k;
           node.py -= dy * k;
           node.pz -= dz * k;
         }
         return true;
       }
       if (oct.point && dn && dn < chargeDistance2) {
         var k = oct.pointCharge / dn;
         node.px -= dx * k;
         node.py -= dy * k;
         node.pz -= dz * k;
       }
     }
     return !oct.charge;
   };
 }
 force.tick = function() {
  if ((alpha *= .99) < .005) {
   event.end({
     type: "end",
     alpha: alpha = 0
   });
   return true;
 }
 var n = nodes.length,
 m = links.length,
 q, i, o, s, t, l, k, x, y, z;

 for (i = 0; i < m; ++i) {
   o = links[i];
   s = o.source;
   t = o.target;
   x = t.x - s.x;
   y = t.y - s.y;
   z = t.z - s.z;

   if (l = x * x + y * y + z * z) {
     l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
     x *= l;
     y *= l;
     z *= l;
     t.x -= x * (k = s.weight / (t.weight + s.weight));
     t.y -= y * k;
     t.z -= z * k;
     s.x += x * (k = 1 - k);
     s.y += y * k;
     s.z += z * k;
   }
 }
 if (k = alpha * gravity) {
   x = size[0] / 2;
   y = size[1] / 2;
   z = size[2] / 2;
   i = -1;
   if (k) while (++i < n) {
     o = nodes[i];
     o.x += (x - o.x) * k;
     o.y += (y - o.y) * k;
     o.z += (z - o.z) * k;
   }
 }
 if (charge) {
   d3_layout_force3dAccumulate(q = d3.geom.octree(nodes), alpha, charges);
   i = -1;
   while (++i < n) {
     if (!(o = nodes[i]).fixed) {
       q.visit(repulse(o));
     }
   }
 }
 i = -1;
 while (++i < n) {
   o = nodes[i];
   if (o.fixed) {
     o.x = o.px;
     o.y = o.py;
     o.z = o.pz;
   } else {
     o.x -= (o.px - (o.px = o.x)) * friction;
     o.y -= (o.py - (o.py = o.y)) * friction;
     o.z -= (o.pz - (o.pz = o.z)) * friction;
   }
 }
 event.tick({
   type: "tick",
   alpha: alpha
 });
};

force.nodes = function(x) {
  if (!arguments.length) return nodes;
  nodes = x;
  return force;
};

force.links = function(x) {
  if (!arguments.length) return links;
  links = x;
  return force;
};

force.size = function(x) {
  if (!arguments.length) return size;
  size = x;
  return force;
};

force.linkDistance = function(x) {
  if (!arguments.length) return linkDistance;
  linkDistance = typeof x === "function" ? x : +x;
  return force;
};

force.distance = force.linkDistance;

force.linkStrength = function(x) {
  if (!arguments.length) return linkStrength;
  linkStrength = typeof x === "function" ? x : +x;
  return force;
};

force.friction = function(x) {
  if (!arguments.length) return friction;
  friction = +x;
  return force;
};

force.charge = function(x) {
  if (!arguments.length) return charge;
  charge = typeof x === "function" ? x : +x;
  return force;
};

force.chargeDistance = function(x) {
  if (!arguments.length)
   return Math.sqrt(chargeDistance2);
 chargeDistance2 = x * x;
 return force;
};

force.gravity = function(x) {
  if (!arguments.length)
   return gravity;
 gravity = +x;
 return force;
};

force.theta = function(x) {
  if (!arguments.length)
   return Math.sqrt(theta2);
 theta2 = x * x;
 return force;
};

force.alpha = function(x) {
  if (!arguments.length)
   return alpha;
 x = +x;
 if (alpha) {
   if (x > 0)
     alpha = x;
   else
     alpha = 0;
 } else if (x > 0) {
   event.start({
     type: "start",
     alpha: alpha = x
   });
   d3.timer(force.tick);
 }
 return force;
};

force.start = function() {
  var i,
  n = nodes.length,
  m = links.length,
  w = size[0],
  h = size[1],
  d = size[2],
  neighbors,
  o;
  for (i = 0; i < n; ++i) {
   (o = nodes[i]).index = i;
   o.weight = 0;
 }
 for (i = 0; i < m; ++i) {
   o = links[i];
   if (typeof o.source == "number")
     o.source = nodes[o.source];
   if (typeof o.target == "number")
     o.target = nodes[o.target];
   ++o.source.weight;
   ++o.target.weight;
 }
 for (i = 0; i < n; ++i) {
   o = nodes[i];
   if (isNaN(o.x)) o.x = position("x", w);
   if (isNaN(o.y)) o.y = position("y", h);
   if (isNaN(o.z)) o.z = position("z", d);
   if (isNaN(o.px)) o.px = o.x;
   if (isNaN(o.py)) o.py = o.y;
   if (isNaN(o.pz)) o.pz = o.z;
 }

 distances = [];
 if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i);
 else for (i = 0; i < m; ++i)  distances[i] = linkDistance;

 strengths = [];
 if (typeof linkStrength === "function")  for (i = 0; i < m; ++i)         strengths[i] = +linkStrength.call(this, links[i], i);
 else for (i = 0; i < m; ++i) strengths[i] = linkStrength;

 charges = []; if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i);
 else for (i = 0; i < n; ++i) charges[i] = charge;

 function position(dimension, size) {
   if (!neighbors) {
     neighbors = new Array(n);
     for (j = 0; j < n; ++j) {
       neighbors[j] = [];
     }
     for (j = 0; j < m; ++j) {
       var o = links[j];
       neighbors[o.source.index].push(o.target);
       neighbors[o.target.index].push(o.source);
     }
   }
   var candidates = neighbors[i],
   j = -1,
   l = candidates.length,
   x;
   while (++j < l)
     if (!isNaN(x = candidates[j][dimension]))
       return x;
     return Math.random() * size;
   }
   return force.resume();
 };
 force.resume = function() {
  return force.alpha(.1);
};
force.stop = function() {
  return force.alpha(0);
};

force.drag = function() {
  var drag;
  if (!drag){
    drag = d3.behavior.drag()
                      .origin(d3_identity)
                      .on("dragstart.force", d3_layout_forceDragstart)
                      .on("drag.force", dragmove)
                      .on("dragend.force", d3_layout_forceDragend);
  }
  if (!arguments.length) {return drag;}
  this.on("mouseover.force", d3_layout_forceMouseover)
      .on("mouseout.force", d3_layout_forceMouseout)
      .call(drag);
};
function dragmove(d) {
  d.px = d3.event.x, d.py = d3.event.y;
  force.resume();
}

return d3.rebind(force, event, "on");
};

})();
