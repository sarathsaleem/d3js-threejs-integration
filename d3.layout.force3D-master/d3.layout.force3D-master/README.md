##d3.layout.force3D with a proper third dimension

Import it to your project after d3.js and replace:
`d3.layout.force()` with `d3.layout.force3D()` into your code.

Original [API](https://github.com/mbostock/d3/wiki/Force-Layout) is unchanged **except for**:
 - `size()` that now takes an array of length 3 instead of 2. Default is now `.size([1, 1, 1])` .
 - `force.drag` **is not really supported** because of the third dimention. You have to implement it yourself with unprojection techniques. The current `minimal-dirty-example.html` demo drag only on the `x` and `y` axes and ignore the `z` axis.


## Demo

[cljs-gravity](https://github.com/ggeoffrey/cljs-gravity), implemented in [ClojureScript](http://clojure.org/) with d3.layout.force3D running in a distinct webworker.
 



### Example
You can find dirty but working [minimal code here](http://ggeoffrey.github.io/d3.layout.force3D/).


###Credits

Adapted from:
 - original D3.js code,
 - [@kalenedrael](https://github.com/kalenedrael)'s smart ideas and work.

I just extracted it, rewrote it, and exported it as a d3 plugin. So please give him the credits ;)
