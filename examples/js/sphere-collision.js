/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets: true, $, window, navigator , clearInterval , setInterval, d3, THREE, Stats , requestAnimationFrame*/

"use strict";

function sphereCollision(canvas) {

    var stats;
    var camera, scene, renderer;

    var mouse = new THREE.Vector2(),
        controls, force;
    var nodes, spheresNodes = [],
        root, raycaster = new THREE.Raycaster(),
        INTERSECTED;


    function rnd(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    //Extension of collition function from http://bl.ocks.org/mbostock/3231298

    function collide(node) {
        var r = node.radius + 16,
            nx1 = node.x - r,
            nx2 = node.x + r,
            ny1 = node.y - r,
            ny2 = node.y + r,
            nz1 = node.z - r,
            nz2 = node.z + r;
        return function (quad, x1, y1, z1, x2, y2, z2) {
            if (quad.point && (quad.point !== node)) {
                var x = node.x - quad.point.x,
                    y = node.y - quad.point.y,

                    z = node.z - quad.point.z,

                    l = Math.sqrt(x * x + y * y + z * z),

                    r = node.radius + quad.point.radius;

                if (l < r) {
                    l = (l - r) / l * 0.5;
                    node.x -= x *= l;
                    node.y -= y *= l;
                    node.z -= z *= l;


                    quad.point.x += x;
                    quad.point.y += y;
                    quad.point.z += z;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1 || z1 > nz2 || z2 < nz1;
        };
    }


    function getSpherePackPositions(canvas) {

        var containerEle = $(canvas);
        var SCREEN_WIDTH = containerEle.innerWidth();
        var SCREEN_HEIGHT = containerEle.innerHeight();

        nodes = d3.range(150).map(function () {
            return {
                radius: rnd(50, 100)
            };
        });
        root = nodes[0];
        root.radius = 0.1;
        root.fixed = true;

        force = d3.layout.force3D()
            .gravity(0.05)
            .charge(function (d, i) {
                return i ? 0 : -5000;
            })
            .nodes(nodes)
            .size([SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 1]);

        force.start();

        return nodes;
    }


    function addSpheres() {

        var nodes = getSpherePackPositions(canvas);

        for (var i = 0; i < nodes.length; i++) {
            var geo = new THREE.SphereGeometry(nodes[i].radius, 20, 20);
            var sphere = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
                color: Math.random() * 0xffffff
            }));
            var vec = new THREE.Vector3(nodes[i].x, nodes[i].y, nodes[i].z);
            sphere.position.add(vec);
            spheresNodes.push(sphere);
            scene.add(sphere);
        }

    }

    function updateSpheres() {
        var q = d3.geom.octree(nodes);
        for (var i = 1; i < nodes.length; ++i) {
            q.visit(collide(nodes[i]));
            spheresNodes[i].position.x = nodes[i].x;
            spheresNodes[i].position.y = nodes[i].y;
            spheresNodes[i].position.z = nodes[i].z;
        }
    }



    function setupScreen(canvas) {

        var containerEle = $(canvas);

        //set camera
        camera = new THREE.PerspectiveCamera(45, containerEle.innerWidth() / containerEle.innerHeight(), 1, 10000);
        camera.position.set(0, 0, 2000);

        // RENDERER

        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer.setSize(containerEle.innerWidth(), containerEle.innerHeight());
        renderer.domElement.style.position = 'absolute';
        containerEle.append(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0xffffff, 1000, 10000);
        // LIGHTS

        var directionalLight = new THREE.DirectionalLight("#14bc22", 1.475);
        directionalLight.position.set(100, 100, -100);
        scene.add(directionalLight);

        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.25);
        hemiLight.color.setHSL(0.6, 1, 0.75);
        hemiLight.groundColor.setHSL(0.1, 0.8, 0.7);
        hemiLight.position.y = 500;
        scene.add(hemiLight);

        var axes = new THREE.AxisHelper(1000);
        // scene.add(axes);

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        containerEle.append(stats.domElement);

        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {
            camera.aspect = containerEle.innerWidth() / containerEle.innerHeight();
            camera.updateProjectionMatrix();
            renderer.setSize(containerEle.innerWidth(), containerEle.innerHeight());

        }

        function onDocumentMouseMove(event) {
            event.preventDefault();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        }
        document.addEventListener('mousemove', onDocumentMouseMove, false);



        addSpheres();


    }



    function animate() {
        requestAnimationFrame(animate);
        render();
        stats.update();
    }

    function render() {

        updateSpheres();

        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(spheresNodes);
        if (intersects.length > 0) {
            INTERSECTED = intersects[0].object;
            root.px = INTERSECTED.position.x;
            root.py = INTERSECTED.position.y;
            root.pz = INTERSECTED.position.z;
            force.resume();
        } else {
            INTERSECTED = null;
        }

        renderer.render(scene, camera);


    }


    setupScreen(canvas);
    animate();
}


$(function () {
    sphereCollision($('#stage'));
});
